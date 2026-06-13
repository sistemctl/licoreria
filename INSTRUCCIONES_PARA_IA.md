# INSTRUCCIONES PARA IA: Sistema de Gestión de Licorería — Guía Completa de Implementación

## CONTEXTO GENERAL
Eres un agente de IA encargado de construir desde cero un **Sistema de Gestión para Licorería** (Liquor Store Management System). El sistema es una aplicación web completa con Dashboard, Punto de Venta (POS), Inventario, Compras, Ventas, Facturación, Clientes, Combos, y más. Todo debe funcionar desde un solo Dashboard web.

El proyecto debe crearse en la carpeta: `c:\sistema-de-licoreria`

---

## PASO 1: INICIALIZAR EL PROYECTO

1. Navega a la carpeta `c:\sistema-de-licoreria`.
2. Ejecuta el comando para crear un proyecto Next.js con App Router:
   ```
   npx -y create-next-app@latest ./ --js --app --no-tailwind --no-eslint --no-turbopack --src-dir --import-alias "@/*" --no-git
   ```
   - Si la carpeta ya tiene archivos, limpia primero o usa `--overwrite` si está disponible.
3. Instala las dependencias necesarias:
   ```
   npm install prisma @prisma/client next-auth bcryptjs chart.js react-chartjs-2 jsbarcode jspdf html2canvas lucide-react
   ```
4. Inicializa Prisma con PostgreSQL:
   ```
   npx prisma init --datasource-provider postgresql
   ```
5. Configura el archivo `.env` con la URL de conexión a PostgreSQL:
   ```
   DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/licoreria_db"
   NEXTAUTH_SECRET="una-clave-secreta-segura-aleatoria-de-32-caracteres"
   NEXTAUTH_URL="http://localhost:3000"
   ```

---

## PASO 2: CREAR EL ESQUEMA DE BASE DE DATOS (PRISMA)

Crea el archivo `prisma/schema.prisma` con las siguientes 22 tablas. Cada tabla debe tener EXACTAMENTE los campos descritos aquí:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===================== SEGURIDAD =====================

model Rol {
  id        Int       @id @default(autoincrement())
  nombre    String    @unique @db.VarChar(50)
  permisos  Json      // JSON con cada permiso en true/false
  createdAt DateTime  @default(now()) @map("created_at")
  usuarios  Usuario[]

  @@map("roles")
}

model Usuario {
  id               Int        @id @default(autoincrement())
  nombre           String     @db.VarChar(100)
  email            String     @unique @db.VarChar(150)
  passwordHash     String     @map("password_hash") @db.VarChar(255)
  rolId            Int        @map("rol_id")
  activo           Boolean    @default(true)
  intentosFallidos Int        @default(0) @map("intentos_fallidos")
  bloqueadoHasta   DateTime?  @map("bloqueado_hasta")
  ultimoLogin      DateTime?  @map("ultimo_login")
  createdAt        DateTime   @default(now()) @map("created_at")

  rol              Rol        @relation(fields: [rolId], references: [id])
  ventas           Venta[]
  compras          Compra[]
  cajaTurnos       CajaTurno[]
  auditorias       Auditoria[]
  abonos           Abono[]
  mermas           Merma[]
  devoluciones     Devolucion[]

  @@map("usuarios")
}

// ===================== INVENTARIO =====================

model Categoria {
  id          Int        @id @default(autoincrement())
  nombre      String     @unique @db.VarChar(100)
  descripcion String?    @db.Text
  activo      Boolean    @default(true)
  productos   Producto[]

  @@map("categorias")
}

model Producto {
  id                Int       @id @default(autoincrement())
  codigoBarras      String?   @unique @map("codigo_barras") @db.VarChar(50)
  nombre            String    @db.VarChar(200)
  marca             String?   @db.VarChar(100)
  descripcion       String?   @db.Text
  contenidoMl       Int?      @map("contenido_ml")
  gradoAlcoholico   Decimal?  @map("grado_alcoholico") @db.Decimal(4, 1)
  imagenUrl         String?   @map("imagen_url") @db.Text
  categoriaId       Int       @map("categoria_id")
  precioCompra      Decimal   @map("precio_compra") @db.Decimal(12, 2)
  precioVentaDetal  Decimal   @map("precio_venta_detal") @db.Decimal(12, 2)
  precioVentaMayor  Decimal?  @map("precio_venta_mayor") @db.Decimal(12, 2)
  stock             Int       @default(0)
  stockMinimo       Int       @default(5) @map("stock_minimo")
  unidadMedida      String    @default("unidad") @map("unidad_medida") @db.VarChar(20)
  unidadesPorCaja   Int?      @map("unidades_por_caja")
  esCombo           Boolean   @default(false) @map("es_combo")
  activo            Boolean   @default(true)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  categoria          Categoria          @relation(fields: [categoriaId], references: [id])
  ventaDetalles      VentaDetalle[]
  compraDetalles     CompraDetalle[]
  comboComoCombo     ComboDetalle[]     @relation("ComboProducto")
  comboComoIngrediente ComboDetalle[]   @relation("IngredienteProducto")
  lotes              Lote[]
  mermas             Merma[]
  devolucionDetalles DevolucionDetalle[]
  descuentoProductos DescuentoProducto[]

  @@map("productos")
}

model ComboDetalle {
  id          Int      @id @default(autoincrement())
  comboId     Int      @map("combo_id")
  productoId  Int      @map("producto_id")
  cantidad    Int

  combo       Producto @relation("ComboProducto", fields: [comboId], references: [id])
  producto    Producto @relation("IngredienteProducto", fields: [productoId], references: [id])

  @@map("combo_detalles")
}

model Lote {
  id                Int       @id @default(autoincrement())
  productoId        Int       @map("producto_id")
  numeroLote        String?   @map("numero_lote") @db.VarChar(50)
  fechaVencimiento  DateTime? @map("fecha_vencimiento") @db.Date
  cantidad          Int
  compraDetalleId   Int?      @map("compra_detalle_id")
  createdAt         DateTime  @default(now()) @map("created_at")

  producto          Producto       @relation(fields: [productoId], references: [id])
  compraDetalle     CompraDetalle? @relation(fields: [compraDetalleId], references: [id])

  @@map("lotes")
}

model Merma {
  id          Int      @id @default(autoincrement())
  productoId  Int      @map("producto_id")
  cantidad    Int
  motivo      String   @db.VarChar(200)
  usuarioId   Int      @map("usuario_id")
  fecha       DateTime @default(now())

  producto    Producto @relation(fields: [productoId], references: [id])
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])

  @@map("mermas")
}

// ===================== PROMOCIONES =====================

model Descuento {
  id                Int       @id @default(autoincrement())
  nombre            String    @db.VarChar(100)
  tipo              String    @db.VarChar(20) // "porcentaje", "monto_fijo", "cantidad"
  valor             Decimal   @db.Decimal(10, 2)
  cantidadRequerida Int?      @map("cantidad_requerida")
  cantidadCobrada   Int?      @map("cantidad_cobrada")
  fechaInicio       DateTime  @map("fecha_inicio") @db.Date
  fechaFin          DateTime  @map("fecha_fin") @db.Date
  activo            Boolean   @default(true)

  ventas            Venta[]
  descuentoProductos DescuentoProducto[]

  @@map("descuentos")
}

model DescuentoProducto {
  id           Int       @id @default(autoincrement())
  descuentoId  Int       @map("descuento_id")
  productoId   Int       @map("producto_id")

  descuento    Descuento @relation(fields: [descuentoId], references: [id])
  producto     Producto  @relation(fields: [productoId], references: [id])

  @@map("descuento_productos")
}

// ===================== CLIENTES Y CRÉDITOS =====================

model Cliente {
  id              Int       @id @default(autoincrement())
  nombre          String    @db.VarChar(150)
  telefono        String?   @db.VarChar(20)
  cedulaRif       String?   @unique @map("cedula_rif") @db.VarChar(20)
  direccion       String?   @db.Text
  email           String?   @db.VarChar(150)
  tipo            String    @default("particular") @db.VarChar(20) // "particular" o "negocio"
  limiteCredito   Decimal   @default(0) @map("limite_credito") @db.Decimal(12, 2)
  saldoPendiente  Decimal   @default(0) @map("saldo_pendiente") @db.Decimal(12, 2)
  activo          Boolean   @default(true)
  createdAt       DateTime  @default(now()) @map("created_at")

  ventas          Venta[]
  cuentasPorCobrar CuentaPorCobrar[]

  @@map("clientes")
}

model CuentaPorCobrar {
  id              Int       @id @default(autoincrement())
  clienteId       Int       @map("cliente_id")
  ventaId         Int       @map("venta_id")
  montoTotal      Decimal   @map("monto_total") @db.Decimal(12, 2)
  saldoPendiente  Decimal   @map("saldo_pendiente") @db.Decimal(12, 2)
  fechaLimite     DateTime? @map("fecha_limite") @db.Date
  estado          String    @default("pendiente") @db.VarChar(20) // "pendiente", "pagada", "vencida"
  createdAt       DateTime  @default(now()) @map("created_at")

  cliente         Cliente   @relation(fields: [clienteId], references: [id])
  venta           Venta     @relation(fields: [ventaId], references: [id])
  abonos          Abono[]

  @@map("cuentas_por_cobrar")
}

model Abono {
  id          Int       @id @default(autoincrement())
  cuentaId    Int       @map("cuenta_id")
  monto       Decimal   @db.Decimal(12, 2)
  metodoPago  String    @map("metodo_pago") @db.VarChar(30)
  usuarioId   Int       @map("usuario_id")
  fecha       DateTime  @default(now())

  cuenta      CuentaPorCobrar @relation(fields: [cuentaId], references: [id])
  usuario     Usuario         @relation(fields: [usuarioId], references: [id])

  @@map("abonos")
}

// ===================== COMPRAS =====================

model Proveedor {
  id        Int       @id @default(autoincrement())
  nombre    String    @db.VarChar(150)
  telefono  String?   @db.VarChar(20)
  email     String?   @db.VarChar(150)
  rifNit    String?   @map("rif_nit") @db.VarChar(30)
  direccion String?   @db.Text
  contacto  String?   @db.VarChar(100)
  activo    Boolean   @default(true)
  createdAt DateTime  @default(now()) @map("created_at")

  compras   Compra[]

  @@map("proveedores")
}

model Compra {
  id                    Int       @id @default(autoincrement())
  proveedorId           Int       @map("proveedor_id")
  usuarioId             Int       @map("usuario_id")
  numFacturaProveedor   String?   @map("num_factura_proveedor") @db.VarChar(50)
  fecha                 DateTime  @default(now())
  total                 Decimal   @db.Decimal(12, 2)
  observaciones         String?   @db.Text

  proveedor             Proveedor      @relation(fields: [proveedorId], references: [id])
  usuario               Usuario        @relation(fields: [usuarioId], references: [id])
  detalles              CompraDetalle[]

  @@map("compras")
}

model CompraDetalle {
  id              Int       @id @default(autoincrement())
  compraId        Int       @map("compra_id")
  productoId      Int       @map("producto_id")
  cantidad        Int
  precioUnitario  Decimal   @map("precio_unitario") @db.Decimal(12, 2)
  subtotal        Decimal   @db.Decimal(12, 2)

  compra          Compra    @relation(fields: [compraId], references: [id])
  producto        Producto  @relation(fields: [productoId], references: [id])
  lotes           Lote[]

  @@map("compra_detalles")
}

// ===================== VENTAS Y FACTURACIÓN =====================

model Venta {
  id                  Int       @id @default(autoincrement())
  numFactura          String    @unique @map("num_factura") @db.VarChar(20)
  clienteId           Int?      @map("cliente_id")
  usuarioId           Int       @map("usuario_id")
  fecha               DateTime  @default(now())
  subtotal            Decimal   @db.Decimal(12, 2)
  descuentoTotal      Decimal   @default(0) @map("descuento_total") @db.Decimal(12, 2)
  impuesto            Decimal   @default(0) @db.Decimal(12, 2)
  total               Decimal   @db.Decimal(12, 2)
  metodoPago          String    @map("metodo_pago") @db.VarChar(30) // "efectivo", "tarjeta", "transferencia", "credito", "mixto"
  montoEfectivo       Decimal   @default(0) @map("monto_efectivo") @db.Decimal(12, 2)
  montoTarjeta        Decimal   @default(0) @map("monto_tarjeta") @db.Decimal(12, 2)
  montoTransferencia  Decimal   @default(0) @map("monto_transferencia") @db.Decimal(12, 2)
  descuentoId         Int?      @map("descuento_id")
  cajaTurnoId         Int?      @map("caja_turno_id")
  estado              String    @default("completada") @db.VarChar(20) // "completada", "anulada"

  cliente             Cliente?       @relation(fields: [clienteId], references: [id])
  usuario             Usuario        @relation(fields: [usuarioId], references: [id])
  descuento           Descuento?     @relation(fields: [descuentoId], references: [id])
  cajaTurno           CajaTurno?     @relation(fields: [cajaTurnoId], references: [id])
  detalles            VentaDetalle[]
  devoluciones        Devolucion[]
  cuentasPorCobrar    CuentaPorCobrar[]

  @@map("ventas")
}

model VentaDetalle {
  id              Int       @id @default(autoincrement())
  ventaId         Int       @map("venta_id")
  productoId      Int       @map("producto_id")
  cantidad        Int
  precioUnitario  Decimal   @map("precio_unitario") @db.Decimal(12, 2)
  descuentoLinea  Decimal   @default(0) @map("descuento_linea") @db.Decimal(12, 2)
  subtotal        Decimal   @db.Decimal(12, 2)
  tipoPrecio      String    @default("detal") @map("tipo_precio") @db.VarChar(10) // "detal" o "mayor"

  venta           Venta     @relation(fields: [ventaId], references: [id])
  producto        Producto  @relation(fields: [productoId], references: [id])

  @@map("venta_detalles")
}

// ===================== DEVOLUCIONES =====================

model Devolucion {
  id                Int       @id @default(autoincrement())
  ventaId           Int       @map("venta_id")
  usuarioId         Int       @map("usuario_id")
  fecha             DateTime  @default(now())
  motivo            String    @db.Text
  totalReembolsado  Decimal   @map("total_reembolsado") @db.Decimal(12, 2)

  venta             Venta     @relation(fields: [ventaId], references: [id])
  usuario           Usuario   @relation(fields: [usuarioId], references: [id])
  detalles          DevolucionDetalle[]

  @@map("devoluciones")
}

model DevolucionDetalle {
  id            Int       @id @default(autoincrement())
  devolucionId  Int       @map("devolucion_id")
  productoId    Int       @map("producto_id")
  cantidad      Int
  razon         String?   @db.VarChar(200)

  devolucion    Devolucion @relation(fields: [devolucionId], references: [id])
  producto      Producto   @relation(fields: [productoId], references: [id])

  @@map("devolucion_detalles")
}

// ===================== OPERACIONES =====================

model CajaTurno {
  id                   Int       @id @default(autoincrement())
  usuarioId            Int       @map("usuario_id")
  fechaApertura        DateTime  @map("fecha_apertura")
  fechaCierre          DateTime? @map("fecha_cierre")
  montoApertura        Decimal   @map("monto_apertura") @db.Decimal(12, 2)
  montoCierreEsperado  Decimal?  @map("monto_cierre_esperado") @db.Decimal(12, 2)
  montoCierreReal      Decimal?  @map("monto_cierre_real") @db.Decimal(12, 2)
  diferencia           Decimal?  @db.Decimal(12, 2)
  retiros              Decimal   @default(0) @db.Decimal(12, 2)
  estado               String    @default("abierta") @db.VarChar(20) // "abierta", "cerrada"
  observaciones        String?   @db.Text

  usuario              Usuario   @relation(fields: [usuarioId], references: [id])
  ventas               Venta[]

  @@map("caja_turnos")
}

model Auditoria {
  id               Int       @id @default(autoincrement())
  usuarioId        Int       @map("usuario_id")
  accion           String    @db.VarChar(50) // "VENTA", "ANULACION", "CAMBIO_PRECIO", "LOGIN", etc.
  tablaAfectada    String    @map("tabla_afectada") @db.VarChar(50)
  registroId       Int?      @map("registro_id")
  datosAnteriores  Json?     @map("datos_anteriores")
  datosNuevos      Json?     @map("datos_nuevos")
  ipAddress        String?   @map("ip_address") @db.VarChar(45)
  fecha            DateTime  @default(now())

  usuario          Usuario   @relation(fields: [usuarioId], references: [id])

  @@map("auditorias")
}

model Configuracion {
  id          Int     @id @default(autoincrement())
  clave       String  @unique @db.VarChar(50)
  valor       String  @db.Text
  descripcion String? @db.VarChar(200)

  @@map("configuraciones")
}
```

Después de crear el esquema, ejecuta:
```
npx prisma migrate dev --name init
```

---

## PASO 3: CREAR EL SEED DE DATOS INICIALES

Crea el archivo `prisma/seed.js` que inserte:

1. **3 Roles:**
   - Administrador (todos los permisos en true)
   - Cajero (solo ventas, apertura/cierre caja)
   - Almacenista (inventario, compras, proveedores)

2. **1 Usuario Administrador por defecto:**
   - nombre: "Administrador"
   - email: "admin@licoreria.com"
   - password: "admin123" (hasheada con bcrypt, 12 salt rounds)
   - rol: Administrador

3. **Categorías iniciales:**
   - Rones, Whiskys, Vodkas, Cervezas, Vinos, Tequilas, Refrescos, Snacks, Cigarrillos, Hielo, Otros

4. **Configuraciones iniciales:**
   - nombre_negocio: "Mi Licorería"
   - direccion: ""
   - telefono: ""
   - rif_nit: ""
   - moneda_simbolo: "$"
   - impuesto_porcentaje: "0"
   - prefijo_factura: "FAC-"
   - siguiente_num_factura: "1"
   - dias_alerta_vencimiento: "15"

Ejecuta: `npx prisma db seed`

---

## PASO 4: CREAR LA ESTRUCTURA DE CARPETAS

La estructura del proyecto debe ser:

```
src/
├── app/
│   ├── globals.css                    ← Estilos globales (Dark Mode Premium)
│   ├── layout.js                      ← Layout principal
│   ├── page.js                        ← Redirección al login
│   ├── login/
│   │   └── page.js                    ← Pantalla de Login
│   ├── dashboard/
│   │   ├── layout.js                  ← Layout del dashboard (sidebar + header)
│   │   ├── page.js                    ← Home del dashboard (widgets y gráficas)
│   │   ├── inventario/
│   │   │   └── page.js                ← Gestión de productos
│   │   ├── categorias/
│   │   │   └── page.js                ← Gestión de categorías
│   │   ├── combos/
│   │   │   └── page.js                ← Crear y gestionar combos
│   │   ├── descuentos/
│   │   │   └── page.js                ← Promociones y descuentos
│   │   ├── pos/
│   │   │   └── page.js                ← Punto de Venta (Caja)
│   │   ├── ventas/
│   │   │   └── page.js                ← Historial de ventas
│   │   ├── compras/
│   │   │   └── page.js                ← Registro de compras
│   │   ├── proveedores/
│   │   │   └── page.js                ← Gestión de proveedores
│   │   ├── clientes/
│   │   │   └── page.js                ← Gestión de clientes
│   │   ├── cuentas-por-cobrar/
│   │   │   └── page.js                ← Cuentas por cobrar y abonos
│   │   ├── devoluciones/
│   │   │   └── page.js                ← Devoluciones / Notas de crédito
│   │   ├── caja/
│   │   │   └── page.js                ← Apertura y cierre de caja
│   │   ├── reportes/
│   │   │   └── page.js                ← Reportes y gráficas
│   │   ├── auditoria/
│   │   │   └── page.js                ← Bitácora de acciones
│   │   ├── usuarios/
│   │   │   └── page.js                ← Gestión de usuarios
│   │   └── configuracion/
│   │       └── page.js                ← Ajustes del sistema
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.js           ← Configuración de NextAuth
│       ├── productos/
│       │   └── route.js               ← API CRUD de productos
│       ├── categorias/
│       │   └── route.js               ← API CRUD de categorías
│       ├── combos/
│       │   └── route.js               ← API de combos
│       ├── descuentos/
│       │   └── route.js               ← API de descuentos
│       ├── ventas/
│       │   └── route.js               ← API de ventas (POS)
│       ├── compras/
│       │   └── route.js               ← API de compras
│       ├── proveedores/
│       │   └── route.js               ← API de proveedores
│       ├── clientes/
│       │   └── route.js               ← API de clientes
│       ├── cuentas-por-cobrar/
│       │   └── route.js               ← API de cuentas y abonos
│       ├── devoluciones/
│       │   └── route.js               ← API de devoluciones
│       ├── caja/
│       │   └── route.js               ← API de caja/turnos
│       ├── reportes/
│       │   └── route.js               ← API de reportes
│       ├── auditoria/
│       │   └── route.js               ← API de auditoría
│       ├── usuarios/
│       │   └── route.js               ← API de usuarios
│       └── configuracion/
│           └── route.js               ← API de configuración
├── components/
│   ├── Sidebar.js                     ← Barra lateral del dashboard
│   ├── Header.js                      ← Encabezado con usuario logueado
│   ├── Modal.js                       ← Componente modal reutilizable
│   ├── Table.js                       ← Tabla reutilizable con búsqueda
│   ├── BarcodeScanner.js              ← Hook/componente para escáner de código de barras
│   ├── BarcodePrinter.js              ← Generador de etiquetas de código de barras
│   └── Charts.js                      ← Componentes de gráficas reutilizables
└── lib/
    ├── prisma.js                      ← Instancia singleton de Prisma Client
    ├── auth.js                        ← Opciones de NextAuth
    └── utils.js                       ← Funciones auxiliares (formatear moneda, fechas, etc.)
```

---

## PASO 5: DISEÑO VISUAL (CSS)

El diseño DEBE ser:
- **Dark Mode** (fondo oscuro: #0a0a0f, paneles: #12121a con borde sutil)
- **Glassmorphism** (paneles con backdrop-filter: blur(10px) y fondo rgba semitransparente)
- **Tipografía:** Google Font "Inter"
- **Colores de acento:** Dorado (#d4a853) para botones principales, verde (#22c55e) para éxito, rojo (#ef4444) para errores/alertas
- **Animaciones suaves:** Transiciones de 0.2s en hover de botones, tarjetas, filas de tabla
- **Sidebar:** Fija a la izquierda, 260px de ancho, con iconos de Lucide React y texto
- **Responsive:** Que funcione en pantallas desde 1024px en adelante (escritorio/tablet grande)

---

## PASO 6: FUNCIONALIDADES CLAVE A IMPLEMENTAR

### 6.1 LOGIN
- Formulario con email y contraseña
- Validar contra la BD con bcrypt.compare()
- Bloquear después de 5 intentos fallidos por 15 minutos
- Redirigir al /dashboard después de login exitoso
- Proteger TODAS las rutas de /dashboard verificando la sesión

### 6.2 SIDEBAR (Barra Lateral del Dashboard)
Debe tener los siguientes enlaces con iconos:
- 🏠 Inicio (Dashboard)
- 💰 Punto de Venta (POS)
- 📦 Inventario
- 🏷️ Categorías
- 🛒 Combos
- 🎯 Descuentos
- 📋 Ventas
- 🚚 Compras
- 🏭 Proveedores
- 👥 Clientes
- 💳 Cuentas por Cobrar
- 🔄 Devoluciones
- 🏦 Caja
- 📈 Reportes
- 📝 Auditoría
- 👤 Usuarios
- ⚙️ Configuración

Los elementos del menú deben mostrarse u ocultarse según los permisos del rol del usuario logueado.

### 6.3 PUNTO DE VENTA (POS) — LA PANTALLA MÁS IMPORTANTE
Esta pantalla debe ocupar todo el ancho disponible. Tiene 2 secciones:
- **Izquierda (70%):** Barra de búsqueda grande arriba + grilla de productos por categoría (con imagen, nombre, precio). Al hacer clic o escanear, se agrega al carrito.
- **Derecha (30%):** Lista del carrito (productos agregados), con cantidad editable, subtotales, descuento, impuesto, total, y botón grande "COBRAR".

**Escáner de código de barras:** Implementar un listener global de teclado. Los escáneres USB envían caracteres rápidos seguidos de "Enter". Detectar una secuencia de caracteres rápidos (< 50ms entre teclas) seguida de Enter, buscar el código en la BD, y agregar el producto al carrito.

### 6.4 CADA MÓDULO CRUD
Para cada módulo (Productos, Categorías, Proveedores, Clientes, Usuarios, etc.):
- Tabla con búsqueda y filtros
- Botón "Nuevo" que abre un modal con formulario
- Botón "Editar" en cada fila
- Botón "Desactivar" (NO borrar, solo marcar activo=false)
- Paginación

### 6.5 REPORTES
Usar Chart.js (react-chartjs-2) para generar las gráficas:
- Gráfica de línea: Ventas de los últimos 7/30 días
- Gráfica de barras: Top 10 productos más vendidos
- Gráfica de pastel: Ventas por categoría
- Gráfica de pastel: Ventas por método de pago
- Tablas: Inventario valorizado, stock crítico, productos próximos a vencer

### 6.6 AUDITORÍA
Registrar automáticamente en la tabla Auditoria cada vez que se:
- Cree, edite o elimine un producto
- Realice una venta
- Anule una venta
- Procese una devolución
- Cambie un precio
- Abra/cierre una caja
- Inicie/cierre sesión un usuario

---

## PASO 7: VERIFICACIÓN FINAL

Después de construir todo, verifica:

1. **Login:** Iniciar sesión con admin@licoreria.com / admin123
2. **Crear un producto:** Con código de barras, precio detal y mayor
3. **Registrar una compra:** Que el stock se incremente
4. **Realizar una venta en POS:** Escanear/buscar producto, cobrar, verificar que el stock baje
5. **Venta a crédito:** Seleccionar cliente, verificar que se cree la cuenta por cobrar
6. **Registrar un abono:** Verificar que el saldo baje
7. **Hacer una devolución:** Verificar que el stock regrese
8. **Cierre de caja:** Verificar el cuadre
9. **Ver reportes:** Verificar que las gráficas muestren datos reales
10. **Auditoría:** Verificar que todas las acciones anteriores quedaron registradas

---

## RESUMEN DE TECNOLOGÍAS

| Herramienta | Uso |
|---|---|
| Next.js 14+ (App Router) | Framework principal (frontend + backend) |
| JavaScript (ES6+) | Lenguaje de programación |
| CSS Puro | Estilos (Dark Mode, Glassmorphism) |
| Google Fonts (Inter) | Tipografía |
| PostgreSQL | Base de datos relacional |
| Prisma ORM | Conector y migraciones de BD |
| NextAuth.js | Autenticación y sesiones |
| bcryptjs | Hash de contraseñas |
| Chart.js + react-chartjs-2 | Gráficas y reportes |
| JsBarcode | Generación de códigos de barras |
| jsPDF + html2canvas | Exportar facturas y reportes a PDF |
| Lucide React | Iconos del dashboard |
