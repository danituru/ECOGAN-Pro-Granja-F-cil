-- GranjaFácil — esquema inicial (fase 1)
-- Aislamiento por cliente con Row Level Security. El operador (rol 'admin') ve todo.
-- Los cambios de estado de una campaña solo los hace el operador o funciones SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- Perfiles y roles
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol text not null default 'cliente' check (rol in ('cliente', 'admin', 'asesor')),
  creado_en timestamptz not null default now()
);

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Titulares, granjas y campañas
-- ---------------------------------------------------------------------------
create table public.titulares (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete restrict,
  tipo text not null check (tipo in ('fisica', 'juridica')),
  nombre text not null,
  apellidos text,
  razon_social text,
  nif text not null,
  -- Representante legal (solo personas jurídicas): ECOGAN exige un DNI/NIE de persona física.
  representante_nombre text,
  representante_nif text,
  email text not null,
  telefono text not null,
  domicilio jsonb not null default '{}'::jsonb,
  idioma text not null default 'es' check (idioma in ('es', 'ca')),
  creado_en timestamptz not null default now()
);
create index on public.titulares (usuario_id);

create table public.granjas (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null references public.titulares (id) on delete cascade,
  rega text not null,
  nombre text,
  comunidad text not null,
  provincia text,
  municipio text,
  direccion text,
  especie text not null check (especie in ('porcino', 'aves_carne', 'aves_puesta', 'pavos')),
  sistema_productivo text,
  capacidad integer check (capacidad is null or capacidad >= 0),
  integrada boolean not null default false,
  integradora text,
  resultado_comprobador jsonb,
  creado_en timestamptz not null default now(),
  unique (titular_id, rega, especie)
);
create index on public.granjas (titular_id);

create table public.campanas (
  id uuid primary key default gen_random_uuid(),
  granja_id uuid not null references public.granjas (id) on delete cascade,
  anio_datos integer not null check (anio_datos between 2020 and 2100),
  estado text not null default 'sin_empezar' check (estado in (
    'sin_empezar', 'autorizacion_pendiente', 'recogiendo_datos', 'pendiente_revision',
    'lista_para_ecogan', 'comunicada', 'justificante_enviado', 'sin_actividad')),
  datos jsonb not null default '{}'::jsonb,
  version_catalogo integer not null default 1,
  sin_actividad boolean not null default false,
  -- Autorización en ECOGAN
  via_autorizacion text check (via_autorizacion in ('ecogan', 'ccaa')),
  autorizado_en timestamptz,
  autorizado_por uuid references auth.users (id),
  -- Seguimiento
  datos_enviados_en timestamptz,
  revisado_en timestamptz,
  revisado_por uuid references auth.users (id),
  comunicada_en timestamptz,
  justificante_enviado_en timestamptz,
  ultimo_recordatorio_en timestamptz,
  recordatorios_enviados integer not null default 0,
  nota_operador text,
  -- Pago
  importe_centimos integer,
  pagado_en timestamptz,
  stripe_session_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (granja_id, anio_datos)
);
create index on public.campanas (estado);

-- ---------------------------------------------------------------------------
-- Documentos, consentimientos, ayuda, pagos y registro de eventos
-- ---------------------------------------------------------------------------
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null references public.titulares (id) on delete cascade,
  campana_id uuid references public.campanas (id) on delete set null,
  tipo text not null check (tipo in ('foto', 'autorizacion_ccaa', 'ficha', 'justificante', 'contrato', 'otro')),
  ruta_storage text not null,
  nombre text not null,
  mime text,
  subido_por uuid references auth.users (id),
  creado_en timestamptz not null default now()
);
create index on public.documentos (titular_id);

create table public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null references public.titulares (id) on delete cascade,
  tipo text not null check (tipo in ('terminos', 'rgpd', 'encargo_tratamiento', 'autorizacion_gestion')),
  version text not null,
  aceptado_en timestamptz not null default now(),
  ip text,
  user_agent text
);

create table public.solicitudes_ayuda (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null references public.titulares (id) on delete cascade,
  campana_id uuid references public.campanas (id) on delete cascade,
  motivo text not null default 'autorizacion',
  telefono text,
  mensaje text,
  creado_en timestamptz not null default now(),
  atendida_en timestamptz,
  atendida_por uuid references auth.users (id)
);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null references public.titulares (id) on delete cascade,
  stripe_session_id text unique,
  importe_centimos integer not null,
  lineas jsonb not null default '[]'::jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'devuelto', 'cancelado')),
  creado_en timestamptz not null default now(),
  pagado_en timestamptz
);

-- Registro de accesos y cambios (RGPD). Solo lo escribe el servidor o los triggers.
create table public.eventos (
  id bigint generated always as identity primary key,
  actor uuid,
  titular_id uuid references public.titulares (id) on delete set null,
  campana_id uuid references public.campanas (id) on delete set null,
  accion text not null,
  detalle jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);
create index on public.eventos (campana_id);

-- ---------------------------------------------------------------------------
-- Configuración editable (precios, textos legales, listas de opciones)
-- ---------------------------------------------------------------------------
create table public.configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users (id)
);

create table public.opciones_listas (
  id text primary key,
  lista jsonb not null,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users (id)
);

-- ---------------------------------------------------------------------------
-- Funciones de pertenencia
-- ---------------------------------------------------------------------------
create or replace function public.es_mi_titular(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.titulares where id = t and usuario_id = auth.uid());
$$;

create or replace function public.es_mi_granja(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.granjas gr join public.titulares t on t.id = gr.titular_id
    where gr.id = g and t.usuario_id = auth.uid());
$$;

create or replace function public.es_mi_campana(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.campanas ca
    join public.granjas gr on gr.id = ca.granja_id
    join public.titulares t on t.id = gr.titular_id
    where ca.id = c and t.usuario_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- El cliente solo puede cambiar sus datos de ECOGAN mientras se recogen.
-- Cualquier otro cambio (estado, autorización, revisión, pago) es del operador.
-- ---------------------------------------------------------------------------
-- Peticiones del servidor (clave de servicio) o conexiones directas a la base de datos.
create or replace function public.es_sistema() returns boolean
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{"role":"service_role"}')::jsonb ->> 'role' = 'service_role';
$$;

create or replace function public.proteger_campana() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.actualizado_en := now();
  if public.es_admin() or public.es_sistema() or current_setting('granjafacil.sistema', true) = 'si' then
    return new;
  end if;
  if old.estado <> 'recogiendo_datos' then
    raise exception 'La campaña no admite cambios en el estado %', old.estado;
  end if;
  if (to_jsonb(new) - 'datos' - 'actualizado_en') <> (to_jsonb(old) - 'datos' - 'actualizado_en') then
    raise exception 'Solo se pueden modificar los datos de ECOGAN';
  end if;
  return new;
end $$;

create trigger proteger_campana before update on public.campanas
for each row execute function public.proteger_campana();

-- El ganadero envía sus datos para revisión (o declara que no hubo actividad).
create or replace function public.enviar_datos(p_campana uuid, p_sin_actividad boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_mi_campana(p_campana) then
    raise exception 'No autorizado';
  end if;
  perform set_config('granjafacil.sistema', 'si', true);
  update public.campanas
    set estado = 'pendiente_revision', datos_enviados_en = now(), sin_actividad = p_sin_actividad
    where id = p_campana and estado = 'recogiendo_datos';
  if not found then
    raise exception 'La campaña no está recogiendo datos';
  end if;
  insert into public.eventos (actor, campana_id, accion, detalle)
    values (auth.uid(), p_campana, 'enviar_datos', jsonb_build_object('sin_actividad', p_sin_actividad));
  perform set_config('granjafacil.sistema', '', true);
end $$;

-- Registro automático de cambios de estado.
create or replace function public.registrar_cambio_estado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    insert into public.eventos (actor, campana_id, accion, detalle)
      values (auth.uid(), new.id, 'cambio_estado', jsonb_build_object('de', old.estado, 'a', new.estado));
  end if;
  return new;
end $$;

create trigger registrar_cambio_estado after update on public.campanas
for each row execute function public.registrar_cambio_estado();

-- Alta de perfil al crear el usuario.
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger crear_perfil after insert on auth.users
for each row execute function public.crear_perfil();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.titulares enable row level security;
alter table public.granjas enable row level security;
alter table public.campanas enable row level security;
alter table public.documentos enable row level security;
alter table public.consentimientos enable row level security;
alter table public.solicitudes_ayuda enable row level security;
alter table public.pagos enable row level security;
alter table public.eventos enable row level security;
alter table public.configuracion enable row level security;
alter table public.opciones_listas enable row level security;

create policy perfiles_propio on public.perfiles for select using (id = auth.uid() or public.es_admin());
create policy perfiles_admin on public.perfiles for update using (public.es_admin());

create policy titulares_ver on public.titulares for select using (usuario_id = auth.uid() or public.es_admin());
create policy titulares_crear on public.titulares for insert with check (usuario_id = auth.uid() or public.es_admin());
create policy titulares_editar on public.titulares for update using (usuario_id = auth.uid() or public.es_admin())
  with check (usuario_id = auth.uid() or public.es_admin());

create policy granjas_ver on public.granjas for select using (public.es_mi_titular(titular_id) or public.es_admin());
create policy granjas_crear on public.granjas for insert with check (public.es_mi_titular(titular_id) or public.es_admin());
create policy granjas_editar on public.granjas for update using (public.es_mi_titular(titular_id) or public.es_admin());

create policy campanas_ver on public.campanas for select using (public.es_mi_granja(granja_id) or public.es_admin());
-- Las campañas las crea el servidor tras el pago (rol de servicio) o el operador.
create policy campanas_crear on public.campanas for insert with check (public.es_admin());
create policy campanas_editar on public.campanas for update using (public.es_mi_granja(granja_id) or public.es_admin());

create policy documentos_ver on public.documentos for select using (public.es_mi_titular(titular_id) or public.es_admin());
create policy documentos_crear on public.documentos for insert with check (
  public.es_admin() or (public.es_mi_titular(titular_id) and tipo in ('foto', 'autorizacion_ccaa', 'otro')));
create policy documentos_borrar on public.documentos for delete using (public.es_admin());

create policy consentimientos_ver on public.consentimientos for select using (public.es_mi_titular(titular_id) or public.es_admin());
create policy consentimientos_crear on public.consentimientos for insert with check (public.es_mi_titular(titular_id));

create policy ayuda_ver on public.solicitudes_ayuda for select using (public.es_mi_titular(titular_id) or public.es_admin());
create policy ayuda_crear on public.solicitudes_ayuda for insert with check (public.es_mi_titular(titular_id));
create policy ayuda_atender on public.solicitudes_ayuda for update using (public.es_admin());

create policy pagos_ver on public.pagos for select using (public.es_mi_titular(titular_id) or public.es_admin());

create policy eventos_ver on public.eventos for select using (public.es_admin());

create policy configuracion_leer on public.configuracion for select using (true);
create policy configuracion_editar on public.configuracion for all using (public.es_admin()) with check (public.es_admin());

create policy opciones_leer on public.opciones_listas for select using (true);
create policy opciones_editar on public.opciones_listas for all using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- Almacenamiento de archivos: bucket privado, carpeta por titular (<titular_id>/...)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
      on conflict (id) do nothing;
    execute $p$
      create policy documentos_storage_ver on storage.objects for select using (
        bucket_id = 'documentos' and (public.es_admin() or public.es_mi_titular(((storage.foldername(name))[1])::uuid)))
    $p$;
    execute $p$
      create policy documentos_storage_subir on storage.objects for insert with check (
        bucket_id = 'documentos' and (public.es_admin() or public.es_mi_titular(((storage.foldername(name))[1])::uuid)))
    $p$;
  end if;
end $$;
