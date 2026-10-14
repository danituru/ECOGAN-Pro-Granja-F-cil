"use client";

import { useState, useTransition } from "react";
import {
  aprobarRevision,
  atenderAyuda,
  devolverAlGanadero,
  enviarJustificante,
  guardarNota,
  marcarAutorizado,
  marcarComunicada,
  marcarReservaContactada,
} from "@/app/admin/acciones";
import type { EstadoCampana } from "@/domain/estados";

type R = { ok: true } | { ok: false; error: string };

function useAccion() {
  const [pendiente, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const ejecutar = (fn: () => Promise<R>, exito: string) =>
    empezar(async () => {
      try {
        const r = await fn();
        setMensaje(r.ok ? { ok: true, texto: exito } : { ok: false, texto: r.error });
      } catch (e) {
        setMensaje({ ok: false, texto: e instanceof Error ? e.message : "Error" });
      }
    });
  const aviso = mensaje && <p className={`text-base ${mensaje.ok ? "text-primario" : "text-error"}`} role="status">{mensaje.texto}</p>;
  return { pendiente, ejecutar, aviso };
}

export function BotonAtenderAyuda({ id }: { id: string }) {
  const { pendiente, ejecutar, aviso } = useAccion();
  return (
    <>
      <button className="boton-peque" disabled={pendiente} onClick={() => ejecutar(() => atenderAyuda(id), "Atendida")}>
        Marcar atendida
      </button>
      {aviso}
    </>
  );
}

export function BotonReservaContactada({ id }: { id: string }) {
  const { pendiente, ejecutar, aviso } = useAccion();
  const [nota, setNota] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className="campo max-w-xs py-1 text-base" placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
      <button className="boton-peque" disabled={pendiente} onClick={() => ejecutar(() => marcarReservaContactada(id, nota), "Marcada como contactada")}>
        Contactada
      </button>
      {aviso}
    </div>
  );
}

/** Acciones del operador según el estado de la campaña. */
export function AccionesCampana({ id, estado, avisada }: { id: string; estado: EstadoCampana; avisada: boolean }) {
  const { pendiente, ejecutar, aviso } = useAccion();
  const [motivo, setMotivo] = useState("");
  return (
    <div className="space-y-4">
      {estado === "autorizacion_pendiente" && (
        <div className="space-y-2">
          <p className="text-base">
            Comprueba en ECOGAN (Gestión de autorizados / Mis granjas) que apareces como autorizado para esta granja.
            {avisada && " El ganadero dice que ya lo ha hecho."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="boton" disabled={pendiente} onClick={() => confirm("¿Has comprobado en ECOGAN que apareces como autorizado?") && ejecutar(() => marcarAutorizado(id, "ecogan"), "Marcado como autorizado. Se ha avisado al ganadero.")}>
              Autorizado en ECOGAN (Cl@ve)
            </button>
            <button className="boton-secundario" disabled={pendiente} onClick={() => confirm("¿La comunidad autónoma ya ha tramitado la autorización por documento?") && ejecutar(() => marcarAutorizado(id, "ccaa"), "Marcado como autorizado. Se ha avisado al ganadero.")}>
              Autorizado por la CCAA (documento)
            </button>
          </div>
        </div>
      )}

      {estado === "pendiente_revision" && (
        <div className="space-y-3">
          <button className="boton" disabled={pendiente} onClick={() => ejecutar(() => aprobarRevision(id), "Revisión aprobada. Ya puedes presentarla en ECOGAN.")}>
            ✅ Datos revisados: listos para ECOGAN
          </button>
          <div className="space-y-2">
            <label className="etiqueta" htmlFor="motivo">
              O devolver al ganadero para que corrija:
            </label>
            <textarea id="motivo" rows={2} className="campo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Qué tiene que corregir o completar" />
            <button className="boton-secundario" disabled={pendiente} onClick={() => ejecutar(() => devolverAlGanadero(id, motivo), "Devuelto. Se ha avisado al ganadero.")}>
              Devolver al ganadero
            </button>
          </div>
        </div>
      )}

      {estado === "lista_para_ecogan" && (
        <div className="space-y-2">
          <p className="text-base">Introduce los datos en ECOGAN con la ficha de abajo y pulsa COMUNICAR. Después márcalo aquí.</p>
          <button className="boton" disabled={pendiente} onClick={() => confirm("¿Has pulsado COMUNICAR en ECOGAN?") && ejecutar(() => marcarComunicada(id), "Marcada como comunicada.")}>
            Comunicada en ECOGAN
          </button>
        </div>
      )}

      {estado === "comunicada" && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            ejecutar(() => enviarJustificante(id, f), "Justificante guardado y enviado al ganadero.");
          }}
        >
          <label className="etiqueta" htmlFor="justificante">
            Justificante de ECOGAN (PDF del «Informe MTD» o «Informe ganadero»)
          </label>
          <input id="justificante" name="justificante" type="file" accept="application/pdf" className="campo" required />
          <button className="boton" disabled={pendiente}>
            Subir y enviar al ganadero
          </button>
        </form>
      )}

      {estado === "recogiendo_datos" && <p className="text-base text-texto-suave">El ganadero está rellenando sus datos. Puedes ayudarle editándolos abajo.</p>}
      {(estado === "justificante_enviado" || estado === "sin_actividad") && <p className="text-base text-primario">✅ Terminada.</p>}
      {pendiente && <p className="text-base text-texto-suave">Guardando…</p>}
      {aviso}
    </div>
  );
}

export function NotaOperador({ id, inicial }: { id: string; inicial: string }) {
  const { pendiente, ejecutar, aviso } = useAccion();
  const [nota, setNota] = useState(inicial);
  return (
    <div className="space-y-2">
      <textarea rows={3} className="campo text-base" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Notas internas (el ganadero no las ve)" />
      <button className="boton-peque" disabled={pendiente} onClick={() => ejecutar(() => guardarNota(id, nota), "Nota guardada")}>
        Guardar nota
      </button>
      {aviso}
    </div>
  );
}
