"use client";

import { useMemo, useState, useTransition } from "react";
import { guardarConfiguracion, guardarLista, restaurarLista, type ResultadoConfig } from "@/app/admin/configuracion/acciones";
import type { Configuracion } from "@/domain/configuracion";
import type { ConfigPrecios, TramoPrecio } from "@/domain/precios";
import type { ListaOpciones, ListasOpciones } from "@/domain/catalogo/opciones";
import { ESPECIES, NOMBRE_ESPECIE, type Especie } from "@/domain/especies";
import { valorDesdeTexto } from "@/domain/valor-opcion";
import type { ClaveConfig } from "@/domain/esquemas-config";

const aEuros = (c: number) => (c / 100).toFixed(2).replace(".", ",").replace(",00", "");
// Acepta "1.200,50", "120,5" y "120.5".
const aCentimos = (s: string) => Math.round(Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s) * 100);
const entero = (s: string) => (s.trim() === "" ? NaN : Number(s));

function useGuardar() {
  const [pendiente, empezar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const guardar = (fn: () => Promise<ResultadoConfig>, exito = "Guardado. La web se actualiza al momento.") =>
    empezar(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, texto: exito } : { ok: false, texto: r.error });
    });
  const aviso = msg && (
    <p className={`text-base ${msg.ok ? "text-primario" : "text-error"}`} role="status">
      {msg.ok ? "✓ " : "⚠ "}
      {msg.texto}
    </p>
  );
  return { pendiente, guardar, aviso };
}

function Bloque({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section className="tarjeta space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{titulo}</h2>
        {ayuda && <p className="text-base text-texto-suave">{ayuda}</p>}
      </div>
      {children}
    </section>
  );
}

function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="block space-y-1">
      <span className="etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="block text-sm text-texto-suave">{ayuda}</span>}
    </label>
  );
}

function BotonGuardar({ pendiente, onClick }: { pendiente: boolean; onClick: () => void }) {
  return (
    <button type="button" className="boton" disabled={pendiente} onClick={onClick}>
      {pendiente ? "Guardando…" : "Guardar"}
    </button>
  );
}

/* ---------------------------------------------------------------- Precios */

type TramoTexto = { hasta: string; euros: string };

export function FormPrecios({ inicial }: { inicial: ConfigPrecios }) {
  const { pendiente, guardar, aviso } = useGuardar();
  const [tramos, setTramos] = useState<Record<Especie, TramoTexto[]>>(
    () => Object.fromEntries(ESPECIES.map((e) => [e, inicial.porEspecie[e].map((t) => ({ hasta: t.hastaPlazas === null ? "" : String(t.hastaPlazas), euros: aEuros(t.importe) }))])) as Record<Especie, TramoTexto[]>,
  );
  const [sinActividad, setSinActividad] = useState(aEuros(inicial.sinActividad));
  const [urgDesde, setUrgDesde] = useState(inicial.urgencia.desde);
  const [urgPct, setUrgPct] = useState(String(inicial.urgencia.porcentaje));
  const [lanzOn, setLanzOn] = useState(!!inicial.lanzamiento);
  const [lanzHasta, setLanzHasta] = useState(inicial.lanzamiento?.hasta ?? "");
  const [lanzPct, setLanzPct] = useState(String(inicial.lanzamiento?.porcentaje ?? 20));
  const [volOn, setVolOn] = useState(!!inicial.volumen);
  const [volDesde, setVolDesde] = useState(String(inicial.volumen?.desdeGranjas ?? 3));
  const [volPct, setVolPct] = useState(String(inicial.volumen?.porcentaje ?? 10));

  const cambiarTramo = (e: Especie, i: number, campo: keyof TramoTexto, v: string) =>
    setTramos((t) => ({ ...t, [e]: t[e].map((x, j) => (j === i ? { ...x, [campo]: v } : x)) }));

  const construir = (): ConfigPrecios => ({
    porEspecie: Object.fromEntries(
      ESPECIES.map((e) => [e, tramos[e].map((t, i, ts): TramoPrecio => ({ hastaPlazas: i === ts.length - 1 ? null : entero(t.hasta), importe: aCentimos(t.euros) }))]),
    ) as ConfigPrecios["porEspecie"],
    sinActividad: aCentimos(sinActividad),
    urgencia: { desde: urgDesde.trim(), porcentaje: entero(urgPct) },
    lanzamiento: lanzOn ? { hasta: lanzHasta, porcentaje: entero(lanzPct) } : null,
    volumen: volOn ? { desdeGranjas: entero(volDesde), porcentaje: entero(volPct) } : null,
  });

  return (
    <Bloque titulo="Precios" ayuda="Por granja y campaña, IVA incluido. Salen en la portada, en «Contratar» y en la página legal.">
      <div className="grid gap-4 md:grid-cols-2">
        {ESPECIES.map((e) => (
          <div key={e} className="space-y-2 rounded-xl bg-fondo p-3">
            <h3 className="text-lg font-semibold">{NOMBRE_ESPECIE[e]}</h3>
            {tramos[e].map((t, i, ts) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-base">
                {i === ts.length - 1 ? (
                  <span className="w-44">{ts.length === 1 ? "Cualquier tamaño" : "Resto (sin límite)"}</span>
                ) : (
                  <span className="flex w-44 items-center gap-1">
                    Hasta
                    <input className="campo w-28 py-1" inputMode="numeric" value={t.hasta} onChange={(ev) => cambiarTramo(e, i, "hasta", ev.target.value)} aria-label="Plazas máximas" />
                    plazas
                  </span>
                )}
                <input className="campo w-24 py-1" inputMode="decimal" value={t.euros} onChange={(ev) => cambiarTramo(e, i, "euros", ev.target.value)} aria-label="Precio en euros" />
                €
                {ts.length > 1 && i < ts.length - 1 && (
                  <button type="button" className="text-sm text-error underline" onClick={() => setTramos((x) => ({ ...x, [e]: x[e].filter((_, j) => j !== i) }))}>
                    quitar
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="text-sm text-primario underline" onClick={() => setTramos((x) => ({ ...x, [e]: [{ hasta: "", euros: x[e][0]?.euros ?? "0" }, ...x[e]] }))}>
              + añadir tramo
            </button>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo etiqueta="Granja sin actividad (€)">
          <input className="campo" inputMode="decimal" value={sinActividad} onChange={(e) => setSinActividad(e.target.value)} />
        </Campo>
        <Campo etiqueta="Recargo por urgencia" ayuda="Desde qué día del año de campaña (MM-DD, p. ej. 02-01 = 1 de febrero) y qué porcentaje.">
          <span className="flex items-center gap-2">
            <input className="campo w-28" value={urgDesde} onChange={(e) => setUrgDesde(e.target.value)} />
            <input className="campo w-20" inputMode="numeric" value={urgPct} onChange={(e) => setUrgPct(e.target.value)} /> %
          </span>
        </Campo>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-base font-semibold">
            <input type="checkbox" className="size-5 accent-primario" checked={lanzOn} onChange={(e) => setLanzOn(e.target.checked)} /> Descuento de lanzamiento
          </label>
          {lanzOn && (
            <span className="flex flex-wrap items-center gap-2 text-base">
              hasta el <input type="date" className="campo w-44" value={lanzHasta} onChange={(e) => setLanzHasta(e.target.value)} />
              <input className="campo w-20" inputMode="numeric" value={lanzPct} onChange={(e) => setLanzPct(e.target.value)} /> %
            </span>
          )}
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-base font-semibold">
            <input type="checkbox" className="size-5 accent-primario" checked={volOn} onChange={(e) => setVolOn(e.target.checked)} /> Descuento por volumen
          </label>
          {volOn && (
            <span className="flex flex-wrap items-center gap-2 text-base">
              desde <input className="campo w-20" inputMode="numeric" value={volDesde} onChange={(e) => setVolDesde(e.target.value)} /> granjas,
              <input className="campo w-20" inputMode="numeric" value={volPct} onChange={(e) => setVolPct(e.target.value)} /> %
            </span>
          )}
        </div>
      </div>
      <BotonGuardar pendiente={pendiente} onClick={() => guardar(() => guardarConfiguracion("precios", construir()))} />
      {aviso}
    </Bloque>
  );
}

/* ---------------------------------------------------------------- Campaña y recordatorios */

export function FormCampana({ campana, recordatorios }: { campana: Configuracion["campana"]; recordatorios: Configuracion["recordatorios"] }) {
  const { pendiente, guardar, aviso } = useGuardar();
  const [anio, setAnio] = useState(String(campana.anioPresentacion));
  const [garantia, setGarantia] = useState(campana.limiteGarantia);
  const [fin, setFin] = useState(campana.finPlazo);
  const [dias, setDias] = useState(String(recordatorios.cadaDias));
  return (
    <Bloque titulo="Campaña y recordatorios" ayuda="Si cambias la fecha de la garantía, cambia también el texto de la garantía (abajo) para que digan lo mismo.">
      <div className="grid gap-4 md:grid-cols-4">
        <Campo etiqueta="Año de presentación" ayuda={`Datos del año ${Number(anio) - 1 || "—"}`}>
          <input className="campo" inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value)} />
        </Campo>
        <Campo etiqueta="Límite de la garantía">
          <input type="date" className="campo" value={garantia} onChange={(e) => setGarantia(e.target.value)} />
        </Campo>
        <Campo etiqueta="Fin del plazo de ECOGAN">
          <input type="date" className="campo" value={fin} onChange={(e) => setFin(e.target.value)} />
        </Campo>
        <Campo etiqueta="Recordatorio cada (días)">
          <input className="campo" inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Campo>
      </div>
      <BotonGuardar
        pendiente={pendiente}
        onClick={() =>
          guardar(async () => {
            const a = await guardarConfiguracion("campana", { anioPresentacion: entero(anio), limiteGarantia: garantia, finPlazo: fin });
            return a.ok ? guardarConfiguracion("recordatorios", { cadaDias: entero(dias) }) : a;
          })
        }
      />
      {aviso}
    </Bloque>
  );
}

/* ---------------------------------------------------------------- Textos */

export function FormTextos({ inicial }: { inicial: Configuracion["textos"] }) {
  const { pendiente, guardar, aviso } = useGuardar();
  const [t, setT] = useState(inicial);
  const filas: [keyof Configuracion["textos"], string, string][] = [
    ["garantia", "Garantía", "Sale igual en la portada, en «Contratar» y en los términos."],
    ["mensajeObligacion", "Mensaje sobre la obligación", "Cámbialo cuando se publique en el BOE la reforma del RD 988/2022."],
    ["eslogan", "Eslogan de la portada", ""],
  ];
  return (
    <Bloque titulo="Textos de la web">
      {filas.map(([clave, nombre, ayuda]) => (
        <div key={clave} className="grid gap-3 md:grid-cols-2">
          <Campo etiqueta={`${nombre} (castellano)`} ayuda={ayuda}>
            <textarea rows={3} className="campo text-base" value={t[clave].es} onChange={(e) => setT({ ...t, [clave]: { ...t[clave], es: e.target.value } })} />
          </Campo>
          <Campo etiqueta={`${nombre} (catalán)`} ayuda="Si lo dejas vacío, en catalán sale el texto en castellano.">
            <textarea rows={3} className="campo text-base" value={t[clave].ca ?? ""} onChange={(e) => setT({ ...t, [clave]: { ...t[clave], ca: e.target.value } })} />
          </Campo>
        </div>
      ))}
      <BotonGuardar pendiente={pendiente} onClick={() => guardar(() => guardarConfiguracion("textos", t))} />
      {aviso}
    </Bloque>
  );
}

/* ---------------------------------------------------------------- Operador y empresa */

export function FormDatos({ clave, titulo, ayuda, inicial, campos }: { clave: Extract<ClaveConfig, "operador" | "empresa">; titulo: string; ayuda: string; inicial: Record<string, string>; campos: [string, string, string?][] }) {
  const { pendiente, guardar, aviso } = useGuardar();
  const [d, setD] = useState(inicial);
  return (
    <Bloque titulo={titulo} ayuda={ayuda}>
      <div className="grid gap-4 md:grid-cols-2">
        {campos.map(([k, etiqueta, pista]) => (
          <Campo key={k} etiqueta={etiqueta} ayuda={pista}>
            <input className="campo" value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
          </Campo>
        ))}
      </div>
      <BotonGuardar pendiente={pendiente} onClick={() => guardar(() => guardarConfiguracion(clave, d))} />
      {aviso}
    </Bloque>
  );
}

/* ---------------------------------------------------------------- Listas de opciones de ECOGAN */

export function EditorListas({ listas, editadas }: { listas: ListasOpciones; editadas: string[] }) {
  const ids = useMemo(() => Object.keys(listas), [listas]);
  const [id, setId] = useState(ids[0]);
  return (
    <Bloque titulo="Opciones de ECOGAN" ayuda="Las listas de los desplegables. Corrige los textos para que coincidan exactamente con ECOGAN y marca «verificada» cuando lo hayas comprobado. Las opciones que ya existen no se pueden quitar (puede haber datos que las usan).">
      <Campo etiqueta="Lista">
        <select className="campo" value={id} onChange={(e) => setId(e.target.value)}>
          {ids.map((i) => (
            <option key={i} value={i}>
              {listas[i].verificada ? "✓" : "❓"} {listas[i].descripcion}
            </option>
          ))}
        </select>
      </Campo>
      <EditorLista key={id} lista={listas[id]} valoresProtegidos={listas[id].opciones.map((o) => o.valor)} editada={editadas.includes(id)} />
    </Bloque>
  );
}

function EditorLista({ lista, valoresProtegidos, editada }: { lista: ListaOpciones; valoresProtegidos: string[]; editada: boolean }) {
  const { pendiente, guardar, aviso } = useGuardar();
  const [l, setL] = useState(lista);
  const [nueva, setNueva] = useState("");
  const cambiar = (i: number, campo: "etiqueta" | "ayuda", v: string) => setL({ ...l, opciones: l.opciones.map((o, j) => (j === i ? { ...o, [campo]: v } : o)) });
  const anadir = () => {
    if (!nueva.trim()) return;
    let valor = valorDesdeTexto(nueva);
    while (l.opciones.some((o) => o.valor === valor)) valor = `${valor}_2`.slice(-60);
    setL({ ...l, opciones: [...l.opciones, { valor, etiqueta: nueva.trim() }] });
    setNueva("");
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-texto-suave">Fuente: {l.fuente}</p>
      <label className="flex items-center gap-2 text-base">
        <input type="checkbox" className="size-5 accent-primario" checked={l.verificada} onChange={(e) => setL({ ...l, verificada: e.target.checked })} />
        Verificada en ECOGAN
      </label>
      <ul className="space-y-2">
        {l.opciones.map((o, i) => (
          <li key={o.valor} className="grid gap-2 rounded-xl bg-fondo p-2 md:grid-cols-[1fr_1fr_auto]">
            <input className="campo py-1 text-base" value={o.etiqueta} onChange={(e) => cambiar(i, "etiqueta", e.target.value)} aria-label="Texto exacto de ECOGAN" />
            <input className="campo py-1 text-base" value={o.ayuda ?? ""} placeholder="Explicación para el ganadero (opcional)" onChange={(e) => cambiar(i, "ayuda", e.target.value)} />
            <span className="flex items-center gap-2 text-xs text-texto-suave">
              {o.valor}
              {!valoresProtegidos.includes(o.valor) && (
                <button type="button" className="text-sm text-error underline" onClick={() => setL({ ...l, opciones: l.opciones.filter((_, j) => j !== i) })}>
                  quitar
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="campo" value={nueva} placeholder="Nueva opción (texto exacto de ECOGAN)" onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), anadir())} />
        <button type="button" className="boton-peque" onClick={anadir}>
          Añadir
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <BotonGuardar pendiente={pendiente} onClick={() => guardar(() => guardarLista(l))} />
        {editada && (
          <button type="button" className="boton-secundario" disabled={pendiente} onClick={() => confirm("¿Volver a la lista original?") && guardar(() => restaurarLista(l.id), "Restaurada. Recarga la página para verla.")}>
            Restaurar la original
          </button>
        )}
      </div>
      {aviso}
    </div>
  );
}
