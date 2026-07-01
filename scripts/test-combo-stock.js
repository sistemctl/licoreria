/**
 * Pruebas rápidas de lógica de stock para combos.
 * Uso: node scripts/test-combo-stock.js
 */
async function main() {
  const {
    getComboMaxInCart,
    getComboAvailableToAdd,
    canIncreaseCartItem,
  } = await import('../src/lib/comboStock.js');

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  const cerveza = { id: 1, nombre: 'Cerveza Aguila', stock: 5, esCombo: false };
  const michelada = {
    id: 10,
    nombre: 'Michelada sencilla',
    esCombo: true,
    comboComoCombo: [{ productoId: 1, cantidad: 1, producto: cerveza }],
  };

  const productosById = { 1: cerveza, 10: michelada };

  assert(getComboMaxInCart(michelada, [], productosById) === 5, 'Debe permitir hasta 5 micheladas');
  assert(getComboAvailableToAdd(michelada, [], productosById) === 5, 'Debe poder agregar 5 al carrito vacío');

  const cartConDos = [{ productoId: 10, cantidad: 2 }];
  assert(getComboMaxInCart(michelada, cartConDos, productosById) === 5, 'Máximo total sigue siendo 5');
  assert(getComboAvailableToAdd(michelada, cartConDos, productosById) === 3, 'Quedan 3 por agregar');
  assert(
    canIncreaseCartItem(michelada, cartConDos, productosById, 6) === false,
    'No debe permitir 6 micheladas con stock 5'
  );

  console.log('OK: pruebas de comboStock pasaron.');
}

main().catch((error) => {
  console.error('FALLÓ:', error.message);
  process.exit(1);
});
