'use client';

import '@/styles/modules/pos.css';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import useBarcodeScanner from '@/components/BarcodeScanner';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/Modal';
import { useConfig } from '@/components/ConfigProvider';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { sumMontosPago, getMethodById } from '@/lib/paymentMethods';
import {
  getBestPromoForCart,
  estimatePromoDiscount,
  isPromoActive,
} from '@/lib/discountEngine';
import {
  canIncreaseCartItem,
  getComboAvailableToAdd,
  getComboLimitingIngredient,
  getComboMaxInCart,
} from '@/lib/comboStock';
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
  const { posMethods, mixtoMethods, labelFor } = usePaymentMethods();
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
  const [promociones, setPromociones] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState('auto');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Modal de Confirmación de Cobro
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState('');

  // Pago mixto — montos por método configurado
  const [montosMixto, setMontosMixto] = useState({});

  // Estado del cobro
  const [cargandoCobro, setCargandoCobro] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const selectedMethod = getMethodById(metodoPago, posMethods) || posMethods[0];
  const sumaMixta = sumMontosPago(montosMixto);
  const productosById = useMemo(
    () => Object.fromEntries(productos.map((producto) => [producto.id, producto])),
    [productos]
  );

  useEffect(() => {
    if (posMethods.length === 0) return;
    const stillValid = posMethods.some((m) => m.id === metodoPago);
    if (!stillValid) setMetodoPago(posMethods[0].id);
  }, [posMethods, metodoPago]);

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
        const prodRes = await fetch('/api/productos?activeOnly=true&sortByPopularity=true&includeIngredients=true');
        const prodJson = await prodRes.json();
        setProductos(prodJson);

        // 4. Cargar clientes
        const cliRes = await fetch('/api/clientes');
        const cliJson = await cliRes.json();
        setClientes(cliJson);

        // 5. Promociones vigentes
        const promoRes = await fetch('/api/descuentos?activeOnly=true');
        const promoJson = await promoRes.json();
        setPromociones(
          Array.isArray(promoJson) ? promoJson.filter((p) => isPromoActive(p)) : []
        );
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

  const showComboStockError = (producto, cartState = cart) => {
    const limiting = getComboLimitingIngredient(producto, cartState, productosById);
    const message = limiting
      ? `Sin stock suficiente de "${limiting.nombre}" para preparar ${producto.nombre}`
      : `No hay ingredientes disponibles para ${producto.nombre}`;
    setMensajeError(message);
    setTimeout(() => setMensajeError(''), 3500);
  };

  const addToCart = (producto) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.productoId === producto.id);
      if (existing) {
        const nextQuantity = existing.cantidad + 1;
        if (!canIncreaseCartItem(producto, prevCart, productosById, nextQuantity)) {
          if (producto.esCombo) {
            showComboStockError(producto, prevCart);
          } else {
            setMensajeError(`Stock máximo alcanzado para ${producto.nombre}`);
            setTimeout(() => setMensajeError(''), 3000);
          }
          return prevCart;
        }
        return prevCart.map(item =>
          item.productoId === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      } else {
        if (producto.esCombo) {
          if (getComboAvailableToAdd(producto, prevCart, productosById) <= 0) {
            showComboStockError(producto, prevCart);
            return prevCart;
          }
        } else if (producto.stock <= 0) {
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

          const producto = productosById[productoId];
          if (delta > 0 && !canIncreaseCartItem(producto, prevCart, productosById, nuevaCantidad)) {
            if (producto?.esCombo) {
              showComboStockError(producto, prevCart);
            } else {
              setMensajeError(`Stock máximo alcanzado para ${item.nombre}`);
              setTimeout(() => setMensajeError(''), 3000);
            }
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
  const descuentoLineas = cart.reduce(
    (acc, item) => acc + ((item.descuentoLinea || 0) * item.cantidad),
    0
  );
  const subtotalNeto = Math.max(0, subtotal - descuentoLineas);

  const { promo: mejorPromo, discount: descuentoPromoAuto } = useMemo(
    () => getBestPromoForCart(promociones, cart, productosById),
    [promociones, cart, productosById]
  );

  const promoAplicada = useMemo(() => {
    if (selectedPromoId === 'none') return null;
    if (selectedPromoId === 'auto') return mejorPromo;
    return promociones.find((p) => p.id === parseInt(selectedPromoId)) || null;
  }, [selectedPromoId, mejorPromo, promociones]);

  const descuentoPromo = useMemo(() => {
    if (!promoAplicada) return 0;
    return estimatePromoDiscount(promoAplicada, cart, productosById);
  }, [promoAplicada, cart, productosById]);

  const descuentoManual = Math.max(0, parseFloat(descuentoGlobal || 0));
  const impuestoPct = parseFloat(configs?.impuesto_porcentaje || '0');
  const baseImpuesto = Math.max(0, subtotalNeto - descuentoPromo - descuentoManual);
  const impuesto = baseImpuesto * (impuestoPct / 100);
  const totalDescuentos = descuentoLineas + descuentoPromo + descuentoManual;
  const total = Math.max(0, baseImpuesto + impuesto);

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

    if (selectedMethod?.esCredito && !selectedClienteId) {
      setMensajeError('Debe seleccionar un cliente para compras a crédito.');
      return;
    }

    if (selectedMethod?.esMixto) {
      if (Math.abs(sumaMixta - total) > 0.01) {
        setMensajeError(`Los montos especificados ($${sumaMixta.toFixed(2)}) no coinciden con el total ($${total.toFixed(2)})`);
        return;
      }
    }

    const comboSinStock = cart.find((item) => {
      const producto = productosById[item.productoId];
      return producto?.esCombo && item.cantidad > getComboMaxInCart(producto, cart, productosById);
    });

    if (comboSinStock) {
      const producto = productosById[comboSinStock.productoId];
      showComboStockError(producto);
      return;
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

    if (selectedMethod?.esCredito && !selectedClienteId) {
      setMensajeError('Debe seleccionar un cliente para compras a crédito.');
      return;
    }

    if (selectedMethod?.esMixto) {
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
          descuentoManual,
          descuentoId: promoAplicada?.id || null,
          metodoPago,
          montosPago: selectedMethod?.esMixto ? montosMixto : undefined,
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
        setSelectedPromoId('auto');
        setSelectedClienteId('');
        setMetodoPago(posMethods[0]?.id || 'efectivo');
        setMontosMixto({});

        // Recargar inventario actualizado
        const prodRes = await fetch('/api/productos?activeOnly=true&sortByPopularity=true&includeIngredients=true');
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

      if (ventaObj.descuento?.nombre) {
        y += 4;
        doc.setFontSize(7);
        doc.text(`Promo: ${ventaObj.descuento.nombre}`, 5, y);
        doc.setFontSize(8);
      }

      if (parseFloat(ventaObj.impuesto || 0) > 0) {
        y += 4;
        doc.text(`Impuesto:`, 40, y, { align: 'right' });
        doc.text(`$${parseFloat(ventaObj.impuesto).toFixed(2)}`, 75, y, { align: 'right' });
      }

      y += 4;
      doc.setFont('Helvetica', 'bold');
      doc.text(`Total:`, 40, y, { align: 'right' });
      doc.text(`$${parseFloat(ventaObj.total).toFixed(2)}`, 75, y, { align: 'right' });
      
      y += 5;
      doc.setFont('Helvetica', 'normal');
      doc.text(`Metodo Pago: ${labelFor(ventaObj.metodoPago)}`, 5, y);

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
              const comboMax = p.esCombo ? getComboMaxInCart(p, cart, productosById) : null;
              const availableQty = p.esCombo
                ? comboMax - (inCartItem?.cantidad || 0)
                : p.stock - (inCartItem?.cantidad || 0);
              const comboSinStock = p.esCombo && comboMax <= 0;

              return (
                <div 
                  key={p.id} 
                  className={`product-card pos-product-card glass-panel ${(p.stock <= p.stockMinimo && !p.esCombo) || comboSinStock ? 'low-stock-border' : ''}`}
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
                        <span className={`stock-indicator ${availableQty <= 3 ? 'text-danger' : 'text-secondary'}`}>
                          Prep: {comboMax}
                        </span>
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
              <div key={item.productoId} className="cart-item pos-cart-row">
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
            <label className="label-field">Promoción</label>
            <select
              value={selectedPromoId}
              onChange={(e) => setSelectedPromoId(e.target.value)}
              className="input-field select-field"
            >
              <option value="auto">
                Automática{mejorPromo ? ` (${mejorPromo.nombre})` : ''}
              </option>
              <option value="none">Sin promoción</option>
              {promociones.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nombre}
                </option>
              ))}
            </select>
            {promoAplicada && descuentoPromo > 0 ? (
              <p className="field-hint text-gold">
                <Ticket size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                {promoAplicada.nombre}: -{formatCurrency(descuentoPromo)}
              </p>
            ) : null}
          </div>

          <div className="checkout-field">
            <label className="label-field">Descuento manual ($)</label>
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
          {impuesto > 0 ? (
            <div className="summary-row">
              <span>Impuesto ({impuestoPct}%):</span>
              <span>{formatCurrency(impuesto)}</span>
            </div>
          ) : null}
          <div className="summary-row total-row">
            <span>Total a Cobrar:</span>
            <span className="text-gold">{formatCurrency(total)}</span>
          </div>
        </div>

        <button 
          onClick={openConfirmation}
          disabled={cart.length === 0 || cargandoCobro}
          className="btn btn-primary w-full cobro-btn pos-checkout-btn"
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
                  setMontosMixto({});
                }}
                className="input-field select-field"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                {posMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedMethod?.esMixto && (
              <div className="mixto-inputs glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--warning-orange)', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.03)', margin: '8px 0' }}>
                <h5 style={{ fontSize: '11px', color: 'var(--warning-orange)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Montos de pago mixto</h5>
                {mixtoMethods.map((method) => (
                  <div key={method.id} className="mixto-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span>{method.label} ($)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={montosMixto[method.id] ?? ''}
                      onChange={(e) =>
                        setMontosMixto((prev) => ({
                          ...prev,
                          [method.id]: e.target.value,
                        }))
                      }
                      className="input-field compacto"
                      style={{ width: '100px', padding: '4px 8px', textAlign: 'right' }}
                    />
                  </div>
                ))}
                {Math.abs(sumaMixta - total) > 0.01 && (
                  <div style={{ color: 'var(--error-red)', fontSize: '11px', marginTop: '4px' }}>
                    La suma de montos (${sumaMixta.toFixed(2)}) no coincide con el total (${total.toFixed(2)}).
                  </div>
                )}
              </div>
            )}

            {selectedMethod?.esCredito && !selectedClienteId && (
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
          {selectedMethod?.requiereCambio && (
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
                (selectedMethod?.esCredito && !selectedClienteId) ||
                (selectedMethod?.requiereCambio && montoRecibido && parseFloat(montoRecibido) < total) ||
                (selectedMethod?.esMixto && Math.abs(sumaMixta - total) > 0.01)
              }
            >
              {cargandoCobro ? 'Procesando Venta...' : 'Confirmar y Registrar Venta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
