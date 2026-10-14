import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env, hayBaseDeDatos } from "../env";

/** Renueva la sesión de Supabase en cada petición (cookies). */
export async function refrescarSesion(request: NextRequest, respuesta: NextResponse) {
  if (!hayBaseDeDatos()) return respuesta;
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) respuesta.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return respuesta;
}
