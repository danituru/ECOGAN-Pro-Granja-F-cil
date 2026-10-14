"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Especie } from "@/domain/especies";
import type { Datos, Item, Valor } from "@/domain/catalogo/tipos";
import type { ListasOpciones } from "@/domain/catalogo/opciones";
import {
  pantallas as calcularPantallas,
  escribir,
  leer,
  anadirItem,
  quitarItem,
  indiceSiguiente,
  indicePrimeraDeElemento,
  progreso,
  tituloItem,
  type Pantalla,
} from "@/domain/cuestionario";
import { validar, hayErrores } from "@/domain/validaciones";
import { CampoInput } from "./CampoInput";

interface Props {
  especie: Especie;
  datos: Datos;
  listas: ListasOpciones;
  onChange: (datos: Datos) => void;
  /** Pantalla final: recibe los datos ya validados. */
  final: (datos: Datos) => React.ReactNode;
}

/** Formulario guiado: una pregunta por pantalla, recalculando qué se pregunta tras cada respuesta. */
export function Formulario({ especie, datos, listas, onChange, final }: Props) {
  const t = useTranslations("formulario");
  const tc = useTranslations("comun");
  const ps = useMemo(() => calcularPantallas(datos, especie), [datos, especie]);
  const [clave, setClave] = useState<string | null>(ps[0]?.clave ?? null);
  const [historial, setHistorial] = useState<string[]>([]);

  const indice = clave === null ? ps.length : Math.max(0, ps.findIndex((p) => p.clave === clave));
  const pantalla: Pantalla | undefined = clave === null ? undefined : ps[indice];
  const { respondidas, total } = progreso(datos, especie);

  const ir = (i: number) => {
    setHistorial((h) => [...h, clave ?? "__final"]);
    setClave(i >= ps.length ? null : ps[i].clave);
    window.scrollTo({ top: 0 });
  };
  const atras = () => {
    const anterior = historial.at(-1);
    if (!anterior) return;
    setHistorial((h) => h.slice(0, -1));
    setClave(anterior === "__final" ? null : anterior);
  };

  const cambiar = (v: Valor) => pantalla?.tipo === "campo" && onChange(escribir(datos, pantalla.ruta, v));

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex justify-between text-base text-texto-suave">
          <span>{t("pregunta", { n: Math.min(indice + 1, ps.length), total: ps.length })}</span>
          <span>
            {respondidas}/{total} obligatorias
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-borde" aria-hidden>
          <div className="h-full bg-primario transition-all" style={{ width: `${total ? (respondidas / total) * 100 : 0}%` }} />
        </div>
      </div>

      {!pantalla && final(datos)}

      {pantalla?.tipo === "campo" && (
        <section className="tarjeta space-y-5" aria-live="polite">
          {pantalla.migas.length > 0 && <p className="text-base font-medium text-primario">{pantalla.migas.join(" › ")}</p>}
          <h2 className="text-2xl font-bold leading-snug">{pantalla.campo.pregunta.es}</h2>
          {pantalla.campo.ayuda && <p className="rounded-lg bg-fondo p-3 text-base text-texto-suave">💡 {pantalla.campo.ayuda.es}</p>}
          <CampoInput
            key={pantalla.clave}
            campo={pantalla.campo}
            ctx={pantalla.ctx}
            valor={leer(datos, pantalla.ruta)}
            listas={listas}
            raiz={datos}
            onChange={cambiar}
          />
          {pantalla.campo.sugerencia && (() => {
            const s = pantalla.campo.sugerencia(pantalla.ctx);
            return s !== undefined && s !== null && s !== leer(datos, pantalla.ruta) ? (
              <button type="button" className="boton-secundario w-full" onClick={() => cambiar(s)}>
                {t("usarSugerencia", { valor: String(s).replace(".", ",") })}
              </button>
            ) : null;
          })()}
        </section>
      )}

      {pantalla?.tipo === "grupo" && (
        <section className="tarjeta space-y-4">
          {pantalla.migas.length > 0 && <p className="text-base font-medium text-primario">{pantalla.migas.join(" › ")}</p>}
          <h2 className="text-2xl font-bold leading-snug">{pantalla.grupo.pregunta.es}</h2>
          {pantalla.grupo.ayuda && <p className="rounded-lg bg-fondo p-3 text-base text-texto-suave">💡 {pantalla.grupo.ayuda.es}</p>}
          {pantalla.items.length === 0 && <p className="text-lg text-texto-suave">{t("noHay")}</p>}
          <ul className="space-y-2">
            {pantalla.items.map((it: Item, i: number) => (
              <li key={it._id} className="flex items-center justify-between gap-2 rounded-xl border border-borde p-3">
                <span className="text-lg font-semibold">{tituloLegible(pantalla, it, i, listas, datos)}</span>
                <span className="flex gap-2">
                  <button type="button" className="boton-peque" onClick={() => ir(indicePrimeraDeElemento(ps, [...pantalla.ruta, it._id], indice))}>
                    {t("editar")}
                  </button>
                  {!pantalla.grupo.fijo && (
                    <button type="button" className="boton-peque" onClick={() => onChange(quitarItem(datos, pantalla.ruta, it._id))}>
                      {t("quitar")}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {!pantalla.grupo.fijo && (
            <button
              type="button"
              className="boton-secundario w-full"
              onClick={() => {
                const r = anadirItem(datos, pantalla.ruta);
                onChange(r.datos);
                const nuevas = calcularPantallas(r.datos, especie);
                const k = indicePrimeraDeElemento(nuevas, [...pantalla.ruta, r.id]);
                setHistorial((h) => [...h, pantalla.clave]);
                if (k >= 0) setClave(nuevas[k].clave);
              }}
            >
              + {t("anadir", { nombre: pantalla.grupo.nombre.es })}
            </button>
          )}
        </section>
      )}

      <nav className="flex gap-3">
        <button type="button" className="boton-secundario flex-1" onClick={atras} disabled={!historial.length}>
          ← {tc("anterior")}
        </button>
        {pantalla && (
          <button type="button" className="boton flex-1" onClick={() => ir(indiceSiguiente(ps, indice))}>
            {pantalla.tipo === "grupo" ? t("terminarGrupo") : tc("siguiente")} →
          </button>
        )}
      </nav>
      {pantalla && (
        <button type="button" className="w-full text-center text-base text-primario underline" onClick={() => ir(ps.length)}>
          {t("revisar")}
        </button>
      )}
    </div>
  );
}

/** Título de un elemento: si el campo título es un desplegable, se muestra su texto y no el código. */
function tituloLegible(p: Extract<Pantalla, { tipo: "grupo" }>, it: Item, i: number, listas: ListasOpciones, datos: Datos): string {
  const valor = it[p.grupo.campoTitulo];
  const campo = p.grupo.campos.find((c) => c.tipo !== "grupo" && c.id === p.grupo.campoTitulo);
  if (campo && campo.tipo !== "grupo" && valor !== undefined) {
    if (campo.tipo === "opcion") {
      const id = typeof campo.lista === "function" ? campo.lista({ ...p.ctx, item: it, padre: p.ctx.item }) : campo.lista;
      const etiqueta = listas[id ?? ""]?.opciones.find((o) => o.valor === valor)?.etiqueta;
      if (etiqueta) return etiqueta;
    }
    if (campo.tipo === "referencia") {
      const ref = ((datos[campo.referencia ?? ""] as Item[] | undefined) ?? []).find((x) => x._id === valor);
      if (ref?.identificador) return String(ref.identificador);
    }
  }
  return tituloItem(p.grupo, it, i);
}

/** Lista de lo que falta, con enlace a cada pregunta. */
export function Revision({ especie, datos, onIr }: { especie: Especie; datos: Datos; onIr?: (ruta: string[]) => void }) {
  const t = useTranslations("formulario");
  const incidencias = validar(datos, especie);
  const errores = incidencias.filter((i) => i.nivel === "error");
  const avisos = incidencias.filter((i) => i.nivel === "aviso");
  return (
    <div className="space-y-4">
      {errores.length > 0 && (
        <div className="tarjeta border-error bg-error-fondo">
          <p className="text-lg font-semibold text-error">{t("faltan")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
            {errores.map((e, i) => (
              <li key={i}>
                <strong>{e.donde}</strong>: {e.mensaje}
                {onIr && (
                  <button type="button" className="ml-2 underline" onClick={() => onIr(e.ruta)}>
                    {t("irA")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {avisos.length > 0 && (
        <div className="tarjeta border-aviso bg-aviso-fondo">
          <p className="text-lg font-semibold text-aviso">{t("avisos")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
            {avisos.map((e, i) => (
              <li key={i}>
                <strong>{e.donde}</strong>: {e.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!hayErrores(incidencias) && <p className="tarjeta border-primario bg-primario-claro text-lg font-semibold text-primario-oscuro">✅ Todo listo para revisar.</p>}
    </div>
  );
}
