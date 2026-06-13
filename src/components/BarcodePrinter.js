'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

export default function BarcodePrinter({ value, name, price }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 11,
          lineColor: "#000",
          background: "#fff"
        });
      } catch (err) {
        console.error("Error generating barcode:", err);
      }
    }
  }, [value]);

  const handlePrint = () => {
    const printContent = document.getElementById(`printable-barcode-${value}`);
    if (!printContent) return;
    
    const WinPrint = window.open('', '', 'width=400,height=300,toolbar=0,scrollbars=0,status=0');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Imprimir Etiqueta</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: sans-serif;
              padding: 10px;
              margin: 0;
            }
            .title { font-size: 12px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; text-align: center; }
            .price { font-size: 14px; font-weight: bold; margin-top: 4px; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="title">${name || 'Producto'}</div>
          ${printContent.innerHTML}
          ${price ? `<div class="price">$${parseFloat(price).toFixed(2)}</div>` : ''}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
  };

  if (!value) return null;

  return (
    <div className="barcode-printer-container">
      <div id={`printable-barcode-${value}`} style={{ background: '#fff', padding: '6px', borderRadius: '4px', display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef}></svg>
      </div>
      <button onClick={handlePrint} className="btn btn-secondary btn-print-label" type="button">
        <Printer size={14} />
        <span>Etiqueta</span>
      </button>

      <style jsx>{`
        .barcode-printer-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--panel-border);
          padding: 8px;
          border-radius: 8px;
        }

        .btn-print-label {
          padding: 4px 8px;
          font-size: 11px;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
