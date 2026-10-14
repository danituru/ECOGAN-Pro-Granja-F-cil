import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { hayBaseDeDatos } from "@/lib/env";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "GranjaFácil — Tu ECOGAN hecho",
  description: "Preparamos y presentamos la declaración ECOGAN de tu granja de porcino o aves. Tú contestas desde el móvil.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2f6b2f" };

export default async function LayoutIdioma({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("comun");
  const pie = await getTranslations("pie");

  return (
    <html lang={locale}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <header className="border-b border-borde bg-superficie">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-xl font-bold text-primario">
                🌾 {t("marca")}
              </Link>
              <Link href="/#reserva" className="text-base font-semibold text-primario underline-offset-4 hover:underline">
                Reservar plaza
              </Link>
            </div>
          </header>
          {!hayBaseDeDatos() && (
            <p className="bg-aviso-fondo px-4 py-2 text-center text-sm text-aviso">{t("modoPruebas")}</p>
          )}
          <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
          <footer className="mx-auto max-w-3xl px-4 pb-10 text-sm text-texto-suave">
            <p>{pie("texto")}</p>
            <p className="mt-2">
              <Link href="/legal" className="underline">
                Términos y privacidad
              </Link>
            </p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
