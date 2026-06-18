-- CreateIndex
CREATE INDEX "caja_turnos_usuario_id_idx" ON "caja_turnos"("usuario_id");

-- CreateIndex
CREATE INDEX "caja_turnos_estado_idx" ON "caja_turnos"("estado");

-- CreateIndex
CREATE INDEX "productos_categoria_id_idx" ON "productos"("categoria_id");

-- CreateIndex
CREATE INDEX "productos_activo_idx" ON "productos"("activo");

-- CreateIndex
CREATE INDEX "venta_detalles_venta_id_idx" ON "venta_detalles"("venta_id");

-- CreateIndex
CREATE INDEX "venta_detalles_producto_id_idx" ON "venta_detalles"("producto_id");

-- CreateIndex
CREATE INDEX "ventas_usuario_id_idx" ON "ventas"("usuario_id");

-- CreateIndex
CREATE INDEX "ventas_cliente_id_idx" ON "ventas"("cliente_id");

-- CreateIndex
CREATE INDEX "ventas_caja_turno_id_idx" ON "ventas"("caja_turno_id");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");
