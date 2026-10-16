import { describe, expect, it } from "vitest";
import { esquemaCampana, esquemaEmpresa, esquemaOperador, esquemaPrecios, validarLista, valorDesdeTexto } from "@/domain/esquemas-config";
import { PRECIOS_POR_DEFECTO } from "@/domain/precios";
import { CONFIG_POR_DEFECTO } from "@/domain/configuracion";
import { listaPorDefecto } from "@/domain/catalogo/opciones";
import { componerResumen, type DatosResumen } from "@/domain/resumen";

describe("configuración editable", () => {
  it("los valores por defecto son válidos", () => {
    expect(esquemaPrecios.safeParse(PRECIOS_POR_DEFECTO).success).toBe(true);
    expect(esquemaCampana.safeParse(CONFIG_POR_DEFECTO.campana).success).toBe(true);
    expect(esquemaOperador.safeParse(CONFIG_POR_DEFECTO.operador).success).toBe(true);
    expect(esquemaEmpresa.safeParse(CONFIG_POR_DEFECTO.empresa).success).toBe(true);
  });

  it("rechaza tramos de precio mal ordenados o sin tramo final", () => {
    const mal = structuredClone(PRECIOS_POR_DEFECTO);
    mal.porEspecie.porcino = [{ hastaPlazas: 2000, importe: 100 }];
    expect(esquemaPrecios.safeParse(mal).success).toBe(false);
    mal.porEspecie.porcino = [{ hastaPlazas: 2000, importe: 100 }, { hastaPlazas: 1000, importe: 100 }, { hastaPlazas: null, importe: 1 }];
    expect(esquemaPrecios.safeParse(mal).success).toBe(false);
    mal.porEspecie.porcino = [{ hastaPlazas: 2000, importe: -1 }, { hastaPlazas: null, importe: 1 }];
    expect(esquemaPrecios.safeParse(mal).success).toBe(false);
  });

  it("la garantía no puede acabar después del plazo", () => {
    expect(esquemaCampana.safeParse({ anioPresentacion: 2027, limiteGarantia: "2027-03-15", finPlazo: "2027-02-28" }).success).toBe(false);
    expect(esquemaCampana.safeParse({ anioPresentacion: 2027, limiteGarantia: "2027-02-15", finPlazo: "2028-02-28" }).success).toBe(false);
  });

  it("valida y normaliza el DNI del autorizado", () => {
    const r = esquemaOperador.safeParse({ ...CONFIG_POR_DEFECTO.operador, nif: "12.345.678-z" });
    expect(r.success && r.data.nif).toBe("12345678Z");
    expect(esquemaOperador.safeParse({ ...CONFIG_POR_DEFECTO.operador, nif: "12345678A" }).success).toBe(false);
  });
});

describe("listas de opciones", () => {
  const original = listaPorDefecto("consistencia_deyeccion");

  it("se pueden corregir textos y añadir opciones", () => {
    const editada = { ...original, opciones: [...original.opciones.map((o) => ({ ...o, etiqueta: o.etiqueta + "." })), { valor: "semiliquida", etiqueta: "Semilíquida" }] };
    expect(validarLista(editada, original)).toBeNull();
  });

  it("no se pueden quitar opciones existentes ni repetir valores", () => {
    expect(validarLista({ ...original, opciones: original.opciones.slice(1) }, original)).toMatch(/No se pueden quitar/);
    expect(validarLista({ ...original, opciones: [...original.opciones, original.opciones[0]] }, original)).toMatch(/mismo valor/);
  });

  it("genera un valor interno limpio", () => {
    expect(valorDesdeTexto("Purín con cama de paja")).toBe("purin_con_cama_de_paja");
  });
});

describe("resumen diario del operador", () => {
  const vacio: DatosResumen = {
    base: "https://x.es",
    diasFinPlazo: 40,
    diasGarantia: 20,
    ayudas: [],
    porVerificar: [],
    porRevisar: [],
    paraEcogan: [],
    sinJustificante: [],
    reservasSinLlamar: 0,
    recordatorios: { enviados: 3, fallos: 0 },
  };

  it("no se envía si no hay nada pendiente", () => {
    expect(componerResumen(vacio)).toBeNull();
  });

  it("lista lo pendiente con enlaces a cada campaña", () => {
    const r = componerResumen({ ...vacio, porRevisar: [{ id: "c1", texto: "Ana · ES1" }], reservasSinLlamar: 2 })!;
    expect(r.asunto).toBe("GranjaFácil: 3 cosas pendientes hoy");
    expect(r.texto).toContain("https://x.es/admin/campana/c1");
    expect(r.texto).toContain("Reservas de la web sin llamar: 2");
  });
});
