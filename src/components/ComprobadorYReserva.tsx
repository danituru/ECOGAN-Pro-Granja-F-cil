"use client";

import { useState } from "react";
import { Comprobador } from "./Comprobador";
import { FormReserva } from "./FormReserva";

/** Comprobador seguido del formulario de reserva, con la especie ya elegida. */
export function ComprobadorYReserva({ tituloReserva }: { tituloReserva: string }) {
  const [especie, setEspecie] = useState<string | undefined>();
  const [mostrar, setMostrar] = useState(false);

  return (
    <div className="space-y-8">
      <Comprobador
        onContratar={(e) => {
          setEspecie(e);
          setMostrar(true);
          setTimeout(() => document.getElementById("reserva-comprobador")?.scrollIntoView({ behavior: "smooth" }), 50);
        }}
      />
      {mostrar && (
        <section id="reserva-comprobador" className="space-y-4">
          <h2 className="text-2xl font-bold">{tituloReserva}</h2>
          <FormReserva key={especie} especieInicial={especie} />
        </section>
      )}
    </div>
  );
}
