'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useConfig } from '@/components/ConfigProvider';
import { DashboardModule, ModuleSection } from '@/components/layout';
import Modal from '@/components/Modal';
import { LoadingState, StatCard } from '@/components/ui';
import {
  SalesLineChart,
  TopProductsBarChart,
  SalesByCategoryPieChart,
  PaymentMethodsPieChart
} from '@/components/Charts';
import { formatCurrency } from '@/lib/utils';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { resolvePaymentMethodId } from '@/lib/paymentMethods';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Clock
} from 'lucide-react';

function CashierDashboard({ session, configs, cajaAbierta }) {
  return (
    <DashboardModule title="Inicio" className="dashboard-home">
      
      {/* Alerta de Caja Cerrada */}
      {!cajaAbierta && session?.user?.rol?.permisos?.pos && (
        <div className="alert-banner alert-banner--warning animate-fade-in">
          <div className="alert-banner__content">
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

      <div className="glass-panel welcome-card">
        <div className="welcome-avatar">
          {session?.user?.name ? session.user.name[0].toUpperCase() : 'U'}
        </div>
        <div>
          <h2>Hola, {session?.user?.name || 'Usuario'}</h2>
          <p>
            Estás en {configs.nombre_negocio || 'Mi Licorería'} como {session?.user?.rol?.nombre || 'Personal'}.
            Usa el menú para vender, abrir caja o revisar inventario.
          </p>
        </div>

        <div className="welcome-card__actions">
          {session?.user?.rol?.permisos?.pos && (
            <Link href="/dashboard/pos" className="btn btn-primary">
              <span>Ir al punto de venta</span>
              <ArrowRight size={16} />
            </Link>
          )}
          {session?.user?.rol?.permisos?.caja && (
            <Link href="/dashboard/caja" className="btn btn-secondary">
              Gestionar caja
            </Link>
          )}
        </div>
      </div>
    </DashboardModule>
  );
}

function AdminDashboard({ reportData, cajaAbierta, session, configs, activeModal, setActiveModal }) {
  const { methods, labelFor } = usePaymentMethods();
  const { metrics = {}, charts = {}, tables = {}, details = {} } = reportData || {};

  // Drilldown states for charts
  const [clickedChartData, setClickedChartData] = useState(null);
  const [chartModalType, setChartModalType] = useState(null); // 'category' | 'payment' | 'line' | 'bar'
  const [chartDetailLoading, setChartDetailLoading] = useState(false);
  const [chartDetailItems, setChartDetailItems] = useState([]);

  // Daily Sales Line Chart click
  const handleLineClick = async (data) => {
    setClickedChartData(data);
    setChartModalType('line');
    setChartDetailLoading(true);
    try {
      const res = await fetch('/api/ventas');
      const ventas = await res.json();
      const targetDate = data.label; // "YYYY-MM-DD"
      const filtered = (Array.isArray(ventas) ? ventas : []).filter(v => {
        const vDate = new Date(v.fecha).toISOString().split('T')[0];
        return vDate === targetDate;
      });
      setChartDetailItems(filtered);
    } catch (e) {
      console.error(e);
      setChartDetailItems([]);
    } finally {
      setChartDetailLoading(false);
    }
  };

  // Top Products Bar Chart click
  const handleBarClick = async (data) => {
    setClickedChartData(data);
    setChartModalType('bar');
    setChartDetailLoading(true);
    try {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(data.label)}`);
      const json = await res.json();
      const matched = json.find(p => p.nombre.toLowerCase() === data.label.toLowerCase()) || json[0];
      setChartDetailItems(matched ? [matched] : []);
    } catch (e) {
      console.error(e);
      setChartDetailItems([]);
    } finally {
      setChartDetailLoading(false);
    }
  };

  // Category Pie Chart click
  const handleCategoryClick = async (data) => {
    setClickedChartData(data);
    setChartModalType('category');
    setChartDetailLoading(true);
    try {
      const catRes = await fetch('/api/categorias');
      const cats = await catRes.json();
      const matchedCat = cats.find(c => c.nombre.toLowerCase() === data.label.toLowerCase());
      if (matchedCat) {
        const prodRes = await fetch(`/api/productos?categoriaId=${matchedCat.id}`);
        const prods = await prodRes.json();
        setChartDetailItems(prods);
      } else {
        setChartDetailItems([]);
      }
    } catch (e) {
      console.error(e);
      setChartDetailItems([]);
    } finally {
      setChartDetailLoading(false);
    }
  };

  // Payment Method Pie Chart click
  const handlePaymentClick = async (data) => {
    setClickedChartData(data);
    setChartModalType('payment');
    setChartDetailLoading(true);
    try {
      const res = await fetch('/api/ventas');
      const ventas = await res.json();
      const filtered = (Array.isArray(ventas) ? ventas : []).filter(
        (v) => v.metodoPago === resolvePaymentMethodId(data.label, methods)
      );
      setChartDetailItems(filtered);
    } catch (e) {
      console.error(e);
      setChartDetailItems([]);
    } finally {
      setChartDetailLoading(false);
    }
  };

  return (
    <DashboardModule title="Inicio" className="dashboard-home">

      {!cajaAbierta && (
        <div className="alert-banner alert-banner--warning animate-fade-in">
          <div className="alert-banner__content">
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

      <ModuleSection title="Resumen" meta="Últimos 30 días">
        <div className="metrics-grid">
          <StatCard
            label="Ventas"
            value={formatCurrency(metrics.totalVentasMonto)}
            icon={DollarSign}
            iconTone="brand"
            onClick={() => setActiveModal('ventas')}
          />
          <StatCard
            label="Transacciones"
            value={metrics.cantidadVentas || 0}
            icon={TrendingUp}
            iconTone="success"
            onClick={() => setActiveModal('transacciones')}
          />
          <StatCard
            label="Compras"
            value={formatCurrency(metrics.totalComprasMonto)}
            icon={ShoppingBag}
            iconTone="danger"
            onClick={() => setActiveModal('compras')}
          />
          <StatCard
            label="Por cobrar"
            value={formatCurrency(metrics.totalPendienteCobro)}
            icon={AlertTriangle}
            iconTone="warning"
            onClick={() => setActiveModal('creditos')}
          />
        </div>
      </ModuleSection>

      <ModuleSection title="Tendencias" meta="Clic para detalle">
        <div className="dashboard-section__stack">
      <div className="grid-cols-2">
        <div className="glass-panel chart-container">
          <h4>Ventas Diarias (Últimos 30 Días)</h4>
          <div className="chart-wrapper">
            <SalesLineChart labels={charts.lineLabels} data={charts.lineData} onChartClick={handleLineClick} />
          </div>
        </div>

        <div className="glass-panel chart-container">
          <h4>Top 10 Productos Más Vendidos</h4>
          <div className="chart-wrapper">
            <TopProductsBarChart labels={charts.barLabels} data={charts.barData} onChartClick={handleBarClick} />
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
        <div className="glass-panel chart-container">
          <h4>Ventas por Categoría</h4>
          <div className="chart-wrapper">
            <SalesByCategoryPieChart labels={charts.pieCategoryLabels} data={charts.pieCategoryData} onChartClick={handleCategoryClick} />
          </div>
        </div>

        <div className="glass-panel chart-container">
          <h4>Ventas por Método de Pago</h4>
          <div className="chart-wrapper">
            <PaymentMethodsPieChart labels={charts.piePayLabels} data={charts.piePayData} onChartClick={handlePaymentClick} />
          </div>
        </div>
      </div>
        </div>
      </ModuleSection>

      <ModuleSection title="Inventario crítico">
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
      </ModuleSection>

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
                          {labelFor(v.metodoPago)}
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

      {/* Modal Detalle de Categoría */}
      <Modal 
        isOpen={chartModalType === 'category'} 
        onClose={() => { setChartModalType(null); setClickedChartData(null); }} 
        title={`Productos en Categoría: ${clickedChartData?.label || ''}`}
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Ventas Totales Categoría:</span>
              <span className="summary-val text-success font-bold">{formatCurrency(clickedChartData?.value)}</span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Inventario en esta Categoría
          </h4>
          
          {chartDetailLoading ? (
            <p className="text-center py-4">Cargando productos...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>Producto</th>
                    <th style={{ padding: '8px 12px' }}>Precio Venta</th>
                    <th style={{ padding: '8px 12px' }} className="text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {chartDetailItems && chartDetailItems.length > 0 ? (
                    chartDetailItems.map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '8px 12px' }}><strong>{p.nombre}</strong></td>
                        <td style={{ padding: '8px 12px' }}>{formatCurrency(p.precioVentaDetal)}</td>
                        <td style={{ padding: '8px 12px' }} className={`text-right font-bold ${p.stock <= p.stockMinimo ? 'text-danger' : 'text-success'}`}>
                          {p.stock}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center italic text-secondary" style={{ padding: '12px' }}>
                        No hay productos registrados en esta categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Detalle de Ventas por Método de Pago */}
      <Modal 
        isOpen={chartModalType === 'payment'} 
        onClose={() => { setChartModalType(null); setClickedChartData(null); }} 
        title={`Ventas con Método: ${clickedChartData?.label || ''}`}
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Total Recaudado ({clickedChartData?.label}):</span>
              <span className="summary-val text-success font-bold">{formatCurrency(clickedChartData?.value)}</span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Transacciones Recientes
          </h4>
          
          {chartDetailLoading ? (
            <p className="text-center py-4">Cargando transacciones...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>Factura</th>
                    <th style={{ padding: '8px 12px' }}>Fecha</th>
                    <th style={{ padding: '8px 12px' }} className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {chartDetailItems && chartDetailItems.length > 0 ? (
                    chartDetailItems.slice(0, 10).map(v => (
                      <tr key={v.id}>
                        <td style={{ padding: '8px 12px' }}><strong>{v.numFactura}</strong></td>
                        <td style={{ padding: '8px 12px' }}>{new Date(v.fecha).toLocaleDateString('es-ES')}</td>
                        <td style={{ padding: '8px 12px' }} className="text-right font-bold text-success">
                          {formatCurrency(v.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center italic text-secondary" style={{ padding: '12px' }}>
                        No hay ventas registradas con este método de pago.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Detalle de Ventas del Día */}
      <Modal 
        isOpen={chartModalType === 'line'} 
        onClose={() => { setChartModalType(null); setClickedChartData(null); }} 
        title={`Ventas del Día: ${clickedChartData?.label || ''}`}
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Total Facturado este día:</span>
              <span className="summary-val text-success font-bold">{formatCurrency(clickedChartData?.value)}</span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Ventas Registradas
          </h4>
          
          {chartDetailLoading ? (
            <p className="text-center py-4">Cargando ventas...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>Factura</th>
                    <th style={{ padding: '8px 12px' }}>Hora</th>
                    <th style={{ padding: '8px 12px' }} className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {chartDetailItems && chartDetailItems.length > 0 ? (
                    chartDetailItems.map(v => (
                      <tr key={v.id}>
                        <td style={{ padding: '8px 12px' }}><strong>{v.numFactura}</strong></td>
                        <td style={{ padding: '8px 12px' }}>{new Date(v.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: '8px 12px' }} className="text-right font-bold text-success">
                          {formatCurrency(v.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center italic text-secondary" style={{ padding: '12px' }}>
                        No hay ventas registradas en esta fecha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Detalle de Producto Top */}
      <Modal 
        isOpen={chartModalType === 'bar'} 
        onClose={() => { setChartModalType(null); setClickedChartData(null); }} 
        title={`Detalle de Producto: ${clickedChartData?.label || ''}`}
      >
        <div className="modal-drilldown-content">
          <div className="drilldown-summary">
            <div className="summary-item">
              <span className="summary-lbl">Cantidad Vendida (30d):</span>
              <span className="summary-val text-success font-bold">{clickedChartData?.value} unidades</span>
            </div>
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: 'var(--accent-gold)' }}>
            Ficha del Producto
          </h4>
          
          {chartDetailLoading ? (
            <p className="text-center py-4">Cargando información...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <tbody>
                  {chartDetailItems && chartDetailItems.length > 0 ? (
                    chartDetailItems.map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><strong>Marca:</strong> {p.marca || 'N/A'}</div>
                            <div><strong>Precio Venta:</strong> {formatCurrency(p.precioVentaDetal)}</div>
                            <div><strong>Stock Actual:</strong> <span className={p.stock <= p.stockMinimo ? 'text-danger' : 'text-success'}>{p.stock} unidades</span></div>
                            <div><strong>Unidad Medida:</strong> {p.unidadMedida}</div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-center italic text-secondary" style={{ padding: '12px' }}>
                        No se encontró información para este producto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </DashboardModule>
  );
}

export default function DashboardHome() {
  const { data: session } = useSession();
  const { configs } = useConfig();
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
    return <LoadingState message="Cargando información del dashboard..." />;
  }

  const isAdmin = session?.user?.rol?.nombre === 'Administrador' || session?.user?.rol?.nombre === 'Superadministrador';

  if (!isAdmin) {
    return (
      <CashierDashboard 
        session={session} 
        configs={configs} 
        cajaAbierta={cajaAbierta} 
      />
    );
  }

  return (
    <AdminDashboard 
      reportData={reportData}
      cajaAbierta={cajaAbierta}
      session={session}
      configs={configs}
      activeModal={activeModal}
      setActiveModal={setActiveModal}
    />
  );
}
