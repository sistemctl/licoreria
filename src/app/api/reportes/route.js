import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get('range') || '30'); // 7 o 30 días

    // Rango de fechas
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    // 1. Resumen de Métricas (Tarjetas)
    const ventasRecientes = await prisma.venta.findMany({
      where: {
        fecha: { gte: startDate },
        estado: 'completada'
      }
    });

    const totalVentasMonto = ventasRecientes.reduce((acc, v) => acc + parseFloat(v.total), 0);
    const cantidadVentas = ventasRecientes.length;

    const comprasRecientes = await prisma.compra.findMany({
      where: { fecha: { gte: startDate } }
    });
    const totalComprasMonto = comprasRecientes.reduce((acc, c) => acc + parseFloat(c.total), 0);

    const cuentasCobrar = await prisma.cuentaPorCobrar.findMany({
      where: { estado: 'pendiente' }
    });
    const totalPendienteCobro = cuentasCobrar.reduce((acc, c) => acc + parseFloat(c.saldoPendiente), 0);

    // 2. Gráfica de Líneas: Ventas por día
    const ventasPorDia = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      ventasPorDia[dateString] = 0;
    }

    ventasRecientes.forEach(v => {
      const dateString = v.fecha.toISOString().split('T')[0];
      if (ventasPorDia[dateString] !== undefined) {
        ventasPorDia[dateString] += parseFloat(v.total);
      }
    });

    const lineLabels = Object.keys(ventasPorDia);
    const lineData = Object.values(ventasPorDia);

    // 3. Top 10 Productos más vendidos
    const ventaDetalles = await prisma.ventaDetalle.findMany({
      where: {
        venta: {
          fecha: { gte: startDate },
          estado: 'completada'
        }
      },
      include: {
        producto: true
      }
    });

    const agrupadoProductos = {};
    ventaDetalles.forEach(d => {
      const pName = d.producto.nombre;
      agrupadoProductos[pName] = (agrupadoProductos[pName] || 0) + d.cantidad;
    });

    const topProductosSorted = Object.entries(agrupadoProductos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const barLabels = topProductosSorted.map(item => item[0]);
    const barData = topProductosSorted.map(item => item[1]);

    // 4. Ventas por Categoría (Gráfica de Pastel)
    const agrupadoCategorias = {};
    ventaDetalles.forEach(d => {
      const catName = d.producto.categoria?.nombre || 'Otros';
      agrupadoCategorias[catName] = (agrupadoCategorias[catName] || 0) + (parseFloat(d.precioUnitario) - parseFloat(d.descuentoLinea)) * d.cantidad;
    });

    const pieCategoryLabels = Object.keys(agrupadoCategorias);
    const pieCategoryData = Object.values(agrupadoCategorias);

    // 5. Ventas por Método de Pago (Gráfica de Pastel)
    const agrupadoPagos = {};
    ventasRecientes.forEach(v => {
      agrupadoPagos[v.metodoPago] = (agrupadoPagos[v.metodoPago] || 0) + parseFloat(v.total);
    });

    const piePayLabels = Object.keys(agrupadoPagos);
    const piePayData = Object.values(agrupadoPagos);

    // 6. Inventario Valorizado e Info Crítica
    const totalProductos = await prisma.producto.count({ where: { activo: true } });
    const stockCritico = await prisma.producto.count({
      where: {
        activo: true,
        stock: { lte: prisma.raw ? undefined : 5 } // Prisma client stock <= stockMinimo filter
      }
    });

    // Productos con stock crítico
    const productosCriticos = await prisma.producto.findMany({
      where: {
        activo: true,
        esCombo: false
      },
      include: { categoria: true }
    });
    const criticosList = productosCriticos.filter(p => p.stock <= p.stockMinimo);

    // Lotes próximos a vencer (en menos de 30 días)
    const fechaLimiteVence = new Date();
    fechaLimiteVence.setDate(fechaLimiteVence.getDate() + 30);
    const lotesProximos = await prisma.lote.findMany({
      where: {
        fechaVencimiento: {
          gte: new Date(),
          lte: fechaLimiteVence
        }
      },
      include: { producto: true },
      orderBy: { fechaVencimiento: 'asc' }
    });

    // Listados de detalle para modal interactivo
    const latestVentas = await prisma.venta.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: { cliente: true }
    });

    const latestCompras = await prisma.compra.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: { proveedor: true }
    });

    const latestCuentasCobrar = await prisma.cuentaPorCobrar.findMany({
      where: { estado: 'pendiente' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { cliente: true }
    });

    return NextResponse.json({
      metrics: {
        totalVentasMonto,
        cantidadVentas,
        totalComprasMonto,
        totalPendienteCobro,
        totalProductos,
        stockCriticoCount: criticosList.length
      },
      charts: {
        lineLabels,
        lineData,
        barLabels,
        barData,
        pieCategoryLabels,
        pieCategoryData,
        piePayLabels,
        piePayData
      },
      tables: {
        criticosList,
        lotesProximos
      },
      details: {
        latestVentas,
        latestCompras,
        latestCuentasCobrar
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
