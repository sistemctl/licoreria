'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ProductPicker({
  open,
  onClose,
  products = [],
  onSelect,
  searchPlaceholder = 'Buscar por nombre, marca o código...',
  title = 'Seleccionar producto',
  subtitle = 'Elige un producto de la lista',
  priceLabel = 'Costo',
  priceField = 'precioCompra',
}) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!mounted || !open) return null;

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.codigoBarras && p.codigoBarras.includes(query))
    );
  });

  return createPortal(
    <div className="product-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="product-picker-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="product-picker-modal__header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="product-picker-modal__search">
          <div className="table-search-bar product-picker-modal__search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field search-input"
              autoFocus
            />
          </div>
        </div>

        <div className="product-picker-modal__list">
          {filtered.length === 0 ? (
            <p className="no-data-text">No hay productos que coincidan con la búsqueda.</p>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="product-picker-item"
                onClick={() => {
                  onSelect(p);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(p);
                    onClose();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="product-picker-item__thumb">
                  {p.imagenUrl ? <img src={p.imagenUrl} alt="" /> : <Search size={22} />}
                </div>
                <div className="product-picker-item__body">
                  <div className="product-picker-item__name">{p.nombre}</div>
                  <div className="product-picker-item__meta">
                    {p.marca ? <span className="product-tag">{p.marca}</span> : null}
                    {p.contenidoMl ? <span className="product-tag">{p.contenidoMl} ml</span> : null}
                    {p.codigoBarras ? <span className="product-tag">Cód: {p.codigoBarras}</span> : null}
                  </div>
                </div>
                <div className="product-picker-item__price">
                  <span className="product-picker-item__price-label">{priceLabel}</span>
                  <span className="product-picker-item__price-value">
                    {formatCurrency(p[priceField] ?? 0)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
