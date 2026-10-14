"use client";

import { useActionState } from "react";
import { pedirEnlace, type EstadoEntrar } from "@/app/[locale]/entrar/acciones";

export function FormEntrar() {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(pedirEnlace, null);
  if (estado?.enviado) {
    return (
      <div className="tarjeta border-primario bg-primario-claro" role="status">
        <p className="text-xl font-semibold text-primario-oscuro">📩 Revisa tu correo</p>
        <p className="mt-2 text-lg">Si tu correo está dado de alta, te hemos enviado un enlace para entrar. Caduca en 1 hora. Mira también en «correo no deseado».</p>
      </div>
    );
  }
  return (
    <form action={accion} className="tarjeta space-y-4" noValidate>
      <label htmlFor="email" className="etiqueta">
        Tu correo electrónico
      </label>
      <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="campo" required />
      {estado && !estado.enviado && <p className="text-base text-error">{estado.error}</p>}
      <button type="submit" className="boton w-full" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviarme el enlace para entrar"}
      </button>
      <p className="text-base text-texto-suave">No hace falta contraseña.</p>
    </form>
  );
}
