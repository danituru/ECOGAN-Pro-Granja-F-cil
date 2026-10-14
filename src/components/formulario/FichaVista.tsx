"use client";

import { useState } from "react";
import type { Ficha } from "@/domain/ficha";

/** Ficha de presentación con casillas para ir marcando lo que ya se ha copiado en ECOGAN. */
export function FichaVista({ ficha, conCasillas = true }: { ficha: Ficha; conCasillas?: boolean }) {
  const [hechos, setHechos] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-6">
      {ficha.sinActividad && (
        <p className="rounded-xl bg-aviso-fondo p-4 text-aviso">Granja sin actividad: en ECOGAN se elige «NO» en Actividad y se comunica con la declaración responsable.</p>
      )}
      {ficha.pasos.map((p) => (
        <section key={p.paso} className="space-y-3">
          <h3 className="sticky top-0 bg-fondo py-2 text-xl font-bold text-primario">{p.titulo}</h3>
          {p.secciones.map((s) => (
            <div key={s.titulo} className="tarjeta p-0">
              <h4 className="border-b border-borde px-4 py-2 text-base font-semibold">{s.titulo}</h4>
              <dl className="divide-y divide-borde">
                {s.filas.map((f, i) => {
                  const clave = `${p.paso}|${s.titulo}|${i}`;
                  return (
                    <div key={clave} className={`grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-2 text-base ${hechos[clave] ? "opacity-50" : ""}`}>
                      <dt>
                        {conCasillas && (
                          <input
                            type="checkbox"
                            className="mr-2 size-5 align-middle accent-primario"
                            checked={!!hechos[clave]}
                            onChange={(e) => setHechos((h) => ({ ...h, [clave]: e.target.checked }))}
                            aria-label={`Copiado: ${f.etiqueta}`}
                          />
                        )}
                        {f.etiqueta}
                        {f.obligatorio && <span className="text-error"> (*)</span>}
                        {!f.verificado && <span className="ml-1 rounded bg-aviso-fondo px-1 text-xs text-aviso" title="Etiqueta u opción pendiente de verificar en ECOGAN">verificar</span>}
                      </dt>
                      <dd className={`text-right font-mono font-semibold ${f.valor.startsWith("⚠") ? "text-error" : ""}`}>
                        {f.valor}
                        {conCasillas && !f.valor.startsWith("⚠") && (
                          <button type="button" className="ml-2 text-sm font-normal text-primario underline" onClick={() => navigator.clipboard?.writeText(f.valor)}>
                            copiar
                          </button>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
