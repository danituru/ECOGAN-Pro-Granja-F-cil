import { NextResponse, type NextRequest } from "next/server";
import { campanaDelUsuario } from "@/lib/area";
import { leerConfiguracion } from "@/lib/config-servidor";
import { pdfAutorizacion } from "@/lib/pdf/autorizacion";
import { usuarioActual } from "@/lib/supabase/server";

/** Modelo de autorización ya rellenado. Solo para el titular de la campaña (sesión + RLS). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ campana: string }> }) {
  if (!(await usuarioActual())) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { campana: id } = await params;
  const c = await campanaDelUsuario(id);
  if (!c) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const { operador } = await leerConfiguracion();
  const t = c.titular;
  const esEmpresa = t.tipo === "juridica";
  const bytes = await pdfAutorizacion({
    titular: {
      nombre: t.nombre,
      apellidos: esEmpresa ? "" : (t.apellidos ?? ""),
      nif: t.nif,
      email: t.email,
      telefono: t.telefono,
      esEmpresa,
      representante: t.representante_nombre ?? undefined,
      representanteNif: t.representante_nif ?? undefined,
    },
    domicilio: { municipio: t.domicilio.municipio ?? "", provincia: t.domicilio.provincia ?? "", direccion: t.domicilio.direccion ?? "" },
    granjas: [{ rega: c.granja.rega, ubicacion: `${c.granja.municipio ?? ""}, ${c.granja.comunidad}` }],
    autorizado: {
      nombre: operador.nombre,
      apellidos: `${operador.apellido1} ${operador.apellido2}`.trim(),
      nif: operador.nif,
      email: operador.email,
      telefono: operador.telefono,
    },
    comunidad: c.granja.comunidad,
  });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="autorizacion-ecogan-${c.granja.rega}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
