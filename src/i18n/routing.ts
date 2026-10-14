import { defineRouting } from "next-intl/routing";

/**
 * Español por defecto (sin prefijo en la URL) y catalán preparado en /ca.
 * Mientras messages/ca.json esté incompleto, las claves que falten se muestran en español.
 *
 * Sin detección automática: si no, un navegador en catalán iría a /ca, que aún no está traducido,
 * y la cookie de idioma dejaría al visitante en /ca en el resto de páginas.
 * Cuando la traducción esté lista, cambiar localeDetection a true.
 */
export const routing = defineRouting({
  locales: ["es", "ca"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
