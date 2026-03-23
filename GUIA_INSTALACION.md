# 📋 GUÍA DE INSTALACIÓN - Sistema de Vales y Préstamos

## Paso 1: Instalar Node.js (IMPORTANTE)

El proyecto requiere Node.js para funcionar. Si aún no lo tienes, sigue estos pasos:

### ✅ Windows

1. Abre tu navegador y ve a: https://nodejs.org/
2. Descarga la versión **LTS** (Recommended For Most Users)
3. Abre el instalador descargado
4. Sigue los pasos del instalador con las opciones por defecto
5. **Reinicia tu computadora** después de instalar
6. Abre **Windows PowerShell** (puedes buscar PowerShell en el menú de inicio) o **CMD** y verifica:
   ```bash
   node --version
   npm --version
   ```
   Deberías ver números de versión en ambos comandos.

## Paso 2: Preparar el Proyecto

1. Abre **PowerShell** o **CMD** en tu computadora
2. Navega a la carpeta del proyecto:
   ```bash
   cd h:\vales
   ```
3. Verifica que ves los archivos del proyecto:
   ```bash
   dir
   ```
   Deberías ver: `package.json`, `vite.config.js`, `src`, etc.

## Paso 3: Instalar Dependencias

Ejecuta este comando en la terminal:

```bash
npm install
```

**¿Qué está sucediendo?**
- npm descargará e instalará todas las librerías necesarias
- Esto puede tomar 2-5 minutos según tu velocidad de internet
- Se creará una carpeta llamada `node_modules` (puedes ignorarla)
- Verás líneas de descarga mientras progresa

Espera hasta que veas algo como:
```
added 150 packages in 2m
```

## Paso 4: Ejecutar la Aplicación

Una vez terminada la instalación, ejecuta:

```bash
npm run dev
```

**¿Qué sucede ahora?**
1. Se iniciará el servidor de desarrollo
2. Verás mensajes similares a:
   ```
   > vite

     VITE v5.0.8  ready in 345 ms

     ➜  Local:   http://localhost:5173/
   ```
3. **Tu navegador se abrirá automáticamente** mostrando la aplicación

## Paso 5: Usa la Aplicación

¡Perfecto! Ya tienes la aplicación ejecutándose. Puedes:

- **Buscar clientes**: Usa el campo de búsqueda en la sección "Vales"
- **Agregar cliente**: Haz clic en "Agregar Cliente" (completa nombre + fuentes)
- **Ver préstamos**: Selecciona un cliente de la lista
- **Registrar pagos**: Ingresa el monto y haz clic en "Registrar Pago"

## Paso 6: Detener la Aplicación

Cuando termines de trabajar, en la terminal presiona:
```
CTRL + C
```

Esto detendrá el servidor de desarrollo.

## Solución de Problemas

### ❌ "npm: El término 'npm' no se reconoce"
- **Solución**: Node.js no está instalado correctamente o la computadora no fue reiniciada
- Reinstala Node.js y asegúrate de reiniciar
- Usa una nueva ventana de PowerShell/CMD después de instalar

### ❌ "node_modules not found" al ejecutar npm run dev
- **Solución**: No completaste el paso `npm install`
- Ejecuta nuevamente: `npm install`

### ❌ El navegador no se abre automáticamente
- **Solución**: Abre manualmente: `http://localhost:5173/` en tu navegador

### ❌ Errores de puerto (Puerto 5173 en uso)
- **Solución**: Otro programa está usando ese puerto
- Cambia el puerto en `vite.config.js`:
  ```javascript
  server: {
    port: 5174,  // Cambia a otro número
    open: true
  }
  ```

### ❌ El proyecto se ve lento o con errores
- **Solución**: Limpia el cache de npm
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

## 📦 Dependencias Instaladas

El proyecto utiliza estas librerías (se instalan automáticamente):

| Librería | Propósito |
|----------|-----------|
| **react** | Framework para crear interfaces |
| **react-dom** | Renderizar React en el navegador |
| **vite** | Herramienta de compilación rápida |
| **tailwindcss** | Estilos CSS modernos |
| **lucide-react** | Iconos vectoriales |
| **postcss** | Procesador de CSS |

## 💡 Comandos Útiles

```bash
# Inicia el servidor (ya sabes esto)
npm run dev

# Prepara para producción (crea carpeta 'dist')
npm run build

# Ve cómo se vería en producción
npm run preview

# Limpia el cache
npm cache clean --force
```

## ✅ Checklist de Verificación

- [ ] Node.js instalado (`node --version` funciona)
- [ ] npm instalado (`npm --version` funciona)
- [ ] Navegaste a `h:\vales` en la terminal
- [ ] Ejecutaste `npm install` (se completó sin errores)
- [ ] Ejecutaste `npm run dev` (el navegador se abrió)
- [ ] Ves la aplicación en `http://localhost:5173/`

---

## 🎯 Siguiente Paso

Una vez que tengas la aplicación ejecutándose:

1. Prueba buscar clientes
2. Añade un nuevo cliente
3. Selecciona un cliente para ver sus préstamos
4. Intenta registrar un pago

¡Disfruta! 🚀
