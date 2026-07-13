# Despliegue simple: Docker Compose (app + PostgreSQL)

Un solo `docker-compose.yml` levanta **app** y **base de datos**.

---

## Dokploy en VPS (por IP)

### Error típico: `Bind for 0.0.0.0:3000 failed: port is already allocated`

Eso significa que otro servicio (a menudo Dokploy/Traefik u otra app) ya usa el **3000 del VPS**.  
Este compose **ya no publica** el 3000 en el host: solo lo expone por dentro. El acceso es por **Domains** de Dokploy (puerto 80).

### Pasos

1. Dokploy → **Compose** → repo `sistemctl/licoreria` rama **`1.0`** → `docker-compose.yml`
2. **Environment**:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=cambia_esta_clave
POSTGRES_DB=licoreria_db
NEXTAUTH_SECRET=un_secreto_largo_y_seguro
NEXTAUTH_URL=http://TU_IP_VPS
RUN_SEED=true
```

3. **Deploy**
4. **Domains** → añade la IP (o dominio) → servicio **`app`** → puerto **`3000`**
5. Abre `http://TU_IP_VPS` → `admin@licoreria.com` / `admin123`
6. Pon `RUN_SEED=false` y redespliega

`NEXTAUTH_URL` debe ser exactamente la URL con la que entras en el navegador.

---

## Local

```bash
git clone -b 1.0 https://github.com/sistemctl/licoreria.git
cd licoreria
cp .env.example .env
docker compose up -d --build
```

Para abrir en el navegador en local, publica el puerto una vez (ej. en un override) o usa:

```bash
docker compose exec app wget -qO- http://127.0.0.1:3000
```

O añade temporalmente bajo `app:`:

```yaml
ports:
  - "3000:3000"
```

---

## Variables

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_PASSWORD` | Clave de PostgreSQL |
| `NEXTAUTH_SECRET` | Secreto de sesiones |
| `NEXTAUTH_URL` | URL pública (`http://IP` o `https://dominio`) |
| `RUN_SEED` | `true` solo la primera vez |

Al arrancar: espera Postgres → migraciones → seed opcional.
