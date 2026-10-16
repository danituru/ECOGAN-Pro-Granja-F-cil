/**
 * Resumen diario para el operador: lo que está esperando a que él haga algo.
 * Si no hay nada pendiente no se envía (para no acostumbrarse a ignorarlo).
 */
export interface ItemResumen {
  id: string;
  texto: string;
}

export interface DatosResumen {
  base: string;
  diasFinPlazo: number;
  diasGarantia: number;
  ayudas: ItemResumen[];
  porVerificar: ItemResumen[];
  porRevisar: ItemResumen[];
  paraEcogan: ItemResumen[];
  sinJustificante: ItemResumen[];
  reservasSinLlamar: number;
  recordatorios: { enviados: number; fallos: number };
}

export function componerResumen(d: DatosResumen): { asunto: string; texto: string } | null {
  const bloques: [string, ItemResumen[], string][] = [
    ["🆘 Piden ayuda (llámales)", d.ayudas, "/admin"],
    ["Dicen que ya te han autorizado: compruébalo en ECOGAN", d.porVerificar, "/admin/campana/"],
    ["Datos enviados: revísalos", d.porRevisar, "/admin/campana/"],
    ["Revisadas: preséntalas en ECOGAN", d.paraEcogan, "/admin/campana/"],
    ["Comunicadas: sube el justificante", d.sinJustificante, "/admin/campana/"],
  ];
  const tareas = bloques.reduce((n, [, xs]) => n + xs.length, 0) + d.reservasSinLlamar;
  if (tareas === 0 && d.recordatorios.fallos === 0) return null;

  const lineas: string[] = [];
  if (d.diasFinPlazo > 0) lineas.push(`Quedan ${d.diasFinPlazo} días para el fin de plazo de ECOGAN${d.diasGarantia > 0 ? ` y ${d.diasGarantia} para el límite de la garantía` : ""}.`, "");
  for (const [titulo, xs, ruta] of bloques) {
    if (!xs.length) continue;
    lineas.push(`${titulo} (${xs.length}):`);
    for (const x of xs.slice(0, 15)) lineas.push(`• ${x.texto}${ruta.endsWith("/") ? ` → ${d.base}${ruta}${x.id}` : ""}`);
    if (xs.length > 15) lineas.push(`• … y ${xs.length - 15} más`);
    lineas.push("");
  }
  if (d.reservasSinLlamar) lineas.push(`Reservas de la web sin llamar: ${d.reservasSinLlamar} → ${d.base}/admin/reservas`, "");
  if (d.recordatorios.enviados) lineas.push(`Hoy se han enviado ${d.recordatorios.enviados} recordatorios a ganaderos.`);
  if (d.recordatorios.fallos) lineas.push(`⚠ ${d.recordatorios.fallos} recordatorios no se han podido enviar. Revisa Resend.`);
  lineas.push("", `Panel: ${d.base}/admin`);

  return { asunto: `GranjaFácil: ${tareas} cosa${tareas === 1 ? "" : "s"} pendiente${tareas === 1 ? "" : "s"} hoy`, texto: lineas.join("\n") };
}
