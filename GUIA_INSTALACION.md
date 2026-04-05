# GUIA DE INSTALACION - Sistema de Vales y Prestamos

## Paso 1: Instalar Node.js

El proyecto requiere Node.js para funcionar. Si aun no lo tienes, sigue estos pasos.

### Windows

1. Abre tu navegador y ve a <https://nodejs.org/>.
2. Descarga la version LTS (Recommended For Most Users).
3. Abre el instalador descargado.
4. Sigue los pasos del instalador con las opciones por defecto.
5. Reinicia tu computadora despues de instalar.
6. Abre Windows PowerShell o CMD y verifica:

```bash
node --version
npm --version
```

Debes ver numeros de version en ambos comandos.

## Paso 2: Preparar el proyecto

1. Abre PowerShell o CMD en tu computadora.
2. Navega a la carpeta del proyecto:

```bash
cd h:\vales
```

1. Verifica que ves los archivos del proyecto:

```bash
dir
```

Debes ver `package.json`, `vite.config.js`, `src`, etc.

## Paso 3: Instalar dependencias

Ejecuta este comando en la terminal:

```bash
npm install
```

Que esta sucediendo:

- npm descargara e instalara todas las librerias necesarias.
- Esto puede tomar 2-5 minutos segun tu velocidad de internet.
- Se creara una carpeta llamada `node_modules` (puedes ignorarla).
- Veras lineas de descarga mientras progresa.

Ejemplo esperado al final:

```text
added 150 packages in 2m
```

## Paso 4: Ejecutar la aplicacion

Una vez terminada la instalacion, ejecuta:

```bash
npm run dev
```

Que sucede ahora:

1. Se iniciara el servidor de desarrollo.
2. Veras mensajes similares a:

```text
> vite

  VITE v5.0.8  ready in 345 ms

  Local:   http://localhost:5173/
```

1. Tu navegador se abrira automaticamente mostrando la aplicacion.

## Paso 5: Usa la aplicacion

Ya con la aplicacion ejecutandose, puedes:

- Buscar clientes usando el campo de busqueda en la seccion Vales.
- Agregar cliente con nombre, telefono, domicilio de casa y domicilio de trabajo opcional.
- Editar cliente para actualizar telefono y domicilios.
- Ver prestamos al seleccionar un cliente de la lista.
- Registrar pagos con confirmacion.
- Usar Banco:
  - Alta de cliente nuevo por defecto o usar cliente existente de Vales.
  - Crear prestamo sin folio/fuente (monto y plazo en meses).
  - Crear seguro por monto total y plazo en meses.
  - Registrar pagos desde tabla mensual (Mes 1..N).
- Usar Gestion Personal:
  - Crear servicios con periodicidad configurable.
  - Registrar pago por fecha y editar monto cuando varia el recibo.
  - Revisar estado visual de proximo pago (al corriente/proximo/vencido).
- Usar Configuracion:
  - Revisar Centro de Recordatorios (vencidos/hoy/proximos).

## Paso 6: Detener la aplicacion

Cuando termines de trabajar, en la terminal presiona:

```text
CTRL + C
```

Esto detendra el servidor de desarrollo.

## Solucion de problemas

### "npm: El termino 'npm' no se reconoce"

- Solucion: Node.js no esta instalado correctamente o la computadora no fue reiniciada.
- Reinstala Node.js y asegurate de reiniciar.
- Usa una nueva ventana de PowerShell o CMD despues de instalar.

### "node_modules not found" al ejecutar npm run dev

- Solucion: No completaste el paso `npm install`.
- Ejecuta nuevamente `npm install`.

### El navegador no se abre automaticamente

- Solucion: Abre manualmente `http://localhost:5173/` en tu navegador.

### Errores de puerto (puerto 5173 en uso)

- Solucion: Otro programa esta usando ese puerto.
- Cambia el puerto en `vite.config.js`:

```javascript
server: {
  port: 5174,
  open: true
}
```

### El proyecto se ve lento o con errores

- Solucion: Limpia el cache de npm.

```bash
npm cache clean --force
```

- Elimina la carpeta `node_modules`:

```bash
rmdir /s /q node_modules
```

- Reinstala:

```bash
npm install
```

## Dependencias instaladas

El proyecto utiliza estas librerias (se instalan automaticamente):

| Libreria         | Proposito                         |
| ---------------- | --------------------------------- |
| **react**        | Framework para crear interfaces   |
| **react-dom**    | Renderizar React en el navegador  |
| **vite**         | Herramienta de compilacion rapida |
| **tailwindcss**  | Estilos CSS modernos              |
| **lucide-react** | Iconos vectoriales                |
| **postcss**      | Procesador de CSS                 |

## Comandos utiles

```bash
# Inicia el servidor
npm run dev

# Prepara para produccion (crea carpeta dist)
npm run build

# Ve como se veria en produccion
npm run preview

# Limpia el cache
npm cache clean --force
```

## Checklist de verificacion

- [ ] Node.js instalado (`node --version` funciona).
- [ ] npm instalado (`npm --version` funciona).
- [ ] Navegaste a `h:\vales` en la terminal.
- [ ] Ejecutaste `npm install` (se completo sin errores).
- [ ] Ejecutaste `npm run dev` (el navegador se abrio).
- [ ] Ves la aplicacion en `http://localhost:5173/`.

---

## Siguiente paso

Una vez que tengas la aplicacion ejecutandose:

1. Agrega un cliente (nombre, telefono, domicilio de casa y domicilio de trabajo opcional).
2. Edita el cliente para validar cambios de telefono o domicilio.
3. Crea un prestamo en Banco sin folio y sin fuente.
4. Registra pago desde la tabla mensual (con boton Registrar).
5. Verifica estado de cuenta y actualizacion de pagado/restante.
6. En Gestion Personal, registra pago y confirma que Proxima Fecha avance al siguiente ciclo.

Nota: actualmente la app funciona en modo local para pruebas y ya tiene persistencia parcial opcional a Supabase en clientes (Vales/Banco).

## Documentacion complementaria

1. Especificacion funcional y arquitectura: `docs/especificacion-proyecto.md`.
2. Plan de migracion y esquema SQL: `docs/base-datos-supabase.md`.
3. Para cambiar tabulaciones en Supabase sin afectar prestamos existentes, revisa la seccion "Cambios de tabulacion en Supabase (produccion)" en `docs/base-datos-supabase.md`.
