import { defineRouting } from "next-intl/routing";

/**
 * Español por defecto (sin prefijo en la URL) y catalán preparado en /ca.
 * Mientras messages/ca.json esté incompleto, las claves que falten se muestran en español.
 */
export const routing = defineRouting({
  locales: ["es", "ca"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
