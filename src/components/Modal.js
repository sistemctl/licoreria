'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-color: var(--accent-gold);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          padding-bottom: 12px;
        }

        .modal-header h3 {
          color: var(--accent-gold);
          font-size: 18px;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: var(--error-red);
        }

        .modal-body {
          padding-top: 8px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
