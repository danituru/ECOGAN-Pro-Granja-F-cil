-- Alta con pago (Stripe) y acceso del cliente.

-- Qué granjas cubre cada pago y si la granja va como "sin actividad" (precio reducido).
alter table public.pagos add column if not exists granjas_detalle jsonb not null default '[]'::jsonb;
alter table public.pagos add column if not exists email text;
-- Acceso directo tras pagar: solo si el alta creó la cuenta (nadie puede entrar en una cuenta ajena
-- poniendo su correo en el alta) y una sola vez.
alter table public.pagos add column if not exists usuario_nuevo boolean not null default false;
alter table public.pagos add column if not exists acceso_usado_en timestamptz;
alter table public.pagos add column if not exists stripe_invoice_url text;

create index if not exists pagos_titular_idx on public.pagos (titular_id);
create index if not exists granjas_rega_idx on public.granjas (rega);

-- Motivo por el que el operador devuelve los datos al ganadero (se le muestra en su área).
alter table public.campanas add column if not exists mensaje_al_ganadero text;
-- El ganadero indica que ya ha dado la autorización en ECOGAN (el operador lo comprueba).
alter table public.campanas add column if not exists autorizacion_avisada_en timestamptz;

-- El ganadero puede avisar de que ya autorizó (solo esa columna; el trigger protege el resto).
create or replace function public.avisar_autorizacion(p_campana uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_mi_campana(p_campana) then
    raise exception 'No autorizado';
  end if;
  perform set_config('granjafacil.sistema', 'si', true);
  update public.campanas set autorizacion_avisada_en = now()
    where id = p_campana and estado = 'autorizacion_pendiente';
  insert into public.eventos (actor, campana_id, accion) values (auth.uid(), p_campana, 'avisa_autorizacion');
  perform set_config('granjafacil.sistema', '', true);
end $$;
