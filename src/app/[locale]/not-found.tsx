import { Link } from "@/i18n/navigation";

export default function NoEncontrada() {
  return (
    <div className="space-y-5 py-10 text-center">
      <p className="text-6xl" aria-hidden>
        🐄
      </p>
      <h1 className="text-3xl font-extrabold">Esta página no existe</h1>
      <p className="text-lg text-texto-suave">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="boton">
          Ir al inicio
        </Link>
        <Link href="/comprobador" className="boton-secundario">
          ¿Tengo que presentar ECOGAN?
        </Link>
      </div>
    </div>
  );
}
