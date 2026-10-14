import "server-only";
import { headers } from "next/headers";
import { env } from "./env";

/** URL pública de la aplicación: la de la petición actual o, si no hay, NEXT_PUBLIC_APP_URL. */
export async function urlBase(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Fuera de una petición (tareas programadas): se usa la variable de entorno.
  }
  return env.appUrl.replace(/\/$/, "");
}
