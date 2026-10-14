import { describe, expect, it } from "vitest";
import { kgPiensoPlazaCiclo, mediasLotes, plazasOcupadas } from "@/domain/calculos";
import { formatoEcogan, parsearNumero } from "@/domain/formato";

// Ejemplos numéricos de los manuales oficiales de ECOGAN (feb-2026).
describe("medias por lotes (manual porcino §9.6 y §11.1)", () => {
  it("ejemplo 1 cebo: 3 lotes → 1.469 plazas", () => {
    const lotes = [
      { animalesEntran: 1500, animalesSalen: 1440 },
      { animalesEntran: 1800, animalesSalen: 1710 },
      { animalesEntran: 1200, animalesSalen: 1164 },
    ];
    expect(plazasOcupadas(lotes)).toBe(1469);
  });

  it("calcula los animales que salen a partir del % de bajas", () => {
    const lotes = [
      { animalesEntran: 1500, porcentajeBajas: 4 },
      { animalesEntran: 1800, porcentajeBajas: 5 },
      { animalesEntran: 1200, porcentajeBajas: 3 },
    ];
    expect(plazasOcupadas(lotes)).toBe(1469);
  });

  it("ejemplo 2 gestantes: 4 lotes → 782 plazas", () => {
    const lotes = [
      { animalesEntran: 750, animalesSalen: 750 },
      { animalesEntran: 800, animalesSalen: 752 },
      { animalesEntran: 720, animalesSalen: 713 },
      { animalesEntran: 900, animalesSalen: 873 },
    ];
    expect(plazasOcupadas(lotes)).toBe(782);
  });

  it("pesos, periodo productivo y no ocupación por ciclo (medias aritméticas)", () => {
    const m = mediasLotes([
      { animalesEntran: 1500, animalesSalen: 1440, pesoEntrada: 20, pesoSalida: 110, diasOcupacion: 120, diasVacio: 20 },
      { animalesEntran: 1800, animalesSalen: 1710, pesoEntrada: 18, pesoSalida: 105, diasOcupacion: 130, diasVacio: 12 },
      { animalesEntran: 1200, animalesSalen: 1164, pesoEntrada: 19, pesoSalida: 107, diasOcupacion: 135, diasVacio: 19 },
    ]);
    expect(m.pesoInicio).toBe(19);
    expect(m.pesoFin).toBe(107.3);
    expect(m.periodoProductivo).toBe(128);
    expect(m.periodoNoOcupacion).toBe(17);
    expect(m.plazasOcupadas).toBe(1469);
  });

  it("sin datos de salida no inventa plazas", () => {
    expect(plazasOcupadas([{ animalesEntran: 100 }])).toBeNull();
  });
});

describe("pienso en aves (manual aves de carne §11.1.5)", () => {
  it("pollos: 22.892,8 kg, 5.200 plazas, 41+24 días → 0,784 kg/plaza/ciclo", () => {
    expect(kgPiensoPlazaCiclo(22892.8, 5200, 41, 24)).toBe(0.784);
  });
  it("pollitas: 4.968,6 kg, 1.250 plazas, 147+35 días → 1,982 kg/plaza/ciclo", () => {
    expect(kgPiensoPlazaCiclo(4968.6, 1250, 147, 35)).toBe(1.982);
  });
});

describe("formato ECOGAN", () => {
  it("coma decimal y sin separador de miles", () => {
    expect(formatoEcogan(1469)).toBe("1469");
    expect(formatoEcogan(107.33, 1)).toBe("107,3");
    expect(formatoEcogan(22892.8, 2)).toBe("22892,80");
    expect(formatoEcogan(0.7841, 3)).toBe("0,784");
    expect(formatoEcogan(undefined)).toBe("");
  });
  it("entiende lo que escribe el ganadero", () => {
    expect(parsearNumero("1.234,5")).toBe(1234.5);
    expect(parsearNumero("1234.5")).toBe(1234.5);
    expect(parsearNumero("12.345")).toBe(12345);
    expect(parsearNumero("0,784")).toBe(0.784);
    expect(parsearNumero("1 469")).toBe(1469);
    expect(parsearNumero("abc")).toBeNull();
    expect(parsearNumero("")).toBeNull();
  });
});
