'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, AlertCircle } from 'lucide-react';
import { useConfig } from '@/components/ConfigProvider';

export default function Login() {
  const { configs, loading } = useConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingSubmit(true);

    try {
      const res = await signIn('credentials', {
        email,
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
            <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4px' }}>
              {configs?.logo_url ? (
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  border: '1.5px solid var(--accent-gold)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  padding: '6px'
                }}>
                  <img 
                    src={configs.logo_url} 
                    alt={configs.nombre_negocio || 'Logo'} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : null}
              <h2>{configs?.nombre_negocio || 'Mi Licorería'}</h2>
              <p>Ingresa a tu cuenta para gestionar el negocio</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="label-field">Correo Electrónico</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@licoreria.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label-field">Contraseña</label>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <button type="submit" disabled={loadingSubmit} className="btn btn-primary w-full login-btn">
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
            <h3>Gestión Inteligente</h3>
            <p>
              <strong className="text-gold">Sistema de licorería especializado y hecho a la medida</strong>. Optimiza el <strong className="text-gold">inventario</strong>, acelera tus <strong className="text-gold">transacciones</strong> y audita cada movimiento en <strong className="text-gold">tiempo real</strong> con una interfaz premium y fluida.
            </p>
          </div>
        </div>

      </div>

      <style jsx>{`
        .login-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          overflow: hidden;
          padding: 20px;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 940px;
          height: 560px;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
        }

        .login-left-side {
          flex: 0 0 50%;
          width: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px;
          background: transparent;
        }

        .login-card {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        .login-header {
          text-align: center;
        }

        .login-header h2 {
          color: var(--accent-gold);
          font-size: 28px;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .login-header p {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--error-red);
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
        }

        .input-with-icon :global(.input-field) {
          padding-left: 44px;
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(0, 0, 0, 0.08);
        }

        .w-full {
          width: 100%;
        }

        .login-btn {
          margin-top: 8px;
          height: 48px;
          font-size: 15px;
        }

        .login-right-side {
          flex: 0 0 50%;
          width: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px;
          background: #ffffff;
          border-left: 1px solid rgba(0, 0, 0, 0.08);
          position: relative;
        }

        .vector-art-wrapper {
          width: 100%;
          max-width: 260px;
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .vector-svg {
          width: 100%;
          height: auto;
        }

        .right-side-text {
          max-width: 360px;
          text-align: center;
        }

        .right-side-text h3 {
          color: var(--accent-gold);
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .right-side-text p {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }

        .text-gold {
          color: #a67c26;
          font-weight: 700;
        }

        /* Animaciones CSS */
        :global(.vector-bottle) {
          transform-origin: 190px 310px;
          animation: swingBottle 6s ease-in-out infinite;
        }

        :global(.vector-glass) {
          transform-origin: 245px 310px;
          animation: swingGlass 6s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        :global(.bubble) {
          fill: var(--accent-gold);
          opacity: 0;
          animation: floatBubble 4s ease-in infinite;
        }

        :global(.bubble-1) { animation-delay: 0s; transform: translateX(0); }
        :global(.bubble-2) { animation-delay: 1.5s; transform: translateX(-10px); }
        :global(.bubble-3) { animation-delay: 0.8s; transform: translateX(5px); }
        :global(.bubble-4) { animation-delay: 2.2s; transform: translateX(-5px); }
        :global(.bubble-5) { animation-delay: 3s; transform: translateX(10px); }

        @keyframes swingBottle {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(-2deg) translateY(-4px); }
        }

        @keyframes swingGlass {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(-2px); }
        }

        @keyframes floatBubble {
          0% {
            transform: translateY(120px);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-80px);
            opacity: 0;
          }
        }

        /* Responsividad */
        @media (max-width: 868px) {
          .login-container {
            max-width: 440px;
            height: auto;
            min-height: 500px;
          }
          .login-left-side {
            flex: 0 0 100%;
            width: 100%;
            padding: 32px;
          }
          .login-right-side {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
