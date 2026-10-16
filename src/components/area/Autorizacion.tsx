"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { avisarAutorizado, pedirAyuda, registrarAutorizacion } from "@/app/[locale]/mi-area/acciones";
import { supabaseNavegador } from "@/lib/supabase/client";

interface Props {
  campanaId: string;
  titularId: string;
  telefono: string;
  comunidad: string;
  enlaceEcogan: string;
  viaDocumento: boolean;
  autorizado: { nombre: string; apellido1: string; apellido2: string; nif: string; email: string };
  esEmpresa: boolean;
  representante: string | null;
  yaAvisado: boolean;
}

const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-fondo px-3 py-2">
      <span className="text-base text-texto-suave">{etiqueta}</span>
      <span className="flex items-center gap-2 font-mono text-lg font-semibold">
        {valor || "—"}
        {valor && (
          <button type="button" className="text-sm font-normal text-primario underline" onClick={() => navigator.clipboard?.writeText(valor)}>
            copiar
          </button>
        )}
      </span>
    </div>
  );
}

function GuiaClave(p: Props) {
  const pasos: { titulo: string; texto: React.ReactNode; imagen?: string }[] = [
    {
      titulo: "Entra en ECOGAN con tu Cl@ve",
      texto: (
        <>
          Abre ECOGAN desde{" "}
          <a href={p.enlaceEcogan} target="_blank" rel="noopener" className="font-semibold text-primario underline">
            este enlace de {p.comunidad}
          </a>{" "}
          y entra con tu Cl@ve (app Cl@ve, Cl@ve permanente) o tu certificado digital
          {p.esEmpresa ? ` con el DNI de ${p.representante ?? "la persona que representa a la empresa"}` : ""}.
        </>
      ),
    },
    { titulo: "Pulsa «Gestión de Autorizados»", texto: "Está arriba, en la barra verde, al lado de «INICIO».", imagen: "/guia/1-menu-gestion-autorizados.png" },
    { titulo: "Pulsa «Nuevo Autorizado»", texto: "Es el botón con el símbolo +.", imagen: "/guia/2-nuevo-autorizado.png" },
    {
      titulo: "Marca tu comunidad y escribe nuestros datos",
      texto: (
        <>
          Marca <strong>{p.comunidad}</strong> (y cualquier otra comunidad donde tengas granjas) y copia estos datos:
          <span className="mt-3 block space-y-2">
            <Dato etiqueta="NIF" valor={p.autorizado.nif} />
            <Dato etiqueta="E-mail" valor={p.autorizado.email} />
            <Dato etiqueta="Nombre" valor={p.autorizado.nombre} />
            <Dato etiqueta="Primer apellido" valor={p.autorizado.apellido1} />
            <Dato etiqueta="Segundo apellido" valor={p.autorizado.apellido2} />
          </span>
        </>
      ),
      imagen: "/guia/3-formulario-autorizado.png",
    },
    { titulo: "Marca «Autorización Responsable» y pulsa «Añadir»", texto: "Verás nuestro nombre en la lista de autorizados. ¡Ya está! Vale para este año y los siguientes.", imagen: "/guia/4-autorizado-en-lista.png" },
  ];
  return (
    <ol className="space-y-4">
      {pasos.map((paso, i) => (
        <li key={i} className="tarjeta space-y-3">
          <h3 className="flex items-start gap-3 text-xl font-bold">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primario text-lg text-white">{i + 1}</span>
            <span className="pt-0.5">{paso.titulo}</span>
          </h3>
          <div className="text-lg">{paso.texto}</div>
          {paso.imagen && (
            <Image src={paso.imagen} alt={`Captura del paso ${i + 1}`} width={800} height={500} className="h-auto w-full rounded-lg border border-borde" />
          )}
        </li>
      ))}
      <p className="text-sm text-texto-suave">Capturas: manual de usuario de ECOGAN (Ministerio de Agricultura, Pesca y Alimentación).</p>
    </ol>
  );
}

// TODO: verificar normativa — vías de registro en Cl@ve según clave.gob.es; revisar cada campaña por si cambian.
function SinClave({ esEmpresa }: { esEmpresa: boolean }) {
  return (
    <details className="tarjeta">
      <summary className="cursor-pointer text-lg font-semibold text-primario">¿No tienes Cl@ve? Cómo sacarla</summary>
      <div className="mt-3 space-y-3 text-lg">
        <p>
          Cl@ve es el sistema del Gobierno para identificarte por internet. Es gratis y solo te registras una vez. Si ya la usas para la renta o la Seguridad Social, ya la tienes.
          {esEmpresa && " Como la granja es de una empresa, la Cl@ve tiene que ser de la persona que la representa."}
        </p>
        <ol className="space-y-3">
          <li className="rounded-xl bg-fondo p-3">
            <strong>1. Desde el móvil (lo más rápido).</strong> Descarga la app oficial «Cl@ve» en tu móvil (Android o iPhone), pulsa registrarte y sigue los pasos. Te identificas con tu DNI: acercándolo al móvil si es electrónico, o por videollamada.
          </li>
          <li className="rounded-xl bg-fondo p-3">
            <strong>2. Con una carta a casa.</strong> Pide la «carta de invitación» en{" "}
            <a href="https://clave.gob.es" target="_blank" rel="noopener" className="underline">
              clave.gob.es
            </a>
            . Te llega por correo postal en unos días con un código para terminar el registro.
          </li>
          <li className="rounded-xl bg-fondo p-3">
            <strong>3. En persona.</strong> En una oficina de la Agencia Tributaria o de la Seguridad Social, con tu DNI. Pide cita antes.
          </li>
        </ol>
        <p>
          También vale un <strong>certificado digital</strong> instalado en tu ordenador, por ejemplo si te lo hizo tu cooperativa o tu gestoría.
        </p>
        <p className="text-base text-texto-suave">Si te lías, pulsa «Necesito ayuda» abajo y lo hacemos contigo por teléfono.</p>
      </div>
    </details>
  );
}

export function Autorizacion(p: Props) {
  const [ayuda, setAyuda] = useState(false);
  const [telefono, setTelefono] = useState(p.telefono);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<string | null>(p.yaAvisado ? "Nos has avisado. Lo comprobamos en ECOGAN y te avisamos para seguir." : null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();
  const [verClave, setVerClave] = useState(!p.viaDocumento);

  const subir = (archivo: File) =>
    empezar(async () => {
      setError(null);
      if (!TIPOS.includes(archivo.type)) return setError("Tiene que ser un PDF o una foto.");
      if (archivo.size > 15 * 1024 * 1024) return setError("El archivo pesa más de 15 MB.");
      const ext = archivo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const ruta = `${p.titularId}/${p.campanaId}/autorizacion-${Date.now()}.${ext}`;
      const { error: e } = await supabaseNavegador().storage.from("documentos").upload(ruta, archivo, { contentType: archivo.type });
      if (e) return setError("No se pudo subir el archivo. Inténtalo otra vez.");
      const r = await registrarAutorizacion(p.campanaId, ruta, archivo.name, archivo.type);
      if (!r.ok) return setError(r.error);
      setEstado("Documento recibido. Lo enviamos nosotros a la comunidad autónoma y te avisamos cuando esté hecho.");
    });

  return (
    <div className="space-y-8">
      {estado && <p className="tarjeta border-primario bg-primario-claro text-lg font-semibold text-primario-oscuro" role="status">✅ {estado}</p>}

      {p.viaDocumento && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">La forma más fácil: firmar un documento</h2>
          <p className="text-lg">En {p.comunidad} puedes autorizarnos con un documento firmado, sin entrar en ECOGAN ni usar Cl@ve.</p>
          <ol className="space-y-4">
            <li className="tarjeta space-y-3">
              <h3 className="text-xl font-bold">1. Descarga el documento, ya rellenado con tus datos</h3>
              <a href={`/api/autorizacion/${p.campanaId}`} className="boton w-full">
                📄 Descargar el documento
              </a>
            </li>
            <li className="tarjeta space-y-2">
              <h3 className="text-xl font-bold">2. Fírmalo</h3>
              <p className="text-lg">Imprímelo y fírmalo a mano en el recuadro «TITULAR»{p.esEmpresa ? " (firma el representante de la empresa)" : ""}. Si sabes, también puedes firmarlo con tu certificado digital.</p>
            </li>
            <li className="tarjeta space-y-3">
              <h3 className="text-xl font-bold">3. Haz una foto o súbelo</h3>
              <p className="text-lg">Que se lea bien todo el documento. Nosotros lo firmamos como autorizados y lo enviamos a la comunidad autónoma.</p>
              <label className="boton-secundario w-full cursor-pointer">
                📷 {pendiente ? "Subiendo…" : "Hacer foto o elegir archivo"}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={pendiente}
                  onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])}
                />
              </label>
              {error && <p className="text-base text-error" role="alert">{error}</p>}
            </li>
          </ol>
          <button type="button" className="w-full text-center text-base text-primario underline" onClick={() => setVerClave((v) => !v)}>
            {verClave ? "Ocultar" : "Prefiero hacerlo yo en ECOGAN con mi Cl@ve"}
          </button>
        </section>
      )}

      {verClave && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">{p.viaDocumento ? "Alternativa: con tu Cl@ve en ECOGAN" : "Autorízanos en ECOGAN con tu Cl@ve"}</h2>
          <SinClave esEmpresa={p.esEmpresa} />
          <GuiaClave {...p} />
          {!p.yaAvisado && (
            <button
              type="button"
              className="boton w-full"
              disabled={pendiente}
              onClick={() =>
                empezar(async () => {
                  const r = await avisarAutorizado(p.campanaId);
                  if (r.ok) setEstado("Gracias. Lo comprobamos en ECOGAN y te avisamos para seguir con los datos.");
                  else setError(r.error);
                })
              }
            >
              ✅ Ya lo he hecho
            </button>
          )}
        </section>
      )}

      <section className="tarjeta space-y-3">
        <h2 className="text-xl font-bold">¿Te has liado?</h2>
        {!ayuda ? (
          <button type="button" className="boton-secundario w-full" onClick={() => setAyuda(true)}>
            🆘 Necesito ayuda
          </button>
        ) : (
          <div className="space-y-3">
            <label htmlFor="tel-ayuda" className="etiqueta">
              ¿A qué teléfono te llamamos?
            </label>
            <input id="tel-ayuda" type="tel" inputMode="tel" className="campo" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <label htmlFor="msg-ayuda" className="etiqueta">
              ¿Qué te pasa? (opcional)
            </label>
            <textarea id="msg-ayuda" rows={2} className="campo" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
            <button
              type="button"
              className="boton w-full"
              disabled={pendiente}
              onClick={() =>
                empezar(async () => {
                  const r = await pedirAyuda(p.campanaId, telefono, mensaje);
                  if (r.ok) {
                    setAyuda(false);
                    setEstado("Te llamaremos lo antes posible para ayudarte por teléfono o videollamada.");
                  } else setError(r.error);
                })
              }
            >
              Que me llamen
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
