# Sistema Administrativo de Vales y Prestamos

Aplicacion web para gestionar clientes, prestamos y pagos en dos modulos: Vales (quincenal) y Banco (mensual).
Construida con React + Vite + Tailwind CSS.

## Caracteristicas actuales

- Gestion de clientes en modulo Vales (nombre, telefono, domicilio de casa y domicilio de trabajo opcional).
- Alta de prestamos por fuente con folio unico.
- Tabuladores por fuente y calculo de pago por quincena.
- Registro de pago individual con monto fijo por quincena (boton Registrar).
- Confirmacion modal antes de registrar cada pago.
- Edicion de fecha de pago y fecha de creacion del prestamo.
- Estado de cuenta con columnas:
  - Fecha de pago
  - Num. de pago
  - Saldo anterior
  - Importe de pago
  - Nuevo saldo
- Resumen por fuente y total general.
- Modulo Banco con:
  - Cliente nuevo por defecto o seleccion de cliente existente de Vales.
  - Seguros y Prestamos como productos mensuales independientes de Vales.
  - Prestamos sin folio ni fuente, con monto total + plazo en meses.
  - Calculo automatico de pago mensual (`monto / meses`) y tabla de pagos por mes.
  - Registro de pago por mes con boton Registrar y estado pendiente/pagado.
- Modulo Gestion Personal con:
  - Servicios por periodicidad (mensual, bimestral, trimestral o personalizada).
  - Registro de pago por fecha y edicion de monto cuando el recibo varia.
  - Estado visual en Proxima Fecha: `Al corriente`, `Proximo`, `Vencido`.
- Modulo Configuracion con:
  - Centro de recordatorios (vencidos, para hoy y proximos) usando servicios personales.

## Regla de quincena usada (Vales)

El proyecto usa una regla unica:

- `currentPayment` = cantidad de pagos ya registrados.
- Proxima quincena a pagar = `currentPayment + 1`.
- Prestamo completado cuando `currentPayment >= totalPayments`.

## Instalacion

### Requisitos

- Node.js 16+
- npm

### Pasos

1. Entrar al proyecto:

```bash
cd h:\vales
```

1. Instalar dependencias:

```bash
npm install
```

1. Ejecutar en desarrollo:

```bash
npm run dev
```

Abrir en `http://localhost:5173/`.

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:watch
```

## Estructura principal

```text
vales/
├── src/
│   ├── components/
│   ├── constants/
│   ├── context/
│   ├── domain/
│   ├── pages/
│   ├── services/
│   └── lib/
├── docs/
├── supabase/
└── README.md
```

Notas de estructura:

1. `src/domain/vales` centraliza calculos y reglas de negocio de prestamos.
2. `src/services/vales` y `src/services/banco` separan integraciones por modulo.

## Estado de datos

- Actualmente el proyecto sigue trabajando con estado local.
- Los cambios se pierden al recargar.
- Ya existe preparacion para migracion a Supabase (documentada), pero no esta activa en runtime.

## Flujo actual Banco

1. Alta de cliente: modo principal crear cliente nuevo.
1. Alta de cliente (alterno): usar cliente existente de Vales con autocompletado de nombre, telefono, domicilio de casa y domicilio de trabajo.
1. Alta de prestamo: monto y plazo en meses (sin folio y sin fuente).
1. Alta de seguro: monto total y plazo en meses.
1. Registro de pago mensual por tabla (Mes 1..N) con boton Registrar.
1. Actualizacion automatica de pagado/restante y estado del producto.

## Flujo actual Gestion Personal

1. Alta de servicio con periodicidad y dia de pago.
1. Registro de pago con fecha exacta (sin desfase de dia por zona horaria).
1. Edicion de monto para servicios variables (ej. luz/internet).
1. Proxima Fecha se recalcula desde el ultimo pago y muestra estado visual:
  - `Al corriente` (verde)
  - `Proximo` (amarillo)
  - `Vencido` (rojo)

## Modelo recomendado (Vales + Banco)

Se usa un modelo compartido:

1. Un solo catalogo de clientes.
2. Prestamos separados por tipo de modulo (`vales` o `banco`).
3. Pagos siempre ligados a su prestamo.
4. Servicios personales en tabla separada (`personal_services`) para conservar periodicidad y fechas ISO.

```mermaid
erDiagram
  CLIENTS ||--o{ LOANS : has
  LOANS ||--o{ LOAN_PAYMENTS : has

  CLIENTS {
    uuid id PK
    text name
    text phone
    text address
  }

  LOANS {
    uuid id PK
    uuid client_id FK
    enum area
    text folio
    text loan_name
    numeric final_payment_amount
    int current_payment_index
    int total_payments
    text periodicity
  }

  LOAN_PAYMENTS {
    uuid id PK
    uuid loan_id FK
    int payment_number
    timestamptz payment_date
    numeric amount_paid
  }
```

Documentos relacionados:

- `docs/base-datos-supabase.md`
- `docs/especificacion-proyecto.md`

## Configuracion operativa

La seccion Configuracion esta orientada a operacion diaria (no tecnica):

1. Centro de recordatorios para servicios personales en riesgo.
2. Ajustes de ventana y gracia de recordatorios:
  - `upcomingWindowDays`
  - `graceDays`

Nota: estos ajustes se guardan actualmente en `localStorage` (clave `vales_app_settings`) mientras la persistencia Supabase no esta activa.

Cambios de tabulacion en Supabase:

1. El proceso para cambiar pagos por quincena y verificar impacto (sin alterar prestamos existentes) esta en `docs/base-datos-supabase.md`, seccion "Cambios de tabulacion en Supabase (produccion)".

## Soporte rapido

Si algo falla:

1. Elimina `node_modules`.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.

## Licencia

Uso privado.
