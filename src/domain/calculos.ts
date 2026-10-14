/**
 * Cálculos de medias a partir de los lotes, tal como los describen los manuales ECOGAN feb-2026
 * (porcino §9.6 y §11.1, aves §11.1.5).
 */

export interface Lote {
  animalesEntran: number;
  /** Si no se sabe, se calcula con el % de bajas. */
  animalesSalen?: number;
  porcentajeBajas?: number;
  pesoEntrada?: number;
  pesoSalida?: number;
  /** Días que el lote ocupó el alojamiento (ciclo completo aunque cruce de año). */
  diasOcupacion?: number;
  /** Días que el alojamiento quedó completamente vacío después del lote. */
  diasVacio?: number;
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const definidos = (xs: (number | undefined)[]) => xs.filter((x): x is number => x !== undefined && x !== null && !Number.isNaN(x));

export function animalesSalenLote(l: Lote): number | null {
  if (l.animalesSalen !== undefined) return l.animalesSalen;
  if (l.porcentajeBajas !== undefined) return (l.animalesEntran * (100 - l.porcentajeBajas)) / 100;
  return null;
}

/** Nº animales del lote = (entran + salen) / 2. */
export function animalesMediosLote(l: Lote): number | null {
  const salen = animalesSalenLote(l);
  return salen === null ? null : (l.animalesEntran + salen) / 2;
}

/** Plazas ocupadas = media aritmética de los animales medios de cada lote, redondeada a entero. */
export function plazasOcupadas(lotes: Lote[]): number | null {
  const porLote = lotes.map(animalesMediosLote);
  if (porLote.some((x) => x === null)) return null;
  const m = media(porLote as number[]);
  return m === null ? null : Math.round(m);
}

export interface MediasLotes {
  plazasOcupadas: number | null;
  pesoInicio: number | null;
  pesoFin: number | null;
  periodoProductivo: number | null;
  periodoNoOcupacion: number | null;
  porcentajeMuertes: number | null;
}

/** Medias por ciclo (no por año) de todos los lotes del año de declaración. */
export function mediasLotes(lotes: Lote[]): MediasLotes {
  const redondear1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10);
  const entero = (x: number | null) => (x === null ? null : Math.round(x));
  const bajas = lotes.map((l) => {
    if (l.porcentajeBajas !== undefined) return l.porcentajeBajas;
    if (l.animalesSalen !== undefined && l.animalesEntran > 0) return ((l.animalesEntran - l.animalesSalen) / l.animalesEntran) * 100;
    return undefined;
  });
  return {
    plazasOcupadas: plazasOcupadas(lotes),
    pesoInicio: redondear1(media(definidos(lotes.map((l) => l.pesoEntrada)))),
    pesoFin: redondear1(media(definidos(lotes.map((l) => l.pesoSalida)))),
    periodoProductivo: entero(media(definidos(lotes.map((l) => l.diasOcupacion)))),
    periodoNoOcupacion: entero(media(definidos(lotes.map((l) => l.diasVacio)))),
    porcentajeMuertes: redondear1(media(definidos(bajas))),
  };
}

/** Ciclos al año = 365 / (periodo productivo + no ocupación). */
export function ciclosAnuales(periodoProductivo: number, periodoNoOcupacion: number): number {
  const ciclo = periodoProductivo + periodoNoOcupacion;
  return ciclo > 0 ? 365 / ciclo : 0;
}

/**
 * Aves: kg pienso/plaza/ciclo = consumo anual del pienso / plazas medias / ciclos al año.
 * Ejemplo del manual de aves de carne: 22.892,8 kg, 5.200 plazas, 41+24 días → 0,784.
 */
export function kgPiensoPlazaCiclo(
  consumoAnualKg: number,
  plazas: number,
  periodoProductivo: number,
  periodoNoOcupacion: number,
): number | null {
  const ciclos = ciclosAnuales(periodoProductivo, periodoNoOcupacion);
  if (!plazas || !ciclos) return null;
  return Math.round((consumoAnualKg / plazas / Number(ciclos.toFixed(3))) * 1000) / 1000;
}

/**
 * Porcino: kg pienso/plaza/día a partir del consumo de un pienso en el año.
 * kg/plaza/día = consumo anual / plazas / (días de suministro por ciclo × ciclos al año).
 * TODO: verificar normativa — el manual pide "consumo aproximado" sin fórmula; confirmar con la granja piloto.
 */
export function kgPiensoPlazaDia(
  consumoAnualKg: number,
  plazas: number,
  diasSuministro: number,
  periodoProductivo: number,
  periodoNoOcupacion: number,
): number | null {
  const ciclos = ciclosAnuales(periodoProductivo, periodoNoOcupacion);
  const diasAnio = diasSuministro * ciclos;
  if (!plazas || !diasAnio) return null;
  return Math.round((consumoAnualKg / plazas / diasAnio) * 1000) / 1000;
}
