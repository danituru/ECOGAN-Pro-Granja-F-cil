import { z } from "zod";
import { COMUNIDADES } from "./comunidades";
import { ESPECIES } from "./especies";
import { esCifValido, esNifPersonaValido, esRegaValido, normalizar, normalizarRega } from "./identificadores";

export const VERSION_TERMINOS = "2026-10-15";

const telefono = z
  .string()
  .trim()
  .transform((t) => t.replace(/[\s.-]/g, ""))
  .refine((t) => /^(\+?\d{9,15})$/.test(t), "Escribe un teléfono válido");

export const esquemaGranja = z.object({
  rega: z.string().trim().transform(normalizarRega).refine(esRegaValido, "El código REGA es ES seguido de 12 números"),
  nombre: z.string().trim().max(120).optional(),
  comunidad: z.enum(COMUNIDADES, { message: "Elige la comunidad autónoma" }),
  municipio: z.string().trim().min(2, "Escribe el municipio").max(120),
  especie: z.enum(ESPECIES, { message: "Elige los animales" }),
  capacidad: z.coerce.number({ message: "Escribe las plazas" }).int("Sin decimales").min(1, "Escribe las plazas").max(10_000_000),
  integrada: z.boolean().default(false),
  integradora: z.string().trim().max(120).optional(),
  sinActividad: z.boolean().default(false),
});

export const esquemaAlta = z
  .object({
    tipo: z.enum(["fisica", "juridica"]),
    nombre: z.string().trim().min(2, "Escribe el nombre").max(120),
    apellidos: z.string().trim().max(160).optional(),
    nif: z.string().trim().transform(normalizar),
    representanteNombre: z.string().trim().max(160).optional(),
    representanteNif: z.string().trim().transform(normalizar).optional(),
    email: z.email("Escribe un correo válido").trim().toLowerCase(),
    telefono,
    direccion: z.string().trim().min(3, "Escribe la dirección").max(200),
    municipio: z.string().trim().min(2, "Escribe el municipio").max(120),
    provincia: z.string().trim().min(2, "Escribe la provincia").max(80),
    codigoPostal: z.string().trim().regex(/^\d{5}$/, "5 números"),
    granjas: z.array(esquemaGranja).min(1, "Añade al menos una granja").max(50),
    aceptaTerminos: z.literal(true, { message: "Tienes que aceptar los términos" }),
    aceptaPrivacidad: z.literal(true, { message: "Tienes que aceptar la política de privacidad" }),
    aceptaEncargo: z.literal(true, { message: "Tienes que aceptar el encargo" }),
  })
  .superRefine((a, ctx) => {
    if (a.tipo === "fisica") {
      if (!esNifPersonaValido(a.nif)) ctx.addIssue({ code: "custom", path: ["nif"], message: "DNI o NIE no válido" });
      if (!a.apellidos || a.apellidos.length < 2) ctx.addIssue({ code: "custom", path: ["apellidos"], message: "Escribe los apellidos" });
    } else {
      if (!esCifValido(a.nif)) ctx.addIssue({ code: "custom", path: ["nif"], message: "CIF no válido" });
      if (!a.representanteNombre || a.representanteNombre.length < 3)
        ctx.addIssue({ code: "custom", path: ["representanteNombre"], message: "Escribe quién representa a la empresa" });
      if (!a.representanteNif || !esNifPersonaValido(a.representanteNif))
        ctx.addIssue({ code: "custom", path: ["representanteNif"], message: "DNI o NIE del representante no válido" });
    }
    const vistos = new Set<string>();
    a.granjas.forEach((g, i) => {
      const k = `${g.rega}|${g.especie}`;
      if (vistos.has(k)) ctx.addIssue({ code: "custom", path: ["granjas", i, "rega"], message: "Esta granja está repetida" });
      vistos.add(k);
    });
  });

export type Alta = z.infer<typeof esquemaAlta>;
export type EntradaAlta = z.input<typeof esquemaAlta>;
