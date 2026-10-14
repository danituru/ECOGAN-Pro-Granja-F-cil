/**
 * Formato numérico de ECOGAN (manuales feb-2026): coma decimal, sin separador de miles,
 * sin unidades. Plazas en entero, pesos con 1 decimal, piensos con 3, consumos con 2.
 */
export function formatoEcogan(valor: number | null | undefined, decimales = 0): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "";
  const factor = 10 ** decimales;
  const redondeado = Math.round(valor * factor) / factor;
  // toFixed usa punto y no agrupa miles: solo hay que cambiar el separador decimal.
  const texto = decimales > 0 ? redondeado.toFixed(decimales) : String(Math.round(redondeado));
  return texto.replace(".", ",");
}

/** Interpreta lo que escribe el ganadero ("1.234,5", "1234.5", "1 234") como número. */
export function parsearNumero(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, "");
  if (!t) return null;
  let normal: string;
  if (t.includes(",")) {
    // Formato español: el punto son miles y la coma el decimal.
    normal = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "1.234" o "12.345.678": puntos como separador de miles.
    normal = t.replace(/\./g, "");
  } else {
    normal = t;
  }
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}
