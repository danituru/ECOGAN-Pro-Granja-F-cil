/**
 * Comprobador de obligación de declarar en ECOGAN.
 * Reglas y fuentes: docs/investigacion.md §2.
 *  - Porcino: RD 306/2020 (arts. 1.3, 2.2.f-g, 16.2) e informe anual MTD porcino 2024 (universo obligado).
 *  - Aves: RD 637/2021 (art. 2, art. 1.8, Anexo I de UGM) y manuales ECOGAN aves feb-2026.
 */

export type TipoAnimalComprobador =
  | "porcino"
  | "pollos" // broilers, pollitas de recría y reproductoras de carne
  | "ponedoras"
  | "pavos"
  | "otra_ave"; // patos, codornices, perdices, faisanes, ocas, pintadas, avestruces…

/** Clasificación de la explotación tal como figura en el REGA. */
export type ClasificacionRega =
  | "produccion"
  | "autoconsumo"
  | "reducida"
  | "tratante" // explotación especial de tratantes u operadores comerciales
  | "centro_concentracion"
  | "punto_parada"
  | "matadero"
  | "incubadora"
  | "cinegetica"
  | "nucleo_zoologico" // núcleos zoológicos / tenencia no comercial / cuarentena
  | "otra_especial"
  | "no_lo_se";

export interface EntradaComprobador {
  tipoAnimal: TipoAnimalComprobador;
  clasificacion: ClasificacionRega;
  /** Solo porcino. */
  sistemaPorcino?: "intensivo" | "extensivo" | "mixto" | "no_lo_se";
  /** Porcino: número máximo de cerdas reproductoras. */
  reproductoras?: number;
  /** Porcino: plazas de cebo. */
  plazasCebo?: number;
  /** Aves: capacidad máxima por tipo (plazas). */
  plazasAves?: Partial<Record<TipoPlazaAve, number>>;
  /** Aves: ¿vende animales, carne o huevos? */
  comercializa?: boolean;
}

export type TipoPlazaAve =
  | "gallina_ponedora"
  | "pollita_recria"
  | "reproductora_pesada"
  | "reproductora_ligera"
  | "broiler"
  | "pavo_reproductor"
  | "pavo_engorde";

/** Anexo I del RD 637/2021: UGM por plaza. */
export const UGM_AVES: Record<TipoPlazaAve, number> = {
  gallina_ponedora: 0.005,
  pollita_recria: 0.001,
  reproductora_pesada: 0.005,
  reproductora_ligera: 0.004,
  broiler: 0.003,
  pavo_reproductor: 0.01,
  pavo_engorde: 0.005,
};

export type Resultado =
  | { estado: "obligada"; motivo: string }
  | { estado: "exenta"; motivo: string }
  | { estado: "revisar"; motivo: string };

export function calcularUgmAves(plazas: Partial<Record<TipoPlazaAve, number>> = {}): number {
  let total = 0;
  for (const [tipo, n] of Object.entries(plazas) as [TipoPlazaAve, number][]) {
    if (n && n > 0) total += n * UGM_AVES[tipo];
  }
  return Math.round(total * 10000) / 10000;
}

export function comprobarObligacion(e: EntradaComprobador): Resultado {
  if (e.tipoAnimal === "otra_ave") {
    return {
      estado: "exenta",
      motivo: "En aves, ECOGAN solo es obligatorio para gallinas (pollos y ponedoras) y pavos.",
    };
  }
  return e.tipoAnimal === "porcino" ? comprobarPorcino(e) : comprobarAves(e);
}

function comprobarPorcino(e: EntradaComprobador): Resultado {
  switch (e.clasificacion) {
    case "autoconsumo":
      return { estado: "exenta", motivo: "Las granjas porcinas de autoconsumo no tienen que declarar (RD 306/2020)." };
    case "reducida":
      return { estado: "exenta", motivo: "Las granjas porcinas reducidas no tienen que declarar (RD 306/2020)." };
    case "nucleo_zoologico":
    case "matadero":
    case "incubadora":
    case "cinegetica":
    case "otra_especial":
      return { estado: "exenta", motivo: "Las explotaciones especiales de porcino no tienen que declarar." };
    case "tratante":
    case "centro_concentracion":
    case "punto_parada":
      // El informe anual MTD porcino 2024 excluye las especiales "a excepción de los centros de
      // concentración, las explotaciones de tratantes u operadores comerciales y los puntos de parada".
      // TODO: verificar normativa con la CCAA antes de aceptar a estos clientes.
      return {
        estado: "revisar",
        motivo: "Los centros de concentración, tratantes y puntos de parada pueden estar obligados. Lo revisamos contigo.",
      };
    default:
      break;
  }

  if (e.sistemaPorcino === "extensivo") {
    return { estado: "exenta", motivo: "El porcino en extensivo no tiene que declarar en ECOGAN (RD 306/2020, art. 1.3)." };
  }

  const pareceReducida =
    e.reproductoras !== undefined &&
    e.plazasCebo !== undefined &&
    e.reproductoras <= 5 &&
    e.plazasCebo <= 25;
  const pareceAutoconsumo = e.reproductoras === 0 && e.plazasCebo !== undefined && e.plazasCebo <= 3;

  if (pareceAutoconsumo || pareceReducida) {
    return {
      estado: "revisar",
      motivo:
        "Por tamaño podría ser una granja reducida o de autoconsumo, que no declaran. Comprueba la clasificación de tu granja en el REGA.",
    };
  }
  if (e.sistemaPorcino === "no_lo_se" || e.sistemaPorcino === undefined || e.clasificacion === "no_lo_se") {
    return {
      estado: "revisar",
      motivo: "Necesitamos confirmar si tu granja es intensiva y su clasificación en el REGA.",
    };
  }
  if (e.sistemaPorcino === "mixto") {
    return { estado: "obligada", motivo: "Tienes que declarar la parte de la granja en intensivo." };
  }
  return { estado: "obligada", motivo: "Las granjas de porcino intensivo tienen que comunicar sus datos a ECOGAN." };
}

function comprobarAves(e: EntradaComprobador): Resultado {
  switch (e.clasificacion) {
    case "autoconsumo":
    case "reducida":
      return { estado: "exenta", motivo: "Las granjas avícolas reducidas y de autoconsumo no tienen que declarar (RD 637/2021)." };
    case "tratante":
    case "centro_concentracion":
    case "matadero":
    case "incubadora":
    case "cinegetica":
    case "nucleo_zoologico":
    case "punto_parada":
    case "otra_especial":
      return { estado: "exenta", motivo: "Este tipo de explotación avícola no tiene que declarar en ECOGAN." };
    default:
      break;
  }

  if (e.plazasAves && Object.keys(e.plazasAves).length > 0) {
    const ugm = calcularUgmAves(e.plazasAves);
    // RD 637/2021 art. 2: autoconsumo ≤ 0,15 UGM sin comercializar; reducida ≤ 0,75 UGM.
    if (ugm <= 0.15 && e.comercializa === false) {
      return { estado: "exenta", motivo: `Con ${fmt(ugm)} UGM y sin vender, es una granja de autoconsumo.` };
    }
    if (ugm <= 0.75) {
      return { estado: "exenta", motivo: `Con ${fmt(ugm)} UGM es una granja reducida, que no declara.` };
    }
    if (e.clasificacion === "no_lo_se") {
      return { estado: "obligada", motivo: `Con ${fmt(ugm)} UGM tu granja tiene que declarar en ECOGAN.` };
    }
  } else if (e.clasificacion === "no_lo_se") {
    return { estado: "revisar", motivo: "Necesitamos saber cuántas aves caben en tu granja para confirmarlo." };
  }
  return { estado: "obligada", motivo: "Las granjas de pollos, gallinas ponedoras y pavos tienen que comunicar sus datos a ECOGAN." };
}

const fmt = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 3 });
