import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import es from "../../messages/es.json";

type Mensajes = Record<string, unknown>;

/** Mezcla profunda: lo traducido sobrescribe; lo que falte queda en español. */
function mezclar(base: Mensajes, encima: Mensajes): Mensajes {
  const out: Mensajes = { ...base };
  for (const [k, v] of Object.entries(encima)) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) ? mezclar((base[k] as Mensajes) ?? {}, v as Mensajes) : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const solicitado = await requestLocale;
  const locale = hasLocale(routing.locales, solicitado) ? solicitado : routing.defaultLocale;
  const propios = locale === "es" ? {} : (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages: mezclar(es, propios) };
});
