import { describe, expect, it } from "vitest";
import { esquemaReserva } from "@/domain/reserva";

const valida = {
  nombre: "Ana López",
  telefono: "600 12 34 56",
  email: "",
  comunidad: "Aragón",
  especie: "porcino",
  numeroGranjas: "2",
  aceptaPrivacidad: true,
  web: "",
};

describe("formulario de reserva", () => {
  it("acepta una reserva correcta y normaliza el teléfono", () => {
    const r = esquemaReserva.parse(valida);
    expect(r.telefono).toBe("600123456");
    expect(r.numeroGranjas).toBe(2);
    expect(r.email).toBeUndefined();
  });
  it("exige aceptar la privacidad", () => {
    expect(esquemaReserva.safeParse({ ...valida, aceptaPrivacidad: false }).success).toBe(false);
  });
  it("rechaza teléfonos y correos inválidos", () => {
    expect(esquemaReserva.safeParse({ ...valida, telefono: "123" }).success).toBe(false);
    expect(esquemaReserva.safeParse({ ...valida, email: "no-es-un-correo" }).success).toBe(false);
  });
  it("rechaza comunidades y especies que no existen", () => {
    expect(esquemaReserva.safeParse({ ...valida, comunidad: "Atlántida" }).success).toBe(false);
    expect(esquemaReserva.safeParse({ ...valida, especie: "vacas" }).success).toBe(false);
  });
  it("detecta robots por el campo trampa", () => {
    expect(esquemaReserva.safeParse({ ...valida, web: "http://spam" }).success).toBe(false);
  });
});
