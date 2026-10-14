"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin, leerCampana } from "@/lib/admin";
import { supabaseSistema, supabaseUsuario } from "@/lib/supabase/server";
import { enviarEnlaceAcceso } from "@/lib/acceso";
import { enviarCorreo } from "@/lib/email";
import { transicion, type Accion, type EstadoCampana } from "@/domain/estados";
import type { Datos } from "@/domain/catalogo/tipos";

type Resultado = { ok: true } | { ok: false; error: string };

/** Cambia el estado solo si la transición es válida y nadie lo ha cambiado mientras tanto. */
async function cambiarEstado(id: string, accion: Accion, extra: Record<string, unknown> = {}): Promise<Resultado & { campana?: Awaited<ReturnType<typeof leerCampana>> }> {
  const c = await leerCampana(id);
  if (!c) return { ok: false, error: "Campaña no encontrada" };
  let destino: EstadoCampana;
  try {
    destino = transicion(c.estado, accion);
  } catch {
    return { ok: false, error: `No se puede hacer esto con una campaña en estado "${c.estado}".` };
  }
  const supabase = await supabaseUsuario();
  const { data, error } = await supabase.from("campanas").update({ estado: destino, ...extra }).eq("id", id).eq("estado", c.estado).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: "No se pudo guardar (¿la ha cambiado otra persona?). Recarga la página." };
  revalidatePath(`/admin/campana/${id}`);
  revalidatePath("/admin");
  return { ok: true, campana: c };
}

export async function marcarAutorizado(id: string, via: "ecogan" | "ccaa"): Promise<Resultado> {
  const u = await exigirAdmin();
  const r = await cambiarEstado(id, "marcar_autorizado", { autorizado_en: new Date().toISOString(), autorizado_por: u.id, via_autorizacion: via });
  if (!r.ok || !r.campana) return r;
  const c = r.campana;
  await enviarEnlaceAcceso(
    c.titular.email,
    c.titular.nombre,
    `¡Ya estamos autorizados en ECOGAN para tu granja ${c.granja.nombre || c.granja.rega}! Ahora solo falta que contestes las preguntas sobre tu granja. Puedes hacerlo poco a poco desde el móvil.`,
    `/mi-area/datos/${c.id}`,
  ).catch((e) => console.error("Aviso de autorización no enviado", e));
  return { ok: true };
}

export async function devolverAlGanadero(id: string, mensaje: string): Promise<Resultado> {
  await exigirAdmin();
  if (mensaje.trim().length < 5) return { ok: false, error: "Escribe qué tiene que corregir el ganadero." };
  const r = await cambiarEstado(id, "devolver_a_ganadero", { mensaje_al_ganadero: mensaje.trim() });
  if (!r.ok || !r.campana) return r;
  const c = r.campana;
  await enviarEnlaceAcceso(
    c.titular.email,
    c.titular.nombre,
    `Hemos revisado los datos de tu granja ${c.granja.nombre || c.granja.rega} y necesitamos que corrijas o completes algo:\n\n«${mensaje.trim()}»`,
    `/mi-area/datos/${c.id}`,
  ).catch((e) => console.error("Aviso de corrección no enviado", e));
  return { ok: true };
}

export async function aprobarRevision(id: string): Promise<Resultado> {
  const u = await exigirAdmin();
  const r = await cambiarEstado(id, "aprobar_revision", { revisado_en: new Date().toISOString(), revisado_por: u.id, mensaje_al_ganadero: null });
  return r.ok ? { ok: true } : r;
}

export async function marcarComunicada(id: string): Promise<Resultado> {
  await exigirAdmin();
  const r = await cambiarEstado(id, "marcar_comunicada", { comunicada_en: new Date().toISOString() });
  return r.ok ? { ok: true } : r;
}

/** Sube el justificante de ECOGAN, lo guarda en la carpeta del cliente y se lo envía por correo. */
export async function enviarJustificante(id: string, form: FormData): Promise<Resultado> {
  const u = await exigirAdmin();
  const c = await leerCampana(id);
  if (!c) return { ok: false, error: "Campaña no encontrada" };
  if (c.estado !== "comunicada") return { ok: false, error: "Primero marca la campaña como comunicada en ECOGAN." };
  const archivo = form.get("justificante");
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Elige el PDF del justificante." };
  if (archivo.type !== "application/pdf") return { ok: false, error: "El justificante tiene que ser un PDF." };
  if (archivo.size > 4 * 1024 * 1024) return { ok: false, error: "El PDF pesa más de 4 MB." };

  const contenido = Buffer.from(await archivo.arrayBuffer());
  const ruta = `${c.titular.id}/${c.id}/justificante-ecogan-${c.anio_datos}-${Date.now()}.pdf`;
  const sistema = supabaseSistema();
  const { error: errSubida } = await sistema.storage.from("documentos").upload(ruta, contenido, { contentType: "application/pdf" });
  if (errSubida) return { ok: false, error: `No se pudo subir: ${errSubida.message}` };
  await sistema.from("documentos").insert({ titular_id: c.titular.id, campana_id: c.id, tipo: "justificante", ruta_storage: ruta, nombre: archivo.name, mime: "application/pdf", subido_por: u.id });

  try {
    await enviarCorreo({
      para: c.titular.email,
      asunto: `Justificante ECOGAN de tu granja ${c.granja.nombre || c.granja.rega}`,
      texto: [
        `Hola ${c.titular.nombre}:`,
        "",
        `Hemos presentado la declaración ECOGAN de tu granja ${c.granja.nombre || c.granja.rega} (${c.granja.rega}) con los datos de ${c.anio_datos}.`,
        "Te adjuntamos el justificante. También lo tienes siempre disponible en tu área de GranjaFácil.",
        "",
        "Guárdalo: la autoridad competente puede pedírtelo. El año que viene te avisaremos y solo te preguntaremos lo que haya cambiado.",
        "",
        "Gracias por confiar en nosotros.",
        "GranjaFácil · Un producto de KIVASA",
      ].join("\n"),
      adjuntos: [{ nombre: `justificante-ecogan-${c.granja.rega}.pdf`, contenido }],
    });
  } catch (e) {
    console.error("Justificante no enviado por correo", e);
    return { ok: false, error: "El justificante se ha guardado, pero no se ha podido enviar el correo. Revisa la configuración de Resend." };
  }
  const r = await cambiarEstado(id, "enviar_justificante", { justificante_enviado_en: new Date().toISOString() });
  return r.ok ? { ok: true } : r;
}

export async function guardarDatosAdmin(id: string, datos: Datos): Promise<Resultado> {
  const u = await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("campanas").update({ datos }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabaseSistema().from("eventos").insert({ actor: u.id, campana_id: id, accion: "edita_datos" });
  return { ok: true };
}

export async function guardarNota(id: string, nota: string): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("campanas").update({ nota_operador: nota.slice(0, 4000) || null }).eq("id", id);
  revalidatePath(`/admin/campana/${id}`);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function atenderAyuda(id: string): Promise<Resultado> {
  const u = await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("solicitudes_ayuda").update({ atendida_en: new Date().toISOString(), atendida_por: u.id }).eq("id", id);
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function marcarReservaContactada(id: string, nota: string): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("reservas").update({ contactado_en: new Date().toISOString(), nota_operador: nota || null }).eq("id", id);
  revalidatePath("/admin/reservas");
  return error ? { ok: false, error: error.message } : { ok: true };
}
