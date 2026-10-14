"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Datos } from "@/domain/catalogo/tipos";
import type { ListasOpciones } from "@/domain/catalogo/opciones";
import type { Especie } from "@/domain/especies";
import { Formulario, Revision } from "@/components/formulario/Formulario";
import { guardarDatosAdmin } from "@/app/admin/acciones";

/** El operador rellena o corrige los datos (por ejemplo, al teléfono con el ganadero). Guarda solo. */
export function EditorDatosAdmin({ campanaId, especie, inicial, listas }: { campanaId: string; especie: Especie; inicial: Datos; listas: ListasOpciones }) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [estado, setEstado] = useState("");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const cambiar = (d: Datos) => {
    setDatos(d);
    setEstado("Guardando…");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      const r = await guardarDatosAdmin(campanaId, d);
      setEstado(r.ok ? "✓ Guardado" : `⚠ ${r.error}`);
    }, 800);
  };

  return (
    <div className="space-y-3">
      <p className="text-right text-base text-texto-suave" aria-live="polite">
        {estado}
      </p>
      <Formulario
        especie={especie}
        datos={datos}
        listas={listas}
        onChange={cambiar}
        final={(d) => (
          <div className="space-y-3">
            <Revision especie={especie} datos={d} />
            <button type="button" className="boton" onClick={() => router.refresh()}>
              Actualizar la ficha con estos datos
            </button>
          </div>
        )}
      />
    </div>
  );
}
