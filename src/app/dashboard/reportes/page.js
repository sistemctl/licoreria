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
import { Download, ShoppingCart } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportesPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30'); // 7 o 30 días
  
  const [clickedData, setClickedData] = useState(null);
  const [modalType, setModalType] = useState(null); // 'line', 'bar', 'category', 'payment'
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);

  const handleLineClick = async (data) => {
    setClickedData(data);
    setModalType('line');
    setDetailLoading(true);
    try {
      const [ventasRes, comprasRes] = await Promise.all([
        fetch('/api/ventas'),
        fetch('/api/compras')
      ]);
      const ventas = await ventasRes.json();
      const compras = await comprasRes.json();
      
      const targetDate = data.label; // "YYYY-MM-DD"
      
      const filteredVentas = (Array.isArray(ventas) ? ventas : []).filter(v => {
        const vDate = new Date(v.fecha).toISOString().split('T')[0];
        return vDate === targetDate;
      });
      
      const filteredCompras = (Array.isArray(compras) ? compras : []).filter(c => {
        const cDate = new Date(c.fecha).toISOString().split('T')[0];
        return cDate === targetDate;
      });
      
      setDetailItems({ ventas: filteredVentas, compras: filteredCompras });
    } catch (e) {
      console.error(e);
      setDetailItems({ ventas: [], compras: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBarClick = async (data) => {
    setClickedData(data);
    setModalType('bar');
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(data.label)}`);
      const json = await res.json();
      const matched = json.find(p => p.nombre.toLowerCase() === data.label.toLowerCase()) || json[0];
      setDetailItems(matched ? [matched] : []);
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCategoryClick = async (data) => {
    setClickedData(data);
    setModalType('category');
    setDetailLoading(true);
    try {
      const catRes = await fetch('/api/categorias');
      const cats = await catRes.json();
      const matchedCat = cats.find(c => c.nombre.toLowerCase() === data.label.toLowerCase());
      if (matchedCat) {
        const prodRes = await fetch(`/api/productos?categoriaId=${matchedCat.id}`);
        const prods = await prodRes.json();
        setDetailItems(prods);
      } else {
        setDetailItems([]);
      }
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePaymentClick = async (data) => {
    setClickedData(data);
    setModalType('payment');
    setDetailLoading(true);
    try {
      const res = await fetch('/api/ventas');
      const ventas = await res.json();
      const filtered = (Array.isArray(ventas) ? ventas : []).filter(
        v => v.metodoPago.toLowerCase() === data.label.toLowerCase()
      );
      setDetailItems(filtered);
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMetricClick = async (type) => {
    setModalType(type);
    setClickedData({ label: type === 'ingresos' ? 'Ingresos de Venta' : type === 'compras' ? 'Compras Realizadas' : type === 'margen' ? 'Margen Estimado' : 'Cartera a Crédito' });
    setDetailLoading(true);
    try {
      if (type === 'ingresos') {
        const res = await fetch('/api/ventas');
        const json = await res.json();
        setDetailItems(json);
      } else if (type === 'compras') {
        const res = await fetch('/api/compras');
        const json = await res.json();
        setDetailItems(json);
      } else if (type === 'credito') {
        const res = await fetch('/api/cuentas-por-cobrar');
        const json = await res.json();
        setDetailItems(Array.isArray(json) ? json.filter(c => c.estado === 'pendiente') : []);
      } else if (type === 'margen') {
        setDetailItems([]);
      }
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  async function loadReportes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes?range=${range}`);
      const json = await res.json();
      setReportData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportes();
  }, [range]);

  const handleExportPDF = () => {
    const docElement = document.getElementById('reportes-container-pdf');
    if (!docElement) return;

    html2canvas(docElement, { scale: 2, backgroundColor: '#0a0a0f' }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Reporte_Licoreria_Ultimos_${range}_dias.pdf`);
    });
  };

  if (loading && !reportData) {
    return (
      <div className="pos-loading">
        <div className="spinner"></div>
        <p>Cargando reportes y analíticas...</p>
      </div>
    );
  }

  const { metrics = {}, charts = {}, tables = {} } = reportData || {};

  return (
    <div>
      <Header title="Reportes y Estadísticas del Negocio" />

      {/* Acciones e Intervalo */}
      <div className="table-actions glass-panel">
        <div className="filter-group">
          <label className="label-field compact-label">Rango de Días</label>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)} 
            className="input-field compact-select"
          >
            <option value="7">Últimos 7 Días</option>
            <option value="30">Últimos 30 Días</option>
          </select>
        </div>

        <button onClick={handleExportPDF} className="btn btn-primary">
          <Download size={18} />
          <span>Exportar Reporte PDF</span>
        </button>
      </div>

      {/* Contenedor que se captura en el PDF */}
      <div id="reportes-container-pdf" className="reports-layout" style={{ marginTop: '24px' }}>
        
        {/* Metricas */}
        <div className="grid-cols-4">
          <div 
            className="glass-panel stat-box interactive-stat-box" 
            onClick={() => handleMetricClick('ingresos')}
          >
            <span className="stat-lbl">Ingresos Venta</span>
            <h3>{formatCurrency(metrics.totalVentasMonto)}</h3>
            <p className="text-success text-xs">Ventas en el rango seleccionado</p>
          </div>

          <div 
            className="glass-panel stat-box interactive-stat-box" 
            onClick={() => handleMetricClick('compras')}
          >
            <span className="stat-lbl">Compras Realizadas</span>
            <h3>{formatCurrency(metrics.totalComprasMonto)}</h3>
            <p className="text-danger text-xs">Inversión en mercadería</p>
          </div>

          <div 
            className="glass-panel stat-box interactive-stat-box" 
            onClick={() => handleMetricClick('margen')}
          >
            <span className="stat-lbl">Margen Estimado</span>
            <h3>{formatCurrency(parseFloat(metrics.totalVentasMonto || 0) - parseFloat(metrics.totalComprasMonto || 0))}</h3>
            <p className="text-xs text-secondary">Ingresos netos menos egresos</p>
          </div>

          <div 
            className="glass-panel stat-box interactive-stat-box" 
            onClick={() => handleMetricClick('credito')}
          >
            <span className="stat-lbl">Cartera a Crédito</span>
            <h3>{formatCurrency(metrics.totalPendienteCobro)}</h3>
            <p className="text-warning text-xs">Saldo total por cobrar</p>
          </div>
        </div>

        {/* Graficas */}
        <div className="grid-cols-2">
          <div className="glass-panel c-box">
            <h5>Gráfica de Tendencia de Ventas ($)</h5>
            <div className="c-wrapper">
              <SalesLineChart labels={charts.lineLabels} data={charts.lineData} onChartClick={handleLineClick} />
            </div>
          </div>

          <div className="glass-panel c-box">
            <h5>Top 10 Productos Más Demandados (Unidades)</h5>
            <div className="c-wrapper">
              <TopProductsBarChart labels={charts.barLabels} data={charts.barData} onChartClick={handleBarClick} />
            </div>
          </div>
        </div>

        <div className="grid-cols-2">
          <div className="glass-panel c-box">
            <h5>Ventas por Categoría de Producto ($)</h5>
            <div className="c-wrapper">
              <SalesByCategoryPieChart labels={charts.pieCategoryLabels} data={charts.pieCategoryData} onChartClick={handleCategoryClick} />
            </div>
          </div>

          <div className="glass-panel c-box">
            <h5>Distribución por Métodos de Pago ($)</h5>
            <div className="c-wrapper">
              <PaymentMethodsPieChart labels={charts.piePayLabels} data={charts.piePayData} onChartClick={handlePaymentClick} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals Interactivos de Perforación (Drill-down Modals) */}
      <Modal 
        isOpen={modalType !== null} 
        onClose={() => {
          setModalType(null);
          setClickedData(null);
          setDetailItems([]);
        }}
        title={
          modalType === 'line' ? `Detalle de Transacciones - ${clickedData?.label}` :
          modalType === 'bar' ? `Detalle de Producto - ${clickedData?.label}` :
          modalType === 'category' ? `Productos de la Categoría - ${clickedData?.label}` :
          modalType === 'payment' ? `Ventas con Método: ${clickedData?.label}` :
          modalType === 'ingresos' ? `Desglose de Ingresos por Venta` :
          modalType === 'compras' ? `Desglose de Compras Realizadas` :
          modalType === 'margen' ? `Detalle del Margen Estimado` :
          modalType === 'credito' ? `Detalle de Cartera a Crédito` : 'Detalles'
        }
      >
        {detailLoading ? (
          <div className="pos-loading" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
            <p>Cargando detalles...</p>
          </div>
        ) : (
          <div className="drilldown-modal-content">
            {modalType === 'ingresos' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>Total Ventas Acumuladas: <strong className="text-success">{formatCurrency(metrics.totalVentasMonto)}</strong></span>
                </div>
                <h4 className="section-title">Historial de Ventas Recientes</h4>
                {detailItems?.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>ID Venta</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Método Pago</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((v) => (
                          <tr key={v.id}>
                            <td>#{v.id}</td>
                            <td>{v.cliente?.nombre || 'General'}</td>
                            <td>{new Date(v.fecha).toLocaleDateString()}</td>
                            <td className="capitalize">{v.metodoPago}</td>
                            <td>{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No se encontraron ventas registradas.</p>
                )}
              </div>
            )}

            {modalType === 'compras' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>Total Compras Acumuladas: <strong className="text-danger">{formatCurrency(metrics.totalComprasMonto)}</strong></span>
                </div>
                <h4 className="section-title">Historial de Compras Recientes</h4>
                {detailItems?.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>ID Compra</th>
                          <th>Proveedor</th>
                          <th>Fecha</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((c) => (
                          <tr key={c.id}>
                            <td>#{c.id}</td>
                            <td>{c.proveedor?.nombre || 'N/A'}</td>
                            <td>{new Date(c.fecha).toLocaleDateString()}</td>
                            <td>{formatCurrency(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No se encontraron compras registradas.</p>
                )}
              </div>
            )}

            {modalType === 'margen' && (
              <div className="product-details-sheet">
                <div className="prod-sheet-grid">
                  <div className="sheet-item">
                    <span className="sheet-lbl">Ingresos Totales (Ventas)</span>
                    <span className="sheet-val text-success font-bold">{formatCurrency(metrics.totalVentasMonto)}</span>
                  </div>
                  <div className="sheet-item">
                    <span className="sheet-lbl">Egresos Totales (Compras)</span>
                    <span className="sheet-val text-danger font-bold">{formatCurrency(metrics.totalComprasMonto)}</span>
                  </div>
                  <div className="sheet-item full-width-sheet" style={{ marginTop: '12px' }}>
                    <span className="sheet-lbl">Margen Estimado Comercial</span>
                    <span className="sheet-val text-accent-gold" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {formatCurrency(parseFloat(metrics.totalVentasMonto || 0) - parseFloat(metrics.totalComprasMonto || 0))}
                    </span>
                  </div>
                  <div className="full-width-sheet" style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <p>El margen estimado se calcula restando el costo total de adquisición de mercancías (Compras Realizadas) del total de ingresos percibidos por el negocio (Ingresos Venta). Este cálculo no contempla otros costos operativos indirectos como arriendos o servicios.</p>
                  </div>
                </div>
              </div>
            )}

            {modalType === 'credito' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>Cartera Total por Cobrar: <strong className="text-warning">{formatCurrency(metrics.totalPendienteCobro)}</strong></span>
                </div>
                <h4 className="section-title">Cuentas por Cobrar Pendientes</h4>
                {detailItems?.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Total Original</th>
                          <th>Saldo Pendiente</th>
                          <th>Límite de Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((cc) => (
                          <tr key={cc.id}>
                            <td>{cc.cliente?.nombre || 'General'}</td>
                            <td>{formatCurrency(cc.montoTotal)}</td>
                            <td className="text-warning font-bold">{formatCurrency(cc.saldoPendiente)}</td>
                            <td>{cc.fechaLimite ? new Date(cc.fechaLimite).toLocaleDateString() : 'Sin fecha'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No hay deudas o cuentas por cobrar pendientes.</p>
                )}
              </div>
            )}

            {modalType === 'line' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>Total Ventas del Día: <strong className="text-success">{formatCurrency(clickedData?.value || 0)}</strong></span>
                </div>
                
                <h4 className="section-title">Ventas Realizadas</h4>
                {detailItems?.ventas?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>ID Venta</th>
                          <th>Cliente</th>
                          <th>Método Pago</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.ventas.map((v) => (
                          <tr key={v.id}>
                            <td>#{v.id}</td>
                            <td>{v.cliente?.nombre || 'General'}</td>
                            <td className="capitalize">{v.metodoPago}</td>
                            <td>{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No se registraron ventas en este día.</p>
                )}

                <h4 className="section-title" style={{ marginTop: '16px' }}>Compras Realizadas</h4>
                {detailItems?.compras?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>ID Compra</th>
                          <th>Proveedor</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.compras.map((c) => (
                          <tr key={c.id}>
                            <td>#{c.id}</td>
                            <td>{c.proveedor?.nombre || 'N/A'}</td>
                            <td>{formatCurrency(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No se registraron compras en este día.</p>
                )}
              </div>
            )}

            {modalType === 'bar' && (
              <div className="product-details-sheet">
                {detailItems?.length > 0 ? (
                  detailItems.map((prod) => (
                    <div key={prod.id} className="prod-sheet-grid">
                      <div className="sheet-item">
                        <span className="sheet-lbl">Nombre</span>
                        <span className="sheet-val">{prod.nombre}</span>
                      </div>
                      <div className="sheet-item">
                        <span className="sheet-lbl">Categoría</span>
                        <span className="sheet-val">{prod.categoria?.nombre || 'General'}</span>
                      </div>
                      <div className="sheet-item">
                        <span className="sheet-lbl">Stock Actual / Mínimo</span>
                        <span className={`sheet-val ${prod.stock <= prod.stockMinimo ? 'text-danger' : 'text-success'}`}>
                          {prod.stock} / {prod.stockMinimo} unidades
                        </span>
                      </div>
                      <div className="sheet-item">
                        <span className="sheet-lbl">Precio Venta (Detal)</span>
                        <span className="sheet-val">{formatCurrency(prod.precioVentaDetal)}</span>
                      </div>
                      <div className="sheet-item">
                        <span className="sheet-lbl">Precio Venta (Mayor)</span>
                        <span className="sheet-val">{formatCurrency(prod.precioVentaMayor)}</span>
                      </div>
                      <div className="sheet-item">
                        <span className="sheet-lbl">Código de Barras</span>
                        <span className="sheet-val font-mono">{prod.codigoBarras || 'N/A'}</span>
                      </div>
                      <div className="sheet-item full-width-sheet" style={{ marginTop: '12px' }}>
                        <span className="sheet-lbl">Demandados en Rango de Días</span>
                        <span className="sheet-val text-accent-gold" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {clickedData?.value} unidades vendidas
                        </span>
                      </div>
                      <div className="full-width-sheet" style={{ marginTop: '16px' }}>
                        <Link href="/dashboard/inventario" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                          Gestionar Inventario
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No se encontró información del producto.</p>
                )}
              </div>
            )}

            {modalType === 'category' && (
              <div className="category-details-sheet">
                <div className="summary-banner">
                  <span>Monto Total de Ventas en Categoría: <strong className="text-success">{formatCurrency(clickedData?.value || 0)}</strong></span>
                </div>
                <h4 className="section-title">Productos en esta Categoría</h4>
                {detailItems?.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Stock</th>
                          <th>Precio Detal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((prod) => (
                          <tr key={prod.id}>
                            <td>{prod.nombre}</td>
                            <td className={prod.stock <= prod.stockMinimo ? 'text-danger' : ''}>{prod.stock}</td>
                            <td>{formatCurrency(prod.precioVentaDetal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No hay productos en esta categoría.</p>
                )}
              </div>
            )}

            {modalType === 'payment' && (
              <div className="payment-details-sheet">
                <div className="summary-banner">
                  <span>Total Recibido por este Canal: <strong className="text-success">{formatCurrency(clickedData?.value || 0)}</strong></span>
                </div>
                <h4 className="section-title">Ventas Registradas</h4>
                {detailItems?.length > 0 ? (
                  <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="pos-table">
                      <thead>
                        <tr>
                          <th>ID Venta</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((v) => (
                          <tr key={v.id}>
                            <td>#{v.id}</td>
                            <td>{v.cliente?.nombre || 'General'}</td>
                            <td>{new Date(v.fecha).toLocaleString()}</td>
                            <td>{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No se encontraron ventas para este método de pago.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <style jsx>{`
        .table-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .compact-label {
          margin-bottom: 0;
          font-size: 11px;
        }

        .compact-select {
          padding: 8px 12px;
          width: 160px;
        }

        .reports-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .stat-box {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .interactive-stat-box {
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .interactive-stat-box:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(212, 168, 83, 0.4);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 168, 83, 0.1);
        }

        .interactive-stat-box:active {
          transform: translateY(-2px) scale(0.98);
        }

        .stat-lbl {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .text-success { color: var(--success-green); }
        .text-danger { color: var(--error-red); }
        .text-warning { color: var(--warning-orange); }
        .text-xs { font-size: 11px; }

        .c-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .c-box h5 {
          color: var(--accent-gold);
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          padding-bottom: 8px;
          font-size: 14px;
        }

        .c-wrapper {
          position: relative;
          height: 300px;
        }

        /* Drilldown Modal Styles */
        .drilldown-modal-content {
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-banner {
          background: rgba(212, 168, 83, 0.08);
          border: 1px solid rgba(212, 168, 83, 0.2);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-title {
          font-size: 13px;
          text-transform: uppercase;
          color: var(--accent-gold);
          letter-spacing: 0.05em;
          border-left: 2px solid var(--accent-gold);
          padding-left: 8px;
          margin-bottom: 8px;
        }

        .no-data {
          color: var(--text-secondary);
          font-size: 13px;
          font-style: italic;
          padding: 8px 0;
        }

        .product-details-sheet {
          padding: 8px 0;
        }

        .prod-sheet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .sheet-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .full-width-sheet {
          grid-column: span 2;
        }

        .sheet-lbl {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .sheet-val {
          font-size: 14px;
          color: var(--text-primary);
        }

        .text-accent-gold {
          color: var(--accent-gold);
        }
      `}</style>
    </div>
  );
}
