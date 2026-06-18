# 🚀 INSTRUCCIONES PARA IA — MEJORAS CRÍTICAS DEL SISTEMA (80% → 100%)

---

> **CONTEXTO PARA EL AGENTE:**
> Este sistema es una aplicación de licorería construida con Next.js 16 App Router, Prisma 7 y PostgreSQL.
> La carpeta del proyecto es `c:\sistema-de-licoreria`.
> El sistema YA funciona con 16 módulos, 22 tablas, POS, caja, inventario, ventas, compras, devoluciones, auditoría, etc.
> Tu tarea es implementar las 4 mejoras críticas descritas abajo SIN romper nada de lo existente.

---

## ⚠️ REGLAS OBLIGATORIAS

1. **NO borrar código existente** que funcione. Solo AGREGAR funcionalidad nueva.
2. **NO cambiar nombres de tablas ni campos** existentes en `prisma/schema.prisma`. Solo agregar modelos y campos nuevos.
3. Después de modificar el schema, ejecutar: `npx prisma migrate dev --name nombre_descriptivo`
4. Toda nueva API debe ir en `src/app/api/`.
5. Toda nueva página del dashboard debe ir en `src/app/dashboard/`.
6. Usar los imports existentes: `import prisma from '@/lib/prisma'` y `import { logAudit } from '@/lib/audit'`.
7. El proyecto ya tiene instalados: `jspdf`, `chart.js`, `react-chartjs-2`, `html2canvas`, `jsbarcode`, `lucide-react`.

---

## ═══════════════════════════════════════════
## MEJORA 1: EXPORTAR REPORTES A EXCEL Y PDF
## ═══════════════════════════════════════════

### ¿Por qué?
Actualmente los reportes solo se ven en pantalla. El dueño de la licorería necesita exportarlos para dárselos al contador o guardarlos como respaldo mensual.

### ¿Qué instalar?

```bash
npm install xlsx
```

> Nota: `jspdf` ya está instalado en el proyecto (ver package.json línea 17).

---

### PASO 1.1 — Crear la utilidad de exportación

**Crear archivo:** `src/lib/exportUtils.js`

```javascript
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Exporta un arreglo de objetos a un archivo Excel (.xlsx) y lo descarga.
 * @param {Array<Object>} data - Los datos a exportar (ej: lista de ventas)
 * @param {string} filename - Nombre del archivo sin extensión (ej: "reporte_ventas")
 * @param {string} sheetName - Nombre de la hoja del Excel (ej: "Ventas")
 */
export function exportToExcel(data, filename, sheetName = 'Datos') {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Ajustar ancho de columnas automáticamente
  const maxWidths = {};
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      const val = row[key] ? String(row[key]) : '';
      maxWidths[key] = Math.max(maxWidths[key] || key.length, val.length);
    });
  });
  worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: Math.min(maxWidths[key] + 2, 40) }));

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exporta un arreglo de objetos a un archivo PDF y lo descarga.
 * Genera una tabla dentro del PDF.
 * @param {Object} config - Configuración del PDF
 * @param {string} config.title - Título del reporte
 * @param {string} config.filename - Nombre del archivo sin extensión
 * @param {Array<{header: string, key: string, width?: number}>} config.columns - Definición de columnas
 * @param {Array<Object>} config.data - Los datos a exportar
 * @param {string} [config.subtitle] - Subtítulo opcional (ej: "Período: 01/06 - 30/06")
 * @param {string} [config.businessName] - Nombre del negocio (ej: "Mi Licorería")
 */
export function exportToPDF({ title, filename, columns, data, subtitle, businessName }) {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header del negocio
  if (businessName) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(businessName, pageWidth / 2, 15, { align: 'center' });
  }

  // Título del reporte
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, businessName ? 24 : 15, { align: 'center' });

  // Subtítulo
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, businessName ? 30 : 22, { align: 'center' });
  }

  // Fecha de generación
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generado: ${new Date().toLocaleString('es')}`, pageWidth - 15, 10, { align: 'right' });

  // Dibujar tabla
  const startY = businessName ? 38 : 28;
  const rowHeight = 8;
  const colWidths = columns.map(c => c.width || Math.floor((pageWidth - 20) / columns.length));
  let currentY = startY;
  let startX = 10;

  // Encabezado de tabla
  doc.setFillColor(30, 31, 35);    // Color oscuro
  doc.setTextColor(227, 226, 231); // Texto claro
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');

  let xPos = startX;
  columns.forEach((col, i) => {
    doc.text(col.header.toUpperCase(), xPos + 2, currentY + 5.5);
    xPos += colWidths[i];
  });

  currentY += rowHeight;

  // Filas de datos
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  data.forEach((row, rowIndex) => {
    // Si la fila se sale de la página, crear nueva página
    if (currentY + rowHeight > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      currentY = 15;

      // Re-dibujar encabezado en nueva página
      doc.setFillColor(30, 31, 35);
      doc.setTextColor(227, 226, 231);
      doc.setFont('helvetica', 'bold');
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      xPos = startX;
      columns.forEach((col, i) => {
        doc.text(col.header.toUpperCase(), xPos + 2, currentY + 5.5);
        xPos += colWidths[i];
      });
      currentY += rowHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    }

    // Fondo alternado
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    }

    xPos = startX;
    columns.forEach((col, i) => {
      let value = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
      // Truncar si es muy largo
      if (value.length > 35) value = value.substring(0, 32) + '...';
      doc.text(value, xPos + 2, currentY + 5.5);
      xPos += colWidths[i];
    });

    currentY += rowHeight;
  });

  // Pie de página con total de registros
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de registros: ${data.length}`, startX, currentY + 8);

  doc.save(`${filename}.pdf`);
}
```

---

### PASO 1.2 — Agregar botones de exportación en la página de Reportes

**Archivo a modificar:** `src/app/dashboard/reportes/page.js`

Agregar estos 2 imports al inicio del archivo:

```javascript
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
```

Agregar 2 botones en la parte superior de la página, al lado del título "Reportes". Los botones deben llamar a funciones que transformen los datos actuales del reporte en formato exportable.

**Funciones a agregar dentro del componente:**

```javascript
// Exportar ventas a Excel
function handleExportVentasExcel() {
  if (!reportData?.details?.latestVentas) return;
  const data = reportData.details.latestVentas.map(v => ({
    'Factura': v.numFactura,
    'Fecha': new Date(v.fecha).toLocaleDateString('es'),
    'Cliente': v.cliente?.nombre || 'Público General',
    'Método Pago': v.metodoPago,
    'Total': parseFloat(v.total).toFixed(2),
    'Estado': v.estado
  }));
  exportToExcel(data, `reporte_ventas_${new Date().toISOString().split('T')[0]}`, 'Ventas');
}

// Exportar ventas a PDF
function handleExportVentasPDF() {
  if (!reportData?.details?.latestVentas) return;
  const data = reportData.details.latestVentas.map(v => ({
    factura: v.numFactura,
    fecha: new Date(v.fecha).toLocaleDateString('es'),
    cliente: v.cliente?.nombre || 'Público General',
    metodo: v.metodoPago,
    total: `$${parseFloat(v.total).toFixed(2)}`,
    estado: v.estado
  }));
  exportToPDF({
    title: 'Reporte de Ventas',
    filename: `reporte_ventas_${new Date().toISOString().split('T')[0]}`,
    businessName: 'Mi Licorería',
    subtitle: `Generado el ${new Date().toLocaleDateString('es')}`,
    columns: [
      { header: 'Factura', key: 'factura', width: 35 },
      { header: 'Fecha', key: 'fecha', width: 30 },
      { header: 'Cliente', key: 'cliente', width: 55 },
      { header: 'Método Pago', key: 'metodo', width: 35 },
      { header: 'Total', key: 'total', width: 30 },
      { header: 'Estado', key: 'estado', width: 25 },
    ],
    data
  });
}
```

**HTML de los botones a agregar:**

```jsx
<button className="btn btn-secondary" onClick={handleExportVentasExcel}>
  📊 Exportar Excel
</button>
<button className="btn btn-secondary" onClick={handleExportVentasPDF}>
  📄 Exportar PDF
</button>
```

---

### PASO 1.3 — Agregar exportación en TODAS las páginas que tienen tablas

Repetir el mismo patrón de exportación en estas páginas (cada una debe poder exportar su tabla a Excel y PDF):

| Página | Archivo | Datos a exportar |
|---|---|---|
| Ventas | `src/app/dashboard/ventas/page.js` | Lista de ventas (factura, fecha, cliente, total, estado) |
| Compras | `src/app/dashboard/compras/page.js` | Lista de compras (proveedor, fecha, factura, total) |
| Inventario | `src/app/dashboard/inventario/page.js` | Lista de productos (nombre, categoría, stock, precio compra, precio venta) |
| Clientes | `src/app/dashboard/clientes/page.js` | Lista de clientes (nombre, teléfono, cédula, saldo pendiente) |
| Cuentas x Cobrar | `src/app/dashboard/cuentas-por-cobrar/page.js` | Lista de cuentas (cliente, monto, saldo, estado, fecha límite) |
| Auditoría | `src/app/dashboard/auditoria/page.js` | Lista de registros (usuario, acción, tabla, fecha) |
| Proveedores | `src/app/dashboard/proveedores/page.js` | Lista de proveedores (nombre, teléfono, RIF, dirección) |

En cada página:
1. Importar `{ exportToExcel, exportToPDF }` de `@/lib/exportUtils`
2. Crear las funciones `handleExport...Excel()` y `handleExport...PDF()` mapeando los datos de esa página
3. Agregar los 2 botones al lado del título de la página

---

### PASO 1.4 — Crear API para exportar reportes completos del backend

**Crear archivo:** `src/app/api/reportes/exportar/route.js`

Esta API recibe un query param `?tipo=ventas&formato=json&desde=2024-01-01&hasta=2024-12-31` y devuelve TODOS los datos (sin limit) para que el frontend los exporte. Es necesario porque las páginas normales usan paginación y no traen todos los registros.

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');         // "ventas", "compras", "inventario", "clientes", "cuentas", "auditoria"
    const desde = searchParams.get('desde');       // "2024-01-01"
    const hasta = searchParams.get('hasta');       // "2024-12-31"

    const whereDate = {};
    if (desde) whereDate.gte = new Date(desde);
    if (hasta) {
      const hastaDate = new Date(hasta);
      hastaDate.setHours(23, 59, 59, 999);
      whereDate.lte = hastaDate;
    }

    let data = [];

    switch (tipo) {
      case 'ventas':
        data = await prisma.venta.findMany({
          where: {
            ...(desde || hasta ? { fecha: whereDate } : {})
          },
          include: { cliente: true, usuario: { select: { nombre: true } }, detalles: { include: { producto: true } } },
          orderBy: { fecha: 'desc' }
        });
        break;

      case 'compras':
        data = await prisma.compra.findMany({
          where: {
            ...(desde || hasta ? { fecha: whereDate } : {})
          },
          include: { proveedor: true, usuario: { select: { nombre: true } }, detalles: { include: { producto: true } } },
          orderBy: { fecha: 'desc' }
        });
        break;

      case 'inventario':
        data = await prisma.producto.findMany({
          where: { activo: true },
          include: { categoria: true },
          orderBy: { nombre: 'asc' }
        });
        break;

      case 'clientes':
        data = await prisma.cliente.findMany({
          where: { activo: true },
          orderBy: { nombre: 'asc' }
        });
        break;

      case 'cuentas':
        data = await prisma.cuentaPorCobrar.findMany({
          where: { estado: 'pendiente' },
          include: { cliente: true, venta: true },
          orderBy: { createdAt: 'desc' }
        });
        break;

      case 'auditoria':
        data = await prisma.auditoria.findMany({
          where: {
            ...(desde || hasta ? { fecha: whereDate } : {})
          },
          include: { usuario: { select: { nombre: true } } },
          orderBy: { fecha: 'desc' },
          take: 5000
        });
        break;

      default:
        return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## ═══════════════════════════════════════════
## MEJORA 2: IMPRESIÓN DIRECTA DE TICKETS
## ═══════════════════════════════════════════

### ¿Por qué?
Cuando el cajero hace una venta, necesita imprimir un ticket de 80mm inmediatamente. No puede estar generando PDFs y dando clic en "imprimir". Debe ser automático.

---

### PASO 2.1 — Crear el componente de ticket térmico

**Crear archivo:** `src/components/TicketReceipt.js`

```jsx
'use client';

import { forwardRef } from 'react';

/**
 * Componente de ticket de venta para impresora térmica de 80mm.
 * Se renderiza oculto y se imprime con window.print().
 *
 * @param {Object} props
 * @param {Object} props.venta - Objeto de venta completo con detalles
 * @param {Object} props.config - Configuración del negocio (nombre, dirección, teléfono, RIF)
 */
const TicketReceipt = forwardRef(function TicketReceipt({ venta, config = {} }, ref) {
  if (!venta) return null;

  const {
    nombre_negocio = 'Mi Licorería',
    direccion = '',
    telefono = '',
    rif_nit = '',
    moneda_simbolo = '$'
  } = config;

  const fecha = new Date(venta.fecha).toLocaleString('es', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div ref={ref} className="ticket-print-area">
      <style>{`
        .ticket-print-area {
          width: 72mm;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #000;
          background: #fff;
          padding: 4mm;
        }
        .ticket-print-area .center { text-align: center; }
        .ticket-print-area .bold { font-weight: bold; }
        .ticket-print-area .divider {
          border: none;
          border-top: 1px dashed #000;
          margin: 4px 0;
        }
        .ticket-print-area .row {
          display: flex;
          justify-content: space-between;
        }
        .ticket-print-area .item-name {
          font-size: 11px;
        }
        .ticket-print-area .total-line {
          font-size: 16px;
          font-weight: bold;
        }

        @media print {
          body * { visibility: hidden; }
          .ticket-print-area, .ticket-print-area * { visibility: visible; }
          .ticket-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 72mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      {/* Encabezado del negocio */}
      <div className="center bold" style={{ fontSize: '16px', marginBottom: '4px' }}>
        {nombre_negocio}
      </div>
      {direccion && <div className="center" style={{ fontSize: '10px' }}>{direccion}</div>}
      {telefono && <div className="center" style={{ fontSize: '10px' }}>Tel: {telefono}</div>}
      {rif_nit && <div className="center" style={{ fontSize: '10px' }}>RIF: {rif_nit}</div>}

      <hr className="divider" />

      {/* Info de la venta */}
      <div className="row"><span>Factura:</span><span className="bold">{venta.numFactura}</span></div>
      <div className="row"><span>Fecha:</span><span>{fecha}</span></div>
      {venta.cliente && <div className="row"><span>Cliente:</span><span>{venta.cliente.nombre}</span></div>}
      <div className="row"><span>Cajero:</span><span>{venta.usuario?.nombre || 'N/A'}</span></div>

      <hr className="divider" />

      {/* Detalle de productos */}
      {venta.detalles?.map((det, i) => (
        <div key={i} style={{ marginBottom: '4px' }}>
          <div className="item-name">{det.producto?.nombre || `Prod #${det.productoId}`}</div>
          <div className="row">
            <span>{det.cantidad} x {moneda_simbolo}{parseFloat(det.precioUnitario).toFixed(2)}</span>
            <span>{moneda_simbolo}{parseFloat(det.subtotal).toFixed(2)}</span>
          </div>
          {parseFloat(det.descuentoLinea) > 0 && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              &nbsp;&nbsp;Desc: -{moneda_simbolo}{parseFloat(det.descuentoLinea).toFixed(2)}
            </div>
          )}
        </div>
      ))}

      <hr className="divider" />

      {/* Totales */}
      <div className="row"><span>Subtotal:</span><span>{moneda_simbolo}{parseFloat(venta.subtotal).toFixed(2)}</span></div>
      {parseFloat(venta.descuentoTotal) > 0 && (
        <div className="row"><span>Descuento:</span><span>-{moneda_simbolo}{parseFloat(venta.descuentoTotal).toFixed(2)}</span></div>
      )}
      {parseFloat(venta.impuesto) > 0 && (
        <div className="row"><span>Impuesto:</span><span>{moneda_simbolo}{parseFloat(venta.impuesto).toFixed(2)}</span></div>
      )}
      <div className="row total-line">
        <span>TOTAL:</span>
        <span>{moneda_simbolo}{parseFloat(venta.total).toFixed(2)}</span>
      </div>

      <hr className="divider" />

      {/* Método de pago */}
      <div className="row"><span>Pago:</span><span className="bold">{venta.metodoPago?.toUpperCase()}</span></div>
      {venta.metodoPago === 'efectivo' && parseFloat(venta.montoEfectivo) > parseFloat(venta.total) && (
        <>
          <div className="row"><span>Recibido:</span><span>{moneda_simbolo}{parseFloat(venta.montoEfectivo).toFixed(2)}</span></div>
          <div className="row bold"><span>Cambio:</span><span>{moneda_simbolo}{(parseFloat(venta.montoEfectivo) - parseFloat(venta.total)).toFixed(2)}</span></div>
        </>
      )}
      {venta.metodoPago === 'mixto' && (
        <>
          {parseFloat(venta.montoEfectivo) > 0 && <div className="row"><span>Efectivo:</span><span>{moneda_simbolo}{parseFloat(venta.montoEfectivo).toFixed(2)}</span></div>}
          {parseFloat(venta.montoTarjeta) > 0 && <div className="row"><span>Tarjeta:</span><span>{moneda_simbolo}{parseFloat(venta.montoTarjeta).toFixed(2)}</span></div>}
          {parseFloat(venta.montoTransferencia) > 0 && <div className="row"><span>Transfer:</span><span>{moneda_simbolo}{parseFloat(venta.montoTransferencia).toFixed(2)}</span></div>}
        </>
      )}

      <hr className="divider" />

      {/* Pie de ticket */}
      <div className="center" style={{ fontSize: '10px', marginTop: '8px' }}>
        ¡Gracias por su compra!
      </div>
      <div className="center" style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>
        {nombre_negocio} — Sistema POS
      </div>
    </div>
  );
});

export default TicketReceipt;
```

---

### PASO 2.2 — Crear la función de impresión automática

**Crear archivo:** `src/lib/printTicket.js`

```javascript
/**
 * Abre una ventana emergente con el contenido del ticket y lo imprime automáticamente.
 * Compatible con impresoras térmicas de 80mm.
 *
 * @param {HTMLElement} ticketElement - Referencia al DOM del componente TicketReceipt
 */
export function printTicket(ticketElement) {
  if (!ticketElement) {
    console.error('No se encontró el elemento del ticket para imprimir.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (!printWindow) {
    alert('Por favor permita las ventanas emergentes para imprimir tickets.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket de Venta</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 72mm; }
        @page { size: 80mm auto; margin: 0; }
      </style>
    </head>
    <body>
      ${ticketElement.innerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();

  // Esperar a que cargue y luego imprimir
  printWindow.onload = function () {
    printWindow.focus();
    printWindow.print();
    // Cerrar la ventana después de imprimir (o cancelar)
    setTimeout(() => printWindow.close(), 1000);
  };
}
```

---

### PASO 2.3 — Integrar la impresión en el POS

**Archivo a modificar:** `src/app/dashboard/pos/page.js`

Después de que una venta se completa exitosamente (cuando la API `/api/ventas` responde con la venta creada), hacer lo siguiente:

1. Importar los nuevos módulos:

```javascript
import { useRef } from 'react';
import TicketReceipt from '@/components/TicketReceipt';
import { printTicket } from '@/lib/printTicket';
```

2. Agregar un `ref` y un estado para la venta completada:

```javascript
const ticketRef = useRef(null);
const [ventaCompletada, setVentaCompletada] = useState(null);
```

3. Después de que la venta se crea exitosamente, guardar la venta y disparar la impresión:

```javascript
// Dentro del handler de completar venta, después del fetch exitoso:
setVentaCompletada(ventaData);  // ventaData es la respuesta de la API

// Esperar a que el componente se renderice y luego imprimir
setTimeout(() => {
  if (ticketRef.current) {
    printTicket(ticketRef.current);
  }
}, 300);
```

4. Agregar el componente oculto al final del JSX (antes del cierre del componente):

```jsx
{/* Ticket oculto para impresión */}
{ventaCompletada && (
  <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
    <TicketReceipt
      ref={ticketRef}
      venta={ventaCompletada}
      config={{
        nombre_negocio: 'Mi Licorería',
        direccion: '',
        telefono: '',
        rif_nit: '',
        moneda_simbolo: '$'
      }}
    />
  </div>
)}
```

---

### PASO 2.4 — Agregar botón "Reimprimir Ticket" en la página de Ventas

**Archivo a modificar:** `src/app/dashboard/ventas/page.js`

En la tabla de ventas, agregar un botón "🖨️" en cada fila que permita reimprimir el ticket de esa venta. Al hacer clic:

1. Hacer fetch a `/api/ventas?id={ventaId}` para obtener la venta completa con detalles
2. Renderizar `TicketReceipt` con esos datos
3. Llamar `printTicket()` para imprimir

---

## ═══════════════════════════════════════════
## MEJORA 3: COPIAS DE SEGURIDAD (BACKUP)
## ═══════════════════════════════════════════

### ¿Por qué?
Si se daña el computador, se pierden TODOS los datos de ventas, clientes e inventario. Se necesita un respaldo que el dueño pueda descargar manualmente o que se genere automáticamente.

---

### PASO 3.1 — Crear la API de backup

**Crear archivo:** `src/app/api/backup/route.js`

Esta API exporta TODAS las tablas de la base de datos a un archivo JSON descargable.

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden hacer backup
    const permisos = session.user?.rol?.permisos || {};
    if (!permisos.configuracion) {
      return NextResponse.json({ error: 'No tiene permisos para realizar backups' }, { status: 403 });
    }

    // Exportar todas las tablas
    const backup = {
      metadata: {
        version: '1.0',
        fechaGeneracion: new Date().toISOString(),
        generadoPor: session.user.name,
        sistema: 'Sistema de Licorería'
      },
      datos: {
        roles: await prisma.rol.findMany(),
        usuarios: await prisma.usuario.findMany({
          select: {
            id: true,
            nombre: true,
            email: true,
            rolId: true,
            activo: true,
            createdAt: true
            // NO incluir passwordHash por seguridad
          }
        }),
        categorias: await prisma.categoria.findMany(),
        productos: await prisma.producto.findMany(),
        comboDetalles: await prisma.comboDetalle.findMany(),
        lotes: await prisma.lote.findMany(),
        mermas: await prisma.merma.findMany(),
        descuentos: await prisma.descuento.findMany(),
        descuentoProductos: await prisma.descuentoProducto.findMany(),
        clientes: await prisma.cliente.findMany(),
        proveedores: await prisma.proveedor.findMany(),
        ventas: await prisma.venta.findMany(),
        ventaDetalles: await prisma.ventaDetalle.findMany(),
        compras: await prisma.compra.findMany(),
        compraDetalles: await prisma.compraDetalle.findMany(),
        cuentasPorCobrar: await prisma.cuentaPorCobrar.findMany(),
        abonos: await prisma.abono.findMany(),
        devoluciones: await prisma.devolucion.findMany(),
        devolucionDetalles: await prisma.devolucionDetalle.findMany(),
        cajaTurnos: await prisma.cajaTurno.findMany(),
        configuraciones: await prisma.configuracion.findMany(),
        // NO exportar auditorías (son muy grandes y no son datos operativos)
      }
    };

    // Registrar que se hizo un backup
    await logAudit({
      accion: 'BACKUP_GENERADO',
      tablaAfectada: 'sistema',
      registroId: null,
      datosNuevos: { fecha: backup.metadata.fechaGeneracion }
    });

    // Devolver como JSON descargable
    const filename = `backup_licoreria_${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### PASO 3.2 — Agregar botón de backup en Configuración

**Archivo a modificar:** `src/app/dashboard/configuracion/page.js`

Agregar una sección nueva llamada "Copias de Seguridad" con:

1. Un botón "📦 Descargar Backup Completo" que hace:

```javascript
async function handleBackup() {
  setBackupLoading(true);
  try {
    const response = await fetch('/api/backup');
    if (!response.ok) throw new Error('Error al generar backup');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_licoreria_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    alert('Backup descargado exitosamente.');
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    setBackupLoading(false);
  }
}
```

2. Un texto informativo: "Se recomienda descargar un backup al menos una vez por semana y guardarlo en un USB o almacenamiento en la nube."

3. Mostrar la fecha del último backup (consultando la auditoría donde `accion = 'BACKUP_GENERADO'`).

---

## ═══════════════════════════════════════════
## MEJORA 4: HISTORIAL DE PRECIOS DE COMPRA
## ═══════════════════════════════════════════

### ¿Por qué?
Actualmente, cuando se registra una compra nueva, el campo `precioCompra` del producto se sobreescribe con el último precio. Se pierde el historial. El dueño necesita ver: "Este ron me costaba $5 en enero y ahora me cuesta $7.50".

---

### PASO 4.1 — Crear la tabla de historial de precios

**Archivo a modificar:** `prisma/schema.prisma`

Agregar este nuevo modelo AL FINAL del archivo, antes de cerrar:

```prisma
// ===================== HISTORIAL DE PRECIOS =====================

model HistorialPrecio {
  id              Int       @id @default(autoincrement())
  productoId      Int       @map("producto_id")
  precioAnterior  Decimal   @map("precio_anterior") @db.Decimal(12, 2)
  precioNuevo     Decimal   @map("precio_nuevo") @db.Decimal(12, 2)
  tipoPrecio      String    @map("tipo_precio") @db.VarChar(20) // "compra", "venta_detal", "venta_mayor"
  motivo          String?   @db.VarChar(200) // "compra", "ajuste_manual"
  usuarioId       Int?      @map("usuario_id")
  fecha           DateTime  @default(now())

  producto        Producto  @relation(fields: [productoId], references: [id])

  @@index([productoId])
  @@index([fecha])
  @@map("historial_precios")
}
```

**IMPORTANTE:** También agregar la relación inversa en el modelo `Producto` existente. Buscar el modelo `Producto` y agregar esta línea dentro de las relaciones:

```prisma
  historialPrecios   HistorialPrecio[]
```

---

### PASO 4.2 — Ejecutar la migración

Después de guardar el schema, ejecutar en la terminal:

```bash
cd c:\sistema-de-licoreria
npx prisma migrate dev --name agregar_historial_precios
```

---

### PASO 4.3 — Modificar la API de compras para guardar el historial

**Archivo a modificar:** `src/app/api/compras/route.js`

Dentro de la función `POST`, dentro del `prisma.$transaction`, ANTES de actualizar el precio del producto (línea que dice `precioCompra: parseFloat(det.precioUnitario)`), agregar este bloque:

```javascript
// Guardar historial de precio si el precio cambió
const productoActual = await tx.producto.findUnique({
  where: { id: parseInt(det.productoId) },
  select: { precioCompra: true }
});

if (productoActual && parseFloat(productoActual.precioCompra) !== parseFloat(det.precioUnitario)) {
  await tx.historialPrecio.create({
    data: {
      productoId: parseInt(det.productoId),
      precioAnterior: parseFloat(productoActual.precioCompra),
      precioNuevo: parseFloat(det.precioUnitario),
      tipoPrecio: 'compra',
      motivo: 'compra',
      usuarioId: parseInt(session.user.id)
    }
  });
}
```

---

### PASO 4.4 — Modificar la API de productos para guardar historial cuando se editan precios

**Archivo a modificar:** `src/app/api/productos/route.js`

Dentro de la función `PUT` (editar producto), ANTES de hacer el `prisma.producto.update`, comparar los precios anteriores con los nuevos. Si alguno cambió, registrarlo:

```javascript
// Obtener precios actuales antes de actualizar
const productoActual = await prisma.producto.findUnique({
  where: { id: parseInt(id) },
  select: { precioCompra: true, precioVentaDetal: true, precioVentaMayor: true }
});

// Después del update, registrar cambios de precio:
if (parseFloat(productoActual.precioCompra) !== parseFloat(body.precioCompra)) {
  await prisma.historialPrecio.create({
    data: {
      productoId: parseInt(id),
      precioAnterior: parseFloat(productoActual.precioCompra),
      precioNuevo: parseFloat(body.precioCompra),
      tipoPrecio: 'compra',
      motivo: 'ajuste_manual',
      usuarioId: parseInt(session.user.id)
    }
  });
}

if (parseFloat(productoActual.precioVentaDetal) !== parseFloat(body.precioVentaDetal)) {
  await prisma.historialPrecio.create({
    data: {
      productoId: parseInt(id),
      precioAnterior: parseFloat(productoActual.precioVentaDetal),
      precioNuevo: parseFloat(body.precioVentaDetal),
      tipoPrecio: 'venta_detal',
      motivo: 'ajuste_manual',
      usuarioId: parseInt(session.user.id)
    }
  });
}

if (body.precioVentaMayor && productoActual.precioVentaMayor &&
    parseFloat(productoActual.precioVentaMayor) !== parseFloat(body.precioVentaMayor)) {
  await prisma.historialPrecio.create({
    data: {
      productoId: parseInt(id),
      precioAnterior: parseFloat(productoActual.precioVentaMayor),
      precioNuevo: parseFloat(body.precioVentaMayor),
      tipoPrecio: 'venta_mayor',
      motivo: 'ajuste_manual',
      usuarioId: parseInt(session.user.id)
    }
  });
}
```

---

### PASO 4.5 — Crear API para consultar historial de un producto

**Crear archivo:** `src/app/api/productos/historial-precios/route.js`

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');

    if (!productoId) {
      return NextResponse.json({ error: 'Falta productoId' }, { status: 400 });
    }

    const historial = await prisma.historialPrecio.findMany({
      where: { productoId: parseInt(productoId) },
      orderBy: { fecha: 'desc' },
      take: 50
    });

    return NextResponse.json(historial);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### PASO 4.6 — Mostrar historial de precios en la pantalla de Inventario

**Archivo a modificar:** `src/app/dashboard/inventario/page.js`

Agregar un botón "📈 Historial" en cada fila del producto. Al hacer clic, se abre un modal que:

1. Hace fetch a `/api/productos/historial-precios?productoId={id}`
2. Muestra una tabla con columnas: Fecha, Tipo (Compra/Venta Detal/Venta Mayor), Precio Anterior, Precio Nuevo, Variación (%), Motivo
3. La variación se calcula: `((precioNuevo - precioAnterior) / precioAnterior * 100).toFixed(1)%`
4. Si subió, mostrar en ROJO con flecha ↑. Si bajó, mostrar en VERDE con flecha ↓.

---

## ═══════════════════════════════════════════
## VERIFICACIÓN FINAL
## ═══════════════════════════════════════════

Después de implementar las 4 mejoras, verificar:

### Mejora 1 (Exportación):
- [ ] Ir a Reportes → clic en "Exportar Excel" → se descarga un archivo .xlsx que abre correctamente en Excel
- [ ] Ir a Reportes → clic en "Exportar PDF" → se descarga un PDF con tabla formateada
- [ ] Repetir en: Ventas, Compras, Inventario, Clientes

### Mejora 2 (Tickets):
- [ ] Hacer una venta en el POS → al completar, se abre ventana de impresión automáticamente
- [ ] Ir a Ventas → clic en "🖨️" en una venta → se imprime el ticket

### Mejora 3 (Backup):
- [ ] Ir a Configuración → clic en "Descargar Backup" → se descarga un .json con TODOS los datos
- [ ] Abrir el .json y verificar que tiene: productos, ventas, clientes, configuraciones

### Mejora 4 (Historial Precios):
- [ ] Editar un producto y cambiar su precio de compra → guardar
- [ ] Ir al inventario → clic en "Historial" de ese producto → debe aparecer el cambio registrado
- [ ] Registrar una compra con precio diferente al actual → verificar que se registra en historial

---

## 📦 DEPENDENCIA A INSTALAR

Antes de empezar, ejecutar este comando:

```bash
cd c:\sistema-de-licoreria
npm install xlsx
```

Esto instala la librería para exportar a Excel. Las demás dependencias (`jspdf`, `html2canvas`) ya están instaladas.
