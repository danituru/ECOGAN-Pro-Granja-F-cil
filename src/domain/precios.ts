/**
 * Precios configurables desde el panel (tabla `configuracion`, clave "precios").
 * Los importes por defecto son provisionales hasta tener los presupuestos de la competencia.
 * Todos los importes en céntimos de euro, IVA incluido.
 */
import type { Especie } from "./especies";

export interface TramoPrecio {
  /** Plazas máximas del tramo (incluidas). null = sin límite. */
  hastaPlazas: number | null;
  importe: number;
}

export interface ConfigPrecios {
  porEspecie: Record<Especie, TramoPrecio[]>;
  /** Precio del atajo "sin actividad". */
  sinActividad: number;
  /** Recargo de urgencia (porcentaje) para altas a partir de esta fecha (MM-DD del año de campaña). */
  urgencia: { desde: string; porcentaje: number };
  /** Descuento de lanzamiento (porcentaje) para altas hasta esta fecha (YYYY-MM-DD). */
  lanzamiento: { hasta: string; porcentaje: number } | null;
  /** Descuento por volumen (porcentaje) a partir de N granjas del mismo titular. */
  volumen: { desdeGranjas: number; porcentaje: number } | null;
}

export const PRECIOS_POR_DEFECTO: ConfigPrecios = {
  porEspecie: {
    porcino: [
      { hastaPlazas: 2000, importe: 12000 },
      { hastaPlazas: null, importe: 18000 },
    ],
    aves_carne: [
      { hastaPlazas: 40000, importe: 12000 },
      { hastaPlazas: null, importe: 18000 },
    ],
    aves_puesta: [
      { hastaPlazas: 40000, importe: 12000 },
      { hastaPlazas: null, importe: 18000 },
    ],
    pavos: [
      { hastaPlazas: 10000, importe: 12000 },
      { hastaPlazas: null, importe: 18000 },
    ],
  },
  sinActividad: 4900,
  urgencia: { desde: "02-01", porcentaje: 30 },
  lanzamiento: { hasta: "2026-12-15", porcentaje: 20 },
  volumen: { desdeGranjas: 3, porcentaje: 10 },
};

export interface GranjaPrecio {
  especie: Especie;
  plazas: number;
  sinActividad?: boolean;
}

export interface LineaPrecio {
  concepto: string;
  importe: number;
}

export interface Presupuesto {
  lineas: LineaPrecio[];
  total: number;
}

export function precioBase(config: ConfigPrecios, g: GranjaPrecio): number {
  if (g.sinActividad) return config.sinActividad;
  const tramos = config.porEspecie[g.especie];
  const tramo = tramos.find((t) => t.hastaPlazas === null || g.plazas <= t.hastaPlazas);
  if (!tramo) throw new Error(`Sin tramo de precio para ${g.especie} con ${g.plazas} plazas`);
  return tramo.importe;
}

/**
 * Calcula el presupuesto de un alta. `fecha` es la fecha de contratación y `anioCampana` el año
 * en que se presenta (p. ej. 2027 para los datos de 2026).
 */
export function calcularPresupuesto(
  config: ConfigPrecios,
  granjas: GranjaPrecio[],
  fecha: Date,
  anioCampana: number,
): Presupuesto {
  const lineas: LineaPrecio[] = granjas.map((g, i) => ({
    concepto: g.sinActividad ? `Granja ${i + 1}: comunicación sin actividad` : `Granja ${i + 1}: declaración ECOGAN`,
    importe: precioBase(config, g),
  }));
  const subtotal = lineas.reduce((a, l) => a + l.importe, 0);

  const iso = fecha.toISOString().slice(0, 10);
  if (config.lanzamiento && iso <= config.lanzamiento.hasta) {
    lineas.push({ concepto: `Descuento de lanzamiento (${config.lanzamiento.porcentaje} %)`, importe: -pct(subtotal, config.lanzamiento.porcentaje) });
  }
  const conVolumen = granjas.filter((g) => !g.sinActividad).length;
  if (config.volumen && conVolumen >= config.volumen.desdeGranjas) {
    lineas.push({ concepto: `Descuento por volumen (${config.volumen.porcentaje} %)`, importe: -pct(subtotal, config.volumen.porcentaje) });
  }
  const inicioUrgencia = `${anioCampana}-${config.urgencia.desde}`;
  if (iso >= inicioUrgencia) {
    lineas.push({ concepto: `Recargo por urgencia (${config.urgencia.porcentaje} %)`, importe: pct(subtotal, config.urgencia.porcentaje) });
  }
  const total = Math.max(0, lineas.reduce((a, l) => a + l.importe, 0));
  return { lineas, total };
}

const pct = (importe: number, porcentaje: number) => Math.round((importe * porcentaje) / 100);

export const euros = (centimos: number) =>
  (centimos / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
