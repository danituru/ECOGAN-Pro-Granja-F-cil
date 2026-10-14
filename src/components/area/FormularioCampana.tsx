"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Datos } from "@/domain/catalogo/tipos";
import type { ListasOpciones } from "@/domain/catalogo/opciones";
import type { Especie } from "@/domain/especies";
import { validar, hayErrores } from "@/domain/validaciones";
import { Formulario, Revision } from "@/components/formulario/Formulario";
import { enviarDatos, guardarDatos } from "@/app/[locale]/mi-area/acciones";

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error";

/** Formulario del ganadero con guardado automático (puede dejarlo a medias y seguir otro día). */
export function FormularioCampana({ campanaId, especie, inicial, listas, capacidad }: { campanaId: string; especie: Especie; inicial: Datos; listas: ListasOpciones; capacidad?: number }) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [guardado, setGuardado] = useState<EstadoGuardado>("guardado");
  const [enviando, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimo = useRef<Datos>(inicial);
  const router = useRouter();

  const guardarAhora = async (d: Datos) => {
    setGuardado("guardando");
    const r = await guardarDatos(campanaId, d);
    setGuardado(r.ok ? (ultimo.current === d ? "guardado" : "pendiente") : "error");
    return r.ok;
  };

  const cambiar = (d: Datos) => {
    setDatos(d);
    ultimo.current = d;
    setGuardado("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => guardarAhora(d), 800);
  };

  // Aviso si se intenta cerrar la página con cambios sin guardar.
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (guardado === "pendiente" || guardado === "guardando") e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [guardado]);

  const textoGuardado = { guardado: "✓ Guardado", pendiente: "Guardando…", guardando: "Guardando…", error: "⚠ No se ha guardado. Revisa la conexión." }[guardado];

  return (
    <div className="space-y-4">
      <p className={`text-right text-base ${guardado === "error" ? "text-error" : "text-texto-suave"}`} aria-live="polite">
        {textoGuardado}
      </p>
      <Formulario
        especie={especie}
        datos={datos}
        listas={listas}
        onChange={cambiar}
        final={(d) => {
          const incidencias = validar(d, especie, { capacidadAutorizada: capacidad });
          const bloqueado = hayErrores(incidencias);
          return (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Revisar y enviar</h2>
              <Revision especie={especie} datos={d} />
              {d.actividad === false && <p className="rounded-xl bg-primario-claro p-3 text-lg">Has indicado que no tuviste animales el año pasado. Lo comunicamos como «sin actividad».</p>}
              {error && <p className="rounded-lg bg-error-fondo p-3 text-error" role="alert">{error}</p>}
              <button
                type="button"
                className="boton w-full"
                disabled={bloqueado || enviando}
                onClick={() =>
                  empezar(async () => {
                    setError(null);
                    if (temporizador.current) clearTimeout(temporizador.current);
                    if (!(await guardarAhora(d))) return setError("No se han podido guardar los datos. Revisa la conexión e inténtalo otra vez.");
                    const r = await enviarDatos(campanaId);
                    if (!r.ok) return setError(r.error);
                    router.push("/mi-area?enviado=1");
                  })
                }
              >
                {enviando ? "Enviando…" : "Enviar mis datos para revisión"}
              </button>
              {bloqueado && <p className="text-center text-base text-texto-suave">Completa lo que falta para poder enviar. Lo que llevas ya está guardado.</p>}
            </div>
          );
        }}
      />
    </div>
  );
}
