# Guía de Actualización - Versión 1.0 (Login, Roles y Mejoras Visuales)

Esta guía documenta los cambios de la última actualización del sistema de gestión de licorería, detallando las modificaciones realizadas a nivel de código y base de datos, y los pasos para el despliegue en producción.

---

## 1. Novedades y Cambios en el Software

### A. Autenticación (Login por Username)
* **Antes**: Se iniciaba sesión con el correo electrónico (`ejemplo@licoreria.com`).
* **Ahora**: Se inicia sesión únicamente con el **nombre de usuario** (`username`).
* **Ejemplos de usuarios de acceso**:
  - `admin` (Administrador general)
  - `calvarez` (Cesar Alvarez)
  - `ltoncel` (Laudino Toncel)
  - `helpdesk` (Soporte)

### B. Separación de Roles (Superadministrador vs Administrador)
Para aumentar la seguridad de la información crítica del negocio, se ha dividido el acceso administrativo en dos niveles:
1. **Superadministrador**:
   * Tiene control y acceso completo a toda la aplicación, incluyendo gestión de usuarios, auditorías y configuraciones.
2. **Administrador** (Restringido):
   * Posee acceso a POS, Inventario, Compras, Ventas, Caja, etc.
   * **Tiene el acceso bloqueado (Acceso Denegado / 403)** a:
     - 👥 Gestión de Usuarios y Accesos (`/dashboard/usuarios`)
     - 📝 Reportes de Auditoría (`/dashboard/auditoria`)
     - ⚙️ Configuración del Sistema (`/dashboard/configuracion`)

### C. Analíticas e Interactividad de Gráficos (Drilldown)
* Ahora los cuatro gráficos del Dashboard de Inicio son interactivos.
* Al hacer clic en un sector o barra, se despliega un **modal con el desglose a nivel de base de datos** (ej: ver qué productos componen las ventas de una categoría, o qué facturas se cobraron con un método de pago específico).

### D. Optimización de Layout e Interfaces
* **Inventario**: Se simplificó la barra superior eliminando etiquetas de filtros repetitivas, implementando placeholders autodescriptivos en los selects (`Categoría: Todas`, `Marca: Todas`, etc.) y fijando el botón de nuevo producto (`flex-shrink: 0`) para evitar que se desborde o se recorte.
* **Devoluciones / Ventas**: Se unificaron las acciones con la barra de búsqueda y botones alineados en una sola fila.

---

## 2. Cambios en la Base de Datos

1. **Tabla `Usuario`**:
   * Se modificó para registrar el campo `username` en lugar de `email` y marcarlo como `@unique`.
2. **Tabla `Rol`**:
   * Se actualizaron los registros para crear el rol de `Superadministrador`.
   * Se asignaron los accesos de auditoría, configuración y usuarios a `false` en el rol de `Administrador`.
3. **Migración de Usuarios Existentes**:
   * Se migraron las cuentas principales de administración (`admin` y `calvarez`) directamente al rol de `Superadministrador` para garantizar el acceso ininterrumpido.

---

## 3. Instrucciones de Actualización (Despliegue en Producción)

Para implementar esta actualización en la máquina de producción, siga estos comandos en la terminal de la máquina dentro de la carpeta del proyecto:

### Paso 1: Descargar el Código Actualizado
```bash
git pull origin 1.0
```

### Paso 2: Actualizar Estructura de la Base de Datos y Semilla
Ejecute la migración y la semilla de Prisma para sincronizar la base de datos (se actualizarán los roles y nombres de usuario automáticamente):
```bash
npx prisma db push
npx prisma db seed
```

### Paso 3: Recompilar la Aplicación
Compilar Next.js en producción para guardar en caché los nuevos archivos y componentes optimizados:
```bash
npm run build
```

### Paso 4: Reiniciar el Servidor
Si está usando `pm2` u otro gestor de procesos:
```bash
pm2 restart all
```
O simplemente detenga el proceso actual e inicie de nuevo:
```bash
npm start
```
