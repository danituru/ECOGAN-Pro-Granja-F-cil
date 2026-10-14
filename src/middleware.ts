import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refrescarSesion } from "./lib/supabase/middleware";

const intl = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // El panel del operador y la API no llevan idioma en la URL.
  const respuesta = pathname.startsWith("/admin") || pathname.startsWith("/auth") ? NextResponse.next({ request }) : intl(request);
  return refrescarSesion(request, respuesta);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
