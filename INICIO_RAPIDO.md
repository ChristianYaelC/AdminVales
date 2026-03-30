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
- Registro de pago por boton (monto fijo por quincena).
- Confirmacion antes de registrar pago.
- Estado de cuenta con saldo anterior / nuevo saldo.
- Edicion de fecha de pago y fecha de creacion.
- Modulo Banco con prestamos por nombre y pagos mensuales manuales.
- Alta de cliente en Banco con opcion de usar cliente existente de Vales.

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

## Documentacion recomendada

1. Arquitectura y reglas: `docs/especificacion-proyecto.md`.
2. Base de datos y migracion: `docs/base-datos-supabase.md`.
3. Cambio de tabulacion en Supabase y verificacion post-cambio: ver seccion "Cambios de tabulacion en Supabase (produccion)" en `docs/base-datos-supabase.md`.
