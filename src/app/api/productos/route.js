import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categoriaId = searchParams.get('categoriaId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const barcode = searchParams.get('barcode');
    const sortByPopularity = searchParams.get('sortByPopularity') === 'true';
    const lowStock = searchParams.get('lowStock') === 'true';

    // Query filters
    const where = {};

    if (barcode) {
      where.codigoBarras = barcode;
    } else if (query) {
      where.OR = [
        { nombre: { contains: query, mode: 'insensitive' } },
        { codigoBarras: { contains: query, mode: 'insensitive' } },
        { marca: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId);
    }

    if (activeOnly) {
      where.activo = true;
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: true
      },
      orderBy: { nombre: 'asc' }
    });

    // Filtro post-consulta para stock bajo si se requiere
    let result = productos;
    if (lowStock) {
      result = productos.filter(p => p.stock <= p.stockMinimo);
    }

    if (sortByPopularity) {
      try {
        const popularMap = {};
        const popularityData = await prisma.ventaDetalle.groupBy({
          by: ['productoId'],
          _sum: {
            cantidad: true
          }
        });
        
        popularityData.forEach(p => {
          popularMap[p.productoId] = p._sum.cantidad || 0;
        });

        result.sort((a, b) => {
          const salesA = popularMap[a.id] || 0;
          const salesB = popularMap[b.id] || 0;
          if (salesB !== salesA) {
            return salesB - salesA; // De mayor a menor ventas
          }
          return a.nombre.localeCompare(b.nombre); // Orden alfabético si hay empate
        });
      } catch (err) {
        console.error('Error al ordenar por popularidad:', err);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      codigoBarras,
      nombre,
      marca,
      descripcion,
      contenidoMl,
      gradoAlcoholico,
      imagenUrl,
      categoriaId,
      precioCompra,
      precioVentaDetal,
      precioVentaMayor,
      stock,
      stockMinimo,
      unidadMedida,
      unidadesPorCaja,
      esCombo
    } = body;

    if (!nombre || !categoriaId || precioCompra === undefined || precioVentaDetal === undefined) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevo = await prisma.producto.create({
      data: {
        codigoBarras: codigoBarras || null,
        nombre,
        marca,
        descripcion,
        contenidoMl: contenidoMl ? parseInt(contenidoMl) : null,
        gradoAlcoholico: gradoAlcoholico ? parseFloat(gradoAlcoholico) : null,
        imagenUrl,
        categoriaId: parseInt(categoriaId),
        precioCompra: parseFloat(precioCompra),
        precioVentaDetal: parseFloat(precioVentaDetal),
        precioVentaMayor: precioVentaMayor ? parseFloat(precioVentaMayor) : null,
        stock: stock ? parseInt(stock) : 0,
        stockMinimo: stockMinimo ? parseInt(stockMinimo) : 5,
        unidadMedida: unidadMedida || 'unidad',
        unidadesPorCaja: unidadesPorCaja ? parseInt(unidadesPorCaja) : null,
        esCombo: !!esCombo
      }
    });

    await logAudit({
      accion: 'CREAR_PRODUCTO',
      tablaAfectada: 'productos',
      registroId: nuevo.id,
      datosNuevos: nuevo
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const body = await request.json();
    const anterior = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const actualizadaData = {
      codigoBarras: body.codigoBarras !== undefined ? (body.codigoBarras || null) : anterior.codigoBarras,
      nombre: body.nombre !== undefined ? body.nombre : anterior.nombre,
      marca: body.marca !== undefined ? body.marca : anterior.marca,
      descripcion: body.descripcion !== undefined ? body.descripcion : anterior.descripcion,
      contenidoMl: body.contenidoMl !== undefined ? (body.contenidoMl ? parseInt(body.contenidoMl) : null) : anterior.contenidoMl,
      gradoAlcoholico: body.gradoAlcoholico !== undefined ? (body.gradoAlcoholico ? parseFloat(body.gradoAlcoholico) : null) : anterior.gradoAlcoholico,
      imagenUrl: body.imagenUrl !== undefined ? body.imagenUrl : anterior.imagenUrl,
      categoriaId: body.categoriaId !== undefined ? parseInt(body.categoriaId) : anterior.categoriaId,
      precioCompra: body.precioCompra !== undefined ? parseFloat(body.precioCompra) : parseFloat(anterior.precioCompra),
      precioVentaDetal: body.precioVentaDetal !== undefined ? parseFloat(body.precioVentaDetal) : parseFloat(anterior.precioVentaDetal),
      precioVentaMayor: body.precioVentaMayor !== undefined ? (body.precioVentaMayor ? parseFloat(body.precioVentaMayor) : null) : (anterior.precioVentaMayor ? parseFloat(anterior.precioVentaMayor) : null),
      stock: body.stock !== undefined ? parseInt(body.stock) : anterior.stock,
      stockMinimo: body.stockMinimo !== undefined ? parseInt(body.stockMinimo) : anterior.stockMinimo,
      unidadMedida: body.unidadMedida !== undefined ? body.unidadMedida : anterior.unidadMedida,
      unidadesPorCaja: body.unidadesPorCaja !== undefined ? (body.unidadesPorCaja ? parseInt(body.unidadesPorCaja) : null) : anterior.unidadesPorCaja,
      esCombo: body.esCombo !== undefined ? !!body.esCombo : anterior.esCombo,
      activo: body.activo !== undefined ? !!body.activo : anterior.activo
    };

    const actualizado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: actualizadaData
    });

    // Log general de edición
    await logAudit({
      accion: 'EDITAR_PRODUCTO',
      tablaAfectada: 'productos',
      registroId: actualizado.id,
      datosAnteriores: anterior,
      datosNuevos: actualizado
    });

    // Auditar cambio de precios específicamente
    const precioDetalAnt = parseFloat(anterior.precioVentaDetal);
    const precioDetalNvo = parseFloat(actualizado.precioVentaDetal);
    const precioMayorAnt = anterior.precioVentaMayor ? parseFloat(anterior.precioVentaMayor) : null;
    const precioMayorNvo = actualizado.precioVentaMayor ? parseFloat(actualizado.precioVentaMayor) : null;

    if (precioDetalAnt !== precioDetalNvo || precioMayorAnt !== precioMayorNvo) {
      await logAudit({
        accion: 'CAMBIO_PRECIO',
        tablaAfectada: 'productos',
        registroId: actualizado.id,
        datosAnteriores: { precioVentaDetal: precioDetalAnt, precioVentaMayor: precioMayorAnt },
        datosNuevos: { precioVentaDetal: precioDetalNvo, precioVentaMayor: precioMayorNvo }
      });
    }

    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const anterior = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const desactivado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    await logAudit({
      accion: 'DESACTIVAR_PRODUCTO',
      tablaAfectada: 'productos',
      registroId: desactivado.id,
      datosAnteriores: anterior,
      datosNuevos: desactivado
    });

    return NextResponse.json(desactivado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
