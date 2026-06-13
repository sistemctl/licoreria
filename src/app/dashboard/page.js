'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
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

  const { metrics = {}, charts = {}, tables = {} } = reportData || {};

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
        <div className="glass-panel metric-card">
          <div className="metric-icon gold-bg">
            <DollarSign size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Ventas (Últimos 30 días)</p>
            <h3 className="metric-value">{formatCurrency(metrics.totalVentasMonto)}</h3>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon green-bg">
            <TrendingUp size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Transacciones (30d)</p>
            <h3 className="metric-value">{metrics.cantidadVentas || 0}</h3>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon red-bg">
            <ShoppingBag size={24} />
          </div>
          <div className="metric-details">
            <p className="metric-label">Compras Realizadas (30d)</p>
            <h3 className="metric-value">{formatCurrency(metrics.totalComprasMonto)}</h3>
          </div>
        </div>

        <div className="glass-panel metric-card">
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
      `}</style>
    </div>
  );
}
