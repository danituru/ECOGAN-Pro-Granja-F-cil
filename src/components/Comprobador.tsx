"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { comprobarObligacion, type ClasificacionRega, type EntradaComprobador, type TipoAnimalComprobador, type TipoPlazaAve } from "@/domain/obligacion";

const PLAZA_POR_ANIMAL: Partial<Record<TipoAnimalComprobador, TipoPlazaAve>> = {
  pollos: "broiler",
  ponedoras: "gallina_ponedora",
  pavos: "pavo_engorde",
};

const ESPECIE_RESERVA: Partial<Record<TipoAnimalComprobador, string>> = {
  porcino: "porcino",
  pollos: "aves_carne",
  ponedoras: "aves_puesta",
  pavos: "pavos",
};

type Respuestas = {
  animal?: TipoAnimalComprobador;
  clasificacion?: ClasificacionRega;
  sistema?: "intensivo" | "extensivo" | "mixto" | "no_lo_se";
  reproductoras?: string;
  cebo?: string;
  plazas?: string;
  comercializa?: "si" | "no";
};

function Opciones<T extends string>({ nombre, valor, opciones, onChange }: { nombre: string; valor?: T; opciones: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2">
      {opciones.map(([v, texto]) => (
        <label key={v} className="opcion">
          <input type="radio" name={nombre} value={v} checked={valor === v} onChange={() => onChange(v)} className="size-5 accent-primario" />
          {texto}
        </label>
      ))}
    </div>
  );
}

/** Comprobador gratuito "¿Tengo que presentar ECOGAN?". Usa las reglas de src/domain/obligacion.ts. */
export function Comprobador({ onContratar }: { onContratar?: (especie?: string) => void }) {
  const t = useTranslations("comprobador");
  const [r, setR] = useState<Respuestas>({});
  const fijar = (cambio: Partial<Respuestas>) => setR((x) => ({ ...x, ...cambio }));

  const esCerdo = r.animal === "porcino";
  const esAveObligable = r.animal && r.animal !== "porcino" && r.animal !== "otra_ave";
  const num = (s?: string) => (s && s.trim() !== "" ? Number(s) : undefined);

  const completo =
    r.animal === "otra_ave" ||
    (r.animal &&
      r.clasificacion &&
      (r.clasificacion !== "produccion" && r.clasificacion !== "no_lo_se"
        ? true
        : esCerdo
          ? r.sistema && (r.sistema === "extensivo" || (r.reproductoras !== undefined && r.cebo !== undefined))
          : r.plazas !== undefined && r.comercializa));

  let resultado: ReturnType<typeof comprobarObligacion> | null = null;
  if (completo && r.animal) {
    const entrada: EntradaComprobador = {
      tipoAnimal: r.animal,
      clasificacion: r.clasificacion ?? "produccion",
      sistemaPorcino: r.sistema,
      reproductoras: num(r.reproductoras),
      plazasCebo: num(r.cebo),
      comercializa: r.comercializa ? r.comercializa === "si" : undefined,
    };
    const tipoPlaza = PLAZA_POR_ANIMAL[r.animal];
    if (tipoPlaza && num(r.plazas) !== undefined) entrada.plazasAves = { [tipoPlaza]: num(r.plazas) };
    resultado = comprobarObligacion(entrada);
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="etiqueta">1. {t("animal")}</legend>
        <Opciones
          nombre="animal"
          valor={r.animal}
          onChange={(animal) => setR({ animal })}
          opciones={[
            ["porcino", t("porcino")],
            ["pollos", t("pollos")],
            ["ponedoras", t("ponedoras")],
            ["pavos", t("pavos")],
            ["otra_ave", t("otraAve")],
          ]}
        />
      </fieldset>

      {r.animal && r.animal !== "otra_ave" && (
        <fieldset className="space-y-3">
          <legend className="etiqueta">2. {t("clasificacion")}</legend>
          <p className="text-base text-texto-suave">{t("clasificacionAyuda")}</p>
          <Opciones
            nombre="clasificacion"
            valor={r.clasificacion}
            onChange={(clasificacion) => fijar({ clasificacion })}
            opciones={[
              ["produccion", t("produccion")],
              ["reducida", t("reducida")],
              ["autoconsumo", t("autoconsumo")],
              // En porcino, tratantes y centros de concentración pueden estar obligados (informe MTD porcino 2024).
              ...(esCerdo
                ? ([
                    ["tratante", "Tratante, centro de concentración o punto de parada"],
                    ["otra_especial", "Otra especial (matadero, núcleo zoológico…)"],
                  ] as [ClasificacionRega, string][])
                : ([["otra_especial", t("especial")]] as [ClasificacionRega, string][])),
              ["cinegetica", t("cinegetica")],
              ["no_lo_se", "No lo sé"],
            ]}
          />
        </fieldset>
      )}

      {esCerdo && (r.clasificacion === "produccion" || r.clasificacion === "no_lo_se") && (
        <fieldset className="space-y-3">
          <legend className="etiqueta">3. {t("sistema")}</legend>
          <Opciones
            nombre="sistema"
            valor={r.sistema}
            onChange={(sistema) => fijar({ sistema })}
            opciones={[
              ["intensivo", t("intensivo")],
              ["extensivo", t("extensivo")],
              ["mixto", t("mixto")],
              ["no_lo_se", "No lo sé"],
            ]}
          />
        </fieldset>
      )}

      {esCerdo && r.sistema && r.sistema !== "extensivo" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reproductoras" className="etiqueta">4. {t("reproductoras")}</label>
            <input id="reproductoras" type="number" inputMode="numeric" min={0} className="campo" value={r.reproductoras ?? ""} onChange={(e) => fijar({ reproductoras: e.target.value })} />
          </div>
          <div>
            <label htmlFor="cebo" className="etiqueta">{t("cebo")}</label>
            <input id="cebo" type="number" inputMode="numeric" min={0} className="campo" value={r.cebo ?? ""} onChange={(e) => fijar({ cebo: e.target.value })} />
          </div>
        </div>
      )}

      {esAveObligable && (r.clasificacion === "produccion" || r.clasificacion === "no_lo_se") && (
        <div className="space-y-5">
          <div>
            <label htmlFor="plazas" className="etiqueta">3. {t("plazasAves")}</label>
            <input id="plazas" type="number" inputMode="numeric" min={0} className="campo max-w-48" value={r.plazas ?? ""} onChange={(e) => fijar({ plazas: e.target.value })} />
          </div>
          <fieldset className="space-y-3">
            <legend className="etiqueta">4. {t("comercializa")}</legend>
            <Opciones nombre="comercializa" valor={r.comercializa} onChange={(comercializa) => fijar({ comercializa })} opciones={[["si", "Sí"], ["no", "No"]]} />
          </fieldset>
        </div>
      )}

      {resultado && (
        <div
          role="status"
          className={`tarjeta border-2 ${resultado.estado === "obligada" ? "border-primario bg-primario-claro" : resultado.estado === "exenta" ? "border-borde" : "border-aviso bg-aviso-fondo"}`}
        >
          <p className="text-2xl font-bold">
            {resultado.estado === "obligada" ? `✅ ${t("resultadoObligada")}` : resultado.estado === "exenta" ? t("resultadoExenta") : `🔎 ${t("resultadoRevisar")}`}
          </p>
          <p className="mt-2 text-lg">{resultado.motivo}</p>
          {resultado.estado !== "exenta" && onContratar && (
            <button type="button" className="boton mt-4 w-full sm:w-auto" onClick={() => onContratar(r.animal ? ESPECIE_RESERVA[r.animal] : undefined)}>
              {resultado.estado === "obligada" ? t("contratarAhora") : t("contactar")}
            </button>
          )}
          <p className="mt-4 text-sm text-texto-suave">
            Orientativo, según el RD 306/2020 (porcino) y el RD 637/2021 (aves). Si tienes dudas, lo revisamos contigo.
          </p>
        </div>
      )}
    </div>
  );
}
