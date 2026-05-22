import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Icônes ─────────────────────────────────────────────── */
const IconPulse = () => (
  <svg width="30" height="30" fill="none" stroke="#fff" strokeWidth="2.3" viewBox="0 0 24 24">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconEyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeClosed = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── Composant ──────────────────────────────────────────── */
const LoginPage = () => {
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const expiredMessage = window.sessionStorage.getItem('auth_expired_message');
    if (expiredMessage) {
      setError(expiredMessage);
      window.sessionStorage.removeItem('auth_expired_message');
    }
  }, []);

  /* ── Logique de soumission (inchangée) ── */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(username, password);

      if (data.must_change_password) {
        navigate('/change-password');
        return;
      }

      if (data.role === 'medecin') {
        if (data.med_type === 'traitant')   { navigate('/dashboard/medecin/traitant');   return; }
        if (data.med_type === 'travail')    { navigate('/dashboard/medecin/travail');    return; }
        if (data.med_type === 'controleur') { navigate('/dashboard/medecin/controleur'); return; }
      }

      if (data.role === 'infirmier') { navigate('/dashboard/infirmier'); return; }
      if (data.role === 'rh')        { navigate('/dashboard/rh');        return; }
      if (data.role === 'hsse')      { navigate('/dashboard/hsse');      return; }

    } catch (err) {
      if (err?.code === 'SITE_ASSIGNMENT_REQUIRED') {
        setError(err?.message || 'Votre compte n\'est pas encore assigné à un site.');
        return;
      }
      if (err?.response?.status === 401) {
        setError("Nom d'utilisateur ou mot de passe incorrect.");
      } else if (!err?.response) {
        setError('Erreur de connexion au serveur.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Rendu ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-5px); }
          75%     { transform: translateX(5px); }
        }

        .lp-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(160deg, #e8f1fd 0%, #dbeafe 45%, #eff6ff 100%);
}

        .lp-card {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(37,99,235,0.10), 0 4px 16px rgba(0,0,0,0.06);
          padding: 48px 44px 40px;
          width: 100%;
          max-width: 440px;
          animation: fadeUp 0.45s ease both;
        }

        /* Logo */
        .lp-logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  text-align: center;
}
@keyframes breathe {
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 6px 18px rgba(37,99,235,0.25)); }
  50%       { transform: scale(1.04); filter: drop-shadow(0 10px 28px rgba(37,99,235,0.40)); }
}

.lp-logo-icon {
  width: 160px; height: 160px;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 22px auto;
  animation: breathe 3s ease-in-out infinite;
  transition: transform 0.35s cubic-bezier(.22,.68,0,1.2);
}
.lp-logo-icon:hover {
  animation: none;
  transform: perspective(800px) rotateX(8deg) rotateY(-10deg) scale(1.08);
  filter: drop-shadow(0 16px 32px rgba(37,99,235,0.45));
}

        /* Titres */
        .lp-title {
          font-size: 28px; font-weight: 800;
          color: #111827; text-align: center;
          letter-spacing: -0.6px; margin-bottom: 6px;
        }
        .lp-sub {
          font-size: 14px; color: #6b7280;
          text-align: center; margin-bottom: 22px;
        }

        /* Badge */
        .lp-badge-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; color: #2563eb;
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 20px; padding: 5px 14px;
        }

        /* Erreur */
        .lp-error {
          display: flex; align-items: center; gap: 9px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 10px; padding: 11px 13px;
          margin-bottom: 18px;
          font-size: 13px; color: #991b1b;
          animation: shake 0.3s ease;
        }
        .lp-error-close {
          margin-left: auto;
          background: none; border: none; cursor: pointer;
          color: #fca5a5; display: flex; padding: 0;
        }

        /* Label */
        .lp-label {
          display: block;
          font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 7px;
        }

        /* Input wrap */
        .lp-inp-wrap { position: relative; }

        .lp-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px; font-family: 'Inter', sans-serif;
          color: #111827; background: #f9fafb;
          outline: none; transition: all 0.18s;
        }
        .lp-input::placeholder { color: #c9d1db; }
        .lp-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.10);
        }
        .lp-input:focus + .lp-ico { color: #2563eb; }

        .lp-ico {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #c9d1db; pointer-events: none;
          display: flex; align-items: center;
          transition: color 0.18s;
        }
        .lp-eye {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #c9d1db; padding: 3px; display: flex;
          transition: color 0.18s;
        }
        .lp-eye:hover { color: #2563eb; }

        /* Bouton */
        .lp-btn {
          width: 100%; padding: 14px;
          background: #2563eb; color: #fff;
          border: none; border-radius: 12px;
          font-size: 16px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; margin-top: 6px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.30);
          transition: all 0.2s; overflow: hidden; position: relative;
        }
        .lp-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.35);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .lp-spinner {
          width: 17px; height: 17px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        /* Footer */
        .lp-footer {
          text-align: center; margin-top: 28px;
          font-size: 12px; color: #9ca3af;
          padding-top: 20px; border-top: 1px solid #f3f4f6;
        }

        @media (max-width: 480px) {
          .lp-card { padding: 36px 24px 32px; }
        }
      `}</style>

      <div className="lp-page">
        <div className="lp-card">

        {/* Logo */}
<div className="lp-logo-wrap">
  <div className="lp-logo-icon">
   <img
  src="https://i.imgur.com/P8t9SW7.png"
  alt="Leoni Logo"
  style={{ width: 150, height: 150, objectFit: 'contain' }}
/>
  </div>
</div>

          {/* Titres */}
          <h1 className="lp-title">Welcome</h1>
          <p className="lp-sub">Service Médical LEONI</p>

          {/* Badge JWT */}
          <div className="lp-badge-wrap">
            <span className="lp-badge">
              <IconShield /> Connexion sécurisée 
            </span>
          </div>

          {/* Erreur */}
          {error && (
            <div className="lp-error">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ flex: 1 }}>{error}</span>
              <button className="lp-error-close" onClick={() => setError('')}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="username" className="lp-label">Nom d'utilisateur</label>
              <div className="lp-inp-wrap">
                <input
                  id="username"
                  type="text"
                  className="lp-input"
                  placeholder="ex: dr.benali"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
                <span className="lp-ico"><IconUser /></span>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="password" className="lp-label">Mot de passe</label>
              <div className="lp-inp-wrap">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className="lp-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  style={{ paddingRight: 44 }}
                />
                <span className="lp-ico"><IconLock /></span>
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <IconEyeClosed /> : <IconEyeOpen />}
                </button>
              </div>
            </div>

            {/* Bouton submit */}
            <button type="submit" className="lp-btn" disabled={isLoading}>
              {isLoading && <span className="lp-spinner" />}
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </button>

          </form>

          {/* Footer */}
          <div className="lp-footer">© 2026 Service Médical LEONI · Tous droits réservés</div>

        </div>
      </div>
    </>
  );
};

export default LoginPage;