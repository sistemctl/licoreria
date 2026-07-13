# 🥃 Sistema de Gestión y Punto de Venta (POS) para Licorería

Este proyecto es una aplicación web moderna y completa para la gestión integral de una licorería, construida sobre **Next.js** (App Router), **Prisma ORM**, **PostgreSQL** y **NextAuth.js**. Incluye control de inventario, punto de venta (POS) optimizado con soporte para lectores de códigos de barras, gestión de clientes y créditos (fiados), control de turnos de caja, reportes gráficos con Chart.js, y un módulo de auditoría de seguridad.

---

## 🛠️ Stack Tecnológico
* **Frontend/Backend:** Next.js 16+ (App Router, API Routes)
* **Diseño Visual:** CSS Puro (Variables + Glassmorphism Premium en Claro/Blanco)
* **Base de Datos:** PostgreSQL 15+
* **ORM:** Prisma ORM (Relaciones y transacciones seguras)
* **Autenticación:** NextAuth.js + bcryptjs
* **Reportes y Gráficos:** Chart.js + react-chartjs-2
* **Documentación en PDF:** jsPDF + html2canvas
* **Códigos de Barras:** JsBarcode + hook lector por teclado (<50ms)

---

## 💾 Configuración de la Base de Datos (PostgreSQL)

El sistema requiere una base de datos PostgreSQL activa. 

1. **Crear Base de Datos:**
   Crea una base de datos vacía llamada `licoreria_db` (o el nombre que prefieras) en tu servidor PostgreSQL:
   ```sql
   CREATE DATABASE licoreria_db;
   ```

2. **Archivo `.env`:**
   En la raíz del proyecto, crea o edita el archivo `.env` configurando la cadena de conexión de PostgreSQL y la clave de NextAuth:
   ```env
   DATABASE_URL="postgresql://USUARIO:PASSWORD@LOCALHOST:PUERTO/licoreria_db?schema=public"
   NEXTAUTH_SECRET="un_secreto_aleatorio_muy_largo_y_seguro"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   * *Nota para contraseñas con caracteres especiales:* Si tu contraseña contiene caracteres como `@`, `:`, `/`, o `*`, debes codificarlos en formato URL (por ejemplo, `@` es `%40`, `*` es `%2A`, `+` es `%2B`).

---

## 💻 Guía de Instalación en Windows

### Requisitos Previos:
* [Node.js (v18.x o superior)](https://nodejs.org/)
* [PostgreSQL](https://www.postgresql.org/download/windows/)

### Pasos de Instalación:
1. **Clonar el proyecto e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar las variables de entorno:**
   Crea el archivo `.env` en la raíz como se detalló en la sección anterior.

3. **Ejecutar migraciones y semilla de base de datos:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   *(Esto creará las 22 tablas requeridas e insertará los roles por defecto y el usuario administrador: `admin@licoreria.com` / `admin123`)*

4. **Ejecutar en modo Desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Compilar y ejecutar en Producción:**
   ```bash
   npm run build
   # Para arrancar el servidor compilado:
   npm run start
   ```

---

## 🐧 Guía de Instalación y Despliegue en Linux (Ubuntu/Debian)

### Requisitos Previos:
Actualiza los repositorios e instala Node.js, PostgreSQL, Nginx y Git:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget postgresql postgresql-contrib nginx
```
Instala Node.js (versión LTS) mediante NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1. Configurar PostgreSQL en Linux
Entra al prompt de PostgreSQL para configurar la contraseña del usuario `postgres` y crear la base de datos:
```bash
sudo -i -u postgres psql
```
Ejecuta las siguientes consultas en la consola de PostgreSQL:
```sql
ALTER USER postgres WITH PASSWORD 'TuContrasenaSegura';
CREATE DATABASE licoreria_db;
\q
```

Asegúrate de que PostgreSQL esté configurado para permitir conexiones por contraseña (MD5/scram-sha-256). Si accedes desde localhost, por defecto estará bien. Puedes iniciar y habilitar el servicio:
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2. Configurar la Aplicación
1. Clona el proyecto y ve a la carpeta:
   ```bash
   cd /var/www/sistema-de-licoreria
   npm install
   ```
2. Configura el archivo `.env`:
   ```bash
   nano .env
   ```
   Agrega la configuración correspondiente:
   ```env
   DATABASE_URL="postgresql://postgres:TuContrasenaSegura@localhost:5432/licoreria_db"
   NEXTAUTH_SECRET="un_secreto_super_seguro_de_32_caracteres"
   NEXTAUTH_URL="http://localhost:3000"
   ```
3. Ejecuta las migraciones de base de datos y la semilla inicial:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

### 3. Configurar PM2 para Ejecutar en Segundo Plano
Instala PM2 de forma global para administrar el proceso de Next.js:
```bash
sudo npm install -y pm2 -g
```
Compila la aplicación e iníciala con PM2:
```bash
npm run build
pm2 start npm --name "licoreria-pos" -- start
```
Configura PM2 para que se ejecute automáticamente tras un reinicio del servidor Linux:
```bash
pm2 startup systemd
pm2 save
```

### 4. Configurar Nginx como Proxy Inverso (Opcional, recomendado)
Crea una configuración para tu sitio web en Nginx:
```bash
sudo nano /etc/nginx/sites-available/licoreria
```
Pega la siguiente configuración (reemplaza `tu-dominio.com` o usa la IP de tu servidor):
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Activa la configuración y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/licoreria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🐳 Despliegue con Docker (Recomendado)

La forma más rápida de levantar el sistema completo (aplicación + PostgreSQL) es con Docker Compose.

### Requisitos Previos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) o Docker Engine + Docker Compose (Linux)

### Inicio Rápido

1. **Clonar la rama `1.0` e ir al proyecto:**
   ```bash
   git clone -b 1.0 https://github.com/sistemctl/licoreria.git
   cd licoreria
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y cambia al menos `NEXTAUTH_SECRET` por un valor aleatorio seguro (32+ caracteres).

3. **Primera instalación (con datos iniciales):**
   ```bash
   docker compose up --build -d
   ```
   En la primera ejecución, deja `RUN_SEED=true` en `.env` para crear roles y el usuario administrador.

4. **Acceder a la aplicación:**
   Abre [http://localhost:3000](http://localhost:3000) (o el puerto definido en `APP_PORT`).

### Comandos Útiles

```bash
# Ver logs en tiempo real
docker compose logs -f app

# Detener servicios
docker compose down

# Detener y eliminar la base de datos (¡borra todos los datos!)
docker compose down -v

# Reconstruir tras cambios en el código
docker compose up --build -d
```

### Variables de Entorno (Docker)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `licoreria` |
| `NEXTAUTH_SECRET` | Secreto para sesiones NextAuth | *(obligatorio cambiar)* |
| `NEXTAUTH_URL` | URL pública de la app | `http://localhost:3000` |
| `APP_PORT` | Puerto expuesto en el host | `3000` |
| `RUN_SEED` | Ejecutar seed al iniciar (`true`/`false`) | `false` |

### Notas para Producción

* Cambia `NEXTAUTH_SECRET` y `POSTGRES_PASSWORD` por valores fuertes y únicos.
* Ajusta `NEXTAUTH_URL` a la URL real de tu servidor (ej. `https://pos.tudominio.com`).
* Tras la primera instalación, pon `RUN_SEED=false` para no sobrescribir datos en reinicios.
* Usa un proxy inverso (Nginx, Traefik, Caddy) con HTTPS delante del contenedor.
* Los datos de PostgreSQL persisten en el volumen Docker `pgdata`.

---

## 🐳 Despliegue con Docker (recomendado)

La forma más rápida de levantar el sistema completo (aplicación + PostgreSQL) es con Docker Compose.

### Requisitos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) o Docker Engine + Docker Compose (Linux)

### Pasos

1. **Clonar la rama `1.0`:**
   ```bash
   git clone -b 1.0 https://github.com/sistemctl/licoreria.git
   cd licoreria
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y cambia al menos `NEXTAUTH_SECRET` por un valor seguro. En la **primera instalación** deja `RUN_SEED=true`.

3. **Construir e iniciar:**
   ```bash
   docker compose up -d --build
   ```

4. **Abrir la aplicación:**
   [http://localhost:3000](http://localhost:3000) (o el puerto definido en `APP_PORT`)

5. **Ver logs:**
   ```bash
   docker compose logs -f app
   ```

6. **Detener:**
   ```bash
   docker compose down
   ```

### Variables importantes (`.env`)

| Variable | Descripción |
|---|---|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `NEXTAUTH_SECRET` | Secreto para sesiones (obligatorio cambiar en producción) |
| `NEXTAUTH_URL` | URL pública de la app (ej. `https://tudominio.com`) |
| `APP_PORT` | Puerto expuesto al host (default: `3000`) |
| `RUN_SEED` | `true` solo en la primera instalación; luego usa `false` |

### Producción

* Cambia `NEXTAUTH_SECRET` y `POSTGRES_PASSWORD` por valores fuertes.
* Ajusta `NEXTAUTH_URL` a la URL real del servidor (con `https://` si usas SSL).
* Tras el primer arranque exitoso, pon `RUN_SEED=false` para no repetir la semilla.
* Opcional: coloca un proxy inverso (Nginx, Traefik, Caddy) delante del contenedor `app`.

### Comandos útiles

```bash
# Reconstruir tras cambios en el código
docker compose up -d --build

# Reiniciar solo la app
docker compose restart app

# Eliminar contenedores y volúmenes (borra la base de datos)
docker compose down -v
```

---

## 🔑 Credenciales por Defecto (Creadas con el Seed)
* **Email:** `admin@licoreria.com`
* **Contraseña:** `admin123`
* **Rol:** Administrador (Todos los permisos habilitados)

---

## 📂 Estructura General del Proyecto
* `src/app/` - Rutas de la aplicación web y puntos de acceso API (Autenticación, productos, ventas, etc.).
* `src/components/` - Componentes compartidos de la interfaz (Sidebar, modal, gráficos, lector de códigos).
* `src/lib/` - Inicialización de Prisma, configuraciones de NextAuth y funciones útiles.
* `prisma/` - Esquema de la base de datos relacional (`schema.prisma`) e inserción de semilla (`seed.js`).
