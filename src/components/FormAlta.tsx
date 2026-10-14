"use client";

import { useState, useTransition } from "react";
import { iniciarAlta } from "@/app/[locale]/contratar/acciones";
import { COMUNIDADES } from "@/domain/comunidades";
import { ESPECIES, NOMBRE_ESPECIE, type Especie } from "@/domain/especies";
import { calcularPresupuesto, euros, type ConfigPrecios } from "@/domain/precios";
import { Link } from "@/i18n/navigation";

interface GranjaForm {
  rega: string;
  nombre: string;
  comunidad: string;
  municipio: string;
  especie: Especie | "";
  capacidad: string;
  integrada: boolean;
  integradora: string;
  sinActividad: boolean;
}

const granjaVacia = (): GranjaForm => ({ rega: "", nombre: "", comunidad: "", municipio: "", especie: "", capacidad: "", integrada: false, integradora: "", sinActividad: false });

function Campo({ id, etiqueta, error, children, ayuda }: { id: string; etiqueta: string; error?: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta">
        {etiqueta}
      </label>
      {ayuda && <p className="-mt-1 mb-2 text-base text-texto-suave">{ayuda}</p>}
      {children}
      {error && <p className="mt-1 text-base text-error">{error}</p>}
    </div>
  );
}

export function FormAlta({ precios, anioPresentacion, garantia }: { precios: ConfigPrecios; anioPresentacion: number; garantia: string }) {
  const [tipo, setTipo] = useState<"fisica" | "juridica">("fisica");
  const [d, setD] = useState({ nombre: "", apellidos: "", nif: "", representanteNombre: "", representanteNif: "", email: "", telefono: "", direccion: "", municipio: "", provincia: "", codigoPostal: "" });
  const [granjas, setGranjas] = useState<GranjaForm[]>([granjaVacia()]);
  const [acepta, setAcepta] = useState({ terminos: false, privacidad: false, encargo: false });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  const fijar = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD((x) => ({ ...x, [k]: e.target.value }));
  const fijarGranja = (i: number, cambio: Partial<GranjaForm>) => setGranjas((gs) => gs.map((g, j) => (j === i ? { ...g, ...cambio } : g)));

  const completas = granjas.filter((g) => g.especie && Number(g.capacidad) > 0);
  const presupuesto = completas.length
    ? calcularPresupuesto(precios, completas.map((g) => ({ especie: g.especie as Especie, plazas: Number(g.capacidad), sinActividad: g.sinActividad })), new Date(), anioPresentacion)
    : null;

  const enviar = () => {
    setGeneral(null);
    empezar(async () => {
      const r = await iniciarAlta({
        tipo,
        ...d,
        apellidos: tipo === "fisica" ? d.apellidos : undefined,
        representanteNombre: tipo === "juridica" ? d.representanteNombre : undefined,
        representanteNif: tipo === "juridica" ? d.representanteNif : undefined,
        granjas: granjas.map((g) => ({ ...g, capacidad: g.capacidad as unknown as number, especie: g.especie as Especie, comunidad: g.comunidad as (typeof COMUNIDADES)[number] })),
        aceptaTerminos: acepta.terminos as true,
        aceptaPrivacidad: acepta.privacidad as true,
        aceptaEncargo: acepta.encargo as true,
      });
      if (r.ok) {
        window.location.href = r.url;
        return;
      }
      setErrores(r.errores);
      setGeneral(r.general ?? (Object.keys(r.errores).length ? "Revisa los datos marcados en rojo." : null));
      setTimeout(() => document.querySelector(".text-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    });
  };

  return (
    <div className="space-y-8">
      <section className="tarjeta space-y-5">
        <h2 className="text-2xl font-bold">1. Tus datos</h2>
        <fieldset>
          <legend className="etiqueta">La granja está a nombre de</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([["fisica", "Una persona"], ["juridica", "Una empresa, cooperativa o comunidad de bienes"]] as const).map(([v, t]) => (
              <label key={v} className="opcion">
                <input type="radio" name="tipo" checked={tipo === v} onChange={() => setTipo(v)} className="size-5 accent-primario" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
        <Campo id="nombre" etiqueta={tipo === "fisica" ? "Nombre" : "Nombre de la empresa"} error={errores.nombre}>
          <input id="nombre" className="campo" value={d.nombre} onChange={fijar("nombre")} autoComplete={tipo === "fisica" ? "given-name" : "organization"} />
        </Campo>
        {tipo === "fisica" && (
          <Campo id="apellidos" etiqueta="Apellidos" error={errores.apellidos}>
            <input id="apellidos" className="campo" value={d.apellidos} onChange={fijar("apellidos")} autoComplete="family-name" />
          </Campo>
        )}
        <Campo id="nif" etiqueta={tipo === "fisica" ? "DNI o NIE" : "CIF"} error={errores.nif}>
          <input id="nif" className="campo uppercase" value={d.nif} onChange={fijar("nif")} />
        </Campo>
        {tipo === "juridica" && (
          <>
            <Campo id="representanteNombre" etiqueta="Persona que representa a la empresa (nombre y apellidos)" error={errores.representanteNombre} ayuda="Es quien tendrá que darnos la autorización en ECOGAN.">
              <input id="representanteNombre" className="campo" value={d.representanteNombre} onChange={fijar("representanteNombre")} />
            </Campo>
            <Campo id="representanteNif" etiqueta="DNI o NIE del representante" error={errores.representanteNif}>
              <input id="representanteNif" className="campo uppercase" value={d.representanteNif} onChange={fijar("representanteNif")} />
            </Campo>
          </>
        )}
        <Campo id="email" etiqueta="Correo electrónico" error={errores.email} ayuda="Te mandaremos aquí el enlace para entrar y el justificante.">
          <input id="email" type="email" inputMode="email" className="campo" value={d.email} onChange={fijar("email")} autoComplete="email" />
        </Campo>
        <Campo id="telefono" etiqueta="Móvil" error={errores.telefono}>
          <input id="telefono" type="tel" inputMode="tel" className="campo" value={d.telefono} onChange={fijar("telefono")} autoComplete="tel" />
        </Campo>
        <Campo id="direccion" etiqueta="Domicilio fiscal (calle y número)" error={errores.direccion}>
          <input id="direccion" className="campo" value={d.direccion} onChange={fijar("direccion")} autoComplete="street-address" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="municipio" etiqueta="Municipio" error={errores.municipio}>
            <input id="municipio" className="campo" value={d.municipio} onChange={fijar("municipio")} autoComplete="address-level2" />
          </Campo>
          <Campo id="provincia" etiqueta="Provincia" error={errores.provincia}>
            <input id="provincia" className="campo" value={d.provincia} onChange={fijar("provincia")} autoComplete="address-level1" />
          </Campo>
          <Campo id="codigoPostal" etiqueta="Código postal" error={errores.codigoPostal}>
            <input id="codigoPostal" inputMode="numeric" className="campo" value={d.codigoPostal} onChange={fijar("codigoPostal")} autoComplete="postal-code" />
          </Campo>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">2. Tus granjas</h2>
        {errores.granjas && <p className="text-base text-error">{errores.granjas}</p>}
        {granjas.map((g, i) => {
          const e = (k: string) => errores[`granjas.${i}.${k}`];
          return (
            <fieldset key={i} className="tarjeta space-y-4">
              <legend className="sr-only">Granja {i + 1}</legend>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Granja {i + 1}</h3>
                {granjas.length > 1 && (
                  <button type="button" className="boton-peque" onClick={() => setGranjas((gs) => gs.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                )}
              </div>
              <Campo id={`rega-${i}`} etiqueta="Código REGA" error={e("rega")} ayuda="Empieza por ES y lleva 12 números. Está en tu libro de explotación.">
                <input id={`rega-${i}`} className="campo uppercase" value={g.rega} onChange={(ev) => fijarGranja(i, { rega: ev.target.value })} placeholder="ES220150000123" />
              </Campo>
              <Campo id={`nombre-${i}`} etiqueta="Nombre de la granja (opcional)">
                <input id={`nombre-${i}`} className="campo" value={g.nombre} onChange={(ev) => fijarGranja(i, { nombre: ev.target.value })} />
              </Campo>
              <Campo id={`especie-${i}`} etiqueta="Animales" error={e("especie")}>
                <select id={`especie-${i}`} className="campo" value={g.especie} onChange={(ev) => fijarGranja(i, { especie: ev.target.value as Especie })}>
                  <option value="" disabled>Elige</option>
                  {ESPECIES.map((es) => (
                    <option key={es} value={es}>{NOMBRE_ESPECIE[es]}</option>
                  ))}
                </select>
              </Campo>
              <Campo id={`capacidad-${i}`} etiqueta="Plazas autorizadas (capacidad máxima)" error={e("capacidad")} ayuda="La que figura en tu autorización o en el REGA.">
                <input id={`capacidad-${i}`} inputMode="numeric" className="campo max-w-48" value={g.capacidad} onChange={(ev) => fijarGranja(i, { capacidad: ev.target.value.replace(/\D/g, "") })} />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id={`comunidad-${i}`} etiqueta="Comunidad autónoma" error={e("comunidad")}>
                  <select id={`comunidad-${i}`} className="campo" value={g.comunidad} onChange={(ev) => fijarGranja(i, { comunidad: ev.target.value })}>
                    <option value="" disabled>Elige</option>
                    {COMUNIDADES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Campo>
                <Campo id={`gmunicipio-${i}`} etiqueta="Municipio de la granja" error={e("municipio")}>
                  <input id={`gmunicipio-${i}`} className="campo" value={g.municipio} onChange={(ev) => fijarGranja(i, { municipio: ev.target.value })} />
                </Campo>
              </div>
              <label className="flex items-center gap-3 text-lg">
                <input type="checkbox" className="size-6 accent-primario" checked={g.integrada} onChange={(ev) => fijarGranja(i, { integrada: ev.target.checked })} />
                Trabajo para una integradora
              </label>
              {g.integrada && (
                <Campo id={`integradora-${i}`} etiqueta="¿Cuál?">
                  <input id={`integradora-${i}`} className="campo" value={g.integradora} onChange={(ev) => fijarGranja(i, { integradora: ev.target.value })} />
                </Campo>
              )}
              <label className="flex items-start gap-3 text-lg">
                <input type="checkbox" className="mt-1 size-6 accent-primario" checked={g.sinActividad} onChange={(ev) => fijarGranja(i, { sinActividad: ev.target.checked })} />
                <span>
                  La granja <strong>no tuvo animales</strong> en todo el año pasado
                  <span className="block text-base text-texto-suave">Se comunica como «sin actividad», a precio reducido.</span>
                </span>
              </label>
            </fieldset>
          );
        })}
        <button type="button" className="boton-secundario w-full" onClick={() => setGranjas((gs) => [...gs, granjaVacia()])}>
          + Añadir otra granja
        </button>
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="text-2xl font-bold">3. Resumen y pago</h2>
        {presupuesto ? (
          <dl className="space-y-1 text-lg">
            {presupuesto.lineas.map((l, i) => (
              <div key={i} className="flex justify-between gap-4">
                <dt>{l.concepto}</dt>
                <dd className="font-mono">{euros(l.importe)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-borde pt-2 text-xl font-bold">
              <dt>Total (IVA incluido)</dt>
              <dd className="font-mono">{euros(presupuesto.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-lg text-texto-suave">Rellena los animales y las plazas de tus granjas para ver el precio.</p>
        )}
        <p className="rounded-xl bg-primario-claro p-3 text-base">🛡️ {garantia}</p>
        <div className="space-y-3">
          {(
            [
              ["terminos", "aceptaTerminos", <>Acepto los <Link href="/legal#terminos" className="underline" target="_blank">términos del servicio</Link>, incluida la garantía.</>],
              ["privacidad", "aceptaPrivacidad", <>He leído la <Link href="/legal#privacidad" className="underline" target="_blank">política de privacidad</Link>.</>],
              ["encargo", "aceptaEncargo", <>Encargo a GranjaFácil preparar y presentar mi declaración ECOGAN en mi nombre, me comprometo a autorizarle en ECOGAN y acepto el <Link href="/legal#encargo" className="underline" target="_blank">encargo de tratamiento de datos</Link>.</>],
            ] as const
          ).map(([k, campo, texto]) => (
            <div key={k}>
              <label className="flex items-start gap-3 text-base">
                <input type="checkbox" className="mt-1 size-6 shrink-0 accent-primario" checked={acepta[k]} onChange={(ev) => setAcepta((x) => ({ ...x, [k]: ev.target.checked }))} />
                <span>{texto}</span>
              </label>
              {errores[campo] && <p className="mt-1 text-base text-error">{errores[campo]}</p>}
            </div>
          ))}
        </div>
        {general && <p className="rounded-lg bg-error-fondo p-3 text-error" role="alert">{general}</p>}
        <button type="button" className="boton w-full" onClick={enviar} disabled={pendiente}>
          {pendiente ? "Un momento…" : presupuesto ? `Pagar ${euros(presupuesto.total)} con tarjeta` : "Pagar"}
        </button>
        <p className="text-center text-base text-texto-suave">Pago seguro con Stripe. Te enviamos la factura por correo.</p>
      </section>
    </div>
  );
}
