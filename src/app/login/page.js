'use client';

import '@/styles/modules/login.css';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KeyRound, User, AlertCircle } from 'lucide-react';
import { useConfig } from '@/components/ConfigProvider';

export default function Login() {
  const { configs, loading } = useConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    console.log('handleSubmit executing...');
    e.preventDefault();
    setError('');
    setLoadingSubmit(true);

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Inténtelo más tarde.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* Panel Izquierdo: Formulario de Acceso */}
        <div className="login-left-side">
          <div className="login-card glass-panel">
            <div className="login-header">
              {configs?.logo_url ? (
                <div className="login-logo-wrap">
                  <img
                    src={configs.logo_url}
                    alt={configs.nombre_negocio || 'Logo'}
                  />
                </div>
              ) : null}
              <h2>{configs?.nombre_negocio || 'Mi Licorería'}</h2>
              <p>Inicia sesión para abrir turno y operar</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="label-field">Nombre de usuario</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    required
                    placeholder="Escriba su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-input-field"
                  />
                  <User size={16} className="input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="label-field">Contraseña</label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input-field"
                  />
                  <KeyRound size={16} className="input-icon" />
                </div>
              </div>

              <button type="submit" disabled={loadingSubmit} className="btn login-btn">
                {loadingSubmit ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>

        {/* Panel Derecho: Presentación y Animación Vectorial SVG */}
        <div className="login-right-side">
          <div className="vector-art-wrapper">
            <svg viewBox="0 0 400 400" className="vector-svg">
              <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a67c26" />
                  <stop offset="100%" stopColor="#d4a853" />
                </linearGradient>
              </defs>
              
              {/* Círculos abstractos de fondo */}
              <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(166, 124, 38, 0.08)" strokeWidth="1" strokeDasharray="6,6" />
              <circle cx="200" cy="200" r="100" fill="none" stroke="rgba(166, 124, 38, 0.04)" strokeWidth="1" />
              
              {/* Partículas / Burbujas flotantes animadas */}
              <circle cx="110" cy="260" r="5" className="bubble bubble-1" />
              <circle cx="280" cy="170" r="7" className="bubble bubble-2" />
              <circle cx="150" cy="110" r="4" className="bubble bubble-3" />
              <circle cx="250" cy="290" r="6" className="bubble bubble-4" />
              <circle cx="220" cy="90" r="5" className="bubble bubble-5" />

              {/* Copa minimalista */}
              <g className="vector-glass">
                <path d="M220,310 L270,310 M245,310 L245,250 M215,170 L275,170 C275,225 215,225 215,170" 
                      fill="none" 
                      stroke="url(#gold-gradient)" 
                      strokeWidth="2.5" 
                      strokeLinejoin="round" 
                      strokeLinecap="round" />
                {/* Contenido / líquido de la copa */}
                <path d="M222,192 C235,186 255,186 268,192" fill="none" stroke="rgba(166, 124, 38, 0.5)" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Botella premium minimalista */}
              <g className="vector-bottle">
                <path d="M165,310 L215,310 L215,190 L202,130 L202,80 L178,80 L178,130 L165,190 Z" 
                      fill="none" 
                      stroke="url(#gold-gradient)" 
                      strokeWidth="3" 
                      strokeLinejoin="round" 
                      strokeLinecap="round" />
                {/* Cuello / Tapa */}
                <rect x="174" y="68" width="42" height="12" rx="2" fill="url(#gold-gradient)" />
                {/* Detalles internos */}
                <line x1="190" y1="80" x2="190" y2="310" stroke="rgba(166, 124, 38, 0.15)" strokeWidth="1" strokeDasharray="4,4" />
                <path d="M175,210 C182,202 198,202 205,210" fill="none" stroke="url(#gold-gradient)" strokeWidth="1.5" />
                <path d="M170,240 C180,230 200,230 210,240" fill="none" stroke="url(#gold-gradient)" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
          
          <div className="right-side-text">
            <h3>Tu bodega, en un solo lugar</h3>
            <p>
              Inventario, caja y punto de venta conectados. Cada venta descuenta stock, cada turno queda registrado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
