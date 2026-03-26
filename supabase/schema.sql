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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_empty check (char_length(trim(name)) > 0)
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  area public.app_area not null default 'vales',

  -- Identificacion
  folio text,
  source_code public.loan_source_code,

  -- Monto base y parametros
  principal_amount numeric(14,2) not null,
  term_quincenas integer,
  total_payments integer,

  -- Montos para calculo de pagos
  base_payment_amount numeric(14,2),
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
  constraint loans_total_payments_positive check (total_payments is null or total_payments > 0),
  constraint loans_amounts_non_negative check (
    (base_payment_amount is null or base_payment_amount >= 0) and
    (final_payment_amount is null or final_payment_amount >= 0)
  )
);

create unique index if not exists loans_owner_folio_unique
  on public.loans(owner_id, folio)
  where folio is not null;

create index if not exists loans_client_idx on public.loans(client_id);
create index if not exists loans_owner_status_idx on public.loans(owner_id, status);
create index if not exists loans_source_idx on public.loans(source_code);

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

-- Triggers updated_at

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
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
alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;
alter table public.loan_source_settings enable row level security;
alter table public.loan_rate_tables enable row level security;

-- Limpiar politicas previas

drop policy if exists clients_select_own on public.clients;
drop policy if exists clients_insert_own on public.clients;
drop policy if exists clients_update_own on public.clients;
drop policy if exists clients_delete_own on public.clients;

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

-- Politicas por usuario dueno (auth.uid)

create policy clients_select_own on public.clients
for select using (owner_id = auth.uid());

create policy clients_insert_own on public.clients
for insert with check (owner_id = auth.uid());

create policy clients_update_own on public.clients
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy clients_delete_own on public.clients
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

-- Seed completo VALEFECTIVO (actualizado segun tu proyecto)
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

-- Nota: puedes poblar captavale/salevale/dportenis con el mismo patron.
