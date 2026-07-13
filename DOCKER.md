# Despliegue: contenedores independientes (app + PostgreSQL)

La **aplicación** y la **base de datos** van en contenedores/servicios **separados**.

| Contenedor | Qué es | Archivo / servicio |
|------------|--------|--------------------|
| App | Next.js + Prisma (migraciones al arrancar) | `Dockerfile` |
| DB | PostgreSQL 16 | Dokploy Databases, o `docker-compose.db.yml` |

---

## Dokploy (recomendado en producción)

### 1. Crear la base de datos (contenedor independiente)

1. En Dokploy → **Databases** → **PostgreSQL**
2. Nombre, usuario, contraseña y base (ej. `licoreria_db`)
3. Despliega y copia la **connection URL** interna (host interno de Dokploy)

### 2. Crear la aplicación (contenedor independiente)

1. **Create Service** → **Application**
2. Fuente: GitHub `sistemctl/licoreria`, rama **`1.0`**
3. Build: **Dockerfile** (raíz del repo)
4. Puerto de la app: **3000**
5. Variables de entorno:

```env
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST_INTERNO_DB:5432/licoreria_db?schema=public
NEXTAUTH_SECRET=un_secreto_largo_y_seguro
NEXTAUTH_URL=https://tu-dominio.com
PORT=3000
HOSTNAME=0.0.0.0
RUN_SEED=true
```

6. Deploy
7. En **Domains**, asigna tu dominio al servicio de la app (puerto 3000)
8. Cuando el seed haya corrido una vez, cambia `RUN_SEED=false` y vuelve a desplegar

Login inicial: `admin@licoreria.com` / `admin123`

### Notas Dokploy

- `DATABASE_URL` debe usar el **hostname interno** del servicio PostgreSQL de Dokploy (no `localhost`).
- App y DB deben poder verse en la red de Dokploy (misma red / sin aislamiento que los separe).
- No expongas el puerto 5432 a internet.
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
