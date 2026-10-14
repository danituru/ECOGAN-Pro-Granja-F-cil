/** Especies que declaran en ECOGAN y que cubre GranjaFácil (ver docs/investigacion.md §2). */
export const ESPECIES = ["porcino", "aves_carne", "aves_puesta", "pavos"] as const;
export type Especie = (typeof ESPECIES)[number];

export const NOMBRE_ESPECIE: Record<Especie, string> = {
  porcino: "Porcino",
  aves_carne: "Aves de carne (pollos)",
  aves_puesta: "Gallinas ponedoras",
  pavos: "Pavos",
};

export const esAve = (e: Especie) => e !== "porcino";
