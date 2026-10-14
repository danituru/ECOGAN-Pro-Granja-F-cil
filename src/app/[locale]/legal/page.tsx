import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { leerConfiguracion } from "@/lib/config-servidor";
import { texto, type Idioma } from "@/domain/configuracion";
import { euros } from "@/domain/precios";
import { ESPECIES, NOMBRE_ESPECIE } from "@/domain/especies";

// Precios, textos y datos de empresa salen de la base de datos: se regeneran cada 5 minutos.
export const revalidate = 300;

export const metadata: Metadata = { title: "Aviso legal, términos y privacidad — GranjaFácil" };

// TODO: verificar normativa — textos redactados sobre LSSI, RGPD/LOPDGDD y TRLGDCU; conviene que los revise un asesor.
const ACTUALIZADO = "15 de octubre de 2026";

const fechaLarga = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
const miles = (n: number) => n.toLocaleString("es-ES");

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function Legal({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const config = await leerConfiguracion();
  const idioma = (await getLocale()) as Idioma;
  const e = config.empresa;
  const op = config.operador;
  const p = config.precios;
  const titular = e.razonSocial || e.nombreComercial || "GranjaFácil";
  const contacto = e.email || op.email;
  const anioDatos = config.campana.anioPresentacion - 1;

  return (
    <article className="space-y-10 text-lg leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold">Aviso legal, términos y privacidad</h1>
        <p className="text-base text-texto-suave">Última actualización: {ACTUALIZADO}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-base">
          {[
            ["aviso-legal", "Aviso legal"],
            ["terminos", "Términos del servicio"],
            ["precios", "Precios"],
            ["garantia", "Garantía"],
            ["encargo", "Encargo y tratamiento de datos"],
            ["privacidad", "Privacidad"],
            ["cookies", "Cookies"],
            ["seguridad", "Seguridad"],
          ].map(([id, nombre]) => (
            <a key={id} href={`#${id}`} className="text-primario underline">
              {nombre}
            </a>
          ))}
        </nav>
      </header>

      <Seccion id="aviso-legal" titulo="1. Aviso legal">
        <p>En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información (LSSI), estos son los datos del titular de GranjaFácil:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Titular:</strong> {titular}
            {e.nombreComercial && e.razonSocial && e.nombreComercial !== e.razonSocial ? ` (${e.nombreComercial})` : ""}
          </li>
          {e.nif && (
            <li>
              <strong>NIF:</strong> {e.nif}
            </li>
          )}
          {e.domicilio && (
            <li>
              <strong>Domicilio:</strong> {e.domicilio}
            </li>
          )}
          {contacto && (
            <li>
              <strong>Correo:</strong> <a href={`mailto:${contacto}`} className="underline">{contacto}</a>
            </li>
          )}
          {(e.telefono || op.telefono) && (
            <li>
              <strong>Teléfono:</strong> {e.telefono || op.telefono}
            </li>
          )}
          {e.registroMercantil && (
            <li>
              <strong>Datos registrales:</strong> {e.registroMercantil}
            </li>
          )}
        </ul>
        <p>
          GranjaFácil es un servicio privado. <strong>No es un servicio oficial</strong> del Ministerio de Agricultura, Pesca y Alimentación (MAPA) ni de ninguna comunidad autónoma. ECOGAN es el registro oficial del MAPA; nosotros solo preparamos tus datos y los presentamos en tu nombre como persona autorizada por ti.
        </p>
        <p>Los textos, el diseño, el código y las marcas GranjaFácil y KIVASA pertenecen a su titular. No se pueden copiar ni reutilizar sin permiso.</p>
      </Seccion>

      <Seccion id="terminos" titulo="2. Términos del servicio">
        <h3 className="text-xl font-semibold">Qué hacemos</h3>
        <p>
          Por cada granja contratada preparamos y presentamos en ECOGAN la comunicación anual de la campaña {config.campana.anioPresentacion} (datos del año {anioDatos}). El servicio incluye:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Una guía paso a paso para que nos autorices en ECOGAN y ayuda por teléfono si te atascas.</li>
          <li>Un cuestionario sencillo, desde el móvil, con las preguntas que pide ECOGAN.</li>
          <li>La revisión de tus respuestas por una persona antes de presentar nada.</li>
          <li>La presentación (botón «COMUNICAR») en ECOGAN por la persona autorizada.</li>
          <li>El envío del justificante de ECOGAN a tu correo y a tu área de cliente.</li>
        </ul>
        <h3 className="text-xl font-semibold">Qué no incluye</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Asesoramiento técnico, veterinario ni ambiental, ni el cambio de las técnicas de tu granja.</li>
          <li>Otros registros o trámites (autorización ambiental integrada, libro de explotación, cuaderno de fertilización, SIEX, inspecciones, recursos o sanciones).</li>
          <li>La presentación de campañas o años distintos de los contratados.</li>
        </ul>
        <h3 className="text-xl font-semibold">Lo que te toca a ti</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Autorizarnos en ECOGAN (o firmar el documento de autorización de tu comunidad autónoma, si se usa esa vía).</li>
          <li>Darnos datos ciertos y completos. Tú eres el titular de la granja y respondes de que los datos que nos das son verdaderos; nosotros los revisamos y presentamos tal y como nos los confirmas.</li>
          <li>Contestar a nuestras dudas y avisarnos si algo cambia.</li>
        </ul>
        <p>
          <strong>Nunca te pediremos tu Cl@ve, tu certificado digital ni tus contraseñas.</strong> Entramos en ECOGAN con nuestro propio acceso, como personas autorizadas por ti. Puedes quitarnos la autorización en ECOGAN cuando quieras.
        </p>
        <h3 className="text-xl font-semibold">Contratación y pago</h3>
        <p>
          Contratas en la web, aceptando estos términos, y pagas con tarjeta u otro medio que ofrezca nuestra pasarela de pago (Stripe). El precio se muestra con el desglose antes de pagar y es el que se aplica. Recibirás la factura por correo. No es una suscripción: no hay cobros automáticos el año siguiente.
        </p>
        <h3 className="text-xl font-semibold">Cancelación y desistimiento</h3>
        <p>Si cambias de idea antes de habernos autorizado en ECOGAN, escríbenos y te devolvemos el importe íntegro de esa granja.</p>
        <p>
          El servicio está pensado para titulares de granjas que contratan para su actividad profesional. Si contratas como consumidor, tienes además 14 días naturales desde la contratación para desistir sin dar explicaciones. Si nos pides empezar antes de que acaben esos 14 días y la declaración ya está presentada, no podrás desistir; si está a medias, te devolvemos el importe menos la parte proporcional del trabajo hecho.
        </p>
        <h3 className="text-xl font-semibold">Responsabilidad</h3>
        <p>
          Respondemos de hacer bien nuestro trabajo: revisar con cuidado y presentar en plazo cuando se cumplen las condiciones de la garantía. No respondemos de errores que vengan de datos falsos o incompletos que nos hayas dado, de retrasos porque no nos autorices o no completes tus datos a tiempo, ni de fallos o cierres de la aplicación ECOGAN ajenos a nosotros. Salvo dolo o culpa grave, nuestra responsabilidad se limita al importe que hayas pagado por la granja afectada.
        </p>
        <h3 className="text-xl font-semibold">Ley aplicable</h3>
        <p>Estos términos se rigen por la ley española. Si hay algún problema, escríbenos primero{contacto ? ` a ${contacto}` : ""} e intentaremos resolverlo.</p>
      </Seccion>

      <Seccion id="precios" titulo="3. Precios">
        <p>Precio por granja y campaña, IVA incluido:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-borde">
                <th className="py-2 pr-4">Animales</th>
                <th className="py-2 pr-4">Tamaño (plazas autorizadas)</th>
                <th className="py-2">Precio</th>
              </tr>
            </thead>
            <tbody>
              {ESPECIES.flatMap((esp) =>
                p.porEspecie[esp].map((t, i, tramos) => (
                  <tr key={`${esp}-${i}`} className="border-b border-borde">
                    <td className="py-2 pr-4">{i === 0 ? NOMBRE_ESPECIE[esp] : ""}</td>
                    <td className="py-2 pr-4">{t.hastaPlazas === null ? (i === 0 ? "Cualquier tamaño" : `Más de ${miles(tramos[i - 1].hastaPlazas ?? 0)}`) : `Hasta ${miles(t.hastaPlazas)}`}</td>
                    <td className="py-2 font-semibold">{euros(t.importe)}</td>
                  </tr>
                )),
              )}
              <tr>
                <td className="py-2 pr-4">Granja sin animales el año anterior</td>
                <td className="py-2 pr-4">Comunicación «sin actividad»</td>
                <td className="py-2 font-semibold">{euros(p.sinActividad)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc space-y-1 pl-6">
          {p.lanzamiento && (
            <li>
              Descuento de lanzamiento: {p.lanzamiento.porcentaje} % si contratas hasta el {fechaLarga(p.lanzamiento.hasta)}.
            </li>
          )}
          {p.volumen && (
            <li>
              Descuento por volumen: {p.volumen.porcentaje} % si contratas {p.volumen.desdeGranjas} o más granjas con actividad a la vez.
            </li>
          )}
          <li>
            Recargo por urgencia: {p.urgencia.porcentaje} % si contratas a partir del {fechaLarga(`${config.campana.anioPresentacion}-${p.urgencia.desde}`)}.
          </li>
        </ul>
        <p className="text-base text-texto-suave">Los descuentos y el recargo se calculan sobre la suma de los precios de las granjas. Antes de pagar ves el total exacto.</p>
      </Seccion>

      <Seccion id="garantia" titulo="4. Garantía">
        <p className="rounded-xl bg-primario-claro p-4 font-semibold">{texto(config.textos.garantia, idioma)}</p>
        <p>
          Se cumple la condición cuando, antes del {fechaLarga(config.campana.limiteGarantia)}, (1) apareces en ECOGAN autorizándonos para esa granja (o la comunidad autónoma ha tramitado tu autorización por documento) y (2) has enviado el cuestionario completo y has contestado a nuestras dudas. Si aun así no la presentamos dentro del plazo oficial, te devolvemos lo que pagaste por esa granja, por el mismo medio de pago.
        </p>
      </Seccion>

      <Seccion id="encargo" titulo="5. Encargo de gestión y de tratamiento de datos">
        <p>Al contratar nos encargas preparar y presentar en tu nombre la comunicación anual de tus granjas en ECOGAN, y te comprometes a autorizarnos en ECOGAN para hacerlo. La persona autorizada que actúa en ECOGAN es:</p>
        <p className="rounded-xl bg-superficie p-4">
          {[op.nombre, op.apellido1, op.apellido2].filter(Boolean).join(" ") || "La persona que indicamos en tu área de cliente"}
          {op.nif ? ` · NIF ${op.nif}` : ""}
          {op.email ? ` · ${op.email}` : ""}
        </p>
        <p>
          Para la parte de los datos de tu declaración (los que se presentan en ECOGAN), tú eres el responsable y nosotros actuamos como <strong>encargado del tratamiento</strong> (artículo 28 del RGPD), con estas condiciones:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Objeto:</strong> recoger, revisar, guardar y comunicar en ECOGAN los datos de tus granjas y entregarte el justificante.</li>
          <li><strong>Duración:</strong> la de la campaña contratada. Al terminar conservamos tus datos y justificantes en tu área para que los tengas y para preparar la campaña siguiente, salvo que nos pidas borrarlos o devolvértelos.</li>
          <li><strong>Datos:</strong> identificación y contacto del titular y del representante, datos de las granjas (REGA, censo, alimentación, alojamiento, gestión de estiércoles, técnicas) y los documentos que subas.</li>
          <li><strong>Solo seguimos tus instrucciones:</strong> no usamos estos datos para otra cosa ni los comunicamos a nadie salvo a ECOGAN (Ministerio) y, si lo pides, a tu comunidad autónoma.</li>
          <li><strong>Confidencialidad:</strong> las personas que los tratan están obligadas a guardar secreto.</li>
          <li><strong>Seguridad:</strong> aplicamos las medidas del apartado <a href="#seguridad" className="underline">Seguridad</a>.</li>
          <li><strong>Subencargados:</strong> nos autorizas a usar los proveedores técnicos de la lista de <a href="#privacidad" className="underline">Privacidad</a>. Si cambiamos alguno, lo publicaremos aquí.</li>
          <li><strong>Ayuda:</strong> te ayudamos a atender las peticiones de derechos y te avisaremos sin demora de cualquier brecha de seguridad que afecte a tus datos.</li>
          <li><strong>Control:</strong> te daremos la información necesaria para comprobar que cumplimos.</li>
        </ul>
      </Seccion>

      <Seccion id="privacidad" titulo="6. Política de privacidad">
        <p>
          <strong>Responsable:</strong> {titular}
          {e.nif ? `, NIF ${e.nif}` : ""}
          {e.domicilio ? `, ${e.domicilio}` : ""}
          {contacto ? `. Contacto: ${contacto}` : ""}.
        </p>
        <h3 className="text-xl font-semibold">Qué datos tratamos</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Si reservas plaza: nombre, teléfono, correo (opcional), comunidad, tipo y número de granjas y tu mensaje.</li>
          <li>Si contratas: nombre o razón social, DNI/NIE/CIF, representante, domicilio fiscal, correo, móvil y los datos de tus granjas.</li>
          <li>Los documentos que subas (por ejemplo, la autorización firmada) y los justificantes de ECOGAN.</li>
          <li>Datos del pago (importe, fecha, factura). Los datos de la tarjeta los trata directamente Stripe; nosotros no los vemos.</li>
          <li>Registro técnico: fecha, IP y navegador al aceptar estos términos, y un registro de accesos y cambios en tu expediente.</li>
        </ul>
        <h3 className="text-xl font-semibold">Para qué y con qué base legal</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Atender tu reserva y llamarte: a petición tuya, antes de contratar (art. 6.1.b RGPD).</li>
          <li>Prestar el servicio contratado, mandarte recordatorios y avisos del expediente: ejecución del contrato (art. 6.1.b).</li>
          <li>Facturar y cumplir obligaciones contables y fiscales: obligación legal (art. 6.1.c).</li>
          <li>Avisarte de la campaña del año siguiente, que es el mismo servicio: interés legítimo (art. 6.1.f RGPD y art. 21.2 LSSI). Puedes pedir que no lo hagamos en cualquier momento.</li>
        </ul>
        <p>No tomamos decisiones automatizadas sobre ti ni hacemos perfiles. No vendemos ni cedemos tus datos.</p>
        <h3 className="text-xl font-semibold">A quién se comunican</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Al Ministerio de Agricultura, Pesca y Alimentación, a través de ECOGAN, porque es el objeto del servicio.</li>
          <li>A tu comunidad autónoma, cuando la autorización se tramita por documento.</li>
          <li>A la Administración tributaria, cuando la ley lo exige.</li>
        </ul>
        <p>Proveedores que nos prestan servicios técnicos (encargados del tratamiento):</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Supabase: base de datos, acceso y archivos, alojados en la Unión Europea.</li>
          <li>Vercel: alojamiento de la web, con el servidor en Fráncfort (UE).</li>
          <li>Stripe: cobro y facturas.</li>
          <li>Resend: envío de correos.</li>
        </ul>
        <p>
          Algunos de estos proveedores son empresas de EE. UU. o pertenecen a grupos de EE. UU. Cuando hay transferencia internacional, se hace con las garantías del RGPD (Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo de la Comisión Europea).
        </p>
        <h3 className="text-xl font-semibold">Cuánto tiempo</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Reservas sin contratar: hasta que termine el plazo de presentación de la campaña para la que reservas; después las borramos.</li>
          <li>Clientes: mientras seas cliente y, después, bloqueados durante los plazos legales (6 años para facturas y documentación contable, art. 30 del Código de Comercio; y los plazos de prescripción de posibles responsabilidades).</li>
        </ul>
        <h3 className="text-xl font-semibold">Tus derechos</h3>
        <p>
          Puedes pedir acceder a tus datos, corregirlos, borrarlos, llevártelos (portabilidad), limitar su uso u oponerte, y retirar tu consentimiento, escribiéndonos{contacto ? ` a ${contacto}` : ""} desde el correo con el que te diste de alta. Te contestamos en un mes como máximo. Si no estás de acuerdo con nuestra respuesta, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
        </p>
      </Seccion>

      <Seccion id="cookies" titulo="7. Cookies">
        <p>
          Solo usamos cookies técnicas, necesarias para que la web funcione: la de tu sesión cuando entras en tu área y, si cambias de idioma, la que lo recuerda. No usamos cookies de analítica, publicidad ni redes sociales, por eso no te pedimos consentimiento (art. 22.2 LSSI).
        </p>
        <p>Al pagar te llevamos a la página de Stripe, que usa sus propias cookies para procesar el pago y prevenir el fraude.</p>
      </Seccion>

      <Seccion id="seguridad" titulo="8. Seguridad">
        <ul className="list-disc space-y-1 pl-6">
          <li>Toda la web va cifrada (HTTPS).</li>
          <li>Entras con un enlace que te mandamos al correo, que caduca y solo sirve una vez. No hay contraseñas que se puedan robar.</li>
          <li>Cada cliente solo ve sus propias granjas y documentos. Lo impone la propia base de datos (seguridad a nivel de fila), no solo la web, y lo comprobamos con pruebas automáticas.</li>
          <li>Los documentos se guardan en un almacén privado y solo se abren con enlaces temporales de pocos minutos.</li>
          <li>El pago lo procesa Stripe, certificado PCI DSS. Nunca vemos ni guardamos el número de tu tarjeta.</li>
          <li>Registramos quién accede a cada expediente y qué cambia.</li>
          <li>Nunca te pedimos tu Cl@ve ni tu certificado digital, y nunca entramos en ECOGAN con tus credenciales. Todo lo que se presenta lo revisa antes una persona.</li>
        </ul>
        <p>Si ves algo raro o crees que tus datos pueden estar en riesgo, escríbenos{contacto ? ` a ${contacto}` : ""}.</p>
      </Seccion>
    </article>
  );
}
