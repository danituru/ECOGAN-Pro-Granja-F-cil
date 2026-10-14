import { describe, expect, it } from "vitest";
import { accionesPosibles, transicion } from "@/domain/estados";
import { calcularPresupuesto, PRECIOS_POR_DEFECTO, precioBase } from "@/domain/precios";

describe("estados de la campaña", () => {
  it("flujo completo: pago → autorización → datos → revisión → ECOGAN → justificante", () => {
    let e = transicion("sin_empezar", "pagar");
    expect(e).toBe("autorizacion_pendiente");
    e = transicion(e, "marcar_autorizado");
    expect(e).toBe("recogiendo_datos");
    e = transicion(e, "enviar_datos");
    e = transicion(e, "aprobar_revision");
    expect(e).toBe("lista_para_ecogan");
    e = transicion(e, "marcar_comunicada");
    e = transicion(e, "enviar_justificante");
    expect(e).toBe("justificante_enviado");
  });
  it("no se pueden recoger datos sin estar autorizado", () => {
    expect(() => transicion("autorizacion_pendiente", "enviar_datos")).toThrow();
  });
  it("no se presenta sin revisión humana", () => {
    expect(() => transicion("pendiente_revision", "marcar_comunicada")).toThrow();
  });
  it("el operador puede devolver al ganadero para corregir", () => {
    expect(transicion("pendiente_revision", "devolver_a_ganadero")).toBe("recogiendo_datos");
  });
  it("sin actividad solo tras la autorización", () => {
    expect(() => transicion("autorizacion_pendiente", "declarar_sin_actividad")).toThrow();
    expect(transicion("recogiendo_datos", "declarar_sin_actividad")).toBe("sin_actividad");
  });
  it("acciones posibles", () => {
    expect(accionesPosibles("autorizacion_pendiente")).toEqual(["marcar_autorizado"]);
  });
});

describe("precios", () => {
  const c = PRECIOS_POR_DEFECTO;
  it("tramo según especie y plazas", () => {
    expect(precioBase(c, { especie: "porcino", plazas: 1500 })).toBe(12000);
    expect(precioBase(c, { especie: "porcino", plazas: 5000 })).toBe(18000);
    expect(precioBase(c, { especie: "pavos", plazas: 100, sinActividad: true })).toBe(4900);
  });
  it("descuento de lanzamiento antes del 15 de diciembre", () => {
    const p = calcularPresupuesto(c, [{ especie: "porcino", plazas: 1500 }], new Date("2026-11-20T10:00:00Z"), 2027);
    expect(p.total).toBe(9600);
  });
  it("recargo de urgencia en febrero", () => {
    const p = calcularPresupuesto(c, [{ especie: "porcino", plazas: 1500 }], new Date("2027-02-10T10:00:00Z"), 2027);
    expect(p.total).toBe(15600);
  });
  it("descuento por volumen a partir de 3 granjas", () => {
    const granjas = [1, 2, 3].map(() => ({ especie: "aves_carne" as const, plazas: 30000 }));
    const p = calcularPresupuesto(c, granjas, new Date("2027-01-10T10:00:00Z"), 2027);
    expect(p.total).toBe(36000 - 3600);
  });
});
