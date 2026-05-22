// src/components/infirmier/CreerListe.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { creerListe, getListesDuJour, getListeDetail, getMedecinsDisponibles } from '../../api/actInfirmierApi';
import { getUserSiteId, getUserSiteName } from '../../utils/siteAccessControl';

const toLocalIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TODAY = toLocalIsoDate();

function normalizeDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return toLocalIsoDate(new Date(value));
  } catch {
    return '';
  }
}

function isUniqueConstraintError(payload) {
  const text = String(
    payload?.non_field_errors?.[0] || payload?.detail || Object.values(payload || {}).flat().join(' ') || ''
  ).toLowerCase();
  return text.includes('must make a unique set') || text.includes('unique set') || text.includes('déjà') || text.includes('already exists');
}

function extractMedecinId(liste) {
  const raw =
    liste?.medecin_id ??
    liste?.medecinId ??
    (typeof liste?.medecin === 'object' ? liste?.medecin?.id : liste?.medecin) ??
    liste?.medecin_detail?.id ??
    liste?.medecin_obj?.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function extractSiteId(entity) {
  const raw =
    entity?.site_id ??
    entity?.siteId ??
    entity?.site?.id ??
    entity?.site?.site_id ??
    entity?.site?.pk ??
    entity?.site?.siteId ??
    entity?.site?.site_id_id ??
    entity?.site_details?.id ??
    entity?.site_details?.site_id ??
    entity?.site_details?.siteId ??
    entity?.site_detail?.id ??
    entity?.site_detail?.site_id ??
    entity?.site_detail?.siteId ??
    entity?.site_obj?.id ??
    entity?.site_obj?.site_id ??
    entity?.site_info?.id ??
    entity?.site_info?.site_id ??
    entity?.user?.site_id ??
    entity?.medecin_site_id ??
    entity?.medecin?.site_id ??
    entity?.medecin?.siteId ??
    entity?.site_template_site_id ??
    entity?.site_template_id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function extractSiteName(entity) {
  return normalizeText(
    entity?.site_nom ||
    entity?.siteName ||
    entity?.site_name ||
    entity?.site?.nom ||
    entity?.site?.name ||
    entity?.site?.label ||
    entity?.site_details?.nom ||
    entity?.site_details?.name ||
    entity?.site_details?.label ||
    entity?.site_detail?.nom ||
    entity?.site_detail?.name ||
    entity?.site_detail?.label ||
    entity?.site_obj?.nom ||
    entity?.site_obj?.name ||
    entity?.site_info?.nom ||
    entity?.site_info?.name
  );
}

function hasMessadineHint(value) {
  const v = normalizeText(value).toUpperCase();
  return v.includes('MESSAD') || v.includes('MASSAD') || v.includes('SOUSSE');
}

function hasMenzelHint(value) {
  const v = normalizeText(value).toUpperCase();
  return v.includes('MENZEL') || v.includes('MONASTIR');
}

function filterMedecinsByCurrentSite(list, currentSiteId, currentSiteName) {
  const arr = Array.isArray(list) ? list : [];
  if (!arr.length) return [];

  const siteName = normalizeText(currentSiteName);
  const currentIsMessadine = hasMessadineHint(currentSiteName);
  const currentIsMenzel = hasMenzelHint(currentSiteName);

  return arr.filter((medecin) => {
    const medecinSiteId = extractSiteId(medecin);
    if (currentSiteId != null && medecinSiteId != null) {
      return Number(medecinSiteId) === Number(currentSiteId);
    }

    if (currentSiteId != null && medecin?.site_id == null && medecin?.site == null) {
      return true;
    }

    if (siteName) {
      const medecinSiteName = extractSiteName(medecin);
      if (medecinSiteName) {
        return medecinSiteName === siteName;
      }
    }

    const anySiteLabel = normalizeText(
      medecin?.site_label ||
      medecin?.site_template_label ||
      medecin?.site_template_name ||
      medecin?.site_template_key ||
      medecin?.site_branch ||
      medecin?.site?.template_key ||
      medecin?.site?.templateKey ||
      medecin?.site_details?.template_key ||
      medecin?.site_details?.templateKey ||
      medecin?.site_detail?.template_key ||
      medecin?.site_detail?.templateKey ||
      medecin?.site?.nom ||
      medecin?.site?.name ||
      medecin?.site_details?.nom ||
      medecin?.site_details?.name ||
      medecin?.site_detail?.nom ||
      medecin?.site_detail?.name
    );

    if (currentIsMessadine && hasMenzelHint(anySiteLabel)) return false;
    if (currentIsMenzel && hasMessadineHint(anySiteLabel)) return false;

    return true;
  });
}

/* ── Icônes SVG inline (color explicite) ── */
const IcoClose       = ({ c='#64748b', size=15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoStethoscope = ({ c='#94a3b8', size=15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M4.5 9.5a5.5 5.5 0 0011 0v-3a1 1 0 00-1-1h-9a1 1 0 00-1 1v3z"/><path d="M10 9.5V17a4 4 0 008 0v-1"/><circle cx="18" cy="16" r="1.5" fill={c} stroke="none"/></svg>;
const IcoSearch      = ({ c='#94a3b8', size=15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoDoctor      = ({ c='#475569', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoCalendar    = ({ c='#475569', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoClock       = ({ c='#475569', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoWarning     = ({ c='#92400e', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoPlus        = ({ c='white', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoError       = ({ c='#b91c1c', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

export default function CreerListe({ onClose }) {
  const { user } = useAuth();
  const currentSiteId = user?.site_id ?? getUserSiteId();
  const currentSiteName = user?.site_nom ?? getUserSiteName();
  const [form, setForm] = useState({
    date: TODAY, session: 'MATIN', type_liste: 'CONSULTATION', medecin: '',
  });
  const [medecins,     setMedecins]     = useState([]);
  const [loadMedecins, setLoadMedecins] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    setForm(prev => ({ ...prev, medecin: '' }));
    setMedecins([]);
    setLoadMedecins(true);
    getMedecinsDisponibles(form.type_liste, currentSiteId)
      .then(data => setMedecins(filterMedecinsByCurrentSite(data, currentSiteId, currentSiteName)))
      .catch(() => setMedecins([]))
      .finally(() => setLoadMedecins(false));
  }, [form.type_liste, currentSiteId, currentSiteName]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (loading) return;
    if (!form.medecin) { setError('Veuillez sélectionner un médecin.'); return; }
    setError(''); setLoading(true);
    try {
      const created = await creerListe({ ...form, medecin: parseInt(form.medecin, 10) });
      const createdId = created?.id;
      if (createdId) {
        try {
          const detail = await getListeDetail(createdId);
          onClose(detail || created);
          return;
        } catch {
          // fallback sur la réponse create si le détail échoue
        }
      }
      onClose(created);
    } catch (err) {
      const data = err.response?.data;
      if (err?.response?.status === 400 && data && isUniqueConstraintError(data)) {
        try {
          const all = await getListesDuJour();
          const targetDate = normalizeDate(form.date);
          const targetMedecin = Number.parseInt(form.medecin, 10);
          const pool = Array.isArray(all) ? all : [];
          const exact = pool.find((l) => {
            const sameType = String(l?.type_liste || '') === String(form.type_liste || '');
            const sameSession = String(l?.session || '') === String(form.session || '');
            const sameDate = normalizeDate(l?.date) === targetDate;
            const medecinId = extractMedecinId(l);
            const sameMedecin = medecinId == null || medecinId === targetMedecin;
            return sameType && sameSession && sameDate && sameMedecin;
          });
          const relaxed = pool.find((l) => {
            const sameType = String(l?.type_liste || '') === String(form.type_liste || '');
            const sameSession = String(l?.session || '') === String(form.session || '');
            const sameDate = normalizeDate(l?.date) === targetDate;
            return sameType && sameSession && sameDate;
          });
          const existing = exact || relaxed;

          if (existing) {
            try {
              const detail = existing?.id ? await getListeDetail(existing.id) : existing;
              onClose(detail || existing);
            } catch {
              onClose(existing);
            }
            return;
          }
        } catch {
          // Si la récupération échoue, on retombe sur le message d'erreur classique.
        }
      }

      setError(data
        ? (data.non_field_errors?.[0] || data.detail || Object.values(data).flat().join(' ') || 'Erreur lors de la création.')
        : 'Erreur réseau. Vérifiez votre connexion.'
      );
    } finally { setLoading(false); }
  };

  const isConsult = form.type_liste === 'CONSULTATION';

  return (
    <div onClick={() => onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1000, backdropFilter:'blur(5px)' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:18, width:460, maxWidth:'94vw',
          boxShadow:'0 24px 64px rgba(0,0,0,.22)', animation:'modalIn .2s ease' }}>

        <style>{`
          @keyframes modalIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        `}</style>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'22px 22px 0' }}>
          <span style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>Nouvelle liste de passage</span>
          <button onClick={() => onClose()}
            style={{ padding:'5px 12px', border:'1.5px solid #e2e8f0', background:'#f8fafc',
              borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, color:'#64748b', display:'flex', alignItems:'center', gap:5 }}
            onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.borderColor='#fca5a5'; e.currentTarget.style.color='#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}>
            <IcoClose c="#64748b" size={13}/> Fermer
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 22px' }}>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2',
              border:'1px solid #fecaca', color:'#b91c1c', padding:'10px 14px',
              borderRadius:10, fontSize:13, marginBottom:16 }}>
              <IcoError c="#b91c1c" size={14}/> {error}
            </div>
          )}

          {/* Type de liste */}
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Type de liste</label>
            <div style={{ display:'flex', gap:10 }}>
              {[
                { val:'CONSULTATION',  label:'Consultation',  color:'#1d4ed8', bg:'#eff6ff', icon:<IcoStethoscope c={form.type_liste==='CONSULTATION'?'#1d4ed8':'#94a3b8'} size={15}/> },
              ].map(opt => {
                const active = form.type_liste === opt.val;
                return (
                  <button key={opt.val}
                    onClick={() => setForm(prev => ({ ...prev, type_liste: opt.val }))}
                    style={{ flex:1, padding:'10px 0', border:'2px solid',
                      borderColor: active ? opt.color : '#e2e8f0', borderRadius:10,
                      fontSize:13.5, fontWeight:700, fontFamily:'inherit', cursor:'pointer',
                      background: active ? opt.bg : 'white',
                      color: active ? opt.color : '#94a3b8',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      transition:'all .15s' }}>
                    {opt.icon} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Médecin */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
              color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
              <IcoDoctor c="#475569" size={12}/>
              {isConsult ? 'Médecin traitant' : 'Médecin contrôleur'}
            </div>
            {loadMedecins ? (
              <div style={{ height:42, borderRadius:10,
                background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
                backgroundSize:'200% 100%', animation:'shimmer 1.2s infinite' }}/>
            ) : medecins.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
                background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10, fontSize:13, color:'#92400e' }}>
                <IcoWarning c="#92400e" size={14}/>
                Aucun médecin {isConsult ? 'traitant' : 'contrôleur'} disponible pour votre site.
              </div>
            ) : (
              <select value={form.medecin} onChange={set('medecin')}
                style={{ ...inputStyle, borderColor: form.medecin ? '#bbf7d0' : '#e2e8f0',
                  color: form.medecin ? '#0f172a' : '#94a3b8' }}>
                <option value="">— Sélectionner un médecin —</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nom_complet}{m.specialite ? ` — ${m.specialite}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
              color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
              <IcoCalendar c="#475569" size={12}/> Date
            </div>
            <input type="date" value={form.date} onChange={set('date')} style={inputStyle}/>
          </div>

          {/* Session */}
          <div style={{ marginBottom:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
              color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
              <IcoClock c="#475569" size={12}/> Session
            </div>
            <select value={form.session} onChange={set('session')} style={inputStyle}>
              <option value="MATIN">Matin</option>
              <option value="MIDI">Midi</option>
              <option value="APRES_MIDI">Après-midi</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px 22px', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={() => onClose()} disabled={loading}
            style={{ padding:'10px 20px', background:'white', border:'1.5px solid #e2e8f0',
              borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', color:'#475569' }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading || !form.medecin}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px',
              background: form.medecin ? '#2563eb' : '#e2e8f0',
              color: form.medecin ? 'white' : '#94a3b8',
              border:'none', borderRadius:10, fontSize:14, fontWeight:700,
              cursor: (loading || !form.medecin) ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', opacity: loading ? 0.7 : 1, transition:'all .15s' }}>
            <IcoPlus c={form.medecin ? 'white' : '#94a3b8'} size={14}/>
            {loading ? 'Création…' : 'Créer la liste'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display:'block', fontSize:12, fontWeight:700, color:'#475569',
  textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6,
};
const inputStyle = {
  width:'100%', padding:'10px 13px', border:'1.5px solid #e2e8f0', borderRadius:10,
  fontSize:14, fontFamily:'inherit', outline:'none', color:'#0f172a', background:'white',
  boxSizing:'border-box', transition:'border-color .15s',
};