import "server-only";
import { Resend } from "resend";
import { env, hayEmail } from "./env";

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  adjuntos?: { nombre: string; contenido: Buffer }[];
}

/** Envía un correo. Sin RESEND_API_KEY lo escribe en la consola (modo pruebas). */
export async function enviarCorreo(c: Correo): Promise<void> {
  if (!hayEmail()) {
    console.info(`[correo de prueba] Para: ${c.para} · ${c.asunto}\n${c.texto}`);
    return;
  }
  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to: c.para,
    subject: c.asunto,
    text: c.texto,
    attachments: c.adjuntos?.map((a) => ({ filename: a.nombre, content: a.contenido })),
  });
  if (error) throw new Error(`No se pudo enviar el correo: ${error.message}`);
}

export async function avisarOperador(asunto: string, texto: string) {
  if (!env.emailOperador) {
    console.info(`[aviso al operador] ${asunto}\n${texto}`);
    return;
  }
  await enviarCorreo({ para: env.emailOperador, asunto, texto });
}

/** Enlace de WhatsApp para que el operador envíe un mensaje sin API (fase 1). */
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  const numero = telefono.replace(/[^\d]/g, "").replace(/^(?!34)(\d{9})$/, "34$1");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
