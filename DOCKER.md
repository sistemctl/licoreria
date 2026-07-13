# Despliegue: contenedores independientes (app + PostgreSQL)

La **aplicación** y la **base de datos** van en contenedores/servicios **separados**.

| Contenedor | Qué es | Archivo / servicio |
|------------|--------|--------------------|
| App | Next.js + Prisma (migraciones al arrancar) | `Dockerfile` |
| DB | PostgreSQL 16 | Dokploy Databases, o `docker-compose.db.yml` |

---

## Dokploy en VPS (por IP o dominio)

### Requisitos previos

1. VPS con Docker + Dokploy instalado y panel accesible.
2. Puerto **80** (y **443** si usas HTTPS) abiertos en el firewall.
3. Repo GitHub: `sistemctl/licoreria`, rama **`1.0`**.

### 1. Crear la base de datos (contenedor independiente)

1. Dokploy → **Databases** → **PostgreSQL**
2. Nombre, usuario, contraseña y base (ej. `licoreria_db`)
3. Deploy
4. Copia la **connection URL interna** (host interno de Dokploy, **no** la IP pública ni `localhost`)

### 2. Crear la aplicación (contenedor independiente)

1. **Create Service** → **Application**
2. Fuente: GitHub `sistemctl/licoreria`, rama **`1.0`**
3. Build: **Dockerfile** (raíz del repo)
4. Puerto de la app: **3000**
5. Variables de entorno (sustituye `TU_IP_VPS` y la URL de la BD):

```env
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST_INTERNO_DB:5432/licoreria_db?schema=public
NEXTAUTH_SECRET=un_secreto_largo_y_seguro
NEXTAUTH_URL=http://TU_IP_VPS
PORT=3000
HOSTNAME=0.0.0.0
RUN_SEED=true
```

**Si Dokploy te da un puerto publicado** (ej. `http://IP:3000` o `http://IP:8080`), usa exactamente esa URL en `NEXTAUTH_URL`.

6. Deploy
7. Acceso por IP:
   - En **Domains** / publicación: usa la IP del VPS o el puerto que Dokploy asigne al servicio `app` (puerto interno **3000**).
   - Sin dominio: normalmente entras por `http://TU_IP_VPS` (Traefik puerto 80) o `http://TU_IP_VPS:PUERTO` si publicaste el puerto directo.
8. Cuando el seed haya corrido una vez, cambia `RUN_SEED=false` y vuelve a desplegar

Login inicial: `admin@licoreria.com` / `admin123`

### Ejemplo con IP

Si tu VPS es `203.0.113.50` y entras por HTTP en el puerto 80:

```env
NEXTAUTH_URL=http://203.0.113.50
```

Si más adelante pones dominio + SSL, cambia a:

```env
NEXTAUTH_URL=https://licoreria.tudominio.com
```

y vuelve a desplegar.

### Notas Dokploy

- `DATABASE_URL` = hostname **interno** del PostgreSQL de Dokploy (no `localhost`, no la IP pública).
- App y DB en la misma red de Dokploy (sin aislamiento que los separe).
- No expongas el puerto **5432** a internet.
- Con solo IP suele ser **HTTP** (`http://...`). NextAuth necesita que `NEXTAUTH_URL` coincida con la URL con la que abres el navegador.
- Tras el primer arranque, desactiva el seed.

---

## Local: dos contenedores separados

```bash
git clone -b 1.0 https://github.com/sistemctl/licoreria.git
cd licoreria
cp .env.example .env
```

1. **Base de datos:**

```bash
docker compose -f docker-compose.db.yml up -d
```

2. **Aplicación** (con `DATABASE_URL` apuntando a `localhost:5432` en `.env`):

```bash
docker compose up -d --build
```

Abre [http://localhost:3000](http://localhost:3000).

### Comandos útiles

```bash
# Logs app
docker compose logs -f app

# Logs DB
docker compose -f docker-compose.db.yml logs -f db

# Parar app
docker compose down

# Parar DB (cuidado: -v borra datos)
docker compose -f docker-compose.db.yml down
```

---

## Variables

| Variable | Quién la usa | Descripción |
|----------|--------------|-------------|
| `DATABASE_URL` | App | Conexión a PostgreSQL externo |
| `NEXTAUTH_SECRET` | App | Secreto de sesiones |
| `NEXTAUTH_URL` | App | URL pública (`https://...` en prod) |
| `PORT` / `APP_PORT` | App | Puerto interno / host |
| `RUN_SEED` | App | `true` solo la primera vez |
| `POSTGRES_*` | Solo DB local | Usuario, clave, nombre, puerto |

Al arrancar, el contenedor de la app espera a PostgreSQL, ejecuta `prisma migrate deploy` y, si `RUN_SEED=true`, el seed.
