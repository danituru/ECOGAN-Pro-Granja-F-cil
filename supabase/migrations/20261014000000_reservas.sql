-- Reservas de plaza desde la landing (antes de abrir el alta con pago).
-- Las inserta el servidor con la clave de servicio; solo el operador puede leerlas.

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  telefono text not null check (char_length(telefono) between 9 and 20),
  email text check (email is null or char_length(email) <= 200),
  comunidad text not null,
  especie text not null check (especie in ('porcino', 'aves_carne', 'aves_puesta', 'pavos', 'varias')),
  numero_granjas integer not null check (numero_granjas between 1 and 500),
  mensaje text check (mensaje is null or char_length(mensaje) <= 1000),
  idioma text not null default 'es',
  origen text,
  acepta_privacidad boolean not null check (acepta_privacidad),
  creado_en timestamptz not null default now(),
  contactado_en timestamptz,
  nota_operador text
);
create index on public.reservas (creado_en desc);

alter table public.reservas enable row level security;
create policy reservas_admin on public.reservas for all using (public.es_admin()) with check (public.es_admin());
