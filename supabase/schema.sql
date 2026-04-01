-- =====================================================
-- SUPABASE SCHEMA - VALES Y PRESTAMOS
-- =====================================================
-- Este script crea una estructura compatible con la logica actual
-- de React para clientes, prestamos, historial de pagos y tabuladores.

create extension if not exists pgcrypto;

-- =====================================================
-- TIPOS
-- =====================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_area') then
    create type public.app_area as enum ('vales', 'banco');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type public.loan_status as enum ('active', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'insurance_mode') then
    create type public.insurance_mode as enum ('none', 'global', 'per_quincena');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_source_code') then
    create type public.loan_source_code as enum ('captavale', 'salevale', 'dportenis', 'valefectivo');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_periodicity') then
    create type public.payment_periodicity as enum ('quincenal', 'mensual');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_product_type') then
    create type public.loan_product_type as enum ('loan', 'insurance');
  end if;
end $$;

-- =====================================================
-- TABLAS MAESTRAS (TABULADORES)
-- =====================================================

create table if not exists public.loan_source_settings (
  source_code public.loan_source_code primary key,
  display_name text not null,
  has_insurance boolean not null default false,
  insurance_mode public.insurance_mode not null default 'none',
  insurance_label text,
  available_terms int[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loan_rate_tables (
  id bigint generated always as identity primary key,
  source_code public.loan_source_code not null references public.loan_source_settings(source_code) on delete cascade,
  amount numeric(14,2) not null,
  term_quincenas integer not null,
  base_payment numeric(14,2) not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_rate_tables_amount_positive check (amount > 0),
  constraint loan_rate_tables_term_positive check (term_quincenas > 0),
  constraint loan_rate_tables_payment_positive check (base_payment > 0),
  constraint loan_rate_tables_unique unique (source_code, amount, term_quincenas)
);

-- Historial de cambios de tabulacion (auditoria)
create table if not exists public.loan_rate_change_log (
  id bigint generated always as identity primary key,
  source_code public.loan_source_code not null,
  amount numeric(14,2) not null,
  term_quincenas integer not null,
  old_base_payment numeric(14,2) not null,
  new_base_payment numeric(14,2) not null,
  affected_active_loans integer not null default 0,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  constraint loan_rate_change_new_positive check (new_base_payment > 0),
  constraint loan_rate_change_term_positive check (term_quincenas > 0)
);

create index if not exists loan_rate_change_log_source_idx
  on public.loan_rate_change_log(source_code, amount, term_quincenas, changed_at desc);

-- =====================================================
-- CLIENTES / PRESTAMOS / PAGOS
-- =====================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  area public.app_area not null default 'vales',
  name text not null,
  phone text,
  address text,
  work_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_empty check (char_length(trim(name)) > 0)
);

-- Configuracion operativa por usuario (pantalla Configuracion)
create table if not exists public.app_user_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  upcoming_window_days integer not null default 7,
  grace_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_user_settings_owner_unique unique (owner_id),
  constraint app_user_settings_upcoming_window_range check (upcoming_window_days between 1 and 30),
  constraint app_user_settings_grace_days_range check (grace_days between 0 and 15)
);

-- Servicios personales (modulo Gestion Personal)
create table if not exists public.personal_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  amount numeric(14,2) not null,
  frequency text not null,
  frequency_days integer,
  due_day integer not null,
  last_payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_services_name_not_empty check (char_length(trim(name)) > 0),
  constraint personal_services_amount_positive check (amount > 0),
  constraint personal_services_due_day_range check (due_day between 1 and 31),
  constraint personal_services_frequency_valid check (frequency in ('monthly', 'bimonthly', 'quarterly', 'custom')),
  constraint personal_services_custom_days_valid check (
    (frequency <> 'custom' and frequency_days is null)
    or
    (frequency = 'custom' and frequency_days is not null and frequency_days between 1 and 365)
  )
);

create index if not exists personal_services_owner_idx
  on public.personal_services(owner_id);

create index if not exists personal_services_due_day_idx
  on public.personal_services(owner_id, due_day);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  area public.app_area not null default 'vales',

  -- Identificacion
  folio text,
  loan_name text,
  source_code public.loan_source_code,
  product_type public.loan_product_type,
  payment_periodicity public.payment_periodicity not null default 'quincenal',

  -- Monto base y parametros
  principal_amount numeric(14,2) not null,
  term_quincenas integer,
  term_months integer,
  total_payments integer,

  -- Montos para calculo de pagos
  base_payment_amount numeric(14,2),
  monthly_payment_amount numeric(14,2),
  insurance_amount numeric(14,2) not null default 0,
  insurance_mode public.insurance_mode not null default 'none',
  final_payment_amount numeric(14,2),

  -- Progreso
  current_payment_index integer not null default 0,
  status public.loan_status not null default 'active',

  -- Fechas
  loan_created_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint loans_principal_non_negative check (principal_amount >= 0),
  constraint loans_insurance_non_negative check (insurance_amount >= 0),
  constraint loans_current_payment_non_negative check (current_payment_index >= 0),
  constraint loans_term_positive check (term_quincenas is null or term_quincenas > 0),
  constraint loans_term_months_positive check (term_months is null or term_months > 0),
  constraint loans_total_payments_positive check (total_payments is null or total_payments > 0),
  constraint loans_amounts_non_negative check (
    (base_payment_amount is null or base_payment_amount >= 0) and
    (monthly_payment_amount is null or monthly_payment_amount >= 0) and
    (final_payment_amount is null or final_payment_amount >= 0)
  ),

  -- Reglas de consistencia por area:
  -- VALES: requiere folio + fuente y usa periodicidad quincenal.
  -- BANCO: no usa folio/fuente, usa periodicidad mensual y puede ser prestamo o seguro.
  constraint loans_area_consistency check (
    (
      area = 'vales' and
      folio is not null and
      char_length(trim(folio)) > 0 and
      source_code is not null and
      payment_periodicity = 'quincenal'
    )
    or
    (
      area = 'banco' and
      folio is null and
      source_code is null and
      payment_periodicity = 'mensual' and
      term_months is not null and
      term_months > 0 and
      monthly_payment_amount is not null and
      monthly_payment_amount > 0
    )
  )
);

create unique index if not exists loans_owner_folio_unique
  on public.loans(owner_id, folio)
  where folio is not null;

create index if not exists loans_client_idx on public.loans(client_id);
create index if not exists loans_owner_status_idx on public.loans(owner_id, status);
create index if not exists loans_source_idx on public.loans(source_code);
create index if not exists loans_loan_name_idx on public.loans(loan_name);

create table if not exists public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  loan_id uuid not null references public.loans(id) on delete cascade,

  payment_number integer not null,
  payment_date timestamptz not null default now(),

  -- Importante: guardar snapshot monetario para no perder integridad historica
  previous_balance numeric(14,2) not null,
  amount_paid numeric(14,2) not null,
  new_balance numeric(14,2) not null,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint loan_payments_payment_number_positive check (payment_number > 0),
  constraint loan_payments_amount_positive check (amount_paid > 0),
  constraint loan_payments_balance_check check (new_balance = previous_balance - amount_paid),
  constraint loan_payments_unique_number unique (loan_id, payment_number)
);

create index if not exists loan_payments_loan_idx on public.loan_payments(loan_id, payment_number);
create index if not exists loan_payments_owner_date_idx on public.loan_payments(owner_id, payment_date desc);

-- =====================================================
-- FUNCIONES DE MANTENIMIENTO
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Propaga owner_id desde cliente al prestamo para evitar cruces de tenant
create or replace function public.sync_loan_owner_id()
returns trigger
language plpgsql
as $$
declare
  client_owner uuid;
begin
  select owner_id into client_owner from public.clients where id = new.client_id;

  if client_owner is null then
    raise exception 'Cliente no existe';
  end if;

  new.owner_id := client_owner;
  return new;
end;
$$;

-- Propaga owner_id desde prestamo al pago
create or replace function public.sync_payment_owner_id()
returns trigger
language plpgsql
as $$
declare
  loan_owner uuid;
begin
  select owner_id into loan_owner from public.loans where id = new.loan_id;

  if loan_owner is null then
    raise exception 'Prestamo no existe';
  end if;

  new.owner_id := loan_owner;
  return new;
end;
$$;

-- Cambia tabulacion y deja evidencia en auditoria.
-- Nota: NO modifica prestamos existentes; esos conservan su base_payment_amount.
create or replace function public.update_rate_for_new_loans(
  p_source_code public.loan_source_code,
  p_amount numeric,
  p_term_quincenas integer,
  p_new_base_payment numeric,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_base_payment numeric(14,2);
  v_affected_active_loans integer;
begin
  if p_new_base_payment is null or p_new_base_payment <= 0 then
    raise exception 'El nuevo pago base debe ser mayor a 0';
  end if;

  select base_payment
    into v_old_base_payment
  from public.loan_rate_tables
  where source_code = p_source_code
    and amount = p_amount
    and term_quincenas = p_term_quincenas
    and is_available = true
  for update;

  if v_old_base_payment is null then
    raise exception 'No existe tabulacion activa para %, monto %, plazo %', p_source_code, p_amount, p_term_quincenas;
  end if;

  update public.loan_rate_tables
  set
    base_payment = p_new_base_payment,
    updated_at = now()
  where source_code = p_source_code
    and amount = p_amount
    and term_quincenas = p_term_quincenas
    and is_available = true;

  select count(*)::integer
    into v_affected_active_loans
  from public.loans
  where area = 'vales'
    and source_code = p_source_code
    and principal_amount = p_amount
    and term_quincenas = p_term_quincenas
    and status = 'active';

  insert into public.loan_rate_change_log (
    source_code,
    amount,
    term_quincenas,
    old_base_payment,
    new_base_payment,
    affected_active_loans,
    reason,
    changed_by,
    changed_at
  )
  values (
    p_source_code,
    p_amount,
    p_term_quincenas,
    v_old_base_payment,
    p_new_base_payment,
    v_affected_active_loans,
    p_reason,
    auth.uid(),
    now()
  );
end;
$$;

-- Consulta historial de cambios de tabulacion con filtros opcionales.
create or replace function public.get_loan_rate_change_history(
  p_source_code public.loan_source_code default null,
  p_amount numeric default null,
  p_term_quincenas integer default null,
  p_limit integer default 100
)
returns table (
  id bigint,
  source_code public.loan_source_code,
  amount numeric,
  term_quincenas integer,
  old_base_payment numeric,
  new_base_payment numeric,
  affected_active_loans integer,
  reason text,
  changed_by uuid,
  changed_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select
    l.id,
    l.source_code,
    l.amount,
    l.term_quincenas,
    l.old_base_payment,
    l.new_base_payment,
    l.affected_active_loans,
    l.reason,
    l.changed_by,
    l.changed_at
  from public.loan_rate_change_log l
  where (p_source_code is null or l.source_code = p_source_code)
    and (p_amount is null or l.amount = p_amount)
    and (p_term_quincenas is null or l.term_quincenas = p_term_quincenas)
    and (l.changed_by = auth.uid() or l.changed_by is null)
  order by l.changed_at desc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

-- Verificacion rapida despues de cambiar tabulacion.
-- Muestra valor actual, ultimo cambio y distribucion de prestamos por pago guardado.
create or replace function public.verify_rate_change_effect(
  p_source_code public.loan_source_code,
  p_amount numeric,
  p_term_quincenas integer
)
returns table (
  source_code public.loan_source_code,
  amount numeric,
  term_quincenas integer,
  current_table_base_payment numeric,
  last_change_at timestamptz,
  last_old_base_payment numeric,
  last_new_base_payment numeric,
  total_matching_loans integer,
  loans_with_old_payment integer,
  loans_with_new_payment integer,
  loans_created_after_last_change integer,
  loans_created_after_last_change_with_new_payment integer,
  loans_created_before_last_change_with_old_payment integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_base_payment numeric(14,2);
  v_last_change_at timestamptz;
  v_last_old numeric(14,2);
  v_last_new numeric(14,2);
begin
  select lrt.base_payment
    into v_current_base_payment
  from public.loan_rate_tables lrt
  where lrt.source_code = p_source_code
    and lrt.amount = p_amount
    and lrt.term_quincenas = p_term_quincenas
    and lrt.is_available = true
  limit 1;

  select l.changed_at, l.old_base_payment, l.new_base_payment
    into v_last_change_at, v_last_old, v_last_new
  from public.loan_rate_change_log l
  where l.source_code = p_source_code
    and l.amount = p_amount
    and l.term_quincenas = p_term_quincenas
    and (l.changed_by = auth.uid() or l.changed_by is null)
  order by l.changed_at desc
  limit 1;

  return query
  select
    p_source_code,
    p_amount,
    p_term_quincenas,
    v_current_base_payment,
    v_last_change_at,
    v_last_old,
    v_last_new,
    count(*)::integer as total_matching_loans,
    count(*) filter (where v_last_old is not null and lo.base_payment_amount = v_last_old)::integer as loans_with_old_payment,
    count(*) filter (where v_last_new is not null and lo.base_payment_amount = v_last_new)::integer as loans_with_new_payment,
    count(*) filter (where v_last_change_at is not null and lo.loan_created_at >= v_last_change_at)::integer as loans_created_after_last_change,
    count(*) filter (where v_last_change_at is not null and v_last_new is not null and lo.loan_created_at >= v_last_change_at and lo.base_payment_amount = v_last_new)::integer as loans_created_after_last_change_with_new_payment,
    count(*) filter (where v_last_change_at is not null and v_last_old is not null and lo.loan_created_at < v_last_change_at and lo.base_payment_amount = v_last_old)::integer as loans_created_before_last_change_with_old_payment
  from public.loans lo
  where lo.owner_id = auth.uid()
    and lo.area = 'vales'
    and lo.source_code = p_source_code
    and lo.principal_amount = p_amount
    and lo.term_quincenas = p_term_quincenas;
end;
$$;

-- Triggers updated_at

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists trg_app_user_settings_updated_at on public.app_user_settings;
create trigger trg_app_user_settings_updated_at
before update on public.app_user_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_personal_services_updated_at on public.personal_services;
create trigger trg_personal_services_updated_at
before update on public.personal_services
for each row execute function public.set_updated_at();

drop trigger if exists trg_loans_updated_at on public.loans;
create trigger trg_loans_updated_at
before update on public.loans
for each row execute function public.set_updated_at();

drop trigger if exists trg_loan_payments_updated_at on public.loan_payments;
create trigger trg_loan_payments_updated_at
before update on public.loan_payments
for each row execute function public.set_updated_at();

drop trigger if exists trg_loan_source_settings_updated_at on public.loan_source_settings;
create trigger trg_loan_source_settings_updated_at
before update on public.loan_source_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_loan_rate_tables_updated_at on public.loan_rate_tables;
create trigger trg_loan_rate_tables_updated_at
before update on public.loan_rate_tables
for each row execute function public.set_updated_at();

-- Triggers owner_id

drop trigger if exists trg_loans_sync_owner on public.loans;
create trigger trg_loans_sync_owner
before insert or update of client_id on public.loans
for each row execute function public.sync_loan_owner_id();

drop trigger if exists trg_loan_payments_sync_owner on public.loan_payments;
create trigger trg_loan_payments_sync_owner
before insert or update of loan_id on public.loan_payments
for each row execute function public.sync_payment_owner_id();

-- =====================================================
-- RLS
-- =====================================================

alter table public.clients enable row level security;
alter table public.app_user_settings enable row level security;
alter table public.personal_services enable row level security;
alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;
alter table public.loan_source_settings enable row level security;
alter table public.loan_rate_tables enable row level security;
alter table public.loan_rate_change_log enable row level security;

-- Limpiar politicas previas

drop policy if exists clients_select_own on public.clients;
drop policy if exists clients_insert_own on public.clients;
drop policy if exists clients_update_own on public.clients;
drop policy if exists clients_delete_own on public.clients;

drop policy if exists app_user_settings_select_own on public.app_user_settings;
drop policy if exists app_user_settings_insert_own on public.app_user_settings;
drop policy if exists app_user_settings_update_own on public.app_user_settings;
drop policy if exists app_user_settings_delete_own on public.app_user_settings;

drop policy if exists personal_services_select_own on public.personal_services;
drop policy if exists personal_services_insert_own on public.personal_services;
drop policy if exists personal_services_update_own on public.personal_services;
drop policy if exists personal_services_delete_own on public.personal_services;

drop policy if exists loans_select_own on public.loans;
drop policy if exists loans_insert_own on public.loans;
drop policy if exists loans_update_own on public.loans;
drop policy if exists loans_delete_own on public.loans;

drop policy if exists loan_payments_select_own on public.loan_payments;
drop policy if exists loan_payments_insert_own on public.loan_payments;
drop policy if exists loan_payments_update_own on public.loan_payments;
drop policy if exists loan_payments_delete_own on public.loan_payments;

drop policy if exists loan_source_settings_read_all on public.loan_source_settings;
drop policy if exists loan_rate_tables_read_all on public.loan_rate_tables;
drop policy if exists loan_rate_change_log_select_own on public.loan_rate_change_log;
drop policy if exists loan_rate_change_log_insert_own on public.loan_rate_change_log;

-- Politicas por usuario dueno (auth.uid)

create policy clients_select_own on public.clients
for select using (owner_id = auth.uid());

create policy clients_insert_own on public.clients
for insert with check (owner_id = auth.uid());

create policy clients_update_own on public.clients
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy clients_delete_own on public.clients
for delete using (owner_id = auth.uid());

create policy app_user_settings_select_own on public.app_user_settings
for select using (owner_id = auth.uid());

create policy app_user_settings_insert_own on public.app_user_settings
for insert with check (owner_id = auth.uid());

create policy app_user_settings_update_own on public.app_user_settings
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy app_user_settings_delete_own on public.app_user_settings
for delete using (owner_id = auth.uid());

create policy personal_services_select_own on public.personal_services
for select using (owner_id = auth.uid());

create policy personal_services_insert_own on public.personal_services
for insert with check (owner_id = auth.uid());

create policy personal_services_update_own on public.personal_services
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy personal_services_delete_own on public.personal_services
for delete using (owner_id = auth.uid());

create policy loans_select_own on public.loans
for select using (owner_id = auth.uid());

create policy loans_insert_own on public.loans
for insert with check (owner_id = auth.uid());

create policy loans_update_own on public.loans
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy loans_delete_own on public.loans
for delete using (owner_id = auth.uid());

create policy loan_payments_select_own on public.loan_payments
for select using (owner_id = auth.uid());

create policy loan_payments_insert_own on public.loan_payments
for insert with check (owner_id = auth.uid());

create policy loan_payments_update_own on public.loan_payments
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy loan_payments_delete_own on public.loan_payments
for delete using (owner_id = auth.uid());

-- Tabuladores: lectura para usuarios autenticados
create policy loan_source_settings_read_all on public.loan_source_settings
for select to authenticated using (true);

create policy loan_rate_tables_read_all on public.loan_rate_tables
for select to authenticated using (true);

create policy loan_rate_change_log_select_own on public.loan_rate_change_log
for select using (changed_by = auth.uid());

create policy loan_rate_change_log_insert_own on public.loan_rate_change_log
for insert with check (changed_by = auth.uid());

-- =====================================================
-- SEED DE FUENTES
-- =====================================================

insert into public.loan_source_settings (source_code, display_name, has_insurance, insurance_mode, insurance_label, available_terms)
values
  ('captavale', 'CaptaVale', false, 'none', null, array[8,10,12,14]),
  ('salevale', 'SaleVale', true, 'per_quincena', 'Fondo Protege', array[6,8,10,12,14,16]),
  ('dportenis', 'dportenis', true, 'global', 'Seguro Global', array[8,10,12,14,16,18,20]),
  ('valefectivo', 'valefectivo', true, 'per_quincena', 'Fondo Protege', array[6,8,10,12,14,16])
on conflict (source_code) do update
set
  display_name = excluded.display_name,
  has_insurance = excluded.has_insurance,
  insurance_mode = excluded.insurance_mode,
  insurance_label = excluded.insurance_label,
  available_terms = excluded.available_terms,
  updated_at = now();

-- SEED COMPLETO - Todas las fuentes con sus tabuladores

-- CAPTAVALE
insert into public.loan_rate_tables (source_code, amount, term_quincenas, base_payment, is_available)
values
  ('captavale', 1000, 8, 192, true),
  ('captavale', 1000, 10, 171, true),
  ('captavale', 1000, 12, 138, true),
  ('captavale', 2000, 8, 386, true),
  ('captavale', 2000, 10, 326, true),
  ('captavale', 2000, 12, 281, true),
  ('captavale', 3000, 8, 573, true),
  ('captavale', 3000, 10, 484, true),
  ('captavale', 3000, 12, 419, true),
  ('captavale', 4000, 8, 754, true),
  ('captavale', 4000, 10, 632, true),
  ('captavale', 4000, 12, 560, true),
  ('captavale', 5000, 8, 945, true),
  ('captavale', 5000, 10, 790, true),
  ('captavale', 5000, 12, 695, true),
  ('captavale', 6000, 10, 938, true),
  ('captavale', 6000, 12, 828, true),
  ('captavale', 6000, 14, 738, true),
  ('captavale', 7000, 10, 1091, true),
  ('captavale', 7000, 12, 961, true),
  ('captavale', 7000, 14, 841, true),
  ('captavale', 8000, 10, 1215, true),
  ('captavale', 8000, 12, 1089, true),
  ('captavale', 8000, 14, 969, true),
  ('captavale', 9000, 10, 1407, true),
  ('captavale', 9000, 12, 1207, true),
  ('captavale', 9000, 14, 1077, true),
  ('captavale', 10000, 8, 1840, true),
  ('captavale', 10000, 10, 1565, true),
  ('captavale', 10000, 12, 1375, true),
  ('captavale', 10000, 14, 1220, true)
on conflict (source_code, amount, term_quincenas) do update
set base_payment = excluded.base_payment,
    is_available = excluded.is_available,
    updated_at = now();

-- SALEVALE
insert into public.loan_rate_tables (source_code, amount, term_quincenas, base_payment, is_available)
values
  ('salevale', 1000, 6, 229, true),
  ('salevale', 1000, 8, 187, true),
  ('salevale', 1000, 10, 162, true),
  ('salevale', 1000, 12, 146, true),
  ('salevale', 1000, 14, 134, true),
  ('salevale', 1000, 16, 125, true),
  ('salevale', 1500, 6, 335, true),
  ('salevale', 1500, 8, 273, true),
  ('salevale', 1500, 10, 235, true),
  ('salevale', 1500, 12, 210, true),
  ('salevale', 1500, 14, 193, true),
  ('salevale', 1500, 16, 179, true),
  ('salevale', 2000, 6, 442, true),
  ('salevale', 2000, 8, 358, true),
  ('salevale', 2000, 10, 308, true),
  ('salevale', 2000, 12, 275, true),
  ('salevale', 2000, 14, 251, true),
  ('salevale', 2000, 16, 233, true),
  ('salevale', 2500, 6, 548, true),
  ('salevale', 2500, 8, 444, true),
  ('salevale', 2500, 10, 381, true),
  ('salevale', 2500, 12, 340, true),
  ('salevale', 2500, 14, 310, true),
  ('salevale', 2500, 16, 288, true),
  ('salevale', 3000, 6, 654, true),
  ('salevale', 3000, 8, 529, true),
  ('salevale', 3000, 10, 454, true),
  ('salevale', 3000, 12, 404, true),
  ('salevale', 3000, 14, 369, true),
  ('salevale', 3000, 16, 342, true),
  ('salevale', 3500, 6, 761, true),
  ('salevale', 3500, 8, 615, true),
  ('salevale', 3500, 10, 527, true),
  ('salevale', 3500, 12, 469, true),
  ('salevale', 3500, 14, 427, true),
  ('salevale', 3500, 16, 396, true),
  ('salevale', 4000, 6, 867, true),
  ('salevale', 4000, 8, 700, true),
  ('salevale', 4000, 10, 600, true),
  ('salevale', 4000, 12, 533, true),
  ('salevale', 4000, 14, 486, true),
  ('salevale', 4000, 16, 450, true),
  ('salevale', 4500, 6, 973, true),
  ('salevale', 4500, 8, 786, true),
  ('salevale', 4500, 10, 673, true),
  ('salevale', 4500, 12, 598, true),
  ('salevale', 4500, 14, 545, true),
  ('salevale', 4500, 16, 504, true),
  ('salevale', 5000, 6, 1079, true),
  ('salevale', 5000, 8, 871, true),
  ('salevale', 5000, 10, 746, true),
  ('salevale', 5000, 12, 663, true),
  ('salevale', 5000, 14, 603, true),
  ('salevale', 5000, 16, 559, true),
  ('salevale', 5500, 6, 1186, true),
  ('salevale', 5500, 8, 957, true),
  ('salevale', 5500, 10, 819, true),
  ('salevale', 5500, 12, 727, true),
  ('salevale', 5500, 14, 662, true),
  ('salevale', 5500, 16, 613, true),
  ('salevale', 6000, 6, 1292, true),
  ('salevale', 6000, 8, 1042, true),
  ('salevale', 6000, 10, 892, true),
  ('salevale', 6000, 12, 792, true),
  ('salevale', 6000, 14, 721, true),
  ('salevale', 6000, 16, 667, true)
on conflict (source_code, amount, term_quincenas) do update
set base_payment = excluded.base_payment,
    is_available = excluded.is_available,
    updated_at = now();

-- DPORTENIS
insert into public.loan_rate_tables (source_code, amount, term_quincenas, base_payment, is_available)
values
  ('dportenis', 1000, 8, 181, true),
  ('dportenis', 1000, 10, 155, true),
  ('dportenis', 1500, 8, 272, true),
  ('dportenis', 1500, 10, 233, true),
  ('dportenis', 2000, 8, 363, true),
  ('dportenis', 2000, 10, 310, true),
  ('dportenis', 2000, 12, 275, true),
  ('dportenis', 2000, 14, 250, true),
  ('dportenis', 2000, 16, 231, true),
  ('dportenis', 2000, 18, 217, true),
  ('dportenis', 2000, 20, 200, true),
  ('dportenis', 2500, 8, 453, true),
  ('dportenis', 2500, 10, 388, true),
  ('dportenis', 2500, 12, 344, true),
  ('dportenis', 3000, 8, 544, true),
  ('dportenis', 3000, 10, 465, true),
  ('dportenis', 3000, 12, 413, true),
  ('dportenis', 3000, 14, 375, true),
  ('dportenis', 3000, 16, 347, true),
  ('dportenis', 3000, 18, 325, true),
  ('dportenis', 3000, 20, 300, true),
  ('dportenis', 3500, 8, 634, true),
  ('dportenis', 3500, 10, 543, true),
  ('dportenis', 3500, 12, 481, true),
  ('dportenis', 3500, 14, 438, true),
  ('dportenis', 4000, 8, 725, true),
  ('dportenis', 4000, 10, 620, true),
  ('dportenis', 4000, 12, 550, true),
  ('dportenis', 4000, 14, 500, true),
  ('dportenis', 4000, 16, 463, true),
  ('dportenis', 4000, 18, 433, true),
  ('dportenis', 4000, 20, 400, true),
  ('dportenis', 5000, 8, 906, true),
  ('dportenis', 5000, 10, 775, true),
  ('dportenis', 5000, 12, 688, true),
  ('dportenis', 5000, 14, 625, true),
  ('dportenis', 5000, 16, 578, true),
  ('dportenis', 5000, 18, 542, true),
  ('dportenis', 5000, 20, 500, true),
  ('dportenis', 6000, 8, 1088, true),
  ('dportenis', 6000, 10, 930, true),
  ('dportenis', 6000, 12, 825, true),
  ('dportenis', 6000, 14, 750, true),
  ('dportenis', 6000, 16, 694, true),
  ('dportenis', 6000, 18, 650, true),
  ('dportenis', 6000, 20, 600, true),
  ('dportenis', 7000, 8, 1269, true),
  ('dportenis', 7000, 10, 1085, true),
  ('dportenis', 7000, 12, 963, true),
  ('dportenis', 7000, 14, 875, true),
  ('dportenis', 7000, 16, 809, true),
  ('dportenis', 7000, 18, 758, true),
  ('dportenis', 7000, 20, 700, true),
  ('dportenis', 8000, 8, 1450, true),
  ('dportenis', 8000, 10, 1240, true),
  ('dportenis', 8000, 12, 1100, true),
  ('dportenis', 8000, 14, 1000, true),
  ('dportenis', 8000, 16, 925, true),
  ('dportenis', 8000, 18, 867, true),
  ('dportenis', 8000, 20, 800, true),
  ('dportenis', 9000, 8, 1631, true),
  ('dportenis', 9000, 10, 1395, true),
  ('dportenis', 9000, 12, 1238, true),
  ('dportenis', 9000, 14, 1125, true),
  ('dportenis', 9000, 16, 1041, true),
  ('dportenis', 9000, 18, 975, true),
  ('dportenis', 9000, 20, 900, true),
  ('dportenis', 10000, 8, 1813, true),
  ('dportenis', 10000, 10, 1550, true),
  ('dportenis', 10000, 12, 1375, true),
  ('dportenis', 10000, 14, 1250, true),
  ('dportenis', 10000, 16, 1156, true),
  ('dportenis', 10000, 18, 1083, true),
  ('dportenis', 10000, 20, 1000, true),
  ('dportenis', 11000, 8, 1994, true),
  ('dportenis', 11000, 10, 1705, true),
  ('dportenis', 11000, 12, 1513, true),
  ('dportenis', 11000, 14, 1375, true),
  ('dportenis', 11000, 16, 1272, true),
  ('dportenis', 11000, 18, 1192, true),
  ('dportenis', 11000, 20, 1100, true),
  ('dportenis', 12000, 8, 2175, true),
  ('dportenis', 12000, 10, 1860, true),
  ('dportenis', 12000, 12, 1650, true),
  ('dportenis', 12000, 14, 1500, true),
  ('dportenis', 12000, 16, 1388, true),
  ('dportenis', 12000, 18, 1300, true),
  ('dportenis', 12000, 20, 1200, true),
  ('dportenis', 13000, 8, 2356, true),
  ('dportenis', 13000, 10, 2015, true),
  ('dportenis', 13000, 12, 1788, true),
  ('dportenis', 13000, 14, 1625, true),
  ('dportenis', 13000, 16, 1503, true),
  ('dportenis', 13000, 18, 1408, true),
  ('dportenis', 13000, 20, 1300, true)
on conflict (source_code, amount, term_quincenas) do update
set base_payment = excluded.base_payment,
    is_available = excluded.is_available,
    updated_at = now();

-- VALEFECTIVO
insert into public.loan_rate_tables (source_code, amount, term_quincenas, base_payment, is_available)
values
  ('valefectivo', 1000, 6, 244, true),
  ('valefectivo', 1000, 8, 193, true),
  ('valefectivo', 1000, 10, 164, true),
  ('valefectivo', 1000, 12, 139, true),
  ('valefectivo', 2000, 6, 487, true),
  ('valefectivo', 2000, 8, 386, true),
  ('valefectivo', 2000, 10, 328, true),
  ('valefectivo', 2000, 12, 277, true),
  ('valefectivo', 2000, 14, 243, true),
  ('valefectivo', 2000, 16, 217, true),
  ('valefectivo', 3000, 6, 731, true),
  ('valefectivo', 3000, 8, 581, true),
  ('valefectivo', 3000, 10, 492, true),
  ('valefectivo', 3000, 12, 416, true),
  ('valefectivo', 3000, 14, 364, true),
  ('valefectivo', 3000, 16, 326, true),
  ('valefectivo', 4000, 6, 1016, true),
  ('valefectivo', 4000, 8, 785, true),
  ('valefectivo', 4000, 10, 648, true),
  ('valefectivo', 4000, 12, 560, true),
  ('valefectivo', 4000, 14, 501, true),
  ('valefectivo', 4000, 16, 447, true),
  ('valefectivo', 5000, 8, 983, true),
  ('valefectivo', 5000, 10, 810, true),
  ('valefectivo', 5000, 12, 692, true),
  ('valefectivo', 5000, 14, 626, true),
  ('valefectivo', 5000, 16, 560, true),
  ('valefectivo', 6000, 8, 1180, true),
  ('valefectivo', 6000, 10, 971, true),
  ('valefectivo', 6000, 12, 829, true),
  ('valefectivo', 6000, 14, 751, true),
  ('valefectivo', 6000, 16, 672, true),
  ('valefectivo', 8000, 8, 1490, true),
  ('valefectivo', 8000, 10, 1234, true),
  ('valefectivo', 8000, 12, 1058, true),
  ('valefectivo', 8000, 14, 956, true),
  ('valefectivo', 8000, 16, 843, true),
  ('valefectivo', 10000, 8, 1871, true),
  ('valefectivo', 10000, 10, 1543, true),
  ('valefectivo', 10000, 12, 1317, true),
  ('valefectivo', 10000, 14, 1192, true),
  ('valefectivo', 10000, 16, 1066, true),
  ('valefectivo', 12000, 8, 2248, true),
  ('valefectivo', 12000, 10, 1850, true),
  ('valefectivo', 12000, 12, 1579, true),
  ('valefectivo', 12000, 14, 1430, true),
  ('valefectivo', 12000, 16, 1280, true),
  ('valefectivo', 16000, 8, 2980, true),
  ('valefectivo', 16000, 10, 2467, true),
  ('valefectivo', 16000, 12, 2116, true),
  ('valefectivo', 16000, 14, 1911, true),
  ('valefectivo', 16000, 16, 1685, true)
on conflict (source_code, amount, term_quincenas) do update
set base_payment = excluded.base_payment,
    is_available = excluded.is_available,
    updated_at = now();
