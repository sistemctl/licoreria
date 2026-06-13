'use client';

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Table({ 
  headers, 
  data = [], 
  renderRow, 
  searchVal, 
  onSearchChange, 
  searchPlaceholder = 'Buscar...',
  currentPage = 1,
  totalPages = 1,
  onPageChange
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
          />
        </div>
      )}

      <div className="table-container">
        <table className="custom-table">
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
              <tr>
                <td colSpan={headers.length} className="no-data">
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="table-pagination">
          <button 
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
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-pagination"
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style jsx>{`
        .table-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .table-search-bar {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
        }

        .search-input {
          padding-left: 44px;
        }

        .no-data {
          text-align: center;
          color: var(--text-secondary);
          padding: 32px !important;
          font-style: italic;
        }

        .table-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
        }

        .pagination-info {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .btn-pagination {
          padding: 8px 16px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
