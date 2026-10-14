import { z } from "zod";
import { COMUNIDADES } from "./comunidades";

export const ESPECIES_RESERVA = ["porcino", "aves_carne", "aves_puesta", "pavos", "varias"] as const;

export const esquemaReserva = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(120),
  telefono: z
    .string()
    .trim()
    .transform((t) => t.replace(/[\s.-]/g, ""))
    .refine((t) => /^(\+?\d{9,15})$/.test(t), "Escribe un teléfono válido"),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((e) => (e ? e : undefined))
    .refine((e) => !e || z.email().safeParse(e).success, "Escribe un correo válido"),
  comunidad: z.enum(COMUNIDADES, { message: "Elige tu comunidad autónoma" }),
  especie: z.enum(ESPECIES_RESERVA, { message: "Elige qué animales tienes" }),
  numeroGranjas: z.coerce.number().int().min(1, "Al menos 1 granja").max(500),
  mensaje: z.string().trim().max(1000).optional(),
  aceptaPrivacidad: z.literal(true, { message: "Tienes que aceptar la política de privacidad" }),
  /** Campo trampa contra robots: debe llegar vacío. */
  web: z.string().max(0).optional(),
});

export type Reserva = z.infer<typeof esquemaReserva>;
