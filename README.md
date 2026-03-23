# 📊 Sistema Administrativo de Vales y Préstamos

Aplicación web moderna para gestionar vales, préstamos y operaciones bancarias. Construida con React, Vite y Tailwind CSS.

## ✨ Características

- **Gestión de Clientes**: Busca rápidamente entre clientes registrados
- **Agregar Clientes**: Crear nuevos clientes con sus fuentes de cobro
- **Tabla de Préstamos**: Visualiza préstamos activos con sus detalles
- **Cálculo Automático**: El sistema calcula automáticamente el nuevo saldo
- **Registro de Pagos**: Registra pagos y avanza en las quincenas del préstamo
- **Plazos Flexibles**: Soporta préstamos de 6, 8, 10, 12 o 14 quincenas
- **Interfaz Responsiva**: Diseño mobile-first que se adapta a cualquier dispositivo
- **Estilos Modernos**: Tabla con líneas alternas (zebra striping) y diseño profesional

## 🚀 Instalación Rápida

### Requisitos Previos

- **Node.js** (versión 16.0.0 o superior)
- **npm** o **yarn**

Para verificar si tienes Node.js instalado, abre tu terminal y ejecuta:

```bash
node --version
npm --version
```

Si no lo tienes, descárgalo desde: https://nodejs.org/

### Pasos de Instalación

1. **Navega a la carpeta del proyecto**:
   ```bash
   cd h:\vales
   ```

2. **Instala todas las dependencias**:
   ```bash
   npm install
   ```

   *Este comando descargará e instalará:*
   - React y React DOM
   - Vite (herramienta de compilación)
   - Tailwind CSS (framework de estilos)
   - Lucide React (iconos)
   - PostCSS y Autoprefixer

3. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

   La aplicación se abrirá automáticamente en: `http://localhost:5173`

## 📦 Estructura de Carpetas

```
vales/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Barra lateral de navegación
│   │   ├── LoansTable.jsx       # Tabla de préstamos con cálculos
│   │   └── ClientForm.jsx       # Formulario para agregar clientes
│   ├── pages/
│   │   ├── ValesPage.jsx        # Página principal de vales
│   │   ├── BancoPage.jsx        # Página de operaciones bancarias
│   │   └── ConfiguracionPage.jsx # Página de configuración
│   ├── App.jsx                  # Componente principal
│   ├── main.jsx                 # Punto de entrada
│   └── index.css                # Estilos globales
├── index.html                   # HTML principal
├── package.json                 # Dependencias del proyecto
├── vite.config.js              # Configuración de Vite
├── tailwind.config.js          # Configuración de Tailwind CSS
└── postcss.config.js           # Configuración de PostCSS
```

## 🎯 Cómo Usar

### 1. **Visualizar Clientes**
   - En la sección "Vales", verás una lista de clientes en el panel izquierdo
   - Usa el buscador para filtrar clientes por nombre

### 2. **Agregar un Nuevo Cliente**
   - Haz clic en el botón "Agregar Cliente"
   - Completa el nombre del cliente
   - Selecciona sus fuentes de cobro (mínimo una)
   - Haz clic en "Crear Cliente"

### 3. **Ver Préstamos**
   - Selecciona un cliente de la lista
   - Verás sus préstamos activos en el panel derecho
   - Se muestra:
     - **Folio**: Identificador único del préstamo
     - **Número de Pago**: Ej. "11 de 12" (pago actual / total)
     - **Saldo Anterior**: Monto pendiente de cobrar
     - **Importe de Pago**: Campo donde ingresas manualmente el monto a cobrar
     - **Nuevo Saldo**: Se calcula automáticamente (Saldo Anterior - Importe de Pago)

### 4. **Registrar un Pago**
   - Ingresa el monto en el campo "Importe de Pago"
   - El "Nuevo Saldo" se calcula automáticamente
   - Haz clic en "Registrar Pago"
   - El sistema:
     - Actualiza el saldo
     - Avanza al siguiente número de pago
     - Limpia el campo de entrada

### 5. **Totales**
   - La fila "TOTALES" suma automáticamente:
     - Saldo Anterior
     - Importe de Pago
     - Nuevo Saldo
   - Se actualiza en tiempo real mientras escribes

## 🛠️ Comandos Disponibles

```bash
# Inicia el servidor de desarrollo
npm run dev

# Construye la aplicación para producción
npm run build

# Vista previa de la compilación de producción
npm run preview
```

## 🎨 Personalización

### Cambiar Colores
Edita `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#1f2937',
      secondary: '#3b82f6',
      // Añade tus colores aquí
    }
  },
}
```

### Agregar Nuevas Secciones
Cada sección es un componente en `src/pages/`. Para crear una nueva:

1. Crea un archivo en `src/pages/NuevaPage.jsx`
2. Añade el elemento en el menú dentro de `src/components/Sidebar.jsx`
3. Importa y añade el caso en `src/App.jsx`

## 📝 Mock Data

El proyecto incluye datos de ejemplo con:
- 2 clientes: Juan García López y María Rodríguez
- 1 préstamo de ejemplo por cliente
- Plazos de 10 y 12 quincenas

Puedes modificar estos datos en `src/pages/ValesPage.jsx` en el estado inicial.

## 🔒 Notas Importantes

- El proyecto actualmente usa estado local (React Hooks)
- No hay persistencia a base de datos (los datos se pierden al recargar)
- Para producción, conecta una API backend

## 🤝 Soporte

Si tienes dudas o problemas:
1. Verifica que Node.js esté instalado correctamente
2. Elimina `node_modules` y ejecuta `npm install` nuevamente
3. Limpia el cache: `npm cache clean --force`

## 📄 Licencia

Este proyecto es de uso privado.

---

**Versión**: 1.0.0  
**Última actualización**: 2024
