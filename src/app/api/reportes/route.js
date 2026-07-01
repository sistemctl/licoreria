import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPaymentMethodsFromDb, getMethodLabel } from '@/lib/paymentMethods';
import { requirePermission } from '@/lib/permissions.server';

export async function GET(request) {
  try {
    const auth = await requirePermission('reportes');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get('range') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);
    startDate.setHours(0, 0, 0, 0);

    const prevEndDate = new Date(startDate);
    prevEndDate.setMilliseconds(-1);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - range);

    const ventasRecientes = await prisma.venta.findMany({
      where: {
        fecha: { gte: startDate },
        estado: 'completada',
      },
    });

    const ventasPeriodoAnterior = await prisma.venta.findMany({
      where: {
        fecha: { gte: prevStartDate, lte: prevEndDate },
        estado: 'completada',
      },
    });

    const totalVentasMonto = ventasRecientes.reduce((acc, v) => acc + parseFloat(v.total), 0);
    const totalVentasMontoAnterior = ventasPeriodoAnterior.reduce((acc, v) => acc + parseFloat(v.total), 0);
    const cantidadVentas = ventasRecientes.length;
    const ticketPromedio = cantidadVentas > 0 ? totalVentasMonto / cantidadVentas : 0;

    const comprasRecientes = await prisma.compra.findMany({
      where: { fecha: { gte: startDate } },
    });
    const comprasPeriodoAnterior = await prisma.compra.findMany({
      where: { fecha: { gte: prevStartDate, lte: prevEndDate } },
    });
    const totalComprasMonto = comprasRecientes.reduce((acc, c) => acc + parseFloat(c.total), 0);
    const totalComprasMontoAnterior = comprasPeriodoAnterior.reduce(
      (acc, c) => acc + parseFloat(c.total),
      0
    );

    const cuentasCobrar = await prisma.cuentaPorCobrar.findMany({
      where: { estado: { in: ['pendiente', 'vencida'] } },
      include: { cliente: true },
    });
    const totalPendienteCobro = cuentasCobrar.reduce(
      (acc, c) => acc + parseFloat(c.saldoPendiente),
      0
    );
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cuentasVencidas = cuentasCobrar.filter((c) => {
      if (c.estado === 'vencida') return true;
      if (c.fechaLimite) return new Date(c.fechaLimite) < hoy;
      return false;
    });

    const ventaDetalles = await prisma.ventaDetalle.findMany({
      where: {
        venta: {
          fecha: { gte: startDate },
          estado: 'completada',
        },
      },
      include: {
        producto: { include: { categoria: true } },
      },
    });

    let utilidadBrutaEstimada = 0;
    const profitByProduct = {};
    const soldByProductId = {};
    const soldQtyByProductId = {};

    ventaDetalles.forEach((d) => {
      const ingreso =
        (parseFloat(d.precioUnitario) - parseFloat(d.descuentoLinea || 0)) * d.cantidad;
      const costo = parseFloat(d.producto.precioCompra) * d.cantidad;
      const utilidad = ingreso - costo;
      utilidadBrutaEstimada += utilidad;

      const pName = d.producto.nombre;
      profitByProduct[pName] = (profitByProduct[pName] || 0) + utilidad;
      soldByProductId[d.productoId] = true;
      soldQtyByProductId[d.productoId] =
        (soldQtyByProductId[d.productoId] || 0) + d.cantidad;
    });

    const margenPorcentaje =
      totalVentasMonto > 0 ? (utilidadBrutaEstimada / totalVentasMonto) * 100 : 0;

    const ventasPorDia = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      ventasPorDia[d.toISOString().split('T')[0]] = 0;
    }
    ventasRecientes.forEach((v) => {
      const dateString = v.fecha.toISOString().split('T')[0];
      if (ventasPorDia[dateString] !== undefined) {
        ventasPorDia[dateString] += parseFloat(v.total);
      }
    });

    const ventasPorHora = Array(24).fill(0);
    ventasRecientes.forEach((v) => {
      const h = new Date(v.fecha).getHours();
      ventasPorHora[h] += parseFloat(v.total);
    });
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const agrupadoProductos = {};
    ventaDetalles.forEach((d) => {
      const pName = d.producto.nombre;
      agrupadoProductos[pName] = (agrupadoProductos[pName] || 0) + d.cantidad;
    });
    const topProductosSorted = Object.entries(agrupadoProductos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topProfitSorted = Object.entries(profitByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const agrupadoCategorias = {};
    ventaDetalles.forEach((d) => {
      const catName = d.producto.categoria?.nombre || 'Otros';
      agrupadoCategorias[catName] =
        (agrupadoCategorias[catName] || 0) +
        (parseFloat(d.precioUnitario) - parseFloat(d.descuentoLinea || 0)) * d.cantidad;
    });

    const paymentMethods = await getPaymentMethodsFromDb(prisma);
    const agrupadoPagos = {};
    let totalEfectivo = 0;
    let totalDigital = 0;
    ventasRecientes.forEach((v) => {
      agrupadoPagos[v.metodoPago] = (agrupadoPagos[v.metodoPago] || 0) + parseFloat(v.total);
      if (v.metodoPago === 'efectivo') {
        totalEfectivo += parseFloat(v.total);
      } else if (v.metodoPago !== 'credito' && v.metodoPago !== 'mixto') {
        totalDigital += parseFloat(v.total);
      } else if (v.metodoPago === 'mixto' && v.montosPago) {
        const mp = typeof v.montosPago === 'object' ? v.montosPago : {};
        totalEfectivo += parseFloat(mp.efectivo || 0);
        Object.entries(mp).forEach(([k, val]) => {
          if (k !== 'efectivo') totalDigital += parseFloat(val || 0);
        });
      }
    });

    const piePayKeys = Object.keys(agrupadoPagos);
    const piePayLabels = piePayKeys.map((id) => getMethodLabel(id, paymentMethods));
    const piePayData = Object.values(agrupadoPagos);

    const productosActivos = await prisma.producto.findMany({
      where: { activo: true, esCombo: false },
      include: { categoria: true },
    });

    const criticosList = productosActivos.filter((p) => p.stock <= p.stockMinimo);

    const reposicionSugerida = productosActivos
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || '—',
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        vendidoEnRango: soldQtyByProductId[p.id] || 0,
        sugerido: Math.max(0, p.stockMinimo - p.stock + (soldQtyByProductId[p.id] || 0)),
      }))
      .filter((p) => p.stock <= p.stockMinimo || p.vendidoEnRango > p.stock)
      .sort((a, b) => b.vendidoEnRango - a.vendidoEnRango)
      .slice(0, 15);

    const bajaRotacion = productosActivos
      .filter((p) => p.stock > 0 && !soldByProductId[p.id])
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || '—',
        stock: p.stock,
        precioVentaDetal: parseFloat(p.precioVentaDetal),
      }));

    const topVendidosConStock = topProductosSorted.slice(0, 8).map(([nombre, qty]) => {
      const prod = productosActivos.find((p) => p.nombre === nombre);
      return {
        nombre,
        vendido: qty,
        stock: prod?.stock ?? 0,
        stockMinimo: prod?.stockMinimo ?? 0,
      };
    });

    const fechaLimiteVence = new Date();
    fechaLimiteVence.setDate(fechaLimiteVence.getDate() + 30);
    const lotesProximos = await prisma.lote.findMany({
      where: {
        fechaVencimiento: { gte: new Date(), lte: fechaLimiteVence },
      },
      include: { producto: true },
      orderBy: { fechaVencimiento: 'asc' },
      take: 10,
    });

    const turnosCaja = await prisma.cajaTurno.findMany({
      where: { fechaApertura: { gte: startDate } },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { fechaApertura: 'desc' },
      take: 10,
    });
    const turnosAbiertos = turnosCaja.filter((t) => t.estado === 'abierta').length;
    const turnosConDiferencia = turnosCaja.filter(
      (t) => t.diferencia !== null && parseFloat(t.diferencia) !== 0
    );

    const latestVentas = await prisma.venta.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: { cliente: true },
    });
    const latestCompras = await prisma.compra.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: { proveedor: true },
    });
    const latestCuentasCobrar = cuentasCobrar.slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalVentasMonto,
        cantidadVentas,
        ticketPromedio,
        utilidadBrutaEstimada,
        margenPorcentaje,
        totalComprasMonto,
        totalPendienteCobro,
        totalProductos: productosActivos.length,
        stockCriticoCount: criticosList.length,
        cuentasVencidasCount: cuentasVencidas.length,
        lotesPorVencerCount: lotesProximos.length,
        turnosAbiertos,
        turnosConDiferenciaCount: turnosConDiferencia.length,
        totalEfectivo,
        totalDigital,
      },
      comparativo: {
        ventasAnterior: totalVentasMontoAnterior,
        ventasVariacion:
          totalVentasMontoAnterior > 0
            ? ((totalVentasMonto - totalVentasMontoAnterior) / totalVentasMontoAnterior) * 100
            : null,
        comprasAnterior: totalComprasMontoAnterior,
        comprasVariacion:
          totalComprasMontoAnterior > 0
            ? ((totalComprasMonto - totalComprasMontoAnterior) / totalComprasMontoAnterior) * 100
            : null,
        ticketAnterior:
          ventasPeriodoAnterior.length > 0
            ? totalVentasMontoAnterior / ventasPeriodoAnterior.length
            : 0,
        cantidadVentasAnterior: ventasPeriodoAnterior.length,
      },
      charts: {
        lineLabels: Object.keys(ventasPorDia),
        lineData: Object.values(ventasPorDia),
        hourLabels,
        hourData: ventasPorHora,
        barLabels: topProductosSorted.map((item) => item[0]),
        barData: topProductosSorted.map((item) => item[1]),
        profitLabels: topProfitSorted.map((item) => item[0]),
        profitData: topProfitSorted.map((item) => item[1]),
        pieCategoryLabels: Object.keys(agrupadoCategorias),
        pieCategoryData: Object.values(agrupadoCategorias),
        piePayLabels,
        piePayData,
      },
      tables: {
        criticosList: criticosList.slice(0, 15).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria?.nombre,
          stock: p.stock,
          stockMinimo: p.stockMinimo,
        })),
        lotesProximos: lotesProximos.map((l) => ({
          id: l.id,
          producto: l.producto?.nombre,
          cantidad: l.cantidad,
          fechaVencimiento: l.fechaVencimiento,
        })),
        reposicionSugerida,
        bajaRotacion,
        topVendidosConStock,
        cuentasVencidas: cuentasVencidas.slice(0, 10).map((c) => ({
          id: c.id,
          cliente: c.cliente?.nombre,
          saldoPendiente: parseFloat(c.saldoPendiente),
          fechaLimite: c.fechaLimite,
          estado: c.estado,
        })),
        cajaReciente: turnosCaja.map((t) => ({
          id: t.id,
          cajero: t.usuario?.nombre,
          fechaApertura: t.fechaApertura,
          fechaCierre: t.fechaCierre,
          estado: t.estado,
          diferencia: t.diferencia !== null ? parseFloat(t.diferencia) : null,
          montoApertura: parseFloat(t.montoApertura),
        })),
      },
      details: {
        latestVentas,
        latestCompras,
        latestCuentasCobrar,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
