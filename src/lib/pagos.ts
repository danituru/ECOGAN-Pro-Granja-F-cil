import "server-only";
import { supabaseSistema } from "./supabase/server";
import { stripe } from "./stripe";
import { hayStripe } from "./env";
import { leerConfiguracion } from "./config-servidor";
import { avisarOperador, enviarCorreo } from "./email";
import { crearEnlaceAcceso } from "./acceso";
import { euros } from "@/domain/precios";

interface DetalleGranja {
  granja_id: string;
  sin_actividad: boolean;
  importe: number;
}

/**
 * Confirma un pago y crea las campañas de sus granjas. Es idempotente: lo llaman tanto el
 * webhook de Stripe como la página de vuelta tras pagar, y solo el primero hace el trabajo.
 * `simulado` solo se usa en local sin Stripe configurado.
 */
export async function confirmarPago(sessionId: string, opciones: { simulado?: boolean; base?: string } = {}): Promise<{ ok: boolean; pagoId?: string }> {
  const db = supabaseSistema();
  const { data: pago } = await db.from("pagos").select("*").eq("stripe_session_id", sessionId).maybeSingle();
  if (!pago) return { ok: false };
  if (pago.estado === "pagado") return { ok: true, pagoId: pago.id };

  let urlFactura: string | null = null;
  if (!opciones.simulado) {
    if (!hayStripe()) return { ok: false };
    const sesion = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["invoice"] });
    if (sesion.payment_status !== "paid") return { ok: false };
    const factura = sesion.invoice;
    urlFactura = factura && typeof factura === "object" ? (factura.hosted_invoice_url ?? null) : null;
  }

  // Solo continúa quien consigue pasar el pago de "pendiente" a "pagado" (evita duplicados).
  const { data: actualizado } = await db
    .from("pagos")
    .update({ estado: "pagado", pagado_en: new Date().toISOString(), stripe_invoice_url: urlFactura })
    .eq("id", pago.id)
    .eq("estado", "pendiente")
    .select("id")
    .maybeSingle();
  if (!actualizado) return { ok: true, pagoId: pago.id };

  const config = await leerConfiguracion();
  const anioDatos = config.campana.anioPresentacion - 1;
  const detalle = (pago.granjas_detalle ?? []) as DetalleGranja[];
  const filas = detalle.map((g) => ({
    granja_id: g.granja_id,
    anio_datos: anioDatos,
    estado: "autorizacion_pendiente",
    sin_actividad: g.sin_actividad,
    importe_centimos: g.importe,
    pagado_en: new Date().toISOString(),
    stripe_session_id: sessionId,
  }));
  const { error } = await db.from("campanas").upsert(filas, { onConflict: "granja_id,anio_datos", ignoreDuplicates: true });
  if (error) console.error("Error creando campañas", error);
  await db.from("eventos").insert({ titular_id: pago.titular_id, accion: "pago_confirmado", detalle: { pago: pago.id, importe: pago.importe_centimos } });

  const { data: titular } = await db.from("titulares").select("nombre, email, telefono").eq("id", pago.titular_id).single();
  if (titular) {
    try {
      const enlace = await crearEnlaceAcceso(titular.email, "/mi-area", opciones.base);
      await enviarCorreo({
        para: titular.email,
        asunto: "Pago recibido: siguiente paso, autorizarnos en ECOGAN",
        texto: [
          `Hola ${titular.nombre}:`,
          "",
          `Hemos recibido tu pago de ${euros(pago.importe_centimos)}. ¡Gracias por confiar en GranjaFácil!`,
          urlFactura ? `Tu factura: ${urlFactura}` : "",
          "",
          "Siguiente paso: autorizarnos en ECOGAN para que podamos presentar tu declaración.",
          "En tu área tienes la guía paso a paso y un botón para pedir ayuda si te lías:",
          enlace,
          "",
          "Este enlace caduca en 1 hora. Después puedes entrar cuando quieras desde la web, en «Entrar», con tu correo.",
          "",
          "GranjaFácil · Un producto de KIVASA",
        ].filter((l) => l !== null).join("\n"),
      });
    } catch (e) {
      console.error("No se pudo enviar el correo de bienvenida", e);
    }
    await avisarOperador(
      `Nuevo cliente: ${titular.nombre} (${detalle.length} granja${detalle.length > 1 ? "s" : ""}, ${euros(pago.importe_centimos)})`,
      `Cliente: ${titular.nombre}\nCorreo: ${titular.email}\nTeléfono: ${titular.telefono}\nImporte: ${euros(pago.importe_centimos)}\n\nRevísalo en el panel: /admin`,
    ).catch((e) => console.error("No se pudo avisar al operador", e));
  }
  return { ok: true, pagoId: pago.id };
}
