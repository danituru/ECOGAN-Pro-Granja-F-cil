import { describe, expect, it } from "vitest";
import { esCifValido, esDniValido, esNieValido, esRegaValido, normalizarRega } from "@/domain/identificadores";
import { esquemaAlta, type EntradaAlta } from "@/domain/alta";

describe("identificadores", () => {
  it("DNI con letra de control", () => {
    expect(esDniValido("12345678Z")).toBe(true);
    expect(esDniValido("12345678A")).toBe(false);
    expect(esDniValido("12.345.678-z")).toBe(true);
  });
  it("NIE", () => {
    expect(esNieValido("X1234567L")).toBe(true);
    expect(esNieValido("X1234567A")).toBe(false);
  });
  it("CIF", () => {
    expect(esCifValido("B12345674")).toBe(true);
    expect(esCifValido("B12345675")).toBe(false);
    expect(esCifValido("F12345674")).toBe(true); // cooperativa, control numérico
    expect(esCifValido("F1234567D")).toBe(true); // o letra
  });
  it("REGA", () => {
    expect(normalizarRega("220150000123")).toBe("ES220150000123");
    expect(esRegaValido("es 2201 5000 0123")).toBe(true);
    expect(esRegaValido("ES2201")).toBe(false);
  });
});

const base: EntradaAlta = {
  tipo: "fisica",
  nombre: "Ana",
  apellidos: "López Pérez",
  nif: "12345678Z",
  email: "Ana@Ejemplo.ES",
  telefono: "600 11 22 33",
  direccion: "Calle Mayor 1",
  municipio: "Fraga",
  provincia: "Huesca",
  codigoPostal: "22520",
  granjas: [{ rega: "220150000123", comunidad: "Aragón", municipio: "Fraga", especie: "porcino", capacidad: 2000, integrada: false, sinActividad: false }],
  aceptaTerminos: true,
  aceptaPrivacidad: true,
  aceptaEncargo: true,
};

describe("formulario de alta", () => {
  it("acepta un alta correcta y normaliza correo, teléfono y REGA", () => {
    const a = esquemaAlta.parse(base);
    expect(a.email).toBe("ana@ejemplo.es");
    expect(a.telefono).toBe("600112233");
    expect(a.granjas[0].rega).toBe("ES220150000123");
  });
  it("una persona necesita DNI/NIE válido y apellidos", () => {
    expect(esquemaAlta.safeParse({ ...base, nif: "B12345674" }).success).toBe(false);
    expect(esquemaAlta.safeParse({ ...base, apellidos: "" }).success).toBe(false);
  });
  it("una empresa necesita CIF y representante con DNI", () => {
    const empresa = { ...base, tipo: "juridica" as const, nombre: "Granjas Ana SL", apellidos: undefined, nif: "B12345674" };
    expect(esquemaAlta.safeParse(empresa).success).toBe(false);
    expect(esquemaAlta.safeParse({ ...empresa, representanteNombre: "Ana López", representanteNif: "12345678Z" }).success).toBe(true);
  });
  it("no admite granjas repetidas ni sin aceptar las condiciones", () => {
    expect(esquemaAlta.safeParse({ ...base, granjas: [base.granjas[0], base.granjas[0]] }).success).toBe(false);
    expect(esquemaAlta.safeParse({ ...base, aceptaEncargo: false }).success).toBe(false);
  });
});
