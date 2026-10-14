import "server-only";
import { esAdmin, supabaseUsuario, usuarioActual } from "./supabase/server";
import type { Datos } from "@/domain/catalogo/tipos";
import type { EstadoCampana } from "@/domain/estados";
import type { Especie } from "@/domain/especies";

/** Corta cualquier acción del panel si quien la pide no es operador. */
export async function exigirAdmin() {
  const u = await usuarioActual();
  if (!u || !(await esAdmin())) throw new Error("Solo para el operador");
  return u;
}

export interface CampanaAdmin {
  id: string;
  anio_datos: number;
  estado: EstadoCampana;
  datos: Datos;
  sin_actividad: boolean;
  via_autorizacion: string | null;
  autorizado_en: string | null;
  autorizacion_avisada_en: string | null;
  datos_enviados_en: string | null;
  revisado_en: string | null;
  comunicada_en: string | null;
  justificante_enviado_en: string | null;
  importe_centimos: number | null;
  pagado_en: string | null;
  nota_operador: string | null;
  mensaje_al_ganadero: string | null;
  actualizado_en: string;
  granja: { id: string; rega: string; nombre: string | null; especie: Especie; comunidad: string; municipio: string | null; capacidad: number | null; integrada: boolean; integradora: string | null };
  titular: { id: string; tipo: string; nombre: string; apellidos: string | null; nif: string; representante_nombre: string | null; representante_nif: string | null; email: string; telefono: string; domicilio: Record<string, string> };
}

const SELECT =
  "id, anio_datos, estado, datos, sin_actividad, via_autorizacion, autorizado_en, autorizacion_avisada_en, datos_enviados_en, revisado_en, comunicada_en, justificante_enviado_en, importe_centimos, pagado_en, nota_operador, mensaje_al_ganadero, actualizado_en, granja:granjas(id, rega, nombre, especie, comunidad, municipio, capacidad, integrada, integradora, titular:titulares(id, tipo, nombre, apellidos, nif, representante_nombre, representante_nif, email, telefono, domicilio))";

function aplanar(c: Record<string, unknown>): CampanaAdmin {
  const granja = c.granja as Record<string, unknown>;
  return { ...(c as unknown as CampanaAdmin), granja: granja as unknown as CampanaAdmin["granja"], titular: granja.titular as CampanaAdmin["titular"] };
}

export async function listarCampanas(): Promise<CampanaAdmin[]> {
  await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { data, error } = await supabase.from("campanas").select(SELECT).order("actualizado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(aplanar);
}

export async function leerCampana(id: string): Promise<CampanaAdmin | null> {
  await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { data } = await supabase.from("campanas").select(SELECT).eq("id", id).maybeSingle();
  return data ? aplanar(data) : null;
}

export const diasHasta = (fecha: string) => Math.ceil((new Date(`${fecha}T23:59:59`).getTime() - Date.now()) / 86_400_000);
