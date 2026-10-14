import { getLocale, setRequestLocale } from "next-intl/server";
import { leerConfiguracion } from "@/lib/config-servidor";
import { texto, type Idioma } from "@/domain/configuracion";

// TODO: revisar con un abogado antes de abrir el alta con pago (fase 1, punto g).
export default async function Legal({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const config = await leerConfiguracion();
  const idioma = (await getLocale()) as Idioma;
  const op = config.operador;

  return (
    <article className="space-y-8 text-lg">
      <h1 className="text-3xl font-extrabold">Términos y privacidad</h1>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Garantía</h2>
        <p>{texto(config.textos.garantia, idioma)}</p>
      </section>

      <section id="privacidad" className="scroll-mt-6 space-y-3">
        <h2 className="text-2xl font-bold">Política de privacidad (reserva de plaza)</h2>
        <p>
          <strong>Responsable:</strong> {op.nombre || "GranjaFácil"}
          {op.nif ? `, NIF ${op.nif}` : ""}
          {op.email ? `. Contacto: ${op.email}` : ""}.
        </p>
        <p>
          <strong>Para qué usamos tus datos:</strong> para llamarte o escribirte sobre el servicio de preparación y presentación de la declaración ECOGAN que nos has pedido. No los cedemos a terceros ni los usamos para otra cosa.
        </p>
        <p>
          <strong>Base legal:</strong> tu consentimiento al enviar el formulario y la aplicación de medidas precontractuales a petición tuya.
        </p>
        <p>
          <strong>Cuánto tiempo:</strong> hasta el final de la campaña ECOGAN para la que reservas (31 de marzo) si no contratas el servicio; después los borramos.
        </p>
        <p>
          <strong>Dónde se guardan:</strong> en servidores de la Unión Europea de nuestro proveedor de base de datos.
        </p>
        <p>
          <strong>Tus derechos:</strong> puedes pedir acceder, corregir o borrar tus datos, o retirar tu consentimiento, escribiéndonos{op.email ? ` a ${op.email}` : ""}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
        </p>
      </section>
    </article>
  );
}
