import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
  getResumeMensuel, getMedecins,
  creerPointage, modifierPointage, supprimerPointage,
  creerAbsence,  modifierAbsence,  supprimerAbsence,
} from '../../api/actInfirmierApi';

/* ── Utilitaires date  */
const todayISO    = () => new Date().toISOString().slice(0, 10);
const pad2        = (n) => String(n).padStart(2, '0');
const toISO       = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const daysInMonth = (m, y) => new Date(y, m, 0).getDate();
const firstDOW    = (m, y) => { const d = new Date(y, m - 1, 1).getDay(); return d === 0 ? 6 : d - 1; };
const isWeekend   = (dow0, d) => ((dow0 + d - 1) % 7) >= 5;
const MOIS_LABELS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS_C     = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

/* ── Types médecin  */
const TYPE_KEY = {
  1:'traitant', 2:'travail', 3:'controleur',
  traitant:'traitant', travail:'travail', controleur:'controleur',
};
const TYPE_STYLE = {
  traitant:   { label:'Traitant',   color:'#0d6349', bg:'#e6f7f3', border:'#a7e3d4', dot:'#10b981' },
  travail:    { label:'Travail',    color:'#1a4fa0', bg:'#e8f0fc', border:'#aac4f0', dot:'#3b82f6' },
  controleur: { label:'Contrôleur', color:'#92400e', bg:'#fef3e2', border:'#f6d591', dot:'#f59e0b' },
};
const resolveType = (val) => {
  if (!val && val !== 0) return null;
  const k = TYPE_KEY[parseInt(val, 10)] || TYPE_KEY[String(val).toLowerCase().trim()];
  return k ? TYPE_STYLE[k] : { label: String(val), color:'#475569', bg:'#f1f5f9', border:'#cbd5e1', dot:'#94a3b8' };
};

/* ── Badge type  */
function TypeBadge({ type }) {
  const t = resolveType(type);
  if (!t) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:9.5, fontWeight:700, color:t.color, padding:'2px 7px', borderRadius:4, background:t.bg, border:`1px solid ${t.border}`, letterSpacing:'.5px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:t.dot, flexShrink:0 }}/>
      {t.label}
    </span>
  );
}

const IcoCheck = ({ size = 16, color = '#15803d' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IcoCross = ({ size = 16, color = '#dc2626' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* 
   POPUP JOUR — formulaire présence / absence
 */
function PopupJour({ medecin, dateISO, pointage, absence, onClose, onSaved }) {
  const [mode,     setMode]    = useState(pointage ? 'present' : absence ? 'absent' : null);
  const [heures,   setHeures]  = useState(pointage?.heures || medecin.heures_par_defaut || 8);
  const [remarque, setRemarq]  = useState(pointage?.remarque || '');
  const [motif,    setMotif]   = useState(absence?.motif || '');
  const [saving,   setSaving]  = useState(false);
  const [err,      setErr]     = useState('');

  const dateLabel = new Date(dateISO + 'T00:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

  const inp = {
    padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:9,
    fontSize:13, color:'#111827', outline:'none', fontFamily:'inherit',
    width:'100%', boxSizing:'border-box', transition:'border-color .15s',
  };

  const handleSavePresent = async () => {
    setSaving(true); setErr('');
    try {
      const payload = { medecin: medecin.id, date: dateISO, heures_travaillees: heures, remarque };
      if (pointage) await modifierPointage(pointage.id, payload);
      else          await creerPointage(payload);
      onSaved();
    } catch (e) {
      const d = e.response?.data;
      if (JSON.stringify(d || '').includes('unique')) setErr('Un pointage existe déjà pour cette date.');
      else setErr(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleSaveAbsent = async () => {
    setSaving(true); setErr('');
    try {
      const payload = { medecin: medecin.id, date: dateISO, motif };
      if (absence) await modifierAbsence(absence.id, payload);
      else         await creerAbsence(payload);
      onSaved();
    } catch (e) {
      const d = e.response?.data;
      if (JSON.stringify(d || '').includes('unique')) setErr('Une absence existe déjà pour cette date.');
      else setErr(d?.detail || Object.values(d ?? {}).flat().join(' ') || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      if (pointage) await supprimerPointage(pointage.id);
      if (absence)  await supprimerAbsence(absence.id);
      onSaved();
    } catch { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(12,74,110,.38)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}
      onClick={onClose}>
      <div style={{ background:'white', borderRadius:18, width:345, boxShadow:'0 24px 60px rgba(0,0,0,.22)', overflow:'hidden', animation:'popIn .2s ease' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'15px 18px', background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderBottom:'1px solid #bae6fd', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13.5, fontWeight:800, color:'#0c4a6e', textTransform:'capitalize' }}>{dateLabel}</div>
            <div style={{ fontSize:11.5, color:'#0369a1', marginTop:2, fontWeight:500 }}>{medecin.nom}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, border:'1px solid #bae6fd', background:'white', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#0369a1', fontSize:18, lineHeight:1, cursor:'pointer' }}>×</button>
        </div>

        {/* Statut existant */}
        {(pointage || absence) && (
          <div style={{ padding:'10px 18px', background:pointage ? '#f0fdf4' : '#fef2f2', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20 }}>
                {pointage ? <IcoCheck size={18} /> : <IcoCross size={18} />}
              </span>
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, color: pointage ? '#15803d' : '#dc2626' }}>
                  {pointage ? `Présent — ${pointage.heures}h` : `Absent${absence?.motif ? ` · ${absence.motif}` : ''}`}
                </div>
                {(pointage?.remarque) && <div style={{ fontSize:11, color:'#6b7280' }}>{pointage.remarque}</div>}
              </div>
            </div>
            <button onClick={handleDelete} disabled={saving}
              style={{ padding:'4px 10px', border:'1px solid #fca5a5', background:'white', color:'#ef4444', borderRadius:7, fontSize:11.5, fontWeight:700, cursor:'pointer' }}>
              Supprimer
            </button>
          </div>
        )}

        {/* Erreur */}
        {err && <div style={{ padding:'8px 18px', background:'#fef2f2', color:'#dc2626', fontSize:12, borderBottom:'1px solid #fecaca' }}>{err}</div>}

        {/* ── Choix mode ── */}
        {!mode && (
          <div style={{ padding:'18px 18px 20px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:2 }}>
              {(pointage || absence) ? 'Modifier en' : 'Enregistrer'}
            </div>
            <button onClick={() => setMode('present')}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'2px solid #86efac', background:'#f0fdf4', borderRadius:13, cursor:'pointer', textAlign:'left', transition:'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#22c55e'; e.currentTarget.style.transform='scale(1.01)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#86efac'; e.currentTarget.style.transform='scale(1)'; }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <IcoCheck size={20} color='#ffffff' />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>Présence</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>Journée travaillée</div>
              </div>
            </button>
            <button onClick={() => setMode('absent')}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'2px solid #fca5a5', background:'#fef2f2', borderRadius:13, cursor:'pointer', textAlign:'left', transition:'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#ef4444'; e.currentTarget.style.transform='scale(1.01)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#fca5a5'; e.currentTarget.style.transform='scale(1)'; }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <IcoCross size={20} color='#ffffff' />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#dc2626' }}>Absence</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>Journée non travaillée</div>
              </div>
            </button>
          </div>
        )}

        {/* ── Formulaire présence ── */}
        {mode === 'present' && (
          <div style={{ padding:'18px 18px 20px' }}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:8 }}>Heures travaillées</label>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {[2, 4, 6, 8].map(h => (
                  <button key={h} onClick={() => setHeures(h)}
                    style={{ flex:1, padding:'11px 0', border:`2px solid ${heures === h ? '#0284c7' : '#e5e7eb'}`, background:heures === h ? '#0284c7' : 'white', color:heures === h ? 'white' : '#374151', borderRadius:10, fontSize:15, fontWeight:800, cursor:'pointer', transition:'all .12s' }}>
                    {h}h
                  </button>
                ))}
              </div>
              <input type="number" min="1" max="12" value={heures} onChange={e => setHeures(+e.target.value)}
                style={inp} placeholder="Autre valeur…"
                onFocus={e => e.target.style.borderColor='#0284c7'}
                onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:6 }}>Remarque</label>
              <input type="text" value={remarque} onChange={e => setRemarq(e.target.value)}
                style={inp} placeholder="Retard, remplacement…"
                onFocus={e => e.target.style.borderColor='#0284c7'}
                onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setMode(null)} style={{ flex:1, padding:'10px', border:'1.5px solid #e5e7eb', background:'white', color:'#64748b', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>← Retour</button>
              <button onClick={handleSavePresent} disabled={saving}
                style={{ flex:2, padding:'10px', border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', borderRadius:10, fontSize:13.5, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(2,132,199,.3)', opacity:saving ? .65 : 1 }}>
                {saving ? 'Enregistrement…' : '✓ Valider la présence'}
              </button>
            </div>
          </div>
        )}

        {/* ── Formulaire absence ── */}
        {mode === 'absent' && (
          <div style={{ padding:'18px 18px 20px' }}>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:8 }}>Motif</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {['Congé', 'Maladie', 'Formation', 'Mission', 'Sans motif'].map(m => (
                  <button key={m} onClick={() => setMotif(m)}
                    style={{ padding:'7px 13px', border:`1.5px solid ${motif === m ? '#ef4444' : '#e5e7eb'}`, background:motif === m ? '#fef2f2' : 'white', color:motif === m ? '#dc2626' : '#374151', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .12s' }}>
                    {m}
                  </button>
                ))}
              </div>
              <input type="text" value={motif} onChange={e => setMotif(e.target.value)}
                style={{ ...inp, borderColor:'#fca5a5' }} placeholder="Autre motif…"
                onFocus={e => e.target.style.borderColor='#ef4444'}
                onBlur={e => e.target.style.borderColor='#fca5a5'}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setMode(null)} style={{ flex:1, padding:'10px', border:'1.5px solid #e5e7eb', background:'white', color:'#64748b', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>← Retour</button>
              <button onClick={handleSaveAbsent} disabled={saving}
                style={{ flex:2, padding:'10px', border:'none', background:'linear-gradient(135deg,#f97316,#dc2626)', color:'white', borderRadius:10, fontSize:13.5, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(239,68,68,.3)', opacity:saving ? .65 : 1 }}>
                {saving ? 'Enregistrement…' : "✓ Valider l'absence"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* 
   COMPOSANT PRINCIPAL
 */
export default function PointageMedecin() {
  const now = new Date();
  const [mois,       setMois]       = useState(now.getMonth() + 1);
  const [annee,      setAnnee]      = useState(now.getFullYear());
  const [resume,     setResume]     = useState({ medecins: [] });
  const [medecins,   setMedecins]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error,      setError]      = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [popup,      setPopup]      = useState(null);
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  /* ── Chargement données ── */
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [res, meds] = await Promise.all([getResumeMensuel(mois, annee), getMedecins()]);

      const medsMap = {};
      meds.forEach(m => { medsMap[String(m.id)] = m; });

      const medecinsEnrichis = (res.medecins || []).map(med => {
        const info    = medsMap[String(med.medecin_id)];
        const rawType = info?.med_type_id ?? info?.med_type ?? med.medecin_type ?? med.med_type ?? null;
        return {
          ...med,
          medecin_nom:       info?.medecin_nom || med.medecin_nom || `Médecin #${med.medecin_id}`,
          medecin_type:      rawType,
          heures_par_defaut: info?.heures_par_defaut || 8,
        };
      });

      setResume({ ...res, medecins: medecinsEnrichis });
      setMedecins(meds);

      setSelectedId(prev => {
        if (prev && medecinsEnrichis.find(m => m.medecin_id === prev)) return prev;
        return medecinsEnrichis[0]?.medecin_id ?? null;
      });
    } catch {
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally { setLoading(false); }
  }, [mois, annee]);

  useEffect(() => { load(); }, [load]);

  /* ── Médecin sélectionné ── */
  const medSel = resume.medecins?.find(m => m.medecin_id === selectedId);

  /* ── Maps date → pointage / absence ── */
  const mapP = {}, mapA = {};
  (medSel?.jours_presence || []).forEach(p => { mapP[p.date] = p; });
  (medSel?.jours_absence  || []).forEach(a => { mapA[a.date] = a; });

  /* ── Stats globales ── */
  const totalH = resume.medecins?.reduce((s, m) => s + (m.total_heures        || 0), 0) ?? 0;
  const totalP = resume.medecins?.reduce((s, m) => s + (m.total_jours_presence || 0), 0) ?? 0;
  const totalA = resume.medecins?.reduce((s, m) => s + (m.total_jours_absence  || 0), 0) ?? 0;

  /* ── Calendrier ── */
  const nbJours  = daysInMonth(mois, annee);
  const firstDay = firstDOW(mois, annee);
  const today    = todayISO();
  const cells    = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= nbJours; d++) cells.push(d);

  const handleDayClick = (d) => {
    if (isWeekend(firstDay, d) || !medSel) return;
    const dateISO = toISO(annee, mois, d);
    setPopup({ dateISO, pointage: mapP[dateISO] ? { id: mapP[dateISO].id, heures: mapP[dateISO].heures, remarque: mapP[dateISO].remarque || '' } : null, absence: mapA[dateISO] ? { id: mapA[dateISO].id, motif: mapA[dateISO].motif || '' } : null });
  };

  const handlePopupSaved = () => {
    setPopup(null);
    showToast(' Enregistrement effectué');
    load();
  };

  /* ── Navigation mois ── */
  const prevMois = () => { const d = new Date(annee, mois - 2, 1); setMois(d.getMonth() + 1); setAnnee(d.getFullYear()); };
  const nextMois = () => { const d = new Date(annee, mois,     1); setMois(d.getMonth() + 1); setAnnee(d.getFullYear()); };
  const goToday  = () => { setMois(now.getMonth() + 1); setAnnee(now.getFullYear()); };
  const handleExportPointage = async () => {
    setExportLoading(true);
    try {
      const rows = (resume.medecins || []).map((med) => {
        const typeLabel = resolveType(med.medecin_type)?.label || med.medecin_type || '';
        const row = {
          'Médecin': med.medecin_nom || `Médecin #${med.medecin_id}`,
          'Type': typeLabel,
          'Heures totales': med.total_heures || 0,
          'Présences': med.total_jours_presence || 0,
          'Absences': med.total_jours_absence || 0,
        };

        (med.jours_presence || []).forEach((p) => {
          row[`P_${p.date}`] = `${p.heures ?? ''}h${p.remarque ? ` · ${p.remarque}` : ''}`;
        });
        (med.jours_absence || []).forEach((a) => {
          row[`A_${a.date}`] = a.motif || 'Absence';
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pointages');
      const dateStr = `${String(mois).padStart(2, '0')}-${annee}`;
      XLSX.writeFile(wb, `pointages-medecins-${dateStr}.xlsx`);
    } catch (err) {
      console.error('Erreur export pointages:', err);
    } finally {
      setExportLoading(false);
    }
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, gap:16, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes toast   { 0%{opacity:0;transform:translateY(16px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
      `}</style>

      {/* ── BARRE NAVIGATION MOIS ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:2, background:'white', border:'1px solid #e0f2fe', borderRadius:11, padding:4, boxShadow:'0 1px 4px rgba(14,165,233,.08)' }}>
          <button onClick={prevMois} style={{ width:32, height:32, border:'none', background:'transparent', borderRadius:8, cursor:'pointer', color:'#0369a1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, transition:'background .12s' }} onMouseEnter={e=>e.currentTarget.style.background='#f0f9ff'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>‹</button>
          <div style={{ padding:'0 16px', fontSize:14, fontWeight:800, color:'#0c4a6e', minWidth:170, textAlign:'center' }}>{MOIS_LABELS[mois]} {annee}</div>
          <button onClick={nextMois} style={{ width:32, height:32, border:'none', background:'transparent', borderRadius:8, cursor:'pointer', color:'#0369a1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, transition:'background .12s' }} onMouseEnter={e=>e.currentTarget.style.background='#f0f9ff'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>›</button>
        </div>
        <button onClick={goToday} style={{ padding:'7px 15px', border:'1px solid #bae6fd', background:'white', color:'#0284c7', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .12s' }} onMouseEnter={e=>e.currentTarget.style.background='#f0f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
          Aujourd'hui
        </button>

        <button onClick={handleExportPointage} disabled={exportLoading} style={{ padding:'7px 15px', border:'1px solid #bfdbfe', background:'white', color:exportLoading ? '#d1d5db' : '#2563eb', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:exportLoading ? 'not-allowed' : 'pointer', transition:'all .12s', opacity:exportLoading ? 0.6 : 1 }} onMouseEnter={e=>!exportLoading && (e.currentTarget.style.background='#eff6ff')} onMouseLeave={e=>e.currentTarget.style.background='white'}>
          {exportLoading ? 'Export en cours…' : 'Exporter Excel'}
        </button>

        <div style={{ flex:1 }}/>

        {/* KPIs inline */}
        {!loading && (
          <div style={{ display:'flex', gap:8 }}>
            {[
              { label:'Médecins',  val: resume.medecins?.length ?? 0, accent:'#0284c7', bg:'#e0f2fe' },
              { label:'Total heures travaillées', val: `${totalH}h`,                 accent:'#0891b2', bg:'#cffafe' },
              { label:'Présences', val: totalP,                       accent:'#16a34a', bg:'#dcfce7' },
              { label:'Absences',  val: totalA,                       accent:'#dc2626', bg:'#fee2e2' },
            ].map(({ label, val, accent, bg }) => (
              <div key={label} style={{ background:bg, borderRadius:10, padding:'7px 16px', textAlign:'center', minWidth:76 }}>
                <div style={{ fontSize:20, fontWeight:900, color:accent, lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:9.5, fontWeight:700, color:accent, opacity:.75, textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:10, padding:'10px 16px', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          {error}
          <button onClick={load} style={{ padding:'4px 12px', background:'#dc2626', color:'white', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>Réessayer</button>
        </div>
      )}

      {/* ── CORPS : liste + calendrier ── */}
      <div style={{ flex:1, minHeight:0, display:'grid', gridTemplateColumns:'250px 1fr', gap:14, overflow:'hidden' }}>

        {/* ══ LISTE MÉDECINS ══ */}
        <div style={{ background:'white', borderRadius:15, border:'1px solid #e0f2fe', boxShadow:'0 2px 12px rgba(14,165,233,.07)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #f0f9ff', flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.8px' }}>Équipe médicale · {resume.medecins?.length ?? 0}</div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ height:58, borderRadius:10, marginBottom:6, background:'linear-gradient(90deg,#f0f9ff 25%,#e0f2fe 50%,#f0f9ff 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
              ))
            ) : (() => {
              /* ── Groupement par type ── */
              const GROUPES = [
                { key:'traitant',   label:'Médecins traitants',   accent:'#0d6349', bg:'#e6f7f3', border:'#a7e3d4' },
                { key:'travail',    label:'Médecins du travail',  accent:'#1a4fa0', bg:'#e8f0fc', border:'#aac4f0' },
                { key:'controleur', label:'Médecins contrôleurs', accent:'#92400e', bg:'#fef3e2', border:'#f6d591' },
              ];
              const TYPE_KEY_LOCAL = {
                1:'traitant', 2:'travail', 3:'controleur',
                traitant:'traitant', travail:'travail', controleur:'controleur',
              };
              const getKey = (val) => {
                if (!val && val !== 0) return 'autre';
                return TYPE_KEY_LOCAL[parseInt(val,10)] || TYPE_KEY_LOCAL[String(val).toLowerCase().trim()] || 'autre';
              };

              const grouped = {};
              resume.medecins?.forEach(med => {
                const k = getKey(med.medecin_type);
                if (!grouped[k]) grouped[k] = [];
                grouped[k].push(med);
              });

              let globalIdx = 0;
              return GROUPES.map(({ key, label, icon, accent, bg, border }) => {
                const liste = grouped[key];
                if (!liste || liste.length === 0) return null;
                return (
                  <div key={key} style={{ marginBottom:10 }}>
                    {/* Titre du groupe */}
                    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 4px 6px', marginBottom:2 }}>
                      <div style={{ flex:1, height:1, background:'#e5e7eb' }}/>
                      <span style={{ fontSize:9.5, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.7px', whiteSpace:'nowrap' }}>
                        {label} · {liste.length}
                      </span>
                      <div style={{ flex:1, height:1, background:'#e5e7eb' }}/>
                    </div>

                    {/* Médecins du groupe */}
                    {liste.map(med => {
                      const active = med.medecin_id === selectedId;
                      const p = med.total_jours_presence || 0;
                      const a = med.total_jours_absence  || 0;
                      const initials = (med.medecin_nom || '?').replace('Dr.', '').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      const animIdx = globalIdx++;
                      return (
                        <button key={med.medecin_id} onClick={() => setSelectedId(med.medecin_id)}
                          style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 10px', borderRadius:11, marginBottom:3, border:`1.5px solid ${active ? '#7dd3fc' : 'transparent'}`, background:active ? 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' : 'transparent', cursor:'pointer', textAlign:'left', transition:'all .15s', animation:`fadeUp .2s ease ${animIdx * 0.04}s both` }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>

                          <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:active ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : 'linear-gradient(135deg,#e2e8f0,#cbd5e1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11.5, fontWeight:800, color:active ? 'white' : '#64748b', boxShadow:active ? '0 3px 8px rgba(14,165,233,.3)' : 'none', transition:'all .15s' }}>
                            {initials}
                          </div>

                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12.5, fontWeight:700, color:active ? '#0c4a6e' : '#374151', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {med.medecin_nom}
                            </div>
                            <div style={{ marginTop:3 }}>
                              <TypeBadge type={med.medecin_type}/>
                            </div>
                          </div>

                          <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end', flexShrink:0 }}>
                            {p > 0 && <span style={{ fontSize:10, fontWeight:700, color:'#15803d', background:'#dcfce7', padding:'1px 6px', borderRadius:4 }}>✓{p}</span>}
                            {a > 0 && <span style={{ fontSize:10, fontWeight:700, color:'#b91c1c', background:'#fee2e2', padding:'1px 6px', borderRadius:4 }}>✗{a}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>

          {/* Légende */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid #f0f9ff', flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>Légende</div>
            {[
              { bg:'#86efac', border:'#4ade80', label:'Présent' },
              { bg:'#fca5a5', border:'#f87171', label:'Absent'  },
              { bg:'#e2e8f0', border:'#cbd5e1', label:'Weekend / hors plage' },
            ].map(({ bg, border, label }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, fontSize:11.5, color:'#475569', fontWeight:500 }}>
                <span style={{ width:14, height:14, borderRadius:4, background:bg, border:`1.5px solid ${border}`, display:'block', flexShrink:0 }}/>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ══ CALENDRIER ══ */}
        <div style={{ background:'white', borderRadius:15, border:'1px solid #e0f2fe', boxShadow:'0 2px 12px rgba(14,165,233,.07)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {loading ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:38, marginBottom:10 }}>📅</div>
                <div style={{ fontSize:13 }}>Chargement…</div>
              </div>
            </div>
          ) : !medSel ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>👈</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#6b7280' }}>Sélectionnez un médecin</div>
              </div>
            </div>
          ) : (
            <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', animation:'fadeUp .2s ease' }}>

              {/* Header médecin sélectionné */}
              <div style={{ padding:'16px 22px', borderBottom:'1px solid #f0f9ff', display:'flex', alignItems:'center', gap:14, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', flexShrink:0 }}>
                <div style={{ width:46, height:46, borderRadius:13, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'white', flexShrink:0, boxShadow:'0 4px 12px rgba(14,165,233,.35)' }}>
                  {(medSel.medecin_nom || '?').replace('Dr.', '').trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:'#0c4a6e' }}>{medSel.medecin_nom}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
                    <TypeBadge type={medSel.medecin_type}/>
                    {/* Badge heures travaillées — explicite */}
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                      fontSize:12, fontWeight:700, color:'#0369a1',
                      background:'#e0f2fe', border:'1.5px solid #7dd3fc',
                      borderRadius:99, padding:'3px 10px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Total heures travaillées : <strong>{medSel.total_heures || 0}h</strong>
                    </span>
                    <span style={{ fontSize:11.5, color:'#16a34a', fontWeight:600 }}>
                      ✓ {medSel.total_jours_presence || 0} présence(s)
                    </span>
                    <span style={{ fontSize:11.5, color:'#dc2626', fontWeight:600 }}>
                      ✗ {medSel.total_jours_absence || 0} absence(s)
                    </span>
                  </div>
                </div>
                <div style={{ fontSize:11.5, color:'#94a3b8', fontStyle:'italic' }}>Cliquez sur un jour pour pointer</div>
              </div>

              {/* Grille calendrier */}
              <div style={{ flex:1, padding:'14px 18px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                {/* En-têtes jours */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:5, flexShrink:0 }}>
                  {JOURS_C.map(j => (
                    <div key={j} style={{ textAlign:'center', fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.6px', padding:'3px 0' }}>{j}</div>
                  ))}
                </div>

                {/* Cases — hauteur calculée pour remplir l'espace sans scroll */}
                <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:4 }}>
                  {cells.map((d, idx) => {
                    if (!d) return <div key={`e-${idx}`}/>;

                    const dateISO  = toISO(annee, mois, d);
                    const isToday  = dateISO === today;
                    const weekend  = isWeekend(firstDay, d);
                    const p        = mapP[dateISO];
                    const a        = mapA[dateISO];

                    let bg = 'white', border = '#e5e7eb', color = '#374151', topBar = null;
                    if (weekend)   { bg = '#f8fafc'; border = '#e2e8f0'; color = '#d1d5db'; }
                    else if (p)    { bg = '#f0fdf4'; border = '#86efac'; color = '#15803d'; topBar = '#22c55e'; }
                    else if (a)    { bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626'; topBar = '#ef4444'; }

                    return (
                      <button key={dateISO} onClick={() => handleDayClick(d)}
                        disabled={weekend}
                        style={{
                          position:'relative', minHeight:0,
                          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                          border:`1.5px solid ${isToday && !p && !a ? '#0284c7' : border}`,
                          borderRadius:10, background:isToday && !p && !a ? '#f0f9ff' : bg,
                          color, cursor:weekend ? 'default' : 'pointer',
                          transition:'all .12s', outline:'none', gap:1, padding:'4px 3px',
                          boxShadow:isToday ? '0 0 0 3px rgba(2,132,199,.18)' : 'none',
                          overflow:'hidden',
                        }}
                        onMouseEnter={e => {
                          if (!weekend && !p && !a) {
                            e.currentTarget.style.background = '#f0f9ff';
                            e.currentTarget.style.borderColor = '#7dd3fc';
                            e.currentTarget.style.transform = 'scale(1.04)';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(14,165,233,.2)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!weekend && !p && !a) {
                            e.currentTarget.style.background = isToday ? '#f0f9ff' : 'white';
                            e.currentTarget.style.borderColor = isToday ? '#0284c7' : '#e5e7eb';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = isToday ? '0 0 0 3px rgba(2,132,199,.18)' : 'none';
                          }
                        }}>

                        {/* Barre colorée en haut */}
                        {topBar && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:topBar, borderRadius:'8px 8px 0 0' }}/>}

                        {/* Numéro du jour */}
                        <span style={{ fontSize:12, fontWeight:isToday ? 900 : 600, lineHeight:1, color:isToday && !p && !a ? '#0284c7' : color }}>
                          {d}
                        </span>

                        {/* Présence : heures + remarque */}
                        {p && <>
                          <span style={{ fontSize:10, fontWeight:800, color:'#15803d', lineHeight:1.1 }}>{p.heures}h</span>
                          {p.remarque && (
                            <span style={{ fontSize:7.5, fontWeight:600, color:'#166534', lineHeight:1.1, maxWidth:'90%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center', background:'#bbf7d0', borderRadius:3, padding:'1px 4px', marginTop:1 }}>
                              {p.remarque}
                            </span>
                          )}
                        </>}

                        {/* Absence : motif */}
                        {a && (
                          <span style={{ fontSize:8, fontWeight:700, color:'#dc2626', lineHeight:1.1, maxWidth:'90%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>
                            {a.motif || 'Abs.'}
                          </span>
                        )}

                        {/* Vide : + discret */}
                        {!p && !a && !weekend && <span style={{ fontSize:14, color:'#bfdbfe', lineHeight:1 }}>+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Popup ── */}
      {popup && medSel && (
        <PopupJour
          medecin={{ id: medSel.medecin_id, nom: medSel.medecin_nom, heures_par_defaut: medSel.heures_par_defaut || 8 }}
          dateISO={popup.dateISO}
          pointage={popup.pointage}
          absence={popup.absence}
          onClose={() => setPopup(null)}
          onSaved={handlePopupSaved}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:'#0c4a6e', color:'white', padding:'12px 26px', borderRadius:12, fontSize:13.5, fontWeight:700, boxShadow:'0 8px 24px rgba(0,0,0,.2)', zIndex:99999, animation:'toast 2.8s ease forwards', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}