import { NextResponse } from "next/server";
import { esAdmin, supabaseSistema, usuarioActual } from "@/lib/supabase/server";
import { listarCampanas } from "@/lib/admin";
import { NOMBRE_ESTADO } from "@/domain/estados";
import { NOMBRE_ESPECIE } from "@/domain/especies";

export const dynamic = "force-dynamic";

/** Celda CSV para Excel en español: separador «;» y comillas cuando hace falta. */
function celda(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Evita que Excel interprete el contenido como fórmula.
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

export async function GET() {
  const u = await usuarioActual();
  if (!u || !(await esAdmin())) return new NextResponse("Solo para el operador", { status: 403 });

  const campanas = await listarCampanas();
  const cabecera = ["Titular", "NIF", "Correo", "Teléfono", "REGA", "Granja", "Especie", "Comunidad", "Año de datos", "Estado", "Sin actividad", "Pagada", "Importe (€)", "Autorizado", "Datos enviados", "Comunicada", "Justificante"];
  const filas = campanas.map((c) => [
    `${c.titular.nombre} ${c.titular.apellidos ?? ""}`.trim(),
    c.titular.nif,
    c.titular.email,
    c.titular.telefono,
    c.granja.rega,
    c.granja.nombre,
    NOMBRE_ESPECIE[c.granja.especie],
    c.granja.comunidad,
    c.anio_datos,
    NOMBRE_ESTADO[c.estado],
    c.sin_actividad ? "Sí" : "No",
    c.pagado_en?.slice(0, 10),
    c.importe_centimos !== null ? (c.importe_centimos / 100).toFixed(2).replace(".", ",") : "",
    c.autorizado_en?.slice(0, 10),
    c.datos_enviados_en?.slice(0, 10),
    c.comunicada_en?.slice(0, 10),
    c.justificante_enviado_en?.slice(0, 10),
  ]);
  const csv = "﻿" + [cabecera, ...filas].map((f) => f.map(celda).join(";")).join("\r\n");

  await supabaseSistema().from("eventos").insert({ actor: u.id, accion: "exporta_csv", detalle: { filas: filas.length } });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="granjafacil-campanas-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
