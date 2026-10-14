import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { CONFIG_POR_DEFECTO, type Configuracion } from "@/domain/configuracion";
import { resolverListas, type ListaOpciones, type ListasOpciones } from "@/domain/catalogo/opciones";
import { env, hayBaseDeDatos } from "./env";

/** Lectura pública (la configuración y las listas se pueden leer sin sesión, ver RLS). */
function clientePublico() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false } });
}

/** Configuración editable desde el panel, con los valores por defecto como respaldo. */
export const leerConfiguracion = cache(async (): Promise<Configuracion> => {
  if (!hayBaseDeDatos()) return CONFIG_POR_DEFECTO;
  try {
    const { data } = await clientePublico().from("configuracion").select("clave, valor");
    const guardada = Object.fromEntries((data ?? []).map((f) => [f.clave, f.valor])) as Partial<Configuracion>;
    return {
      ...CONFIG_POR_DEFECTO,
      ...guardada,
      textos: { ...CONFIG_POR_DEFECTO.textos, ...(guardada.textos ?? {}) },
      campana: { ...CONFIG_POR_DEFECTO.campana, ...(guardada.campana ?? {}) },
      operador: { ...CONFIG_POR_DEFECTO.operador, ...(guardada.operador ?? {}) },
      empresa: { ...CONFIG_POR_DEFECTO.empresa, ...(guardada.empresa ?? {}) },
      precios: { ...CONFIG_POR_DEFECTO.precios, ...(guardada.precios ?? {}) },
    };
  } catch {
    return CONFIG_POR_DEFECTO;
  }
});

/** Listas de opciones de ECOGAN: las editadas en el panel sustituyen a las de por defecto. */
export const leerListas = cache(async (): Promise<ListasOpciones> => {
  if (!hayBaseDeDatos()) return resolverListas();
  try {
    const { data } = await clientePublico().from("opciones_listas").select("lista");
    return resolverListas((data ?? []).map((f) => f.lista as ListaOpciones));
  } catch {
    return resolverListas();
  }
});
