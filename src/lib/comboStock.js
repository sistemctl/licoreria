/**
 * Utilidades para validar stock de combos/preparados según ingredientes.
 */

function ingredientDemandFromCartItem(item, producto) {
  const demand = {};
  if (!producto) return demand;

  if (producto.esCombo && producto.comboComoCombo?.length) {
    for (const det of producto.comboComoCombo) {
      const productoId = det.productoId;
      demand[productoId] = (demand[productoId] || 0) + det.cantidad * item.cantidad;
    }
  } else {
    demand[item.productoId] = (demand[item.productoId] || 0) + item.cantidad;
  }

  return demand;
}

/** Demanda total de ingredientes según el carrito actual. */
export function getIngredientDemandInCart(cart, productosById) {
  const demand = {};

  for (const item of cart) {
    const producto = productosById[item.productoId];
    const itemDemand = ingredientDemandFromCartItem(item, producto);

    for (const [productoId, cantidad] of Object.entries(itemDemand)) {
      demand[productoId] = (demand[productoId] || 0) + cantidad;
    }
  }

  return demand;
}

/** Máximo de unidades de un combo que el carrito puede sostener con el stock actual. */
export function getComboMaxInCart(producto, cart, productosById) {
  if (!producto?.esCombo) {
    return producto?.stock ?? 0;
  }

  if (!producto.comboComoCombo?.length) {
    return 0;
  }

  const demand = getIngredientDemandInCart(cart, productosById);
  const currentQty = cart.find((item) => item.productoId === producto.id)?.cantidad || 0;

  let maxQty = Infinity;

  for (const det of producto.comboComoCombo) {
    const ing = det.producto;
    const stock = ing?.stock ?? 0;
    const totalDemand = demand[det.productoId] || 0;
    const demandWithoutThis = totalDemand - det.cantidad * currentQty;
    const available = stock - demandWithoutThis;
    maxQty = Math.min(maxQty, Math.floor(available / det.cantidad));
  }

  if (maxQty === Infinity) return 0;
  return Math.max(0, maxQty);
}

/** Cuántas unidades más se pueden agregar de un combo al carrito. */
export function getComboAvailableToAdd(producto, cart, productosById) {
  const maxInCart = getComboMaxInCart(producto, cart, productosById);
  const currentQty = cart.find((item) => item.productoId === producto.id)?.cantidad || 0;
  return Math.max(0, maxInCart - currentQty);
}

/** Ingrediente que limita la preparación del combo (para mensajes en POS). */
export function getComboLimitingIngredient(producto, cart, productosById) {
  if (!producto?.esCombo || !producto.comboComoCombo?.length) {
    return null;
  }

  const demand = getIngredientDemandInCart(cart, productosById);
  const currentQty = cart.find((item) => item.productoId === producto.id)?.cantidad || 0;
  let limiting = null;
  let minMax = Infinity;

  for (const det of producto.comboComoCombo) {
    const ing = det.producto;
    const stock = ing?.stock ?? 0;
    const totalDemand = demand[det.productoId] || 0;
    const demandWithoutThis = totalDemand - det.cantidad * currentQty;
    const available = stock - demandWithoutThis;
    const maxFromIngredient = Math.floor(available / det.cantidad);

    if (maxFromIngredient < minMax) {
      minMax = maxFromIngredient;
      limiting = ing;
    }
  }

  return limiting;
}

export function canIncreaseCartItem(producto, cart, productosById, nextQuantity) {
  if (!producto?.esCombo) {
    return nextQuantity <= (producto?.stock ?? 0);
  }

  return nextQuantity <= getComboMaxInCart(producto, cart, productosById);
}
