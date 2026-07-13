# Despliegue simple: Docker Compose (app + PostgreSQL)

Un solo archivo `docker-compose.yml` levanta **app** y **base de datos**.

```bash
cp .env.example .env
# Edita NEXTAUTH_SECRET y NEXTAUTH_URL
docker compose up -d --build
```

---

## Dokploy en VPS (por IP) — lo más simple

### 1. Crear el servicio Compose

1. Dokploy → **Create Service** → **Compose** → **Docker Compose**
2. Fuente: GitHub `sistemctl/licoreria`, rama **`1.0`**
3. Compose file: `docker-compose.yml`
4. En **Environment** pega (cambia `TU_IP_VPS` y las claves):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=cambia_esta_clave
POSTGRES_DB=licoreria_db
NEXTAUTH_SECRET=un_secreto_largo_y_seguro
NEXTAUTH_URL=http://TU_IP_VPS
APP_PORT=3000
RUN_SEED=true
```

5. **Deploy**
6. En **Domains**, apunta la IP (o dominio) al servicio **`app`**, puerto **3000**
7. Abre `http://TU_IP_VPS` → login `admin@licoreria.com` / `admin123`
8. Cambia `RUN_SEED=false` y vuelve a desplegar

Si Dokploy te muestra un puerto (ej. `http://IP:3000`), usa esa misma URL en `NEXTAUTH_URL`.

### Notas

- No hace falta crear la base de datos a mano: va dentro del compose.
- Postgres **no** se publica a internet (solo la app).
- `DATABASE_URL` se arma sola hacia el servicio `db`.

---

## Local

```bash
git clone -b 1.0 https://github.com/sistemctl/licoreria.git
cd licoreria
cp .env.example .env
docker compose up -d --build
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
docker compose logs -f app
docker compose down        # parar
docker compose down -v     # parar y borrar datos de la BD
```

---

## Variables

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_PASSWORD` | Clave de PostgreSQL |
| `NEXTAUTH_SECRET` | Secreto de sesiones |
| `NEXTAUTH_URL` | URL pública (`http://IP` o `https://dominio`) |
| `APP_PORT` | Puerto en el host (default 3000) |
| `RUN_SEED` | `true` solo la primera vez |

Al arrancar, la app espera a Postgres, corre migraciones y, si `RUN_SEED=true`, el seed.
