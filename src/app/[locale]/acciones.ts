"use server";

import { headers } from "next/headers";
import { esquemaReserva } from "@/domain/reserva";
import { NOMBRE_ESPECIE, type Especie } from "@/domain/especies";
import { env } from "@/lib/env";
import { avisarOperador, enlaceWhatsApp } from "@/lib/email";
import { supabaseSistema } from "@/lib/supabase/server";

export type EstadoReserva = { ok: true } | { ok: false; errores: Record<string, string>; general?: string } | null;

export async function reservarPlaza(_previo: EstadoReserva, form: FormData): Promise<EstadoReserva> {
  const entrada = Object.fromEntries(form.entries());
  const r = esquemaReserva.safeParse({ ...entrada, aceptaPrivacidad: entrada.aceptaPrivacidad === "on" });
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    // Si solo falla el campo trampa, fingimos éxito para no dar pistas al robot.
    if (Object.keys(errores).length === 1 && errores.web) return { ok: true };
    return { ok: false, errores };
  }
  const d = r.data;
  const idioma = String(entrada.idioma ?? "es");
  const origen = (await headers()).get("referer") ?? null;

  if (env.supabaseUrl && env.supabaseServiceKey) {
    const { error } = await supabaseSistema().from("reservas").insert({
      nombre: d.nombre,
      telefono: d.telefono,
      email: d.email ?? null,
      comunidad: d.comunidad,
      especie: d.especie,
      numero_granjas: d.numeroGranjas,
      mensaje: d.mensaje || null,
      idioma,
      origen,
      acepta_privacidad: true,
    });
    if (error) {
      console.error("Error guardando reserva", error);
      return { ok: false, errores: {}, general: "No hemos podido guardar tu reserva. Llámanos o inténtalo de nuevo." };
    }
  } else {
    console.info("[reserva en modo pruebas, no se guarda]", d);
  }

  const especie = d.especie === "varias" ? "Varias especies" : NOMBRE_ESPECIE[d.especie as Especie];
  try {
    await avisarOperador(
      `Nueva reserva: ${d.nombre} (${d.comunidad}, ${d.numeroGranjas} granja${d.numeroGranjas > 1 ? "s" : ""})`,
      [
        `Nombre: ${d.nombre}`,
        `Teléfono: ${d.telefono}`,
        `Correo: ${d.email ?? "—"}`,
        `Comunidad: ${d.comunidad}`,
        `Animales: ${especie}`,
        `Granjas: ${d.numeroGranjas}`,
        `Mensaje: ${d.mensaje || "—"}`,
        "",
        `WhatsApp: ${enlaceWhatsApp(d.telefono, `Hola ${d.nombre}, soy Daniel de GranjaFácil. Gracias por reservar tu plaza para el ECOGAN.`)}`,
      ].join("\n"),
    );
  } catch (e) {
    // La reserva ya está guardada: un fallo del correo no debe perderla.
    console.error("No se pudo avisar al operador", e);
  }
  return { ok: true };
}
