import type { Especie } from "../especies";
import type { TextoIdiomas } from "../configuracion";

/** Pasos de la aplicación ECOGAN (manuales feb-2026). */
export type PasoEcogan = 1 | 2 | 3 | 4 | 5 | 6;

export const NOMBRE_PASO: Record<PasoEcogan, string> = {
  1: "Paso 1: Datos granja",
  2: "Paso 2: Alojamientos",
  3: "Paso 3: Sistemas de almacenamiento exterior",
  4: "Paso 4: Gestión de los alojamientos",
  5: "Paso 5: Uso agrícola",
  6: "Paso 6: Consumos y gestión de aguas residuales",
};

export type Valor = string | number | boolean | null | undefined | Item[] | Record<string, number>;
export interface Item {
  _id: string;
  [clave: string]: Valor;
}
export type Datos = Record<string, Valor>;

/** Contexto para evaluar condiciones de visibilidad y obligatoriedad. */
export interface Ctx {
  especie: Especie;
  /** Datos de toda la campaña (raíz). */
  raiz: Datos;
  /** Elemento actual cuando el campo está dentro de un grupo repetible (alojamiento, pienso…). */
  item: Datos;
  /** Elemento padre (p. ej. el alojamiento de un pienso). */
  padre?: Datos;
}

export type Condicion = (ctx: Ctx) => boolean;

export type TipoCampo =
  | "si_no" // desplegable SÍ/NO de ECOGAN o pregunta de sí/no
  | "check" // casilla de ECOGAN (marcada / no marcada)
  | "opcion" // desplegable con lista configurable
  | "referencia" // desplegable cuyas opciones son elementos de otro grupo (p. ej. balsas)
  | "numero"
  | "entero"
  | "anio"
  | "texto"
  | "cantidades" // varias opciones con una cantidad cada una (materiales de cama, combustibles)
  | "lotes" // tabla de lotes del año (ayuda del formulario para calcular medias)
  | "calculado"; // no lo pregunta el formulario; se calcula de otros datos

export interface Campo {
  tipo: TipoCampo;
  id: string;
  paso: PasoEcogan;
  /** Subapartado de ECOGAN (cabecera verde en la aplicación). */
  seccion: string;
  /** Etiqueta exacta de ECOGAN para la ficha de presentación. */
  etiqueta: string;
  /** Pregunta para el ganadero, en lenguaje llano. */
  pregunta: TextoIdiomas;
  ayuda?: TextoIdiomas;
  /** Obligatorio en ECOGAN (*). */
  obligatorio?: boolean | Condicion;
  visible?: Condicion;
  especies?: Especie[];
  lista?: string | ((ctx: Ctx) => string);
  /** Para tipo "referencia": id del grupo raíz cuyos elementos son las opciones. */
  referencia?: string;
  unidad?: string | ((ctx: Ctx) => string);
  decimales?: number;
  /** Rango razonable: fuera de él se avisa (no bloquea). */
  rango?: { min?: number; max?: number };
  /** Valor sugerido (p. ej. calculado a partir de los lotes). */
  sugerencia?: (ctx: Ctx) => Valor;
  /** Para tipo "calculado". */
  calcular?: (ctx: Ctx) => Valor;
  /** false si la etiqueta o las opciones no se han podido verificar en ECOGAN. TODO: verificar normativa. */
  verificado?: boolean;
  /** El campo no es de ECOGAN: es una ayuda del formulario (p. ej. lotes). No sale en la ficha. */
  soloFormulario?: boolean;
}

export interface Grupo {
  tipo: "grupo";
  id: string;
  /** Nombre del elemento en singular para el formulario ("alojamiento", "pienso"). */
  nombre: TextoIdiomas;
  /** Pregunta de introducción del grupo. */
  pregunta: TextoIdiomas;
  ayuda?: TextoIdiomas;
  especies?: Especie[];
  visible?: Condicion;
  /** Campo del elemento que se usa como título. */
  campoTitulo: string;
  /** Mínimo de elementos (p. ej. al menos un alojamiento). */
  minimo?: number;
  /**
   * El grupo vuelve a recorrer elementos ya creados en otro punto del formulario
   * (p. ej. el paso 5 de cada balsa). No se pueden añadir ni quitar elementos aquí.
   */
  fijo?: boolean;
  campos: Nodo[];
}

export type Nodo = Campo | Grupo;

export const esGrupo = (n: Nodo): n is Grupo => n.tipo === "grupo";
