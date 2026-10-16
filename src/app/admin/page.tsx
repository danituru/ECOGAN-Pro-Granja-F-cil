import Link from "next/link";
import { diasHasta, listarCampanas } from "@/lib/admin";
import { leerConfiguracion } from "@/lib/config-servidor";
import { supabaseUsuario } from "@/lib/supabase/server";
import { ESTADOS, NOMBRE_ESTADO, ESTADOS_PRESENTADOS, type EstadoCampana } from "@/domain/estados";
import { NOMBRE_ESPECIE } from "@/domain/especies";
import { enlaceWhatsApp } from "@/lib/email";
import { BotonAtenderAyuda } from "@/components/admin/Botones";

export default async function PanelAdmin({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const sp = await searchParams;
  const [campanas, config] = await Promise.all([listarCampanas(), leerConfiguracion()]);
  const supabase = await supabaseUsuario();
  const { data: ayudas } = await supabase
    .from("solicitudes_ayuda")
    .select("id, telefono, mensaje, creado_en, campana_id, titular:titulares(nombre)")
    .is("atendida_en", null)
    .order("creado_en");
  const { count: reservasNuevas } = await supabase.from("reservas").select("id", { count: "exact", head: true }).is("contactado_en", null);

  const diasPlazo = diasHasta(config.campana.finPlazo);
  const diasGarantia = diasHasta(config.campana.limiteGarantia);
  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, campanas.filter((c) => c.estado === e).length])) as Record<EstadoCampana, number>;
  const presentadas = campanas.filter((c) => ESTADOS_PRESENTADOS.includes(c.estado)).length;
  // En riesgo: a menos de 3 semanas del límite de la garantía y todavía sin datos enviados.
  const enRiesgo = campanas.filter((c) => (c.estado === "autorizacion_pendiente" || c.estado === "recogiendo_datos") && diasGarantia <= 21);
  const porVerificar = campanas.filter((c) => c.estado === "autorizacion_pendiente" && c.autorizacion_avisada_en);

  const q = (sp.q ?? "").toLowerCase().trim();
  const filtradas = campanas.filter(
    (c) =>
      (!sp.estado || c.estado === sp.estado) &&
      (!q || [c.titular.nombre, c.titular.apellidos, c.titular.nif, c.titular.email, c.granja.rega, c.granja.nombre].some((v) => v?.toLowerCase().includes(q))),
  );

  const faltan = [
    !config.empresa.razonSocial && "razón social de la empresa",
    !config.empresa.nif && "NIF de la empresa",
    !config.empresa.domicilio && "domicilio de la empresa",
    !(config.empresa.email || config.operador.email) && "correo de contacto",
    !config.operador.apellido1 && "apellidos del autorizado",
    !config.operador.nif && "DNI del autorizado",
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {faltan.length > 0 && (
        <p className="tarjeta border-aviso bg-aviso-fondo text-base text-aviso">
          Faltan datos: {faltan.join(", ")}. Salen en las páginas legales, en la guía de autorización y en el modelo de Aragón.{" "}
          <Link href="/admin/configuracion" className="font-semibold underline">
            Completarlos en Configuración
          </Link>
        </p>
      )}
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="tarjeta">
          <p className="text-sm text-texto-suave">Fin de plazo ECOGAN ({config.campana.finPlazo})</p>
          <p className="text-3xl font-bold">{diasPlazo > 0 ? `${diasPlazo} días` : "Cerrado"}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-texto-suave">Límite de la garantía ({config.campana.limiteGarantia})</p>
          <p className="text-3xl font-bold">{diasGarantia > 0 ? `${diasGarantia} días` : "Pasado"}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-texto-suave">Presentadas</p>
          <p className="text-3xl font-bold">
            {presentadas} / {campanas.length}
          </p>
        </div>
        <Link href="/admin/reservas" className="tarjeta hover:border-primario">
          <p className="text-sm text-texto-suave">Reservas sin contactar</p>
          <p className="text-3xl font-bold">{reservasNuevas ?? 0}</p>
        </Link>
      </section>

      {(ayudas?.length ?? 0) > 0 && (
        <section className="tarjeta space-y-3 border-error">
          <h2 className="text-xl font-bold text-error">🆘 Piden ayuda ({ayudas!.length})</h2>
          <ul className="divide-y divide-borde">
            {ayudas!.map((a) => {
              const nombre = (a.titular as unknown as { nombre: string } | null)?.nombre ?? "";
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-base">
                  <strong>{nombre}</strong>
                  <a href={`tel:${a.telefono}`} className="underline">{a.telefono}</a>
                  <a href={enlaceWhatsApp(a.telefono ?? "", `Hola ${nombre}, soy Daniel de GranjaFácil. Te llamo para ayudarte con la autorización en ECOGAN.`)} target="_blank" rel="noopener" className="underline">WhatsApp</a>
                  {a.mensaje && <span className="text-texto-suave">«{a.mensaje}»</span>}
                  {a.campana_id && <Link href={`/admin/campana/${a.campana_id}`} className="underline">Ver campaña</Link>}
                  <BotonAtenderAyuda id={a.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {porVerificar.length > 0 && (
        <section className="tarjeta space-y-2 border-aviso">
          <h2 className="text-xl font-bold text-aviso">Dicen que ya te han autorizado: compruébalo en ECOGAN ({porVerificar.length})</h2>
          <ul className="list-disc pl-6 text-base">
            {porVerificar.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/campana/${c.id}`} className="underline">
                  {c.titular.nombre} · {c.granja.rega} · {c.granja.comunidad}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {enRiesgo.length > 0 && (
        <section className="tarjeta space-y-2 border-error">
          <h2 className="text-xl font-bold text-error">⚠ En riesgo de no llegar a la garantía ({enRiesgo.length})</h2>
          <ul className="list-disc pl-6 text-base">
            {enRiesgo.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/campana/${c.id}`} className="underline">
                  {c.titular.nombre} · {c.granja.rega} · {NOMBRE_ESTADO[c.estado]}
                </Link>{" "}
                · <a href={`tel:${c.titular.telefono}`} className="underline">{c.titular.telefono}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className={`boton-peque ${!sp.estado ? "border-primario font-bold" : ""}`}>
            Todas ({campanas.length})
          </Link>
          {ESTADOS.filter((e) => e !== "sin_actividad" || porEstado[e]).map((e) => (
            <Link key={e} href={`/admin?estado=${e}`} className={`boton-peque ${sp.estado === e ? "border-primario font-bold" : ""}`}>
              {NOMBRE_ESTADO[e]} ({porEstado[e]})
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
          <input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, NIF, correo o REGA" className="campo" />
          <button className="boton-peque">Buscar</button>
        </form>
        <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
          <table className="w-full text-left text-base">
            <thead className="bg-fondo text-sm text-texto-suave">
              <tr>
                <th className="p-3">Titular</th>
                <th className="p-3">Granja</th>
                <th className="p-3">Comunidad</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Actualizada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {filtradas.map((c) => (
                <tr key={c.id} className="hover:bg-fondo">
                  <td className="p-3">
                    <Link href={`/admin/campana/${c.id}`} className="font-semibold text-primario underline">
                      {c.titular.nombre} {c.titular.apellidos ?? ""}
                    </Link>
                    <div className="text-sm text-texto-suave">{c.titular.telefono}</div>
                  </td>
                  <td className="p-3">
                    {c.granja.rega}
                    <div className="text-sm text-texto-suave">
                      {NOMBRE_ESPECIE[c.granja.especie]}
                      {c.sin_actividad ? " · sin actividad" : ""}
                    </div>
                  </td>
                  <td className="p-3">{c.granja.comunidad}</td>
                  <td className="p-3">
                    {NOMBRE_ESTADO[c.estado]}
                    {c.estado === "autorizacion_pendiente" && c.autorizacion_avisada_en && <div className="text-sm text-aviso">Dice que ya autorizó</div>}
                  </td>
                  <td className="p-3 text-sm">{new Date(c.actualizado_en).toLocaleDateString("es-ES")}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-texto-suave">
                    No hay campañas{sp.estado ? " en este estado" : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
