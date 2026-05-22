// src/components/infirmier/ArchiveVisites.jsx
import { useState, useEffect, useCallback } from 'react';
import { getArchivesVisites } from '../../api/actInfirmierApi';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const sessLabel = (s) =>
  ({ MATIN: 'Matin', MIDI: 'Midi', APRES_MIDI: 'Après-midi' }[s] || s);

const MOIS = [
  { n:1,lbl:'Janvier' },{ n:2,lbl:'Février' },{ n:3,lbl:'Mars' },{ n:4,lbl:'Avril' },
  { n:5,lbl:'Mai' },{ n:6,lbl:'Juin' },{ n:7,lbl:'Juillet' },{ n:8,lbl:'Août' },
  { n:9,lbl:'Septembre' },{ n:10,lbl:'Octobre' },{ n:11,lbl:'Novembre' },{ n:12,lbl:'Décembre' },
];

/* ── Icônes SVG inline (color explicite) ── */
const IcoStethoscope = ({ c='#1d4ed8', size=20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><path d="M4.5 9.5a5.5 5.5 0 0011 0v-3a1 1 0 00-1-1h-9a1 1 0 00-1 1v3z"/><path d="M10 9.5V17a4 4 0 008 0v-1"/><circle cx="18" cy="16" r="1.5" fill={c} stroke="none"/></svg>;
const IcoSearch      = ({ c='#1d4ed8', size=20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoUsers       = ({ c='#0f172a', size=20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoCheck       = ({ c='#16a34a', size=20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoX           = ({ c='#dc2626', size=20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IcoCalendar    = ({ c='#cbd5e1', size=40 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoCal         = ({ c='#94a3b8' }) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoClock       = ({ c='#94a3b8' }) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoCheckSm     = ({ c='#94a3b8' }) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoUsersSm     = ({ c='#94a3b8', size=12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoChevron     = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" style={{ transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>;
const IcoAlert       = ({ c='#b91c1c' }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

function StatutBadge({ statut }) {
  const cfg = {
    EN_PREPARATION:{ bg:'#f1f5f9', color:'#475569', text:'En préparation' },
    ACTIVE:        { bg:'#dbeafe', color:'#1d4ed8', text:'Active' },
    TERMINEE:      { bg:'#dcfce7', color:'#15803d', text:'Terminée' },
    EN_ATTENTE:    { bg:'#ffedd5', color:'#c2410c', text:'En attente' },
    EFFECTUEE:     { bg:'#dcfce7', color:'#15803d', text:'Effectuée' },
    ANNULEE:       { bg:'#fee2e2', color:'#b91c1c', text:'Annulée' },
  }[statut] || { bg:'#f1f5f9', color:'#475569', text:statut };
  return <span style={{ background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, whiteSpace:'nowrap' }}>{cfg.text}</span>;
}

function StatCard({ value, label, color, bg, icon }) {
  return (
    <div style={{ background:'white', borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'center', gap:12,
      boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #f1f5f9' }}>
      <div style={{ width:42, height:42, borderRadius:11, flexShrink:0, background:bg,
        display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize:26, fontWeight:800, lineHeight:1.1, color, letterSpacing:'-0.5px' }}>{value ?? 0}</div>
        <div style={{ fontSize:11.5, color:'#64748b', marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}

function CollabRow({ item, idx }) {
  const nom = item.collaborateur_nom ||
    (item.collaborateur && typeof item.collaborateur === 'object'
      ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
      : `#${item.collaborateur}`);
  const initials = (nom||'').split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const rowBg     = { EN_ATTENTE:'#f8fafc', EFFECTUEE:'#f0fdf4', ANNULEE:'#fef9f9' }[item.statut]||'#f8fafc';
  const rowBorder = { EN_ATTENTE:'#e2e8f0', EFFECTUEE:'#bbf7d0', ANNULEE:'#fecaca' }[item.statut]||'#e2e8f0';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
      borderRadius:9, marginBottom:5, background:rowBg, border:`1px solid ${rowBorder}` }}>
      <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
        background: item.statut==='EFFECTUEE'?'#dcfce7':item.statut==='ANNULEE'?'#fee2e2':'#eff6ff',
        color: item.statut==='EFFECTUEE'?'#15803d':item.statut==='ANNULEE'?'#b91c1c':'#1d4ed8',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800 }}>
        {initials || idx+1}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nom}</div>
        <div style={{ display:'flex', gap:6, marginTop:2 }}>
          {item.collaborateur_matricule && <span style={{ fontSize:10.5, background:'#eff6ff', color:'#1d4ed8', padding:'1px 6px', borderRadius:5, fontWeight:700 }}>{item.collaborateur_matricule}</span>}
          {item.collaborateur_department && <span style={{ fontSize:10.5, color:'#94a3b8' }}>{item.collaborateur_department}</span>}
        </div>
      </div>
      <StatutBadge statut={item.statut} />
    </div>
  );
}

function ListeCard({ liste }) {
  const [open, setOpen] = useState(false);
  const isConsult = liste.type_liste === 'CONSULTATION';
  const items = liste.items || [];
  const effectues = items.filter(i => i.statut === 'EFFECTUEE').length;
  const pct = items.length ? Math.round(effectues / items.length * 100) : 0;

  return (
    <div style={{ background:'white', borderRadius:14, marginBottom:10,
      border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.05)', overflow:'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', cursor:'pointer', borderLeft:'4px solid #2563eb' }}
        onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:'#eff6ff',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isConsult ? <IcoStethoscope c="#2563eb" size={18}/> : <IcoSearch c="#2563eb" size={18}/>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#2563eb' }}>{isConsult ? 'Consultation' : 'Contre-visite'}</span>
            <StatutBadge statut={liste.statut} />
            {liste.medecin_nom && <span style={{ fontSize:11.5, color:'#64748b' }}>· {liste.medecin_nom}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#94a3b8' }}><IcoCal/> {fmtDate(liste.date)}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#94a3b8' }}><IcoClock/> {sessLabel(liste.session)}</span>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:700, color: pct===100?'#16a34a':'#64748b' }}>
              <IcoCheckSm c={pct===100?'#16a34a':'#94a3b8'}/> {effectues}/{items.length} effectué{effectues>1?'s':''}
            </span>
          </div>
          {items.length > 0 && (
            <div style={{ marginTop:5, height:3, background:'#f1f5f9', borderRadius:2, overflow:'hidden', maxWidth:180 }}>
              <div style={{ width:`${pct}%`, height:'100%', borderRadius:2, background: pct===100?'#22c55e':'#2563eb', transition:'width .4s' }}/>
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, background:'#eff6ff', color:'#2563eb', fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
            <IcoUsersSm c="#2563eb" size={12}/> {items.length} patient{items.length>1?'s':''}
          </span>
          <IcoChevron open={open}/>
        </div>
      </div>
      {open && (
        <div style={{ padding:'12px 18px 14px', borderTop:'1px solid #f1f5f9', background:'#fafbfc' }}>
          {items.length === 0
            ? <p style={{ fontSize:12.5, color:'#94a3b8', textAlign:'center', padding:'10px 0' }}>Aucun patient</p>
            : items.map((item, idx) => <CollabRow key={item.id} item={item} idx={idx}/>)
          }
        </div>
      )}
    </div>
  );
}

export default function ArchiveVisites() {
  const now = new Date();
  const [mois,    setMois]    = useState(now.getMonth() + 1);
  const [annee,   setAnnee]   = useState(now.getFullYear());
  const [listes,  setListes]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [filtre,  setFiltre]  = useState('TOUS');

  const fetchData = useCallback(async (m, a) => {
    setLoading(true); setError('');
    try { setListes(await getArchivesVisites(m, a)); }
    catch { setError('Impossible de charger les archives.'); setListes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(mois, annee); }, [mois, annee, fetchData]);

  const allItems       = listes.flatMap(l => l.items || []);
  const totalConsult   = listes.filter(l => l.type_liste === 'CONSULTATION').length;
  const totalCV        = listes.filter(l => l.type_liste === 'CONTRE_VISITE').length;
  const totalPatients  = allItems.length;
  const totalEffectues = allItems.filter(i => i.statut === 'EFFECTUEE').length;
  const totalAnnules   = allItems.filter(i => i.statut === 'ANNULEE').length;
  const listesFiltrees = filtre === 'TOUS' ? listes : listes.filter(l => l.type_liste === filtre);
  const moisLabel      = MOIS.find(m => m.n === mois)?.lbl || '';
  const anneesDispos   = Array.from({ length:5 }, (_,i) => now.getFullYear() - i);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:20, flexShrink:0 }}>
        <StatCard value={totalConsult}   label="Consultations"  color="#1d4ed8" bg="#eff6ff" icon={<IcoStethoscope c="#1d4ed8" size={20}/>}/>
        <StatCard value={totalCV}        label="Contre-visites" color="#1d4ed8" bg="#eff6ff" icon={<IcoSearch c="#1d4ed8" size={20}/>}/>
        <StatCard value={totalPatients}  label="Total patients" color="#0f172a" bg="#f1f5f9" icon={<IcoUsers c="#0f172a" size={20}/>}/>
        <StatCard value={totalEffectues} label="Effectués"      color="#16a34a" bg="#f0fdf4" icon={<IcoCheck c="#16a34a" size={20}/>}/>
        <StatCard value={totalAnnules}   label="Annulés"        color="#dc2626" bg="#fef2f2" icon={<IcoX c="#dc2626" size={20}/>}/>
      </div>

      <div style={{ background:'white', borderRadius:14, padding:'13px 16px', marginBottom:14,
        display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', flexShrink:0,
        border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
        <select value={annee} onChange={e => setAnnee(Number(e.target.value))}
          style={{ border:'1.5px solid #e2e8f0', borderRadius:8, padding:'6px 12px',
            fontSize:13, fontWeight:700, color:'#1e293b', background:'white', cursor:'pointer', outline:'none' }}>
          {anneesDispos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', flex:1 }}>
          {MOIS.map(({ n, lbl }) => {
            const active = mois === n;
            return (
              <button key={n} onClick={() => setMois(n)} style={{
                padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:700, transition:'all .15s',
                background: active?'#2563eb':'#f1f5f9', color: active?'white':'#64748b',
                boxShadow: active?'0 2px 8px rgba(37,99,235,.3)':'none' }}>
                {lbl.slice(0,3)}
              </button>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[
            { val:'TOUS',         label:'Tous',          icon:null },
            { val:'CONSULTATION', label:'Consultation',  icon:<IcoStethoscope c="inherit" size={12}/> },
            { val:'CONTRE_VISITE',label:'Contre-visite', icon:<IcoSearch c="inherit" size={12}/> },
          ].map(({ val, label, icon }) => {
            const active = filtre === val;
            return (
              <button key={val} onClick={() => setFiltre(val)} style={{
                display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:20,
                border:'none', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .15s',
                background: active?'#2563eb':'#f1f5f9', color: active?'white':'#64748b',
                boxShadow: active?'0 2px 8px rgba(0,0,0,.15)':'none' }}>
                {icon}{label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2',
            border:'1px solid #fecaca', color:'#b91c1c', padding:'12px 16px', borderRadius:12, fontSize:13, marginBottom:14 }}>
            <IcoAlert/> {error}
          </div>
        )}
        {loading && [1,2,3,4].map(i => (
          <div key={i} style={{ height:68, borderRadius:14, marginBottom:10,
            background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
            backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
        ))}
        {!loading && !error && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:13.5, fontWeight:700, color:'#334155' }}>
                {moisLabel} {annee}
                {filtre !== 'TOUS' && <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginLeft:6 }}>· {filtre==='CONSULTATION'?'Consultations':'Contre-visites'}</span>}
              </span>
              <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:12, fontWeight:700, padding:'3px 12px', borderRadius:20 }}>
                {listesFiltrees.length} liste{listesFiltrees.length>1?'s':''}
              </span>
            </div>
            {listesFiltrees.length === 0 && (
              <div style={{ textAlign:'center', padding:'56px 20px', background:'white', borderRadius:16, border:'1.5px dashed #e2e8f0' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><IcoCalendar/></div>
                <p style={{ color:'#94a3b8', fontSize:14, fontWeight:600, margin:0 }}>Aucune visite en {moisLabel} {annee}</p>
                <p style={{ color:'#cbd5e1', fontSize:12, marginTop:4 }}>Sélectionnez un autre mois dans le filtre</p>
              </div>
            )}
            {listesFiltrees.map(liste => <ListeCard key={liste.id} liste={liste}/>)}
          </>
        )}
      </div>
    </div>
  );
}