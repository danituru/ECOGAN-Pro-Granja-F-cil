/**
 * Aislamiento de datos entre clientes (Row Level Security).
 * Ejecuta la migración real sobre Postgres embebido (PGlite) con un esquema `auth` mínimo
 * que imita al de Supabase (auth.users y auth.uid()).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const A = "00000000-0000-0000-0000-00000000000a"; // ganadero A
const B = "00000000-0000-0000-0000-00000000000b"; // ganadero B
const OP = "00000000-0000-0000-0000-0000000000ff"; // operador

let db: PGlite;

async function como(usuario: string | null, sql: string, params: unknown[] = []) {
  await db.exec("reset role");
  if (usuario) {
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: usuario, role: "authenticated" })]);
    await db.exec("set role authenticated");
  } else {
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role authenticated nologin;
    create role anon nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    $$;
  `);
  const dir = path.resolve(import.meta.dirname, "../supabase/migrations");
  for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(path.join(dir, f), "utf8"));
  await db.exec(`
    grant usage on schema public, auth to authenticated, anon;
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on public.configuracion, public.opciones_listas to anon;
    grant usage on all sequences in schema public to authenticated;
    grant execute on all functions in schema public, auth to authenticated, anon;
  `);
  // Datos de prueba (como sistema).
  await db.exec(`
    insert into auth.users (id) values ('${A}'), ('${B}'), ('${OP}');
    update public.perfiles set rol = 'admin' where id = '${OP}';
    insert into public.titulares (id, usuario_id, tipo, nombre, nif, email, telefono) values
      ('10000000-0000-0000-0000-00000000000a', '${A}', 'fisica', 'Ana', '00000000T', 'a@x.es', '600000001'),
      ('10000000-0000-0000-0000-00000000000b', '${B}', 'fisica', 'Blas', '00000001R', 'b@x.es', '600000002');
    insert into public.granjas (id, titular_id, rega, comunidad, especie, capacidad) values
      ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'ES220000000001', 'Aragón', 'porcino', 2000),
      ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'ES080000000002', 'Cataluña', 'aves_carne', 40000);
    insert into public.campanas (id, granja_id, anio_datos, estado) values
      ('30000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 2026, 'autorizacion_pendiente'),
      ('30000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000b', 2026, 'recogiendo_datos');
  `);
});

describe("aislamiento entre clientes", () => {
  it("cada ganadero solo ve su titular, sus granjas y sus campañas", async () => {
    const t = await como(A, "select nombre from public.titulares");
    expect(t.rows).toEqual([{ nombre: "Ana" }]);
    const g = await como(A, "select rega from public.granjas");
    expect(g.rows).toEqual([{ rega: "ES220000000001" }]);
    const c = await como(B, "select id from public.campanas");
    expect(c.rows).toEqual([{ id: "30000000-0000-0000-0000-00000000000b" }]);
  });

  it("un ganadero no puede modificar datos de otro", async () => {
    const r = await como(A, "update public.campanas set datos = '{\"x\":1}' where id = '30000000-0000-0000-0000-00000000000b'");
    expect(r.affectedRows).toBe(0);
  });

  it("un ganadero no puede crear granjas a nombre de otro titular", async () => {
    await expect(
      como(A, "insert into public.granjas (titular_id, rega, comunidad, especie) values ('10000000-0000-0000-0000-00000000000b', 'ES1', 'Aragón', 'porcino')"),
    ).rejects.toThrow(/row-level security/);
  });

  it("el operador lo ve todo", async () => {
    const c = await como(OP, "select count(*)::int as n from public.campanas");
    expect(c.rows[0]).toEqual({ n: 2 });
  });

  it("sin sesión no se ve nada de los clientes", async () => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ role: "anon" })]);
    await db.exec("set role anon");
    await expect(db.query("select * from public.titulares")).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
  });
});

describe("reglas de la campaña", () => {
  it("el ganadero puede guardar sus datos mientras se recogen", async () => {
    const r = await como(B, "update public.campanas set datos = '{\"actividad\":true}' where id = '30000000-0000-0000-0000-00000000000b'");
    expect(r.affectedRows).toBe(1);
  });

  it("el ganadero no puede cambiar el estado ni marcarse como autorizado", async () => {
    await expect(
      como(A, "update public.campanas set estado = 'recogiendo_datos' where id = '30000000-0000-0000-0000-00000000000a'"),
    ).rejects.toThrow(/no admite cambios/);
    await expect(
      como(B, "update public.campanas set estado = 'comunicada' where id = '30000000-0000-0000-0000-00000000000b'"),
    ).rejects.toThrow(/Solo se pueden modificar los datos/);
  });

  it("el ganadero no puede editar datos fuera de la fase de recogida", async () => {
    await expect(
      como(A, "update public.campanas set datos = '{}' where id = '30000000-0000-0000-0000-00000000000a'"),
    ).rejects.toThrow(/no admite cambios/);
  });

  it("enviar_datos pasa la campaña a revisión y queda registrado", async () => {
    await como(B, "select public.enviar_datos('30000000-0000-0000-0000-00000000000b')");
    const c = await como(OP, "select estado from public.campanas where id = '30000000-0000-0000-0000-00000000000b'");
    expect(c.rows[0]).toEqual({ estado: "pendiente_revision" });
    const ev = await como(OP, "select accion from public.eventos where campana_id = '30000000-0000-0000-0000-00000000000b' order by id");
    expect((ev.rows as { accion: string }[]).map((x) => x.accion)).toEqual(["cambio_estado", "enviar_datos"]);
  });

  it("nadie puede enviar los datos de otro", async () => {
    await expect(como(A, "select public.enviar_datos('30000000-0000-0000-0000-00000000000b')")).rejects.toThrow(/No autorizado/);
  });

  it("el operador marca la autorización y la campaña pasa a recogida de datos", async () => {
    await como(OP, "update public.campanas set estado = 'recogiendo_datos', autorizado_en = now(), via_autorizacion = 'ecogan' where id = '30000000-0000-0000-0000-00000000000a'");
    const c = await como(A, "select estado from public.campanas");
    expect(c.rows[0]).toEqual({ estado: "recogiendo_datos" });
  });

  it("los clientes no ven el registro de eventos", async () => {
    const ev = await como(A, "select * from public.eventos");
    expect(ev.rows).toEqual([]);
  });

  it("la configuración es pública en lectura y solo la edita el operador", async () => {
    await como(OP, "insert into public.configuracion (clave, valor) values ('precios', '{}')");
    const r = await como(A, "select clave from public.configuracion");
    expect(r.rows).toEqual([{ clave: "precios" }]);
    await expect(como(A, "update public.configuracion set valor = '{\"x\":1}'")).resolves.toMatchObject({ affectedRows: 0 });
  });
});
