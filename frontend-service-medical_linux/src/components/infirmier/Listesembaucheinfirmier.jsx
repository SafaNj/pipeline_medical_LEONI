// src/components/infirmier/ListesEmbaucheInfirmier.jsx
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../api/axios';
import {
  assignerMedecin,
  getMedecinsTravail,
  tryPasserListeEmbaucheEnTraitement,
  notifierSmsVeilleListeEmbauche,
  notifierSmsJourJCandidatEmbauche,
} from '../../api/embaucheApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsVeilleBadge, SmsLigneBadge } from '../contreVisite/SmsContreVisiteBadges';
import { uiConfirm } from '../../utils/uiAlert';

/* ── API locale ── */
const getListesSoumises = () =>
  axiosInstance.get('/embauche/listes/soumises/').then(r =>
    Array.isArray(r.data) ? r.data : (r.data.results ?? []));

const getListeDetail = (id) =>
  axiosInstance.get(`/embauche/listes/${id}/`).then(r => r.data);

const getCandidats = (listeId) =>
  axiosInstance.get('/embauche/candidats/', { params: { liste: listeId } }).then(r =>
    Array.isArray(r.data) ? r.data : (r.data.results ?? []));

const setPresence = (candidatId, presence) =>
  axiosInstance.patch(`/embauche/candidats/${candidatId}/presence/`, { presence }).then(r => r.data);

const cloturerListe = (listeId) =>
  axiosInstance.patch(`/embauche/listes/${listeId}/cloturer/`).then(r => r.data);

/* ── helpers ── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR',
  { day:'numeric', month:'short', year:'numeric' }) : '—';

/* ── statuts ── */
const STATUT_CFG = {
  SOUMISE:       { bg:'#dbeafe', color:'#1d4ed8', text:'Soumise' },
  EN_TRAITEMENT: { bg:'#fef9c3', color:'#a16207', text:'En traitement' },
  CLOTUREE:      { bg:'#dcfce7', color:'#15803d', text:'Clôturée' },
};

const IcoClipboard = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3h8a2 2 0 0 1 2 2v2H6V5a2 2 0 0 1 2-2z" />
    <rect x="6" y="7" width="12" height="14" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);
const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoDoctor = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
  </svg>
);
const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
  </svg>
);
const IcoArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const IcoInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);
const IcoRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 0 1-7.07 3 9 9 0 0 1-9-9 8.93 8.93 0 0 1 .26-2" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 7.07-3 9 9 0 0 1 9 9 8.93 8.93 0 0 1-.26 2" />
  </svg>
);

/** Renvoi SMS jour J manuel (soumise / en traitement / clôturée). */
function embaucheListePermetSmsJourJManuel(statut) {
  return ['SOUMISE', 'EN_TRAITEMENT', 'CLOTUREE'].includes(statut);
}

/* ══ MODAL ASSIGNER MÉDECIN ══ */
function ModalMedecin({ listeId, currentMedecinId, onClose, onDone }) {
  const [medecins, setMedecins]   = useState([]);
  const [selected, setSelected]   = useState(currentMedecinId ? String(currentMedecinId) : '');
  const [loading,  setLoading]    = useState(false);
  const [loadMed,  setLoadMed]    = useState(true);
  const [err,      setErr]        = useState('');

  useEffect(() => {
    setLoadMed(true);
    getMedecinsTravail()
      .then(setMedecins)
      .catch(() => setMedecins([]))
      .finally(() => setLoadMed(false));
  }, []);

  const handleSave = async () => {
    if (!selected) { setErr('Veuillez sélectionner un médecin.'); return; }
    setLoading(true); setErr('');
    try {
      await assignerMedecin(listeId, Number(selected));
      onDone();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur lors de l\'assignation.');
    } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:16, width:440, maxWidth:'92vw',
          padding:24, boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#0c4a6e', marginBottom:16, display:'inline-flex', alignItems:'center', gap:8 }}>
          <IcoDoctor /> Assigner un médecin du travail
        </div>

        {err && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:12,
          padding:'8px 12px', borderRadius:8, marginBottom:12, border:'1px solid #fecaca' }}>{err}</div>}

        {loadMed ? (
          <div style={{ padding:'20px', textAlign:'center', color:'#0284c7', fontSize:13 }}>
            Chargement des médecins…
          </div>
        ) : medecins.length === 0 ? (
          <div style={{ padding:'16px', background:'#fffbeb', border:'1px solid #fde68a',
            borderRadius:10, color:'#a16207', fontSize:13, marginBottom:16, display:'inline-flex', alignItems:'center', gap:8 }}>
            <IcoWarn /> Aucun médecin du travail trouvé dans le système.
            <div style={{ fontSize:11, marginTop:6, color:'#92400e' }}>
              Vérifiez que des comptes médecin du travail sont créés dans l'administration.
            </div>
          </div>
        ) : (
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', borderRadius:9,
              border:'1.5px solid #e2e8f0', fontSize:13, marginBottom:16,
              background:'white', color:'#0f172a', outline:'none' }}>
            <option value="">— Choisir un médecin du travail —</option>
            {medecins.map(m => (
              <option key={m.id} value={String(m.id)}>
                Dr. {m.nom_complet}{m.specialite ? ` — ${m.specialite}` : ''}
              </option>
            ))}
          </select>
        )}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0',
              background:'white', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={loading || !selected || medecins.length === 0}
            style={{ padding:'8px 20px', borderRadius:8, border:'none',
              background: !selected || loading ? '#93c5fd' : '#0284c7',
              color:'white', cursor: !selected ? 'not-allowed' : 'pointer',
              fontSize:13, fontWeight:700, fontFamily:'inherit' }}>
            {loading ? '…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ DÉTAIL D'UNE LISTE ══ */
function DetailListe({ listeId, onBack, onNaviguerDossier }) {
  const [liste,     setListe]    = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [loadPres,  setLoadPres] = useState(null);
  const [clotLoad,  setClotLoad] = useState(false);
  const [showMed,   setShowMed]  = useState(false);
  const [msg,       setMsg]      = useState({ text:'', type:'warn' });
  const [veilleBusy, setVeilleBusy] = useState(false);
  const [jourJBusy, setJourJBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [det, cands] = await Promise.all([
        getListeDetail(listeId),
        getCandidats(listeId),
      ]);
      setListe(det);
      // Chaque liste a ses propres candidats — filtrage garanti par l'API
      setCandidats(cands);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [listeId]);

  useEffect(() => { load(); }, [load]);

  const handlePresence = async (candidat, valeur) => {
    if (candidat.presence === valeur || liste?.statut === 'CLOTUREE') return;
    setLoadPres(candidat.id);
    try {
      await setPresence(candidat.id, valeur);
      await load();
      setMsg({ text:'', type:'ok' });
    } catch (e) {
      setMsg({ text: e.response?.data?.error || 'Erreur.', type:'err' });
    } finally { setLoadPres(null); }
  };

  const handleCloturer = async () => {
    if (!liste.medecin_nom) {
      setMsg({ text:'Assignez un médecin du travail avant de clôturer.', type:'warn' });
      return;
    }
    const nonRens = candidats.filter(c => c.presence === 'NON_RENSEIGNEE').length;
    if (nonRens > 0) {
      const ok = await uiConfirm({
        title: 'Clôture',
        text: `Il y a ${nonRens} candidat(s) sans présence renseignée. Ils seront traités comme reportés. Continuer ?`,
        confirmButtonText: 'Continuer',
      });
      if (!ok) return;
    }
    {
      const ok = await uiConfirm({
        title: 'Clôture',
        text: 'Clôturer cette liste ? Action irréversible.',
        confirmButtonText: 'Clôturer',
      });
      if (!ok) return;
    }
    setClotLoad(true);
    try {
      if (liste.statut !== 'EN_TRAITEMENT') {
        try {
          await tryPasserListeEmbaucheEnTraitement(listeId);
          const det = await getListeDetail(listeId);
          setListe(det);
          if (det.statut !== 'EN_TRAITEMENT') {
            setMsg({
              text:
                `Impossible de clôturer : le serveur exige le statut « En traitement » (actuellement : ${det.statut ?? '—'}). ` +
                'Après les examens du médecin, la liste doit passer automatiquement en « En traitement » ; sinon vérifiez la configuration Django ou complétez les fiches.',
              type: 'warn',
            });
            setClotLoad(false);
            return;
          }
        } catch (e) {
          const hint = formatAxiosError(e);
          setMsg({
            text:
              `Passage en « En traitement » impossible${hint ? ` : ${hint}` : ''}. ` +
              'La clôture nécessite ce statut — vérifiez qu’une route backend existe (ex. demarrer_traitement) ou que le médecin a bien enregistré les fiches.',
            type: 'err',
          });
          setClotLoad(false);
          return;
        }
      }

      const res = await cloturerListe(listeId);
      await load();
      if (res?.nombre_reportes > 0 && res?.nouvelle_liste_reportee_id) {
        const ref = res.nouvelle_liste_reportee_reference || `#${res.nouvelle_liste_reportee_id}`;
        const rhCount = res.rh_notifies_count ?? 0;
        setMsg({
          text: `✓ Liste clôturée. ${res.nombre_reportes} candidat(s) reporté(s). Nouvelle liste reportée créée: ${ref}. RH notifiés: ${rhCount}.`,
          type: 'ok',
        });
      } else {
        setMsg({ text:'✓ Liste clôturée.', type:'ok' });
      }
    } catch (e) {
      setMsg({ text: formatAxiosError(e) || e.response?.data?.error || 'Erreur.', type:'err' });
    } finally { setClotLoad(false); }
  };

  const handleSmsVeilleListe = async () => {
    setVeilleBusy(true);
    try {
      const res = await notifierSmsVeilleListeEmbauche(listeId);
      await load();
      const n = Number(res?.sms_count);
      const extra = Number.isFinite(n) && n > 0 ? ` ${n} SMS envoyé${n > 1 ? 's' : ''}.` : '';
      await Swal.fire({
        icon: 'success',
        title: 'SMS veille',
        text: `Rappel veille traité.${extra}`,
        timer: 2600,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'SMS veille',
        text: formatAxiosError(e) || e?.message || 'Échec.',
      });
    } finally {
      setVeilleBusy(false);
    }
  };

  const handleSmsJourJCandidat = async (candidatId) => {
    setJourJBusy(candidatId);
    try {
      await notifierSmsJourJCandidatEmbauche(candidatId);
      await load();
      await Swal.fire({
        icon: 'success',
        title: 'SMS jour J',
        text: 'Notification traitée.',
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'SMS jour J',
        text: formatAxiosError(e) || e?.message || 'Échec.',
      });
    } finally {
      setJourJBusy(null);
    }
  };

  if (loading || !liste) return (
    <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
      <div style={{ width:28, height:28, border:'3px solid #bae6fd',
        borderTopColor:'#0284c7', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const showSmsJourJCol = embaucheListePermetSmsJourJManuel(liste.statut);

  const nbPresents = candidats.filter(c => c.presence === 'PRESENT').length;
  const nbAbsents  = candidats.filter(c => c.presence === 'ABSENT').length;
  const nbAttente  = candidats.filter(c =>
    c.presence === 'NON_RENSEIGNEE'
    || (c.presence === 'PRESENT' && !c.fiche_aptitude_id)
  ).length;
  const isCloturee = liste.statut === 'CLOTUREE';
  const canCloturer = !isCloturee && candidats.length > 0;
  const noMedecin = !liste.medecin_nom && !isCloturee;

  const ETAT_CFG = {
    EN_ATTENTE: { bg:'#f1f5f9', color:'#94a3b8', text:'En attente' },
    APTE:       { bg:'#dcfce7', color:'#15803d', text:'Apte ✓' },
    INAPTE:     { bg:'#fef2f2', color:'#b91c1c', text:'Inapte' },
  };

  const statCfg = STATUT_CFG[liste.statut] || { bg:'#f1f5f9', color:'#475569', text: liste.statut };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px',
        borderBottom:'1px solid rgba(2,132,199,.18)', flexShrink:0,
        background:'rgba(255,255,255,.7)', flexWrap:'wrap' }}>

        <button onClick={onBack}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
            background:'rgba(2,132,199,.1)', border:'none', borderRadius:8,
            cursor:'pointer', color:'#0c4a6e', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>
          ← Retour
        </button>

        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16, fontWeight:800, color:'#0c4a6e' }}>{liste.reference}</span>
            <span style={{ background:statCfg.bg, color:statCfg.color, fontSize:11,
              fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{statCfg.text}</span>
          </div>
          <div style={{ fontSize:12, color:'#0284c7', marginTop:2, display:'inline-flex', alignItems:'center', gap:6 }}>
            <IcoCalendar /> Visite : {fmtDate(liste.date_visite)}
          </div>
        </div>

        {/* Bouton assigner médecin — INFIRMIER */}
        {!isCloturee && (
          <button onClick={() => setShowMed(true)}
            style={{ padding:'7px 14px', borderRadius:9,
              border: liste.medecin_nom ? '1.5px solid #bae6fd' : '2px solid #f59e0b',
              background: liste.medecin_nom ? 'white' : '#fffbeb',
              color: liste.medecin_nom ? '#0284c7' : '#b45309',
              cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
            {liste.medecin_nom ? (<><IcoDoctor /> {liste.medecin_nom}</>) : (<><IcoWarn /> Assigner médecin</>)}
          </button>
        )}
        {liste.medecin_nom && isCloturee && (
          <span style={{ fontSize:12, color:'#0284c7', fontWeight:600, display:'inline-flex', alignItems:'center', gap:6 }}>
            <IcoDoctor /> {liste.medecin_nom}
          </span>
        )}

        {(['SOUMISE', 'EN_TRAITEMENT'].includes(liste.statut)) && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
            <SmsVeilleBadge liste={liste} />
            {!isSmsVeilleEnvoye(liste) && (
              <button
                type="button"
                onClick={handleSmsVeilleListe}
                disabled={veilleBusy}
                style={{
                  padding:'6px 12px', borderRadius:8, border:'1px solid #bbf7d0',
                  background: veilleBusy ? '#ecfdf5' : '#f0fdf4', color:'#15803d',
                  cursor: veilleBusy ? 'wait' : 'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap',
                }}
              >
                {veilleBusy ? '…' : 'SMS veille'}
              </button>
            )}
          </div>
        )}

        {/* Clôturer */}
        {canCloturer && (
          <button onClick={handleCloturer} disabled={clotLoad}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px',
              background:'#15803d', color:'white', border:'none', borderRadius:10,
              cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
            <IcoLock /> {clotLoad ? '…' : 'Clôturer la liste'}
          </button>
        )}
        {isCloturee && (
          <span style={{ fontSize:12, color:'#15803d', background:'#dcfce7',
            padding:'6px 12px', borderRadius:8, fontWeight:600 }}>
            ✓ Liste clôturée
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10,
        padding:'12px 20px', flexShrink:0 }}>
        {[
          { label:'Total',      val:candidats.length, color:'#0284c7', bg:'#e0f2fe' },
          { label:'Présents',   val:nbPresents,        color:'#15803d', bg:'#dcfce7' },
          { label:'Absents',    val:nbAbsents,         color:'#b91c1c', bg:'#fef2f2' },
          { label:'En attente', val:nbAttente,         color:'#a16207', bg:'#fef9c3' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'monospace', lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:11, color:s.color, opacity:.8, marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ margin:'0 20px 8px',
          background: msg.type==='err' ? '#fef2f2' : (msg.type==='ok' ? '#f0fdf4' : '#fef9c3'),
          border: `1px solid ${msg.type==='err' ? '#fecaca' : (msg.type==='ok' ? '#86efac' : '#fde68a')}`,
          color: msg.type==='err' ? '#b91c1c' : (msg.type==='ok' ? '#15803d' : '#a16207'),
          padding:'9px 14px', borderRadius:10, fontSize:13,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {msg.text}
          <button onClick={() => setMsg({ text:'', type:'warn' })}
            style={{ background:'none', border:'none', cursor:'pointer',
              color:'inherit', fontSize:18, fontFamily:'inherit' }}>×</button>
        </div>
      )}

      {/* Instructions */}
      {!isCloturee && noMedecin && (
        <div style={{ margin:'0 20px 6px', background:'#fffbeb',
          border:'1px solid #fde68a', color:'#b45309',
          padding:'9px 14px', borderRadius:10, fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6 }}>
          <IcoWarn /> Aucun médecin assigné — assignez un médecin avant de clôturer la liste.
        </div>
      )}
      {!isCloturee && (
        <div style={{ margin:'0 20px 10px', background:'#e0f2fe',
          border:'1px solid #bae6fd', color:'#0c4a6e',
          padding:'9px 14px', borderRadius:10, fontSize:12 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><IcoInfo /> Cochez <strong>Présent</strong> ou <strong>Absent</strong> pour chaque candidat.</span>
          <br />
          Quand tous sont renseignés, clôturez la liste.
        </div>
      )}

      {/* Table candidats — isolés par liste */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 20px 20px' }}>
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e0f2fe', overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:'#f0f9ff',
            borderBottom:'1px solid #e0f2fe', fontSize:11, fontWeight:700,
            color:'#0284c7', textTransform:'uppercase', letterSpacing:.5 }}>
            {candidats.length} candidat{candidats.length!==1?'s':''} — {liste.reference}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fbff', borderBottom:'1px solid #e0f2fe' }}>
                {(() => {
                  const h = ['#','Nom complet','Matricule','Fonction','Présence','Aptitude (médecin)'];
                  if (showSmsJourJCol) h.push('SMS file');
                  h.push('Actions');
                  return h.map(col => (
                    <th key={col} style={{ textAlign:'left', padding:'10px 14px', fontSize:10,
                      fontWeight:700, color:'#0284c7', textTransform:'uppercase',
                      letterSpacing:.5, whiteSpace:'nowrap' }}>{col}</th>
                  ));
                })()}
              </tr>
            </thead>
            <tbody>
              {candidats.length === 0 ? (
                <tr><td colSpan={showSmsJourJCol ? 8 : 7} style={{ textAlign:'center', padding:32,
                  color:'#94a3b8', fontSize:13 }}>
                  Aucun candidat dans cette liste.
                </td></tr>
              ) : candidats.map((c, i) => {
                const etatCfg = ETAT_CFG[c.etat_embauche] || ETAT_CFG.EN_ATTENTE;
                const isLoad  = loadPres === c.id;

                return (
                  <tr key={c.id}
                    style={{ borderBottom: i<candidats.length-1?'1px solid #f0f9ff':'none',
                      background: c.presence==='ABSENT' ? '#fffbeb' : 'white' }}>
                    <td style={{ padding:'11px 14px', color:'#94a3b8', fontSize:11 }}>{i+1}</td>
                    <td style={{ padding:'11px 14px', fontWeight:700, color:'#0c4a6e' }}>
                      {c.nom} {c.prenom}
                    </td>
                    <td style={{ padding:'11px 14px', fontFamily:'monospace', color:'#0284c7', fontSize:12 }}>
                      {c.matricule}
                    </td>
                    <td style={{ padding:'11px 14px', color:'#475569' }}>{c.poste||'—'}</td>

                    {/* Présence */}
                    <td style={{ padding:'11px 14px' }}>
                      {isCloturee ? (
                        <span style={{
                          background: c.presence==='PRESENT'?'#dcfce7':c.presence==='ABSENT'?'#fef2f2':'#f1f5f9',
                          color: c.presence==='PRESENT'?'#15803d':c.presence==='ABSENT'?'#b91c1c':'#94a3b8',
                          fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
                          {c.presence==='PRESENT'?'Présent ✓':c.presence==='ABSENT'?'Absent':'—'}
                        </span>
                      ) : (
                        <div style={{ display:'flex', gap:5 }}>
                          {[
                            { val:'PRESENT', label:'Présent', bg:'#15803d' },
                            { val:'ABSENT',  label:'Absent',  bg:'#b91c1c' },
                          ].map(opt => {
                            const isActive = c.presence === opt.val;
                            return (
                              <button key={opt.val}
                                onClick={() => handlePresence(c, opt.val)}
                                disabled={isLoad}
                                style={{ padding:'4px 10px', borderRadius:7, border:'none',
                                  background: isActive ? opt.bg : '#f1f5f9',
                                  color: isActive ? 'white' : '#64748b',
                                  cursor: isLoad ? 'wait' : 'pointer',
                                  fontSize:11, fontWeight:700, fontFamily:'inherit',
                                  opacity: isLoad ? .6 : 1, transition:'all .15s' }}>
                                {isLoad && isActive ? '…' : opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Aptitude (lecture seule infirmier) */}
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:etatCfg.bg, color:etatCfg.color,
                        fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
                        {etatCfg.text}
                      </span>
                    </td>

                    {showSmsJourJCol && (
                      <td style={{ padding:'11px 14px', verticalAlign:'top' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:5 }}>
                          <SmsLigneBadge ligne={c} />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSmsJourJCandidat(c.id); }}
                            disabled={jourJBusy === c.id}
                            style={{
                              padding:'4px 8px', borderRadius:7, border:'1px solid #bae6fd',
                              background: jourJBusy === c.id ? '#f0f9ff' : '#eff6ff', color:'#0369a1',
                              cursor: jourJBusy === c.id ? 'wait' : 'pointer', fontSize:10, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap',
                            }}
                          >
                            {jourJBusy === c.id ? '…' : 'Renvoyer SMS'}
                          </button>
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={() => onNaviguerDossier ? onNaviguerDossier(c) : null}
                        style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'white', cursor:onNaviguerDossier?'pointer':'not-allowed', color:'#0369a1', fontSize:12, fontWeight:700 }}>
                        Voir dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showMed && (
        <ModalMedecin
          listeId={liste.id}
          currentMedecinId={liste.medecin}
          onClose={() => setShowMed(false)}
          onDone={() => { setShowMed(false); load(); }}
        />
      )}
    </div>
  );
}

/* ══ VUE LISTE DES LISTES ══ */
function VueListes({ onSelect }) {
  const [listes,  setListes]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setListes(await getListesSoumises()); }
    catch { setListes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
      <div style={{ width:28, height:28, border:'3px solid #bae6fd',
        borderTopColor:'#0284c7', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(2,132,199,.18)',
        flexShrink:0, background:'rgba(255,255,255,.5)' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#0c4a6e' }}>
          Listes d'embauche reçues
        </div>
        <div style={{ fontSize:12, color:'#0284c7', marginTop:2 }}>
          {listes.length} liste{listes.length!==1?'s':''} en attente de traitement
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {listes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ width:40, height:40, margin:'0 auto 14px', color:'#0284c7' }}><IcoClipboard /></div>
            <div style={{ fontSize:15, fontWeight:700, color:'#0c4a6e', marginBottom:6 }}>
              Aucune liste reçue
            </div>
            <div style={{ fontSize:13, color:'#0284c7' }}>
              Les listes soumises par la RH apparaîtront ici.
            </div>
          </div>
        ) : listes.map(l => {
          const pct = l.nombre_candidats
            ? Math.round(((l.nombre_presents||0) / l.nombre_candidats) * 100) : 0;
          const cfg = STATUT_CFG[l.statut] || { bg:'#f1f5f9', color:'#475569', text: l.statut };

          return (
            <div key={l.id} onClick={() => onSelect(l.id)}
              style={{ background:'white', borderRadius:13, padding:'14px 16px',
                cursor:'pointer', transition:'all .15s',
                border:'2px solid transparent',
                boxShadow:'0 1px 4px rgba(0,0,0,.06)', marginBottom:10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#bae6fd'; e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'; }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:'#0c4a6e' }}>{l.reference}</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:'#0284c7', marginTop:2 }}><IcoCalendar />{fmtDate(l.date_visite)}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <span style={{ background:cfg.bg, color:cfg.color, fontSize:11,
                    fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{cfg.text}</span>
                  {isSmsVeilleEnvoye(l) && <SmsVeilleBadge liste={l} />}
                </div>
              </div>

              {l.medecin_nom ? (
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'#0284c7', marginBottom:8, fontWeight:600 }}>
                  <IcoDoctor /> Dr. {l.medecin_nom}
                </div>
              ) : (
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'#b45309', marginBottom:8,
                  background:'#fffbeb', padding:'3px 8px', borderRadius:6,
                  fontWeight:600, border:'1px solid #fde68a' }}>
                  <IcoWarn /> Médecin non assigné — à faire dans la liste
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11,
                color:'#475569', marginBottom:4 }}>
                <span>Présence renseignée</span>
                <span style={{ fontWeight:700, color: pct===100?'#15803d':'#0284c7' }}>{pct}%</span>
              </div>
              <div style={{ height:5, background:'#e0f2fe', borderRadius:4, marginBottom:10 }}>
                <div style={{ height:5, background: pct===100?'#22c55e':'#0284c7',
                  borderRadius:4, width:`${pct}%`, transition:'width .3s' }} />
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:12, fontSize:11, color:'#475569' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><IcoUsers />{l.nombre_candidats??0}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#15803d', fontWeight:600 }}><IcoCheck />{l.nombre_presents??0} présents</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#1d4ed8', fontWeight:600 }}><IcoStar />{l.nombre_aptes??0} aptes</span>
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#0284c7', fontWeight:700 }}>
                  Ouvrir <IcoArrowRight />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(2,132,199,.15)', flexShrink:0 }}>
        <button onClick={load}
          style={{ width:'100%', padding:'9px', borderRadius:10,
            border:'1.5px solid #bae6fd', background:'rgba(224,242,254,.5)',
            color:'#0284c7', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <IcoRefresh /> Actualiser
        </button>
      </div>
    </div>
  );
}

/* ══ COMPOSANT PRINCIPAL ══ */
export default function ListesEmbaucheInfirmier({ onNaviguerDossier } = {}) {
  const [selectedId, setSelectedId] = useState(null);

  if (selectedId)
    return <DetailListe listeId={selectedId} onBack={() => setSelectedId(null)} onNaviguerDossier={onNaviguerDossier} />;

  return <VueListes onSelect={setSelectedId} />;
}