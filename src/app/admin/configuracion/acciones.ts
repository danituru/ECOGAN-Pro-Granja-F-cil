"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { leerListas } from "@/lib/config-servidor";
import { supabaseSistema, supabaseUsuario } from "@/lib/supabase/server";
import { ESQUEMAS_CONFIG, validarLista, type ClaveConfig } from "@/domain/esquemas-config";
import { LISTAS_POR_DEFECTO, type ListaOpciones } from "@/domain/catalogo/opciones";

export type ResultadoConfig = { ok: true } | { ok: false; error: string };

/** Las páginas públicas (portada, legal, contratar) leen la configuración: se regeneran al momento. */
function refrescar() {
  revalidatePath("/", "layout");
}

export async function guardarConfiguracion(clave: ClaveConfig, valor: unknown): Promise<ResultadoConfig> {
  const u = await exigirAdmin();
  const esquema = ESQUEMAS_CONFIG[clave];
  if (!esquema) return { ok: false, error: "Apartado desconocido" };
  const r = esquema.safeParse(valor);
  if (!r.success) {
    const i = r.error.issues[0];
    return { ok: false, error: `${i.path.length ? `${i.path.join(" › ")}: ` : ""}${i.message}` };
  }
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("configuracion").upsert({ clave, valor: r.data, actualizado_en: new Date().toISOString(), actualizado_por: u.id });
  if (error) return { ok: false, error: error.message };
  await supabaseSistema().from("eventos").insert({ actor: u.id, accion: "edita_configuracion", detalle: { clave } });
  refrescar();
  return { ok: true };
}

export async function guardarLista(lista: ListaOpciones): Promise<ResultadoConfig> {
  const u = await exigirAdmin();
  const actual = (await leerListas())[lista.id];
  if (!actual) return { ok: false, error: "Lista desconocida" };
  const limpia: ListaOpciones = {
    ...actual,
    verificada: !!lista.verificada,
    opciones: lista.opciones.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta.trim(), ...(o.ayuda?.trim() ? { ayuda: o.ayuda.trim() } : {}) })),
  };
  const error = validarLista(limpia, actual);
  if (error) return { ok: false, error };
  const supabase = await supabaseUsuario();
  const { error: e } = await supabase.from("opciones_listas").upsert({ id: lista.id, lista: limpia, actualizado_en: new Date().toISOString(), actualizado_por: u.id });
  if (e) return { ok: false, error: e.message };
  await supabaseSistema().from("eventos").insert({ actor: u.id, accion: "edita_lista", detalle: { lista: lista.id } });
  refrescar();
  return { ok: true };
}

/** Vuelve a la lista que viene en el código. Solo si no se añadieron opciones (podrían estar en uso). */
export async function restaurarLista(id: string): Promise<ResultadoConfig> {
  await exigirAdmin();
  const original = LISTAS_POR_DEFECTO.find((l) => l.id === id);
  const actual = (await leerListas())[id];
  if (!original || !actual) return { ok: false, error: "Lista desconocida" };
  const anadidas = actual.opciones.filter((o) => !original.opciones.some((x) => x.valor === o.valor));
  if (anadidas.length) return { ok: false, error: `No se puede restaurar: tiene opciones añadidas que pueden estar en uso (${anadidas.map((o) => o.etiqueta).join(", ")}).` };
  const supabase = await supabaseUsuario();
  const { error } = await supabase.from("opciones_listas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refrescar();
  return { ok: true };
}
