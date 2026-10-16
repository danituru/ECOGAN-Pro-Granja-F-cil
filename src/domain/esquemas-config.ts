/**
 * Validación de lo que el operador edita en el panel (Configuración). Se comprueba en el servidor
 * antes de guardar, para que un error al teclear no rompa precios, fechas ni la guía de autorización.
 */
import { z } from "zod";
import { ESPECIES } from "./especies";
import { esNifPersonaValido, esNifValido, normalizar } from "./identificadores";
import type { ListaOpciones } from "./catalogo/opciones";

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha con formato AAAA-MM-DD").refine((s) => !Number.isNaN(new Date(`${s}T12:00:00`).getTime()), "Fecha no válida");
const porcentaje = z.number().int("Número entero").min(0).max(100);
const centimos = z.number().int().min(0, "No puede ser negativo").max(10_000_000);
const texto = (max: number) => z.string().trim().max(max);

const tramos = z
  .array(z.object({ hastaPlazas: z.number().int().positive().nullable(), importe: centimos }))
  .min(1)
  .superRefine((ts, ctx) => {
    if (ts[ts.length - 1].hastaPlazas !== null) ctx.addIssue({ code: "custom", message: "El último tramo tiene que ser «sin límite»" });
    ts.slice(0, -1).forEach((t, i) => {
      if (t.hastaPlazas === null) ctx.addIssue({ code: "custom", message: "Solo el último tramo puede ser «sin límite»" });
      const anterior = ts[i - 1]?.hastaPlazas;
      if (t.hastaPlazas !== null && anterior != null && t.hastaPlazas <= anterior) ctx.addIssue({ code: "custom", message: "Los tramos tienen que ir de menor a mayor" });
    });
  });

export const esquemaPrecios = z.object({
  porEspecie: z.object(Object.fromEntries(ESPECIES.map((e) => [e, tramos])) as Record<(typeof ESPECIES)[number], typeof tramos>),
  sinActividad: centimos,
  urgencia: z.object({ desde: z.string().regex(/^\d{2}-\d{2}$/, "Formato MM-DD"), porcentaje }),
  lanzamiento: z.object({ hasta: fecha, porcentaje }).nullable(),
  volumen: z.object({ desdeGranjas: z.number().int().min(2), porcentaje }).nullable(),
});

export const esquemaCampana = z
  .object({ anioPresentacion: z.number().int().min(2026).max(2100), limiteGarantia: fecha, finPlazo: fecha })
  .refine((c) => c.limiteGarantia <= c.finPlazo, { message: "El límite de la garantía tiene que ser antes del fin de plazo", path: ["limiteGarantia"] })
  .refine((c) => c.finPlazo.startsWith(String(c.anioPresentacion)), { message: "El fin de plazo tiene que ser del año de presentación", path: ["finPlazo"] });

export const esquemaRecordatorios = z.object({ cadaDias: z.number().int().min(1).max(30) });

const textoIdiomas = z.object({ es: texto(600).min(5, "Escribe el texto"), ca: texto(600).optional() });
export const esquemaTextos = z.object({ mensajeObligacion: textoIdiomas, garantia: textoIdiomas, eslogan: textoIdiomas });

const nifOpcional = (valido: (v: string) => boolean, mensaje: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v ? normalizar(v) : ""))
    .refine((v) => !v || valido(v), mensaje);

export const esquemaOperador = z.object({
  nombre: texto(60).min(2, "Escribe el nombre"),
  apellido1: texto(60),
  apellido2: texto(60),
  nif: nifOpcional(esNifPersonaValido, "DNI o NIE no válido"),
  email: z.union([z.literal(""), z.email("Correo no válido")]),
  telefono: texto(20),
});

export const esquemaEmpresa = z.object({
  nombreComercial: texto(80).min(2, "Escribe el nombre comercial"),
  razonSocial: texto(160),
  nif: nifOpcional(esNifValido, "NIF o CIF no válido"),
  domicilio: texto(200),
  email: z.union([z.literal(""), z.email("Correo no válido")]),
  telefono: texto(20),
  registroMercantil: texto(200),
});

export const ESQUEMAS_CONFIG = {
  precios: esquemaPrecios,
  campana: esquemaCampana,
  recordatorios: esquemaRecordatorios,
  textos: esquemaTextos,
  operador: esquemaOperador,
  empresa: esquemaEmpresa,
} as const;
export type ClaveConfig = keyof typeof ESQUEMAS_CONFIG;

/**
 * Una lista de opciones editada. Las opciones que ya existían no se pueden quitar ni cambiar de
 * valor (hay datos guardados que las usan); sí se pueden corregir sus textos y añadir nuevas.
 */
export function validarLista(editada: ListaOpciones, original: ListaOpciones): string | null {
  if (editada.id !== original.id) return "La lista no coincide";
  const valores = editada.opciones.map((o) => o.valor);
  if (valores.some((v) => !/^[a-z0-9_]{1,60}$/.test(v))) return "Hay un valor interno no válido";
  if (new Set(valores).size !== valores.length) return "Hay dos opciones con el mismo valor";
  if (editada.opciones.some((o) => o.etiqueta.trim().length < 1 || o.etiqueta.length > 200)) return "Todas las opciones necesitan un texto (máximo 200 letras)";
  const faltan = original.opciones.filter((o) => !valores.includes(o.valor));
  if (faltan.length) return `No se pueden quitar opciones que ya existían: ${faltan.map((o) => o.etiqueta).join(", ")}`;
  return null;
}

export { valorDesdeTexto } from "./valor-opcion";
