import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Demo } from "@/components/Demo";
import { resolverListas } from "@/domain/catalogo/opciones";
import { leerListas } from "@/lib/config-servidor";

export const metadata: Metadata = { title: "Demostración — GranjaFácil", robots: { index: false } };

export default async function PaginaDemo({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Usa las listas editadas en el panel si hay base de datos; si no, las de por defecto.
  const listas = await leerListas().catch(() => resolverListas());
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Así de fácil es para el ganadero</h1>
      <Demo listas={listas} />
    </div>
  );
}
