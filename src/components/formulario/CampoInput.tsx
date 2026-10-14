"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Campo, Ctx, Datos, Item, Valor } from "@/domain/catalogo/tipos";
import type { ListasOpciones } from "@/domain/catalogo/opciones";
import { formatoEcogan, parsearNumero } from "@/domain/formato";
import { mediasLotes, type Lote } from "@/domain/calculos";
import { nuevoId } from "@/domain/cuestionario";

interface Props {
  campo: Campo;
  ctx: Ctx;
  valor: Valor;
  listas: ListasOpciones;
  raiz: Datos;
  onChange: (v: Valor) => void;
}

const idLista = (c: Campo, ctx: Ctx) => (typeof c.lista === "function" ? c.lista(ctx) : c.lista);
const unidad = (c: Campo, ctx: Ctx) => (typeof c.unidad === "function" ? c.unidad(ctx) : c.unidad);

function BotonesSiNo({ valor, onChange }: { valor: Valor; onChange: (v: boolean) => void }) {
  const t = useTranslations("comun");
  return (
    <div className="grid grid-cols-2 gap-3">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={valor === v}
          className={`min-h-16 rounded-xl border-2 text-xl font-semibold transition ${valor === v ? "border-primario bg-primario text-white" : "border-borde bg-superficie hover:border-primario"}`}
        >
          {v ? t("si") : t("no")}
        </button>
      ))}
    </div>
  );
}

/** Campo numérico que acepta "1.234,5" y guarda número. */
function CampoNumero({ valor, onChange, decimales, entero, unidadTexto }: { valor: Valor; onChange: (v: Valor) => void; decimales?: number; entero?: boolean; unidadTexto?: string }) {
  const [texto, setTexto] = useState(typeof valor === "number" ? formatoEcogan(valor, entero ? 0 : (decimales ?? 2)).replace(/,?0+$/, "") || "0" : "");
  useEffect(() => {
    if (typeof valor !== "number") return;
    const actual = parsearNumero(texto);
    if (actual !== valor) setTexto(String(valor).replace(".", ","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return (
    <div className="flex items-center gap-3">
      <input
        className="campo max-w-56 text-2xl"
        inputMode={entero ? "numeric" : "decimal"}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          const n = parsearNumero(e.target.value);
          onChange(n === null ? undefined : entero ? Math.round(n) : n);
        }}
        autoFocus
      />
      {unidadTexto && <span className="text-lg text-texto-suave">{unidadTexto}</span>}
    </div>
  );
}

function Lotes({ valor, onChange, ctx }: { valor: Valor; onChange: (v: Valor) => void; ctx: Ctx }) {
  const t = useTranslations("formulario");
  const lotes = (Array.isArray(valor) ? valor : []) as Item[];
  const fijar = (id: string, clave: string, v: string) =>
    onChange(lotes.map((l) => (l._id === id ? { ...l, [clave]: parsearNumero(v) ?? undefined } : l)));
  const unidadPeso = ctx.especie === "aves_puesta" ? "g" : "kg";
  const campos: [string, string][] = [
    ["animalesEntran", t("animalesEntran")],
    ["animalesSalen", t("animalesSalen")],
    ["porcentajeBajas", t("bajas")],
    ["pesoEntrada", `${t("pesoEntrada")} (${unidadPeso})`],
    ["pesoSalida", `${t("pesoSalida")} (${unidadPeso})`],
    ["diasOcupacion", t("diasOcupacion")],
    ["diasVacio", t("diasVacio")],
  ];
  const m = lotes.length ? mediasLotes(lotes as unknown as Lote[]) : null;
  return (
    <div className="space-y-4">
      {lotes.map((l, i) => (
        <fieldset key={l._id} className="rounded-xl border border-borde p-4">
          <legend className="px-1 font-semibold">{t("lote", { n: i + 1 })}</legend>
          <div className="grid grid-cols-2 gap-3">
            {campos.map(([clave, etiqueta]) => (
              <label key={clave} className="text-base">
                {etiqueta}
                <input
                  className="campo mt-1"
                  inputMode="decimal"
                  defaultValue={l[clave] === undefined ? "" : String(l[clave]).replace(".", ",")}
                  onChange={(e) => fijar(l._id, clave, e.target.value)}
                />
              </label>
            ))}
          </div>
          <button type="button" className="boton-peque mt-3" onClick={() => onChange(lotes.filter((x) => x._id !== l._id))}>
            {t("quitar")}
          </button>
        </fieldset>
      ))}
      <button type="button" className="boton-secundario w-full" onClick={() => onChange([...lotes, { _id: nuevoId() }])}>
        + {t("anadirLote")}
      </button>
      {m?.plazasOcupadas != null && (
        <p className="rounded-xl bg-primario-claro p-4 text-lg">{t("resultadoLotes", { plazas: m.plazasOcupadas })}</p>
      )}
    </div>
  );
}

export function CampoInput({ campo, ctx, valor, listas, raiz, onChange }: Props) {
  const t = useTranslations("formulario");

  switch (campo.tipo) {
    case "si_no":
    case "check":
      return <BotonesSiNo valor={valor} onChange={onChange} />;

    case "opcion":
    case "referencia": {
      const opciones =
        campo.tipo === "opcion"
          ? (listas[idLista(campo, ctx) ?? ""]?.opciones ?? [])
          : (((raiz[campo.referencia ?? ""] as Item[] | undefined) ?? []).map((x) => ({ valor: x._id, etiqueta: String(x.identificador ?? "—"), ayuda: undefined })));
      return (
        <div className="grid gap-2" role="radiogroup">
          {opciones.map((o) => (
            <label key={o.valor} className="opcion">
              <input type="radio" name={campo.id} checked={valor === o.valor} onChange={() => onChange(o.valor)} className="size-5 shrink-0 accent-primario" />
              <span>
                {o.etiqueta}
                {o.ayuda && <span className="block text-base text-texto-suave">{o.ayuda}</span>}
              </span>
            </label>
          ))}
        </div>
      );
    }

    case "numero":
    case "entero":
    case "anio":
      return <CampoNumero key={campo.id} valor={valor} onChange={onChange} decimales={campo.decimales} entero={campo.tipo !== "numero"} unidadTexto={unidad(campo, ctx)} />;

    case "texto":
      return <input className="campo text-xl" value={typeof valor === "string" ? valor : ""} onChange={(e) => onChange(e.target.value)} autoFocus />;

    case "cantidades": {
      const lista = listas[idLista(campo, ctx) ?? ""]?.opciones ?? [];
      const actual = (valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {}) as Record<string, number>;
      return (
        <div className="space-y-2">
          {lista.map((o) => (
            <label key={o.valor} className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-superficie p-3">
              <span className="text-lg">{o.etiqueta}</span>
              <input
                className="campo max-w-32"
                inputMode="decimal"
                placeholder="0"
                defaultValue={actual[o.valor] ? String(actual[o.valor]).replace(".", ",") : ""}
                aria-label={`${t("cantidad")} ${o.etiqueta}`}
                onChange={(e) => {
                  const n = parsearNumero(e.target.value);
                  const siguiente = { ...actual };
                  if (n) siguiente[o.valor] = n;
                  else delete siguiente[o.valor];
                  onChange(siguiente);
                }}
              />
            </label>
          ))}
          {unidad(campo, ctx) && <p className="text-base text-texto-suave">{unidad(campo, ctx)}</p>}
        </div>
      );
    }

    case "lotes":
      return <Lotes valor={valor} onChange={onChange} ctx={ctx} />;

    default:
      return null;
  }
}
