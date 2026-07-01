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

export function formatDateTimeCompact(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
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
