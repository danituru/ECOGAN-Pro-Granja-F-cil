import { exigirAdmin } from "@/lib/admin";
import { leerConfiguracion, leerListas } from "@/lib/config-servidor";
import { supabaseUsuario } from "@/lib/supabase/server";
import { EditorListas, FormCampana, FormDatos, FormPrecios, FormTextos } from "@/components/admin/Configuracion";

export default async function PaginaConfiguracion() {
  await exigirAdmin();
  const supabase = await supabaseUsuario();
  const [config, listas, { data: editadas }] = await Promise.all([leerConfiguracion(), leerListas(), supabase.from("opciones_listas").select("id")]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Configuración</h1>
      <p className="text-base text-texto-suave">Cada apartado se guarda por separado. Los cambios salen en la web al momento.</p>

      <FormPrecios inicial={config.precios} />
      <FormCampana campana={config.campana} recordatorios={config.recordatorios} />
      <FormTextos inicial={config.textos} />
      <FormDatos
        clave="operador"
        titulo="Persona autorizada en ECOGAN"
        ayuda="Tus datos. El ganadero los copia en «Nuevo Autorizado» y salen en el modelo de Aragón. El DNI no se publica en la web."
        inicial={config.operador}
        campos={[
          ["nombre", "Nombre"],
          ["apellido1", "Primer apellido"],
          ["apellido2", "Segundo apellido"],
          ["nif", "DNI / NIE"],
          ["email", "Correo", "El que verá el ganadero en ECOGAN."],
          ["telefono", "Teléfono"],
        ]}
      />
      <FormDatos
        clave="empresa"
        titulo="Titular del servicio (aviso legal y privacidad)"
        ayuda="Quien vende y factura. Si eres autónomo: tu nombre completo y tu DNI. Si es una sociedad: razón social, CIF y datos del registro mercantil."
        inicial={config.empresa}
        campos={[
          ["nombreComercial", "Nombre comercial"],
          ["razonSocial", "Razón social o nombre completo"],
          ["nif", "NIF / CIF", "Obligatorio antes de empezar a cobrar."],
          ["domicilio", "Domicilio"],
          ["email", "Correo de contacto"],
          ["telefono", "Teléfono"],
          ["registroMercantil", "Registro mercantil", "Solo si es una sociedad."],
        ]}
      />
      <EditorListas listas={listas} editadas={(editadas ?? []).map((f) => f.id as string)} />
    </div>
  );
}
