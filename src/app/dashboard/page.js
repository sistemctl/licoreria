'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { 
  SalesLineChart, 
  TopProductsBarChart, 
  SalesByCategoryPieChart, 
  PaymentMethodsPieChart 
} from '@/components/Charts';
import { formatCurrency } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function DashboardHome() {
  const [reportData, setReportData] = useState(null);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch reportes
        const repRes = await fetch('/api/reportes');
        const repJson = await repRes.json();
        setReportData(repJson);

        // Fetch caja
        const cajaRes = await fetch('/api/caja?checkOpen=true');
        const cajaJson = await cajaRes.json();
        if (cajaJson && !cajaJson.error) {
          setCajaAbierta(cajaJson);
        } else {
          setCajaAbierta(null);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información del dashboard...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 70vh;
            gap: 16px;
          }
          .spinner {
            border: 4px solid rgba(212, 168, 83, 0.1);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: var(--accent-gold);
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const { metrics = {}, charts = {}, tables = {}, details = {} } = reportData || {};

  return (
    <div className="dashboard-home">
      <Header title="Inicio" />

      {/* Alerta de Caja Cerrada */}
      {!cajaAbierta && (
        <div className="alert-banner warning-banner animate-fade-in">
          <div className="alert-content">
            <AlertTriangle size={20} />
            <div>
              <h4>¡Atención! Turno de caja cerrado</h4>
              <p>Debes abrir un turno de caja antes de poder registrar ventas en el POS.</p>
            </div>
          </div>
          <Link href="/dashboard/caja" className="btn btn-primary alert-btn">
            <span>Ir a Caja</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid-cols-4">
        <div 
          className="glass-panel metric-card" 
          onClick={() => setActiveModal('ventas')} 
          style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        >
          <div className="metric-icon gold-bg">
            <DollarSign size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Ventas (Últimos 30 días)</p>
            <h3 className="metric-value">{formatCurrency(metrics.totalVentasMonto)}</h3>
          </div>
        </div>

        <div 
          className="glass-panel metric-card" 
          onClick={() => setActiveModal('transacciones')} 
          style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        >
          <div className="metric-icon green-bg">
            <TrendingUp size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Transacciones (30d)</p>
            <h3 className="metric-value">{metrics.cantidadVentas || 0}</h3>
          </div>
        </div>

        <div 
          className="glass-panel metric-card" 
          onClick={() => setActiveModal('compras')} 
          style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        >
          <div className="metric-icon red-bg">
            <ShoppingBag size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Compras Realizadas (30d)</p>
            <h3 className="metric-value">{formatCurrency(metrics.totalComprasMonto)}</h3>
          </div>
        </div>

        <div 
          className="glass-panel metric-card" 
          onClick={() => setActiveModal('creditos')} 
          style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        >
          <div className="metric-icon orange-bg">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Cuentas por Cobrar</p>
            <h3 className="metric-value">{formatCurrency(metrics.totalPendienteCobro)}</h3>
          </div>
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="grid-cols-2">
        <div className="glass-panel chart-container">
          <h4>Ventas Diarias (Últimos 30 Días)</h4>
          <div className="chart-wrapper">
            <SalesLineChart labels={charts.lineLabels} data={charts.lineData} />
          </div>
        </div>

        <div className="glass-panel chart-container">
          <h4>Top 10 Productos Más Vendidos</h4>
          <div className="chart-wrapper">
            <TopProductsBarChart labels={charts.barLabels} data={charts.barData} />
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
        <div className="glass-panel chart-container">
          <h4>Ventas por Categoría</h4>
          <div className="chart-wrapper">
            <SalesByCategoryPieChart labels={charts.pieCategoryLabels} data={charts.pieCategoryData} />
          </div>
        </div>

        <div className="glass-panel chart-container">
          <h4>Ventas por Método de Pago</h4>
          <div className="chart-wrapper">
            <PaymentMethodsPieChart labels={charts.piePayLabels} data={charts.piePayData} />
          </div>
        </div>
      </div>

      {/* Tablas Críticas de Inventario y Lotes */}
      <div className="grid-cols-2">
        <div className="glass-panel table-panel">
          <div className="panel-title-bar">
            <AlertTriangle size={18} className="text-danger" />
            <h4>Stock Crítico (Mínimo o Inferior)</h4>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {tables.criticosList && tables.criticosList.length > 0 ? (
                  tables.criticosList.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.categoria?.nombre}</td>
                      <td className="text-danger font-bold">{p.stock}</td>
                      <td>{p.stockMinimo}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center italic text-secondary">
                      No hay productos con stock crítico.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel table-panel">
          <div className="panel-title-bar">
            <Clock size={18} className="text-warning" />
            <h4>Lotes Próximos a Vencer (30 días)</h4>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Lote #</th>
                  <th>Producto</th>
                  <th>Vencimiento</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {tables.lotesProximos && tables.lotesProximos.length > 0 ? (
                  tables.lotesProximos.map((l) => (
                    <tr key={l.id}>
                      <td>{l.numeroLote || 'N/A'}</td>
                      <td>{l.producto?.nombre}</td>
                      <td className="text-warning font-bold">
                        {new Date(l.fechaVencimiento).toLocaleDateString('es-ES')}
                      </td>
                      <td>{l.cantidad}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center italic text-secondary">
                      No hay lotes próximos a vencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Ventas */}
      <Modal 
        isOpen={activeModal === 'ventas'} 
        onClose={() => setActiveModal(null)} 
        title="Detalle de Ventas (Últimos 30 días)"
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Total Recaudado:</span>
              <span className="summary-val text-success font-bold">{formatCurrency(metrics.totalVentasMonto)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-lbl">Ticket Promedio:</span>
              <span className="summary-val font-bold">
                {formatCurrency(metrics.totalVentasMonto / (metrics.cantidadVentas || 1))}
              </span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Últimas 5 Ventas Registradas
          </h4>
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px' }}>Venta ID</th>
                  <th style={{ padding: '8px 12px' }}>Cliente</th>
                  <th style={{ padding: '8px 12px' }}>Método</th>
                  <th style={{ padding: '8px 12px' }} className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {details.latestVentas && details.latestVentas.length > 0 ? (
                  details.latestVentas.map(v => (
                    <tr key={v.id}>
                      <td style={{ padding: '8px 12px' }}><strong>#{v.id}</strong></td>
                      <td style={{ padding: '8px 12px' }}>{v.cliente?.nombre || 'General/Mostrador'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {v.metodoPago}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }} className="text-right font-bold">{formatCurrency(v.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center italic text-secondary" style={{ padding: '12px' }}>
                      No hay ventas registradas recientemente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Link href="/dashboard/ventas" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Ver Historial Completo
            </Link>
          </div>
        </div>
      </Modal>

      {/* Modal de Transacciones */}
      <Modal 
        isOpen={activeModal === 'transacciones'} 
        onClose={() => setActiveModal(null)} 
        title="Desglose de Transacciones (30d)"
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Transacciones Exitosas:</span>
              <span className="summary-val font-bold text-success">{metrics.cantidadVentas || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-lbl">Frecuencia:</span>
              <span className="summary-val text-secondary">Aprox. {((metrics.cantidadVentas || 0) / 30).toFixed(1)} / día</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '16px', lineHeight: '1.5' }}>
            Esta métrica representa el número de órdenes cerradas correctamente en tu punto de venta en el mes actual. Puedes hacer un seguimiento detallado, anular tickets o consultar comprobantes en la sección de Ventas.
          </p>
          <div style={{ marginTop: '24px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Cerrar
            </button>
            <Link href="/dashboard/pos" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Ir al POS
            </Link>
          </div>
        </div>
      </Modal>

      {/* Modal de Compras */}
      <Modal 
        isOpen={activeModal === 'compras'} 
        onClose={() => setActiveModal(null)} 
        title="Detalle de Compras (Últimos 30 días)"
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Inversión en Inventario:</span>
              <span className="summary-val text-danger font-bold">{formatCurrency(metrics.totalComprasMonto)}</span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Últimos 5 Abastecimientos de Mercancía
          </h4>
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px' }}>Factura #</th>
                  <th style={{ padding: '8px 12px' }}>Proveedor</th>
                  <th style={{ padding: '8px 12px' }} className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {details.latestCompras && details.latestCompras.length > 0 ? (
                  details.latestCompras.map(c => (
                    <tr key={c.id}>
                      <td style={{ padding: '8px 12px' }}><strong>{c.numFacturaProveedor || `Compra #${c.id}`}</strong></td>
                      <td style={{ padding: '8px 12px' }}>{c.proveedor?.nombre}</td>
                      <td style={{ padding: '8px 12px' }} className="text-right font-bold">{formatCurrency(c.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center italic text-secondary" style={{ padding: '12px' }}>
                      No hay compras registradas recientemente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Link href="/dashboard/compras" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Ver Todos los Abastecimientos
            </Link>
          </div>
        </div>
      </Modal>

      {/* Modal de Créditos */}
      <Modal 
        isOpen={activeModal === 'creditos'} 
        onClose={() => setActiveModal(null)} 
        title="Detalle de Cuentas por Cobrar"
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Saldo Total Pendiente:</span>
              <span className="summary-val text-warning font-bold">{formatCurrency(metrics.totalPendienteCobro)}</span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Líneas de Crédito Activas (Clientes)
          </h4>
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px' }}>Cliente</th>
                  <th style={{ padding: '8px 12px' }}>Vence</th>
                  <th style={{ padding: '8px 12px' }} className="text-right">Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {details.latestCuentasCobrar && details.latestCuentasCobrar.length > 0 ? (
                  details.latestCuentasCobrar.map(cc => (
                    <tr key={cc.id}>
                      <td style={{ padding: '8px 12px' }}><strong>{cc.cliente?.nombre}</strong></td>
                      <td style={{ padding: '8px 12px' }}>
                        {cc.fechaLimite ? new Date(cc.fechaLimite).toLocaleDateString('es-ES') : 'Sin límite'}
                      </td>
                      <td style={{ padding: '8px 12px' }} className="text-right font-bold text-warning">
                        {formatCurrency(cc.saldoPendiente)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center italic text-secondary" style={{ padding: '12px' }}>
                      No hay cuentas por cobrar pendientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Link href="/dashboard/cuentas-por-cobrar" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Gestionar Créditos y Abonos
            </Link>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .dashboard-home {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .alert-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-radius: 12px;
          border: 1px dashed;
        }

        .warning-banner {
          background: rgba(245, 158, 11, 0.08);
          border-color: var(--warning-orange);
          color: var(--text-primary);
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .alert-content h4 {
          color: var(--warning-orange);
          margin-bottom: 2px;
          font-size: 15px;
        }

        .alert-content p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .alert-btn {
          padding: 8px 16px;
          font-size: 13px;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
        }

        .metric-icon {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gold-bg { background: rgba(212, 168, 83, 0.15); color: var(--accent-gold); }
        .green-bg { background: rgba(34, 197, 94, 0.15); color: var(--success-green); }
        .red-bg { background: rgba(239, 68, 68, 0.15); color: var(--error-red); }
        .orange-bg { background: rgba(245, 158, 11, 0.15); color: var(--warning-orange); }

        .metric-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
        }

        .chart-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-container h4 {
          font-size: 16px;
          color: var(--accent-gold);
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          padding-bottom: 8px;
        }

        .chart-wrapper {
          position: relative;
          height: 300px;
        }

        .table-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .panel-title-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          padding-bottom: 8px;
        }

        .panel-title-bar h4 {
          font-size: 16px;
          color: var(--text-primary);
        }

        .text-danger { color: var(--error-red); }
        .text-warning { color: var(--warning-orange); }
        .font-bold { font-weight: 600; }

        .modal-drilldown-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .drilldown-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          background: rgba(212, 168, 83, 0.04);
          border: 1px solid rgba(212, 168, 83, 0.12);
          padding: 16px;
          border-radius: 8px;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .summary-lbl {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }
        .summary-val {
          font-size: 18px;
          font-weight: 700;
        }
        .text-right {
          text-align: right;
        }
      `}</style>
    </div>
  );
}
