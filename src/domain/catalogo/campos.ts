/**
 * Catálogo de campos de ECOGAN (campaña 2026) como configuración.
 * Fuente: docs/catalogo-campos-ecogan.md (manuales oficiales del MAPA feb-2026 y Anexo I del RD 988/2022).
 *
 * El orden de este árbol es el orden del FORMULARIO del ganadero (granja → almacenamientos →
 * alojamiento a alojamiento → consumos). La ficha de presentación reordena por paso de ECOGAN.
 */
import type { Especie } from "../especies";
import { mediasLotes, type Lote } from "../calculos";
import type { Campo, Ctx, Grupo, Item, Nodo, Valor } from "./tipos";

// ---------- Ayudantes ----------
const es = (texto: string) => ({ es: texto });
const especie = (...e: Especie[]) => (c: Ctx) => e.includes(c.especie);
const y = (...conds: ((c: Ctx) => boolean)[]) => (c: Ctx) => conds.every((f) => f(c));
const marcado = (id: string) => (c: Ctx) => c.item[id] === true;
const igual = (id: string, ...valores: string[]) => (c: Ctx) => valores.includes(String(c.item[id]));
const huboActividad = (c: Ctx) => c.raiz.actividad !== false;
const tieneAai = (c: Ctx) => c.raiz.aai_dispone === true;

function campo(c: Campo): Campo {
  return { verificado: true, ...c };
}

// ---------- Condiciones de alojamiento ----------
const SISTEMAS_EXTENSIVOS = ["blanco_extensivo", "iberico_extensivo_cebo", "iberico_extensivo_tradicional"];
/** Porcino extensivo: ECOGAN solo pide categoría, plazas y el paso 4.1 (manual porcino §9.1.1). */
const porcinoExtensivo = (c: Ctx) => c.especie === "porcino" && SISTEMAS_EXTENSIVOS.includes(String(c.item.sistema_productivo));
const noExtensivo = (c: Ctx) => !porcinoExtensivo(c);
const porcinoLiquida = (c: Ctx) => c.especie === "porcino" && noExtensivo(c) && c.item.consistencia === "liquida";
const porcinoSolida = (c: Ctx) => c.especie === "porcino" && noExtensivo(c) && c.item.consistencia === "solida";
const avesCarneOPuesta = especie("aves_carne", "aves_puesta");
const ponedorasConMuda = (c: Ctx) => c.especie === "aves_puesta" && c.item.categoria === "gallinas_ponedoras" && c.item.muda === true;
const ponedorasSinMuda = (c: Ctx) => c.especie === "aves_puesta" && c.item.categoria === "gallinas_ponedoras" && c.item.muda !== true;
const cicloNormal = (c: Ctx) => !(c.especie === "aves_puesta" && c.item.categoria === "gallinas_ponedoras");

/** ¿Las deyecciones del alojamiento tienen fracción líquida (purín)? */
export const generaPurin = (c: Ctx) => porcinoLiquida(c) || (porcinoSolida(c) && c.item.separacion_sl === true);
/** ¿Tienen fracción sólida (estiércol)? En aves todo es estiércol sólido. */
export const generaEstiercol = (c: Ctx) =>
  noExtensivo(c) && (c.especie !== "porcino" || c.item.consistencia === "solida" || c.item.separacion_sl === true);

const unidadPeso = (c: Ctx) => (c.especie === "aves_puesta" ? "g" : "kg");
const listaCategoria = (c: Ctx) =>
  ({ porcino: "porcino_categoria", aves_carne: "aves_carne_tipo_animal", aves_puesta: "aves_puesta_tipo_animal", pavos: "pavos_categoria" })[c.especie];

// Sugerencias a partir de los lotes que introduce el ganadero.
const desdeLotes = (clave: keyof ReturnType<typeof mediasLotes>) => (c: Ctx): Valor => {
  const lotes = c.item.lotes as unknown as Lote[] | undefined;
  return lotes && lotes.length ? mediasLotes(lotes)[clave] : undefined;
};

// ---------- Destinos de las deyecciones (pasos 3 y 4.2/4.3) ----------
function destinosTrasAlmacenamiento(paso: 3, sufijo: "purin" | "estiercol"): Campo[] {
  const seccion = "Destino tras almacenamiento";
  const nombre = sufijo === "purin" ? "el purín" : "el estiércol";
  return [
    campo({ tipo: "numero", id: "destino_campo_pct", paso, seccion, etiqueta: "Directamente a campo o a terreno agrícola (%)", pregunta: es(`¿Qué porcentaje de ${nombre} de aquí va directamente al campo?`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
    campo({ tipo: "numero", id: "destino_gestor_pct", paso, seccion, etiqueta: "Entrega a gestor externo (%)", pregunta: es(`¿Qué porcentaje entregas a un gestor externo?`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
    campo({ tipo: "numero", id: "destino_otros_pct", paso, seccion, etiqueta: "Otros usos no agrarios (%)", pregunta: es(`¿Qué porcentaje va a otros usos no agrarios?`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
  ];
}

function destinosDesdeAlojamiento(tipo: "purin" | "estiercol"): Nodo[] {
  const paso = 4 as const;
  const seccion = tipo === "purin" ? "Destino de los purines desde el alojamiento" : "Destino de los estiércoles desde el alojamiento";
  const visible = tipo === "purin" ? generaPurin : generaEstiercol;
  const n = tipo === "purin" ? "el purín" : "el estiércol";
  const p = tipo === "purin" ? "purin" : "estiercol";
  const grupoAlm = tipo === "purin" ? "almacenamientos_purin" : "almacenamientos_estiercol";
  return [
    campo({ tipo: "numero", id: `${p}_almacenamiento_pct`, paso, seccion, visible, etiqueta: "Almacenamiento en granja (%)", pregunta: es(`Al sacar ${n} de esta nave, ¿qué porcentaje va a una balsa, depósito o estercolero de la granja?`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
    campo({ tipo: "numero", id: `${p}_gestor_pct`, paso, seccion, visible, etiqueta: "Entrega a gestor externo sin almacenamiento en granja (%)", pregunta: es(`¿Qué porcentaje entregas a un gestor sin guardarlo antes en la granja?`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
    campo({ tipo: "numero", id: `${p}_campo_pct`, paso, seccion, visible, etiqueta: "Directamente a campo o a terreno agrícola sin almacenamiento en granja (%)", pregunta: es(`¿Qué porcentaje va directamente al campo sin guardarlo antes? (también si se lo das a un agricultor)`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
    campo({ tipo: "check", id: `${p}_campo_diario`, paso, seccion, visible: (c) => visible(c) && Number(c.item[`${p}_campo_pct`]) > 0, etiqueta: "Se realiza de forma diaria", pregunta: es("¿Lo sacas al campo todos los días?") }),
    campo({ tipo: "numero", id: `${p}_otros_pct`, paso, seccion, visible, etiqueta: "Otros usos no agrarios sin almacenamiento en granja (%)", pregunta: es(`¿Qué porcentaje va a otros usos no agrarios?`), unidad: "%", decimales: 1, rango: { min: 0, max: 100 } }),
    {
      tipo: "grupo",
      id: `distribucion_${p}`,
      nombre: es("reparto"),
      pregunta: es(`¿En qué ${tipo === "purin" ? "balsas o depósitos" : "estercoleros"} guardas ${n} de esta nave y en qué porcentaje?`),
      visible: (c) => visible(c) && Number(c.item[`${p}_almacenamiento_pct`]) > 0,
      campoTitulo: "almacenamiento",
      minimo: 1,
      campos: [
        campo({ tipo: "referencia", id: "almacenamiento", referencia: grupoAlm, paso, seccion: `Distribución de los ${tipo === "purin" ? "purines" : "estiércoles"} en los sistemas de Almacenamiento`, etiqueta: "¿Cuál?", pregunta: es("¿Cuál?"), obligatorio: true }),
        campo({ tipo: "numero", id: "pct", paso, seccion: `Distribución de los ${tipo === "purin" ? "purines" : "estiércoles"} en los sistemas de Almacenamiento`, etiqueta: "Porcentaje", pregunta: es("¿Qué porcentaje va ahí?"), obligatorio: true, unidad: "%", decimales: 2, rango: { min: 0, max: 100 } }),
      ],
    },
  ];
}

// ---------- Paso 5: técnicas de aplicación a campo ----------
const TECNICAS_CON_ENTERRADO = ["bandas_tubos", "bandas_zapatas", "plato_difusor", "dilucion_riego", "acidificacion_riego"];
function aplicacionCampo(id: string, visible: (c: Ctx) => boolean, seccion: string, purin: boolean): Nodo[] {
  const paso = 5 as const;
  const conTecnica = purin;
  const enterrado = (c: Ctx) => !conTecnica || TECNICAS_CON_ENTERRADO.includes(String(c.item.tecnica));
  return [
    campo({ tipo: "check", id: `${id}_desconoce`, paso, seccion, visible, etiqueta: "Desconozco el sistema de aplicación a campo que se realiza.", pregunta: es("¿Lo aplica otra persona y no sabes cómo lo hace?"), especies: purin ? ["porcino"] : undefined }),
    campo({ tipo: "check", id: `${id}_programa_abonado`, paso, seccion, visible, etiqueta: purin ? "Dispone de un programa de abonado para la aplicación de los purines al terreno." : "Dispone de un programa de abonado para la aplicación de los purines y estiércoles al terreno.", pregunta: es("¿Tienes un plan o programa de abonado para las parcelas donde lo echas?") }),
    {
      tipo: "grupo",
      id: `${id}_tecnicas`,
      nombre: es("técnica"),
      pregunta: es("¿Cómo lo echas al campo? Añade cada forma que uses y en qué porcentaje."),
      visible: (c) => visible(c) && c.item[`${id}_desconoce`] !== true,
      campoTitulo: purin ? "tecnica" : "tiempo_enterrado",
      minimo: 1,
      campos: [
        campo({ tipo: "opcion", id: "tecnica", lista: "tecnica_aplicacion_purin", paso, seccion: "Técnicas", visible: () => conTecnica, etiqueta: "Técnica empleada en la aplicación a campo del purín", pregunta: es("¿Con qué lo echas?"), obligatorio: true, verificado: false }),
        campo({ tipo: "opcion", id: "tiempo_enterrado", lista: "tiempo_enterrado", paso, seccion: "Técnicas", visible: enterrado, etiqueta: "Tiempo de enterrado", pregunta: es("¿Cuánto tardas en enterrarlo después de echarlo?"), obligatorio: true, verificado: false }),
        campo({ tipo: "check", id: "recursos", paso, seccion: "Técnicas", visible: (c) => enterrado(c) && c.item.tiempo_enterrado === "antes_12h", etiqueta: "Dispone de recursos (maquinaria, mano de obra) suficientes para facilitar un enterrado rápido.", pregunta: es("¿Tienes maquinaria y gente suficientes para enterrarlo rápido?") }),
        campo({ tipo: "opcion", id: "apero", lista: "apero_enterrado", paso, seccion: "Técnicas", visible: enterrado, etiqueta: "Apero usado en el enterrado", pregunta: es("¿Con qué apero lo entierras?"), obligatorio: true, verificado: false }),
        campo({ tipo: "numero", id: "pct", paso, seccion: "Técnicas", etiqueta: "Porcentaje de aplicación de esta técnica", pregunta: es("¿Qué porcentaje echas de esta forma?"), obligatorio: true, unidad: "%", decimales: 2, rango: { min: 0, max: 100 } }),
      ],
    },
  ];
}

// =====================================================================
// PASO 1 — Datos granja
// =====================================================================
const paso1: Nodo[] = [
  campo({ tipo: "si_no", id: "actividad", paso: 1, seccion: "Actividad", etiqueta: "¿Su granja ha presentado actividad en el año objeto de declaración?", pregunta: es("¿Tuviste animales en la granja el año pasado, aunque fuera un solo día?"), obligatorio: true, verificado: true }),
  campo({ tipo: "si_no", id: "aai_dispone", paso: 1, seccion: "Autorización Ambiental Integrada", visible: huboActividad, etiqueta: "Dispone de Autorización Ambiental Integrada", pregunta: es("¿Tu granja tiene Autorización Ambiental Integrada (AAI)?"), ayuda: es("Es el permiso ambiental de las granjas grandes. Si no lo sabes, mira tu licencia o pregúntanos."), obligatorio: true }),
  campo({ tipo: "anio", id: "aai_anio_revision", paso: 1, seccion: "Autorización Ambiental Integrada", visible: y(huboActividad, tieneAai), etiqueta: "Año de la última revisión de la AAI", pregunta: es("¿En qué año se revisó por última vez la AAI?"), verificado: false }),
  campo({ tipo: "anio", id: "anio_construccion", paso: 1, seccion: "Granja", visible: huboActividad, etiqueta: "¿En qué año se ha construido?", pregunta: es("¿En qué año se construyó la granja?"), obligatorio: true, rango: { min: 1900 } }),
  campo({ tipo: "anio", id: "anio_inicio", paso: 1, seccion: "Granja", visible: huboActividad, etiqueta: "¿En qué año se inició la actividad?", pregunta: es("¿En qué año empezó a funcionar?"), obligatorio: true, rango: { min: 1900 } }),
  campo({ tipo: "anio", id: "anio_reforma", paso: 1, seccion: "Granja", visible: huboActividad, etiqueta: "¿En qué año se ha hecho la última reforma a nivel medio ambiental?", pregunta: es("¿En qué año hiciste la última reforma que afecte al medio ambiente? (déjalo vacío si no has hecho ninguna)"), ayuda: es("Por ejemplo: cubrir la balsa, cambiar el suelo de las naves o poner un lavador de aire.") }),
  campo({ tipo: "si_no", id: "ippc", paso: 1, seccion: "Granja", visible: y(huboActividad, avesCarneOPuesta), especies: ["aves_carne", "aves_puesta"], etiqueta: "Granja IPPC", pregunta: es("¿Es una granja IPPC (afectada por la Directiva de emisiones industriales)?"), verificado: false }),
  campo({ tipo: "calculado", id: "plazas_totales", paso: 1, seccion: "Plazas", visible: huboActividad, etiqueta: "Plazas ocupadas en la granja", pregunta: es("Plazas ocupadas en la granja"), obligatorio: true, calcular: (c) => ((c.raiz.alojamientos as Item[] | undefined) ?? []).reduce((a, x) => a + (Number(x.plazas) || 0), 0) }),
  // Sistema de Gestión Ambiental (voluntario sin AAI)
  campo({ tipo: "check", id: "sga_dispone", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: huboActividad, etiqueta: "Dispone de un Sistema de Gestión Ambiental (SGA)", pregunta: es("¿Tienes un Sistema de Gestión Ambiental por escrito?") }),
  campo({ tipo: "check", id: "sga_debe_ruido", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: y(huboActividad, (c) => c.raiz.sga_dispone === true), etiqueta: "Por la ubicación o por el tipo de la granja, debe disponer de un Plan de Gestión del Ruido", pregunta: es("¿Te obligan a tener un plan contra el ruido?") }),
  campo({ tipo: "check", id: "sga_plan_ruido", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: y(huboActividad, (c) => c.raiz.sga_dispone === true), etiqueta: "El SGA contempla un Plan de Gestión del Ruido", pregunta: es("¿Tu SGA incluye un plan contra el ruido?") }),
  campo({ tipo: "check", id: "sga_debe_olores", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: y(huboActividad, (c) => c.raiz.sga_dispone === true), etiqueta: "Por la ubicación o por el tipo de la granja, debe disponer de un Plan de Gestión de Olores", pregunta: es("¿Te obligan a tener un plan contra los olores?") }),
  campo({ tipo: "check", id: "sga_plan_olores", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: y(huboActividad, (c) => c.raiz.sga_dispone === true), etiqueta: "El SGA contempla un Plan de Gestión de Olores", pregunta: es("¿Tu SGA incluye un plan contra los olores?") }),
  campo({ tipo: "check", id: "sga_supervisa_olores", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: y(huboActividad, (c) => c.raiz.sga_plan_olores === true), etiqueta: "Supervisa periódicamente las emisiones de olores al aire", pregunta: es("¿Controlas los olores de forma periódica?") }),
  campo({ tipo: "check", id: "plan_emergencia", paso: 1, seccion: "Sistema de Gestión Ambiental (SGA)", visible: y(huboActividad, (c) => c.raiz.sga_dispone === true), etiqueta: "Dispone de un Plan de emergencia para hacer frente a emisiones e incidentes imprevistos", pregunta: es("¿Tienes un plan de emergencia para escapes o incidentes?") }),
  // Distancias, ruido, mantenimiento y cadáveres
  campo({ tipo: "check", id: "cumple_distancias", paso: 1, seccion: "Distancias, reducción ruido, plan de mantenimiento y gestión de cadáveres", visible: huboActividad, etiqueta: "La ubicación de la granja cumple con las distancias establecidas por la legislación", pregunta: es("¿Tu granja cumple las distancias legales (a pueblos, otras granjas, cauces…)?") }),
  campo({ tipo: "check", id: "tecnica_ruido", paso: 1, seccion: "Distancias, reducción ruido, plan de mantenimiento y gestión de cadáveres", visible: huboActividad, etiqueta: "Utiliza alguna técnica (ver botón i) para evitar o reducir las emisiones de ruido", pregunta: es("¿Haces algo para reducir el ruido? (pantallas, ventiladores silenciosos, horarios de carga…)") }),
  campo({ tipo: "check", id: "personal_formado", paso: 1, seccion: "Distancias, reducción ruido, plan de mantenimiento y gestión de cadáveres", visible: huboActividad, etiqueta: "El personal de la granja está adecuadamente formado", pregunta: es("¿Las personas que trabajan en la granja tienen formación (cursos de bienestar animal, etc.)?") }),
  campo({ tipo: "check", id: "mantenimiento", paso: 1, seccion: "Distancias, reducción ruido, plan de mantenimiento y gestión de cadáveres", visible: huboActividad, etiqueta: "Comprueba periódicamente (al menos una vez al año), repara y lleva un mantenimiento de los equipos y estructuras", pregunta: es("¿Revisas y reparas equipos e instalaciones al menos una vez al año?") }),
  campo({ tipo: "check", id: "cadaveres", paso: 1, seccion: "Distancias, reducción ruido, plan de mantenimiento y gestión de cadáveres", visible: huboActividad, etiqueta: "Se almacenan los animales muertos de forma que se eviten o reduzcan las emisiones", pregunta: es("¿Guardas los animales muertos en contenedor cerrado o cámara hasta que los recogen?") }),
];

// =====================================================================
// PASO 3 — Sistemas de almacenamiento exterior (se pregunta antes que los alojamientos)
// =====================================================================
const esDeposito = igual("tipo", "deposito", "tanque");
const almacenamientoPurin: Grupo = {
  tipo: "grupo",
  id: "almacenamientos_purin",
  nombre: es("balsa o depósito de purín"),
  pregunta: es("¿Tienes balsas, depósitos o fosas de purín fuera de las naves? Añade cada uno."),
  ayuda: es("Solo lo que está fuera de las naves. Los fosos bajo el suelo se preguntan con cada nave."),
  visible: (c) => huboActividad(c) && (c.especie === "porcino" || c.raiz.aves_separacion_sl === true),
  campoTitulo: "identificador",
  campos: [
    campo({ tipo: "texto", id: "identificador", paso: 3, seccion: "Sistema de almacenamiento", etiqueta: "¿Identificador del sistema de almacenamiento exterior del purín?", pregunta: es("¿Qué nombre le das? (por ejemplo: Balsa grande)"), obligatorio: true }),
    campo({ tipo: "opcion", id: "tipo", lista: "almacenamiento_purin_tipo", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Dónde almacena/gestiona los purines/fracción líquida?", pregunta: es("¿Qué es?"), obligatorio: true }),
    campo({ tipo: "numero", id: "superficie", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Cuál es la superficie del almacenamiento? (m²)", pregunta: es("¿Cuántos metros cuadrados tiene de superficie?"), obligatorio: true, unidad: "m²", decimales: 2, rango: { min: 1 } }),
    campo({ tipo: "numero", id: "capacidad", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Cuál es la capacidad del mismo? (m³)", pregunta: es("¿Cuántos metros cúbicos caben?"), obligatorio: true, unidad: "m³", decimales: 2, rango: { min: 1 } }),
    campo({ tipo: "numero", id: "altura", paso: 3, seccion: "Características del almacenamiento", visible: esDeposito, etiqueta: "¿Cuál es la altura o profundidad del sistema de almacenamiento?(m)", pregunta: es("¿Qué altura o profundidad tiene, en metros?"), obligatorio: true, unidad: "m", decimales: 2, rango: { min: 0.5, max: 15 } }),
    campo({ tipo: "opcion", id: "forma", lista: "forma_deposito", paso: 3, seccion: "Características del almacenamiento", visible: esDeposito, etiqueta: "¿Cuál es la forma del sistema de almacenamiento?", pregunta: es("¿Es redondo o rectangular?"), obligatorio: true, verificado: false }),
    campo({ tipo: "entero", id: "dias_permanencia", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Tiempo de permanencia del purín en el sistema de almacenamiento (en días)", pregunta: es("¿Cuántos días está el purín ahí, de media, antes de sacarlo?"), obligatorio: true, unidad: "días", rango: { min: 1, max: 730 } }),
    campo({ tipo: "check", id: "cubierta", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Utiliza algún tipo de cubierta", pregunta: es("¿Está cubierto?") }),
    campo({ tipo: "opcion", id: "cubierta_tipo", lista: "tipo_cubierta_purin", paso: 3, seccion: "Características del almacenamiento", visible: marcado("cubierta"), etiqueta: "Tipo de cubierta", pregunta: es("¿Con qué está cubierto?"), obligatorio: true, verificado: false }),
    campo({ tipo: "check", id: "reduce_agitacion", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Reduce al mínimo la agitación del purín durante el almacenamiento", pregunta: es("¿Remueves el purín lo menos posible (solo al vaciar)?") }),
    campo({ tipo: "check", id: "aprovecha_gas", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿El gas producido se aprovecha como fuente de energía en la propia granja o para el exterior?", pregunta: es("¿Aprovechas el gas (biogás) como energía?") }),
    campo({ tipo: "check", id: "protegido_vientos", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Se ubica en un lugar protegido de los vientos dominantes y/o existen medidas para reducir su velocidad alrededor (árboles, barreras naturales, etc.)", pregunta: es("¿Está protegido del viento (árboles, muros, desnivel)?") }),
    campo({ tipo: "check", id: "capacidad_suficiente", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Dispone de capacidad suficiente para los periodos de no aplicación a campo", pregunta: es("¿Te cabe todo el purín de los meses en que no se puede echar al campo?") }),
    campo({ tipo: "check", id: "impermeable", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Dispone de base y paredes impermeables", pregunta: es("¿El fondo y las paredes son impermeables?") }),
    campo({ tipo: "check", id: "espera_llenado", paso: 3, seccion: "Características del almacenamiento", visible: igual("tipo", "deposito"), etiqueta: "Espera a que el depósito se llene por completo antes del vaciado", pregunta: es("¿Esperas a que se llene del todo para vaciarlo?") }),
    campo({ tipo: "check", id: "tratamiento", paso: 3, seccion: "Tratamiento", etiqueta: "Se realiza tratamiento de purines", pregunta: es("¿Le haces algún tratamiento al purín (acidificar, digestor…)?") }),
    campo({ tipo: "opcion", id: "tratamiento_metodo", lista: "tratamiento_purin", paso: 3, seccion: "Tratamiento", visible: marcado("tratamiento"), etiqueta: "¿Cuál es el método?", pregunta: es("¿Qué tratamiento?"), obligatorio: true, verificado: false }),
    ...destinosTrasAlmacenamiento(3, "purin"),
  ],
};

const almacenamientoEstiercol: Grupo = {
  tipo: "grupo",
  id: "almacenamientos_estiercol",
  nombre: es("estercolero o almacén de estiércol"),
  pregunta: es("¿Tienes estercoleros, montones o naves de estiércol fuera de las naves de los animales? Añade cada uno."),
  ayuda: es("En porcino, incluye aquí la parte sólida si separas el purín."),
  visible: huboActividad,
  campoTitulo: "identificador",
  campos: [
    campo({ tipo: "texto", id: "identificador", paso: 3, seccion: "Sistema de almacenamiento", etiqueta: "¿Identificador del sistema de almacenamiento exterior del estiércol?", pregunta: es("¿Qué nombre le das? (por ejemplo: Estercolero)"), obligatorio: true, verificado: false }),
    campo({ tipo: "opcion", id: "tipo", lista: "almacenamiento_estiercol_tipo", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Dónde almacena/gestiona los estiércoles/fracción sólida?", pregunta: es("¿Qué es?"), obligatorio: true }),
    campo({ tipo: "numero", id: "superficie_total", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Cuál es la superficie total? (m²)", pregunta: es("¿Cuántos metros cuadrados ocupa?"), obligatorio: true, unidad: "m²", decimales: 2, rango: { min: 1 } }),
    campo({ tipo: "numero", id: "altura", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Cuál es la altura o profundidad del sistema de almacenamiento?(m)", pregunta: es("¿Qué altura alcanza el montón o las paredes, en metros?"), obligatorio: true, unidad: "m", decimales: 2, rango: { min: 0.3, max: 10 } }),
    campo({ tipo: "numero", id: "capacidad", paso: 3, seccion: "Características del almacenamiento", etiqueta: "¿Cuál es la capacidad del mismo? (m³)", pregunta: es("¿Cuántos metros cúbicos caben?"), obligatorio: true, unidad: "m³", decimales: 2, rango: { min: 1 } }),
    campo({ tipo: "entero", id: "dias_permanencia", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Tiempo de permanencia del estiércol en el sistema de almacenamiento (en días)", pregunta: es("¿Cuántos días está el estiércol ahí, de media, antes de sacarlo?"), obligatorio: true, unidad: "días", rango: { min: 1, max: 730 } }),
    campo({ tipo: "check", id: "lejos_cursos_agua", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Está lejos de cursos de agua", pregunta: es("¿Está lejos de ríos, arroyos o acequias?") }),
    campo({ tipo: "check", id: "base_impermeable", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Tiene la base impermeabilizada", pregunta: es("¿El suelo es de hormigón o está impermeabilizado?") }),
    campo({ tipo: "check", id: "recoge_lixiviados", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Recoge los lixiviados", pregunta: es("¿Recoges el líquido que suelta (lixiviados)?") }),
    campo({ tipo: "check", id: "quemado_combustible", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Aprovecha el estiércol mediante su quemado como combustible", pregunta: es("¿Quemas el estiércol como combustible?") }),
    campo({ tipo: "check", id: "protegido_vientos", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Se ubica en un lugar protegido de los vientos dominantes y/o existen medidas para reducir su velocidad alrededor (árboles, barreras naturales, etc.)", pregunta: es("¿Está protegido del viento?") }),
    campo({ tipo: "check", id: "compacta", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Compacta el estiércol en el almacenamiento", pregunta: es("¿Compactas el montón?") }),
    campo({ tipo: "check", id: "cubierta", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Utiliza algún tipo de cubierta", pregunta: es("¿Está cubierto (techo, lona…)?") }),
    campo({ tipo: "numero", id: "superficie_cubierta", paso: 3, seccion: "Características del almacenamiento", visible: marcado("cubierta"), etiqueta: "¿Cuál es la superficie cubierta? (m²)", pregunta: es("¿Cuántos metros cuadrados están cubiertos?"), obligatorio: true, unidad: "m²", decimales: 2 }),
    campo({ tipo: "check", id: "ventilada", paso: 3, seccion: "Características del almacenamiento", visible: marcado("cubierta"), etiqueta: "¿La instalación está lo suficientemente ventilada?", pregunta: es("¿Está bien ventilado aunque esté cubierto?") }),
    campo({ tipo: "check", id: "capacidad_suficiente", paso: 3, seccion: "Características del almacenamiento", etiqueta: "El sistema de almacenamiento exterior tiene la suficiente capacidad como para almacenar el estiércol durante el tiempo suficiente hasta que pueda utilizarse en campo", pregunta: es("¿Te cabe el estiércol hasta que se puede echar al campo?") }),
    campo({ tipo: "check", id: "reduce_superficie_volumen", paso: 3, seccion: "Características del almacenamiento", etiqueta: "Reduce la relación entre la superficie y el volumen del estiércol", pregunta: es("¿Haces montones altos y compactos en vez de extendidos?") }),
    campo({ tipo: "check", id: "secado_previo", paso: 3, seccion: "Características del almacenamiento", etiqueta: "El estiércol es secado o presecado en el alojamiento previamente a su añadido al montón de estiércol", pregunta: es("¿El estiércol sale ya seco o presecado de la nave?") }),
    campo({ tipo: "check", id: "paredes_hormigon", paso: 3, seccion: "Características del almacenamiento", etiqueta: "El estercolero/apilado cuenta con paredes de hormigón que permiten aumentar la altura del montón de estiércol", pregunta: es("¿Tiene paredes de hormigón?") }),
    campo({ tipo: "check", id: "tratamiento", paso: 3, seccion: "Tratamiento", etiqueta: "Se realiza tratamiento posterior del estiércol", pregunta: es("¿Le haces algún tratamiento al estiércol (compostaje…)?") }),
    campo({ tipo: "opcion", id: "tratamiento_metodo", lista: "tratamiento_estiercol", paso: 3, seccion: "Tratamiento", visible: marcado("tratamiento"), etiqueta: "¿Cuál es el método?", pregunta: es("¿Qué tratamiento?"), obligatorio: true, verificado: false }),
    ...destinosTrasAlmacenamiento(3, "estiercol"),
  ],
};

// =====================================================================
// Alojamientos — PASO 2 (+ pasos 4 y 5 de cada alojamiento)
// =====================================================================
const S_ALOJ = "Alojamiento";
const S_ANIM = "Animales";
const S_SUELO = "Suelo";
const S_FOSO = "Sistema de almacenamiento en el alojamiento";
const S_DEP = "Depuradores de aire y control de emisiones de amoniaco, polvo y olores";
const S_PLAZAS = "Plazas";
const aplicaAloj = noExtensivo;

const alojamientoPaso2: Nodo[] = [
  campo({ tipo: "texto", id: "identificador", paso: 2, seccion: S_ALOJ, etiqueta: "Identificador", pregunta: es("¿Qué nombre le das a este alojamiento? (por ejemplo: Nave 1 cebo)"), ayuda: es("Un alojamiento son las naves con la misma clase de animales y el mismo manejo. Tres naves iguales de cebo pueden ser un solo alojamiento."), obligatorio: true }),
  campo({ tipo: "opcion", id: "sistema_productivo", lista: "porcino_sistema_productivo", paso: 2, seccion: S_ALOJ, especies: ["porcino"], etiqueta: "¿Cuál es el sistema productivo en el alojamiento?", pregunta: es("¿Qué tipo de cerdo y cómo se cría aquí?"), obligatorio: true }),
  campo({ tipo: "check", id: "nave_nueva", paso: 2, seccion: S_ALOJ, visible: aplicaAloj, etiqueta: "Se trata de una nave nueva", pregunta: es("¿Es una nave construida después de febrero de 2017?"), ayuda: es("Nave autorizada por primera vez, o que sustituye a otra, después del 15 de febrero de 2017.") }),
  campo({ tipo: "opcion", id: "consistencia", lista: "consistencia_deyeccion", paso: 2, seccion: S_ALOJ, especies: ["porcino"], visible: aplicaAloj, etiqueta: "¿Tipo de consistencia de la deyección gestionada en el alojamiento?", pregunta: es("¿Lo que sale de esta nave es purín líquido o estiércol sólido (con cama)?"), obligatorio: true }),
  campo({ tipo: "opcion", id: "categoria", lista: listaCategoria, paso: 2, seccion: S_ANIM, etiqueta: "¿Cuál es la categoría del animal?", pregunta: es("¿Qué animales hay en este alojamiento?"), obligatorio: true }),
  // Porcino
  campo({ tipo: "opcion", id: "distribucion", lista: "porcino_distribucion", paso: 2, seccion: S_ANIM, especies: ["porcino"], visible: aplicaAloj, etiqueta: "¿Cómo están distribuidos estos animales?", pregunta: es("¿Están en jaulas o casetas individuales, o en corrales de grupo?"), obligatorio: true }),
  campo({ tipo: "check", id: "patio_exterior", paso: 2, seccion: S_ANIM, especies: ["porcino", "pavos"], visible: aplicaAloj, etiqueta: "Dispone de un patio con salida exterior", pregunta: es("¿Los animales pueden salir a un patio exterior?") }),
  campo({ tipo: "numero", id: "horas_patio", paso: 2, seccion: S_ANIM, especies: ["porcino", "pavos"], visible: marcado("patio_exterior"), etiqueta: "horas diarias medias en el patio exterior", pregunta: es("¿Cuántas horas al día pasan en el patio, de media?"), obligatorio: true, unidad: "h", decimales: 2, rango: { min: 0, max: 24 } }),
  // Aves de carne
  campo({ tipo: "opcion", id: "distribucion", lista: "aves_carne_distribucion", paso: 2, seccion: S_ANIM, especies: ["aves_carne"], etiqueta: "¿Cómo están distribuidos estos animales?", pregunta: es("¿Cómo se crían?"), obligatorio: true }),
  campo({ tipo: "numero", id: "porcentaje_patio", paso: 2, seccion: S_ANIM, especies: ["aves_carne"], visible: igual("distribucion", "suelo_con_salida"), etiqueta: "Porcentaje tiempo en patio exterior", pregunta: es("¿Qué porcentaje del tiempo pasan fuera?"), obligatorio: true, unidad: "%", decimales: 2, rango: { min: 0, max: 100 } }),
  campo({ tipo: "check", id: "ecologica", paso: 2, seccion: S_ANIM, especies: ["aves_carne"], visible: igual("distribucion", "suelo_con_salida"), etiqueta: "En producción ecológica", pregunta: es("¿Es producción ecológica?") }),
  // Aves de puesta
  campo({ tipo: "check", id: "muda", paso: 2, seccion: S_ANIM, especies: ["aves_puesta"], visible: igual("categoria", "gallinas_ponedoras"), etiqueta: "En gallinas ponedoras, ¿se trata de producción con muda en el año de declaración?", pregunta: es("¿Hiciste muda el año pasado, o un ciclo de puesta después de una muda?") }),
  campo({ tipo: "opcion", id: "estirpe", lista: "aves_puesta_estirpe", paso: 2, seccion: S_ANIM, especies: ["aves_puesta"], etiqueta: "Estirpe", pregunta: es("¿Son gallinas blancas o rubias?"), obligatorio: true, verificado: false }),
  campo({ tipo: "opcion", id: "tipo_produccion", lista: "aves_puesta_tipo_produccion", paso: 2, seccion: S_ANIM, especies: ["aves_puesta"], etiqueta: "Tipo de Producción según la categoría", pregunta: es("¿Cómo se crían?"), obligatorio: true }),
  campo({ tipo: "numero", id: "porcentaje_patio", paso: 2, seccion: S_ANIM, especies: ["aves_puesta"], visible: igual("tipo_produccion", "camperas", "ecologicas"), etiqueta: "Porcentaje tiempo en patio exterior", pregunta: es("¿Qué porcentaje del tiempo pasan fuera?"), obligatorio: true, unidad: "%", decimales: 2, rango: { min: 0, max: 100 } }),
  // Pavos
  campo({ tipo: "check", id: "pastoreo", paso: 2, seccion: S_ANIM, especies: ["pavos"], etiqueta: "Los animales de este alojamiento salen a pastoreo", pregunta: es("¿Salen a pastorear?"), verificado: false }),
  campo({ tipo: "numero", id: "horas_pastoreo", paso: 2, seccion: S_ANIM, especies: ["pavos"], visible: marcado("pastoreo"), etiqueta: "Horas al día en patio/pastoreo", pregunta: es("¿Cuántas horas al día?"), unidad: "h", decimales: 2, rango: { min: 0, max: 24 }, verificado: false }),
  campo({ tipo: "check", id: "secos_limpios", paso: 2, seccion: S_ANIM, visible: aplicaAloj, etiqueta: "Mantiene los animales y las superficies secos y limpios", pregunta: es("¿Mantienes los animales y el suelo secos y limpios?") }),

  // Suelo — porcino
  campo({ tipo: "opcion", id: "tipo_suelo", lista: "porcino_suelo", paso: 2, seccion: S_SUELO, especies: ["porcino"], visible: aplicaAloj, etiqueta: "¿Cuál es el tipo de suelo?", pregunta: es("¿Cómo es el suelo de la nave?"), ayuda: es("Enrejillado = slat. Mira las fotos de ayuda si dudas."), obligatorio: true }),
  campo({ tipo: "texto", id: "tipo_suelo_otro", paso: 2, seccion: S_SUELO, visible: igual("tipo_suelo", "otro"), etiqueta: "¿Cuál?", pregunta: es("Descríbelo"), obligatorio: true, verificado: false }),
  campo({ tipo: "check", id: "sin_cama", paso: 2, seccion: S_SUELO, visible: (c) => porcinoSolida(c) || c.especie === "pavos", etiqueta: "No uso ningún material de cama", pregunta: es("¿Es sin cama?") }),
  campo({ tipo: "check", id: "cama_profunda", paso: 2, seccion: S_SUELO, visible: porcinoSolida, etiqueta: "Se utiliza la técnica de cama profunda", pregunta: es("¿Usas cama profunda?") }),
  campo({ tipo: "cantidades", id: "cama_materiales", lista: "porcino_material_cama", paso: 2, seccion: S_SUELO, visible: y(porcinoSolida, (c) => c.item.sin_cama !== true), etiqueta: "¿Qué material usa para la cama? (kg/plaza/día)", pregunta: es("¿Qué usas de cama y cuántos kilos por plaza y día, más o menos?"), ayuda: es("Kilos de cama al día en la nave ÷ plazas medias. Ejemplo: 100 kg/día para 500 plazas = 0,2."), unidad: "kg/plaza/día", decimales: 3, obligatorio: true }),
  campo({ tipo: "check", id: "cama_manual", paso: 2, seccion: S_SUELO, visible: (c) => (porcinoSolida(c) || c.especie !== "porcino") && c.item.sin_cama !== true, etiqueta: "La cama se administra de forma manual", pregunta: es("¿Pones la cama a mano?") }),
  campo({ tipo: "check", id: "cama_seca", paso: 2, seccion: S_SUELO, visible: (c) => (porcinoSolida(c) || c.especie !== "porcino") && c.item.sin_cama !== true, etiqueta: "Mantiene la cama seca y aireada", pregunta: es("¿Mantienes la cama seca y aireada?") }),
  // Suelo — aves de carne y puesta
  campo({ tipo: "check", id: "aviarios", paso: 2, seccion: S_SUELO, especies: ["aves_carne", "aves_puesta"], etiqueta: "Dispone de sistema de aviarios", pregunta: es("¿Tienes aviarios (estructuras de varios niveles)?") }),
  campo({ tipo: "opcion", id: "tipo_aviario", lista: "aves_tipo_aviario", paso: 2, seccion: S_SUELO, especies: ["aves_carne", "aves_puesta"], visible: marcado("aviarios"), etiqueta: "¿Cuál es el tipo de aviario?", pregunta: es("¿De qué tipo?"), obligatorio: true, verificado: false }),
  campo({ tipo: "opcion", id: "tipo_suelo", lista: "aves_suelo", paso: 2, seccion: S_SUELO, especies: ["aves_carne", "aves_puesta"], etiqueta: "¿Cuál es el tipo de suelo?", pregunta: es("¿Cómo es el suelo?"), obligatorio: true, verificado: false }),
  campo({ tipo: "opcion", id: "tipo_suelo", lista: "pavos_suelo", paso: 2, seccion: S_SUELO, especies: ["pavos"], etiqueta: "¿Cuál es el tipo de suelo?", pregunta: es("¿Cómo es el suelo?"), obligatorio: true }),
  campo({ tipo: "check", id: "bebederos_sin_perdidas", paso: 2, seccion: S_SUELO, especies: ["aves_carne", "aves_puesta", "pavos"], etiqueta: "Dispone de un sistema de bebederos sin pérdidas de agua", pregunta: es("¿Los bebederos no gotean (tetinas con cazoleta, etc.)?") }),
  campo({ tipo: "check", id: "yacija", paso: 2, seccion: S_SUELO, especies: ["aves_carne", "aves_puesta"], etiqueta: "Se utiliza yacija", pregunta: es("¿Usas cama (yacija)?") }),
  campo({ tipo: "cantidades", id: "cama_materiales", lista: "aves_material_yacija", paso: 2, seccion: S_SUELO, especies: ["aves_carne", "aves_puesta"], visible: marcado("yacija"), etiqueta: "¿Qué material usa para la cama? (kg/plaza/ciclo)", pregunta: es("¿Qué usas de cama y cuántos kilos por plaza y ciclo?"), ayuda: es("Total del año de cada material ÷ plazas ÷ número de ciclos."), unidad: "kg/plaza/ciclo", decimales: 3, obligatorio: true }),
  campo({ tipo: "cantidades", id: "cama_materiales", lista: "pavos_material_cama", paso: 2, seccion: S_SUELO, especies: ["pavos"], visible: (c) => c.item.sin_cama !== true, etiqueta: "¿Qué material usa para la cama? (kg/plaza/ciclo)", pregunta: es("¿Qué usas de cama y cuántos kilos por plaza y ciclo?"), unidad: "kg/plaza/ciclo", decimales: 3, obligatorio: true }),

  // Foso / almacenamiento en el alojamiento — porcino
  campo({ tipo: "check", id: "foso_dispone", paso: 2, seccion: S_FOSO, visible: (c) => porcinoLiquida(c) || avesCarneOPuesta(c), etiqueta: "¿Dispone de foso bajo el suelo?", pregunta: es("¿Hay foso bajo el suelo de la nave?") }),
  campo({ tipo: "opcion", id: "foso_tipo", lista: "porcino_tipo_foso", paso: 2, seccion: S_FOSO, visible: y(porcinoLiquida, marcado("foso_dispone")), etiqueta: "¿Cuál es el tipo de foso?", pregunta: es("¿Cómo es el foso?"), obligatorio: true }),
  campo({ tipo: "opcion", id: "foso_vaciado", lista: "porcino_frecuencia_vaciado_foso", paso: 2, seccion: S_FOSO, visible: y(porcinoLiquida, marcado("foso_dispone")), etiqueta: "Frecuencia de vaciado del foso", pregunta: es("¿Cada cuánto vacías el foso?"), verificado: false }),
  campo({ tipo: "check", id: "foso_tratamiento", paso: 2, seccion: S_FOSO, visible: y(porcinoLiquida, marcado("foso_dispone")), etiqueta: "Realiza algún tratamiento en el foso", pregunta: es("¿Tratas el purín en el foso (ácido, bolas, refrigeración)?") }),
  campo({ tipo: "opcion", id: "foso_tratamiento_tipo", lista: "porcino_tratamiento_foso", paso: 2, seccion: S_FOSO, visible: marcado("foso_tratamiento"), etiqueta: "¿De qué tipo?", pregunta: es("¿Qué tratamiento?"), obligatorio: true, verificado: false }),
  campo({ tipo: "opcion", id: "gestion_solida", lista: "porcino_gestion_solida_alojamiento", paso: 2, seccion: S_FOSO, visible: porcinoSolida, etiqueta: "¿Cómo almacenan/gestionan los estiércoles (deyecciones sólidas) en el alojamiento?", pregunta: es("¿Cómo se queda el estiércol dentro de la nave?"), obligatorio: true, verificado: false }),
  campo({ tipo: "entero", id: "dias_permanencia", paso: 2, seccion: S_FOSO, visible: (c) => porcinoLiquida(c) || porcinoSolida(c) || c.especie === "pavos", etiqueta: "Tiempo de permanencia del purín/estiércol en el alojamiento (en días)", pregunta: es("¿Cuántos días está el purín o estiércol dentro de la nave antes de sacarlo?"), ayuda: es("Si lo sacas todos los días, pon 1."), obligatorio: true, unidad: "días", rango: { min: 1, max: 400 } }),
  campo({ tipo: "opcion", id: "retirada", lista: "porcino_retirada_deyecciones", paso: 2, seccion: S_FOSO, visible: (c) => porcinoLiquida(c) || porcinoSolida(c), etiqueta: "¿Cómo realiza la retirada de las deyecciones?", pregunta: es("¿Cómo lo sacas de la nave?"), obligatorio: true }),
  campo({ tipo: "opcion", id: "retirada", lista: "pavos_retirada_deyecciones", paso: 2, seccion: S_FOSO, especies: ["pavos"], etiqueta: "¿Cómo realiza la retirada de las deyecciones?", pregunta: es("¿Cómo sacas el estiércol de la nave?"), obligatorio: true, verificado: false }),
  campo({ tipo: "texto", id: "retirada_otro", paso: 2, seccion: S_FOSO, visible: igual("retirada", "otro"), etiqueta: "¿Cuál?", pregunta: es("¿Cómo lo haces?"), obligatorio: true }),

  // Depuradores y control de emisiones
  campo({ tipo: "check", id: "depurador", paso: 2, seccion: S_DEP, visible: aplicaAloj, etiqueta: "Dispone de sistemas depuradores de aire", pregunta: es("¿La nave tiene lavador o depurador de aire?") }),
  campo({ tipo: "opcion", id: "depurador_tipo", lista: "tipo_depurador_aire", paso: 2, seccion: S_DEP, visible: marcado("depurador"), etiqueta: "¿De qué tipo?", pregunta: es("¿Qué tipo de depurador?"), obligatorio: true, verificado: false }),
  campo({ tipo: "check", id: "control_polvo", paso: 2, seccion: S_DEP, visible: aplicaAloj, etiqueta: "Dispone de sistemas de control de emisiones de polvo", pregunta: es("¿Tienes algo para reducir el polvo (nebulizadores, ionización…)?") }),
  campo({ tipo: "opcion", id: "control_polvo_tipo", lista: "tipo_control_polvo", paso: 2, seccion: S_DEP, visible: marcado("control_polvo"), etiqueta: "¿De qué tipo?", pregunta: es("¿Qué sistema?"), obligatorio: true, verificado: false }),
  campo({ tipo: "check", id: "supervisa_polvo", paso: 2, seccion: S_DEP, visible: aplicaAloj, etiqueta: "Supervisa las emisiones de polvo al menos una vez al año", pregunta: es("¿Mides el polvo al menos una vez al año?") }),
  campo({ tipo: "check", id: "supervisa_depuracion", paso: 2, seccion: S_DEP, visible: marcado("depurador"), etiqueta: "En alojamientos con sistemas de depuración de aire, supervisa las emisiones de amoniaco, polvo y/u olores.", pregunta: es("¿Compruebas que el depurador funciona (mediciones y control diario)?") }),
  campo({ tipo: "check", id: "secado_yacija", paso: 2, seccion: S_DEP, especies: ["aves_carne", "aves_puesta"], etiqueta: "Dispone de sistemas de secado de yacija", pregunta: es("¿Tienes sistema para secar la cama?") }),
  campo({ tipo: "opcion", id: "secado_yacija_tipo", lista: "aves_tipo_secado_yacija", paso: 2, seccion: S_DEP, visible: marcado("secado_yacija"), etiqueta: "¿De qué tipo?", pregunta: es("¿Qué sistema de secado?"), verificado: false }),
  campo({ tipo: "check", id: "ventilacion_forzada_foso", paso: 2, seccion: S_DEP, especies: ["aves_puesta"], etiqueta: "Dispone de sistemas de ventilación forzada en el foso", pregunta: es("¿El foso tiene ventilación forzada?") }),
  campo({ tipo: "opcion", id: "ventilacion", lista: "pavos_ventilacion", paso: 2, seccion: S_DEP, especies: ["pavos"], etiqueta: "Sistema de ventilación", pregunta: es("¿Cómo se ventila la nave?"), obligatorio: true, verificado: false }),

  // Lotes (ayuda del formulario, no es un campo de ECOGAN)
  campo({ tipo: "lotes", id: "lotes", paso: 2, seccion: S_PLAZAS, soloFormulario: true, etiqueta: "Lotes del año", pregunta: es("Cuéntanos los lotes del año pasado en este alojamiento y nosotros hacemos las cuentas."), ayuda: es("Para cada lote: animales que entraron y salieron, peso de entrada y salida, días que estuvieron y días que la nave quedó vacía después.") }),
  // Plazas
  campo({ tipo: "entero", id: "plazas", paso: 2, seccion: S_PLAZAS, etiqueta: "Número de plazas ocupadas del alojamiento", pregunta: es("¿Cuántas plazas estuvieron ocupadas de media el año pasado?"), ayuda: es("No es la capacidad máxima ni los animales a 31 de diciembre: es la media de los lotes, contando cada lote como (entraron + salieron) ÷ 2."), obligatorio: true, sugerencia: desdeLotes("plazasOcupadas"), rango: { min: 1 } }),
  campo({ tipo: "numero", id: "produccion_estiercol", paso: 2, seccion: S_PLAZAS, visible: aplicaAloj, etiqueta: "Producción anual de estiércol", unidad: (c) => (c.especie === "porcino" && c.item.consistencia === "liquida" ? "m³/año" : "t/año"), pregunta: es("¿Cuánto purín o estiércol salió de este alojamiento el año pasado, en total?"), ayuda: es("Puedes calcularlo por las cubas o contenedores que sacaste, o por lo que se llenó la balsa. Purín en m³, estiércol en toneladas."), obligatorio: true, decimales: 2, rango: { min: 0 } }),
  campo({ tipo: "numero", id: "porcentaje_machos", paso: 2, seccion: S_PLAZAS, especies: ["pavos"], visible: igual("categoria", "pavitos"), etiqueta: "% de machos presentes en ese alojamiento", pregunta: es("¿Qué porcentaje de los pavitos son machos?"), unidad: "%", decimales: 2, rango: { min: 0, max: 100 }, verificado: false }),
];

// ---------- PASO 4: gestión de cada alojamiento ----------
const S_PESO = "Peso";
const S_DUR = "Duración";
const S_MAS = "Más información";
const S_NUT = "Gestión Nutricional";
const esGestante = igual("categoria", "cerdas_1a_gestacion", "cerdas_no_primerizas_gestacion");
const esCriando = igual("categoria", "cerdas_primerizas_criando", "cerdas_no_primerizas_criando");
const ponenHuevos = (c: Ctx) =>
  (c.especie === "aves_carne" && c.item.categoria === "gallinas_reproductoras_carne") ||
  (c.especie === "aves_puesta" && ["gallinas_ponedoras", "reproductoras_puesta"].includes(String(c.item.categoria)));

const alojamientoPaso4: Nodo[] = [
  campo({ tipo: "numero", id: "peso_inicio", paso: 4, seccion: S_PESO, visible: cicloNormal, etiqueta: "Peso del animal al inicio del ciclo productivo", unidad: unidadPeso, pregunta: es("¿Cuánto pesan de media al entrar en este alojamiento?"), obligatorio: true, decimales: 1, sugerencia: desdeLotes("pesoInicio"), rango: { min: 0 } }),
  campo({ tipo: "numero", id: "peso_fin", paso: 4, seccion: S_PESO, visible: cicloNormal, etiqueta: "Peso del animal al final del ciclo productivo", unidad: unidadPeso, pregunta: es("¿Cuánto pesan de media al salir?"), obligatorio: true, decimales: 1, sugerencia: desdeLotes("pesoFin"), rango: { min: 0 } }),
  campo({ tipo: "numero", id: "peso_inicio", paso: 4, seccion: S_PESO, visible: ponedorasSinMuda, etiqueta: "Peso del animal al inicio del ciclo productivo (g)", unidad: "g", pregunta: es("¿Cuánto pesan las gallinas al empezar la puesta, en gramos?"), obligatorio: true, decimales: 1 }),
  campo({ tipo: "numero", id: "peso_fin", paso: 4, seccion: S_PESO, visible: ponedorasSinMuda, etiqueta: "Peso del animal al final del ciclo productivo (g)", unidad: "g", pregunta: es("¿Y al final, en gramos?"), obligatorio: true, decimales: 1 }),
  campo({ tipo: "numero", id: "peso_inicio_antes_muda", paso: 4, seccion: S_PESO, visible: ponedorasConMuda, etiqueta: "Peso del animal al inicio del ciclo de puesta antes de la muda (g)", unidad: "g", pregunta: es("Peso al empezar la puesta antes de la muda (g)"), obligatorio: true, decimales: 1 }),
  campo({ tipo: "numero", id: "peso_fin_antes_muda", paso: 4, seccion: S_PESO, visible: ponedorasConMuda, etiqueta: "Peso del animal al final del ciclo de puesta antes de la muda (g)", unidad: "g", pregunta: es("Peso al acabar la puesta antes de la muda (g)"), obligatorio: true, decimales: 1 }),
  campo({ tipo: "numero", id: "peso_inicio_tras_muda", paso: 4, seccion: S_PESO, visible: ponedorasConMuda, etiqueta: "Peso del animal al inicio del ciclo de puesta tras la muda (g)", unidad: "g", pregunta: es("Peso al empezar la puesta tras la muda (g)"), obligatorio: true, decimales: 1 }),
  campo({ tipo: "numero", id: "peso_fin_tras_muda", paso: 4, seccion: S_PESO, visible: ponedorasConMuda, etiqueta: "Peso del animal al final del ciclo de puesta tras la muda (g)", unidad: "g", pregunta: es("Peso al acabar la puesta tras la muda (g)"), obligatorio: true, decimales: 1 }),
  campo({ tipo: "entero", id: "periodo_productivo", paso: 4, seccion: S_DUR, visible: cicloNormal, etiqueta: "Duración del periodo productivo (días)", pregunta: es("¿Cuántos días está cada lote en este alojamiento?"), ayuda: es("Por ciclo, no por año. Si haces 5 lotes de 45 días, pon 45."), obligatorio: true, unidad: "días", sugerencia: desdeLotes("periodoProductivo"), rango: { min: 1 } }),
  campo({ tipo: "entero", id: "periodo_no_ocupacion", paso: 4, seccion: S_DUR, visible: cicloNormal, etiqueta: "Periodo de no ocupación (días)", pregunta: es("¿Cuántos días queda vacío entre un lote y el siguiente?"), ayuda: es("Solo cuenta cuando la nave está completamente vacía."), unidad: "días", sugerencia: desdeLotes("periodoNoOcupacion"), rango: { min: 0 } }),
  campo({ tipo: "entero", id: "duracion_ciclo_puesta", paso: 4, seccion: S_DUR, visible: ponedorasSinMuda, etiqueta: "Duración de todo el ciclo de puesta", pregunta: es("¿Cuántos días dura todo el ciclo de puesta?"), obligatorio: true, unidad: "días", verificado: false }),
  campo({ tipo: "entero", id: "dias_puesta_anio", paso: 4, seccion: S_DUR, visible: ponedorasSinMuda, etiqueta: "Días de puesta solo en el año de declaración", pregunta: es("¿Cuántos días hubo puesta el año pasado?"), obligatorio: true, unidad: "días", rango: { min: 0, max: 366 }, verificado: false }),
  campo({ tipo: "entero", id: "dias_no_ocupacion_anio", paso: 4, seccion: S_DUR, visible: ponedorasSinMuda, etiqueta: "Días de no ocupación solo en el año de declaración", pregunta: es("¿Cuántos días estuvo vacía la nave el año pasado?"), unidad: "días", rango: { min: 0, max: 366 }, verificado: false }),
  campo({ tipo: "entero", id: "duracion_ciclo_antes_muda", paso: 4, seccion: S_DUR, visible: ponedorasConMuda, etiqueta: "Duración de todo el ciclo de puesta antes de muda", pregunta: es("¿Cuántos días dura el ciclo de puesta antes de la muda?"), obligatorio: true, unidad: "días", verificado: false }),
  campo({ tipo: "entero", id: "dias_puesta_antes_muda_anio", paso: 4, seccion: S_DUR, visible: ponedorasConMuda, etiqueta: "Días de puesta en el ciclo de puesta antes de muda solo durante el año de declaración", pregunta: es("¿Cuántos de esos días cayeron el año pasado?"), obligatorio: true, unidad: "días", verificado: false }),
  campo({ tipo: "entero", id: "dias_muda_anio", paso: 4, seccion: S_DUR, visible: ponedorasConMuda, etiqueta: "Días de muda solo en el año de declaración", pregunta: es("¿Cuántos días de muda hubo el año pasado?"), obligatorio: true, unidad: "días", verificado: false }),
  campo({ tipo: "entero", id: "duracion_ciclo_tras_muda", paso: 4, seccion: S_DUR, visible: ponedorasConMuda, etiqueta: "Duración de todo el ciclo de puesta tras la muda", pregunta: es("¿Cuántos días dura el ciclo de puesta tras la muda?"), obligatorio: true, unidad: "días", verificado: false }),
  campo({ tipo: "entero", id: "dias_puesta_tras_muda_anio", paso: 4, seccion: S_DUR, visible: ponedorasConMuda, etiqueta: "Días de puesta en el ciclo de puesta tras la muda solo durante el año de declaración", pregunta: es("¿Cuántos de esos días cayeron el año pasado?"), obligatorio: true, unidad: "días", verificado: false }),
  campo({ tipo: "numero", id: "porcentaje_muertes", paso: 4, seccion: S_MAS, etiqueta: "% muertes", pregunta: es("¿Qué porcentaje de animales se murieron en este alojamiento?"), unidad: "%", decimales: 2, sugerencia: desdeLotes("porcentajeMuertes"), rango: { min: 0, max: 60 } }),
  campo({ tipo: "numero", id: "peso_lechon_nacimiento", paso: 4, seccion: S_MAS, especies: ["porcino"], visible: (c) => esGestante(c) || esCriando(c), etiqueta: "Peso de los lechones al nacimiento (kg)", pregunta: es("¿Cuánto pesan los lechones al nacer, de media?"), unidad: "kg", decimales: 2, rango: { min: 0.5, max: 3 } }),
  campo({ tipo: "numero", id: "lechones_nacidos_camada", paso: 4, seccion: S_MAS, especies: ["porcino"], visible: esGestante, etiqueta: "Lechones nacidos por cerda y camada", pregunta: es("¿Cuántos lechones nacen por camada?"), decimales: 2, rango: { min: 5, max: 25 } }),
  campo({ tipo: "numero", id: "porcentaje_abortos", paso: 4, seccion: S_MAS, especies: ["porcino"], visible: esGestante, etiqueta: "% abortos", pregunta: es("¿Qué porcentaje de abortos tuviste?"), unidad: "%", decimales: 2, rango: { min: 0, max: 30 } }),
  campo({ tipo: "numero", id: "peso_destete", paso: 4, seccion: S_MAS, especies: ["porcino"], visible: esCriando, etiqueta: "Peso de los lechones al destete (kg)", pregunta: es("¿Cuánto pesan los lechones al destete?"), unidad: "kg", decimales: 2, rango: { min: 3, max: 12 } }),
  campo({ tipo: "numero", id: "lechones_lactantes_camada", paso: 4, seccion: S_MAS, especies: ["porcino"], visible: esCriando, etiqueta: "Lechones lactantes por cerda y camada", pregunta: es("¿Cuántos lechones cría cada cerda?"), decimales: 2, rango: { min: 5, max: 20 } }),
  campo({ tipo: "numero", id: "masa_huevos", paso: 4, seccion: S_MAS, visible: ponenHuevos, etiqueta: "Masa media de los huevos por animal (g huevos/día)", pregunta: es("¿Cuántos gramos de huevo pone cada gallina al día, de media?"), unidad: "g/día", decimales: 2, rango: { min: 10, max: 80 } }),
  campo({ tipo: "calculado", id: "numero_piensos", paso: 4, seccion: S_NUT, etiqueta: "Número de piensos", pregunta: es("Número de piensos"), obligatorio: true, calcular: (c) => ((c.item.piensos as Item[] | undefined) ?? []).length }),
  campo({ tipo: "check", id: "fitasas", paso: 4, seccion: S_NUT, etiqueta: "Uso de aditivos autorizados para piensos que reduzcan el fósforo total excretado (FITASAS)", pregunta: es("¿El pienso lleva fitasas? (mira la etiqueta: 'fitasa' o '4a1600', '4a16'…)") }),
  campo({ tipo: "check", id: "reduce_polvo_pienso", paso: 4, seccion: S_NUT, etiqueta: "Utiliza algún sistema para reducir la generación de polvo", pregunta: es("¿Usas pienso granulado o húmedo, o separadores de polvo en los silos?") }),
  {
    tipo: "grupo",
    id: "piensos",
    nombre: es("pienso"),
    pregunta: es("Añade cada pienso que comen en este alojamiento, en orden (del primero al último)."),
    ayuda: es("Los datos de humedad y proteína bruta están en la etiqueta del pienso. Puedes subir una foto."),
    campoTitulo: "nombre",
    minimo: 1,
    campos: [
      campo({ tipo: "texto", id: "nombre", paso: 4, seccion: "Piensos", etiqueta: "Nombre del período de alimentación", pregunta: es("¿Cómo se llama este pienso? (por ejemplo: Inicio, Crecimiento, Acabado)"), obligatorio: true }),
      campo({ tipo: "numero", id: "humedad", paso: 4, seccion: "Piensos", etiqueta: "% Humedad", pregunta: es("% de humedad (etiqueta del pienso). Si no viene, pon 12."), obligatorio: true, unidad: "%", decimales: 3, rango: { min: 5, max: 30 } }),
      campo({ tipo: "numero", id: "proteina_bruta", paso: 4, seccion: "Piensos", etiqueta: "% PB", pregunta: es("% de proteína bruta (etiqueta del pienso)"), obligatorio: true, unidad: "%", decimales: 3, rango: { min: 8, max: 30 } }),
      campo({ tipo: "numero", id: "kg_plaza", paso: 4, seccion: "Piensos", etiqueta: "kg pienso/plaza/día", unidad: "kg/plaza/día", visible: (c) => c.especie === "porcino", pregunta: es("¿Cuántos kilos de este pienso come cada animal al día?"), obligatorio: true, decimales: 3, rango: { min: 0.1, max: 8 } }),
      campo({ tipo: "numero", id: "kg_plaza", paso: 4, seccion: "Piensos", etiqueta: "kg pienso/plaza/ciclo", unidad: "kg/plaza/ciclo", visible: (c) => c.especie !== "porcino", pregunta: es("¿Cuántos kilos de este pienso come cada ave por ciclo?"), ayuda: es("Consumo del año de este pienso ÷ plazas ÷ número de ciclos."), obligatorio: true, decimales: 3, rango: { min: 0.01 } }),
      campo({ tipo: "entero", id: "dias", paso: 4, seccion: "Piensos", etiqueta: "¿Cuántos días lo suministra?", pregunta: es("¿Cuántos días se lo das en cada ciclo?"), obligatorio: true, unidad: "días", rango: { min: 1 } }),
      campo({ tipo: "numero", id: "kg_antes", paso: 4, seccion: "Piensos", etiqueta: "kg animal antes de administrar el pienso", pregunta: es("¿Cuánto pesa el animal cuando empieza este pienso?"), obligatorio: true, unidad: "kg", decimales: 3 }),
      campo({ tipo: "numero", id: "kg_despues", paso: 4, seccion: "Piensos", etiqueta: "kg animal después de administrar el pienso", pregunta: es("¿Y cuando lo termina?"), obligatorio: true, unidad: "kg", decimales: 3 }),
    ],
  },
  campo({ tipo: "check", id: "separacion_sl", paso: 4, seccion: "Destino de los purines desde el alojamiento", especies: ["porcino"], visible: aplicaAloj, etiqueta: "Realiza un tratamiento de separación sólido-líquido", pregunta: es("¿Separas la parte sólida del purín (separador)?") }),
  campo({ tipo: "numero", id: "pct_fraccion_liquida", paso: 4, seccion: "Destino de los purines desde el alojamiento", visible: marcado("separacion_sl"), etiqueta: "% fracción liquida tras la S-L", pregunta: es("¿Qué porcentaje queda líquido tras separar?"), obligatorio: true, unidad: "%", decimales: 2, rango: { min: 0, max: 100 } }),
  campo({ tipo: "numero", id: "pct_fraccion_solida", paso: 4, seccion: "Destino de los purines desde el alojamiento", visible: marcado("separacion_sl"), etiqueta: "% fracción sólida tras S-L", pregunta: es("¿Y qué porcentaje queda sólido?"), obligatorio: true, unidad: "%", decimales: 2, rango: { min: 0, max: 100 } }),
  ...destinosDesdeAlojamiento("purin"),
  ...destinosDesdeAlojamiento("estiercol"),
  // Energía y agua en los alojamientos (paso 4.4; voluntario sin AAI)
  ...(
    [
      ["vent_forzada", "Empleo mayoritario de ventilación forzada", "¿La ventilación es sobre todo forzada (ventiladores)?", undefined],
      ["vent_alta_eficiencia", "Dispone de un sistema alta eficiencia", "¿Los ventiladores son de alta eficiencia?", "vent_forzada"],
      ["vent_optimizado", "Está optimizado a las condiciones de producción", "¿Está ajustada a las necesidades (sondas, controlador)?", "vent_forzada"],
      ["vent_baja_velocidad", "Está diseñado y es utilizado a baja velocidad", "¿Funciona a baja velocidad?", "vent_forzada"],
      ["refrigeracion", "Empleo mayoritario de refrigeración", "¿Usas refrigeración (cooling, paneles)?", undefined],
      ["refrig_alta_eficiencia", "Dispone de un sistema alta eficiencia", "¿Es de alta eficiencia?", "refrigeracion"],
      ["refrig_optimizado", "Está optimizado a las condiciones de producción", "¿Está ajustada a las necesidades?", "refrigeracion"],
      ["calefaccion", "Empleo mayoritario de calefacción", "¿Usas calefacción?", undefined],
      ["calef_alta_eficiencia", "Dispone de un sistema alta eficiencia", "¿Es de alta eficiencia?", "calefaccion"],
      ["calef_optimizado", "Está optimizado a las condiciones de producción", "¿Está ajustada a las necesidades?", "calefaccion"],
      ["intercambiadores", "Uso de intercambiadores de calor", "¿Tienes intercambiadores de calor?", undefined],
      ["bombas_calor", "Uso de bombas de calor para la recuperación de calor", "¿Tienes bombas de calor?", undefined],
      ["vent_natural", "Uso de ventilación natural", "¿Usas ventilación natural (ventanas, cumbrera)?", undefined],
      ["iluminacion_bajo_consumo", "Empleo mayoritario de iluminación bajo consumo", "¿La iluminación es de bajo consumo (LED)?", undefined],
      ["aislamiento", "Los muros, suelos y/o techos del alojamiento de los animales se encuentran aislados", "¿La nave está aislada (paredes, techo)?", undefined],
    ] as const
  ).map(([id, etiqueta, pregunta, padre]) =>
    campo({ tipo: "check", id, paso: 4, seccion: "Energía en los alojamientos", visible: y(aplicaAloj, tieneAai, padre ? marcado(padre) : () => true), etiqueta, pregunta: es(pregunta) }),
  ),
  ...(
    [
      ["limpieza_presion", "Realiza la limpieza de los alojamientos con equipos de presión", "¿Limpias con máquina a presión?", undefined],
      ["presion_agua_caliente", "El sistema de limpieza a presión utiliza agua caliente", "¿Con agua caliente?", "limpieza_presion"],
      ["bebederos_cazoleta", "Empleo mayoritario de bebederos de cazoleta", "¿Los bebederos son de cazoleta?", undefined],
      ["tolva_seco_humedo", "Empleo mayoritario de tolva seco-húmedo", "¿Usas tolvas seco-húmedo?", undefined],
    ] as const
  ).map(([id, etiqueta, pregunta, padre]) =>
    campo({ tipo: "check", id, paso: 4, seccion: "Agua en los alojamientos", visible: y(aplicaAloj, tieneAai, padre ? marcado(padre) : () => true), etiqueta, pregunta: es(pregunta) }),
  ),
];

const alojamientoPaso5: Nodo[] = [
  ...aplicacionCampo("aplicacion_purin", (c) => generaPurin(c) && Number(c.item.purin_campo_pct) > 0, "Aplicación directa a campo de los purines desde el alojamiento sin almacenamiento exterior previo", true),
  ...aplicacionCampo("aplicacion_estiercol", (c) => generaEstiercol(c) && Number(c.item.estiercol_campo_pct) > 0, "Aplicación directa a campo de los estiércoles desde el alojamiento sin almacenamiento exterior previo", false),
];

const alojamientos: Grupo = {
  tipo: "grupo",
  id: "alojamientos",
  nombre: es("alojamiento"),
  pregunta: es("Ahora vamos nave por nave. Añade cada alojamiento de la granja."),
  ayuda: es("Un alojamiento son las naves con la misma clase de animales, la misma instalación y el mismo manejo."),
  visible: huboActividad,
  campoTitulo: "identificador",
  minimo: 1,
  campos: [...alojamientoPaso2, ...alojamientoPaso4, ...alojamientoPaso5],
};

// Paso 5 de los almacenamientos exteriores (se pregunta después de los alojamientos).
const aplicacionDesdeAlmacenamientos: Grupo[] = [
  {
    tipo: "grupo",
    id: "almacenamientos_purin",
    nombre: es("balsa o depósito de purín"),
    pregunta: es("¿Cómo echas al campo el purín de cada balsa o depósito?"),
    fijo: true,
    visible: (c) => huboActividad(c) && (c.especie === "porcino" || c.raiz.aves_separacion_sl === true),
    campoTitulo: "identificador",
    campos: aplicacionCampo("aplicacion", (c) => Number(c.item.destino_campo_pct) > 0, "Aplicación a campo de los purines desde el sistema de almacenamiento exterior", true),
  },
  {
    tipo: "grupo",
    id: "almacenamientos_estiercol",
    nombre: es("estercolero"),
    pregunta: es("¿Cómo echas al campo el estiércol de cada estercolero?"),
    fijo: true,
    visible: huboActividad,
    campoTitulo: "identificador",
    campos: aplicacionCampo("aplicacion", (c) => Number(c.item.destino_campo_pct) > 0, "Aplicación a campo de los estiércoles desde el sistema de almacenamiento exterior", false),
  },
];

// =====================================================================
// PASO 6 — Consumos (solo granjas con AAI; decisión del 13-oct-2026)
// =====================================================================
const visibleP6 = y(huboActividad, tieneAai);
const paso6: Nodo[] = [
  campo({ tipo: "cantidades", id: "combustibles", lista: "combustibles", paso: 6, seccion: "Combustible", visible: visibleP6, etiqueta: "¿Cuál es el consumo anual?", pregunta: es("¿Qué combustibles gastaste en la granja el año pasado y cuánto? (mira las facturas)"), decimales: 2 }),
  campo({ tipo: "cantidades", id: "combustibles_registro", lista: "combustibles", paso: 6, seccion: "Combustible", visible: visibleP6, etiqueta: "¿Realiza registro de tales consumos?", pregunta: es("¿De cuáles llevas un registro? (marca con 1)"), decimales: 0, verificado: false }),
  campo({ tipo: "numero", id: "electricidad_kwh", paso: 6, seccion: "Electricidad", visible: visibleP6, etiqueta: "¿Cuál es el consumo anual de energía suministrada por una empresa comercializadora? (kWh/año)", pregunta: es("¿Cuántos kWh de luz consumiste el año pasado? (suma de las facturas)"), ayuda: es("No incluyas la energía de tus placas solares."), unidad: "kWh/año", decimales: 3, rango: { min: 0 } }),
  campo({ tipo: "texto", id: "electricidad_comercializadora", paso: 6, seccion: "Electricidad", visible: visibleP6, etiqueta: "Compañía comercializadora", pregunta: es("¿Con qué compañía tienes la luz?"), verificado: false }),
  campo({ tipo: "check", id: "electricidad_registro", paso: 6, seccion: "Electricidad", visible: visibleP6, etiqueta: "Existe registro del consumo", pregunta: es("¿Llevas un registro del consumo de luz?") }),
  campo({ tipo: "check", id: "renovable_propia", paso: 6, seccion: "Electricidad", visible: visibleP6, etiqueta: "Además se produce y consume energía renovable en la granja", pregunta: es("¿Produces tu propia energía renovable (placas solares…)?") }),
  campo({ tipo: "cantidades", id: "agua", lista: "fuentes_agua", paso: 6, seccion: "Suministro hidráulico", visible: visibleP6, etiqueta: "¿Cuál es el consumo anual de...? (m3/año)", pregunta: es("¿Cuántos m³ de agua gastaste el año pasado y de dónde viene?"), decimales: 2 }),
  campo({ tipo: "cantidades", id: "agua_registro", lista: "fuentes_agua", paso: 6, seccion: "Suministro hidráulico", visible: visibleP6, etiqueta: "¿Existe registro del consumo?", pregunta: es("¿De qué fuentes llevas un registro? (marca con 1)"), decimales: 0, verificado: false }),
  campo({ tipo: "check", id: "deteccion_fugas", paso: 6, seccion: "Suministro hidráulico", visible: visibleP6, etiqueta: "Dispone de un sistema de detección de fugas", pregunta: es("¿Tienes sistema para detectar fugas de agua?") }),
  campo({ tipo: "check", id: "calibracion_agua", paso: 6, seccion: "Suministro hidráulico", visible: visibleP6, etiqueta: "Comprueba y ajusta periódicamente (al menos una vez al año) la calibración de los equipos de suministro de agua", pregunta: es("¿Revisas y ajustas los equipos de agua al menos una vez al año?") }),
  campo({ tipo: "check", id: "reutiliza_lluvia", paso: 6, seccion: "Suministro hidráulico", visible: visibleP6, etiqueta: "Reutiliza las aguas de lluvia no contaminadas como aguas de lavado", pregunta: es("¿Usas agua de lluvia para limpiar?") }),
  campo({ tipo: "check", id: "gestion_aguas_residuales", paso: 6, seccion: "Gestión de aguas residuales", visible: visibleP6, etiqueta: "Dispone de un sistema de gestión de aguas residuales", pregunta: es("¿Recoges o tratas las aguas sucias (de limpieza, lluvia con estiércol)?") }),
  campo({ tipo: "check", id: "reduce_aguas_residuales", paso: 6, seccion: "Gestión de aguas residuales", visible: visibleP6, etiqueta: "Reduce la generación de aguas residuales", pregunta: es("¿Haces algo para generar menos aguas sucias?") }),
];

// Pregunta auxiliar para aves: en aves el purín solo existe si separan la fracción líquida.
const avesSeparacion = campo({
  tipo: "si_no",
  id: "aves_separacion_sl",
  paso: 3,
  seccion: "Sistemas de almacenamiento del purín",
  especies: ["aves_carne", "aves_puesta", "pavos"],
  visible: huboActividad,
  etiqueta: "Dispone de instalación para el almacenamiento exterior del purín",
  pregunta: es("¿Separas una fracción líquida del estiércol y la guardas aparte?"),
  ayuda: es("En la mayoría de granjas de aves la respuesta es NO."),
  soloFormulario: true,
});

/** Árbol completo en orden del formulario. */
export const CATALOGO: Nodo[] = [
  ...paso1,
  avesSeparacion,
  almacenamientoPurin,
  almacenamientoEstiercol,
  alojamientos,
  ...aplicacionDesdeAlmacenamientos,
  ...paso6,
];
