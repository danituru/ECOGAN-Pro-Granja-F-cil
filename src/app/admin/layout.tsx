import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { esAdmin, usuarioActual } from "@/lib/supabase/server";
import { NextIntlClientProvider } from "next-intl";
import { hayBaseDeDatos } from "@/lib/env";
import mensajes from "../../../messages/es.json";
import "../globals.css";

export const metadata: Metadata = { title: "Panel — GranjaFácil", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  if (!hayBaseDeDatos()) {
    return (
      <html lang="es">
        <body className="p-8">
          <p>El panel necesita la base de datos configurada.</p>
        </body>
      </html>
    );
  }
  const usuario = await usuarioActual();
  if (!usuario) redirect("/entrar");
  if (!(await esAdmin())) redirect("/mi-area");

  return (
    <html lang="es">
      <body className="min-h-dvh">
        <header className="border-b border-borde bg-superficie">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-base">
            <Link href="/admin" className="flex items-center gap-2 text-lg font-bold text-primario">
              <Image src="/marca/granjafacil.png" alt="" width={32} height={32} className="rounded-md" />
              Panel
            </Link>
            <Link href="/admin" className="hover:underline">Campañas</Link>
            <Link href="/admin/reservas" className="hover:underline">Reservas</Link>
            <Link href="/admin/configuracion" className="hover:underline">Configuración</Link>
            {/* Es una descarga (route handler), no una página: enlace normal. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/admin/exportar" download className="hover:underline">Exportar CSV</a>
            <span className="ml-auto text-sm text-texto-suave">{usuario.email}</span>
            <Link href="/mi-area" className="text-sm hover:underline">Salir del panel</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          {/* El panel va siempre en español; los formularios compartidos usan los textos de next-intl. */}
          <NextIntlClientProvider locale="es" messages={mensajes}>
            {children}
          </NextIntlClientProvider>
        </main>
      </body>
    </html>
  );
}
