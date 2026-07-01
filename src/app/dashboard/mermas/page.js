'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { PackageMinus, Plus, Search } from 'lucide-react';

const MOTIVOS = [
  { value: 'rotura', label: 'Rotura / daño' },
  { value: 'vencimiento', label: 'Vencimiento' },
  { value: 'consumo_interno', label: 'Consumo interno' },
  { value: 'diferencia_conteo', label: 'Diferencia de conteo' },
  { value: 'robo', label: 'Robo / faltante' },
  { value: 'otro', label: 'Otro' },
];

export default function MermasPage() {
  const [mermas, setMermas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('rotura');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [mRes, pRes] = await Promise.all([
        fetch('/api/mermas'),
        fetch('/api/productos?activeOnly=true'),
      ]);
      const mJson = await mRes.json();
      const pJson = await pRes.json();
      setMermas(Array.isArray(mJson) ? mJson : []);
      setProductos((Array.isArray(pJson) ? pJson : []).filter((p) => !p.esCombo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchVal.toLowerCase();
    return mermas.filter(
      (m) =>
        m.producto?.nombre?.toLowerCase().includes(q) ||
        m.motivo?.toLowerCase().includes(q) ||
        m.usuario?.nombre?.toLowerCase().includes(q)
    );
  }, [mermas, searchVal]);

  const totalUnidades = useMemo(
    () => filtered.reduce((acc, m) => acc + m.cantidad, 0),
    [filtered]
  );

  const openModal = () => {
    setProductoId('');
    setCantidad(1);
    setMotivo('rotura');
    setMotivoDetalle('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/mermas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: parseInt(productoId),
          cantidad: parseInt(cantidad),
          motivo,
          motivoDetalle: motivoDetalle.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsModalOpen(false);
        await loadData();
      }
    } catch {
      setErrorMsg('Error de red al registrar la merma.');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = productos.find((p) => p.id === parseInt(productoId));
  const headers = ['Fecha', 'Producto', 'Cantidad', 'Motivo', 'Usuario'];

  return (
    <DashboardModule title="Mermas y ajustes">
      <ModulePanel loading={loading} loadingMessage="Cargando mermas...">
        <p className="mermas-panel-intro">
          Registra roturas, vencimientos, consumo interno y diferencias de conteo. El stock se
          descuenta al guardar.
        </p>

        <PanelToolbar
          split
          filters={
            <div className="table-search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por producto, motivo o usuario..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-field search-input"
              />
            </div>
          }
          actions={
            <>
              <span className="mermas-stat-pill" title="Resumen del listado filtrado">
                <PackageMinus size={16} aria-hidden="true" />
                <span>
                  {filtered.length} registros · {totalUnidades} uds.
                </span>
              </span>
              <button type="button" className="btn btn-primary" onClick={openModal}>
                <Plus size={18} />
                <span>Registrar merma</span>
              </button>
            </>
          }
        />

        <Table
          headers={headers}
          data={filtered}
          emptyTitle="Sin mermas registradas"
          emptyDescription="Cuando registres una pérdida de inventario, aparecerá aquí."
          renderRow={(m) => (
            <tr key={m.id}>
              <td>{formatDate(m.fecha)}</td>
              <td>
                <strong>{m.producto?.nombre}</strong>
                {m.producto?.categoria?.nombre ? (
                  <span className="text-secondary"> · {m.producto.categoria.nombre}</span>
                ) : null}
              </td>
              <td>
                <span className="badge badge-warning">{m.cantidad}</span>
              </td>
              <td>{m.motivo}</td>
              <td>{m.usuario?.nombre || '—'}</td>
            </tr>
          )}
        />
      </ModulePanel>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar merma">
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg ? <div className="error-banner">{errorMsg}</div> : null}

          <div className="form-group">
            <label className="label-field">Producto</label>
            <select
              className="input-field"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
            >
              <option value="">Seleccionar producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label-field">Cantidad</label>
            <input
              type="number"
              min={1}
              max={selectedProduct?.stock || undefined}
              className="input-field"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
            {selectedProduct ? (
              <p className="field-hint">Stock actual: {selectedProduct.stock}</p>
            ) : null}
          </div>

          <div className="form-group">
            <label className="label-field">Motivo</label>
            <select
              className="input-field"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label-field">Detalle (opcional)</label>
            <textarea
              className="input-field"
              rows={2}
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              placeholder="Ej. botella rota en mostrador"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar y descontar stock'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardModule>
  );
}
