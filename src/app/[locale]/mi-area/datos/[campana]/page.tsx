import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { campanaDelUsuario, exigirUsuario } from "@/lib/area";
import { leerListas } from "@/lib/config-servidor";
import { NOMBRE_ESPECIE } from "@/domain/especies";
import { FormularioCampana } from "@/components/area/FormularioCampana";
import type { Datos } from "@/domain/catalogo/tipos";

export const metadata: Metadata = { title: "Datos de tu granja — GranjaFácil" };
export const dynamic = "force-dynamic";

export default async function PaginaDatos({ params }: { params: Promise<{ locale: string; campana: string }> }) {
  const { locale, campana } = await params;
  setRequestLocale(locale);
  await exigirUsuario();
  const c = await campanaDelUsuario(campana);
  if (!c) notFound();
  const listas = await leerListas();

  // Si contrató "sin actividad", la primera respuesta ya viene marcada (puede cambiarla).
  const inicial: Datos = c.sin_actividad && c.datos.actividad === undefined ? { ...c.datos, actividad: false } : c.datos;

  return (
    <div className="space-y-6">
      <Link href="/mi-area" className="text-base text-primario underline">
        ← Volver a tus granjas
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold">{c.granja.nombre || c.granja.rega}</h1>
        <p className="text-base text-texto-suave">
          {NOMBRE_ESPECIE[c.granja.especie]} · Datos del año {c.anio_datos}
        </p>
      </div>
      {c.estado === "recogiendo_datos" ? (
        <FormularioCampana campanaId={c.id} especie={c.granja.especie} inicial={inicial} listas={listas} capacidad={c.granja.capacidad ?? undefined} />
      ) : c.estado === "autorizacion_pendiente" ? (
        <div className="tarjeta space-y-3">
          <p className="text-lg">Antes de rellenar los datos necesitamos tu autorización en ECOGAN.</p>
          <Link href={`/mi-area/autorizacion/${c.id}`} className="boton w-full">
            Autorizarnos en ECOGAN
          </Link>
        </div>
      ) : (
        <p className="tarjeta text-lg">Ya hemos recibido tus datos. Si hay que cambiar algo, te avisaremos.</p>
      )}
    </div>
  );
}
