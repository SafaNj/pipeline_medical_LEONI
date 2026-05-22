import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import { getMesListesDuJour } from '../api/consultationsApi';

import FileAttente      from '../components/medecinTraitant/FileAttente';
import DossierPatient   from '../components/medecinTraitant/DossierPatient';
import HistoriquePatient from '../components/medecinControleur/HistoriquePatient';
import DocumentsMedicauxScannesPage from '../components/documents/DocumentsMedicauxScannesPage';
import MaladiesChroniques from '../components/infirmier/MaladiesChroniques';
import { getUserSiteName } from '../utils/siteAccessControl';

const getNouveauxCertificatsCount = (consultation) => {
  if (!consultation || typeof consultation !== 'object') return 0;

  const buckets = [
    consultation.certificats_bonne_sante,
    consultation.certificats_exemption,
    consultation.certificats_permis,
    consultation.certificats_prenuptial,
    consultation.certificats_prenuptiaux,
    consultation.certificats_aptitude_generale,
  ];

  return buckets.reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0);
};

/* ════════════════════════════════════════════════════════════
   PAGE ACCUEIL
════════════════════════════════════════════════════════════ */
function VueAccueil({ user, totalPatients, totalEnAttente, totalEffectues, allItems, onGoToConsultations, loading }) {
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Dernières consultations effectuées (max 5)
  const dernieres = allItems
    .filter(i => i.statut === 'EFFECTUEE' && i.consultation)
    .slice(0, 5);

  // Patients encore en attente
  const enAttente = allItems.filter(i => i.statut === 'EN_ATTENTE');
  const totalNouveauxCertifs = allItems.reduce(
    (sum, i) => sum + getNouveauxCertificatsCount(i.consultation),
    0
  );

  // Taux de complétion
  const tauxCompletion = totalPatients > 0 ? Math.round((totalEffectues / totalPatients) * 100) : 0;

  const fmtHeure = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>

      {/* ── Bannière bienvenue ── */}
      <div style={{
        background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(3,105,161,.25)',
      }}>
        {/* Cercles déco */}
        <div style={{ position:'absolute', top:-40, right:-30, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, right:120, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:20, right:200, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.75)', fontWeight:600, marginBottom:6, letterSpacing:.5 }}>
              {today.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).replace(/^\w/, c => c.toUpperCase())}
            </div>
            <h2 style={{ fontSize:26, fontWeight:800, color:'white', margin:0, letterSpacing:-.5, display:'flex', alignItems:'center', gap:10 }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 3v8M9 7h6"/></svg>
              {greeting}, Dr. {user?.username}
            </h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.8)', marginTop:8, fontWeight:500 }}>
              {totalEnAttente > 0
                ? `Vous avez ${totalEnAttente} patient${totalEnAttente > 1 ? 's' : ''} en attente de consultation.`
                : totalPatients === 0
                  ? "Aucune liste active aujourd'hui."
                  : "Toutes les consultations du jour sont terminées."}
            </p>
          </div>
          {totalEnAttente > 0 && (
            <button onClick={onGoToConsultations} style={{
              padding:'12px 24px', background:'white', color:'#0369a1',
              border:'none', borderRadius:12, fontSize:14, fontWeight:700,
              cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,.15)',
              transition:'all .2s', flexShrink:0, whiteSpace:'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}
            >
              Voir les patients →
            </button>
          )}
        </div>
      </div>

      {/* ── Cartes stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          {
            label: 'Total patients', value: loading ? '—' : totalPatients,
            icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
            color: '#0284c7', bg: '#e0f2fe', accent: '#bae6fd',
          },
          {
            label: 'En attente', value: loading ? '—' : totalEnAttente,
            icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            color: '#ea580c', bg: '#fff7ed', accent: '#fed7aa',
          },
          {
            label: 'Consultés', value: loading ? '—' : totalEffectues,
            icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
            color: '#16a34a', bg: '#f0fdf4', accent: '#bbf7d0',
          },
          {
            label: 'Taux complétion', value: loading ? '—' : `${tauxCompletion}%`,
            icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
            color: '#0369a1', bg: '#e0f2fe', accent: '#bae6fd',
          },
        ].map(({ label, value, icon, color, bg, accent }) => (
          <div key={label} style={{
            background: 'white', borderRadius: 16, padding: '20px 22px',
            border: `1px solid ${accent}`,
            boxShadow: '0 2px 10px rgba(0,0,0,.05)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div style={{
                width:42, height:42, borderRadius:12, background:bg,
                display:'flex', alignItems:'center', justifyContent:'center', color,
              }}>
                {icon}
              </div>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:'#0c4a6e', lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:12.5, color:'#64748b', fontWeight:600, marginTop:6 }}>{label}</div>
            {/* Barre de progression pour taux */}
            {label === 'Taux complétion' && !loading && totalPatients > 0 && (
              <div style={{ marginTop:10, height:4, background:'#f1f5f9', borderRadius:99 }}>
                <div style={{ height:'100%', width:`${tauxCompletion}%`, background:'linear-gradient(90deg,#0284c7,#38bdf8)', borderRadius:99, transition:'width .5s ease' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Ligne basse : Consultations récentes + Alertes ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>

        {/* Consultations récentes */}
        <div style={{ background:'white', borderRadius:16, padding:'22px 24px', border:'1px solid #e0f2fe', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:3, height:18, background:'linear-gradient(180deg,#0ea5e9,#0369a1)', borderRadius:99 }} />
              <span style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>Dernières consultations</span>
            </div>
            <button onClick={onGoToConsultations} style={{
              fontSize:12, color:'#0284c7', background:'#e0f2fe',
              border:'none', borderRadius:8, padding:'5px 12px',
              cursor:'pointer', fontWeight:700, fontFamily:'inherit',
            }}>
              Voir tout →
            </button>
          </div>

          {loading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ height:64, borderRadius:12, marginBottom:10, background:'linear-gradient(90deg,#f0f9ff 25%,#e0f2fe 50%,#f0f9ff 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
            ))
          ) : dernieres.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center', padding:'32px 16px', color:'#94a3b8' }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round"><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                <p style={{ fontSize:13, fontWeight:600 }}>Aucune consultation effectuée aujourd'hui</p>
              </div>
          ) : dernieres.map((item, i) => {
            const nom = item.collaborateur_nom || `Patient #${item.collaborateur}`;
            const initials = nom.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0,2);
            const diag = item.consultation?.diagnostic || '';
            const hasOrd = (item.consultation?.ordonnances || []).length > 0;
            const hasCert = (item.consultation?.certificats || []).length > 0;
            const nbNouveauxCertifs = getNouveauxCertificatsCount(item.consultation);
            const hasNouveauxCertifs = nbNouveauxCertifs > 0;
            return (
              <div key={item.id} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 14px', borderRadius:12, marginBottom:8,
                background: i === 0 ? '#f0f9ff' : '#fafcff',
                border:`1px solid ${i === 0 ? '#bae6fd' : '#f1f5f9'}`,
                transition:'all .15s', cursor:'pointer',
              }}
                onClick={onGoToConsultations}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#7dd3fc'; e.currentTarget.style.background='#e0f2fe'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=i===0?'#bae6fd':'#f1f5f9'; e.currentTarget.style.background=i===0?'#f0f9ff':'#fafcff'; }}
              >
                <div style={{
                  width:40, height:40, borderRadius:11, flexShrink:0,
                  background:'linear-gradient(135deg,#0ea5e9,#0369a1)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontSize:13, fontWeight:800,
                }}>
                  {initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0c4a6e', marginBottom:2 }}>{nom}</div>
                  <div style={{ fontSize:12, color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {diag || 'Consultation effectuée'}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>
                    {fmtHeure(item.consultation?.date_consultation)}
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {hasOrd && <span style={{ fontSize:10, background:'#e0f2fe', color:'#0284c7', padding:'2px 7px', borderRadius:99, fontWeight:700 }}>Ord.</span>}
                    {hasCert && <span style={{ fontSize:10, background:'#f0fdf4', color:'#16a34a', padding:'2px 7px', borderRadius:99, fontWeight:700 }}>Cert.</span>}
                    {hasNouveauxCertifs && <span style={{ fontSize:10, background:'#fff7ed', color:'#c2410c', padding:'2px 7px', borderRadius:99, fontWeight:700 }}>Cert+ ({nbNouveauxCertifs})</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panneau droite : Alertes + En attente */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Alertes */}
          <div style={{ background:'white', borderRadius:16, padding:'20px 22px', border:'1px solid #e0f2fe', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <div style={{ width:3, height:18, background:'linear-gradient(180deg,#f59e0b,#ea580c)', borderRadius:99 }} />
              <span style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>Alertes</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {totalEnAttente > 0 ? (
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'#fff7ed', borderRadius:10, border:'1px solid #fed7aa' }}>
                  <div style={{ flexShrink:0, marginTop:1, color:'#c2410c' }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#c2410c' }}>
                      {totalEnAttente} patient{totalEnAttente>1?'s':''} en attente
                    </div>
                    <div style={{ fontSize:12, color:'#9a3412', marginTop:2 }}>Consultations à effectuer</div>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0' }}>
                  <div style={{ flexShrink:0, marginTop:1, color:'#16a34a' }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#166534' }}>File d'attente vide</div>
                    <div style={{ fontSize:12, color:'#14532d', marginTop:2 }}>Tous les patients ont été consultés</div>
                  </div>
                </div>
              )}
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'#f0f9ff', borderRadius:10, border:'1px solid #bae6fd' }}>
                  <div style={{ flexShrink:0, marginTop:1, color:'#0369a1' }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0369a1' }}>
                    {totalEffectues} consultation{totalEffectues>1?'s':''} enregistrée{totalEffectues>1?'s':''}
                  </div>
                  <div style={{ fontSize:12, color:'#075985', marginTop:2 }}>Aujourd'hui · {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
              {totalNouveauxCertifs > 0 && (
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', background:'#fff7ed', borderRadius:10, border:'1px solid #fed7aa' }}>
                  <div style={{ flexShrink:0, marginTop:1, color:'#c2410c' }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#c2410c' }}>
                      {totalNouveauxCertifs} nouveau{totalNouveauxCertifs > 1 ? 'x' : ''} certificat{totalNouveauxCertifs > 1 ? 's' : ''} médical{totalNouveauxCertifs > 1 ? 'aux' : ''}
                    </div>
                    <div style={{ fontSize:12, color:'#9a3412', marginTop:2 }}>
                      Bonne santé, Exemption, Permis, Prénuptial
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prochains patients */}
          {enAttente.length > 0 && (
            <div style={{ background:'white', borderRadius:16, padding:'20px 22px', border:'1px solid #e0f2fe', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:3, height:18, background:'linear-gradient(180deg,#0ea5e9,#0369a1)', borderRadius:99 }} />
                <span style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>À consulter</span>
                <span style={{ marginLeft:'auto', background:'#fff7ed', color:'#ea580c', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>
                  {enAttente.length}
                </span>
              </div>
              {enAttente.slice(0,4).map((item, i) => {
                const nom = item.collaborateur_nom || `Patient #${item.collaborateur}`;
                const initials = nom.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
                return (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop: i>0?'1px solid #f1f5f9':'none' }}>
                    <div style={{
                      width:30, height:30, borderRadius:9, flexShrink:0,
                      background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize:11, fontWeight:800,
                    }}>{initials}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0c4a6e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{nom}</div>
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', fontWeight:600, flexShrink:0 }}>
                      #{item.ordre ?? i+1}
                    </div>
                  </div>
                );
              })}
              {enAttente.length > 4 && (
                <button onClick={onGoToConsultations} style={{ marginTop:10, width:'100%', padding:'8px', background:'#f0f9ff', border:'1px dashed #7dd3fc', borderRadius:9, color:'#0284c7', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  + {enAttente.length - 4} autres patients
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardMedecinTraitant() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const siteName = getUserSiteName();

  const [listes,        setListes]        = useState([]);
  const [selectedItem,  setSelectedItem]  = useState(null); // item (patient) sélectionné
  const [loadListes,    setLoadListes]    = useState(true);
  const [globalError,   setGlobalError]   = useState('');
  const [vue,           setVue]           = useState('accueil');

  const fetchListes = useCallback(async () => {
    setGlobalError('');
    setLoadListes(true);
    try {
      const data = await getMesListesDuJour();
      setListes(data);
      // Sélectionner automatiquement le premier patient EN_ATTENTE
      const premiers = data.flatMap(l => (l.items || []).filter(i => i.statut === 'EN_ATTENTE'));
      if (premiers.length > 0) setSelectedItem(premiers[0]);
    } catch {
      setGlobalError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoadListes(false);
    }
  }, []);

  useEffect(() => { fetchListes(); }, [fetchListes]);

  // Quand une consultation/ordonnance/certificat est créée → mettre à jour l'item dans listes
  const handleUpdateItem = (updatedItem) => {
    setListes(prev => prev.map(l => ({
      ...l,
      items: (l.items || []).map(i => i.id === updatedItem.id ? updatedItem : i),
    })));
    setSelectedItem(updatedItem);
  };

  // Tous les items (patients) de toutes les listes
  const allItems = listes.flatMap(l =>
    (l.items || []).map(i => ({ ...i, _liste: l }))
  );
  const enAttente = allItems.filter(i => i.statut === 'EN_ATTENTE');
  const effectues = allItems.filter(i => i.statut === 'EFFECTUEE');
  const totalPatients = allItems.length;
  const totalEnAttente = enAttente.length;
  const totalEffectues = effectues.length;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: '#f0f9ff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside style={{
        width: 256, minWidth: 256,
        background: 'linear-gradient(175deg, #e0f7ff 0%, #bae6fd 40%, #7dd3fc 78%, #38bdf8 100%)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', borderRight: '1px solid #7dd3fc',
        boxShadow: '4px 0 20px rgba(14,165,233,.13)',
        position: 'relative', zIndex: 10, overflow: 'hidden',
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.16)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 30, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 18px 14px', borderBottom: '1px solid rgba(2,132,199,.18)',
          position: 'relative', flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(14,165,233,.4)',
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
              <path d="M12 3v8M8 7h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0c4a6e', letterSpacing: -.3, lineHeight: 1.2 }}>
              Service Médica
            </div>
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 600, letterSpacing: .3, marginTop: 2 }}>
              {siteName || 'Non assigné'}
            </div>
          </div>
          <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, color: '#0c4a6e', letterSpacing: '1px', fontFamily: 'Arial Black, sans-serif' }}>
            LEONI
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 6px' }}>
          {/* Section label */}
          <div style={{ fontSize: 9, fontWeight: 800, color: '#0369a1', letterSpacing: 1.6, textTransform: 'uppercase', opacity: .65, padding: '10px 10px 4px' }}>
            Consultation
          </div>

          {[
            {
              key: 'accueil', label: 'Accueil',
              icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
            },
            {
              key: 'listes', label: 'Consultations du jour',
              icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
            },
            {
              key: 'historique', label: 'Historique patients',
              icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
            },
            {
              key: 'documents-scans', label: 'Archives / scans',
              icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
            },
          ].map(({ key, label, icon }) => {
            const isActive = vue === key;
            return (
              <button key={key} onClick={() => setVue(key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', borderRadius: 11, marginBottom: 2,
                background: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#0c4a6e',
                fontSize: 12.5, fontWeight: isActive ? 700 : 600,
                border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                boxShadow: isActive ? '0 3px 10px rgba(2,132,199,.3)' : 'none',
                transition: 'all .16s', letterSpacing: -.1,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(2,132,199,.1)'; e.currentTarget.style.color = '#0284c7'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0c4a6e'; }}}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: isActive ? 'rgba(255,255,255,.2)' : 'rgba(2,132,199,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? 'white' : '#0284c7', transition: 'all .16s',
                }}>
                  {icon}
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <div style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.65)', flexShrink: 0 }} />}
              </button>
            );
          })}

          {/* Section label */}
          {/* Stats aujourd'hui */}
          <div style={{ fontSize: 9, fontWeight: 800, color: '#0369a1', letterSpacing: 1.6, textTransform: 'uppercase', opacity: .65, padding: '12px 10px 6px' }}>
            Aujourd'hui
          </div>
          <div style={{
            margin: '0 2px 6px',
            background: 'rgba(255,255,255,.45)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(2,132,199,.2)',
            borderRadius: 12, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            {[
              { val: totalPatients,  lbl: 'Patients',  color: '#0284c7' },
              { val: totalEnAttente, lbl: 'Attente',   color: '#ea580c' },
              { val: totalEffectues, lbl: 'Consultés', color: '#0369a1' },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2, fontWeight: 600 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Carte utilisateur */}
        <div style={{
          margin: '0 10px 14px',
          background: 'rgba(255,255,255,.55)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(2,132,199,.22)',
          borderRadius: 14, padding: '11px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#0ea5e9,#0369a1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 15, fontWeight: 800,
            boxShadow: '0 2px 8px rgba(14,165,233,.28)',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'M'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0c4a6e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Dr. {user?.username}
            </div>
            <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, marginTop: 1 }}>Médecin traitant</div>
          </div>
          <LogoutButton onClick={handleLogout} />
        </div>
      </aside>

      {/*  MAIN  */}
      <main style={{
        flex: 1, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        padding: '28px 32px 24px',
        background: '#f0f9ff',
      }}>
        {/* Top bar */}
        <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <div style={{ width: 4, height: 24, borderRadius: 99, background: 'linear-gradient(180deg,#0ea5e9,#0369a1)', flexShrink: 0 }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0c4a6e', letterSpacing: -.5 }}>
              {vue === 'historique' ? 'Historique patients' : vue === 'accueil' ? 'Tableau de bord' : vue === 'documents-scans' ? 'Archives / scans (documents)' : 'Consultations du jour'}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#0369a1', fontWeight: 500, textTransform: 'capitalize', paddingLeft: 14 }}>
            {today}
          </p>
        </div>

        {/* Erreur globale */}
        {globalError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#b91c1c', padding: '12px 16px', borderRadius: 12,
            fontSize: 13.5, marginBottom: 20, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {globalError}
            <button onClick={fetchListes} style={{
              padding: '5px 14px', background: '#b91c1c', color: 'white',
              border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}>
              Réessayer
            </button>
          </div>
        )}

        {/* Vue Accueil */}
        {vue === 'accueil' && (
          <VueAccueil
            user={user}
            totalPatients={totalPatients}
            totalEnAttente={totalEnAttente}
            totalEffectues={totalEffectues}
            allItems={allItems}
            onGoToConsultations={() => setVue('listes')}
            loading={loadListes}
          />
        )}

        {/* Vue Historique */}
        {vue === 'historique' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <HistoriquePatient />
          </div>
        )}

        {vue === 'documents-scans' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DocumentsMedicauxScannesPage canEdit={false} />
          </div>
        )}

        {vue === 'maladies-chroniques' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MaladiesChroniques readOnly />
          </div>
        )}

        {/* Vue Consultations */}
        {vue === 'listes' && (
          <div style={{
            display: 'grid', gridTemplateColumns: '290px 1fr',
            gap: 20, flex: 1, overflow: 'hidden', minHeight: 0,
          }}>
            <FileAttente
              items={allItems}
              selectedItemId={selectedItem?.id ?? null}
              onSelect={setSelectedItem}
              loading={loadListes}
            />
            <DossierPatient
              item={selectedItem}
              onUpdateItem={handleUpdateItem}
            />
          </div>
        )}
      </main>
    </div>
  );
}