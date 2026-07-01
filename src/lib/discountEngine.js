/**
 * Motor de promociones para POS (vista previa en cliente).
 */

export function isPromoActive(promo, date = new Date()) {
  if (!promo?.activo) return false;
  const hoy = new Date(date);
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(promo.fechaInicio);
  const fin = new Date(promo.fechaFin);
  fin.setHours(23, 59, 59, 999);
  return hoy >= inicio && hoy <= fin;
}

export function promoAppliesToProduct(promo, productoId) {
  if (!promo.descuentoProductos?.length) return true;
  return promo.descuentoProductos.some((dp) => dp.productoId === productoId);
}

export function estimatePromoDiscount(promo, cart, productosById) {
  if (!isPromoActive(promo)) return 0;

  const lineas = cart.filter((item) => promoAppliesToProduct(promo, item.productoId));
  const subtotal = lineas.reduce((acc, item) => {
    const prod = productosById[item.productoId];
    const precio = parseFloat(item.precioUnitario ?? prod?.precioVentaDetal ?? 0);
    const desc = parseFloat(item.descuentoLinea || 0);
    return acc + (precio - desc) * item.cantidad;
  }, 0);

  if (promo.tipo === 'porcentaje') {
    return subtotal * (parseFloat(promo.valor) / 100);
  }
  if (promo.tipo === 'monto_fijo') {
    return Math.min(subtotal, parseFloat(promo.valor));
  }
  if (promo.tipo === 'cantidad') {
    const req = promo.cantidadRequerida || 0;
    const cob = promo.cantidadCobrada || 0;
    let desc = 0;
    if (req > 0 && cob >= 0 && cob < req) {
      for (const item of lineas) {
        const prod = productosById[item.productoId];
        const precio = parseFloat(item.precioUnitario ?? prod?.precioVentaDetal ?? 0);
        const sets = Math.floor(item.cantidad / req);
        desc += sets * (req - cob) * precio;
      }
    }
    return desc;
  }
  return 0;
}

export function getBestPromoForCart(promos, cart, productosById) {
  let best = null;
  let bestDiscount = 0;

  for (const promo of promos) {
    const discount = estimatePromoDiscount(promo, cart, productosById);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      best = promo;
    }
  }

  return { promo: best, discount: bestDiscount };
}
