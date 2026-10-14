import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { campanasDelUsuario, exigirUsuario, titularesDelUsuario } from "@/lib/area";
import { esAdmin, supabaseUsuario } from "@/lib/supabase/server";
import { NOMBRE_ESPECIE } from "@/domain/especies";
import { NOMBRE_ESTADO } from "@/domain/estados";
import { progreso } from "@/domain/cuestionario";
import { euros } from "@/domain/precios";
import { salir } from "../entrar/acciones";

export const metadata: Metadata = { title: "Tu área — GranjaFácil" };
export const dynamic = "force-dynamic";

const COLOR: Record<string, string> = {
  autorizacion_pendiente: "bg-aviso-fondo text-aviso",
  recogiendo_datos: "bg-aviso-fondo text-aviso",
  pendiente_revision: "bg-primario-claro text-primario-oscuro",
  lista_para_ecogan: "bg-primario-claro text-primario-oscuro",
  comunicada: "bg-primario-claro text-primario-oscuro",
  justificante_enviado: "bg-primario text-white",
  sin_actividad: "bg-primario text-white",
};

export default async function MiArea({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const usuario = await exigirUsuario();
  const sp = await searchParams;
  const [campanas, admin, titulares] = await Promise.all([campanasDelUsuario(), esAdmin(), titularesDelUsuario()]);
  const supabase = await supabaseUsuario();
  const { data: pagos } = await supabase
    .from("pagos")
    .select("id, importe_centimos, estado, pagado_en, stripe_invoice_url")
    .in("titular_id", titulares)
    .eq("estado", "pagado")
    .order("pagado_en", { ascending: false });

  // Justificantes disponibles (enlaces temporales; el almacenamiento solo deja leer los propios).
  const { data: docs } = await supabase.from("documentos").select("campana_id, ruta_storage, nombre").in("titular_id", titulares).eq("tipo", "justificante");
  const justificantes = new Map<string, string>();
  for (const d of docs ?? []) {
    const { data } = await supabase.storage.from("documentos").createSignedUrl(d.ruta_storage, 60 * 30);
    if (data?.signedUrl && d.campana_id) justificantes.set(d.campana_id, data.signedUrl);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Tus granjas</h1>
        <form action={salir}>
          <button className="boton-peque">Salir</button>
        </form>
      </div>
      <p className="text-base text-texto-suave">Has entrado como {usuario.email}.</p>
      {admin && (
        <Link href="/admin" className="boton-secundario w-full">
          Ir al panel del operador
        </Link>
      )}
      {sp.bienvenida && (
        <div className="tarjeta border-primario bg-primario-claro">
          <p className="text-xl font-semibold text-primario-oscuro">✅ ¡Pago recibido! Bienvenido a GranjaFácil.</p>
          <p className="mt-2 text-lg">Siguiente paso: autorizarnos en ECOGAN. Pulsa el botón de tu granja y te guiamos.</p>
        </div>
      )}

      {sp.enviado && (
        <div className="tarjeta border-primario bg-primario-claro">
          <p className="text-xl font-semibold text-primario-oscuro">✅ ¡Datos recibidos!</p>
          <p className="mt-2 text-lg">Ahora los revisamos nosotros. Si falta algo te avisamos; si no, lo presentamos en ECOGAN y te mandamos el justificante.</p>
        </div>
      )}

      {campanas.length === 0 && (
        <div className="tarjeta space-y-3">
          <p className="text-lg">Todavía no tienes ninguna granja contratada.</p>
          <Link href="/contratar" className="boton">
            Contratar
          </Link>
        </div>
      )}

      {campanas.map((c) => {
        const p = progreso(c.datos, c.granja.especie);
        return (
          <article key={c.id} className="tarjeta space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold">{c.granja.nombre || c.granja.rega}</h2>
                <p className="text-base text-texto-suave">
                  {c.granja.rega} · {NOMBRE_ESPECIE[c.granja.especie]} · {c.granja.municipio}, {c.granja.comunidad} · Datos de {c.anio_datos}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-base font-semibold ${COLOR[c.estado] ?? ""}`}>{NOMBRE_ESTADO[c.estado]}</span>
            </div>

            {c.estado === "autorizacion_pendiente" && (
              <>
                {c.autorizacion_avisada_en ? (
                  <p className="text-lg">Nos has avisado de que ya nos has autorizado. Lo estamos comprobando y te avisamos para seguir.</p>
                ) : (
                  <p className="text-lg">Para presentar tu declaración tienes que darnos permiso en ECOGAN. Te guiamos paso a paso.</p>
                )}
                <Link href={`/mi-area/autorizacion/${c.id}`} className="boton w-full">
                  {c.autorizacion_avisada_en ? "Ver la guía de autorización" : "Autorizarnos en ECOGAN"}
                </Link>
              </>
            )}

            {c.estado === "recogiendo_datos" && (
              <>
                {c.mensaje_al_ganadero && <p className="rounded-xl bg-aviso-fondo p-3 text-lg text-aviso">📝 {c.mensaje_al_ganadero}</p>}
                {c.sin_actividad ? (
                  <p className="text-lg">Contrataste esta granja como «sin actividad». Confírmalo en el formulario (es una sola pregunta).</p>
                ) : (
                  <p className="text-lg">
                    Llevas {p.respondidas} de {p.total} preguntas obligatorias. Puedes dejarlo a medias y seguir otro día.
                  </p>
                )}
                <Link href={`/mi-area/datos/${c.id}`} className="boton w-full">
                  {p.respondidas ? "Seguir con los datos" : "Empezar con los datos"}
                </Link>
              </>
            )}

            {c.estado === "pendiente_revision" && <p className="text-lg">Hemos recibido tus datos y los estamos revisando. Si falta algo, te avisamos.</p>}
            {c.estado === "lista_para_ecogan" && <p className="text-lg">Tus datos están revisados. Los estamos presentando en ECOGAN.</p>}
            {c.estado === "comunicada" && <p className="text-lg">Presentado en ECOGAN. En breve te enviamos el justificante.</p>}
            {(c.estado === "justificante_enviado" || c.estado === "sin_actividad") && (
              <>
                <p className="text-lg">✅ Presentado en ECOGAN. ¡Hecho!</p>
                {justificantes.get(c.id) && (
                  <a href={justificantes.get(c.id)} className="boton-secundario w-full" target="_blank" rel="noopener">
                    Descargar el justificante
                  </a>
                )}
              </>
            )}
          </article>
        );
      })}

      {pagos && pagos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Pagos y facturas</h2>
          <ul className="space-y-2">
            {pagos.map((pg) => (
              <li key={pg.id} className="tarjeta flex flex-wrap items-center justify-between gap-2 p-4">
                <span className="text-lg">
                  {new Date(pg.pagado_en).toLocaleDateString("es-ES")} · {euros(pg.importe_centimos)}
                </span>
                {pg.stripe_invoice_url && (
                  <a href={pg.stripe_invoice_url} target="_blank" rel="noopener" className="boton-peque">
                    Ver factura
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-base">
        ¿Tienes otra granja?{" "}
        <Link href="/contratar" className="font-semibold text-primario underline">
          Añádela aquí
        </Link>
      </p>
    </div>
  );
}
