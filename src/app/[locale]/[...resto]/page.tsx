import { notFound } from "next/navigation";

/** Cualquier ruta que no exista dentro de un idioma muestra la página 404 en español. */
export default function RutaDesconocida() {
  notFound();
}
