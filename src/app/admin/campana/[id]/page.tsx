import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin, leerCampana } from "@/lib/admin";
import { leerListas } from "@/lib/config-servidor";
import { supabaseSistema, supabaseUsuario } from "@/lib/supabase/server";
import { enlaceWhatsApp } from "@/lib/email";
import { NOMBRE_ESTADO } from "@/domain/estados";
import { NOMBRE_ESPECIE } from "@/domain/especies";
import { generarFicha } from "@/domain/ficha";
import { validar } from "@/domain/validaciones";
import { FichaVista } from "@/components/formulario/FichaVista";
import { AccionesCampana, NotaOperador } from "@/components/admin/Botones";
import { EditorDatosAdmin } from "@/components/admin/EditorDatosAdmin";

const fecha = (s: string | null) => (s ? new Date(s).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—");

export default async function PaginaCampanaAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await exigirAdmin();
  const c = await leerCampana(id);
  if (!c) notFound();

  const supabase = await supabaseUsuario();
  const [listas, { data: documentos }, { data: eventos }, { data: pagos }] = await Promise.all([
    leerListas(),
    supabase.from("documentos").select("id, tipo, nombre, ruta_storage, creado_en").eq("campana_id", id).order("creado_en"),
    supabase.from("eventos").select("id, accion, detalle, creado_en").eq("campana_id", id).order("creado_en", { ascending: false }).limit(50),
    supabase.from("pagos").select("id, estado, importe_centimos, pagado_en, stripe_invoice_url").eq("titular_id", c.titular.id).order("creado_en", { ascending: false }),
  ]);

  // Registro de acceso a datos personales (quién ha visto qué y cuándo).
  await supabaseSistema().from("eventos").insert({ actor: u.id, titular_id: c.titular.id, campana_id: id, accion: "ver_campana" });

  const enlaces = await Promise.all(
    (documentos ?? []).map(async (d) => {
      const { data } = await supabase.storage.from("documentos").createSignedUrl(d.ruta_storage, 600);
      return { ...d, url: data?.signedUrl };
    }),
  );

  const ficha = generarFicha(c.datos, c.granja.especie, listas);
  const incidencias = validar(c.datos, c.granja.especie, { capacidadAutorizada: c.granja.capacidad ?? undefined, anioDatos: c.anio_datos });
  const t = c.titular;
  const dom = t.domicilio ?? {};

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-base text-primario underline">
        ← Todas las campañas
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">
            {t.nombre} {t.apellidos ?? ""}
          </h1>
          <p className="text-lg text-texto-suave">
            {c.granja.rega} · {c.granja.nombre || "sin nombre"} · {NOMBRE_ESPECIE[c.granja.especie]} · {c.granja.comunidad} · datos de {c.anio_datos}
          </p>
        </div>
        <span className="rounded-full bg-primario-claro px-4 py-2 text-lg font-bold text-primario">{NOMBRE_ESTADO[c.estado]}</span>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta space-y-2 text-base">
          <h2 className="text-xl font-bold">Titular</h2>
          <p>
            <strong>{t.tipo === "juridica" ? "CIF" : "NIF/NIE"}:</strong> {t.nif}
          </p>
          {t.representante_nombre && (
            <p>
              <strong>Representante:</strong> {t.representante_nombre} ({t.representante_nif})
            </p>
          )}
          <p>
            <strong>Correo:</strong> <a href={`mailto:${t.email}`} className="underline">{t.email}</a>
          </p>
          <p className="flex flex-wrap gap-3">
            <strong>Teléfono:</strong> <a href={`tel:${t.telefono}`} className="underline">{t.telefono}</a>
            <a href={enlaceWhatsApp(t.telefono, `Hola ${t.nombre}, soy Daniel de GranjaFácil.`)} target="_blank" rel="noopener" className="underline">
              WhatsApp
            </a>
          </p>
          <p>
            <strong>Domicilio:</strong> {[dom.direccion, dom.codigoPostal, dom.municipio, dom.provincia].filter(Boolean).join(", ") || "—"}
          </p>
          <p>
            <strong>Granja:</strong> {c.granja.municipio ?? "—"} · capacidad {c.granja.capacidad ?? "—"}
            {c.granja.integrada ? ` · integrada${c.granja.integradora ? ` (${c.granja.integradora})` : ""}` : ""}
          </p>
          {(pagos ?? []).map((p) => (
            <p key={p.id}>
              <strong>Pago:</strong> {(p.importe_centimos / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} · {p.estado} · {fecha(p.pagado_en)}
              {p.stripe_invoice_url && (
                <>
                  {" "}
                  · <a href={p.stripe_invoice_url} target="_blank" rel="noopener" className="underline">factura</a>
                </>
              )}
            </p>
          ))}
        </section>

        <section className="tarjeta space-y-3">
          <h2 className="text-xl font-bold">Qué toca hacer</h2>
          <AccionesCampana id={c.id} estado={c.estado} avisada={!!c.autorizacion_avisada_en} />
          {c.mensaje_al_ganadero && (
            <p className="rounded-xl bg-aviso-fondo p-3 text-base text-aviso">
              Último mensaje al ganadero: «{c.mensaje_al_ganadero}»
            </p>
          )}
          <ul className="grid grid-cols-2 gap-x-4 text-sm text-texto-suave">
            <li>Pagada: {fecha(c.pagado_en)}</li>
            <li>Autorizado: {fecha(c.autorizado_en)} {c.via_autorizacion ? `(${c.via_autorizacion})` : ""}</li>
            <li>Dice que autorizó: {fecha(c.autorizacion_avisada_en)}</li>
            <li>Datos enviados: {fecha(c.datos_enviados_en)}</li>
            <li>Revisada: {fecha(c.revisado_en)}</li>
            <li>Comunicada: {fecha(c.comunicada_en)}</li>
            <li>Justificante: {fecha(c.justificante_enviado_en)}</li>
          </ul>
        </section>
      </div>

      {incidencias.length > 0 && (
        <section className="tarjeta space-y-2">
          <h2 className="text-xl font-bold">Comprobaciones ({incidencias.length})</h2>
          <ul className="space-y-1 text-base">
            {incidencias.map((i, n) => (
              <li key={n} className={i.nivel === "error" ? "text-error" : "text-aviso"}>
                {i.nivel === "error" ? "✖" : "⚠"} <strong>{i.donde}:</strong> {i.mensaje}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Ficha para copiar en ECOGAN</h2>
        <p className="text-base text-texto-suave">Mismo orden y mismos nombres que en ECOGAN. Ve marcando las casillas según copias.</p>
        <FichaVista ficha={ficha} />
      </section>

      <details className="tarjeta">
        <summary className="cursor-pointer text-xl font-bold">Editar los datos (ayudar al ganadero por teléfono)</summary>
        <div className="mt-4">
          <EditorDatosAdmin campanaId={c.id} especie={c.granja.especie} inicial={c.datos} listas={listas} />
        </div>
      </details>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta space-y-3">
          <h2 className="text-xl font-bold">Documentos</h2>
          {enlaces.length === 0 ? (
            <p className="text-base text-texto-suave">Ninguno todavía.</p>
          ) : (
            <ul className="space-y-1 text-base">
              {enlaces.map((d) => (
                <li key={d.id}>
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noopener" className="underline">
                      {d.nombre}
                    </a>
                  ) : (
                    d.nombre
                  )}{" "}
                  <span className="text-sm text-texto-suave">
                    · {d.tipo} · {fecha(d.creado_en)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="pt-2 text-xl font-bold">Notas internas</h2>
          <NotaOperador id={c.id} inicial={c.nota_operador ?? ""} />
        </section>

        <section className="tarjeta space-y-2">
          <h2 className="text-xl font-bold">Historial</h2>
          <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
            {(eventos ?? []).map((e) => (
              <li key={e.id}>
                <span className="text-texto-suave">{fecha(e.creado_en)}</span> · {e.accion}
                {e.detalle && Object.keys(e.detalle).length > 0 && <span className="text-texto-suave"> {JSON.stringify(e.detalle)}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
