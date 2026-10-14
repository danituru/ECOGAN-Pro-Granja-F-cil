/**
 * Configuración editable desde el panel (tabla `configuracion`, una fila por clave).
 * Aquí están los valores por defecto. Los textos legales se guardan por idioma para poder
 * traducirlos al catalán sin tocar código.
 */
import { PRECIOS_POR_DEFECTO, type ConfigPrecios } from "./precios";

export type Idioma = "es" | "ca";
export type TextoIdiomas = { es: string; ca?: string };

export interface Configuracion {
  precios: ConfigPrecios;
  textos: {
    /** Mensaje sobre la obligación. Cambiarlo cuando la reforma del RD 988/2022 salga en el BOE. */
    mensajeObligacion: TextoIdiomas;
    /** Garantía: debe ser idéntica en la landing y en los términos. */
    garantia: TextoIdiomas;
    eslogan: TextoIdiomas;
  };
  campana: {
    /** Año en que se presenta (los datos son del año anterior). */
    anioPresentacion: number;
    /** Fecha límite para que se aplique la garantía (autorización + datos completos). */
    limiteGarantia: string; // YYYY-MM-DD
    /** Último día del plazo oficial. */
    finPlazo: string; // YYYY-MM-DD
  };
  recordatorios: {
    /** Días entre recordatorios. */
    cadaDias: number;
  };
  /**
   * Persona física que actúa como "Autorizado" en ECOGAN (ECOGAN exige DNI/NIE de una persona).
   * Sus datos son los que el ganadero escribe en "Gestión de autorizados" y los del modelo de Aragón.
   */
  operador: {
    nombre: string;
    apellido1: string;
    apellido2: string;
    nif: string;
    email: string;
    telefono: string;
  };
  /** Titular del servicio (responsable del tratamiento y quien factura). Aparece en las páginas legales. */
  empresa: {
    nombreComercial: string;
    razonSocial: string;
    nif: string;
    domicilio: string;
    email: string;
    telefono: string;
    registroMercantil: string;
  };
}

export const CONFIG_POR_DEFECTO: Configuracion = {
  precios: PRECIOS_POR_DEFECTO,
  textos: {
    mensajeObligacion: {
      es: "Tienes que comunicar a ECOGAN siempre que cambien los datos de tu granja (censo, alimentación, técnicas...), lo que en la práctica ocurre casi todos los años.",
    },
    garantia: {
      es: "Si nos autorizas en ECOGAN y completas tus datos antes del 15 de febrero, lo presentamos en plazo o te devolvemos el dinero.",
    },
    eslogan: {
      es: "Tú contestas 10 minutos desde el móvil y nosotros hacemos tu ECOGAN.",
    },
  },
  campana: {
    anioPresentacion: 2027,
    limiteGarantia: "2027-02-15",
    finPlazo: "2027-02-28",
  },
  recordatorios: { cadaDias: 3 },
  operador: { nombre: "Daniel", apellido1: "", apellido2: "", nif: "", email: "", telefono: "" },
  empresa: { nombreComercial: "KIVASA", razonSocial: "", nif: "", domicilio: "", email: "", telefono: "", registroMercantil: "" },
};

export function texto(t: TextoIdiomas, idioma: Idioma): string {
  return (idioma === "ca" && t.ca) || t.es;
}

/** Mezcla superficial por clave de primer nivel: lo guardado en BD sustituye al valor por defecto. */
export function resolverConfiguracion(guardada: Partial<Configuracion> = {}): Configuracion {
  return { ...CONFIG_POR_DEFECTO, ...guardada };
}
