export const METODOS_PAGO_KEY = 'metodos_pago';

/** @typedef {{ id: string, label: string, activo: boolean, afectaCaja: boolean, requiereCambio: boolean, esCredito: boolean, esMixto: boolean, permiteAbono: boolean, protegido: boolean, orden: number }} PaymentMethod */

export const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'efectivo',
    label: 'Efectivo',
    activo: true,
    afectaCaja: true,
    requiereCambio: true,
    esCredito: false,
    esMixto: false,
    permiteAbono: true,
    protegido: true,
    orden: 0,
  },
  {
    id: 'tarjeta',
    label: 'Tarjeta (Débito/Crédito)',
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: false,
    esMixto: false,
    permiteAbono: true,
    protegido: false,
    orden: 1,
  },
  {
    id: 'transferencia',
    label: 'Transferencia bancaria',
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: false,
    esMixto: false,
    permiteAbono: true,
    protegido: false,
    orden: 2,
  },
  {
    id: 'nequi',
    label: 'Nequi',
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: false,
    esMixto: false,
    permiteAbono: true,
    protegido: false,
    orden: 3,
  },
  {
    id: 'daviplata',
    label: 'Daviplata',
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: false,
    esMixto: false,
    permiteAbono: true,
    protegido: false,
    orden: 4,
  },
  {
    id: 'credito',
    label: 'Crédito (a cuenta de cliente)',
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: true,
    esMixto: false,
    permiteAbono: false,
    protegido: true,
    orden: 90,
  },
  {
    id: 'mixto',
    label: 'Pago mixto',
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: false,
    esMixto: true,
    permiteAbono: false,
    protegido: true,
    orden: 99,
  },
];

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28);
}

function normalizeMethod(raw, index = 0) {
  const fallback = DEFAULT_PAYMENT_METHODS[index] || DEFAULT_PAYMENT_METHODS[0];
  const id = slugify(raw?.id || raw?.label || fallback.id) || fallback.id;

  return {
    id,
    label: String(raw?.label || fallback.label).trim() || fallback.label,
    activo: raw?.activo !== false,
    afectaCaja: Boolean(raw?.afectaCaja),
    requiereCambio: Boolean(raw?.requiereCambio),
    esCredito: Boolean(raw?.esCredito),
    esMixto: Boolean(raw?.esMixto),
    permiteAbono: raw?.permiteAbono !== false,
    protegido: Boolean(raw?.protegido),
    orden: Number.isFinite(raw?.orden) ? raw.orden : index,
  };
}

/** @returns {PaymentMethod[]} */
export function parsePaymentMethods(raw) {
  if (!raw) return [...DEFAULT_PAYMENT_METHODS];

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_PAYMENT_METHODS];

    const methods = parsed.map((item, index) => normalizeMethod(item, index));
    const hasEfectivo = methods.some((m) => m.id === 'efectivo');
    const hasCredito = methods.some((m) => m.esCredito);
    const hasMixto = methods.some((m) => m.esMixto);

    if (!hasEfectivo) methods.unshift(DEFAULT_PAYMENT_METHODS[0]);
    if (!hasCredito) methods.push(DEFAULT_PAYMENT_METHODS.find((m) => m.esCredito));
    if (!hasMixto) methods.push(DEFAULT_PAYMENT_METHODS.find((m) => m.esMixto));

    return methods.sort((a, b) => a.orden - b.orden);
  } catch {
    return [...DEFAULT_PAYMENT_METHODS];
  }
}

export function serializePaymentMethods(methods) {
  return JSON.stringify(methods);
}

/** @param {PaymentMethod[]} methods */
export function getMethodById(id, methods) {
  return methods.find((m) => m.id === id);
}

/** @param {PaymentMethod[]} methods */
export function getActivePosMethods(methods) {
  return methods.filter((m) => m.activo);
}

/** @param {PaymentMethod[]} methods */
export function getAbonoMethods(methods) {
  return methods.filter((m) => m.activo && m.permiteAbono && !m.esCredito && !m.esMixto);
}

/** @param {PaymentMethod[]} methods */
export function getMixtoSplitMethods(methods) {
  return methods.filter((m) => m.activo && !m.esCredito && !m.esMixto);
}

/** @param {PaymentMethod[]} methods */
export function getMethodLabel(id, methods) {
  const method = getMethodById(id, methods);
  if (method) return method.label;
  return String(id || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolvePaymentMethodId(labelOrId, methods) {
  const byId = getMethodById(labelOrId, methods);
  if (byId) return byId.id;
  const normalized = String(labelOrId || '').toLowerCase();
  const byLabel = methods.find((m) => m.label.toLowerCase() === normalized);
  if (byLabel) return byLabel.id;
  return normalized;
}

export function parseMontosPago(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function sumMontosPago(montos) {
  return Object.values(montos || {}).reduce((acc, val) => acc + parseFloat(val || 0), 0);
}

/** @param {PaymentMethod[]} methods */
export function buildLegacyAmounts(metodoPago, total, montosPago, methods) {
  const montos = parseMontosPago(montosPago);
  const amount = parseFloat(total || 0);

  if (metodoPago === 'mixto') {
    const transferIds = new Set(
      methods
        .filter((m) => !m.esCredito && !m.esMixto && m.id !== 'efectivo' && m.id !== 'tarjeta')
        .map((m) => m.id)
    );

    let montoEfectivo = parseFloat(montos.efectivo || 0);
    let montoTarjeta = parseFloat(montos.tarjeta || 0);
    let montoTransferencia = 0;

    for (const [id, val] of Object.entries(montos)) {
      if (transferIds.has(id)) montoTransferencia += parseFloat(val || 0);
    }

    return { montoEfectivo, montoTarjeta, montoTransferencia };
  }

  return {
    montoEfectivo: metodoPago === 'efectivo' ? amount : 0,
    montoTarjeta: metodoPago === 'tarjeta' ? amount : 0,
    montoTransferencia: ['transferencia', 'nequi', 'daviplata'].includes(metodoPago)
      ? amount
      : methods.some((m) => m.id === metodoPago && m.id !== 'efectivo' && m.id !== 'tarjeta' && !m.esCredito && !m.esMixto)
        ? amount
        : 0,
  };
}

/** @param {PaymentMethod[]} methods */
export function computeCajaCashFromVenta(venta, methods) {
  const total = parseFloat(venta.total || 0);

  if (venta.metodoPago === 'efectivo') {
    return total;
  }

  if (venta.metodoPago === 'mixto') {
    const montos = parseMontosPago(venta.montosPago);
    if (Object.keys(montos).length > 0) {
      return methods.reduce((acc, method) => {
        if (!method.afectaCaja) return acc;
        return acc + parseFloat(montos[method.id] || 0);
      }, 0);
    }
    return parseFloat(venta.montoEfectivo || 0);
  }

  const method = getMethodById(venta.metodoPago, methods);
  return method?.afectaCaja ? total : 0;
}

export function createCustomPaymentMethod(label, existingIds = []) {
  let base = slugify(label) || 'metodo';
  let id = base;
  let counter = 2;
  while (existingIds.includes(id)) {
    id = `${base}_${counter}`;
    counter += 1;
  }

  const maxOrden = existingIds.length;

  return {
    id,
    label: label.trim(),
    activo: true,
    afectaCaja: false,
    requiereCambio: false,
    esCredito: false,
    esMixto: false,
    permiteAbono: true,
    protegido: false,
    orden: maxOrden,
  };
}

export async function getPaymentMethodsFromDb(prisma) {
  const conf = await prisma.configuracion.findUnique({
    where: { clave: METODOS_PAGO_KEY },
  });
  return parsePaymentMethods(conf?.valor);
}
