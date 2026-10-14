import "server-only";
import { supabaseSistema } from "./supabase/server";
import { enviarCorreo } from "./email";
import { urlBase } from "./url";

/**
 * Enlace de acceso sin contraseña. Lo genera Supabase (sin enviar nada) y lo mandamos nosotros
 * con Resend, para tener un único sistema de correo. El enlace caduca según la configuración de
 * Supabase Auth (1 hora por defecto) y solo sirve una vez.
 */
export async function crearEnlaceAcceso(email: string, destino = "/mi-area", base?: string): Promise<string> {
  const { data, error } = await supabaseSistema().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw new Error(`No se pudo crear el enlace de acceso: ${error?.message}`);
  const url = new URL("/auth/confirmar", base ?? (await urlBase()));
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("destino", destino);
  return url.toString();
}

/** Busca o crea la cuenta de un correo. Devuelve si la cuenta es nueva. */
export async function obtenerOCrearUsuario(email: string): Promise<{ id: string; nuevo: boolean }> {
  const sistema = supabaseSistema();
  const creado = await sistema.auth.admin.createUser({ email, email_confirm: true });
  if (creado.data.user) return { id: creado.data.user.id, nuevo: true };
  // Ya existía: generateLink devuelve el usuario sin enviar ningún correo.
  const existente = await sistema.auth.admin.generateLink({ type: "magiclink", email });
  if (existente.data.user) return { id: existente.data.user.id, nuevo: false };
  throw new Error(`No se pudo crear la cuenta: ${creado.error?.message ?? existente.error?.message}`);
}

export async function enviarEnlaceAcceso(email: string, nombre: string, motivo: string, destino = "/mi-area", base?: string) {
  const enlace = await crearEnlaceAcceso(email, destino, base);
  await enviarCorreo({
    para: email,
    asunto: "Tu enlace para entrar en GranjaFácil",
    texto: [
      `Hola ${nombre}:`,
      "",
      motivo,
      "",
      `Pulsa este enlace para entrar (caduca en 1 hora y solo sirve una vez):`,
      enlace,
      "",
      "Si no has pedido este correo, ignóralo.",
      "",
      "GranjaFácil · Un producto de KIVASA",
    ].join("\n"),
  });
}
