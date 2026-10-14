import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComprobadorYReserva } from "@/components/ComprobadorYReserva";

export default async function PaginaComprobador({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("comprobador");
  const tr = await getTranslations("reserva");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{t("titulo")}</h1>
      <p className="text-lg text-texto-suave">{t("intro")}</p>
      <ComprobadorYReserva tituloReserva={tr("titulo")} />
    </div>
  );
}
