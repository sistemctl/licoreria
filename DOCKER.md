# Despliegue con Docker Compose

**Método recomendado** para levantar el sistema completo (aplicación Next.js + PostgreSQL).

Usa **Docker Compose V2** (`docker compose`, no el binario legacy `docker-compose`).

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS), o Docker Engine + plugin Compose (Linux)

## Inicio rápido

```bash
git clone -b 1.0 https://github.com/sistemctl/licoreria.git
cd licoreria
cp .env.example .env
```

Edita `.env` y cambia al menos `NEXTAUTH_SECRET`. En la primera instalación deja `RUN_SEED=true`.

```bash
docker compose up -d --build
```

Abre [http://localhost:3000](http://localhost:3000).

Credenciales iniciales (si corriste el seed): `admin@licoreria.com` / `admin123`.

## Servicios

| Servicio | Descripción |
|----------|-------------|
| `app` | Next.js en producción (migraciones + opcional seed al arrancar) |
| `db` | PostgreSQL 16 (volumen `pgdata`) |

## Comandos útiles

```bash
# Logs
docker compose logs -f app

# Detener
docker compose down

# Detener y borrar la base de datos
docker compose down -v

# Reconstruir tras cambios de código
docker compose up -d --build

# Reiniciar solo la app
docker compose restart app
```

## Variables de entorno (`.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `licoreria_secret` |
| `NEXTAUTH_SECRET` | Secreto de sesiones (cámbialo) | — |
| `NEXTAUTH_URL` | URL pública de la app | `http://localhost:3000` |
| `APP_PORT` | Puerto en el host | `3000` |
| `RUN_SEED` | Seed al iniciar (`true`/`false`) | `false` (en `.env.example`: `true`) |

## Producción

1. Cambia `NEXTAUTH_SECRET` y `POSTGRES_PASSWORD`.
2. Ajusta `NEXTAUTH_URL` a tu URL real (con `https://` si aplica).
3. Tras el primer arranque, pon `RUN_SEED=false`.
4. Opcional: proxy inverso (Nginx, Traefik, Caddy) delante del puerto de `app`.

Archivos: `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `.dockerignore`, `.env.example`.
