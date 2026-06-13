-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "permisos" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "ultimo_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "codigo_barras" VARCHAR(50),
    "nombre" VARCHAR(200) NOT NULL,
    "marca" VARCHAR(100),
    "descripcion" TEXT,
    "contenido_ml" INTEGER,
    "grado_alcoholico" DECIMAL(4,1),
    "imagen_url" TEXT,
    "categoria_id" INTEGER NOT NULL,
    "precio_compra" DECIMAL(12,2) NOT NULL,
    "precio_venta_detal" DECIMAL(12,2) NOT NULL,
    "precio_venta_mayor" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "unidad_medida" VARCHAR(20) NOT NULL DEFAULT 'unidad',
    "unidades_por_caja" INTEGER,
    "es_combo" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_detalles" (
    "id" SERIAL NOT NULL,
    "combo_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "combo_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "numero_lote" VARCHAR(50),
    "fecha_vencimiento" DATE,
    "cantidad" INTEGER NOT NULL,
    "compra_detalle_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mermas" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" VARCHAR(200) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mermas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "cantidad_requerida" INTEGER,
    "cantidad_cobrada" INTEGER,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "descuentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_productos" (
    "id" SERIAL NOT NULL,
    "descuento_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,

    CONSTRAINT "descuento_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "cedula_rif" VARCHAR(20),
    "direccion" TEXT,
    "email" VARCHAR(150),
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'particular',
    "limite_credito" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_cobrar" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "monto_total" DECIMAL(12,2) NOT NULL,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL,
    "fecha_limite" DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_por_cobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" VARCHAR(30) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),
    "rif_nit" VARCHAR(30),
    "direccion" TEXT,
    "contacto" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" SERIAL NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "num_factura_proveedor" VARCHAR(50),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_detalles" (
    "id" SERIAL NOT NULL,
    "compra_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "compra_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "num_factura" VARCHAR(20) NOT NULL,
    "cliente_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "metodo_pago" VARCHAR(30) NOT NULL,
    "monto_efectivo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_tarjeta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_transferencia" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento_id" INTEGER,
    "caja_turno_id" INTEGER,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completada',

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_detalles" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "descuento_linea" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tipo_precio" VARCHAR(10) NOT NULL DEFAULT 'detal',

    CONSTRAINT "venta_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "total_reembolsado" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion_detalles" (
    "id" SERIAL NOT NULL,
    "devolucion_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "razon" VARCHAR(200),

    CONSTRAINT "devolucion_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_turnos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL,
    "fecha_cierre" TIMESTAMP(3),
    "monto_apertura" DECIMAL(12,2) NOT NULL,
    "monto_cierre_esperado" DECIMAL(12,2),
    "monto_cierre_real" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "retiros" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'abierta',
    "observaciones" TEXT,

    CONSTRAINT "caja_turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "tabla_afectada" VARCHAR(50) NOT NULL,
    "registro_id" INTEGER,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "ip_address" VARCHAR(45),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(50) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" VARCHAR(200),

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_barras_key" ON "productos"("codigo_barras");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cedula_rif_key" ON "clientes"("cedula_rif");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_num_factura_key" ON "ventas"("num_factura");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_detalles" ADD CONSTRAINT "combo_detalles_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_detalles" ADD CONSTRAINT "combo_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_compra_detalle_id_fkey" FOREIGN KEY ("compra_detalle_id") REFERENCES "compra_detalles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_productos" ADD CONSTRAINT "descuento_productos_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_productos" ADD CONSTRAINT "descuento_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_por_cobrar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_caja_turno_id_fkey" FOREIGN KEY ("caja_turno_id") REFERENCES "caja_turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalles" ADD CONSTRAINT "devolucion_detalles_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalles" ADD CONSTRAINT "devolucion_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_turnos" ADD CONSTRAINT "caja_turnos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
