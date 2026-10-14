import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FormEntrar } from "@/components/FormEntrar";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: "Entrar — GranjaFácil" };

export default async function Entrar({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Entrar en tu área</h1>
      {sp.aviso === "pago" && (
        <p className="rounded-xl bg-primario-claro p-4 text-lg">✅ Pago recibido. Te hemos enviado un correo con el enlace para entrar en tu área y seguir.</p>
      )}
      {sp.error === "enlace" && <p className="rounded-xl bg-aviso-fondo p-4 text-aviso">Ese enlace ha caducado o ya se usó. Pide uno nuevo aquí abajo.</p>}
      <p className="text-lg text-texto-suave">Escribe el correo con el que contrataste y te mandamos un enlace para entrar.</p>
      <FormEntrar />
      <p className="text-base">
        ¿Aún no eres cliente?{" "}
        <Link href="/contratar" className="font-semibold text-primario underline">
          Contrata aquí
        </Link>
      </p>
    </div>
  );
}
