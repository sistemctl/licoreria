/**
 * Cálculo de ventas en servidor — no confiar en totales del cliente.
 */

export async function loadSaleConfig(tx) {
  const rows = await tx.configuracion.findMany({
    where: {
      clave: { in: ['impuesto_porcentaje', 'prefijo_factura', 'siguiente_num_factura'] },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
  return {
    impuestoPorcentaje: parseFloat(map.impuesto_porcentaje || '0'),
    prefijoFactura: map.prefijo_factura || 'FAC-',
    siguienteNumFactura: parseInt(map.siguiente_num_factura || '1', 10),
  };
}

function resolveUnitPrice(producto, tipoPrecio) {
  if (tipoPrecio === 'mayor' && producto.precioVentaMayor != null) {
    return parseFloat(producto.precioVentaMayor);
  }
  return parseFloat(producto.precioVentaDetal);
}

/**
 * @param {object} tx - Prisma transaction client
 * @param {Array} detallesInput - líneas del carrito
 * @param {number} descuentoManual - descuento global manual en pesos
 * @param {number|null} descuentoId - promoción aplicada
 */
export async function calculateSaleTotals(tx, detallesInput, descuentoManual = 0, descuentoId = null) {
  if (!detallesInput?.length) {
    throw new Error('El carrito está vacío.');
  }

  const productIds = [...new Set(detallesInput.map((d) => parseInt(d.productoId)))];
  const productos = await tx.producto.findMany({
    where: { id: { in: productIds } },
    include: {
      comboComoCombo: { include: { producto: true } },
    },
  });
  const productosById = Object.fromEntries(productos.map((p) => [p.id, p]));

  let subtotalBruto = 0;
  let descuentoLineas = 0;
  const lineas = [];

  for (const item of detallesInput) {
    const productoId = parseInt(item.productoId);
    const producto = productosById[productoId];
    const cantidad = parseInt(item.cantidad);

    if (!producto || !producto.activo) {
      throw new Error(`Producto no disponible (ID ${productoId}).`);
    }
    if (!cantidad || cantidad < 1) {
      throw new Error(`Cantidad inválida para "${producto.nombre}".`);
    }

    const tipoPrecio = item.tipoPrecio === 'mayor' ? 'mayor' : 'detal';
    const precioUnitario = resolveUnitPrice(producto, tipoPrecio);
    const descuentoLinea = Math.max(0, parseFloat(item.descuentoLinea || 0));

    if (descuentoLinea > precioUnitario) {
      throw new Error(`Descuento de línea inválido para "${producto.nombre}".`);
    }

    const subLine = (precioUnitario - descuentoLinea) * cantidad;
    subtotalBruto += precioUnitario * cantidad;
    descuentoLineas += descuentoLinea * cantidad;

    lineas.push({
      productoId,
      producto,
      cantidad,
      precioUnitario,
      descuentoLinea,
      subtotal: subLine,
      tipoPrecio,
    });
  }

  let descuentoPromo = 0;
  let promoAplicada = null;

  if (descuentoId) {
    const promo = await tx.descuento.findUnique({
      where: { id: parseInt(descuentoId) },
      include: { descuentoProductos: true },
    });

    if (!promo || !promo.activo) {
      throw new Error('La promoción seleccionada no está disponible.');
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(promo.fechaInicio);
    const fin = new Date(promo.fechaFin);
    fin.setHours(23, 59, 59, 999);

    if (hoy < inicio || hoy > fin) {
      throw new Error('La promoción no está vigente.');
    }

    const productosPromo = new Set(promo.descuentoProductos.map((dp) => dp.productoId));
    const subtotalPromo = lineas
      .filter((l) => productosPromo.size === 0 || productosPromo.has(l.productoId))
      .reduce((acc, l) => acc + l.subtotal, 0);

    if (promo.tipo === 'porcentaje') {
      descuentoPromo = subtotalPromo * (parseFloat(promo.valor) / 100);
    } else if (promo.tipo === 'monto_fijo') {
      descuentoPromo = Math.min(subtotalPromo, parseFloat(promo.valor));
    } else if (promo.tipo === 'cantidad') {
      const req = promo.cantidadRequerida || 0;
      const cob = promo.cantidadCobrada || 0;
      if (req > 0 && cob >= 0 && cob < req) {
        for (const linea of lineas) {
          if (productosPromo.size === 0 || productosPromo.has(linea.productoId)) {
            const sets = Math.floor(linea.cantidad / req);
            if (sets > 0) {
              const unidadesGratis = sets * (req - cob);
              descuentoPromo += unidadesGratis * linea.precioUnitario;
            }
          }
        }
      }
    }

    promoAplicada = promo;
  }

  const descuentoManualNum = Math.max(0, parseFloat(descuentoManual || 0));
  const subtotalNeto = Math.max(0, subtotalBruto - descuentoLineas);
  const descuentoTotal = Math.min(subtotalNeto, descuentoPromo + descuentoManualNum);
  const baseImpuesto = subtotalNeto - descuentoTotal;

  const config = await loadSaleConfig(tx);
  const impuesto = baseImpuesto * (config.impuestoPorcentaje / 100);
  const total = baseImpuesto + impuesto;

  return {
    lineas,
    subtotal: subtotalNeto,
    descuentoTotal,
    descuentoPromo,
    descuentoManual: descuentoManualNum,
    impuesto,
    total,
    descuentoId: promoAplicada?.id || null,
    promoNombre: promoAplicada?.nombre || null,
    config,
  };
}

/** Descuenta stock con update condicional para evitar negativos. */
export async function decrementProductStock(tx, productoId, cantidad) {
  const result = await tx.producto.updateMany({
    where: { id: productoId, stock: { gte: cantidad } },
    data: { stock: { decrement: cantidad } },
  });
  if (result.count === 0) {
    const prod = await tx.producto.findUnique({ where: { id: productoId } });
    throw new Error(
      `Stock insuficiente para "${prod?.nombre || productoId}" (requerido: ${cantidad}, disponible: ${prod?.stock ?? 0}).`
    );
  }
}

export async function decrementSaleStock(tx, lineas) {
  for (const linea of lineas) {
    const prod = linea.producto;
    if (prod.esCombo) {
      for (const combDet of prod.comboComoCombo) {
        const cantRequerida = combDet.cantidad * linea.cantidad;
        await decrementProductStock(tx, combDet.productoId, cantRequerida);
      }
    } else {
      await decrementProductStock(tx, prod.id, linea.cantidad);
    }
  }
}

export async function incrementSaleStock(tx, detalles, productosById) {
  for (const det of detalles) {
    const prod = productosById[det.productoId];
    if (!prod) continue;
    if (prod.esCombo && prod.comboComoCombo?.length) {
      for (const combDet of prod.comboComoCombo) {
        await tx.producto.update({
          where: { id: combDet.productoId },
          data: { stock: { increment: combDet.cantidad * det.cantidad } },
        });
      }
    } else {
      await tx.producto.update({
        where: { id: det.productoId },
        data: { stock: { increment: det.cantidad } },
      });
    }
  }
}
