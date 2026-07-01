'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardModule } from '@/components/layout';
import Modal from '@/components/Modal';
import {
  SalesLineChart,
  TopProductsBarChart,
  SalesByCategoryPieChart,
  PaymentMethodsPieChart,
  SalesByHourBarChart,
  TopProfitProductsBarChart,
} from '@/components/Charts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { resolvePaymentMethodId } from '@/lib/paymentMethods';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

function formatPct(value) {
  return `${(value || 0).toFixed(1)}%`;
}

function formatVariacion(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function ReportesPage() {
  const { methods, labelFor } = usePaymentMethods();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  const [clickedData, setClickedData] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);

  const closeModal = () => {
    setModalType(null);
    setClickedData(null);
    setDetailItems([]);
  };

  const handleLineClick = async (data) => {
    setClickedData(data);
    setModalType('line');
    setDetailLoading(true);
    try {
      const [ventasRes, comprasRes] = await Promise.all([
        fetch('/api/ventas'),
        fetch('/api/compras'),
      ]);
      const ventas = await ventasRes.json();
      const compras = await comprasRes.json();
      const targetDate = data.label;
      setDetailItems({
        ventas: (Array.isArray(ventas) ? ventas : []).filter(
          (v) => new Date(v.fecha).toISOString().split('T')[0] === targetDate
        ),
        compras: (Array.isArray(compras) ? compras : []).filter(
          (c) => new Date(c.fecha).toISOString().split('T')[0] === targetDate
        ),
      });
    } catch (e) {
      console.error(e);
      setDetailItems({ ventas: [], compras: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleProductClick = async (data, modalKey = 'bar') => {
    setClickedData(data);
    setModalType(modalKey);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(data.label)}`);
      const json = await res.json();
      const matched =
        json.find((p) => p.nombre.toLowerCase() === data.label.toLowerCase()) || json[0];
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
      const matchedCat = cats.find((c) => c.nombre.toLowerCase() === data.label.toLowerCase());
      if (matchedCat) {
        const prodRes = await fetch(`/api/productos?categoriaId=${matchedCat.id}`);
        setDetailItems(await prodRes.json());
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
      setDetailItems(
        (Array.isArray(ventas) ? ventas : []).filter(
          (v) => v.metodoPago === resolvePaymentMethodId(data.label, methods)
        )
      );
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMetricClick = async (type) => {
    setModalType(type);
    const labels = {
      ingresos: 'Ingresos de venta',
      compras: 'Compras realizadas',
      utilidad: 'Utilidad estimada',
      credito: 'Cartera a crédito',
      ticket: 'Ticket promedio',
      stock: 'Stock crítico',
    };
    setClickedData({ label: labels[type] || 'Detalle' });
    setDetailLoading(true);
    try {
      if (type === 'ingresos' || type === 'ticket') {
        const res = await fetch('/api/ventas');
        setDetailItems(await res.json());
      } else if (type === 'compras') {
        const res = await fetch('/api/compras');
        setDetailItems(await res.json());
      } else if (type === 'credito') {
        const res = await fetch('/api/cuentas-por-cobrar');
        const json = await res.json();
        setDetailItems(Array.isArray(json) ? json.filter((c) => c.estado !== 'pagada') : []);
      } else if (type === 'utilidad') {
        setDetailItems(reportData?.tables?.topVendidosConStock || []);
      } else if (type === 'stock') {
        setDetailItems(reportData?.tables?.criticosList || []);
      }
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAlertClick = (type) => {
    setModalType(`alert-${type}`);
    const labels = {
      stock: 'Productos con stock crítico',
      vencimiento: 'Lotes próximos a vencer',
      credito: 'Cuentas por cobrar vencidas',
      caja: 'Turnos con diferencia en caja',
    };
    setClickedData({ label: labels[type] });
    const tables = reportData?.tables || {};
    if (type === 'stock') setDetailItems(tables.criticosList || []);
    else if (type === 'vencimiento') setDetailItems(tables.lotesProximos || []);
    else if (type === 'credito') setDetailItems(tables.cuentasVencidas || []);
    else if (type === 'caja')
      setDetailItems((tables.cajaReciente || []).filter((t) => t.diferencia !== null && t.diferencia !== 0));
  };

  async function loadReportes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes?range=${range}`);
      setReportData(await res.json());
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

    html2canvas(docElement, {
      scale: 2,
      backgroundColor: '#E8E5E0',
      useCORS: true,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
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
      pdf.save(`Reporte_Licoreria_${range}_dias.pdf`);
    });
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();

    const metricsRows = [
      ['Métrica', 'Período actual', 'Período anterior', 'Variación %'],
      ['Ventas', metrics.totalVentasMonto, comparativo.ventasAnterior, comparativo.ventasVariacion],
      ['Compras', metrics.totalComprasMonto, comparativo.comprasAnterior, comparativo.comprasVariacion],
      ['Ticket promedio', metrics.ticketPromedio, comparativo.ticketAnterior, null],
      ['Utilidad estimada', metrics.utilidadBrutaEstimada, null, null],
      ['Cartera pendiente', metrics.totalPendienteCobro, null, null],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metricsRows), 'Resumen');

    if (tables.reposicionSugerida?.length) {
      const repRows = [
        ['Producto', 'Categoría', 'Stock', 'Mínimo', 'Vendido', 'Sugerido comprar'],
        ...tables.reposicionSugerida.map((r) => [
          r.nombre,
          r.categoria,
          r.stock,
          r.stockMinimo,
          r.vendidoEnRango,
          r.sugerido,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(repRows), 'Reposición');
    }

    if (tables.bajaRotacion?.length) {
      const bajaRows = [
        ['Producto', 'Categoría', 'Stock', 'Precio venta'],
        ...tables.bajaRotacion.map((r) => [r.nombre, r.categoria, r.stock, r.precioVentaDetal]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bajaRows), 'Baja rotación');
    }

    if (tables.cuentasVencidas?.length) {
      const credRows = [
        ['Cliente', 'Saldo', 'Estado', 'Vence'],
        ...tables.cuentasVencidas.map((c) => [
          c.cliente,
          c.saldoPendiente,
          c.estado,
          c.fechaLimite ? formatDate(c.fechaLimite) : '—',
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(credRows), 'Cartera vencida');
    }

    XLSX.writeFile(wb, `Reporte_Licoreria_${range}_dias.xlsx`);
  };

  if (loading && !reportData) {
    return (
      <div className="pos-loading">
        <div className="spinner" />
        <p>Cargando reportes...</p>
      </div>
    );
  }

  const { metrics = {}, charts = {}, tables = {}, comparativo = {} } = reportData || {};

  const alertCount =
    (metrics.stockCriticoCount || 0) +
    (metrics.lotesPorVencerCount || 0) +
    (metrics.cuentasVencidasCount || 0) +
    (metrics.turnosConDiferenciaCount || 0);

  const hasActiveAlerts = alertCount > 0;

  const modalTitle =
    modalType === 'line'
      ? `Ventas del ${clickedData?.label}`
      : modalType === 'bar'
        ? `Producto: ${clickedData?.label}`
        : modalType === 'profit'
          ? `Rentabilidad: ${clickedData?.label}`
          : modalType === 'category'
            ? `Categoría: ${clickedData?.label}`
            : modalType === 'payment'
              ? `Pagos: ${clickedData?.label}`
              : clickedData?.label || 'Detalle';

  return (
    <DashboardModule title="Reportes" className="dashboard-home">
      <div id="reportes-container-pdf" className="reportes-page reports-layout">
        <header className="reportes-header">
          <div className="reportes-toolbar">
            <div className="reportes-toolbar__intro">
              <h2 className="reportes-toolbar__title">Corte de caja</h2>
              <p className="reportes-toolbar__period">
                Resumen de los últimos {range} días · clic en cifras para ver detalle
              </p>
            </div>
            <div className="reportes-toolbar__actions">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="input-field compact-select"
                aria-label="Rango de días"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
              </select>
              <button type="button" onClick={handleExportPDF} className="btn btn-secondary">
                <Download size={18} />
                <span>PDF</span>
              </button>
              <button type="button" onClick={handleExportExcel} className="btn btn-primary">
                <Download size={18} />
                <span>Excel</span>
              </button>
            </div>
          </div>

          <nav className="reportes-nav" aria-label="Secciones del reporte">
            <a href="#reportes-pulso" className="reportes-nav__link">Pulso</a>
            <a href="#reportes-alertas" className="reportes-nav__link">
              Alertas
              {hasActiveAlerts ? (
                <span className="reportes-nav__badge">{alertCount}</span>
              ) : null}
            </a>
            <a href="#reportes-ventas" className="reportes-nav__link">Ventas</a>
            <a href="#reportes-inventario" className="reportes-nav__link">Inventario</a>
            <a href="#reportes-cobros" className="reportes-nav__link">Cobros</a>
          </nav>
        </header>

        {/* Pulso — hero corte de caja */}
        <section id="reportes-pulso" className="reportes-block" aria-label="Pulso del negocio">
          <div className="reportes-hero">
            <div className="reportes-hero__main">
              <button
                type="button"
                className="reportes-hero__metric"
                onClick={() => handleMetricClick('ingresos')}
              >
                <span className="reportes-hero__eyebrow">Ingresos</span>
                <span className="reportes-hero__value">{formatCurrency(metrics.totalVentasMonto)}</span>
                <p className="reportes-hero__hint">
                  {metrics.cantidadVentas ?? 0} ventas en el período
                  {comparativo.ventasVariacion != null ? (
                    <span className={`reportes-variacion ${comparativo.ventasVariacion >= 0 ? 'is-up' : 'is-down'}`}>
                      {' '}· {formatVariacion(comparativo.ventasVariacion)} vs período anterior
                    </span>
                  ) : null}
                </p>
              </button>
              <div className="reportes-hero__rule" aria-hidden="true" />
              <button
                type="button"
                className="reportes-hero__metric reportes-hero__metric--right"
                onClick={() => handleMetricClick('utilidad')}
              >
                <span className="reportes-hero__eyebrow">Utilidad estimada</span>
                <span className="reportes-hero__value reportes-hero__value--profit">
                  {formatCurrency(metrics.utilidadBrutaEstimada)}
                </span>
                <p className="reportes-hero__hint">Margen {formatPct(metrics.margenPorcentaje)}</p>
              </button>
            </div>
            <div className="reportes-hero__strip">
              <button
                type="button"
                className="reportes-hero__strip-item"
                onClick={() => handleMetricClick('ticket')}
              >
                <span className="reportes-hero__strip-label">Ticket promedio</span>
                <span className="reportes-hero__strip-value">{formatCurrency(metrics.ticketPromedio)}</span>
                {comparativo.ticketAnterior > 0 ? (
                  <span className="reportes-hero__strip-sub">
                    Ant: {formatCurrency(comparativo.ticketAnterior)}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                className="reportes-hero__strip-item"
                onClick={() => handleMetricClick('compras')}
              >
                <span className="reportes-hero__strip-label">Compras</span>
                <span className="reportes-hero__strip-value">{formatCurrency(metrics.totalComprasMonto)}</span>
                {comparativo.comprasVariacion != null ? (
                  <span className={`reportes-hero__strip-sub ${comparativo.comprasVariacion >= 0 ? 'is-up' : 'is-down'}`}>
                    {formatVariacion(comparativo.comprasVariacion)}
                  </span>
                ) : (
                  <span className="reportes-hero__strip-sub">Mercadería</span>
                )}
              </button>
              <button
                type="button"
                className={`reportes-hero__strip-item${metrics.stockCriticoCount > 0 ? ' is-alert' : ''}`}
                onClick={() => handleMetricClick('stock')}
              >
                <span className="reportes-hero__strip-label">Stock crítico</span>
                <span className="reportes-hero__strip-value">{metrics.stockCriticoCount ?? 0}</span>
                <span className="reportes-hero__strip-sub">Bajo mínimo</span>
              </button>
              <button
                type="button"
                className="reportes-hero__strip-item"
                onClick={() => handleMetricClick('credito')}
              >
                <span className="reportes-hero__strip-label">Cartera</span>
                <span className="reportes-hero__strip-value">{formatCurrency(metrics.totalPendienteCobro)}</span>
                <span className="reportes-hero__strip-sub">Por cobrar</span>
              </button>
            </div>
          </div>
        </section>

        {/* Alertas */}
        <section id="reportes-alertas" className="reportes-block" aria-label="Alertas">
          <div className="reportes-block__head">
            <div className="reportes-block__head-text">
              <h3 className="reportes-section-title">Requiere atención</h3>
              <p className="reportes-section-meta">
                {hasActiveAlerts
                  ? `${alertCount} punto${alertCount !== 1 ? 's' : ''} para revisar hoy`
                  : 'Sin alertas pendientes en este período'}
              </p>
            </div>
          </div>
          {hasActiveAlerts ? (
            <div className="reportes-alertas reportes-alertas--compact">
              <div className={`reportes-alerta${metrics.stockCriticoCount > 0 ? ' is-critical' : ''}`}>
                <div className="reportes-alerta__head">
                  <h4 className="reportes-alerta__title">Stock crítico</h4>
                  <span className="reportes-alerta__count">{metrics.stockCriticoCount ?? 0}</span>
                </div>
                {(tables.criticosList || []).length > 0 ? (
                  <ul className="reportes-alerta__list">
                    {tables.criticosList.slice(0, 3).map((p) => (
                      <li key={p.id}>{p.nombre} — quedan {p.stock}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="reportes-alerta__empty">Sin alertas de stock</p>
                )}
                <button type="button" className="reportes-alerta__link" onClick={() => handleAlertClick('stock')}>
                  Ver inventario →
                </button>
              </div>

              <div className={`reportes-alerta${metrics.lotesPorVencerCount > 0 ? ' is-warning' : ''}`}>
                <div className="reportes-alerta__head">
                  <h4 className="reportes-alerta__title">Por vencer</h4>
                  <span className="reportes-alerta__count">{metrics.lotesPorVencerCount ?? 0}</span>
                </div>
                {(tables.lotesProximos || []).length > 0 ? (
                  <ul className="reportes-alerta__list">
                    {tables.lotesProximos.slice(0, 3).map((l) => (
                      <li key={l.id}>
                        {l.producto} — vence {l.fechaVencimiento ? formatDate(l.fechaVencimiento) : '—'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="reportes-alerta__empty">Sin lotes próximos</p>
                )}
                <button type="button" className="reportes-alerta__link" onClick={() => handleAlertClick('vencimiento')}>
                  Ver lotes →
                </button>
              </div>

              <div className={`reportes-alerta${metrics.cuentasVencidasCount > 0 ? ' is-warning' : ''}`}>
                <div className="reportes-alerta__head">
                  <h4 className="reportes-alerta__title">Crédito vencido</h4>
                  <span className="reportes-alerta__count">{metrics.cuentasVencidasCount ?? 0}</span>
                </div>
                {(tables.cuentasVencidas || []).length > 0 ? (
                  <ul className="reportes-alerta__list">
                    {tables.cuentasVencidas.slice(0, 3).map((c) => (
                      <li key={c.id}>
                        {c.cliente} — {formatCurrency(c.saldoPendiente)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="reportes-alerta__empty">Cartera al día</p>
                )}
                <button type="button" className="reportes-alerta__link" onClick={() => handleAlertClick('credito')}>
                  Ver cartera →
                </button>
              </div>

              <div className={`reportes-alerta${metrics.turnosConDiferenciaCount > 0 ? ' is-critical' : ''}`}>
                <div className="reportes-alerta__head">
                  <h4 className="reportes-alerta__title">Caja con diferencia</h4>
                  <span className="reportes-alerta__count">{metrics.turnosConDiferenciaCount ?? 0}</span>
                </div>
                {(tables.cajaReciente || []).filter((t) => t.diferencia).slice(0, 3).length > 0 ? (
                  <ul className="reportes-alerta__list">
                    {tables.cajaReciente
                      .filter((t) => t.diferencia)
                      .slice(0, 3)
                      .map((t) => (
                        <li key={t.id}>
                          {t.cajero} — dif. {formatCurrency(t.diferencia)}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="reportes-alerta__empty">Sin diferencias</p>
                )}
                <button type="button" className="reportes-alerta__link" onClick={() => handleAlertClick('caja')}>
                  Ver caja →
                </button>
              </div>
            </div>
          ) : (
            <p className="reportes-alertas-empty">Todo en orden. No hay stock crítico, vencimientos ni cartera atrasada.</p>
          )}
        </section>

        {/* Ventas + Cobros en dos columnas */}
        <div className="reportes-main-grid">
          <section id="reportes-ventas" className="reportes-block" aria-label="Ventas y demanda">
            <div className="reportes-block__head">
              <div className="reportes-block__head-text">
                <h3 className="reportes-section-title">Ventas y demanda</h3>
                <p className="reportes-section-meta">Tendencias del período · clic en gráfica para detalle</p>
              </div>
            </div>
            <div className="reportes-charts-stack">
              <div className="reportes-charts-row">
                <div className="glass-panel chart-container">
                  <h4>Ventas diarias</h4>
                  <div className="chart-wrapper">
                    <SalesLineChart labels={charts.lineLabels} data={charts.lineData} onChartClick={handleLineClick} />
                  </div>
                </div>
                <div className="glass-panel chart-container">
                  <h4>Ventas por hora</h4>
                  <div className="chart-wrapper">
                    <SalesByHourBarChart labels={charts.hourLabels} data={charts.hourData} />
                  </div>
                </div>
              </div>
              <div className="reportes-charts-row">
                <div className="glass-panel chart-container">
                  <h4>Top vendidos</h4>
                  <div className="chart-wrapper">
                    <TopProductsBarChart
                      labels={charts.barLabels}
                      data={charts.barData}
                      onChartClick={(d) => handleProductClick(d, 'bar')}
                    />
                  </div>
                </div>
                <div className="glass-panel chart-container">
                  <h4>Top rentables</h4>
                  <div className="chart-wrapper">
                    <TopProfitProductsBarChart
                      labels={charts.profitLabels}
                      data={charts.profitData}
                      onChartClick={(d) => handleProductClick(d, 'profit')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside id="reportes-cobros" className="reportes-aside" aria-label="Dinero y cobros">
            <div className="glass-panel reportes-cobros-panel">
              <h4 className="reportes-cobros-panel__title">Dinero y cobros</h4>
              <ul className="reportes-cobros-list">
                <li>
                  <span className="reportes-cobros-list__label">Efectivo</span>
                  <span className="reportes-cobros-list__value">{formatCurrency(metrics.totalEfectivo)}</span>
                </li>
                <li>
                  <span className="reportes-cobros-list__label">Digital / otros</span>
                  <span className="reportes-cobros-list__value">{formatCurrency(metrics.totalDigital)}</span>
                </li>
                <li>
                  <button type="button" onClick={() => handleMetricClick('credito')}>
                    <span className="reportes-cobros-list__label">Cartera pendiente</span>
                    <span className="reportes-cobros-list__value">{formatCurrency(metrics.totalPendienteCobro)}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="glass-panel chart-container chart-container--pie">
              <h4>Por categoría</h4>
              <div className="chart-wrapper">
                <SalesByCategoryPieChart
                  labels={charts.pieCategoryLabels}
                  data={charts.pieCategoryData}
                  onChartClick={handleCategoryClick}
                />
              </div>
            </div>

            <div className="glass-panel chart-container chart-container--pie">
              <h4>Métodos de pago</h4>
              <div className="chart-wrapper">
                <PaymentMethodsPieChart
                  labels={charts.piePayLabels}
                  data={charts.piePayData}
                  onChartClick={handlePaymentClick}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Inventario */}
        <section id="reportes-inventario" className="reportes-block" aria-label="Inventario inteligente">
          <div className="reportes-block__head">
            <div className="reportes-block__head-text">
              <h3 className="reportes-section-title">Inventario inteligente</h3>
              <p className="reportes-section-meta">Qué reponer y qué no está rotando</p>
            </div>
          </div>
          <div className="reportes-inventario-grid">
            <div className="glass-panel reportes-panel">
              <h4 className="reportes-panel__title">Reposición sugerida</h4>
              <div className="reportes-table-wrap">
                <table className="reportes-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Stock</th>
                      <th>Mín.</th>
                      <th>Vendido</th>
                      <th className="col-num">Sugerido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tables.reposicionSugerida || []).length > 0 ? (
                      tables.reposicionSugerida.map((p) => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td className={p.stock <= p.stockMinimo ? 'is-low' : ''}>{p.stock}</td>
                          <td>{p.stockMinimo}</td>
                          <td>{p.vendidoEnRango}</td>
                          <td className="col-num">{p.sugerido}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>Sin productos que requieran reposición urgente.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="glass-panel reportes-panel">
              <h4 className="reportes-panel__title">Baja rotación</h4>
              <div className="reportes-table-wrap">
                <table className="reportes-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th className="col-num">Stock</th>
                      <th className="col-num">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tables.bajaRotacion || []).length > 0 ? (
                      tables.bajaRotacion.map((p) => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>{p.categoria}</td>
                          <td className="col-num">{p.stock}</td>
                          <td className="col-num">{formatCurrency(p.precioVentaDetal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Todos los productos con stock vendieron en el período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal isOpen={modalType !== null} onClose={closeModal} title={modalTitle} size="lg">
        {detailLoading ? (
          <div className="pos-loading" style={{ minHeight: '200px' }}>
            <div className="spinner" />
            <p>Cargando detalle...</p>
          </div>
        ) : (
          <div className="drilldown-modal-content">
            {/* Ventas / ingresos / ticket */}
            {(modalType === 'ingresos' || modalType === 'ticket') && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Total: <strong className="text-success">{formatCurrency(metrics.totalVentasMonto)}</strong>
                    {' · '}
                    {metrics.cantidadVentas} ventas · ticket {formatCurrency(metrics.ticketPromedio)}
                  </span>
                </div>
                <h4 className="modal-section-title">Ventas del período</h4>
                {Array.isArray(detailItems) && detailItems.length > 0 ? (
                  <div className="reportes-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Factura</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Pago</th>
                          <th className="col-num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((v) => (
                          <tr key={v.id}>
                            <td>{v.numFactura || `#${v.id}`}</td>
                            <td>{v.cliente?.nombre || 'General'}</td>
                            <td>{formatDate(v.fecha)}</td>
                            <td>{labelFor(v.metodoPago)}</td>
                            <td className="col-num">{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin ventas en el período.</p>
                )}
              </div>
            )}

            {modalType === 'compras' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Compras: <strong className="text-danger">{formatCurrency(metrics.totalComprasMonto)}</strong>
                  </span>
                </div>
                <h4 className="modal-section-title">Compras del período</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Proveedor</th>
                          <th>Fecha</th>
                          <th className="col-num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((c) => (
                          <tr key={c.id}>
                            <td>{c.proveedor?.nombre || 'N/A'}</td>
                            <td>{formatDate(c.fecha)}</td>
                            <td className="col-num">{formatCurrency(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin compras registradas.</p>
                )}
              </div>
            )}

            {modalType === 'utilidad' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Utilidad estimada:{' '}
                    <strong className="text-success">{formatCurrency(metrics.utilidadBrutaEstimada)}</strong>
                    {' · '}Margen {formatPct(metrics.margenPorcentaje)}
                  </span>
                </div>
                <p className="caja-form__note" style={{ margin: '0 0 12px' }}>
                  Se calcula restando el costo de compra de cada producto vendido. No incluye gastos operativos.
                </p>
                <h4 className="modal-section-title">Top vendidos y stock actual</h4>
                <div className="reportes-table-wrap">
                  <table className="reportes-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Vendido</th>
                        <th>Stock</th>
                        <th>Mín.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailItems || []).map((p) => (
                        <tr key={p.nombre}>
                          <td>{p.nombre}</td>
                          <td>{p.vendido}</td>
                          <td className={p.stock <= p.stockMinimo ? 'is-low' : ''}>{p.stock}</td>
                          <td>{p.stockMinimo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {modalType === 'credito' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Pendiente: <strong className="text-warning">{formatCurrency(metrics.totalPendienteCobro)}</strong>
                  </span>
                </div>
                <h4 className="modal-section-title">Cuentas por cobrar</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th className="col-num">Saldo</th>
                          <th>Límite</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((cc) => (
                          <tr key={cc.id}>
                            <td>{cc.cliente?.nombre || '—'}</td>
                            <td className="col-num text-warning">{formatCurrency(cc.saldoPendiente)}</td>
                            <td>{cc.fechaLimite ? formatDate(cc.fechaLimite) : '—'}</td>
                            <td>{cc.estado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin cuentas pendientes.</p>
                )}
                <Link href="/dashboard/cuentas-por-cobrar" className="btn btn-primary" style={{ marginTop: 12 }}>
                  Gestionar cartera
                </Link>
              </div>
            )}

            {modalType === 'stock' && (
              <div className="drilldown-sections">
                <h4 className="modal-section-title">Productos bajo stock mínimo</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Categoría</th>
                          <th>Stock</th>
                          <th>Mín.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((p) => (
                          <tr key={p.id}>
                            <td>{p.nombre}</td>
                            <td>{p.categoria || '—'}</td>
                            <td className="is-low">{p.stock}</td>
                            <td>{p.stockMinimo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Inventario sin alertas críticas.</p>
                )}
                <Link href="/dashboard/inventario" className="btn btn-primary" style={{ marginTop: 12 }}>
                  Ir a inventario
                </Link>
              </div>
            )}

            {modalType === 'alert-vencimiento' && (
              <div className="drilldown-sections">
                <h4 className="modal-section-title">Lotes por vencer (30 días)</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cant.</th>
                          <th>Vence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((l) => (
                          <tr key={l.id}>
                            <td>{l.producto}</td>
                            <td>{l.cantidad}</td>
                            <td>{l.fechaVencimiento ? formatDate(l.fechaVencimiento) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin lotes próximos a vencer.</p>
                )}
              </div>
            )}

            {modalType === 'alert-credito' && (
              <div className="drilldown-sections">
                <h4 className="modal-section-title">Cuentas vencidas o atrasadas</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th className="col-num">Saldo</th>
                          <th>Límite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((c) => (
                          <tr key={c.id}>
                            <td>{c.cliente}</td>
                            <td className="col-num is-low">{formatCurrency(c.saldoPendiente)}</td>
                            <td>{c.fechaLimite ? formatDate(c.fechaLimite) : 'Sin fecha'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Cartera al día.</p>
                )}
                <Link href="/dashboard/cuentas-por-cobrar" className="btn btn-primary" style={{ marginTop: 12 }}>
                  Cobrar cartera
                </Link>
              </div>
            )}

            {modalType === 'alert-caja' && (
              <div className="drilldown-sections">
                <h4 className="modal-section-title">Turnos con diferencia en arqueo</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Cajero</th>
                          <th>Apertura</th>
                          <th>Estado</th>
                          <th className="col-num">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((t) => (
                          <tr key={t.id}>
                            <td>{t.cajero}</td>
                            <td>{formatDate(t.fechaApertura)}</td>
                            <td>{t.estado}</td>
                            <td className={`col-num${t.diferencia < 0 ? ' is-low' : ''}`}>
                              {formatCurrency(t.diferencia)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin diferencias en caja recientes.</p>
                )}
                <Link href="/dashboard/caja" className="btn btn-primary" style={{ marginTop: 12 }}>
                  Ver caja
                </Link>
              </div>
            )}

            {modalType === 'line' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Ventas del día: <strong>{formatCurrency(clickedData?.value || 0)}</strong>
                  </span>
                </div>
                <h4 className="modal-section-title">Ventas</h4>
                {detailItems?.ventas?.length > 0 ? (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Factura</th>
                          <th>Cliente</th>
                          <th>Pago</th>
                          <th className="col-num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.ventas.map((v) => (
                          <tr key={v.id}>
                            <td>{v.numFactura || `#${v.id}`}</td>
                            <td>{v.cliente?.nombre || 'General'}</td>
                            <td>{labelFor(v.metodoPago)}</td>
                            <td className="col-num">{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin ventas este día.</p>
                )}
              </div>
            )}

            {(modalType === 'bar' || modalType === 'profit') && detailItems?.length > 0 && (
              <div className="product-details-sheet">
                {detailItems.map((prod) => (
                  <div key={prod.id} className="prod-sheet-grid">
                    <div className="sheet-item">
                      <span className="sheet-lbl">Producto</span>
                      <span className="sheet-val">{prod.nombre}</span>
                    </div>
                    <div className="sheet-item">
                      <span className="sheet-lbl">Stock / mínimo</span>
                      <span className={`sheet-val ${prod.stock <= prod.stockMinimo ? 'text-danger' : 'text-success'}`}>
                        {prod.stock} / {prod.stockMinimo}
                      </span>
                    </div>
                    <div className="sheet-item">
                      <span className="sheet-lbl">Precio venta</span>
                      <span className="sheet-val">{formatCurrency(prod.precioVentaDetal)}</span>
                    </div>
                    <div className="sheet-item">
                      <span className="sheet-lbl">Costo compra</span>
                      <span className="sheet-val">{formatCurrency(prod.precioCompra)}</span>
                    </div>
                    {modalType === 'profit' && (
                      <div className="sheet-item full-width-sheet">
                        <span className="sheet-lbl">Utilidad estimada en período</span>
                        <span className="sheet-val text-accent-gold" style={{ fontSize: 18, fontWeight: 700 }}>
                          {formatCurrency(clickedData?.value || 0)}
                        </span>
                      </div>
                    )}
                    <div className="full-width-sheet" style={{ marginTop: 12 }}>
                      <Link href="/dashboard/inventario" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                        Gestionar en inventario
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {modalType === 'category' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Ventas en categoría: <strong>{formatCurrency(clickedData?.value || 0)}</strong>
                  </span>
                </div>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Stock</th>
                          <th className="col-num">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((prod) => (
                          <tr key={prod.id}>
                            <td>{prod.nombre}</td>
                            <td className={prod.stock <= prod.stockMinimo ? 'is-low' : ''}>{prod.stock}</td>
                            <td className="col-num">{formatCurrency(prod.precioVentaDetal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin productos en esta categoría.</p>
                )}
              </div>
            )}

            {modalType === 'payment' && (
              <div className="drilldown-sections">
                <div className="summary-banner">
                  <span>
                    Total canal: <strong>{formatCurrency(clickedData?.value || 0)}</strong>
                  </span>
                </div>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Factura</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th className="col-num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((v) => (
                          <tr key={v.id}>
                            <td>{v.numFactura || `#${v.id}`}</td>
                            <td>{v.cliente?.nombre || 'General'}</td>
                            <td>{formatDate(v.fecha)}</td>
                            <td className="col-num">{formatCurrency(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin ventas con este método.</p>
                )}
              </div>
            )}

            {modalType === 'alert-stock' && (
              <div className="drilldown-sections">
                <h4 className="modal-section-title">Stock crítico</h4>
                {detailItems?.length > 0 ? (
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Categoría</th>
                          <th>Stock</th>
                          <th>Mín.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((p) => (
                          <tr key={p.id}>
                            <td>{p.nombre}</td>
                            <td>{p.categoria}</td>
                            <td className="is-low">{p.stock}</td>
                            <td>{p.stockMinimo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">Sin alertas.</p>
                )}
                <Link href="/dashboard/compras" className="btn btn-primary" style={{ marginTop: 12 }}>
                  Registrar compra
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardModule>
  );
}
