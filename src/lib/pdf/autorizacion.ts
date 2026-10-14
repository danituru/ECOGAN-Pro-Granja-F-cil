import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface DatosAutorizacion {
  titular: { nombre: string; apellidos: string; nif: string; email: string; telefono: string; esEmpresa: boolean; representante?: string; representanteNif?: string };
  domicilio: { municipio: string; provincia: string; direccion: string };
  granjas: { rega: string; ubicacion: string }[];
  autorizado: { nombre: string; apellidos: string; nif: string; email: string; telefono: string };
  comunidad: string;
}

/**
 * Modelo de autorización del Sistema Informatizado ECOGAN (modelo del MAPA que publica el
 * Gobierno de Aragón para presentarlo en ecogan@aragon.es), ya rellenado. Mismo contenido y
 * apartados que el modelo oficial; se deja la firma en blanco.
 */
export async function pdfAutorizacion(d: DatosAutorizacion): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Modelo de autorización ECOGAN");
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  let pagina = pdf.addPage([595, 842]);
  let y = 800;
  const margen = 50;
  const ancho = 595 - margen * 2;

  const nueva = () => {
    pagina = pdf.addPage([595, 842]);
    y = 800;
  };
  const texto = (t: string, opciones: { fuente?: PDFFont; tam?: number; sangria?: number } = {}) => {
    const fuente = opciones.fuente ?? normal;
    const tam = opciones.tam ?? 10;
    for (const linea of partir(t, fuente, tam, ancho - (opciones.sangria ?? 0))) {
      if (y < 60) nueva();
      pagina.drawText(linea, { x: margen + (opciones.sangria ?? 0), y, size: tam, font: fuente, color: rgb(0.1, 0.1, 0.1) });
      y -= tam + 4;
    }
  };
  const campo = (etiqueta: string, valor: string) => texto(`${etiqueta}: ${valor || "____________________________"}`, { sangria: 10 });
  const hueco = (n = 8) => (y -= n);

  texto("MINISTERIO DE AGRICULTURA, PESCA Y ALIMENTACIÓN", { fuente: negrita, tam: 9 });
  texto("Dirección General de Producciones y Mercados Agrarios · Subdirección General de Medios de Producción Ganadera", { tam: 8 });
  hueco(10);
  texto("MODELO AUTORIZACIÓN — SISTEMA INFORMATIZADO ECOGAN", { fuente: negrita, tam: 14 });
  hueco(4);
  texto("SECCIÓN 1. AUTORIZACIÓN  [X] ALTA", { fuente: negrita, tam: 11 });
  hueco();

  texto("PERSONA TITULAR:", { fuente: negrita });
  campo(d.titular.esEmpresa ? "Nombre o razón social del titular" : "Nombre titular", d.titular.nombre);
  if (!d.titular.esEmpresa) campo("Apellidos titular", d.titular.apellidos);
  campo(d.titular.esEmpresa ? "CIF" : "DNI", d.titular.nif);
  if (d.titular.esEmpresa) {
    campo("Representante legal (nombre y apellidos)", d.titular.representante ?? "");
    campo("DNI del representante legal", d.titular.representanteNif ?? "");
  }
  campo("Correo de contacto", d.titular.email);
  campo("Teléfono de contacto", d.titular.telefono);
  for (const g of d.granjas) {
    campo("Código REGA granja", g.rega);
    campo("Ubicación granja (dirección y CCAA)", g.ubicacion);
  }
  hueco();
  texto("DOMICILIO FISCAL:", { fuente: negrita });
  campo("Nombre y apellidos", `${d.titular.nombre} ${d.titular.apellidos}`.trim());
  campo("Con domicilio fiscal en (país)", "España");
  campo("Municipio", d.domicilio.municipio);
  campo("Provincia", d.domicilio.provincia);
  campo("Vía/calle/plaza, número, portal, escalera, piso, puerta", d.domicilio.direccion);
  hueco();
  texto("OTORGA SU AUTORIZACIÓN A:", { fuente: negrita });
  campo("Nombre autorizado", d.autorizado.nombre);
  campo("Apellidos autorizado", d.autorizado.apellidos);
  campo("DNI", d.autorizado.nif);
  campo("Correo de contacto", d.autorizado.email);
  campo("Teléfono de contacto", d.autorizado.telefono);
  hueco();
  texto(
    `Para que actúe como AUTORIZADO, y pueda disponer de acceso a las granjas que se encuentran bajo mi titularidad en la siguiente COMUNIDAD AUTÓNOMA: ${d.comunidad.toUpperCase()}.`,
  );
  hueco(4);
  texto(
    "Se autorizará el acceso al usuario autorizado sobre todas las granjas presentes en dicha CCAA que se encuentren bajo su titularidad en el momento de la autorización, independientemente de la especie y tipo de producción. Permitiéndole con ello grabar, modificar y comunicar en mi nombre los datos de dichas granjas en base a lo dispuesto en el Real Decreto 988/2022, del 29 de noviembre por el que se regula el Registro General de Mejores Técnicas Disponibles en Explotaciones y el soporte para el cálculo, seguimiento y notificación de emisiones en ganaderías, y se modifican diversas normas en materia agraria, y en la respectiva normativa de ordenación ganadera.",
  );
  hueco(4);
  texto("Con la firma del presente escrito, la persona TITULAR de la explotación ganadera otorga su AUTORIZACIÓN, y la persona AUTORIZADA acepta la autorización conferida.");
  hueco(20);
  if (y < 160) nueva();
  firma(pagina, normal, negrita, margen, y, "TITULAR" + (d.titular.esEmpresa ? " (representante legal)" : ""));
  firma(pagina, normal, negrita, margen + ancho / 2 + 10, y, "AUTORIZADO");
  y -= 120;
  texto("Enviar firmado a: ecogan@aragon.es", { fuente: negrita, tam: 9 });
  texto("Documento preparado por GranjaFácil a partir del modelo de autorización del sistema ECOGAN.", { tam: 8 });
  return pdf.save();
}

function firma(p: PDFPage, normal: PDFFont, negrita: PDFFont, x: number, y: number, quien: string) {
  p.drawText(`${quien}:`, { x, y, size: 10, font: negrita });
  p.drawText("En ............................ a fecha: ..............", { x, y: y - 16, size: 9, font: normal });
  p.drawText("Firma:", { x, y: y - 34, size: 9, font: normal });
  p.drawRectangle({ x, y: y - 100, width: 220, height: 60, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
}

function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (fuente.widthOfTextAtSize(prueba, tam) > ancho && actual) {
      lineas.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}
