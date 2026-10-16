import { NextResponse, type NextRequest } from "next/server";
import { env, hayBaseDeDatos } from "@/lib/env";
import { supabaseSistema } from "@/lib/supabase/server";
import { enviarEnlaceAcceso } from "@/lib/acceso";
import { avisarOperador } from "@/lib/email";
import { leerConfiguracion } from "@/lib/config-servidor";
import { ESTADOS_CON_RECORDATORIO, type EstadoCampana } from "@/domain/estados";
import { componerResumen } from "@/domain/resumen";
import type { Configuracion } from "@/domain/configuracion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Fila = {
  id: string;
  estado: EstadoCampana;
  creado_en: string;
  ultimo_recordatorio_en: string | null;
  recordatorios_enviados: number;
  autorizacion_avisada_en: string | null;
  granja: { rega: string; nombre: string | null; titular: { id: string; nombre: string; email: string } };
};

/**
 * Recordatorios automáticos (Vercel Cron, una vez al día). Mientras una campaña pagada siga en
 * "autorización pendiente" o "recogiendo datos", se avisa al ganadero cada N días (configurable)
 * hasta el fin del plazo. Un solo correo por titular aunque tenga varias granjas.
 */
export async function GET(request: NextRequest) {
  if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hayBaseDeDatos()) return NextResponse.json({ enviados: 0, motivo: "sin base de datos" });

  const config = await leerConfiguracion();
  const plazoAbierto = Date.now() <= new Date(`${config.campana.finPlazo}T23:59:59`).getTime();
  const resultado = plazoAbierto ? await enviarRecordatorios(config) : { enviados: 0, fallos: 0 };
  if ("error" in resultado) return NextResponse.json(resultado, { status: 500 });

  // Resumen diario para el operador (también fuera de plazo: puede quedar trabajo pendiente).
  const resumen = await resumenOperador(config, resultado);
  return NextResponse.json({ ...resultado, resumen });
}

async function enviarRecordatorios(config: Configuracion): Promise<{ enviados: number; fallos: number } | { error: string }> {
  const ahora = Date.now();
  const sistema = supabaseSistema();
  const { data, error } = await sistema
    .from("campanas")
    .select("id, estado, creado_en, ultimo_recordatorio_en, recordatorios_enviados, autorizacion_avisada_en, granja:granjas(rega, nombre, titular:titulares(id, nombre, email))")
    .in("estado", ESTADOS_CON_RECORDATORIO)
    .not("pagado_en", "is", null);
  if (error) return { error: error.message };

  const intervalo = Math.max(1, config.recordatorios.cadaDias) * 86_400_000 - 3_600_000; // margen de 1 h por la hora del cron
  const tocan = ((data ?? []) as unknown as Fila[]).filter((c) => {
    // Si dice que ya nos autorizó, el siguiente paso es nuestro: no le molestamos.
    if (c.estado === "autorizacion_pendiente" && c.autorizacion_avisada_en) return false;
    const referencia = new Date(c.ultimo_recordatorio_en ?? c.creado_en).getTime();
    return ahora - referencia >= intervalo;
  });

  const porTitular = new Map<string, Fila[]>();
  for (const c of tocan) porTitular.set(c.granja.titular.id, [...(porTitular.get(c.granja.titular.id) ?? []), c]);

  const limite = new Date(`${config.campana.limiteGarantia}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  const base = env.appUrl.replace(/\/$/, "");
  let enviados = 0;
  const fallos: string[] = [];

  for (const campanas of porTitular.values()) {
    const t = campanas[0].granja.titular;
    const lineas = campanas.map((c) => {
      const granja = c.granja.nombre || c.granja.rega;
      return c.estado === "autorizacion_pendiente"
        ? `• ${granja}: falta que nos autorices en ECOGAN (son unos minutos y te guiamos paso a paso).`
        : `• ${granja}: falta que contestes las preguntas sobre la granja (lo que lleves ya está guardado).`;
    });
    const destino =
      campanas.length === 1 ? (campanas[0].estado === "autorizacion_pendiente" ? `/mi-area/autorizacion/${campanas[0].id}` : `/mi-area/datos/${campanas[0].id}`) : "/mi-area";
    const motivo = [
      "Te recordamos lo que falta para presentar tu declaración de ECOGAN:",
      "",
      ...lineas,
      "",
      `Si nos autorizas en ECOGAN y completas tus datos antes del ${limite}, lo presentamos en plazo o te devolvemos el dinero.`,
      "Si te atascas, pulsa «Necesito ayuda» en tu área y te llamamos.",
    ].join("\n");
    try {
      await enviarEnlaceAcceso(t.email, t.nombre, motivo, destino, base);
      for (const c of campanas) {
        await sistema
          .from("campanas")
          .update({ ultimo_recordatorio_en: new Date().toISOString(), recordatorios_enviados: c.recordatorios_enviados + 1 })
          .eq("id", c.id);
        await sistema.from("eventos").insert({ titular_id: t.id, campana_id: c.id, accion: "recordatorio", detalle: { numero: c.recordatorios_enviados + 1 } });
      }
      enviados++;
    } catch (e) {
      console.error("Recordatorio no enviado", t.email, e);
      fallos.push(t.email);
    }
  }

  if (fallos.length > 0) console.error("Recordatorios no enviados:", fallos.join(", "));
  return { enviados, fallos: fallos.length };
}

type FilaResumen = { id: string; estado: EstadoCampana; autorizacion_avisada_en: string | null; granja: { rega: string; nombre: string | null; titular: { nombre: string; apellidos: string | null; telefono: string } } };

async function resumenOperador(config: Configuracion, recordatorios: { enviados: number; fallos: number }): Promise<"enviado" | "nada pendiente" | "error"> {
  const sistema = supabaseSistema();
  const [{ data: campanas }, { data: ayudas }, { count: reservas }] = await Promise.all([
    sistema
      .from("campanas")
      .select("id, estado, autorizacion_avisada_en, granja:granjas(rega, nombre, titular:titulares(nombre, apellidos, telefono))")
      .in("estado", ["autorizacion_pendiente", "pendiente_revision", "lista_para_ecogan", "comunicada"]),
    sistema.from("solicitudes_ayuda").select("id, telefono, mensaje, titular:titulares(nombre)").is("atendida_en", null),
    sistema.from("reservas").select("id", { count: "exact", head: true }).is("contactado_en", null),
  ]);
  const cs = (campanas ?? []) as unknown as FilaResumen[];
  const item = (c: FilaResumen) => ({ id: c.id, texto: `${c.granja.titular.nombre} ${c.granja.titular.apellidos ?? ""}`.trim() + ` · ${c.granja.nombre || c.granja.rega} · ${c.granja.titular.telefono}` });
  const de = (estado: EstadoCampana) => cs.filter((c) => c.estado === estado).map(item);

  const r = componerResumen({
    base: env.appUrl.replace(/\/$/, ""),
    diasFinPlazo: diasHasta(config.campana.finPlazo),
    diasGarantia: diasHasta(config.campana.limiteGarantia),
    ayudas: (ayudas ?? []).map((a) => {
      const nombre = (a.titular as unknown as { nombre: string } | null)?.nombre ?? "";
      return { id: a.id, texto: `${nombre} · ${a.telefono ?? ""}${a.mensaje ? ` · «${a.mensaje}»` : ""}` };
    }),
    porVerificar: cs.filter((c) => c.estado === "autorizacion_pendiente" && c.autorizacion_avisada_en).map(item),
    porRevisar: de("pendiente_revision"),
    paraEcogan: de("lista_para_ecogan"),
    sinJustificante: de("comunicada"),
    reservasSinLlamar: reservas ?? 0,
    recordatorios,
  });
  if (!r) return "nada pendiente";
  try {
    await avisarOperador(r.asunto, r.texto);
    return "enviado";
  } catch (e) {
    console.error("Resumen diario no enviado", e);
    return "error";
  }
}

const diasHasta = (fecha: string) => Math.ceil((new Date(`${fecha}T23:59:59`).getTime() - Date.now()) / 86_400_000);
