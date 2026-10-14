import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env, hayBaseDeDatos } from "../env";

/** Cliente con la sesión del usuario: todas las consultas pasan por Row Level Security. */
export async function supabaseUsuario() {
  if (!hayBaseDeDatos()) throw new Error("Supabase no está configurado (ver .env.example)");
  const almacen = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // En Server Components no se pueden escribir cookies; lo hace el middleware.
        }
      },
    },
  });
}

/**
 * Cliente con la clave de servicio: se salta RLS. Usar solo en el servidor para tareas del
 * sistema (alta de clientes, webhook de pagos, recordatorios), nunca con datos del navegador sin validar.
 */
export function supabaseSistema() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
}

export async function usuarioActual() {
  if (!hayBaseDeDatos()) return null;
  const supabase = await supabaseUsuario();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function esAdmin(): Promise<boolean> {
  if (!hayBaseDeDatos()) return false;
  const supabase = await supabaseUsuario();
  const { data } = await supabase.rpc("es_admin");
  return data === true;
}
