'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardModule, ModulePanel } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';

const HISTORY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'abierta', label: 'Abiertos' },
  { id: 'cerrada', label: 'Cerrados' },
];

export default function CajaPage() {
  const { data: session, status } = useSession();
  const [turnos, setTurnos] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');

  const [isAperturaOpen, setIsAperturaOpen] = useState(false);
  const [isRetiroOpen, setIsRetiroOpen] = useState(false);
  const [isCierreOpen, setIsCierreOpen] = useState(false);

  const [montoApertura, setMontoApertura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [montoRetiro, setMontoRetiro] = useState('');
  const [motivoRetiro, setMotivoRetiro] = useState('');
  const [montoCierreReal, setMontoCierreReal] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function loadCajaData() {
    try {
      const openRes = await fetch('/api/caja?checkOpen=true');
      const openJson = await openRes.json();
      if (openJson && !openJson.error) {
        setCajaAbierta(openJson);
      } else {
        setCajaAbierta(null);
      }

      const listRes = await fetch('/api/caja');
      const listJson = await listRes.json();
      setTurnos(listJson);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol?.permisos?.caja) {
      loadCajaData();
    }
  }, [status, session]);

  const filteredTurnos = useMemo(() => {
    if (historyFilter === 'all') return turnos;
    return turnos.filter((t) => t.estado === historyFilter);
  }, [turnos, historyFilter]);

  const historyStats = useMemo(() => {
    const cerrados = turnos.filter((t) => t.estado === 'cerrada');
    const conDiferencia = cerrados.filter(
      (t) => t.diferencia !== null && parseFloat(t.diferencia) !== 0
    );
    return { total: turnos.length, abiertos: turnos.filter((t) => t.estado === 'abierta').length, conDiferencia: conDiferencia.length };
  }, [turnos]);

  if (status === 'loading') {
    return (
      <DashboardModule title="Caja">
        <div className="glass-panel state-panel--centered">
          <div className="spinner" aria-hidden="true" />
          <p>Cargando información de sesión...</p>
        </div>
      </DashboardModule>
    );
  }

  const permisos = session?.user?.rol?.permisos || {};
  if (!permisos.caja) {
    return (
      <DashboardModule title="Acceso denegado">
        <div className="glass-panel state-panel--denied">
          <AlertTriangle size={48} className="text-warning" />
          <h2>No tienes permiso para acceder a la caja</h2>
          <p>Esta sección está restringida. Contacta a un administrador si necesitas permisos.</p>
        </div>
      </DashboardModule>
    );
  }

  const resetError = () => setErrorMsg('');

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!montoApertura) {
      setErrorMsg('Indica el monto inicial en caja.');
      return;
    }

    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoApertura, observaciones }),
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsAperturaOpen(false);
        setMontoApertura('');
        setObservaciones('');
        loadCajaData();
      }
    } catch (e) {
      setErrorMsg('Error de red al abrir el turno.');
    }
  };

  const handleRetiro = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!montoRetiro || !motivoRetiro) {
      setErrorMsg('Monto y motivo son obligatorios.');
      return;
    }

    try {
      const res = await fetch(`/api/caja?id=${cajaAbierta.id}&action=withdraw`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoRetiro, motivo: motivoRetiro }),
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsRetiroOpen(false);
        setMontoRetiro('');
        setMotivoRetiro('');
        loadCajaData();
      }
    } catch (e) {
      setErrorMsg('Error de red al registrar el retiro.');
    }
  };

  const handleCierre = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!montoCierreReal) {
      setErrorMsg('Indica cuánto efectivo hay en caja al cerrar.');
      return;
    }

    try {
      const res = await fetch(`/api/caja?id=${cajaAbierta.id}&action=close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoCierreReal, observacionesCierre }),
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsCierreOpen(false);
        setMontoCierreReal('');
        setObservacionesCierre('');
        loadCajaData();
      }
    } catch (e) {
      setErrorMsg('Error de red al cerrar el turno.');
    }
  };

  const headers = ['Cajero', 'Apertura', 'Cierre', 'Apertura $', 'Esperado', 'Real', 'Diferencia', 'Retiros', 'Estado'];

  return (
    <DashboardModule title="Caja" className="dashboard-page--stack">
      <div className="caja-page">
        <p className="caja-page__hint">
          <strong>Turno de caja</strong> — abre antes de vender en POS. Al cerrar, cuenta el efectivo
          real y el sistema calcula la diferencia contra lo esperado.
        </p>

        <section
          className={`caja-turno animate-fade-in${cajaAbierta ? ' is-open' : ' is-closed'}`}
          aria-label="Estado del turno actual"
        >
          {cajaAbierta ? (
            <>
              <div className="caja-turno__top">
                <div className="caja-turno__status">
                  <p className="caja-turno__eyebrow">Turno activo</p>
                  <h2 className="caja-turno__title">Caja abierta</h2>
                  <p className="caja-turno__meta">
                    Desde {formatDate(cajaAbierta.fechaApertura)}
                    {session?.user?.name ? ` · ${session.user.name}` : ''}
                  </p>
                </div>
                <div className="caja-turno__actions">
                  <button
                    type="button"
                    onClick={() => { resetError(); setIsRetiroOpen(true); }}
                    className="btn btn-secondary"
                  >
                    <MinusCircle size={16} />
                    <span>Registrar retiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetError(); setIsCierreOpen(true); }}
                    className="btn btn-danger"
                  >
                    <span>Cerrar turno</span>
                  </button>
                </div>
              </div>

              <div className="caja-turno__metrics">
                <div className="caja-metric caja-metric--primary">
                  <span className="caja-metric__value">{formatCurrency(cajaAbierta.montoApertura)}</span>
                  <span className="caja-metric__label">Monto inicial</span>
                </div>
                <div className="caja-metric">
                  <span className="caja-metric__value is-negative">
                    {formatCurrency(cajaAbierta.retiros)}
                  </span>
                  <span className="caja-metric__label">Retiros</span>
                </div>
                <div className="caja-metric">
                  <span className="caja-metric__value">#{cajaAbierta.id}</span>
                  <span className="caja-metric__label">Turno</span>
                </div>
              </div>
            </>
          ) : (
            <div className="caja-turno__cta">
              <div className="caja-turno__status">
                <p className="caja-turno__eyebrow">Sin turno activo</p>
                <h2 className="caja-turno__title">Caja cerrada</h2>
                <p className="caja-turno__cta-copy">
                  Abre un turno con el efectivo inicial en caja para habilitar ventas en el punto de venta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { resetError(); setIsAperturaOpen(true); }}
                className="btn btn-success"
              >
                <PlusCircle size={16} />
                <span>Abrir turno</span>
              </button>
            </div>
          )}
        </section>

        <ModulePanel loading={loading} loadingMessage="Cargando historial...">
          <div className="caja-history">
            <div className="caja-history__head">
              <div>
                <h3 className="caja-history__title">Historial de turnos</h3>
                <p className="caja-turno__meta" style={{ marginTop: 4 }}>
                  {historyStats.total} turnos
                  {historyStats.conDiferencia > 0 && (
                    <> · {historyStats.conDiferencia} con diferencia al cierre</>
                  )}
                </p>
              </div>
              <div className="caja-history__filters" role="group" aria-label="Filtrar historial">
                {HISTORY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`caja-filter-btn${historyFilter === filter.id ? ' is-active' : ''}`}
                    onClick={() => setHistoryFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="caja-history-table">
              <Table
                headers={headers}
                data={filteredTurnos}
                emptyTitle="Sin turnos"
                emptyDescription="No hay turnos que coincidan con este filtro."
                renderRow={(turno) => {
                  const diff = turno.diferencia !== null ? parseFloat(turno.diferencia) : null;
                  const isCurrent = cajaAbierta?.id === turno.id;
                  const hasDiscrepancy = diff !== null && diff !== 0;

                  return (
                    <tr
                      key={turno.id}
                      className={`${isCurrent ? 'is-current' : ''}${hasDiscrepancy ? ' has-discrepancy' : ''}`}
                    >
                      <td className="col-cajero">{turno.usuario?.nombre || '—'}</td>
                      <td className="col-date">{formatDate(turno.fechaApertura)}</td>
                      <td className="col-date">
                        {turno.fechaCierre ? formatDate(turno.fechaCierre) : '—'}
                      </td>
                      <td className="col-money">{formatCurrency(turno.montoApertura)}</td>
                      <td className="col-money">
                        {turno.montoCierreEsperado ? formatCurrency(turno.montoCierreEsperado) : '—'}
                      </td>
                      <td className="col-money">
                        {turno.montoCierreReal ? formatCurrency(turno.montoCierreReal) : '—'}
                      </td>
                      <td className={`col-money col-diff${diff !== null && diff < 0 ? ' text-danger' : diff > 0 ? ' text-success' : ''}`}>
                        {diff !== null ? formatCurrency(turno.diferencia) : '—'}
                      </td>
                      <td className="col-money">{formatCurrency(turno.retiros)}</td>
                      <td>
                        <span className={`badge ${turno.estado === 'abierta' ? 'badge-success' : 'badge-danger'}`}>
                          {turno.estado === 'abierta' ? 'Abierto' : 'Cerrado'}
                        </span>
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>
        </ModulePanel>
      </div>

      <Modal isOpen={isAperturaOpen} onClose={() => setIsAperturaOpen(false)} title="Abrir turno">
        <form onSubmit={handleAbrirCaja} className="caja-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          <p className="caja-form__note">
            Cuenta el efectivo que hay en caja al iniciar el día o el turno. Ese monto es la base del arqueo.
          </p>
          <div className="form-group">
            <label className="label-field" htmlFor="caja-apertura">Monto inicial en caja</label>
            <input
              id="caja-apertura"
              type="number"
              step="0.01"
              required
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
              className="input-field"
              placeholder="Ej. 100000"
            />
          </div>
          <div className="form-group">
            <label className="label-field" htmlFor="caja-apertura-obs">Notas</label>
            <textarea
              id="caja-apertura-obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="input-field"
              rows="2"
              placeholder="Opcional"
            />
          </div>
          <footer className="caja-form__footer">
            <button type="button" onClick={() => setIsAperturaOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">Abrir turno</button>
          </footer>
        </form>
      </Modal>

      <Modal isOpen={isRetiroOpen} onClose={() => setIsRetiroOpen(false)} title="Registrar retiro">
        <form onSubmit={handleRetiro} className="caja-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          <p className="caja-form__note">
            Registra cuando sacas efectivo de caja (depósito, pago a proveedor, etc.).
          </p>
          <div className="form-group">
            <label className="label-field" htmlFor="caja-retiro-monto">Monto del retiro</label>
            <input
              id="caja-retiro-monto"
              type="number"
              step="0.01"
              required
              value={montoRetiro}
              onChange={(e) => setMontoRetiro(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="label-field" htmlFor="caja-retiro-motivo">Motivo</label>
            <input
              id="caja-retiro-motivo"
              type="text"
              required
              value={motivoRetiro}
              onChange={(e) => setMotivoRetiro(e.target.value)}
              className="input-field"
              placeholder="Ej. Depósito bancario"
            />
          </div>
          <footer className="caja-form__footer">
            <button type="button" onClick={() => setIsRetiroOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger">Confirmar retiro</button>
          </footer>
        </form>
      </Modal>

      <Modal isOpen={isCierreOpen} onClose={() => setIsCierreOpen(false)} title="Cerrar turno">
        <form onSubmit={handleCierre} className="caja-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          <p className="caja-form__note">
            Cuenta todo el efectivo en caja. El sistema compara este monto con lo esperado según ventas y retiros.
          </p>
          <div className="form-group">
            <label className="label-field" htmlFor="caja-cierre-real">Efectivo real en caja</label>
            <input
              id="caja-cierre-real"
              type="number"
              step="0.01"
              required
              value={montoCierreReal}
              onChange={(e) => setMontoCierreReal(e.target.value)}
              className="input-field"
              placeholder="Total contado"
            />
          </div>
          <div className="form-group">
            <label className="label-field" htmlFor="caja-cierre-obs">Notas de cierre</label>
            <textarea
              id="caja-cierre-obs"
              value={observacionesCierre}
              onChange={(e) => setObservacionesCierre(e.target.value)}
              className="input-field"
              rows="2"
              placeholder="Opcional — explica diferencias si las hay"
            />
          </div>
          <footer className="caja-form__footer">
            <button type="button" onClick={() => setIsCierreOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger">Arquear y cerrar</button>
          </footer>
        </form>
      </Modal>
    </DashboardModule>
  );
}
