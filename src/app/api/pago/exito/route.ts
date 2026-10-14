import { NextResponse, type NextRequest } from "next/server";
import { confirmarPago } from "@/lib/pagos";
import { supabaseSistema, supabaseUsuario } from "@/lib/supabase/server";

const MINUTOS_ACCESO_DIRECTO = 120;

/**
 * Vuelta desde Stripe. Confirma el pago (por si el webhook aún no ha llegado) y, si la cuenta
 * la acaba de crear esta misma alta, deja la sesión iniciada para entrar directamente en el área.
 * Si la cuenta ya existía, no se abre sesión: el cliente entra con el enlace de su correo.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(new URL("/", origin));

  const simulado = sessionId.startsWith("simulada_");
  if (simulado && process.env.NODE_ENV === "production") return NextResponse.redirect(new URL("/", origin));
  const r = await confirmarPago(sessionId, { simulado, base: origin });
  if (!r.ok || !r.pagoId) return NextResponse.redirect(new URL("/contratar?error=pago", origin));

  const db = supabaseSistema();
  const { data: pago } = await db.from("pagos").select("id, email, usuario_nuevo, acceso_usado_en, creado_en").eq("id", r.pagoId).single();
  const reciente = pago && Date.now() - new Date(pago.creado_en).getTime() < MINUTOS_ACCESO_DIRECTO * 60_000;
  if (pago?.usuario_nuevo && !pago.acceso_usado_en && reciente && pago.email) {
    const { data: marcado } = await db
      .from("pagos")
      .update({ acceso_usado_en: new Date().toISOString() })
      .eq("id", pago.id)
      .is("acceso_usado_en", null)
      .select("id")
      .maybeSingle();
    if (marcado) {
      const enlace = await db.auth.admin.generateLink({ type: "magiclink", email: pago.email });
      const token = enlace.data.properties?.hashed_token;
      if (token) {
        const supabase = await supabaseUsuario();
        const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: token });
        if (!error) return NextResponse.redirect(new URL("/mi-area?bienvenida=1", origin));
      }
    }
  }
  return NextResponse.redirect(new URL("/entrar?aviso=pago", origin));
}
