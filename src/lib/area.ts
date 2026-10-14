import "server-only";
import { redirect } from "next/navigation";
import { supabaseUsuario, usuarioActual } from "./supabase/server";
import type { Datos } from "@/domain/catalogo/tipos";
import type { EstadoCampana } from "@/domain/estados";
import type { Especie } from "@/domain/especies";

export interface CampanaCliente {
  id: string;
  anio_datos: number;
  estado: EstadoCampana;
  datos: Datos;
  sin_actividad: boolean;
  autorizacion_avisada_en: string | null;
  mensaje_al_ganadero: string | null;
  granja: { id: string; rega: string; nombre: string | null; especie: Especie; comunidad: string; municipio: string | null; capacidad: number | null };
  titular: { id: string; nombre: string; apellidos: string | null; nif: string; tipo: "fisica" | "juridica"; representante_nombre: string | null; representante_nif: string | null; email: string; telefono: string; domicilio: Record<string, string> };
}

/** Exige sesión; si no la hay, manda a "Entrar". */
export async function exigirUsuario() {
  const u = await usuarioActual();
  if (!u) redirect("/entrar");
  return u;
}

/**
 * Campañas visibles para el usuario. La consulta va con su sesión, así que Row Level Security
 * solo devuelve lo suyo: es imposible ver datos de otro cliente aunque se cambie el id en la URL.
 */
export async function titularesDelUsuario(): Promise<string[]> {
  const u = await exigirUsuario();
  const supabase = await supabaseUsuario();
  // Filtro explícito por usuario además de RLS: el operador (que por RLS ve todo) solo ve aquí lo suyo.
  const { data } = await supabase.from("titulares").select("id").eq("usuario_id", u.id);
  return (data ?? []).map((t) => t.id as string);
}

export async function campanasDelUsuario(): Promise<CampanaCliente[]> {
  const titulares = await titularesDelUsuario();
  if (!titulares.length) return [];
  const supabase = await supabaseUsuario();
  const { data, error } = await supabase
    .from("campanas")
    .select(
      "id, anio_datos, estado, datos, sin_actividad, autorizacion_avisada_en, mensaje_al_ganadero, granja:granjas!inner(id, rega, nombre, especie, comunidad, municipio, capacidad, titular_id, titular:titulares(id, nombre, apellidos, nif, tipo, representante_nombre, representante_nif, email, telefono, domicilio))",
    )
    .in("granja.titular_id", titulares)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((c: Record<string, unknown>) => {
    const granja = c.granja as Record<string, unknown>;
    return { ...(c as unknown as CampanaCliente), granja: granja as unknown as CampanaCliente["granja"], titular: granja.titular as CampanaCliente["titular"] };
  });
}

export async function campanaDelUsuario(id: string): Promise<CampanaCliente | null> {
  const todas = await campanasDelUsuario();
  return todas.find((c) => c.id === id) ?? null;
}
