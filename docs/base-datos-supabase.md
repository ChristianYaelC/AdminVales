# Migracion a Supabase - Vales y Prestamos

## Estado actual

La migracion a Supabase esta en estado parcial en runtime.

Estado vigente:

1. Clientes (Vales/Banco): alta, edicion y eliminacion ya intentan persistir en Supabase.
2. Si Supabase no esta configurado o no responde, esos flujos conservan fallback local para pruebas.
3. Prestamos/pagos y carga inicial completa aun no estan migrados al 100%.
4. La logica de calculo de proxima fecha en Gestion Personal se centralizo en util compartida (`src/domain/personal/paymentDates.js`) para evitar divergencias entre vistas.

## Inconsistencias detectadas originalmente

1. Se detecto mezcla de semantica de `currentPayment` en diferentes flujos. Esto ya se ajusto a una regla unificada.
2. Algunas fechas se guardan como string local `dd/mm/yyyy`, lo que dificulta ordenamiento, filtros y conversion en backend.
3. El estado de cuenta en tabla calcula saldos desde el frontend en cada render; si no se guardan snapshots de saldo en cada pago, el historico se puede romper al cambiar reglas de calculo.
4. Los IDs locales (`Math.max + 1`) no son seguros para concurrencia real ni multiples usuarios.
5. En BANCO, ahora hay productos mensuales (prestamo/seguro) sin folio ni fuente, con pagos por mes en estado local; falta persistencia relacional y transaccional.
6. En Gestion Personal, se requiere guardar fechas en formato ISO (`YYYY-MM-DD`) para evitar desfases por zona horaria en UI.

## Estructura propuesta

- Tabla `clients`: clientes de area `vales` o `banco`.
- Tabla `loans`: prestamos ligados a cliente; soporta folio/fuente (Vales) y nombre de prestamo/pago mensual (Banco).
- Tabla `loan_payments`: historial con snapshot monetario (`previous_balance`, `amount_paid`, `new_balance`).
- Tabla `personal_services`: servicios personales con periodicidad y fecha de ultimo pago.
- Tabla `loan_source_settings`: configuracion por fuente.
- Tabla `loan_rate_tables`: tabulador por fuente/monto/plazo.
- Tabla `app_user_settings`: configuracion operativa del usuario para recordatorios.

Campos clave agregados en `loans` para alinear UI actual:

1. `product_type` (`loan|insurance`) para distinguir productos de Banco.
2. `payment_periodicity` (`quincenal` o `mensual`).
3. `term_months` y `monthly_payment_amount` para calendario mensual.
4. Constraint `loans_area_consistency` para validar coherencia por `area`.
5. En `banco`: `folio` y `source_code` deben ir `null`; en `vales`: `folio` y `source_code` son obligatorios.

Campos clave en `clients` para alinear UI actual:

1. `address`: domicilio de casa.
2. `work_address`: domicilio de trabajo (opcional).
3. Datos editables desde UI con `update_client_profile`.

Campos clave en `app_user_settings`:

1. `upcoming_window_days`.
2. `grace_days`.

Campos clave en `personal_services`:

1. `name`, `amount`.
2. `frequency` (`monthly|bimonthly|quarterly|custom`).
3. `frequency_days` (obligatorio si `frequency='custom'`).
4. `due_day` (1..31).
5. `last_payment_date` (tipo `date`, formato ISO).

## Criterio Vales + Banco

Para este proyecto se recomienda modelo compartido:

1. Un solo catalogo de clientes (`clients`) para ambos apartados.
2. Separacion por tipo en `loans.area` (`vales` o `banco`).
3. `loan_payments` ligado a `loans` sin duplicar tablas por modulo.
4. Para Banco, usar `product_type`, `term_months`, `monthly_payment_amount` y periodicidad mensual; no depende de folio/fuente.

Con esto puedes operar cada apartado por separado en UI, pero sin duplicar personas ni perder trazabilidad completa.

## Script SQL (DDL + RLS)

Ejecuta este archivo en Supabase SQL Editor cuando se autorice la fase de migracion:

- `supabase/schema.sql`

## Configuracion de cliente Supabase

Archivo generado:

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

Archivo de servicio generado:

- `src/services/valesSupabaseService.js`

Funciones incluidas:

1. `createValesClient`
2. `createValesLoan`
3. `registerNextQuincenaPayment`
4. `updateLoanCreatedAt`
5. `updatePaymentDate`
6. `updateClientProfile` (recomendado para editar telefono/domicilios)

Nota de runtime actual:

1. En UI se usan imports dinamicos para evitar romper la carga inicial cuando faltan variables de entorno.
2. La pantalla no debe quedar en blanco por ausencia de `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

Funcion SQL disponible para edicion de cliente:

```sql
select * from public.update_client_profile(
  p_client_id := 'UUID_DEL_CLIENTE',
  p_name := 'Nombre Cliente',
  p_phone := '4421234567',
  p_address := 'Calle Casa 123',
  p_work_address := 'Parque Industrial 45'
);
```

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
5. Politicas por `owner_id = auth.uid()` para `app_user_settings` y `personal_services`.

## Recomendacion operativa

Para evitar carreras de concurrencia (dos dispositivos registrando pago al mismo tiempo), en la etapa final conviene mover `registerNextQuincenaPayment` a una funcion `RPC` transaccional en PostgreSQL.

## Cambios de tabulacion en Supabase (produccion)

Si ya tienes el proyecto en Supabase, puedes cambiar pagos por quincena sin romper prestamos ya creados.

Regla clave:

1. Los prestamos existentes conservan su `base_payment_amount` guardado al momento de crearse.
2. La tabulacion nueva aplica para prestamos nuevos.

### Paso 0: aplicar funciones nuevas

Ejecuta el archivo `supabase/schema.sql` actualizado en SQL Editor para asegurar que existan:

1. `public.update_rate_for_new_loans(...)`
2. `public.get_loan_rate_change_history(...)`
3. `public.verify_rate_change_effect(...)`

### Paso 1: ejecutar cambio de tabulacion

```sql
select public.update_rate_for_new_loans(
  'valefectivo',
  2000,
  14,
  250,
  'Ajuste abril 2026'
);
```

### Paso 2: revisar historial de cambios

```sql
select *
from public.get_loan_rate_change_history('valefectivo', 2000, 14, 50);
```

### Paso 3: verificar efecto real del cambio

```sql
select *
from public.verify_rate_change_effect('valefectivo', 2000, 14);
```

Lectura esperada:

1. `current_table_base_payment` debe mostrar el nuevo valor.
2. `loans_created_before_last_change_with_old_payment` debe mantenerse con el pago anterior.
3. `loans_created_after_last_change_with_new_payment` debe crecer conforme se creen prestamos nuevos.

### Consulta directa de auditoria (opcional)

```sql
select
  source_code,
  amount,
  term_quincenas,
  old_base_payment,
  new_base_payment,
  affected_active_loans,
  reason,
  changed_at
from public.loan_rate_change_log
where changed_by = auth.uid()
order by changed_at desc;
```

## Checklist antes de ejecutar migracion

1. Confirmar que no habra cambios mayores en la logica de quincenas.
2. Confirmar estructura final de cliente, prestamo y pago (incluyendo Banco mensual por tabla, Gestion Personal con fecha ISO y `work_address` en cliente).
3. Validar UI para registro, edicion de fechas y estado completed.
4. Ejecutar `supabase/schema.sql` en proyecto de prueba.
5. Probar flujo completo end-to-end y luego mover a produccion.
