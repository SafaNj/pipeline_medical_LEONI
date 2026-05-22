import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/authApi';

/* ─── inline styles (mirrors the HTML design) ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue:   #2563eb;
    --blue-h: #1d4ed8;
    --white:  #ffffff;
    --text:   #111827;
    --sub:    #6b7280;
    --border: #e5e7eb;
    --bg-in:  #f9fafb;
    --red:    #dc2626;
    --green:  #16a34a;
  }

  .chpwd-page {
    font-family: 'Inter', sans-serif;
    background: linear-gradient(160deg, #e8f1fd 0%, #dbeafe 45%, #eff6ff 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes popIn   { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }

  .chpwd-card {
    background: var(--white);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(37,99,235,.10), 0 4px 16px rgba(0,0,0,.06);
    padding: 48px 44px 40px;
    width: 100%; max-width: 460px;
    animation: fadeUp .45s ease both;
  }

  .chpwd-logo-wrap { display:flex; flex-direction:column; align-items:center; margin-bottom:6px; }
  .chpwd-logo-icon {
    width:64px; height:64px; border-radius:18px;
    background: linear-gradient(135deg,#2563eb,#3b82f6);
    display:flex; align-items:center; justify-content:center;
    box-shadow: 0 8px 24px rgba(37,99,235,.30);
    margin-bottom:18px;
  }

  .chpwd-title { font-size:26px; font-weight:800; color:var(--text); text-align:center; letter-spacing:-.6px; margin-bottom:6px; }
  .chpwd-sub   { font-size:13px; color:var(--sub); text-align:center; font-weight:400; margin-bottom:22px; line-height:1.6; }

  .chpwd-alert {
    display:flex; align-items:flex-start; gap:9px;
    background:#fffbeb; border:1px solid #fde68a;
    border-left:3px solid #f59e0b;
    border-radius:12px; padding:12px 14px;
    margin-bottom:28px; font-size:12px; color:#92400e; line-height:1.6;
  }
  .chpwd-alert svg { flex-shrink:0; margin-top:1px; color:#f59e0b; }

  .chpwd-divider {
    height:1px; background:var(--border); margin-bottom:24px; position:relative;
  }
  .chpwd-divider::after {
    content:''; position:absolute; left:0; top:0; width:36px; height:1px; background:var(--blue);
  }

  .chpwd-err {
    display:none; align-items:center; gap:9px;
    background:#fef2f2; border:1px solid #fecaca;
    border-left:3px solid var(--red);
    border-radius:10px; padding:11px 13px;
    margin-bottom:18px; font-size:13px; color:#991b1b;
  }
  .chpwd-err.on { display:flex; animation:shake .3s ease; }
  .chpwd-err-x  { margin-left:auto; background:none; border:none; cursor:pointer; color:#fca5a5; display:flex; padding:0; }

  .chpwd-field { margin-bottom:16px; }
  .chpwd-field label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:7px; }

  .chpwd-inp-wrap { position:relative; }
  .chpwd-inp-wrap input {
    width:100%; padding:13px 44px 13px 44px;
    border:1.5px solid var(--border); border-radius:12px;
    font-size:15px; font-family:'Inter',sans-serif;
    color:var(--text); background:var(--bg-in);
    outline:none; transition:all .18s;
  }
  .chpwd-inp-wrap input::placeholder { color:#c9d1db; }
  .chpwd-inp-wrap input:focus { border-color:var(--blue); background:#fff; box-shadow:0 0 0 4px rgba(37,99,235,.10); }
  .chpwd-ico {
    position:absolute; left:14px; top:50%; transform:translateY(-50%);
    color:#c9d1db; pointer-events:none; display:flex; align-items:center; transition:color .18s;
  }
  .chpwd-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:#c9d1db; padding:3px; display:flex; transition:color .18s;
  }
  .chpwd-eye:hover { color:var(--blue); }

  .chpwd-strength { display:none; margin-top:8px; }
  .chpwd-strength.on { display:block; }
  .chpwd-s-bars { display:flex; gap:4px; margin-bottom:5px; }
  .chpwd-s-bar  { flex:1; height:3px; border-radius:3px; background:#e5e7eb; transition:background .3s; }
  .chpwd-s-lbl  { font-size:11px; font-weight:600; transition:color .3s; }

  .chpwd-rules { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-top:10px; }
  .chpwd-rule  { display:flex; align-items:center; gap:6px; font-size:11px; color:#94a3b8; transition:color .2s; }
  .chpwd-rule.ok { color:var(--green); }
  .chpwd-r-dot {
    width:14px; height:14px; border-radius:50%; flex-shrink:0;
    border:1.5px solid #e2e8f0;
    display:flex; align-items:center; justify-content:center; transition:all .2s;
  }
  .chpwd-rule.ok .chpwd-r-dot { background:#f0fdf4; border-color:#86efac; }

  .chpwd-match { font-size:11px; margin-top:6px; display:none; }
  .chpwd-match.on { display:flex; align-items:center; gap:5px; }

  .chpwd-btn {
    width:100%; padding:14px;
    background:var(--blue); color:#fff;
    border:none; border-radius:12px;
    font-size:16px; font-weight:600; font-family:'Inter',sans-serif;
    cursor:pointer; margin-top:8px;
    display:flex; align-items:center; justify-content:center; gap:8px;
    box-shadow:0 4px 16px rgba(37,99,235,.30);
    transition:all .2s; position:relative; overflow:hidden;
  }
  .chpwd-btn:hover:not(:disabled) { background:var(--blue-h); transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,99,235,.35); }
  .chpwd-btn:active:not(:disabled) { transform:translateY(0); }
  .chpwd-btn:disabled { opacity:.6; cursor:not-allowed; }

  .chpwd-spinner {
    width:17px; height:17px; border-radius:50%;
    border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
    animation:spin .65s linear infinite; flex-shrink:0;
  }

  .chpwd-success {
    display:flex; flex-direction:column; align-items:center; text-align:center; padding:16px 0 8px;
  }
  .chpwd-s-circle {
    width:72px; height:72px; border-radius:50%;
    background:#f0fdf4; border:2px solid #86efac;
    display:flex; align-items:center; justify-content:center;
    margin-bottom:20px; animation:popIn .4s .1s ease both;
  }
  .chpwd-s-title { font-size:22px; font-weight:800; color:var(--text); margin-bottom:8px; }
  .chpwd-s-sub   { font-size:13px; color:var(--sub); line-height:1.6; margin-bottom:20px; }
  .chpwd-s-badge {
    display:inline-flex; align-items:center; gap:6px;
    background:#f0fdf4; border:1px solid #86efac;
    border-radius:20px; padding:6px 16px;
    font-size:12px; font-weight:600; color:var(--green);
  }

  .chpwd-footer {
    text-align:center; margin-top:24px; font-size:12px;
    color:#9ca3af; padding-top:20px; border-top:1px solid #f3f4f6;
  }
`;

/* ─── helpers ────────────────────────────────────────────────────────────── */
const LockIcon = () => (
  <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.3" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeOpen = () => (
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </>
);

const EyeOff = () => (
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </>
);

function PasswordInput({ id, placeholder, value, onChange, autoComplete, icon }) {
  const [show, setShow] = useState(false);
  return (
    <div className="chpwd-inp-wrap">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
      />
      <span className="chpwd-ico">{icon}</span>
      <button type="button" className="chpwd-eye" onClick={() => setShow(s => !s)}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {show ? <EyeOff/> : <EyeOpen/>}
        </svg>
      </button>
    </div>
  );
}

function useStrength(val) {
  const h8  = val.length >= 8;
  const hUp = /[A-Z]/.test(val);
  const hN  = /[0-9]/.test(val);
  const hSp = /[^A-Za-z0-9]/.test(val);
  const score = [h8, hUp, hN, hSp].filter(Boolean).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#16a34a'];
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
  return { h8, hUp, hN, hSp, score, color: colors[score - 1] || '#94a3b8', label: labels[score - 1] || '' };
}

/* ─── icons ── */
const CheckSvg = ({ size = 8 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const CrossSvg = ({ size = 11 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
const ChangePasswordPage = () => {
  const [oldPassword,  setOldPassword]  = useState('');
  const [newPassword,  setNewPassword]  = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error,        setError]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [done,         setDone]         = useState(false);

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const strength = useStrength(newPassword);

  const redirectToDashboard = () => {
    if (user?.role === 'medecin') {
      if (user?.med_type === 'traitant')    { navigate('/dashboard/medecin/traitant');   return; }
      if (user?.med_type === 'travail')     { navigate('/dashboard/medecin/travail');    return; }
      if (user?.med_type === 'controleur')  { navigate('/dashboard/medecin/controleur'); return; }
    }
    if (user?.role === 'infirmier') { navigate('/dashboard/infirmier'); return; }
    if (user?.role === 'rh')        { navigate('/dashboard/rh');        return; }
    if (user?.role === 'hsse')      { navigate('/dashboard/hsse');      return; }
    navigate('/');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!oldPassword || !newPassword || !newPassword2) {
      setError('Veuillez remplir tous les champs.'); return;
    }
    if (newPassword !== newPassword2) {
      setError('Les mots de passe ne correspondent pas.'); return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.'); return;
    }

    setIsLoading(true);
    try {
      await changePassword(oldPassword, newPassword, newPassword2);
      updateUser({ must_change_password: false });
      setDone(true);
      setTimeout(redirectToDashboard, 2500);
    } catch (err) {
      const data = err?.response?.data;
      setError(
        data?.old_password?.[0] ||
        data?.new_password?.[0] ||
        data?.detail ||
        (!err?.response ? 'Serveur inaccessible. Vérifiez votre connexion.' : 'Impossible de changer le mot de passe.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const matchOk = newPassword2 && newPassword === newPassword2;
  const matchKo = newPassword2 && newPassword !== newPassword2;

  return (
    <>
      <style>{css}</style>
      <div className="chpwd-page">
        <div className="chpwd-card">

          {/* Logo */}
          <div className="chpwd-logo-wrap">
            <div className="chpwd-logo-icon"><LockIcon/></div>
          </div>

          <h1 className="chpwd-title">Nouveau mot de passe</h1>
          <p className="chpwd-sub">Définissez un mot de passe sécurisé<br/>pour protéger votre compte.</p>

          {/* Alert */}
          <div className="chpwd-alert">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>Action requise :</strong> Pour des raisons de sécurité, veuillez définir un nouveau mot de passe avant d'accéder à la plateforme.</span>
          </div>

          <div className="chpwd-divider"/>

          {/* Success state */}
          {done ? (
            <div className="chpwd-success">
              <div className="chpwd-s-circle">
                <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="chpwd-s-title">Mot de passe mis à jour !</div>
              <div className="chpwd-s-sub">
                Votre mot de passe a été modifié avec succès.<br/>Redirection vers le tableau de bord…
              </div>
              <div className="chpwd-s-badge">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Compte sécurisé
              </div>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="chpwd-err on">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0}}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                  <button className="chpwd-err-x" onClick={() => setError('')}>
                    <CrossSvg size={13}/>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>

                {/* Old password */}
                <div className="chpwd-field">
                  <label htmlFor="oldPassword">Mot de passe actuel</label>
                  <PasswordInput
                    id="oldPassword"
                    placeholder="Votre mot de passe actuel"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                    icon={
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    }
                  />
                </div>

                {/* New password */}
                <div className="chpwd-field">
                  <label htmlFor="newPassword">Nouveau mot de passe</label>
                  <PasswordInput
                    id="newPassword"
                    placeholder="Minimum 8 caractères"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    icon={
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    }
                  />

                  {/* Strength meter */}
                  {newPassword && (
                    <div className="chpwd-strength on">
                      <div className="chpwd-s-bars">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="chpwd-s-bar"
                            style={{background: i <= strength.score ? strength.color : '#e5e7eb'}}/>
                        ))}
                      </div>
                      <div className="chpwd-s-lbl" style={{color: strength.color}}>{strength.label}</div>
                    </div>
                  )}

                  {/* Rules */}
                  <div className="chpwd-rules">
                    {[
                      { ok: strength.h8,  label: '8 caractères min.' },
                      { ok: strength.hUp, label: 'Majuscule' },
                      { ok: strength.hN,  label: 'Chiffre' },
                      { ok: strength.hSp, label: 'Caractère spécial' },
                    ].map(({ ok, label }) => (
                      <div key={label} className={`chpwd-rule${ok ? ' ok' : ''}`}>
                        <div className="chpwd-r-dot">
                          {ok && <CheckSvg size={8}/>}
                        </div>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm password */}
                <div className="chpwd-field">
                  <label htmlFor="newPassword2">Confirmer le mot de passe</label>
                  <PasswordInput
                    id="newPassword2"
                    placeholder="Répétez le nouveau mot de passe"
                    value={newPassword2}
                    onChange={e => setNewPassword2(e.target.value)}
                    autoComplete="new-password"
                    icon={
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    }
                  />
                  {matchOk && (
                    <div className="chpwd-match on" style={{color:'#16a34a'}}>
                      <CheckSvg size={11}/>
                      &nbsp;Les mots de passe correspondent
                    </div>
                  )}
                  {matchKo && (
                    <div className="chpwd-match on" style={{color:'#dc2626'}}>
                      <CrossSvg size={11}/>
                      &nbsp;Les mots de passe ne correspondent pas
                    </div>
                  )}
                </div>

                <button type="submit" className="chpwd-btn" disabled={isLoading}>
                  {isLoading && <span className="chpwd-spinner"/>}
                  <span>{isLoading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</span>
                </button>

              </form>
            </>
          )}

          <div className="chpwd-footer">© 2026 Service Médical LEONI · Tous droits réservés</div>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordPage;