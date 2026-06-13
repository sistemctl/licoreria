'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <h2>Mi Licorería</h2>
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

          <button type="submit" disabled={loading} className="btn btn-primary w-full login-btn">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
        }

        .login-card {
          width: 90%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          border-color: rgba(212, 168, 83, 0.25);
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
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
        }

        .w-full {
          width: 100%;
        }

        .login-btn {
          margin-top: 8px;
          height: 48px;
          font-size: 15px;
        }
      `}</style>
    </div>
  );
}
