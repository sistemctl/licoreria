'use client';

import { formatCurrency } from '@/lib/utils';
import { getActivePosMethods, getAbonoMethods } from '@/lib/paymentMethods';

export function BusinessTicketPreview({ nombreNegocio, rifNit, telefono, direccion, monedaSimbolo = '$' }) {
  const name = nombreNegocio?.trim() || 'Mi Licorería';

  return (
    <div className="config-preview config-preview--ticket">
      <div className="config-preview-ticket">
        <p className="config-preview-ticket__brand">{name}</p>
        {rifNit ? <p className="config-preview-ticket__line">RIF / NIT: {rifNit}</p> : null}
        {telefono ? <p className="config-preview-ticket__line">Tel: {telefono}</p> : null}
        {direccion ? <p className="config-preview-ticket__line">{direccion}</p> : null}
        <div className="config-preview-ticket__divider" />
        <p className="config-preview-ticket__meta">Factura FAC-000014 · 29/06/2026</p>
        <table className="config-preview-ticket__table">
          <tbody>
            <tr>
              <td>Ron añejo 750 ml</td>
              <td>{monedaSimbolo}45.000</td>
            </tr>
            <tr>
              <td>Cerveza lata</td>
              <td>{monedaSimbolo}3.500</td>
            </tr>
          </tbody>
        </table>
        <p className="config-preview-ticket__total">
          Total <strong>{monedaSimbolo}48.500</strong>
        </p>
        <p className="config-preview-ticket__foot">Estos datos aparecen en tickets y comprobantes.</p>
      </div>
    </div>
  );
}

export function InvoicePreview({ prefijoFactura, siguienteNumFactura, monedaSimbolo, impuestoPorcentaje }) {
  const prefix = prefijoFactura || 'FAC-';
  const nextNum = String(siguienteNumFactura || '1').padStart(6, '0');
  const tax = parseFloat(impuestoPorcentaje || 0);
  const subtotal = 100000;
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;
  const symbol = monedaSimbolo || '$';

  return (
    <div className="config-preview config-preview--invoice">
      <div className="config-preview-invoice">
        <span className="config-preview-invoice__eyebrow">Próxima factura</span>
        <p className="config-preview-invoice__number">
          {prefix}
          {nextNum}
        </p>
        <div className="config-preview-invoice__sample">
          <div className="config-preview-invoice__row">
            <span>Subtotal venta ejemplo</span>
            <span>{formatCurrency(subtotal, symbol)}</span>
          </div>
          {tax > 0 ? (
            <div className="config-preview-invoice__row">
              <span>Impuesto ({tax}%)</span>
              <span>{formatCurrency(taxAmount, symbol)}</span>
            </div>
          ) : (
            <p className="config-preview-invoice__note">Sin impuesto configurado.</p>
          )}
          <div className="config-preview-invoice__row config-preview-invoice__row--total">
            <span>Total</span>
            <span>{formatCurrency(total, symbol)}</span>
          </div>
        </div>
        <p className="config-preview-invoice__foot">
          El correlativo avanza automáticamente con cada venta registrada en el POS.
        </p>
      </div>
    </div>
  );
}

export function InventoryAlertPreview({ diasAlertaVencimiento }) {
  const dias = parseInt(diasAlertaVencimiento || '15', 10);

  return (
    <div className="config-preview config-preview--inventory">
      <div className="config-preview-alerts">
        <div className="config-preview-alert config-preview-alert--warn">
          <span className="config-preview-alert__tag">Vence pronto</span>
          <strong>Vino reserva 2019</strong>
          <span>Quedan {Math.max(1, dias - 3)} días</span>
        </div>
        <div className="config-preview-alert config-preview-alert--danger">
          <span className="config-preview-alert__tag">Bajo mínimo</span>
          <strong>Whisky 750 ml</strong>
          <span>2 unidades · mín. 6</span>
        </div>
        <div className="config-preview-alert config-preview-alert--ok">
          <span className="config-preview-alert__tag">Normal</span>
          <strong>Ron premium</strong>
          <span>Stock saludable</span>
        </div>
        <p className="config-preview-alerts__foot">
          Productos que vencen dentro de <strong>{dias} días</strong> se resaltan en el panel de inicio.
        </p>
      </div>
    </div>
  );
}

export function PaymentMethodsPreview({ methods }) {
  const pos = getActivePosMethods(methods);
  const abonos = getAbonoMethods(methods);

  return (
    <div className="config-preview config-preview--payments">
      <div className="config-preview-payments">
        <p className="config-preview-payments__group-label">En el POS</p>
        <ul className="config-preview-payments__list">
          {pos.map((m) => (
            <li key={m.id} className={m.esCredito ? 'config-preview-payments__item--credit' : ''}>
              {m.label}
              {m.esMixto ? ' · divide el total' : null}
            </li>
          ))}
        </ul>
        <p className="config-preview-payments__group-label">En abonos</p>
        <ul className="config-preview-payments__list config-preview-payments__list--compact">
          {abonos.length > 0 ? (
            abonos.map((m) => <li key={m.id}>{m.label}</li>)
          ) : (
            <li className="config-preview-payments__empty">Ninguno activo para abonos</li>
          )}
        </ul>
        <p className="config-preview-payments__foot">
          Los métodos marcados con <strong>Caja</strong> suman al arqueo de efectivo al cerrar turno.
        </p>
      </div>
    </div>
  );
}
