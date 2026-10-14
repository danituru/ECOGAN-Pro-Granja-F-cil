"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { reservarPlaza, type EstadoReserva } from "@/app/[locale]/acciones";
import { COMUNIDADES } from "@/domain/comunidades";
import { Link } from "@/i18n/navigation";

const ESPECIES = [
  ["porcino", "Cerdos"],
  ["aves_carne", "Pollos de carne"],
  ["aves_puesta", "Gallinas ponedoras"],
  ["pavos", "Pavos"],
] as const;

export function FormReserva({ especieInicial }: { especieInicial?: string }) {
  const t = useTranslations("reserva");
  const locale = useLocale();
  const [estado, accion, enviando] = useActionState<EstadoReserva, FormData>(reservarPlaza, null);
  const err = estado && !estado.ok ? estado.errores : {};
  // Tras un error se vuelve a mostrar lo escrito (React vacía el formulario al enviarlo).
  const v: Record<string, string> = estado && !estado.ok ? estado.valores : {};

  if (estado?.ok) {
    return (
      <div className="tarjeta border-primario bg-primario-claro" role="status">
        <p className="text-xl font-semibold text-primario-oscuro">✅ {t("gracias")}</p>
      </div>
    );
  }

  const error = (k: string) =>
    err[k] ? (
      <p id={`${k}-error`} className="mt-1 text-base text-error">
        {err[k]}
      </p>
    ) : null;

  const especieMarcada = v.especie ?? especieInicial;

  return (
    <form action={accion} className="tarjeta space-y-5" noValidate>
      <input type="hidden" name="idioma" value={locale} />
      {/* Campo trampa para robots: oculto a las personas. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Web <input name="web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="nombre" className="etiqueta">{t("nombre")}</label>
        <input id="nombre" name="nombre" className="campo" autoComplete="name" defaultValue={v.nombre} required aria-invalid={!!err.nombre} aria-describedby="nombre-error" />
        {error("nombre")}
      </div>
      <div>
        <label htmlFor="telefono" className="etiqueta">{t("telefono")}</label>
        <input id="telefono" name="telefono" type="tel" inputMode="tel" className="campo" autoComplete="tel" defaultValue={v.telefono} required aria-invalid={!!err.telefono} aria-describedby="telefono-error" />
        {error("telefono")}
      </div>
      <div>
        <label htmlFor="email" className="etiqueta">{t("email")}</label>
        <input id="email" name="email" type="email" inputMode="email" className="campo" autoComplete="email" defaultValue={v.email} aria-invalid={!!err.email} aria-describedby="email-error" />
        {error("email")}
      </div>
      <div>
        <label htmlFor="comunidad" className="etiqueta">{t("comunidad")}</label>
        {/* La key fuerza a montar de nuevo el desplegable para que recupere el valor tras un error. */}
        <select key={v.comunidad ?? "vacio"} id="comunidad" name="comunidad" className="campo" defaultValue={v.comunidad ?? ""} required aria-invalid={!!err.comunidad} aria-describedby="comunidad-error">
          <option value="" disabled>{t("elige")}</option>
          {COMUNIDADES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {error("comunidad")}
      </div>
      <fieldset>
        <legend className="etiqueta">{t("especie")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...ESPECIES, ["varias", t("varias")] as const].map(([valor, nombre]) => (
            <label key={valor} className="opcion">
              <input type="radio" name="especie" value={valor} defaultChecked={valor === especieMarcada} className="size-5 accent-primario" required />
              {nombre}
            </label>
          ))}
        </div>
        {error("especie")}
      </fieldset>
      <div>
        <label htmlFor="numeroGranjas" className="etiqueta">{t("numeroGranjas")}</label>
        <input id="numeroGranjas" name="numeroGranjas" type="number" inputMode="numeric" min={1} max={500} defaultValue={v.numeroGranjas ?? 1} className="campo max-w-32" required aria-describedby="numeroGranjas-error" />
        {error("numeroGranjas")}
      </div>
      <div>
        <label htmlFor="mensaje" className="etiqueta">{t("mensaje")}</label>
        <textarea id="mensaje" name="mensaje" rows={3} maxLength={1000} className="campo" defaultValue={v.mensaje} />
      </div>
      <div>
        <label className="flex items-start gap-3 text-base">
          <input type="checkbox" name="aceptaPrivacidad" className="mt-1 size-6 shrink-0 accent-primario" defaultChecked={v.aceptaPrivacidad === "on"} required />
          <span>
            {t("privacidad")}{" "}
            <Link href="/legal#privacidad" className="underline">
              (leer)
            </Link>
          </span>
        </label>
        {error("aceptaPrivacidad")}
      </div>
      {estado && !estado.ok && estado.general && <p className="rounded-lg bg-error-fondo p-3 text-error">{estado.general}</p>}
      <button type="submit" className="boton w-full" disabled={enviando}>
        {enviando ? t("enviando") : t("enviar")}
      </button>
    </form>
  );
}
