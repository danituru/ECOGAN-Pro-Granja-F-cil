"use client";

import { useEffect, useState } from "react";
import { ESPECIES, NOMBRE_ESPECIE, type Especie } from "@/domain/especies";
import type { Datos } from "@/domain/catalogo/tipos";
import type { ListasOpciones } from "@/domain/catalogo/opciones";
import { EJEMPLOS } from "@/domain/ejemplos";
import { generarFicha } from "@/domain/ficha";
import { Formulario, Revision } from "./formulario/Formulario";
import { FichaVista } from "./formulario/FichaVista";

const CLAVE = (e: Especie) => `granjafacil-demo-${e}`;

function cargar(e: Especie): Datos | null {
  try {
    const t = localStorage.getItem(CLAVE(e));
    return t ? (JSON.parse(t) as Datos) : null;
  } catch {
    return null;
  }
}
function guardar(e: Especie, d: Datos) {
  try {
    localStorage.setItem(CLAVE(e), JSON.stringify(d));
  } catch {
    // Sin almacenamiento (modo privado): la demo sigue funcionando en memoria.
  }
}
function borrar(e: Especie) {
  try {
    localStorage.removeItem(CLAVE(e));
  } catch {}
}

/** Demostración del formulario para visitas comerciales: no usa base de datos. */
export function Demo({ listas }: { listas: ListasOpciones }) {
  const [especie, setEspecie] = useState<Especie | null>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const [verFicha, setVerFicha] = useState(false);

  useEffect(() => {
    if (especie) setDatos(cargar(especie));
  }, [especie]);

  const empezar = (d: Datos) => {
    if (!especie) return;
    guardar(especie, d);
    setDatos(d);
    setVuelta((v) => v + 1);
  };

  if (!especie) {
    return (
      <div className="space-y-4">
        <p className="text-lg">Elige el tipo de granja para ver las preguntas que contestaría el ganadero:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ESPECIES.map((e) => (
            <button key={e} type="button" className="boton-secundario" onClick={() => setEspecie(e)}>
              {NOMBRE_ESPECIE[e]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="space-y-4">
        <p className="text-lg">
          <strong>{NOMBRE_ESPECIE[especie]}</strong>. ¿Cómo quieres empezar?
        </p>
        {EJEMPLOS[especie] && (
          <button type="button" className="boton w-full" onClick={() => empezar(structuredClone(EJEMPLOS[especie]!))}>
            Con una granja de ejemplo ya rellena
          </button>
        )}
        <button type="button" className="boton-secundario w-full" onClick={() => empezar({})}>
          En blanco
        </button>
        <button type="button" className="w-full text-base underline" onClick={() => setEspecie(null)}>
          Cambiar de tipo de granja
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-aviso-fondo p-3 text-base text-aviso">
        <span>Demostración · {NOMBRE_ESPECIE[especie]} · los datos solo se guardan en este dispositivo.</span>
        <button
          type="button"
          className="underline"
          onClick={() => {
            borrar(especie);
            setDatos(null);
            setVerFicha(false);
          }}
        >
          Empezar de nuevo
        </button>
      </div>

      {verFicha ? (
        <div className="space-y-4">
          <button type="button" className="boton-secundario w-full" onClick={() => setVerFicha(false)}>
            ← Volver al formulario
          </button>
          <h2 className="text-2xl font-bold">Lo que recibe el operador</h2>
          <p className="text-base text-texto-suave">Los datos en el mismo orden y con los mismos nombres que ECOGAN, ya en su formato, con casillas para ir marcando lo copiado.</p>
          <FichaVista ficha={generarFicha(datos, especie, listas)} />
        </div>
      ) : (
        <Formulario
          key={`${especie}-${vuelta}`}
          especie={especie}
          datos={datos}
          listas={listas}
          onChange={(d) => {
            setDatos(d);
            guardar(especie, d);
          }}
          final={(d) => (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Revisión</h2>
              <Revision especie={especie} datos={d} />
              <button type="button" className="boton w-full" onClick={() => setVerFicha(true)}>
                Ver la ficha para ECOGAN
              </button>
              <button type="button" className="boton-secundario w-full" onClick={() => setVuelta((v) => v + 1)}>
                Volver al principio del formulario
              </button>
            </div>
          )}
        />
      )}
    </div>
  );
}
