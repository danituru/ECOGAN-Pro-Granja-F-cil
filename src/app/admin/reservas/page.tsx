import { exigirAdmin } from "@/lib/admin";
import { supabaseUsuario } from "@/lib/supabase/server";
import { enlaceWhatsApp } from "@/lib/email";
import { NOMBRE_ESPECIE, type Especie } from "@/domain/especies";
import { BotonReservaContactada } from "@/components/admin/Botones";

export default async function PaginaReservas() {
  await exigirAdmin();
  const supabase = await supabaseUsuario();
  const { data: reservas, error } = await supabase.from("reservas").select("*").order("creado_en", { ascending: false }).limit(500);

  if (error) return <p className="tarjeta text-error">No se han podido leer las reservas: {error.message}</p>;
  const pendientes = (reservas ?? []).filter((r) => !r.contactado_en);
  const contactadas = (reservas ?? []).filter((r) => r.contactado_en);

  const Tarjeta = ({ r }: { r: NonNullable<typeof reservas>[number] }) => (
    <li className="tarjeta space-y-1 text-base">
      <p className="text-lg font-semibold">
        {r.nombre} · {r.comunidad} · {r.especie === "varias" ? "Varias especies" : NOMBRE_ESPECIE[r.especie as Especie]} · {r.numero_granjas} granja{r.numero_granjas > 1 ? "s" : ""}
      </p>
      <p className="flex flex-wrap gap-3">
        <a href={`tel:${r.telefono}`} className="underline">{r.telefono}</a>
        <a href={enlaceWhatsApp(r.telefono, `Hola ${r.nombre}, soy Daniel de GranjaFácil. Te escribo por la reserva que hiciste para la declaración de ECOGAN.`)} target="_blank" rel="noopener" className="underline">
          WhatsApp
        </a>
        {r.email && <a href={`mailto:${r.email}`} className="underline">{r.email}</a>}
        <span className="text-texto-suave">{new Date(r.creado_en).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</span>
      </p>
      {r.mensaje && <p className="text-texto-suave">«{r.mensaje}»</p>}
      {r.contactado_en ? (
        <p className="text-sm text-primario">
          Contactada el {new Date(r.contactado_en).toLocaleDateString("es-ES")}
          {r.nota_operador ? ` · ${r.nota_operador}` : ""}
        </p>
      ) : (
        <BotonReservaContactada id={r.id} />
      )}
    </li>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Reservas de plaza</h1>
      <p className="text-base text-texto-suave">
        Personas que han dejado sus datos en la web. Llámalas y, si quieren contratar, mándales a <strong>/contratar</strong>.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Sin contactar ({pendientes.length})</h2>
        <ul className="space-y-3">
          {pendientes.map((r) => (
            <Tarjeta key={r.id} r={r} />
          ))}
        </ul>
      </section>
      {contactadas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Contactadas ({contactadas.length})</h2>
          <ul className="space-y-3">
            {contactadas.map((r) => (
              <Tarjeta key={r.id} r={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
