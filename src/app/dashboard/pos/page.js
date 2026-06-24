'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useBarcodeScanner from '@/components/BarcodeScanner';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';
import { useConfig } from '@/components/ConfigProvider';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  User, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  PlusCircle, 
  Ticket,
  AlertTriangle
} from 'lucide-react';


export default function POSPage() {
  const { data: session } = useSession();
  const { configs } = useConfig();
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inventario
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Clientes
  const [clientes, setClientes] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');

  // Carrito
  const [cart, setCart] = useState([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Modal de Confirmación de Cobro
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState('');

  // Pago Mixto
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTarjeta, setMontoTarjeta] = useState(0);
  const [montoTransferencia, setMontoTransferencia] = useState(0);

  // Estado del cobro
  const [cargandoCobro, setCargandoCobro] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Cargar datos al iniciar
  useEffect(() => {
    async function loadPOSData() {
      try {
        // 1. Verificar si hay caja abierta
        const cajaRes = await fetch('/api/caja?checkOpen=true');
        const cajaJson = await cajaRes.json();
        if (cajaJson && !cajaJson.error) {
          setCajaAbierta(cajaJson);
        } else {
          setCajaAbierta(null);
        }

        // 2. Cargar categorías
        const catRes = await fetch('/api/categorias');
        const catJson = await catRes.json();
        setCategorias(catJson);

        // 3. Cargar productos ordenados por popularidad (más vendidos primero)
        const prodRes = await fetch('/api/productos?activeOnly=true&sortByPopularity=true');
        const prodJson = await prodRes.json();
        setProductos(prodJson);

        // 4. Cargar clientes
        const cliRes = await fetch('/api/clientes');
        const cliJson = await cliRes.json();
        setClientes(cliJson);
      } catch (err) {
        console.error('Error al cargar datos del POS:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPOSData();
  }, []);

  // Lector de código de barras
  useBarcodeScanner((barcode) => {
    // Buscar producto por código de barras
    const prod = productos.find(p => p.codigoBarras === barcode);
    if (prod) {
      addToCart(prod);
    } else {
      setMensajeError(`Producto con código "${barcode}" no encontrado.`);
      setTimeout(() => setMensajeError(''), 3000);
    }
  });

  const addToCart = (producto) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.productoId === producto.id);
      if (existing) {
        // Si no es combo, validar stock
        if (!producto.esCombo && existing.cantidad >= producto.stock) {
          setMensajeError(`Stock máximo alcanzado para ${producto.nombre}`);
          setTimeout(() => setMensajeError(''), 3000);
          return prevCart;
        }
        return prevCart.map(item =>
          item.productoId === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      } else {
        // Validar stock inicial
        if (!producto.esCombo && producto.stock <= 0) {
          setMensajeError(`Producto ${producto.nombre} sin stock disponible`);
          setTimeout(() => setMensajeError(''), 3000);
          return prevCart;
        }
        return [
          ...prevCart,
          {
            productoId: producto.id,
            nombre: producto.nombre,
            precioUnitario: parseFloat(producto.precioVentaDetal),
            precioVentaMayor: producto.precioVentaMayor ? parseFloat(producto.precioVentaMayor) : null,
            unidadesPorCaja: producto.unidadesPorCaja,
            stock: producto.stock,
            esCombo: producto.esCombo,
            cantidad: 1,
            descuentoLinea: 0,
            tipoPrecio: 'detal' // detal o mayor
          }
        ];
      }
    });
  };

  const updateCantidad = (productoId, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productoId === productoId) {
          const nuevaCantidad = item.cantidad + delta;
          if (nuevaCantidad <= 0) return null;
          
          // Validar stock si no es combo
          if (!item.esCombo && delta > 0 && nuevaCantidad > item.stock) {
            setMensajeError(`Stock máximo alcanzado para ${item.nombre}`);
            setTimeout(() => setMensajeError(''), 3000);
            return item;
          }
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const toggleTipoPrecio = (productoId) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productoId === productoId) {
          if (item.tipoPrecio === 'detal' && item.precioVentaMayor) {
            return { 
              ...item, 
              tipoPrecio: 'mayor', 
              precioUnitario: item.precioVentaMayor 
            };
          } else {
            // Regresar a detal
            const prodOriginal = productos.find(p => p.id === productoId);
            return { 
              ...item, 
              tipoPrecio: 'detal', 
              precioUnitario: prodOriginal ? parseFloat(prodOriginal.precioVentaDetal) : item.precioUnitario 
            };
          }
        }
        return item;
      })
    );
  };

  const removeFromCart = (productoId) => {
    setCart((prevCart) => prevCart.filter(item => item.productoId !== productoId));
  };

  // Cálculos de Totales
  const subtotal = cart.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  const totalDescuentos = cart.reduce((acc, item) => acc + ((item.descuentoLinea || 0) * item.cantidad), 0) + parseFloat(descuentoGlobal || 0);
  const total = Math.max(0, subtotal - totalDescuentos);

  // Filtrar productos visibles
  const filteredProductos = productos.filter((p) => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.codigoBarras && p.codigoBarras.includes(searchQuery)) ||
      (p.marca && p.marca.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategoria === '' || p.categoriaId === parseInt(selectedCategoria);
    
    return matchesSearch && matchesCategory;
  });

  // Abrir modal de confirmación
  const openConfirmation = () => {
    if (cart.length === 0) {
      setMensajeError('El carrito está vacío.');
      return;
    }

    if (!cajaAbierta) {
      setMensajeError('El turno de caja está cerrado. Abre caja antes de vender.');
      return;
    }

    if (metodoPago === 'credito' && !selectedClienteId) {
      setMensajeError('Debe seleccionar un cliente para compras a crédito.');
      return;
    }

    if (metodoPago === 'mixto') {
      const sumaMixta = parseFloat(montoEfectivo || 0) + parseFloat(montoTarjeta || 0) + parseFloat(montoTransferencia || 0);
      if (Math.abs(sumaMixta - total) > 0.01) {
        setMensajeError(`Los montos especificados ($${sumaMixta.toFixed(2)}) no coinciden con el total ($${total.toFixed(2)})`);
        return;
      }
    }

    setMontoRecibido('');
    setMensajeError('');
    setIsConfirmModalOpen(true);
  };

  // Procesar venta
  const handleCobrar = async () => {
    if (cart.length === 0) {
      setMensajeError('El carrito está vacío.');
      return;
    }

    if (!cajaAbierta) {
      setMensajeError('El turno de caja está cerrado. Abre caja antes de vender.');
      return;
    }

    if (metodoPago === 'credito' && !selectedClienteId) {
      setMensajeError('Debe seleccionar un cliente para compras a crédito.');
      return;
    }

    if (metodoPago === 'mixto') {
      const sumaMixta = parseFloat(montoEfectivo || 0) + parseFloat(montoTarjeta || 0) + parseFloat(montoTransferencia || 0);
      if (Math.abs(sumaMixta - total) > 0.01) {
        setMensajeError(`Los montos especificados ($${sumaMixta.toFixed(2)}) no coinciden con el total ($${total.toFixed(2)})`);
        return;
      }
    }

    setCargandoCobro(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedClienteId || null,
          subtotal,
          descuentoTotal: totalDescuentos,
          impuesto: 0,
          total,
          metodoPago,
          montoEfectivo: metodoPago === 'efectivo' ? total : (metodoPago === 'mixto' ? parseFloat(montoEfectivo) : 0),
          montoTarjeta: metodoPago === 'tarjeta' ? total : (metodoPago === 'mixto' ? parseFloat(montoTarjeta) : 0),
          montoTransferencia: metodoPago === 'transferencia' ? total : (metodoPago === 'mixto' ? parseFloat(montoTransferencia) : 0),
          detalles: cart.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuentoLinea: item.descuentoLinea,
            tipoPrecio: item.tipoPrecio
          }))
        })
      });

      const json = await res.json();

      if (json.error) {
        setMensajeError(json.error);
      } else {
        setMensajeExito(`¡Venta procesada con éxito! Factura: ${json.numFactura}`);
        
        // Generar Ticket PDF de venta
        generarTicketPDF(json);

        // Limpiar carrito y restablecer
        setCart([]);
        setDescuentoGlobal(0);
        setSelectedClienteId('');
        setMetodoPago('efectivo');
        setMontoEfectivo(0);
        setMontoTarjeta(0);
        setMontoTransferencia(0);

        // Recargar inventario actualizado
        const prodRes = await fetch('/api/productos?activeOnly=true');
        const prodJson = await prodRes.json();
        setProductos(prodJson);
      }
    } catch (err) {
      setMensajeError('Error de red al procesar la venta.');
    } finally {
      setCargandoCobro(false);
    }
  };

  const generarTicketPDF = async (ventaObj) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 150] // Ticket de 80mm
      });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      const nombreEmpresa = (configs?.nombre_negocio || 'MI LICORERÍA').toUpperCase();
      doc.text(nombreEmpresa, 40, 10, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Venta de Licores y Snacks', 40, 14, { align: 'center' });
      doc.text(`Factura: ${ventaObj.numFactura}`, 40, 18, { align: 'center' });
      doc.text(`Fecha: ${new Date(ventaObj.fecha).toLocaleString('es-ES')}`, 40, 22, { align: 'center' });
      doc.text(`Cajero: ${session?.user?.name}`, 40, 26, { align: 'center' });
      
      if (ventaObj.cliente) {
        doc.text(`Cliente: ${ventaObj.cliente.nombre}`, 40, 30, { align: 'center' });
      }

      doc.line(5, 34, 75, 34);
      
      let y = 38;
      doc.setFont('Helvetica', 'bold');
      doc.text('Cant   Producto              Subt', 5, y);
      doc.setFont('Helvetica', 'normal');

      ventaObj.detalles.forEach((det) => {
        y += 4;
        const nombreTruncado = det.producto.nombre.substring(0, 20);
        doc.text(`${det.cantidad.toString().padEnd(6)}${nombreTruncado.padEnd(22)}$${parseFloat(det.subtotal).toFixed(2)}`, 5, y);
      });

      y += 6;
      doc.line(5, y, 75, y);

      y += 4;
      doc.text(`Subtotal:`, 40, y, { align: 'right' });
      doc.text(`$${parseFloat(ventaObj.subtotal).toFixed(2)}`, 75, y, { align: 'right' });

      y += 4;
      doc.text(`Descuentos:`, 40, y, { align: 'right' });
      doc.text(`$${parseFloat(ventaObj.descuentoTotal).toFixed(2)}`, 75, y, { align: 'right' });

      y += 4;
      doc.setFont('Helvetica', 'bold');
      doc.text(`Total:`, 40, y, { align: 'right' });
      doc.text(`$${parseFloat(ventaObj.total).toFixed(2)}`, 75, y, { align: 'right' });
      
      y += 5;
      doc.setFont('Helvetica', 'normal');
      doc.text(`Metodo Pago: ${ventaObj.metodoPago.toUpperCase()}`, 5, y);

      y += 10;
      doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });

      doc.autoPrint();
      
      // Abrir en nueva ventana o descargar
      const string = doc.output('datauristring');
      const embed = `<embed width='100%' height='100%' src='${string}'/>`;
      const x = window.open();
      x.document.open();
      x.document.write(embed);
      x.document.close();
    } catch (e) {
      console.error('Error al generar PDF:', e);
    }
  };

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="spinner"></div>
        <p>Cargando interfaz de Punto de Venta...</p>
      </div>
    );
  }

  return (
    <div className="pos-container animate-fade-in">
      {/* Sección Izquierda: Productos (70%) */}
      <div className="pos-left-panel">
        <div className="pos-search-header glass-panel">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, código de barras o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pos-search-input"
            />
          </div>

          <div className="categories-tabs">
            <button 
              className={`tab-btn ${selectedCategoria === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategoria('')}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                className={`tab-btn ${selectedCategoria === String(cat.id) ? 'active' : ''}`}
                onClick={() => setSelectedCategoria(String(cat.id))}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Productos Grid */}
        <div className="pos-products-grid">
          {filteredProductos.length > 0 ? (
            filteredProductos.map((p) => {
              const inCartItem = cart.find(item => item.productoId === p.id);
              const availableQty = p.esCombo ? 'Combo' : p.stock - (inCartItem?.cantidad || 0);

              return (
                <div 
                  key={p.id} 
                  className={`product-card glass-panel ${p.stock <= p.stockMinimo && !p.esCombo ? 'low-stock-border' : ''}`}
                  onClick={() => addToCart(p)}
                >
                  <div className="product-image-placeholder">
                    {p.imagenUrl ? (
                      <img src={p.imagenUrl} alt={p.nombre} className="product-image" />
                    ) : (
                      <ShoppingCart size={32} className="text-secondary" />
                    )}
                  </div>
                  <div className="product-card-details">
                    <span className="product-brand">{p.marca || 'Genérico'}</span>
                    <h4 className="product-name">{p.nombre}</h4>
                    <div className="product-price-row">
                      <span className="product-price">{formatCurrency(p.precioVentaDetal)}</span>
                      {p.esCombo ? (
                        <span className="badge badge-success">Combo</span>
                      ) : (
                        <span className={`stock-indicator ${availableQty <= 3 ? 'text-danger' : 'text-secondary'}`}>
                          Stock: {p.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-products glass-panel">
              <p>No se encontraron productos en esta categoría.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección Derecha: Carrito y Cobro (30%) */}
      <div className="pos-right-panel glass-panel">
        <div className="cart-header">
          <ShoppingCart size={20} className="text-gold" />
          <h3>Carrito de Compras</h3>
          {cart.length > 0 && (
            <span className="badge badge-warning">{cart.length} ítems</span>
          )}
        </div>

        {/* Alertas */}
        {mensajeError && <div className="alert-box error-alert">{mensajeError}</div>}
        {mensajeExito && <div className="alert-box success-alert">{mensajeExito}</div>}

        {/* Lista del Carrito */}
        <div className="cart-items-list">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.productoId} className="cart-item">
                <div className="cart-item-details">
                  <h4>{item.nombre}</h4>
                  <div className="cart-item-price-info">
                    <span className="unit-price">
                      {formatCurrency(item.precioUnitario)}
                      {item.tipoPrecio === 'mayor' && ' (Por Mayor)'}
                    </span>
                    {item.precioVentaMayor && (
                      <button 
                        onClick={() => toggleTipoPrecio(item.productoId)}
                        className="toggle-price-type-btn"
                        title="Alternar precio Detal/Mayor"
                      >
                        P. Mayor
                      </button>
                    )}
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => updateCantidad(item.productoId, -1)} className="qty-btn">
                      <Minus size={12} />
                    </button>
                    <span className="qty-value">{item.cantidad}</span>
                    <button onClick={() => updateCantidad(item.productoId, 1)} className="qty-btn">
                      <Plus size={12} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.productoId)} className="delete-item-btn">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-cart-placeholder">
              <ShoppingCart size={48} className="text-secondary" />
              <p>El carrito está vacío. Agrega productos haciendo clic en la grilla o escaneando su código de barras.</p>
            </div>
          )}
        </div>

        {/* Configuración de Pago y Cliente */}
        <div className="cart-checkout-details">
          <div className="checkout-field">
            <label className="label-field">Cliente</label>
            <div className="select-with-icon">
              <User size={16} className="field-icon" />
              <select 
                value={selectedClienteId} 
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="input-field select-field"
              >
                <option value="">Particular (Sin factura personalizada)</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} [{c.cedulaRif || 'N/A'}]</option>
                ))}
              </select>
            </div>
          </div>


          <div className="checkout-field">
            <label className="label-field">Descuento Adicional ($)</label>
            <input 
              type="number" 
              value={descuentoGlobal}
              onChange={(e) => setDescuentoGlobal(e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Resumen de Pago */}
        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Descuentos:</span>
            <span className="text-danger">-{formatCurrency(totalDescuentos)}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total a Cobrar:</span>
            <span className="text-gold">{formatCurrency(total)}</span>
          </div>
        </div>

        <button 
          onClick={openConfirmation}
          disabled={cart.length === 0 || cargandoCobro}
          className="btn btn-primary w-full cobro-btn"
        >
          <DollarSign size={20} />
          <span>REGISTRAR Y COBRAR</span>
        </button>
      </div>

      {/* Modal Confirmación de Venta */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Registro de Venta">
        <div className="confirm-modal-content">
          <div className="summary-section">
            <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Resumen de Productos ({cart.length})</h4>
            <div className="confirm-items-list">
              {cart.map((item) => (
                <div key={item.productoId} className={`confirm-item-row ${item.precioUnitario <= 0 ? 'zero-price-item' : ''}`}>
                  <div className="item-name-qty">
                    <span className="qty">{item.cantidad}x</span>
                    <span className="name">{item.nombre}</span>
                  </div>
                  <div className="item-price-subtotal">
                    <span className="unit">{formatCurrency(item.precioUnitario)}</span>
                    <span className="subt"><strong>{formatCurrency(item.precioUnitario * item.cantidad)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advertencias */}
          {cart.some(item => item.precioUnitario <= 0) && (
            <div className="warning-box">
              <AlertTriangle size={20} className="text-warning" />
              <div>
                <h5 style={{ fontWeight: 'bold' }}>¡Atención! Productos con precio $0.00</h5>
                <p>Estás registrando productos sin valor comercial. Confirma que esto es correcto.</p>
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="warning-box total-zero-box">
              <AlertTriangle size={20} className="text-danger" />
              <div>
                <h5 style={{ fontWeight: 'bold' }}>¡Alerta! Total a cobrar es $0.00</h5>
                <p>El valor total de la venta es cero. ¿Estás seguro de registrar esta venta?</p>
              </div>
            </div>
          )}

          {/* Detalles de Pago */}
          <div className="payment-summary-box">
            <div className="pay-row" style={{ alignItems: 'center', marginBottom: '8px' }}>
              <span>Cliente:</span>
              <strong>{clientes.find(c => c.id === parseInt(selectedClienteId))?.nombre || 'Particular (Sin factura)'}</strong>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              <label className="label-field" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Método de Pago</label>
              <select 
                value={metodoPago} 
                onChange={(e) => {
                  setMetodoPago(e.target.value);
                  setMontoRecibido('');
                }}
                className="input-field select-field"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="credito">Crédito (A Cuenta de Cliente)</option>
                <option value="mixto">Pago Mixto</option>
              </select>
            </div>

            {/* Configuración Pago Mixto inside Modal */}
            {metodoPago === 'mixto' && (
              <div className="mixto-inputs glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--warning-orange)', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.03)', margin: '8px 0' }}>
                <h5 style={{ fontSize: '11px', color: 'var(--warning-orange)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Montos de Pago Mixto</h5>
                <div className="mixto-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span>Efectivo ($)</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={montoEfectivo} 
                    onChange={(e) => setMontoEfectivo(e.target.value)}
                    className="input-field compacto"
                    style={{ width: '100px', padding: '4px 8px', textAlign: 'right' }}
                  />
                </div>
                <div className="mixto-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span>Tarjeta ($)</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={montoTarjeta} 
                    onChange={(e) => setMontoTarjeta(e.target.value)}
                    className="input-field compacto"
                    style={{ width: '100px', padding: '4px 8px', textAlign: 'right' }}
                  />
                </div>
                <div className="mixto-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span>Transferencia ($)</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={montoTransferencia} 
                    onChange={(e) => setMontoTransferencia(e.target.value)}
                    className="input-field compacto"
                    style={{ width: '100px', padding: '4px 8px', textAlign: 'right' }}
                  />
                </div>
                {/* Validación Suma Mixta */}
                {Math.abs((parseFloat(montoEfectivo || 0) + parseFloat(montoTarjeta || 0) + parseFloat(montoTransferencia || 0)) - total) > 0.01 && (
                  <div style={{ color: 'var(--error-red)', fontSize: '11px', marginTop: '4px' }}>
                    La suma de montos (${(parseFloat(montoEfectivo || 0) + parseFloat(montoTarjeta || 0) + parseFloat(montoTransferencia || 0)).toFixed(2)}) no coincide con el total (${total.toFixed(2)}).
                  </div>
                )}
              </div>
            )}

            {/* Validación Crédito sin Cliente */}
            {metodoPago === 'credito' && !selectedClienteId && (
              <div className="warning-box total-zero-box" style={{ margin: '8px 0', padding: '8px' }}>
                <AlertTriangle size={16} className="text-danger" />
                <span style={{ color: 'var(--error-red)', fontSize: '12px' }}>Debe seleccionar un cliente para compras a crédito.</span>
              </div>
            )}

            <div className="pay-row total-pay-row" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--panel-border)' }}>
              <span>Total a Cobrar:</span>
              <span className="text-gold-large">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Efectivo Recibido y Cambio */}
          {metodoPago === 'efectivo' && (
            <div className="cash-calculation">
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="label-field" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Monto Entregado por Cliente ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="input-field"
                  placeholder="Ej. 50000"
                  autoFocus
                />
              </div>
              {montoRecibido && (
                <div className={`change-indicator ${parseFloat(montoRecibido) < total ? 'insufficient-funds' : ''}`} style={{ marginTop: '8px', fontSize: '13px', textAlign: parseFloat(montoRecibido) < total ? 'left' : 'right' }}>
                  {parseFloat(montoRecibido) < total ? (
                    <span className="text-danger" style={{ fontWeight: '600' }}>Monto insuficiente para cubrir el total.</span>
                  ) : (
                    <span>Cambio a devolver: <strong style={{ color: 'var(--success-green)', fontSize: '15px' }}>{formatCurrency(Math.max(0, parseFloat(montoRecibido) - total))}</strong></span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => setIsConfirmModalOpen(false)} 
              className="btn btn-secondary"
              disabled={cargandoCobro}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={async () => {
                await handleCobrar();
                setIsConfirmModalOpen(false);
              }} 
              className="btn btn-primary"
              disabled={
                cargandoCobro || 
                (metodoPago === 'credito' && !selectedClienteId) || 
                (metodoPago === 'efectivo' && montoRecibido && parseFloat(montoRecibido) < total) ||
                (metodoPago === 'mixto' && Math.abs((parseFloat(montoEfectivo || 0) + parseFloat(montoTarjeta || 0) + parseFloat(montoTransferencia || 0)) - total) > 0.01)
              }
            >
              {cargandoCobro ? 'Procesando Venta...' : 'Confirmar y Registrar Venta'}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .pos-container {
          display: flex;
          gap: 20px;
          height: calc(100vh - 130px);
          width: 100%;
          overflow: hidden;
        }

        .pos-loading {
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

        .pos-left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
          min-width: 0;
        }

        .pos-search-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
        }

        .pos-search-input {
          padding-left: 44px;
        }

        .categories-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .categories-tabs::-webkit-scrollbar {
          height: 4px;
        }

        .tab-btn {
          padding: 8px 16px;
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          background: #ffffff;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tab-btn:hover {
          color: var(--text-primary);
          border-color: var(--accent-gold);
        }

        .tab-btn:active {
          transform: scale(0.94);
        }

        .tab-btn.active {
          background: var(--accent-gold);
          color: #fff;
          border-color: var(--accent-gold);
          font-weight: 600;
        }

        .pos-products-grid {
          flex-grow: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .product-card {
          padding: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: 220px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .product-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-gold);
        }

        .product-card:active {
          transform: scale(0.96);
        }

        .low-stock-border {
          border-color: rgba(239, 68, 68, 0.4);
        }

        .product-image-placeholder {
          height: 100px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-card-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-brand {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .product-name {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.3;
          height: 34px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .product-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .product-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent-gold);
        }

        .stock-indicator {
          font-size: 11px;
        }

        .text-danger { color: var(--error-red); }

        .no-products {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary);
          font-style: italic;
        }

        /* Sección Derecha */
        .pos-right-panel {
          width: 380px;
          flex-shrink: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }

        .cart-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          padding-bottom: 8px;
        }

        .cart-header h3 {
          font-size: 16px;
          flex-grow: 1;
        }

        .text-gold { color: var(--accent-gold); }

        .cart-items-list {
          flex-grow: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
          min-height: 160px;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: #ffffff;
          border: 1px solid rgba(212, 168, 83, 0.15);
          border-radius: 8px;
        }

        .cart-item-details {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 60%;
        }

        .cart-item-details h4 {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cart-item-price-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .unit-price {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .toggle-price-type-btn {
          font-size: 9px;
          padding: 2px 4px;
          background: rgba(212, 168, 83, 0.1);
          border: 1px solid var(--accent-gold);
          color: var(--accent-gold);
          border-radius: 4px;
          cursor: pointer;
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.04);
          padding: 4px;
          border-radius: 6px;
          border: 1px solid var(--panel-border);
        }

        .qty-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: none;
          background: rgba(0, 0, 0, 0.04);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .qty-btn:hover {
          background: var(--accent-gold);
          color: #fff;
        }

        .qty-value {
          font-size: 13px;
          font-weight: 600;
          width: 16px;
          text-align: center;
        }

        .delete-item-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s;
        }

        .delete-item-btn:hover {
          color: var(--error-red);
        }

        .empty-cart-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          height: 100%;
          text-align: center;
          color: var(--text-secondary);
          font-size: 13px;
          padding: 20px;
        }

        .cart-checkout-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid rgba(212, 168, 83, 0.1);
          padding-top: 8px;
        }

        .checkout-field {
          display: flex;
          flex-direction: column;
        }

        .select-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 10px;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .select-field {
          padding-left: 36px;
        }

        .pos-right-panel .input-field {
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 6px;
        }

        .pos-right-panel .label-field {
          margin-bottom: 4px;
          font-size: 11px;
        }

        .mixto-inputs {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-color: var(--warning-orange);
        }

        .mixto-inputs h5 {
          font-size: 11px;
          color: var(--warning-orange);
        }

        .mixto-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }

        .compacto {
          width: 90px;
          padding: 4px 8px !important;
          text-align: right;
        }

        .cart-summary {
          border-top: 1px solid rgba(212, 168, 83, 0.1);
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .total-row {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          border-top: 1px dashed rgba(212, 168, 83, 0.2);
          padding-top: 6px;
          margin-top: 4px;
        }

        .cobro-btn {
          height: 48px;
          font-size: 15px;
        }

        /* Alertas de POS */
        .alert-box {
          padding: 10px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--error-red);
        }
        .success-alert {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: var(--success-green);
        }

        /* Confirm Modal Styles */
        .confirm-modal-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-section {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          padding: 12px;
        }

        .confirm-items-list {
          max-height: 150px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .confirm-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 4px 0;
          border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
        }

        .zero-price-item {
          background: rgba(239, 68, 68, 0.05);
          color: var(--error-red);
          padding-left: 4px;
          padding-right: 4px;
          border-radius: 4px;
        }

        .item-name-qty {
          display: flex;
          gap: 8px;
        }

        .qty {
          color: var(--accent-gold);
          font-weight: 600;
        }

        .item-price-subtotal {
          display: flex;
          gap: 12px;
        }

        .unit {
          color: var(--text-secondary);
        }

        .warning-box {
          display: flex;
          gap: 12px;
          padding: 10px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: 8px;
          align-items: center;
        }

        .warning-box h5 {
          font-size: 13px;
          color: var(--warning-orange);
          margin-bottom: 2px;
        }

        .warning-box p {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 0;
        }

        .total-zero-box {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.25);
        }

        .total-zero-box h5 {
          color: var(--error-red);
        }

        .payment-summary-box {
          border-top: 1px solid var(--panel-border);
          border-bottom: 1px solid var(--panel-border);
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pay-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .total-pay-row {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed var(--panel-border);
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .text-gold-large {
          color: var(--accent-gold);
          font-size: 18px;
          font-weight: bold;
        }

        .cash-calculation {
          background: rgba(212, 168, 83, 0.05);
          border: 1px solid rgba(212, 168, 83, 0.15);
          border-radius: 8px;
          padding: 12px;
        }

        .change-indicator {
          margin-top: 8px;
          font-size: 13px;
          text-align: right;
        }

        .insufficient-funds {
          text-align: left;
        }
      `}</style>
    </div>
  );
}
