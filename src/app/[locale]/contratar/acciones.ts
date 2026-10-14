"use server";

import { headers } from "next/headers";
import { esquemaAlta, VERSION_TERMINOS, type EntradaAlta } from "@/domain/alta";
import { calcularPresupuesto, precioBase } from "@/domain/precios";
import { NOMBRE_ESPECIE } from "@/domain/especies";
import { obtenerOCrearUsuario } from "@/lib/acceso";
import { leerConfiguracion } from "@/lib/config-servidor";
import { env, hayStripe } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { supabaseSistema } from "@/lib/supabase/server";
import { urlBase } from "@/lib/url";
import { confirmarPago } from "@/lib/pagos";

export type ResultadoAlta = { ok: true; url: string } | { ok: false; errores: Record<string, string>; general?: string };

/**
 * Alta de cliente: valida, crea (o reutiliza) la cuenta, guarda titular, granjas y
 * consentimientos, y abre el pago en Stripe. Las campañas se crean cuando el pago se confirma.
 */
export async function iniciarAlta(entrada: EntradaAlta): Promise<ResultadoAlta> {
  const r = esquemaAlta.safeParse(entrada);
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[i.path.join(".")] ??= i.message;
    return { ok: false, errores };
  }
  if (!env.supabaseServiceKey) return { ok: false, errores: {}, general: "El alta aún no está disponible. Llámanos y te damos de alta nosotros." };
  if (!hayStripe() && process.env.NODE_ENV === "production") {
    return { ok: false, errores: {}, general: "Los pagos todavía no están activados. Llámanos y te damos de alta nosotros." };
  }

  const a = r.data;
  const db = supabaseSistema();
  const config = await leerConfiguracion();
  const h = await headers();
  const base = await urlBase();

  try {
    const usuario = await obtenerOCrearUsuario(a.email);

    // Un titular por NIF y cuenta: si ya existe (cliente que añade granjas), se actualiza.
    const { data: existente } = await db.from("titulares").select("id").eq("usuario_id", usuario.id).eq("nif", a.nif).maybeSingle();
    const datosTitular = {
      usuario_id: usuario.id,
      tipo: a.tipo,
      nombre: a.nombre,
      apellidos: a.tipo === "fisica" ? a.apellidos : null,
      razon_social: a.tipo === "juridica" ? a.nombre : null,
      nif: a.nif,
      representante_nombre: a.tipo === "juridica" ? a.representanteNombre : null,
      representante_nif: a.tipo === "juridica" ? a.representanteNif : null,
      email: a.email,
      telefono: a.telefono,
      domicilio: { direccion: a.direccion, municipio: a.municipio, provincia: a.provincia, codigo_postal: a.codigoPostal },
    };
    const titular = existente
      ? (await db.from("titulares").update(datosTitular).eq("id", existente.id).select("id").single()).data
      : (await db.from("titulares").insert(datosTitular).select("id").single()).data;
    if (!titular) throw new Error("No se pudo guardar el titular");

    const granjas = [];
    for (const g of a.granjas) {
      const fila = {
        titular_id: titular.id,
        rega: g.rega,
        nombre: g.nombre || null,
        comunidad: g.comunidad,
        municipio: g.municipio,
        especie: g.especie,
        capacidad: g.capacidad,
        integrada: g.integrada,
        integradora: g.integrada ? g.integradora || null : null,
      };
      const { data, error } = await db.from("granjas").upsert(fila, { onConflict: "titular_id,rega,especie" }).select("id").single();
      if (error || !data) throw new Error(`No se pudo guardar la granja ${g.rega}: ${error?.message}`);
      granjas.push({ ...g, id: data.id });
    }

    const ahora = new Date();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = h.get("user-agent");
    await db.from("consentimientos").insert(
      (["terminos", "rgpd", "encargo_tratamiento", "autorizacion_gestion"] as const).map((tipo) => ({
        titular_id: titular.id,
        tipo,
        version: VERSION_TERMINOS,
        ip,
        user_agent: ua,
      })),
    );

    const presupuesto = calcularPresupuesto(
      config.precios,
      granjas.map((g) => ({ especie: g.especie, plazas: g.capacidad, sinActividad: g.sinActividad })),
      ahora,
      config.campana.anioPresentacion,
    );
    const detalle = granjas.map((g) => ({
      granja_id: g.id,
      sin_actividad: g.sinActividad,
      importe: precioBase(config.precios, { especie: g.especie, plazas: g.capacidad, sinActividad: g.sinActividad }),
    }));

    const { data: pago, error: errPago } = await db
      .from("pagos")
      .insert({
        titular_id: titular.id,
        importe_centimos: presupuesto.total,
        lineas: presupuesto.lineas,
        granjas_detalle: detalle,
        email: a.email,
        usuario_nuevo: usuario.nuevo,
      })
      .select("id")
      .single();
    if (errPago || !pago) throw new Error(`No se pudo crear el pago: ${errPago?.message}`);

    if (!hayStripe()) {
      // Solo en local: pago simulado para poder probar el flujo completo.
      const sesionSimulada = `simulada_${pago.id}`;
      await db.from("pagos").update({ stripe_session_id: sesionSimulada }).eq("id", pago.id);
      await confirmarPago(sesionSimulada, { simulado: true, base });
      return { ok: true, url: `${base}/api/pago/exito?session_id=${sesionSimulada}` };
    }

    const descripcion = granjas
      .map((g) => `${g.rega} (${NOMBRE_ESPECIE[g.especie]}${g.sinActividad ? ", sin actividad" : ""})`)
      .join(", ");
    const sesion = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: a.email,
      locale: "es",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: presupuesto.total,
            product_data: {
              name: `Declaración ECOGAN ${config.campana.anioPresentacion} — ${granjas.length} granja${granjas.length > 1 ? "s" : ""}`,
              description: descripcion.slice(0, 500),
            },
          },
        },
      ],
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Preparación y presentación de la declaración ECOGAN (datos de ${config.campana.anioPresentacion - 1}).`,
          custom_fields: [{ name: a.tipo === "juridica" ? "CIF" : "DNI/NIE", value: a.nif }],
        },
      },
      metadata: { pago_id: pago.id, titular_id: titular.id },
      success_url: `${base}/api/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/contratar?cancelado=1`,
    });
    await db.from("pagos").update({ stripe_session_id: sesion.id }).eq("id", pago.id);
    if (!sesion.url) throw new Error("Stripe no devolvió la página de pago");
    return { ok: true, url: sesion.url };
  } catch (e) {
    console.error("Error en el alta", e);
    return { ok: false, errores: {}, general: "No hemos podido completar el alta. Inténtalo de nuevo o llámanos." };
  }
}
