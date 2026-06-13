'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { 
  SalesLineChart, 
  TopProductsBarChart, 
  SalesByCategoryPieChart, 
  PaymentMethodsPieChart 
} from '@/components/Charts';
import { formatCurrency } from '@/lib/utils';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportesPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30'); // 7 o 30 días

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
          <div className="glass-panel stat-box">
            <span className="stat-lbl">Ingresos Venta</span>
            <h3>{formatCurrency(metrics.totalVentasMonto)}</h3>
            <p className="text-success text-xs">Ventas en el rango seleccionado</p>
          </div>

          <div className="glass-panel stat-box">
            <span className="stat-lbl">Compras Realizadas</span>
            <h3>{formatCurrency(metrics.totalComprasMonto)}</h3>
            <p className="text-danger text-xs">Inversión en mercadería</p>
          </div>

          <div className="glass-panel stat-box">
            <span className="stat-lbl">Margen Estimado</span>
            <h3>{formatCurrency(parseFloat(metrics.totalVentasMonto || 0) - parseFloat(metrics.totalComprasMonto || 0))}</h3>
            <p className="text-xs text-secondary">Ingresos netos menos egresos</p>
          </div>

          <div className="glass-panel stat-box">
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
              <SalesLineChart labels={charts.lineLabels} data={charts.lineData} />
            </div>
          </div>

          <div className="glass-panel c-box">
            <h5>Top 10 Productos Más Demandados (Unidades)</h5>
            <div className="c-wrapper">
              <TopProductsBarChart labels={charts.barLabels} data={charts.barData} />
            </div>
          </div>
        </div>

        <div className="grid-cols-2">
          <div className="glass-panel c-box">
            <h5>Ventas por Categoría de Producto ($)</h5>
            <div className="c-wrapper">
              <SalesByCategoryPieChart labels={charts.pieCategoryLabels} data={charts.pieCategoryData} />
            </div>
          </div>

          <div className="glass-panel c-box">
            <h5>Distribución por Métodos de Pago ($)</h5>
            <div className="c-wrapper">
              <PaymentMethodsPieChart labels={charts.piePayLabels} data={charts.piePayData} />
            </div>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}
