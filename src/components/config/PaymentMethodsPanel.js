'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_PAYMENT_METHODS,
  createCustomPaymentMethod,
} from '@/lib/paymentMethods';

export default function PaymentMethodsPanel({ methods, onChange }) {
  const [newLabel, setNewLabel] = useState('');
  const [formError, setFormError] = useState('');

  const updateMethod = (id, patch) => {
    onChange(
      methods.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const moveMethod = (id, direction) => {
    const index = methods.findIndex((m) => m.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= methods.length) return;

    const next = [...methods];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((m, i) => ({ ...m, orden: i })));
  };

  const removeMethod = (id) => {
    const method = methods.find((m) => m.id === id);
    if (!method || method.protegido) return;
    onChange(methods.filter((m) => m.id !== id).map((m, i) => ({ ...m, orden: i })));
  };

  const addMethod = () => {
    setFormError('');
    const label = newLabel.trim();
    if (!label) {
      setFormError('Escribe un nombre para el método de pago.');
      return;
    }
    if (methods.some((m) => m.label.toLowerCase() === label.toLowerCase())) {
      setFormError('Ya existe un método con ese nombre.');
      return;
    }

    const created = createCustomPaymentMethod(
      label,
      methods.map((m) => m.id)
    );
    onChange([...methods, { ...created, orden: methods.length }]);
    setNewLabel('');
  };

  const resetDefaults = () => {
    if (!confirm('¿Restaurar los métodos de pago predeterminados? Se perderán los personalizados.')) return;
    onChange([...DEFAULT_PAYMENT_METHODS]);
  };

  return (
    <section className="config-block config-block--fill config-block--flush">
      <div className="config-block__head">
        <h3 className="config-block__title">Métodos de pago</h3>
        <p className="config-block__desc">
          Define cómo pueden pagar tus clientes en el POS, cuáles cuentan en el arqueo de caja y cuáles aparecen al registrar abonos.
        </p>
      </div>

      <div className="payment-methods-list">
        {methods.map((method, index) => (
          <div
            key={method.id}
            className={`payment-method-row ${!method.activo ? 'payment-method-row--inactive' : ''}`}
          >
            <div className="payment-method-row__order">
              <button
                type="button"
                className="btn btn-ghost btn-icon payment-method-row__move"
                onClick={() => moveMethod(method.id, -1)}
                disabled={index === 0}
                aria-label="Subir"
              >
                ↑
              </button>
              <GripVertical size={14} aria-hidden="true" />
              <button
                type="button"
                className="btn btn-ghost btn-icon payment-method-row__move"
                onClick={() => moveMethod(method.id, 1)}
                disabled={index === methods.length - 1}
                aria-label="Bajar"
              >
                ↓
              </button>
            </div>

            <div className="payment-method-row__main">
              <input
                type="text"
                value={method.label}
                onChange={(e) => updateMethod(method.id, { label: e.target.value })}
                className="input-field"
                disabled={method.protegido && (method.esCredito || method.esMixto || method.id === 'efectivo')}
              />
              <span className="payment-method-row__id">{method.id}</span>
              {method.esCredito && <span className="payment-method-row__tag">Crédito</span>}
              {method.esMixto && <span className="payment-method-row__tag">Mixto</span>}
            </div>

            <div className="payment-method-row__toggles">
              <label className="payment-method-toggle" title="Visible en POS y abonos">
                <input
                  type="checkbox"
                  checked={method.activo}
                  onChange={(e) => updateMethod(method.id, { activo: e.target.checked })}
                  disabled={method.esMixto}
                />
                <span>Activo</span>
              </label>
              {!method.esCredito && !method.esMixto && (
                <>
                  <label className="payment-method-toggle" title="Suma al efectivo esperado al cerrar caja">
                    <input
                      type="checkbox"
                      checked={method.afectaCaja}
                      onChange={(e) =>
                        updateMethod(method.id, {
                          afectaCaja: e.target.checked,
                          requiereCambio: e.target.checked ? method.requiereCambio : false,
                        })
                      }
                    />
                    <span>Caja</span>
                  </label>
                  <label className="payment-method-toggle" title="Pide monto recibido y calcula cambio (POS)">
                    <input
                      type="checkbox"
                      checked={method.requiereCambio}
                      onChange={(e) =>
                        updateMethod(method.id, {
                          requiereCambio: e.target.checked,
                          afectaCaja: e.target.checked ? true : method.afectaCaja,
                        })
                      }
                      disabled={method.id !== 'efectivo'}
                    />
                    <span>Cambio</span>
                  </label>
                  <label className="payment-method-toggle" title="Disponible al registrar abonos">
                    <input
                      type="checkbox"
                      checked={method.permiteAbono}
                      onChange={(e) => updateMethod(method.id, { permiteAbono: e.target.checked })}
                    />
                    <span>Abonos</span>
                  </label>
                </>
              )}
            </div>

            {!method.protegido && (
              <button
                type="button"
                className="btn btn-ghost btn-icon payment-method-row__delete"
                onClick={() => removeMethod(method.id)}
                aria-label={`Eliminar ${method.label}`}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="payment-methods-add">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="input-field"
          placeholder="Ej. Bancolombia, PSE, Bold…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addMethod();
            }
          }}
        />
        <button type="button" className="btn btn-secondary" onClick={addMethod}>
          <Plus size={16} />
          <span>Agregar método</span>
        </button>
      </div>

      {formError && (
        <div className="toast-inline toast-inline--error payment-methods-error">
          <AlertTriangle size={14} />
          <span>{formError}</span>
        </div>
      )}

      <p className="field-hint payment-methods-hint">
        <strong>Caja:</strong> solo los métodos marcados suman al arqueo de efectivo.
        <strong> Mixto</strong> divide el total entre los métodos activos (excepto crédito).
        Los métodos protegidos (efectivo, crédito, mixto) no se pueden eliminar.
      </p>

      <button type="button" className="btn btn-ghost btn-sm payment-methods-reset" onClick={resetDefaults}>
        Restaurar predeterminados
      </button>
    </section>
  );
}
