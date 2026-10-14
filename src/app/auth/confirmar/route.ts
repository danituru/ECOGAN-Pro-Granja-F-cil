import { NextResponse, type NextRequest } from "next/server";
import { supabaseUsuario } from "@/lib/supabase/server";

/** Entrada desde el enlace del correo: valida el token y deja la sesión iniciada. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const destino = searchParams.get("destino") ?? "/mi-area";
  // Solo destinos internos (evita redirecciones a otras webs).
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : "/mi-area";

  if (tokenHash) {
    const supabase = await supabaseUsuario();
    const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(seguro, origin));
  }
  return NextResponse.redirect(new URL("/entrar?error=enlace", origin));
}
