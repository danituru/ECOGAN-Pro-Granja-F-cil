"use server";

import { revalidatePath } from "next/cache";
import { campanaDelUsuario } from "@/lib/area";
import { avisarOperador, enlaceWhatsApp } from "@/lib/email";
import { supabaseSistema, supabaseUsuario } from "@/lib/supabase/server";
import type { Datos } from "@/domain/catalogo/tipos";

type Resultado = { ok: true } | { ok: false; error: string };

export async function pedirAyuda(campanaId: string, telefono: string, mensaje: string): Promise<Resultado> {
  const c = await campanaDelUsuario(campanaId);
  if (!c) return { ok: false, error: "No encontrada" };
  const tel = telefono.replace(/[\s.-]/g, "") || c.titular.telefono;
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("solicitudes_ayuda").insert({ titular_id: c.titular.id, campana_id: c.id, motivo: "autorizacion", telefono: tel, mensaje: mensaje.slice(0, 1000) || null });
  if (error) return { ok: false, error: "No hemos podido enviar tu petición. Llámanos." };
  await avisarOperador(
    `🆘 Ayuda con la autorización: ${c.titular.nombre}`,
    `${c.titular.nombre} (${c.granja.rega}, ${c.granja.comunidad}) necesita ayuda para autorizarte en ECOGAN.\nTeléfono: ${tel}\nMensaje: ${mensaje || "—"}\n\nWhatsApp: ${enlaceWhatsApp(tel, `Hola ${c.titular.nombre}, soy Daniel de GranjaFácil. Te llamo para ayudarte con la autorización en ECOGAN.`)}`,
  ).catch((e) => console.error(e));
  return { ok: true };
}

export async function avisarAutorizado(campanaId: string): Promise<Resultado> {
  const c = await campanaDelUsuario(campanaId);
  if (!c) return { ok: false, error: "No encontrada" };
  const supabase = await supabaseUsuario();
  const { error } = await supabase.rpc("avisar_autorizacion", { p_campana: campanaId });
  if (error) return { ok: false, error: "No hemos podido guardar el aviso." };
  await avisarOperador(
    `✅ Dice que ya te ha autorizado: ${c.titular.nombre}`,
    `${c.titular.nombre} (${c.granja.rega}, ${c.granja.comunidad}) dice que ya te ha dado de alta como autorizado en ECOGAN. Compruébalo y márcalo en el panel.`,
  ).catch((e) => console.error(e));
  revalidatePath("/mi-area");
  return { ok: true };
}

/**
 * Registra el documento de autorización firmado que el navegador ya ha subido a la carpeta
 * privada del titular (el almacenamiento solo deja escribir en la carpeta propia).
 */
export async function registrarAutorizacion(campanaId: string, ruta: string, nombre: string, mime: string): Promise<Resultado> {
  const c = await campanaDelUsuario(campanaId);
  if (!c) return { ok: false, error: "No encontrada" };
  if (!ruta.startsWith(`${c.titular.id}/${c.id}/`)) return { ok: false, error: "Ruta no válida" };
  const { data: existe } = await supabaseSistema().storage.from("documentos").list(`${c.titular.id}/${c.id}`, { search: ruta.split("/").pop() });
  if (!existe?.length) return { ok: false, error: "No encontramos el archivo subido. Inténtalo otra vez." };
  const supabase = await supabaseUsuario();
  await supabase.from("documentos").insert({ titular_id: c.titular.id, campana_id: c.id, tipo: "autorizacion_ccaa", ruta_storage: ruta, nombre: nombre.slice(0, 200), mime });
  await supabase.rpc("avisar_autorizacion", { p_campana: campanaId });
  await avisarOperador(
    `📄 Autorización firmada recibida: ${c.titular.nombre}`,
    `${c.titular.nombre} (${c.granja.rega}, ${c.granja.comunidad}) ha subido el documento de autorización firmado. Revísalo en el panel y envíalo a la comunidad autónoma (Aragón: ecogan@aragon.es).`,
  ).catch((e) => console.error(e));
  revalidatePath("/mi-area");
  return { ok: true };
}

/** Guardado automático del formulario. RLS + trigger: solo sus datos y solo mientras se recogen. */
export async function guardarDatos(campanaId: string, datos: Datos): Promise<Resultado> {
  const supabase = await supabaseUsuario();
  const { error, count } = await supabase.from("campanas").update({ datos }, { count: "exact" }).eq("id", campanaId);
  if (error || count === 0) return { ok: false, error: "No se ha podido guardar. Revisa tu conexión." };
  return { ok: true };
}

export async function enviarDatos(campanaId: string): Promise<Resultado> {
  const c = await campanaDelUsuario(campanaId);
  if (!c) return { ok: false, error: "No encontrada" };
  const supabase = await supabaseUsuario();
  const { error } = await supabase.rpc("enviar_datos", { p_campana: campanaId, p_sin_actividad: c.datos.actividad === false });
  if (error) return { ok: false, error: "No se han podido enviar los datos." };
  await avisarOperador(
    `📥 Datos listos para revisar: ${c.titular.nombre}`,
    `${c.titular.nombre} (${c.granja.rega}) ha enviado sus datos de ECOGAN${c.datos.actividad === false ? " (SIN ACTIVIDAD)" : ""}. Revísalos en el panel.`,
  ).catch((e) => console.error(e));
  revalidatePath("/mi-area");
  return { ok: true };
}
