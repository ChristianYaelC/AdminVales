# Migracion a Supabase - Vales y Prestamos

## Inconsistencias detectadas entre frontend y modelo de datos

1. En `ValesPage.jsx` se mezcla semantica de `currentPayment` en diferentes flujos (registro individual vs pago por fuente), lo que provoca errores de desfase (off-by-one).
2. Algunas fechas se guardan como string local `dd/mm/yyyy`, lo que dificulta ordenamiento, filtros y conversion en backend.
3. El estado de cuenta en tabla calcula saldos desde el frontend en cada render; si no se guardan snapshots de saldo en cada pago, el historico se puede romper al cambiar reglas de calculo.
4. Los IDs locales (`Math.max + 1`) no son seguros para concurrencia real ni multiples usuarios.
5. En BANCO, `paymentsByQuincena` como objeto en memoria no es consultable de forma relacional.

## Estructura propuesta

- Tabla `clients`: clientes de area `vales` o `banco`.
- Tabla `loans`: prestamos ligados a cliente; soporta folio, fuente, pagos quincenales y estado.
- Tabla `loan_payments`: historial con snapshot monetario (`previous_balance`, `amount_paid`, `new_balance`).
- Tabla `loan_source_settings`: configuracion por fuente.
- Tabla `loan_rate_tables`: tabulador por fuente/monto/plazo.

## Script SQL (DDL + RLS)

Ejecuta completo este archivo en Supabase SQL Editor:

- `supabase/schema.sql`

## Configuracion de cliente Supabase

Archivo ya generado:

- `src/lib/supabaseClient.js`

Variables necesarias en `.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Instalar SDK:

```bash
npm install
```

## Refactorizacion de funciones (de estado local a Supabase)

Archivo de servicio ya generado:

- `src/services/valesSupabaseService.js`

Funciones incluidas:

1. `createValesClient`
2. `createValesLoan`
3. `registerNextQuincenaPayment`
4. `updateLoanCreatedAt`
5. `updatePaymentDate`

### Ejemplo 1: reemplazar alta de cliente

Antes (local state):

```js
setValesClients([...valesClients, newClient])
```

Despues (Supabase):

```js
import { createValesClient } from '../services/valesSupabaseService'

const created = await createValesClient(formData)
setValesClients(prev => [...prev, { ...created, loans: [] }])
```

### Ejemplo 2: reemplazar alta de prestamo

```js
import { createValesLoan } from '../services/valesSupabaseService'

await createValesLoan({
  clientId: selectedClientId,
  folio: formData.folio,
  source: formData.source,
  amount,
  term,
  basePayment,
  insurance,
  insuranceMode: sourceData?.insuranceType || 'none',
  finalPayment,
  createdAtMx: new Date().toLocaleDateString('es-MX')
})
```

### Ejemplo 3: registrar pago secuencial confirmado

```js
import { registerNextQuincenaPayment } from '../services/valesSupabaseService'

await registerNextQuincenaPayment(loanId)
```

## Seguridad (RLS)

El script incluye:

1. `ENABLE ROW LEVEL SECURITY` en tablas de negocio.
2. Politicas por `owner_id = auth.uid()` para `clients`, `loans`, `loan_payments`.
3. Triggers para propagar owner y evitar cruces entre usuarios.
4. Politicas de solo lectura autenticada para tabuladores.

## Recomendacion operativa

Para evitar carreras de concurrencia (dos dispositivos registrando pago al mismo tiempo), en una segunda etapa conviene mover `registerNextQuincenaPayment` a una funcion `RPC` transaccional en PostgreSQL.
