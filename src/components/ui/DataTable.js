'use client';

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

export default function DataTable({
  headers,
  data = [],
  renderRow,
  searchVal,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyTitle = 'Sin registros',
  emptyDescription = 'No se encontraron resultados para esta búsqueda.',
}) {
  return (
    <div className="table-wrapper">
      {onSearchChange && (
        <div className="table-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchVal}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field search-input"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      <div className="table-container">
        <table className="custom-table ui-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => renderRow(row, index))
            ) : (
              <tr className="table-empty">
                <td colSpan={headers.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="table-pagination">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-secondary btn-pagination"
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>

          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-pagination"
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
