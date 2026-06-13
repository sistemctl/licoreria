export function formatCurrency(amount, symbol = '$') {
  if (amount === null || amount === undefined) return `${symbol}0.00`;
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${parsed.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
