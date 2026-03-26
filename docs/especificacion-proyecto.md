# Especificacion Detallada del Proyecto

## 1) Objetivo funcional

Sistema administrativo para:

- Gestion de clientes.
- Gestion de prestamos por fuente de cobro (VALES).
- Registro de pagos por quincena con control de saldo.
- Vista de resumen por fuente y total general.
- Modulo adicional BANCO con registro por quincena.

## 2) Stack actual

- Frontend: React 18 + Vite.
- UI: Tailwind CSS + Lucide.
- Estado actual: local state con Context.
- Migracion objetivo: Supabase (Postgres + Auth + RLS).

## 3) Dominios y entidades

### VALES

- Cliente (`name`, `phone`, `address`).
- Prestamo (`folio`, `source`, `amount`, `term`, `basePayment`, `insurance`, `finalPayment`, `status`).
- Pagos (`num`, `amount`, `date`) con estado de cuenta.

### BANCO

- Cliente banco (`name`, `totalLoanAmount`).
- Pagos por quincena (actualmente en estructura key/value).

## 4) Reglas de negocio detectadas

1. Un folio debe ser unico en VALES.
2. Cada fuente define montos/plazos validos por tabulador.
3. Seguro:
   - `global`: se divide entre quincenas.
   - `perQuincena`: se suma directo al pago.
4. Registro de pago individual: monto fijo por quincena.
5. Estado de cuenta:
   - `saldo_anterior` = total_a_pagar - suma_pagos_previos.
   - `nuevo_saldo` = saldo_anterior - importe_pago.
6. Al llegar al total de pagos, estado `completed`.

## 5) Problemas actuales a resolver en migracion

1. Off-by-one historico en contador de quincena.
2. Fechas almacenadas como texto local.
3. Dependencia de calculo en memoria (riesgo de incoherencia).
4. IDs locales no aptos para concurrencia multiusuario.
5. BANCO no tiene estructura relacional en pagos.

## 6) Modelo de datos objetivo

- `clients`
- `loans`
- `loan_payments`
- `loan_source_settings`
- `loan_rate_tables`

Detalle tecnico en:

- `supabase/schema.sql`
- `docs/base-datos-supabase.md`

## 7) Flujos recomendados de migracion

### Fase 1 (sin romper UI)

1. Crear esquema SQL + RLS en Supabase.
2. Agregar `supabaseClient.js`.
3. Introducir servicios de datos (`valesSupabaseService.js`).
4. Cambiar operaciones de crear cliente, crear prestamo y registrar pago.

### Fase 2 (consistencia fuerte)

1. Mover calculo de registro de pago a RPC transaccional.
2. Migrar fecha de pago/creacion totalmente a `timestamptz`.
3. Migrar BANCO a tablas relacionales (`banco_loans`, `banco_payments`) o reusar `loans`/`loan_payments` con `area='banco'`.

### Fase 3 (operacion)

1. Agregar auditoria (`created_by`, `updated_by`, logs).
2. Agregar reportes SQL (saldo por cliente, cartera vencida, pagos por fuente).
3. Agregar pruebas de integridad de dinero.

## 8) Contrato de datos para otra IA

### Cliente

```json
{
  "id": "uuid",
  "area": "vales|banco",
  "name": "string",
  "phone": "string|null",
  "address": "string|null"
}
```

### Prestamo

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "folio": "string|null",
  "source_code": "captavale|salevale|dportenis|valefectivo|null",
  "principal_amount": "numeric",
  "term_quincenas": "int|null",
  "total_payments": "int|null",
  "base_payment_amount": "numeric|null",
  "insurance_amount": "numeric",
  "insurance_mode": "none|global|per_quincena",
  "final_payment_amount": "numeric|null",
  "current_payment_index": "int",
  "status": "active|completed|cancelled",
  "loan_created_at": "timestamptz"
}
```

### Pago

```json
{
  "id": "uuid",
  "loan_id": "uuid",
  "payment_number": "int",
  "payment_date": "timestamptz",
  "previous_balance": "numeric",
  "amount_paid": "numeric",
  "new_balance": "numeric"
}
```

## 9) Checklist de handoff

1. Ejecutar `supabase/schema.sql`.
2. Configurar variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Validar login (auth.uid) para RLS.
4. Reemplazar handlers locales por servicios Supabase.
5. Probar flujo completo: crear cliente, crear prestamo, registrar pago, editar fecha.
