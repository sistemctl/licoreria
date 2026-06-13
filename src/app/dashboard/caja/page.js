'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PlusCircle, MinusCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CajaPage() {
  const [turnos, setTurnos] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isAperturaOpen, setIsAperturaOpen] = useState(false);
  const [isRetiroOpen, setIsRetiroOpen] = useState(false);
  const [isCierreOpen, setIsCierreOpen] = useState(false);

  // Campos
  const [montoApertura, setMontoApertura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [montoRetiro, setMontoRetiro] = useState('');
  const [motivoRetiro, setMotivoRetiro] = useState('');
  const [montoCierreReal, setMontoCierreReal] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  async function loadCajaData() {
    try {
      // 1. Verificar si hay caja abierta
      const openRes = await fetch('/api/caja?checkOpen=true');
      const openJson = await openRes.json();
      if (openJson && !openJson.error) {
        setCajaAbierta(openJson);
      } else {
        setCajaAbierta(null);
      }

      // 2. Cargar historial
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
    loadCajaData();
  }, []);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!montoApertura) {
      setErrorMsg('Monto de apertura es obligatorio.');
      return;
    }

    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoApertura, observaciones })
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
      setErrorMsg('Error de red al abrir caja.');
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
        body: JSON.stringify({ montoRetiro, motivo: motivoRetiro })
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
      setErrorMsg('Error de red al procesar retiro.');
    }
  };

  const handleCierre = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!montoCierreReal) {
      setErrorMsg('Monto de cierre real es obligatorio.');
      return;
    }

    try {
      const res = await fetch(`/api/caja?id=${cajaAbierta.id}&action=close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoCierreReal, observacionesCierre })
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
      setErrorMsg('Error de red al cerrar la caja.');
    }
  };

  const headers = ['ID', 'Cajero', 'Apertura', 'Cierre', 'M. Apertura', 'M. Esperado', 'M. Real', 'Dif.', 'Retiros', 'Estado'];

  return (
    <div>
      <Header title="Control de Caja y Turnos" />

      {/* Panel de Estado Actual */}
      <div className="glass-panel state-panel">
        {cajaAbierta ? (
          <div className="caja-state open-state animate-fade-in">
            <div className="state-info">
              <CheckCircle size={32} className="text-success" />
              <div>
                <h3>Turno Abierto</h3>
                <p>Abierto el: {formatDate(cajaAbierta.fechaApertura)}</p>
                <p>Monto inicial: <strong>{formatCurrency(cajaAbierta.montoApertura)}</strong></p>
                <p>Retiros acumulados: <strong className="text-danger">{formatCurrency(cajaAbierta.retiros)}</strong></p>
              </div>
            </div>
            <div className="state-actions">
              <button onClick={() => { setErrorMsg(''); setIsRetiroOpen(true); }} className="btn btn-secondary">
                <MinusCircle size={16} />
                <span>Registrar Retiro</span>
              </button>
              <button onClick={() => { setErrorMsg(''); setIsCierreOpen(true); }} className="btn btn-danger">
                <span>Cerrar Turno de Caja</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="caja-state closed-state animate-fade-in">
            <div className="state-info">
              <AlertTriangle size={32} className="text-warning" />
              <div>
                <h3>Turno Cerrado</h3>
                <p>No hay un turno de caja abierto en este momento. Debes iniciar uno para registrar ventas.</p>
              </div>
            </div>
            <div className="state-actions">
              <button onClick={() => { setErrorMsg(''); setIsAperturaOpen(true); }} className="btn btn-success">
                <PlusCircle size={16} />
                <span>Abrir Turno de Caja</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Turnos */}
      <div className="glass-panel" style={{ marginTop: '24px' }}>
        <h4>Historial de Cajas</h4>
        <div style={{ marginTop: '16px' }}>
          {loading ? (
            <p>Cargando turnos...</p>
          ) : (
            <Table
              headers={headers}
              data={turnos}
              renderRow={(turno) => (
                <tr key={turno.id}>
                  <td>{turno.id}</td>
                  <td>{turno.usuario?.nombre}</td>
                  <td>{formatDate(turno.fechaApertura)}</td>
                  <td>{turno.fechaCierre ? formatDate(turno.fechaCierre) : '-'}</td>
                  <td>{formatCurrency(turno.montoApertura)}</td>
                  <td>{turno.montoCierreEsperado ? formatCurrency(turno.montoCierreEsperado) : '-'}</td>
                  <td>{turno.montoCierreReal ? formatCurrency(turno.montoCierreReal) : '-'}</td>
                  <td>
                    {turno.diferencia !== null ? (
                      <span className={parseFloat(turno.diferencia) >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(turno.diferencia)}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{formatCurrency(turno.retiros)}</td>
                  <td>
                    <span className={`badge ${turno.estado === 'abierta' ? 'badge-success' : 'badge-danger'}`}>
                      {turno.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      </div>

      {/* Modal Apertura */}
      <Modal isOpen={isAperturaOpen} onClose={() => setIsAperturaOpen(false)} title="Abrir Caja / Turno">
        <form onSubmit={handleAbrirCaja} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          <div className="form-group">
            <label className="label-field">Monto Inicial en Caja ($)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              value={montoApertura} 
              onChange={(e) => setMontoApertura(e.target.value)} 
              className="input-field" 
              placeholder="Ej. 100.00"
            />
          </div>
          <div className="form-group">
            <label className="label-field">Observaciones de Apertura</label>
            <textarea 
              value={observaciones} 
              onChange={(e) => setObservaciones(e.target.value)} 
              className="input-field" 
              rows="2"
            />
          </div>
          <div className="form-buttons">
            <button type="button" onClick={() => setIsAperturaOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Abrir Caja</button>
          </div>
        </form>
      </Modal>

      {/* Modal Retiro */}
      <Modal isOpen={isRetiroOpen} onClose={() => setIsRetiroOpen(false)} title="Registrar Retiro de Efectivo">
        <form onSubmit={handleRetiro} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          <div className="form-group">
            <label className="label-field">Monto del Retiro ($)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              value={montoRetiro} 
              onChange={(e) => setMontoRetiro(e.target.value)} 
              className="input-field" 
            />
          </div>
          <div className="form-group">
            <label className="label-field">Motivo / Descripción</label>
            <input 
              type="text" 
              required
              value={motivoRetiro} 
              onChange={(e) => setMotivoRetiro(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Pago a proveedor, depósito bancario"
            />
          </div>
          <div className="form-buttons">
            <button type="button" onClick={() => setIsRetiroOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-danger">Confirmar Retiro</button>
          </div>
        </form>
      </Modal>

      {/* Modal Cierre */}
      <Modal isOpen={isCierreOpen} onClose={() => setIsCierreOpen(false)} title="Cerrar Caja / Turno">
        <form onSubmit={handleCierre} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}
          <div className="form-group">
            <label className="label-field">Monto en Caja Real al Cierre ($)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              value={montoCierreReal} 
              onChange={(e) => setMontoCierreReal(e.target.value)} 
              className="input-field" 
              placeholder="Cuenta todo el efectivo disponible en caja"
            />
          </div>
          <div className="form-group">
            <label className="label-field">Observaciones de Cierre</label>
            <textarea 
              value={observacionesCierre} 
              onChange={(e) => setObservacionesCierre(e.target.value)} 
              className="input-field" 
              rows="2"
            />
          </div>
          <div className="form-buttons">
            <button type="button" onClick={() => setIsCierreOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-danger">Realizar Arqueo y Cerrar</button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .state-panel {
          border-color: rgba(212, 168, 83, 0.2);
        }

        .caja-state {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
        }

        .state-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .state-info h3 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .state-info p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .state-actions {
          display: flex;
          gap: 12px;
        }

        .text-success { color: var(--success-green); }
        .text-danger { color: var(--error-red); }
        .text-warning { color: var(--warning-orange); }

        .form-modal-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error-red);
          color: var(--error-red);
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
