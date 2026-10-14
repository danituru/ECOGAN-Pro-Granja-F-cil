import { describe, expect, it } from "vitest";
import { calcularUgmAves, comprobarObligacion } from "@/domain/obligacion";

describe("comprobador de obligación — porcino (RD 306/2020)", () => {
  it("intensivo de producción: obligada", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "produccion", sistemaPorcino: "intensivo", reproductoras: 0, plazasCebo: 2000 }).estado).toBe("obligada");
  });
  it("extensivo: exenta", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "produccion", sistemaPorcino: "extensivo" }).estado).toBe("exenta");
  });
  it("mixto: obligada por la parte intensiva", () => {
    const r = comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "produccion", sistemaPorcino: "mixto", reproductoras: 100, plazasCebo: 500 });
    expect(r.estado).toBe("obligada");
    expect(r.motivo).toMatch(/intensivo/);
  });
  it("reducida y autoconsumo según REGA: exentas", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "reducida" }).estado).toBe("exenta");
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "autoconsumo" }).estado).toBe("exenta");
  });
  it("tamaño de reducida pero clasificada como producción: hay que revisar", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "produccion", sistemaPorcino: "intensivo", reproductoras: 4, plazasCebo: 20 }).estado).toBe("revisar");
  });
  it("no sabe el sistema: revisar", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "produccion", sistemaPorcino: "no_lo_se", reproductoras: 300, plazasCebo: 0 }).estado).toBe("revisar");
  });
  it("centros de concentración y tratantes: revisar (posible obligación)", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "centro_concentracion" }).estado).toBe("revisar");
  });
  it("matadero o núcleo zoológico: exenta", () => {
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "matadero" }).estado).toBe("exenta");
    expect(comprobarObligacion({ tipoAnimal: "porcino", clasificacion: "nucleo_zoologico" }).estado).toBe("exenta");
  });
});

describe("comprobador de obligación — aves (RD 637/2021)", () => {
  it("UGM del Anexo I", () => {
    expect(calcularUgmAves({ broiler: 333 })).toBeCloseTo(0.999, 3);
    expect(calcularUgmAves({ gallina_ponedora: 200 })).toBe(1);
    expect(calcularUgmAves({ pavo_engorde: 100, pollita_recria: 1000 })).toBe(1.5);
  });
  it("granja de pollos de producción: obligada", () => {
    expect(comprobarObligacion({ tipoAnimal: "pollos", clasificacion: "produccion", plazasAves: { broiler: 30000 }, comercializa: true }).estado).toBe("obligada");
  });
  it("≤ 0,15 UGM sin vender: autoconsumo, exenta", () => {
    const r = comprobarObligacion({ tipoAnimal: "ponedoras", clasificacion: "no_lo_se", plazasAves: { gallina_ponedora: 30 }, comercializa: false });
    expect(r.estado).toBe("exenta");
    expect(r.motivo).toMatch(/autoconsumo/);
  });
  it("≤ 0,75 UGM vendiendo: reducida, exenta", () => {
    const r = comprobarObligacion({ tipoAnimal: "ponedoras", clasificacion: "no_lo_se", plazasAves: { gallina_ponedora: 150 }, comercializa: true });
    expect(r.estado).toBe("exenta");
    expect(r.motivo).toMatch(/reducida/);
  });
  it("> 0,75 UGM sin clasificación conocida: obligada", () => {
    expect(comprobarObligacion({ tipoAnimal: "pavos", clasificacion: "no_lo_se", plazasAves: { pavo_engorde: 500 } }).estado).toBe("obligada");
  });
  it("especiales, mataderos, incubadoras y cinegéticas: exentas", () => {
    for (const c of ["tratante", "centro_concentracion", "matadero", "incubadora", "cinegetica"] as const) {
      expect(comprobarObligacion({ tipoAnimal: "pollos", clasificacion: c }).estado).toBe("exenta");
    }
  });
  it("otras aves (patos, codornices…): exentas", () => {
    expect(comprobarObligacion({ tipoAnimal: "otra_ave", clasificacion: "produccion" }).estado).toBe("exenta");
  });
  it("sin datos de capacidad ni clasificación: revisar", () => {
    expect(comprobarObligacion({ tipoAnimal: "pollos", clasificacion: "no_lo_se" }).estado).toBe("revisar");
  });
});
