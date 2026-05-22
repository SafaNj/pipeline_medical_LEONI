// src/components/infirmier/ListesDuJour.jsx

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const sessLabel = (s) =>
  ({ MATIN: 'Matin', MIDI: 'Midi', APRES_MIDI: 'Après-midi' }[s] || s);

/* ── Icônes SVG inline (color explicite, pas currentColor) ── */
const IcoPlus        = ({ c='white' })  => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoStethoscope = ({ c='#1d4ed8' }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M4.5 9.5a5.5 5.5 0 0011 0v-3a1 1 0 00-1-1h-9a1 1 0 00-1 1v3z"/><path d="M10 9.5V17a4 4 0 008 0v-1"/><circle cx="18" cy="16" r="1.5" fill={c} stroke="none"/></svg>;
const IcoSearch      = ({ c='#6d28d9' }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoClock       = ({ c='#94a3b8' }) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoUsers       = ({ c='#94a3b8', size=11 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoCheck       = ({ c='#94a3b8', size=11 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoList        = ({ c='#cbd5e1' }) => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.2" fill={c} stroke="none"/><circle cx="3" cy="12" r="1.2" fill={c} stroke="none"/><circle cx="3" cy="18" r="1.2" fill={c} stroke="none"/></svg>;
const IcoChevron     = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" style={{ transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>;

function StatusBadge({ statut }) {
  const cfg = {
    EN_PREPARATION: { bg: '#f1f5f9', color: '#475569', text: 'En préparation' },
    ACTIVE:         { bg: '#dbeafe', color: '#1d4ed8', text: 'Active'         },
    TERMINEE:       { bg: '#dcfce7', color: '#15803d', text: 'Terminée'       },
  }[statut] || { bg: '#f1f5f9', color: '#475569', text: statut };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {cfg.text}
    </span>
  );
}

function ListeCard({ liste, isSelected, onClick }) {
  const items    = liste.items || [];
  const total    = items.length || liste.items_count || 0;
  const effectue = items.filter(i => i.statut === 'EFFECTUEE').length;
  const pct      = total ? Math.round(effectue / total * 100) : 0;
  const isConsult = liste.type_liste === 'CONSULTATION';
  const smsTotal = items.filter(i => i.statut === 'EN_ATTENTE').length;
  const smsSent  = items.filter(i => i.statut === 'EN_ATTENTE' && i.sms_envoye).length;

  return (
    <div onClick={onClick}
      style={{ background: isSelected ? '#eff6ff' : 'white', borderRadius: 14, padding: '14px 16px',
        border: `2px solid ${isSelected ? '#2563eb' : 'transparent'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)', cursor: 'pointer', transition: 'all .15s' }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,.09)'; }}}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)'; }}}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
          background: isConsult ? '#eff6ff' : '#f5f3ff', color: isConsult ? '#1d4ed8' : '#6d28d9',
          padding:'3px 9px', borderRadius:7 }}>
          {isConsult ? <IcoStethoscope c="#1d4ed8" /> : <IcoSearch c="#6d28d9" />}
          {isConsult ? 'Consultation' : 'Contre-visite'}
        </span>
        <StatusBadge statut={liste.statut} />
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b', marginBottom:5 }}>
        <IcoClock c="#94a3b8" /> {fmtDate(liste.date)}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8',
        marginBottom: (liste.medecin_nom || total > 0) ? 6 : 0 }}>
        <span>{sessLabel(liste.session)}</span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <IcoUsers c="#94a3b8" /> {total} patient{total > 1 ? 's' : ''}
        </span>
      </div>

      {liste.medecin_nom && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#475569', fontWeight:600,
          marginBottom: total > 0 ? 8 : 0, background:'#f8fafc', borderRadius:7, padding:'4px 8px' }}>
          <IcoUsers c="#64748b" size={12} /> {liste.medecin_nom}
        </div>
      )}

      {smsTotal > 0 && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:'#1e3a8a', fontWeight:700,
          background:'#e0f2fe', borderRadius:8, padding:'4px 8px', marginBottom:8 }}>
          📱 {smsSent}/{smsTotal} notifiés
        </div>
      )}

      {total > 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'#94a3b8', marginBottom:4 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <IcoCheck c={pct === 100 ? '#16a34a' : '#94a3b8'} />
              {effectue} effectué{effectue > 1 ? 's' : ''}
            </span>
            <span style={{ fontWeight:700, color: pct === 100 ? '#16a34a' : '#475569' }}>{pct}%</span>
          </div>
          <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', borderRadius:3,
              background: pct === 100 ? '#22c55e' : '#3b82f6', transition:'width .4s' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListesDuJour({ listes, selectedId, onSelect, onCreerClick, loading }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexShrink:0 }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#334155' }}>Listes du jour</span>
        <button onClick={onCreerClick}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', background:'#2563eb',
            color:'white', border:'none', borderRadius:9, fontSize:12.5, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 6px rgba(37,99,235,.3)' }}>
          <IcoPlus c="white" /> Nouvelle
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, paddingRight:2 }}>
        {loading && [1,2,3].map(i => (
          <div key={i} style={{ height:88, borderRadius:14,
            background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
            backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
        ))}
        {!loading && listes.length === 0 && (
          <div style={{ textAlign:'center', padding:'36px 16px', background:'white', borderRadius:14, border:'1.5px dashed #e2e8f0' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}><IcoList /></div>
            <p style={{ color:'#94a3b8', fontSize:13.5, margin:0 }}>Aucune liste aujourd'hui</p>
            <p style={{ color:'#cbd5e1', fontSize:12.5, marginTop:4 }}>Créez votre première liste</p>
          </div>
        )}
        {!loading && listes.map(l => (
          <ListeCard key={l.id} liste={l} isSelected={l.id === selectedId} onClick={() => onSelect(l)} />
        ))}
      </div>
    </div>
  );
}