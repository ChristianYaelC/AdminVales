# INICIO RAPIDO - 3 PASOS

## Paso 1: Instalar Node.js

1. Ve a <https://nodejs.org/>
2. Descarga la version LTS
3. Instala con los valores por defecto
4. Reinicia la computadora
5. Verifica en PowerShell/CMD:

```bash
node --version
npm --version
```

## Paso 2: Instalar dependencias

En `h:\vales` ejecuta:

```bash
npm install
```

## Paso 3: Ejecutar la aplicacion

```bash
npm run dev
```

Abre `http://localhost:5173/`.

---

## Lo mas importante que ya incluye

- Modulo Vales con clientes y prestamos por fuente.
- Edicion de cliente en Vales y Banco para actualizar telefono y domicilios.
- Registro de pago por boton (monto fijo por quincena).
- Confirmacion antes de registrar pago.
- Estado de cuenta con saldo anterior / nuevo saldo.
- Edicion de fecha de pago y fecha de creacion.
- Modulo Banco con seguros y prestamos mensuales (sin folio/fuente para prestamos).
- Tabla mensual de pagos por producto en Banco.
- Modulo Gestion Personal con registro de pago, edicion de monto y estado visual de proximo pago.
- Alta de cliente en Banco con opcion de usar cliente existente de Vales.
- Alta de cliente con domicilio de casa y domicilio de trabajo opcional.
- Modulo Configuracion con centro de recordatorios.

---

## Tecnologias

- React 18
- Vite 5
- Tailwind CSS 3
- Lucide React

---

## Si algo falla

1. Reinstala dependencias con `npm install`.
2. Vuelve a correr `npm run dev`.
3. Consulta `GUIA_INSTALACION.md`.

Nota de datos actual:

1. La app funciona sin Supabase en modo local.
2. Si configuras variables Supabase, clientes en Vales/Banco ya pueden persistir (alta/edicion/eliminacion).

## Documentacion recomendada

1. Arquitectura y reglas: `docs/especificacion-proyecto.md`.
2. Base de datos y migracion: `docs/base-datos-supabase.md`.
3. Cambio de tabulacion en Supabase y verificacion post-cambio: ver seccion "Cambios de tabulacion en Supabase (produccion)" en `docs/base-datos-supabase.md`.

<!-- AUTO_SYNC_BLOCK:START -->
## Resumen Auto-Sync

Este bloque se actualiza automaticamente desde PROJECT_CONTEXT.md.

### NPM Scripts

- build: `vite build`
- context:update: `node scripts/sync-source-docs.mjs`
- context:watch: `node scripts/watch-project-context.mjs`
- dev: `vite`
- preview: `vite preview`
- test: `vitest run`
- test:watch: `vitest`

### Important Files Check

- README.md: present
- GUIA_INSTALACION.md: present
- INICIO_RAPIDO.md: present
- docs/especificacion-proyecto.md: present
- docs/base-datos-supabase.md: present
- supabase/schema.sql: present
- src/main.jsx: present
- src/App.jsx: present
- src/pages/ValesPage.jsx: present
- src/pages/BancoPage.jsx: present
- src/pages/ConfiguracionPage.jsx: present
- src/context/ClientsContext.jsx: present
- src/domain/personal/paymentDates.js: present
- package.json: present
- vite.config.js: present
- tailwind.config.js: present

### File Tree Snapshot

- docs/
  - base-datos-supabase.md
  - especificacion-proyecto.md
- scripts/
  - sync-source-docs.mjs
  - update-project-context.mjs
  - watch-project-context.mjs
- src/
  - components/
    - BancoClientForm.jsx
    - BancoInsuranceForm.jsx
    - BancoInsuranceTable.jsx
    - BancoLoanForm.jsx
    - ClientEditModal.jsx
    - ClientForm.jsx
    - ConfirmModal.jsx
    - LoanForm.jsx
    - LoansTable.jsx
    - PersonalServiceForm.jsx
    - PersonalServiceTable.jsx
    - Sidebar.jsx
  - constants/
    - tablesData.js
  - context/
    - ClientsContext.jsx
  - domain/
    - personal/
      - paymentDates.js
      - paymentDates.test.js
    - vales/
      - loanCalculations.js
      - loanCalculations.test.js
  - lib/
    - supabaseClient.js
  - pages/
    - BancoPage.jsx
    - ConfiguracionPage.jsx
    - PersonalPage.jsx
    - ValesPage.jsx
  - services/
    - banco/
      - index.js
    - vales/
      - index.js
    - valesSupabaseService.js
  - utils/
    - validators.js
  - App.jsx
  - index.css
  - main.jsx
- supabase/
  - schema.sql
- .gitignore
- GUIA_INSTALACION.md
- index.html
- INICIO_RAPIDO.md
- package-lock.json
- package.json
- postcss.config.js
- PROJECT_CONTEXT.md
- README.md
- tailwind.config.js
- vite.config.js

### SQL Snapshot (supabase/schema.sql)

- Tables:
  - app_user_settings
  - clients
  - loan_payments
  - loan_rate_change_log
  - loan_rate_tables
  - loan_source_settings
  - loans
  - personal_services
- Types:
  - app_area
  - insurance_mode
  - loan_product_type
  - loan_source_code
  - loan_status
  - payment_periodicity
- Functions:
  - get_loan_rate_change_history
  - save_app_user_settings
  - set_updated_at
  - sync_loan_owner_id
  - sync_payment_owner_id
  - update_client_profile
  - update_rate_for_new_loans
  - verify_rate_change_effect
<!-- AUTO_SYNC_BLOCK:END -->
