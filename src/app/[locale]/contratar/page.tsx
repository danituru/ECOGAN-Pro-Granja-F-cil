import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FormAlta } from "@/components/FormAlta";
import { hayBaseDeDatos, hayStripe } from "@/lib/env";
import { leerConfiguracion } from "@/lib/config-servidor";
import { texto, type Idioma } from "@/domain/configuracion";

export const metadata: Metadata = { title: "Contratar — GranjaFácil" };

export default async function Contratar({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const config = await leerConfiguracion();
  const idioma = (await getLocale()) as Idioma;
  // En producción solo se puede contratar con Stripe configurado (en local se simula el pago).
  const pagoDisponible = hayBaseDeDatos() && (hayStripe() || process.env.NODE_ENV !== "production");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Contratar tu ECOGAN {config.campana.anioPresentacion}</h1>
      <p className="text-lg text-texto-suave">Rellena tus datos y los de tus granjas, paga con tarjeta y te guiamos en el siguiente paso. Son 2 minutos.</p>
      {sp.cancelado && <p className="rounded-xl bg-aviso-fondo p-4 text-aviso">Has cancelado el pago. Tus datos siguen aquí si quieres intentarlo otra vez.</p>}
      {sp.error && <p className="rounded-xl bg-error-fondo p-4 text-error">No hemos podido confirmar el pago. Si te han cobrado, escríbenos y lo revisamos.</p>}
      {!pagoDisponible ? (
        <div className="tarjeta space-y-3">
          <p className="text-lg">El pago por internet se abre en unos días. Déjanos tus datos y te llamamos para darte de alta.</p>
          <Link href="/#reserva" className="boton w-full">
            Reservar mi plaza
          </Link>
        </div>
      ) : (
        <FormAlta precios={config.precios} anioPresentacion={config.campana.anioPresentacion} garantia={texto(config.textos.garantia, idioma)} />
      )}
    </div>
  );
}
