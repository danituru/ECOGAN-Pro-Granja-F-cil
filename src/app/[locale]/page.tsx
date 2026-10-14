import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FormReserva } from "@/components/FormReserva";
import { leerConfiguracion } from "@/lib/config-servidor";
import { texto, type Idioma } from "@/domain/configuracion";
import { euros } from "@/domain/precios";

// Precios, textos y datos de empresa salen de la base de datos: se regeneran cada 5 minutos.
export const revalidate = 300;

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tr = await getTranslations("reserva");
  const td = await getTranslations("datos");
  const idioma = (await getLocale()) as Idioma;
  const config = await leerConfiguracion();

  const precioDesde = Math.min(...Object.values(config.precios.porEspecie).flatMap((tramos) => tramos.map((x) => x.importe)));
  const lanzamiento = config.precios.lanzamiento;

  return (
    <div className="space-y-14">
      {/* Portada */}
      <section className="space-y-5 pt-2">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t("titulo")}</h1>
        <p className="text-xl text-texto-suave">{texto(config.textos.eslogan, idioma)}</p>
        <p className="rounded-xl bg-primario-claro p-4 text-lg">{texto(config.textos.mensajeObligacion, idioma)}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contratar" className="boton">
            {t("ctaContratar")}
          </Link>
          <Link href="/comprobador" className="boton-secundario">
            {t("ctaComprobar")}
          </Link>
        </div>
        <a href="#reserva" className="inline-block text-base text-primario underline">
          {t("ctaLlamada")}
        </a>
        <p className="text-base text-texto-suave">{t("plazo")}</p>
      </section>

      {/* Cómo funciona */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">{t("comoFunciona")}</h2>
        <ol className="space-y-3">
          {(["paso1", "paso2", "paso3", "paso4"] as const).map((p, i) => (
            <li key={p} className="tarjeta flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primario text-xl font-bold text-white">{i + 1}</span>
              <span className="pt-1 text-lg">{t(p)}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* El dato */}
      <section className="tarjeta space-y-3">
        <h2 className="text-2xl font-bold">{td("titulo")}</h2>
        <p className="text-lg">{td("texto")}</p>
        <p className="text-base text-texto-suave">{td("matiz")}</p>
        <p className="text-sm text-texto-suave">{td("fuente")}</p>
      </section>

      {/* Quién está obligado */}
      <section className="space-y-3">
        <h2 className="text-3xl font-bold">{t("quienTitulo")}</h2>
        <p className="text-lg">{t("quienTexto")}</p>
        <Link href="/comprobador" className="boton-secundario">
          {t("ctaComprobar")}
        </Link>
      </section>

      {/* Precio y garantía */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="tarjeta space-y-2">
          <h2 className="text-2xl font-bold">{t("precioTitulo")}</h2>
          <p className="text-lg">
            {t("desde")} <strong className="text-3xl text-primario">{euros(precioDesde)}</strong> {t("porGranja")}
          </p>
          {lanzamiento && (
            <p className="rounded-lg bg-aviso-fondo p-2 text-base text-aviso">
              −{lanzamiento.porcentaje} % si contratas antes del {new Date(lanzamiento.hasta).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}.
            </p>
          )}
          <p className="text-base text-texto-suave">
            {t("sinActividad")} {euros(config.precios.sinActividad)}.
          </p>
          <Link href="/legal#precios" className="block text-base text-primario underline">
            Ver todos los precios
          </Link>
          <Link href="/contratar" className="boton w-full">
            {t("ctaContratar")}
          </Link>
        </div>
        <div className="tarjeta space-y-2">
          <h2 className="text-2xl font-bold">{t("garantiaTitulo")}</h2>
          <p className="text-lg">{texto(config.textos.garantia, idioma)}</p>
        </div>
      </section>

      {/* Reserva */}
      <section id="reserva" className="scroll-mt-6 space-y-4">
        <h2 className="text-3xl font-bold">{tr("titulo")}</h2>
        <p className="text-lg text-texto-suave">{tr("intro")}</p>
        <FormReserva />
      </section>

      {/* Preguntas frecuentes */}
      <section className="space-y-3">
        <h2 className="text-3xl font-bold">{t("faqTitulo")}</h2>
        {(["1", "2", "3"] as const).map((n) => (
          <details key={n} className="tarjeta">
            <summary className="cursor-pointer text-lg font-semibold">{t(`faq${n}p`)}</summary>
            <p className="mt-3 text-lg">{t(`faq${n}r`)}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
