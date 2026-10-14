"use server";

import { z } from "zod";
import { supabaseSistema, supabaseUsuario } from "@/lib/supabase/server";
import { enviarEnlaceAcceso } from "@/lib/acceso";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";

export type EstadoEntrar = { enviado: true } | { enviado: false; error: string } | null;

/**
 * Envía el enlace de acceso. Por seguridad la respuesta es la misma exista o no la cuenta,
 * y solo se envía a correos de clientes dados de alta o del operador.
 */
export async function pedirEnlace(_previo: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { enviado: false, error: "Escribe un correo válido" };
  if (!env.supabaseServiceKey) return { enviado: false, error: "El acceso aún no está disponible." };

  const db = supabaseSistema();
  const { data: titular } = await db.from("titulares").select("nombre").eq("email", email.data).limit(1).maybeSingle();
  const esOperador = !!env.emailOperador && email.data === env.emailOperador.toLowerCase();
  if (titular || esOperador) {
    try {
      await enviarEnlaceAcceso(email.data, titular?.nombre ?? "", "Has pedido entrar en tu área de GranjaFácil.", esOperador && !titular ? "/admin" : "/mi-area");
    } catch (e) {
      console.error("No se pudo enviar el enlace", e);
      return { enviado: false, error: "No hemos podido enviar el correo. Inténtalo en unos minutos o llámanos." };
    }
  }
  return { enviado: true };
}

export async function salir() {
  const supabase = await supabaseUsuario();
  await supabase.auth.signOut();
  redirect("/");
}
