import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { campanaDelUsuario, exigirUsuario } from "@/lib/area";
import { leerConfiguracion } from "@/lib/config-servidor";
import { Autorizacion } from "@/components/area/Autorizacion";

export const metadata: Metadata = { title: "Autorízanos en ECOGAN — GranjaFácil" };
export const dynamic = "force-dynamic";

/** Enlaces de acceso a ECOGAN por comunidad (ECOGAN se abre siempre desde el enlace autonómico). */
const ENLACE_ECOGAN: Record<string, string> = {
  Cataluña: "https://servicio.mapa.gob.es/ecogan/Publica/InicioCatalunya.aspx",
  Aragón: "https://www.aragon.es/-/ecogan",
};
const ENLACE_GENERAL = "https://www.mapa.gob.es/es/ganaderia/temas/ganaderia-y-medio-ambiente/calculo-emisiones";

/** Comunidades donde la vía por documento es la opción por defecto (decisión del 14-oct-2026). */
const VIA_DOCUMENTO = ["Aragón"];

export default async function PaginaAutorizacion({ params }: { params: Promise<{ locale: string; campana: string }> }) {
  const { locale, campana } = await params;
  setRequestLocale(locale);
  await exigirUsuario();
  const c = await campanaDelUsuario(campana);
  if (!c) notFound();
  const { operador } = await leerConfiguracion();

  return (
    <div className="space-y-6">
      <Link href="/mi-area" className="text-base text-primario underline">
        ← Volver a tus granjas
      </Link>
      <h1 className="text-3xl font-extrabold">Autorízanos en ECOGAN</h1>
      <p className="text-lg">
        Para presentar la declaración de <strong>{c.granja.nombre || c.granja.rega}</strong> necesitamos tu permiso en ECOGAN. Solo se hace una vez y vale para los años siguientes.
      </p>
      {c.estado !== "autorizacion_pendiente" && (
        <p className="rounded-xl bg-primario-claro p-4 text-lg">✅ Ya tenemos tu autorización para esta granja. No tienes que hacer nada más aquí.</p>
      )}
      <Autorizacion
        campanaId={c.id}
        titularId={c.titular.id}
        telefono={c.titular.telefono}
        comunidad={c.granja.comunidad}
        enlaceEcogan={ENLACE_ECOGAN[c.granja.comunidad] ?? ENLACE_GENERAL}
        viaDocumento={VIA_DOCUMENTO.includes(c.granja.comunidad)}
        autorizado={operador}
        esEmpresa={c.titular.tipo === "juridica"}
        representante={c.titular.representante_nombre}
        yaAvisado={!!c.autorizacion_avisada_en}
      />
    </div>
  );
}
