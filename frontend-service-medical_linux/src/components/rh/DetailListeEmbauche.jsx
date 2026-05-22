// src/components/rh/DetailListeEmbauche.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import {
  getListeDetail, getCandidats, soumettreListe, exportListe,

  creerCollaborateur, changerStatutIntegration, syncDepuisIM,
  ajouterCandidatAPI, modifierCandidatAPI, supprimerCandidatAPI,
  rechercheIM, getDocumentsMedecin,
  notifierSmsVeilleListeEmbauche,
  notifierSmsJourJCandidatEmbauche,
} from '../../api/embaucheApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsVeilleBadge, SmsLigneBadge } from '../contreVisite/SmsContreVisiteBadges';
import {
  getFicheAptitude,
} from '../../api/Medicalworkapi';
import { printHTML } from '../../utils/printHelper';
import { pickCnssCollaborateur } from '../../utils/cnssEmbauche';
import { buildFicheAptitudePrintHtml } from '../../utils/fichePrintTemplate';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { uiAlert, uiConfirm } from '../../utils/uiAlert';

/** Enrichit une fiche embauche (collaborateur null) avec le candidat RH — même logique que VueEmbauche. */
function enrichFicheDepuisCandidatEmbauche(fiche, candidatData) {
  const ficheEnrichie = { ...fiche };
  if (!candidatData) return ficheEnrichie;
  const nom = candidatData.nom || candidatData.candidat?.nom || '';
  const prenom = candidatData.prenom || candidatData.candidat?.prenom || '';
  const matricule = candidatData.matricule || candidatData.candidat?.matricule || '';
  const imData = candidatData.im_data || candidatData.candidat?.im_data || {};
  if (!ficheEnrichie.collaborateur_nom && (nom || prenom)) {
    ficheEnrichie.collaborateur_nom = `${nom} ${prenom}`.trim();
  }
  if (!ficheEnrichie.collaborateur_matricule && matricule) {
    ficheEnrichie.collaborateur_matricule = matricule;
  }
  if (!String(ficheEnrichie.collaborateur_cnss || '').trim()) {
    ficheEnrichie.collaborateur_cnss = pickCnssCollaborateur(candidatData, ficheEnrichie);
  }
  if (!ficheEnrichie.collaborateur_adresse) {
    const adresseIm = (imData.adresse || '').trim()
      || [imData.adr_ville, imData.adr_gouv].filter(Boolean).join(' - ');
    ficheEnrichie.collaborateur_adresse = adresseIm || candidatData.gouvernorat || '';
  }
  if (!ficheEnrichie.collaborateur_lieu_naissance) {
    ficheEnrichie.collaborateur_lieu_naissance = imData.lieu_naissance || '';
  }
  if (!ficheEnrichie.collaborateur_date_naissance) {
    ficheEnrichie.collaborateur_date_naissance =
      imData.date_naissance || candidatData.date_naissance || '';
  }
  if (!ficheEnrichie.collaborateur_poste) {
    ficheEnrichie.collaborateur_poste = imData.fonction || candidatData.poste || '';
  }
  if (!ficheEnrichie.collaborateur_date_recrutement) {
    ficheEnrichie.collaborateur_date_recrutement =
      imData.date_embauche || candidatData.date_recrutement || '';
  }
  if (!ficheEnrichie.collaborateur_telephone && candidatData.telephone) {
    ficheEnrichie.collaborateur_telephone = candidatData.telephone;
  }
  if (!ficheEnrichie.collaborateur_cin && candidatData.cin) {
    ficheEnrichie.collaborateur_cin = candidatData.cin;
  }
  return ficheEnrichie;
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';

const IcoBack     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoDownload = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoSend     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoSync     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoEdit     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IcoPlus     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoCheck    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoUser     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoWarn     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoSearch   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoDocteur  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;

const inp = { width:'100%', padding:'7px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:12, color:'#0f172a', background:'white', outline:'none', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:3 };

// Objet vide complet — tous les champs du CandidatRHUpdateSerializer
const VIDE = {
  nom:'', prenom:'', matricule:'', cin:'', date_naissance:'', genre:'',
  telephone:'', gouvernorat:'', niveau:'', poste:'', department:'',
  projet:'', date_recrutement:'', centre_cout:'', source_information:'',
  formation:'', num_demande:'', ps:'', cnss:'',
};

const STATUT_CFG = { BROUILLON:{bg:'#f1f5f9',color:'#475569',text:'Brouillon'}, SOUMISE:{bg:'#dbeafe',color:'#1d4ed8',text:'Soumise'}, EN_TRAITEMENT:{bg:'#fef9c3',color:'#a16207',text:'En traitement'}, CLOTUREE:{bg:'#dcfce7',color:'#15803d',text:'Clôturée'} };

/** Renvoi SMS jour J manuel (aligné VP : soumise, en traitement, clôturée — pas brouillon). */
function embaucheListePermetSmsJourJManuel(statut) {
  return ['SOUMISE', 'EN_TRAITEMENT', 'CLOTUREE'].includes(statut);
}
const StatutBadge = ({ statut }) => { const c=STATUT_CFG[statut]||{bg:'#f1f5f9',color:'#475569',text:statut}; return <span style={{background:c.bg,color:c.color,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20}}>{c.text}</span>; };
const ETAT_CFG = { EN_ATTENTE:{bg:'#f1f5f9',color:'#94a3b8',text:'En attente'}, APTE:{bg:'#dcfce7',color:'#15803d',text:'Apte'}, INAPTE:{bg:'#fef2f2',color:'#b91c1c',text:'Inapte'} };
const EtatBadge = ({ val }) => { const c=ETAT_CFG[val]||ETAT_CFG.EN_ATTENTE; return <span style={{background:c.bg,color:c.color,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20}}>{c.text}</span>; };
const INTEG_CFG = { EN_ATTENTE_VISITE:{bg:'#f1f5f9',color:'#64748b',text:'En attente visite'}, EN_FORMATION:{bg:'#fef9c3',color:'#a16207',text:'En formation'}, INTEGRE:{bg:'#dcfce7',color:'#15803d',text:'Intégré ✓'}, NON_RETENU:{bg:'#fef2f2',color:'#b91c1c',text:'Non retenu'} };
const IntegBadge = ({ val }) => { const c=INTEG_CFG[val]||INTEG_CFG.EN_ATTENTE_VISITE; return <span style={{background:c.bg,color:c.color,fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>{c.text}</span>; };
const DocBadge = ({ val }) => {
  const status = String(val || '').toUpperCase();
  const map = {
    APTE: { bg: '#dcfce7', color: '#15803d', text: 'Apte' },
    INAPTE: { bg: '#fee2e2', color: '#b91c1c', text: 'Inapte' },
    EN_ATTENTE: { bg: '#f1f5f9', color: '#64748b', text: 'En attente' },
  };
  const c = map[status] || map.EN_ATTENTE;
  return <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{c.text}</span>;
};

// Transitions autorisées par le backend
const TRANSITIONS_INTEGRATION = {
  EN_ATTENTE_VISITE: ['INTEGRE', 'NON_RETENU'],
  EN_FORMATION:      ['INTEGRE', 'NON_RETENU'],
  INTEGRE:           [],
  NON_RETENU:        [],
};

/* ── Modal édition candidat (RH) ── */
function ModalEdit({ candidat, onClose, onSave }) {
  const [form, setForm] = useState({
    nom: candidat?.nom||'', prenom: candidat?.prenom||'', matricule: candidat?.matricule||'',
    cin: candidat?.cin||'', date_naissance: candidat?.date_naissance||'', genre: candidat?.genre||'',
    telephone: candidat?.telephone||'', gouvernorat: candidat?.gouvernorat||'',
    poste: candidat?.poste||'', department: candidat?.department||'', projet: candidat?.projet||'',
    date_recrutement: candidat?.date_recrutement||'', niveau: candidat?.niveau||'',
    centre_cout: candidat?.centre_cout||'', source_information: candidat?.source_information||'',
    formation: candidat?.formation||'', num_demande: candidat?.num_demande||'', ps: candidat?.ps||'',
    cnss: candidat?.numero_cnss || candidat?.cnss || '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [imLoading, setImLoading] = useState(false);
  const [imMsg, setImMsg] = useState('');
  const [lastAutoMatricule, setLastAutoMatricule] = useState('');
  const normalizeGenre = (v) => {
    const g = String(v || '').toLowerCase();
    if (g === 'm' || g === 'male' || g === 'homme') return 'homme';
    if (g === 'f' || g === 'female' || g === 'femme') return 'femme';
    return '';
  };
  const set = (f) => (e) => setForm(p=>({...p,[f]:e.target.value}));

  // Recherche IM pour pré-remplir depuis le système RH
  const handleRechercheIM = async (opts = {}) => {
    const { silent = false } = opts;
    if (!form.matricule.trim()) {
      if (!silent) setImMsg('Matricule requis pour rechercher.');
      return;
    }
    setImLoading(true); setImMsg('');
    try {
      const res = await rechercheIM(form.matricule.trim());
      if (res.warning) { if (!silent) setImMsg(`⚠ ${res.warning}`); return; }
      if (res.data) {
        const d = res.data;
        const genre = normalizeGenre(d.genre || d.sexe);
        setForm(p => ({
          ...p,
          nom:              d.nom              || p.nom,
          prenom:           d.prenom           || p.prenom,
          cin:              d.cin              || p.cin,
          date_naissance:   d.date_naissance   || p.date_naissance,
          genre:            genre || p.genre,
          telephone:        d.telephone        || p.telephone,
          gouvernorat:      d.gouvernorat || d.gouvernerat || p.gouvernorat,
          poste:            d.poste || d.fonction || p.poste,
          department:       d.department       || p.department,
          projet:           d.projet           || p.projet,
          date_recrutement: d.date_embauche    || p.date_recrutement,
          centre_cout:      d.centre_cout      || p.centre_cout,
          niveau:           d.niveau           || p.niveau,
          formation:        d.formation        || p.formation,
          num_demande:      d.num_demande      || p.num_demande,
          ps:               d.ps               || p.ps,
          cnss:             d.cnss             || d.numero_cnss || p.cnss,
          source_information: d.source_information || p.source_information,
        }));
        if (!silent) setImMsg('✓ Données mises à jour depuis le système RH.');
      }
    } catch (e) {
      if (!silent) setImMsg(formatAxiosError(e));
    } finally { setImLoading(false); }
  };

  const handleMatriculeBlur = async () => {
    const mat = form.matricule.trim();
    if (!mat || mat.length < 5 || mat === lastAutoMatricule) return;
    await handleRechercheIM({ silent: true });
    setLastAutoMatricule(mat);
  };

  const handleSave = async () => {
    if (!form.nom.trim()||!form.prenom.trim()||!form.matricule.trim()) { setErr('Nom, prénom et matricule obligatoires.'); return; }
    setLoading(true); setErr('');
    try {
      const payload = { ...form, numero_cnss: form.cnss };
      const r = await modifierCandidatAPI(candidat.id, payload);
      onSave(r);
    } catch(e) { setErr(e.response?.data?.error || JSON.stringify(e.response?.data) || 'Erreur serveur.'); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,overflowY:'auto',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'white',borderRadius:16,width:700,maxWidth:'96vw',padding:24,boxShadow:'0 20px 60px rgba(0,0,0,.2)',maxHeight:'92vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>Modifier — {candidat.nom} {candidat.prenom}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:'#94a3b8',lineHeight:1}}>×</button>
        </div>

        {/* Recherche IM */}
        <div style={{background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:10,padding:'12px 16px',marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#0369a1',marginBottom:8}}>🔍 Synchroniser depuis le système RH (im_db)</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{flex:1,fontSize:12,color:'#475569'}}>Matricule : <strong>{form.matricule||'—'}</strong></div>
            <button onClick={handleRechercheIM} disabled={imLoading||!form.matricule.trim()}
              style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:'1.5px solid #7dd3fc',background:'white',color:'#0369a1',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap'}}>
              <IcoSearch/>{imLoading?'Recherche…':'Vérifier dans RH'}
            </button>
          </div>
          {imMsg && (
            <div style={{marginTop:8,fontSize:12,color:imMsg.startsWith('✓')?'#15803d':imMsg.startsWith('⚠')?'#c2410c':'#b91c1c',background:imMsg.startsWith('✓')?'#f0fdf4':imMsg.startsWith('⚠')?'#fff7ed':'#fef2f2',padding:'6px 10px',borderRadius:7}}>
              {imMsg}
            </div>
          )}
        </div>

        {err && <div style={{display:'flex',alignItems:'center',gap:7,background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',padding:'9px 12px',borderRadius:9,fontSize:12,marginBottom:12}}><IcoWarn/> {err}</div>}

        {/* Identité */}
        <div style={{fontSize:11,fontWeight:800,color:'#1d4ed8',textTransform:'uppercase',letterSpacing:.8,marginBottom:10,paddingBottom:6,borderBottom:'2px solid #eff6ff'}}>Identité</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={lbl}>Nom *</label><input value={form.nom} onChange={set('nom')} style={inp}/></div>
          <div><label style={lbl}>Prénom *</label><input value={form.prenom} onChange={set('prenom')} style={inp}/></div>
          <div><label style={lbl}>Matricule *</label><input value={form.matricule} onChange={set('matricule')} onBlur={handleMatriculeBlur} style={inp}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={lbl}>CIN</label><input value={form.cin} onChange={set('cin')} style={inp}/></div>
          <div><label style={lbl}>Date naissance</label><input type="date" value={form.date_naissance} onChange={set('date_naissance')} style={inp}/></div>
          <div><label style={lbl}>Genre</label><select value={form.genre} onChange={set('genre')} style={inp}><option value="">—</option><option value="homme">Homme</option><option value="femme">Femme</option></select></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={set('telephone')} style={inp}/></div>
          <div><label style={lbl}>Gouvernorat</label><input value={form.gouvernorat} onChange={set('gouvernorat')} style={inp}/></div>
        </div>

        {/* Informations RH */}
        <div style={{fontSize:11,fontWeight:800,color:'#1d4ed8',textTransform:'uppercase',letterSpacing:.8,marginBottom:10,paddingBottom:6,borderBottom:'2px solid #eff6ff'}}>Informations RH</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={lbl}>Fonction</label><input value={form.poste} onChange={set('poste')} style={inp}/></div>
          <div><label style={lbl}>Département</label><input value={form.department} onChange={set('department')} style={inp}/></div>
          <div><label style={lbl}>Projet</label><input value={form.projet} onChange={set('projet')} style={inp}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={lbl}>Date recrutement</label><input type="date" value={form.date_recrutement} onChange={set('date_recrutement')} style={inp}/></div>
          <div><label style={lbl}>Niveau</label><input value={form.niveau} onChange={set('niveau')} style={inp}/></div>
          <div><label style={lbl}>Centre de coût</label><input value={form.centre_cout} onChange={set('centre_cout')} style={inp}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:18}}>
          <div><label style={lbl}>Num. demande</label><input value={form.num_demande} onChange={set('num_demande')} style={inp}/></div>
          <div><label style={lbl}>N° CNSS</label><input value={form.cnss} onChange={set('cnss')} placeholder="Numéro CNSS" style={inp}/></div>
          <div><label style={lbl}>Source information</label><input value={form.source_information} onChange={set('source_information')} style={inp}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10,marginBottom:18}}>
          <div><label style={lbl}>Formation</label><input value={form.formation} onChange={set('formation')} style={inp}/></div>
        </div>

        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'9px 20px',borderRadius:9,border:'1.5px solid #e2e8f0',background:'white',cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'inherit',color:'#475569'}}>Annuler</button>
          <button onClick={handleSave} disabled={loading} style={{padding:'9px 22px',borderRadius:9,border:'none',background:loading?'#93c5fd':'#1d4ed8',color:'white',cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>
            {loading?'Sauvegarde…':'✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Onglet modification ── */
function OngletModification({ liste, candidats, statut, onRefresh, onSmsJourJ, jourJBusyId }) {
  const listeId = liste?.id;
  const [editC,    setEditC]    = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [addLoad,  setAddLoad]  = useState(false);
  const [addErr,   setAddErr]   = useState('');
  const [newF,     setNewF]     = useState({...VIDE});
  const [msg,      setMsg]      = useState('');
  const [imMsg,    setImMsg]    = useState('');
  const [imLoad,   setImLoad]   = useState(false);
  const [lastAutoMatricule, setLastAutoMatricule] = useState('');
  const normalizeGenre = (v) => {
    const g = String(v || '').toLowerCase();
    if (g === 'm' || g === 'male' || g === 'homme') return 'homme';
    if (g === 'f' || g === 'female' || g === 'femme') return 'femme';
    return '';
  };
  const isEditable = statut === 'BROUILLON';
  const showSmsCol = embaucheListePermetSmsJourJManuel(statut);
  const setN = (f) => (e) => setNewF(p=>({...p,[f]:e.target.value}));

  // Recherche IM pour le formulaire d'ajout
  const handleRechercheIMAdd = async (opts = {}) => {
    const { silent = false } = opts;
    if (!newF.matricule.trim()) {
      if (!silent) setImMsg('Saisissez le matricule d\'abord.');
      return;
    }
    setImLoad(true); setImMsg('');
    try {
      const res = await rechercheIM(newF.matricule.trim());
      if (res.warning && !silent) { setImMsg(`⚠ ${res.warning}`); }
      if (res.data) {
        const d = res.data;
        const genre = normalizeGenre(d.genre || d.sexe);
        setNewF(p => ({
          ...p,
          nom:              d.nom              || p.nom,
          prenom:           d.prenom           || p.prenom,
          cin:              d.cin              || p.cin,
          date_naissance:   d.date_naissance   || p.date_naissance,
          genre:            genre || p.genre,
          telephone:        d.telephone        || p.telephone,
          gouvernorat:      d.gouvernorat || d.gouvernerat || p.gouvernorat,
          poste:            d.poste || d.fonction || p.poste,
          department:       d.department       || p.department,
          projet:           d.projet           || p.projet,
          date_recrutement: d.date_embauche    || p.date_recrutement,
          centre_cout:      d.centre_cout      || p.centre_cout,
          niveau:           d.niveau           || p.niveau,
          formation:        d.formation        || p.formation,
          num_demande:      d.num_demande      || p.num_demande,
          ps:               d.ps               || p.ps,
          cnss:             d.cnss             || d.numero_cnss || p.cnss,
          source_information: d.source_information || p.source_information,
        }));
        if (!silent && !res.warning) setImMsg('✓ Données pré-remplies depuis le système RH.');
      }
    } catch (e) {
      if (!silent) setImMsg(formatAxiosError(e));
    } finally { setImLoad(false); }
  };

  const handleAddMatriculeBlur = async () => {
    const mat = newF.matricule.trim();
    if (!mat || mat.length < 5 || mat === lastAutoMatricule) return;
    await handleRechercheIMAdd({ silent: true });
    setLastAutoMatricule(mat);
  };

  const handleDelete = async (c) => {
    const ok = await uiConfirm({
      title: 'Suppression',
      text: `Supprimer ${c.nom} ${c.prenom} ?`,
      confirmButtonText: 'Supprimer',
    });
    if (!ok) return;
    setDeleting(c.id);
    try {
      await supprimerCandidatAPI(c.id);
      setMsg(`✓ ${c.nom} ${c.prenom} supprimé.`);
      onRefresh();
    } catch(e) { setMsg(`Erreur : ${e.response?.data?.error||'impossible de supprimer.'}`); }
    finally { setDeleting(null); }
  };

  const handleAddSave = async () => {
    if (!newF.nom.trim()||!newF.prenom.trim()||!newF.matricule.trim()) { setAddErr('Nom, prénom et matricule obligatoires.'); return; }
    setAddLoad(true); setAddErr('');
    try {
      await ajouterCandidatAPI({ ...newF, liste_id: listeId });
      setNewF({...VIDE}); setShowAdd(false);
      setMsg(`✓ ${newF.nom} ${newF.prenom} ajouté.`);
      onRefresh();
    } catch(e) { setAddErr(e.response?.data?.error||'Erreur lors de l\'ajout.'); }
    finally { setAddLoad(false); }
  };

  return (
    <div>
      {msg && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:msg.startsWith('✓')?'#f0fdf4':'#fef2f2',border:`1px solid ${msg.startsWith('✓')?'#86efac':'#fecaca'}`,color:msg.startsWith('✓')?'#15803d':'#b91c1c',padding:'10px 16px',borderRadius:10,marginBottom:14,fontSize:13}}>
          {msg}<button onClick={()=>setMsg('')} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:18,fontFamily:'inherit'}}>×</button>
        </div>
      )}
      {!isEditable && (
        <div style={{display:'flex',alignItems:'center',gap:8,background:'#fffbeb',border:'1px solid #fde68a',color:'#a16207',padding:'10px 16px',borderRadius:10,marginBottom:14,fontSize:13}}>
          <IcoWarn/> La liste est <strong style={{margin:'0 4px'}}>{statut}</strong> — modifications uniquement en statut <strong>Brouillon</strong>.
        </div>
      )}
      {isEditable && (
        <button onClick={()=>setShowAdd(s=>!s)} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:10,border:showAdd?'1.5px solid #1d4ed8':'2px dashed #e2e8f0',background:showAdd?'#eff6ff':'#f8fafc',color:showAdd?'#1d4ed8':'#475569',cursor:'pointer',fontSize:13,fontWeight:700,marginBottom:14,fontFamily:'inherit'}}>
          {showAdd ? '▲ Fermer' : <><IcoPlus/> Ajouter un candidat</>}
        </button>
      )}

      {/* Formulaire d'ajout — avec recherche IM */}
      {showAdd && isEditable && (
        <div style={{background:'#f8fafc',borderRadius:12,border:'1.5px solid #dbeafe',padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1d4ed8',marginBottom:12}}>Nouveau candidat</div>
          {addErr && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',fontSize:12,padding:'8px 12px',borderRadius:8,marginBottom:10}}>{addErr}</div>}

          {/* Matricule + recherche IM */}
          <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:8}}>
            <div style={{flex:'0 0 220px'}}>
              <label style={lbl}>Matricule *</label>
              <input value={newF.matricule} onChange={setN('matricule')} onBlur={handleAddMatriculeBlur} placeholder="50234567890" style={inp}/>
            </div>
            <button onClick={handleRechercheIMAdd} disabled={imLoad||!newF.matricule.trim()}
              style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,border:'1.5px solid #dbeafe',background:'#eff6ff',color:'#1d4ed8',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
              <IcoSearch/>{imLoad?'…':'Vérifier dans RH'}
            </button>
          </div>
          {imMsg && (
            <div style={{fontSize:12,color:imMsg.startsWith('✓')?'#15803d':imMsg.startsWith('⚠')?'#c2410c':'#b91c1c',background:imMsg.startsWith('✓')?'#f0fdf4':imMsg.startsWith('⚠')?'#fff7ed':'#fef2f2',padding:'6px 10px',borderRadius:7,marginBottom:9}}>
              {imMsg}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:9}}>
            <div><label style={lbl}>Nom *</label><input value={newF.nom} onChange={setN('nom')} placeholder="AKERMI" style={inp}/></div>
            <div><label style={lbl}>Prénom *</label><input value={newF.prenom} onChange={setN('prenom')} placeholder="Houcem" style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:9,marginBottom:9}}>
            <div><label style={lbl}>CIN</label><input value={newF.cin} onChange={setN('cin')} style={inp}/></div>
            <div><label style={lbl}>Fonction</label><input value={newF.poste} onChange={setN('poste')} placeholder="Technicien" style={inp}/></div>
            <div><label style={lbl}>Projet</label><input value={newF.projet} onChange={setN('projet')} style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:9,marginBottom:9}}>
            <div><label style={lbl}>Département</label><input value={newF.department} onChange={setN('department')} style={inp}/></div>
            <div><label style={lbl}>Date recrutement</label><input type="date" value={newF.date_recrutement} onChange={setN('date_recrutement')} style={inp}/></div>
            <div><label style={lbl}>Téléphone</label><input value={newF.telephone} onChange={setN('telephone')} style={inp}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:9,marginBottom:14}}>
            <div><label style={lbl}>Num. demande</label><input value={newF.num_demande} onChange={setN('num_demande')} style={inp}/></div>
            <div><label style={lbl}>N° CNSS</label><input value={newF.cnss} onChange={setN('cnss')} placeholder="Numéro CNSS" style={inp}/></div>
            <div><label style={lbl}>Centre de coût</label><input value={newF.centre_cout} onChange={setN('centre_cout')} style={inp}/></div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button onClick={()=>{setShowAdd(false);setNewF({...VIDE});setAddErr('');setImMsg('');}} style={{padding:'8px 16px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:12,fontWeight:600,color:'#475569',fontFamily:'inherit'}}>Annuler</button>
            <button onClick={handleAddSave} disabled={addLoad} style={{padding:'8px 16px',borderRadius:8,border:'none',background:addLoad?'#93c5fd':'#1d4ed8',color:'white',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
              {addLoad?'…':<><IcoCheck/>Ajouter</>}
            </button>
          </div>
        </div>
      )}

      {/* Tableau candidats */}
      <div style={{background:'white',borderRadius:12,border:'1px solid #f1f5f9',overflow:'hidden'}}>
        <div style={{padding:'11px 16px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,fontWeight:700,color:'#475569'}}>{candidats.length} candidat{candidats.length!==1?'s':''}</span>
          {isEditable && <span style={{fontSize:11,color:'#94a3b8'}}>✎ modifier · 🗑 supprimer</span>}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#f8fafc',borderBottom:'1px solid #f1f5f9'}}>
                {(() => {
                  const h = ['#','Nom complet','Matricule','Fonction','Projet','Num. dem.','N° CNSS','Date recrut.'];
                  if (showSmsCol) h.push('SMS jour J');
                  if (isEditable) h.push('Actions');
                  return h.map(col => (
                    <th key={col} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{col}</th>
                  ));
                })()}
              </tr>
            </thead>
            <tbody>
              {candidats.length===0?(
                <tr><td colSpan={(showSmsCol?1:0)+(isEditable?1:0)+8} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:13}}>Aucun candidat — ajoutez-en un ci-dessus.</td></tr>
              ):candidats.map((c,i)=>(
                <tr key={c.id} style={{borderBottom:i<candidats.length-1?'1px solid #f8fafc':'none'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 12px',color:'#94a3b8',fontFamily:'monospace'}}>{i+1}</td>
                  <td style={{padding:'10px 12px',fontWeight:600,color:'#0f172a'}}>{c.nom} {c.prenom}</td>
                  <td style={{padding:'10px 12px',fontFamily:'monospace',color:'#475569',fontSize:11}}>{c.matricule}</td>
                  <td style={{padding:'10px 12px',color:'#475569'}}>{c.poste||'—'}</td>
                  <td style={{padding:'10px 12px',color:'#475569'}}>{c.projet||'—'}</td>
                  <td style={{padding:'10px 12px',color:'#475569'}}>{c.num_demande||'—'}</td>
                  <td style={{padding:'10px 12px',color:'#475569'}}>{c.numero_cnss || c.cnss || '—'}</td>
                  <td style={{padding:'10px 12px',color:'#475569'}}>{c.date_recrutement?new Date(c.date_recrutement).toLocaleDateString('fr-FR'):'—'}</td>
                  {showSmsCol && (
                    <td style={{padding:'10px 12px',verticalAlign:'top'}}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:5}}>
                        <SmsLigneBadge ligne={c} />
                        <button
                          type="button"
                          onClick={() => onSmsJourJ(c.id)}
                          disabled={jourJBusyId === c.id}
                          style={{
                            padding:'4px 8px',borderRadius:7,border:'1px solid #bae6fd',background:jourJBusyId===c.id?'#f0f9ff':'#eff6ff',
                            color:'#0369a1',cursor:jourJBusyId===c.id?'wait':'pointer',fontSize:10,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap',
                          }}
                        >
                          {jourJBusyId === c.id ? '…' : 'Renvoyer SMS'}
                        </button>
                      </div>
                    </td>
                  )}
                  {isEditable&&(
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>setEditC(c)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'1.5px solid #dbeafe',background:'#eff6ff',color:'#1d4ed8',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                          <IcoEdit/> Modifier
                        </button>
                        <button onClick={()=>handleDelete(c)} disabled={deleting===c.id} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'1px solid #fecaca',background:'#fef2f2',color:'#b91c1c',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                          {deleting===c.id?'…':<><IcoTrash/>Supprimer</>}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editC && <ModalEdit candidat={editC} onClose={()=>setEditC(null)} onSave={()=>{setEditC(null);setMsg('✓ Candidat modifié.');onRefresh();}}/>}
    </div>
  );
}

/* ── Actions suivi intégration ── */
function ActionsCandidatRow({ candidat, listeCloturee, onRefresh }) {
  const [loading,    setLoading]    = useState(null);
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState('error'); // 'error' | 'success' | 'info'
  const [syncDetail, setSyncDetail] = useState(null);

  const run = async (action, fn) => {
    setLoading(action); setMsg(''); setSyncDetail(null); setMsgType('error');
    try {
      const res = await fn();
      if (action === 'creer') {
        // Afficher si créé dans im_db ou non
        if (res?.cree_dans_im_db === false) {
          setMsg('⚠ Collaborateur créé dans medical_db uniquement. L’insertion dans im_db (table ressource) a échoué côté serveur.');
          setMsgType('info');
        } else {
          setMsg('✓ Collaborateur créé avec succès dans les deux bases (medical_db + im_db).');
          setMsgType('success');
        }
      }
      if (action === 'sync' && res?.champs_collaborateur_mis_a_jour) {
        setSyncDetail(res.champs_collaborateur_mis_a_jour);
        setMsg('✓ Synchronisation réussie.');
        setMsgType('success');
      }
      onRefresh();
    } catch(e) {
      const backendMsg =
        e.response?.data?.error ||
        e.response?.data?.detail ||
        (typeof e.response?.data === 'string' ? e.response.data : '');
      setMsg(backendMsg || 'Erreur');
      setMsgType('error');
    }
    finally { setLoading(null); }
  };

  const current = candidat.statut_integration;
  const transitions = TRANSITIONS_INTEGRATION[current] || [];

  // Conditions pour créer collaborateur (toutes doivent être vraies)
  const canCollab = listeCloturee
    && candidat.presence === 'PRESENT'
    && candidat.etat_embauche === 'APTE'
    && !candidat.collaborateur;

  // Sync IM disponible si collaborateur créé et pas encore INTEGRE
  const canSync = candidat.collaborateur && candidat.statut_integration !== 'INTEGRE';

  // Peut passer à NON_RETENU ?
  const canNR = transitions.includes('NON_RETENU');

  // Afficher raison si bouton créer collab absent
  let collabRaison = '';
  if (!canCollab && !candidat.collaborateur) {
    if (!listeCloturee)                         collabRaison = 'Liste non clôturée';
    else if (candidat.presence !== 'PRESENT')   collabRaison = 'Absent (reporté)';
    else if (candidat.etat_embauche !== 'APTE') collabRaison = 'Non apte';
  }

  const msgBg    = msgType==='success'?'#f0fdf4':msgType==='info'?'#fff7ed':'#fef2f2';
  const msgColor = msgType==='success'?'#15803d':msgType==='info'?'#c2410c':'#b91c1c';
  const msgBd    = msgType==='success'?'#86efac':msgType==='info'?'#fed7aa':'#fecaca';

  return (
    <div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
        {canCollab && (
          <button onClick={()=>run('creer',()=>creerCollaborateur(candidat.id))} disabled={loading==='creer'}
            style={{padding:'4px 9px',borderRadius:7,border:'none',background:'#1d4ed8',color:'white',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
            <IcoUser/>{loading==='creer'?'Création…':'Créer collaborateur'}
          </button>
        )}
        {collabRaison && (
          <span style={{fontSize:10,color:'#94a3b8',fontStyle:'italic'}}>{collabRaison}</span>
        )}
        {canSync && (
          <button onClick={()=>run('sync',()=>syncDepuisIM(candidat.id))} disabled={loading==='sync'}
            style={{padding:'4px 9px',borderRadius:7,border:'none',background:'#6d28d9',color:'white',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>
            <IcoSync/>{loading==='sync'?'…':'Sync IM'}
          </button>
        )}
        {canNR && (
          <button onClick={()=>run('nr',()=>changerStatutIntegration(candidat.id,'NON_RETENU'))} disabled={loading==='nr'}
            style={{padding:'4px 9px',borderRadius:7,border:'1px solid #fecaca',background:'#fef2f2',color:'#b91c1c',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
            {loading==='nr'?'…':'Non retenu'}
          </button>
        )}
      </div>
      {msg && (
        <div style={{marginTop:5,fontSize:11,color:msgColor,background:msgBg,border:`1px solid ${msgBd}`,padding:'5px 9px',borderRadius:6}}>
          {msg}
        </div>
      )}
      {syncDetail && syncDetail.length > 0 && (
        <div style={{marginTop:4,fontSize:11,color:'#6d28d9',background:'#f5f3ff',padding:'4px 8px',borderRadius:6}}>
          Champs synchronisés : {syncDetail.join(', ')}
        </div>
      )}
    </div>
  );
}



/* ── COMPOSANT PRINCIPAL ── */
export default function DetailListeEmbauche({ listeInit, onBack, onGoToListe }) {
  const { user } = useAuth();
  const [liste,           setListe]           = useState(listeInit);
  const [candidats,       setCandidats]       = useState([]);
  const [loading,         setLoading]         = useState(true);

  const [printingFiche,   setPrintingFiche]   = useState(null); // ficheId en cours
  const [submitting,      setSubmitting]      = useState(false);
  const [exportLoad,      setExportLoad]      = useState(false);
  const [veilleBusy,      setVeilleBusy]      = useState(false);
  const [jourJBusy,       setJourJBusy]       = useState(null);
  const [tab,             setTab]             = useState('candidats');
  const [docsMedecin,     setDocsMedecin]     = useState([]);
  const [docsLoading,     setDocsLoading]     = useState(false);
  const [docsErr,         setDocsErr]         = useState('');
  // Résultat de clôture — liste reportée générée automatiquement par le backend
  const [listeReporteeId, setListeReporteeId] = useState(null);
  const [listeReporteeRef, setListeReporteeRef] = useState('');
  const [rhNotifiesCount, setRhNotifiesCount] = useState(null);
  const [nbReportes,      setNbReportes]      = useState(0);

  // Impression : fiche aptitude uniquement (RH ne doit pas voir bilan/examen)
  const imprimerFiche = async (ficheId, candidatData) => {
    if (printingFiche === ficheId) return;
    setPrintingFiche(ficheId);
    try {
      const ficheRaw = await getFicheAptitude(ficheId);
      const ficheEnrichie = enrichFicheDepuisCandidatEmbauche(ficheRaw, candidatData);
      const printCfg = getSitePrintConfig(ficheEnrichie, user);
      const html = buildFicheAptitudePrintHtml(ficheEnrichie, printCfg, user);
      printHTML(html);
    } catch {
      await uiAlert({
        icon: 'error',
        title: 'Impression',
        text: "Impossible de charger la fiche (vérifiez les permissions).",
      });
    } finally { setPrintingFiche(null); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([getListeDetail(listeInit.id), getCandidats(listeInit.id)]);
      setListe(d); setCandidats(c);
      const calcReportes = (arr) => (arr || []).filter(x =>
        x.presence === 'ABSENT'
        || x.presence === 'NON_RENSEIGNEE'
        || (x.presence === 'PRESENT' && !x.fiche_aptitude_id)
      ).length;
      setNbReportes(calcReportes(c));

      const rid =
        d?.nouvelle_liste_reportee_id ??
        d?.liste_reportee_id ??
        d?.liste_reportee ??
        d?.reportee_liste_id ??
        null;
      setListeReporteeId(rid);
      setListeReporteeRef(
        d?.nouvelle_liste_reportee_reference ??
        d?.liste_reportee_reference ??
        d?.reportee_liste_reference ??
        ''
      );
      setRhNotifiesCount(
        d?.rh_notifies_count ??
        d?.rh_notifications_count ??
        null
      );
    } catch {
      /* ignore erreurs chargement liste reportée */
    } finally { setLoading(false); }
  }, [listeInit.id]);

  useEffect(() => { load(); }, [load]);

  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    setDocsErr('');
    try {
      const r = await getDocumentsMedecin(listeInit.id);
      let arr = Array.isArray(r?.results) ? r.results : Array.isArray(r) ? r : Array.isArray(r?.candidats) ? r.candidats : [];

      setDocsMedecin(arr);
    } catch (e) {
      setDocsErr(e.response?.data?.error || e.response?.data?.detail || 'Impossible de charger le feedback médecin.');
      setDocsMedecin([]);
    } finally {
      setDocsLoading(false);
    }
  }, [listeInit.id]);

  useEffect(() => {
    if (tab === 'documents') loadDocuments();
  }, [tab, loadDocuments]);

  const handleSoumettre = async () => {
    const ok = await uiConfirm({
      title: 'Soumettre',
      text: `Soumettre ${liste.reference} à l'infirmier ?`,
      confirmButtonText: 'Soumettre',
    });
    if (!ok) return;
    setSubmitting(true);
    try { await soumettreListe(liste.id); await load(); }
    catch(e) {
      await uiAlert({ icon: 'error', title: 'Soumettre', text: e.response?.data?.error || 'Erreur.' });
    }
    finally { setSubmitting(false); }
  };

  const handleExport = async () => {
    setExportLoad(true);
    try {
      const r = await exportListe(liste.id);
      const u = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href=u; a.download=`${liste.reference}.xlsx`; a.click();
      window.URL.revokeObjectURL(u);
    } catch {
      await uiAlert({ icon: 'error', title: 'Export', text: 'Erreur export.' });
    }
    finally { setExportLoad(false); }
  };

  const handleSmsVeilleListe = async () => {
    setVeilleBusy(true);
    try {
      const res = await notifierSmsVeilleListeEmbauche(liste.id);
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

  const listeCloturee = liste.statut === 'CLOTUREE';
  const showSmsJourJCol = embaucheListePermetSmsJourJManuel(liste.statut);

  const nb = {
    total:    candidats.length,
    presents: candidats.filter(c=>c.presence==='PRESENT').length,
    absents:  candidats.filter(c=>c.presence==='ABSENT').length,
    aptes:    candidats.filter(c=>c.etat_embauche==='APTE').length,
    inaptes:  candidats.filter(c=>c.etat_embauche==='INAPTE').length,
    integres: candidats.filter(c=>c.statut_integration==='INTEGRE').length,
  };

  const TABS = [
    { id:'candidats', label:'Candidats' },
    { id:'modifier',  label:`Modifier${liste.statut!=='BROUILLON'?' (lecture)':''}` },
    { id:'suivi',     label:'Suivi integration' },
    { id:'documents', label:'Documents médecin' },
  ];

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Banner liste reportee */}
      {listeReporteeId && nbReportes > 0 && (
        <div style={{background:'#fff7ed',border:'1.5px solid #fed7aa',borderRadius:12,padding:'14px 18px',marginBottom:16,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
          <div style={{fontSize:22}}>📋</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:'#c2410c',marginBottom:3}}>
              {nbReportes} candidat{nbReportes>1?'s':''} reporté{nbReportes>1?'s':''} — nouvelle liste générée automatiquement
            </div>
            <div style={{fontSize:12,color:'#92400e'}}>
              Les candidats absents ou sans visite ont été reportés dans une nouvelle liste (Brouillon).
              La RH doit planifier une nouvelle date de visite pour cette liste.
              {listeReporteeRef ? ` Référence: ${listeReporteeRef}.` : ''}
              {rhNotifiesCount !== null ? ` RH notifiés: ${rhNotifiesCount}.` : ''}
            </div>
          </div>
          {onGoToListe && (
            <button onClick={() => onGoToListe(listeReporteeId)}
              style={{padding:'8px 16px',borderRadius:9,border:'none',background:'#c2410c',color:'white',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap'}}>
              Voir la liste reportee
            </button>
          )}
        </div>
      )}

      {/* En-tete */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:13,fontFamily:'inherit'}}>
          <IcoBack/>Retour
        </button>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{liste.reference}</span>
            <StatutBadge statut={liste.statut}/>
          </div>
          <div style={{fontSize:13,color:'#64748b',marginTop:3}}>
            Visite : {fmtDate(liste.date_visite)}
            {liste.medecin_nom && (
              <span style={{marginLeft:8,background:'#f0fdf4',color:'#15803d',fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:12}}>
                Dr {liste.medecin_nom}
              </span>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>

          {liste.statut === 'BROUILLON' && (
            <button onClick={handleSoumettre} disabled={submitting}
              style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:9,border:'none',background:submitting?'#93c5fd':'#1d4ed8',color:'white',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>
              <IcoSend/>{submitting?'…':'Soumettre'}
            </button>
          )}
          {['EN_TRAITEMENT', 'CLOTUREE', 'ARCHIVEE'].includes(liste.statut) && (
            <button onClick={handleExport} disabled={exportLoad}
              style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:9,border:'1px solid #86efac',background: exportLoad ? '#f1f5f9' : '#ecfdf5',cursor: exportLoad ? 'wait' : 'pointer',fontSize:12,fontWeight:600,color:'#15803d',fontFamily:'inherit'}}>
              <IcoDownload/>{exportLoad?'…':'Export Excel'}
            </button>
          )}
          {(['SOUMISE','EN_TRAITEMENT'].includes(liste.statut)) && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
              <SmsVeilleBadge liste={liste} />
              {!isSmsVeilleEnvoye(liste) && (
                <button
                  type="button"
                  onClick={handleSmsVeilleListe}
                  disabled={veilleBusy}
                  style={{
                    display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:9,border:'1px solid #bbf7d0',
                    background: veilleBusy ? '#ecfdf5' : '#f0fdf4', color:'#15803d', cursor: veilleBusy ? 'wait' : 'pointer',
                    fontSize:11,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap',
                  }}
                >
                  {veilleBusy ? '…' : 'SMS veille'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:20}}>
        {[
          {label:'Total',    val:nb.total,    color:'#1d4ed8', bg:'#eff6ff'},
          {label:'Presents', val:nb.presents, color:'#15803d', bg:'#f0fdf4'},
          {label:'Absents',  val:nb.absents,  color:'#b91c1c', bg:'#fef2f2'},
          {label:'Aptes',    val:nb.aptes,    color:'#15803d', bg:'#f0fdf4'},
          {label:'Inaptes',  val:nb.inaptes,  color:'#b91c1c', bg:'#fef2f2'},
          {label:'Integres', val:nb.integres, color:'#1d4ed8', bg:'#eff6ff'},
        ].map(s => (
          <div key={s.label} style={{background:s.bg,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'monospace',lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:11,color:s.color,opacity:.8,marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{display:'flex',gap:0,borderBottom:'2px solid #f1f5f9',marginBottom:16}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'10px 18px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'inherit',color:tab===t.id?'#1d4ed8':'#94a3b8',borderBottom:`2px solid ${tab===t.id?'#1d4ed8':'transparent'}`,marginBottom:-2,whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:40}}>
          <div style={{width:28,height:28,border:'3px solid #e2e8f0',borderTopColor:'#1d4ed8',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
        </div>
      ) : (
        <>
          {tab === 'candidats' && (
            <div style={{background:'white',borderRadius:12,border:'1px solid #f1f5f9',overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#f8fafc',borderBottom:'1px solid #f1f5f9'}}>
                      {(() => {
                        const h = ['#','Nom','Matricule','Fonction','Projet','Présence','Aptitude','Observations'];
                        if (showSmsJourJCol) h.push('SMS file');
                        h.push('Fiche');
                        return h.map(col => (
                          <th key={col} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{col}</th>
                        ));
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {candidats.length === 0 ? (
                      <tr><td colSpan={showSmsJourJCol ? 10 : 9} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:13}}>Aucun candidat.</td></tr>
                    ) : candidats.map((c,i) => (
                      <tr key={c.id} style={{borderBottom:i<candidats.length-1?'1px solid #f8fafc':'none'}}>
                        <td style={{padding:'10px 12px',color:'#94a3b8',fontFamily:'monospace'}}>{i+1}</td>
                        <td style={{padding:'10px 12px',fontWeight:600,color:'#0f172a'}}>{c.nom} {c.prenom}</td>
                        <td style={{padding:'10px 12px',fontFamily:'monospace',color:'#475569'}}>{c.matricule}</td>
                        <td style={{padding:'10px 12px',color:'#475569'}}>{c.poste||'—'}</td>
                        <td style={{padding:'10px 12px',color:'#475569'}}>{c.projet||'—'}</td>
                        <td style={{padding:'10px 12px'}}>
                          <span style={{
                            background: c.presence==='PRESENT' ? '#dcfce7' : c.presence==='ABSENT' ? '#fef2f2' : '#fff7ed',
                            color:      c.presence==='PRESENT' ? '#15803d' : c.presence==='ABSENT' ? '#b91c1c' : '#c2410c',
                            fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap'
                          }}>
                            {c.presence==='PRESENT' ? 'Présent ✓' : c.presence==='ABSENT' ? 'Absent' : 'Non renseignée'}
                          </span>
                        </td>
                        <td style={{padding:'10px 12px'}}><EtatBadge val={c.etat_embauche}/></td>
                        <td style={{padding:'10px 12px',color:'#64748b',fontStyle:c.observations_medecin?'normal':'italic',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {c.observations_medecin||'—'}
                        </td>
                        {showSmsJourJCol && (
                          <td style={{padding:'10px 12px',verticalAlign:'top'}}>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:5}}>
                              <SmsLigneBadge ligne={c} />
                              <button
                                type="button"
                                onClick={() => handleSmsJourJCandidat(c.id)}
                                disabled={jourJBusy === c.id}
                                style={{
                                  padding:'4px 8px',borderRadius:7,border:'1px solid #bae6fd',background:jourJBusy===c.id?'#f0f9ff':'#eff6ff',
                                  color:'#0369a1',cursor:jourJBusy===c.id?'wait':'pointer',fontSize:10,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap',
                                }}
                              >
                                {jourJBusy === c.id ? '…' : 'Renvoyer SMS'}
                              </button>
                            </div>
                          </td>
                        )}
                        <td style={{padding:'10px 12px'}}>
                          {c.resultat_fiche_aptitude?.id ? (
                            <button
                              onClick={() => imprimerFiche(c.resultat_fiche_aptitude.id, c)}
                              disabled={printingFiche === c.resultat_fiche_aptitude.id}
                              style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:7,border:'1.5px solid #bfdbfe',background:'#eff6ff',color:'#1d4ed8',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap'}}>
                              {printingFiche === c.resultat_fiche_aptitude.id ? '⏳ …' : '🖨 Imprimer fiche'}
                            </button>
                          ) : <span style={{fontSize:11,color:'#94a3b8'}}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'modifier' && (
            <OngletModification
              liste={liste}
              candidats={candidats}
              statut={liste.statut}
              onRefresh={load}
              onSmsJourJ={handleSmsJourJCandidat}
              jourJBusyId={jourJBusy}
            />
          )}

          {tab === 'suivi' && (
            <div>
              {!listeCloturee && (
                <div style={{display:'flex',alignItems:'center',gap:8,background:'#fffbeb',border:'1px solid #fde68a',color:'#a16207',padding:'10px 16px',borderRadius:10,marginBottom:14,fontSize:13}}>
                  <IcoWarn/> La liste doit etre <strong style={{margin:'0 4px'}}>Cloturee</strong> pour creer des collaborateurs.
                </div>
              )}
              {/* Candidats reportes (absents / sans visite) */}
              {listeCloturee && candidats.filter(c=>
                c.presence==='ABSENT'
                || c.presence==='NON_RENSEIGNEE'
                || (c.presence==='PRESENT' && !c.fiche_aptitude_id)
              ).length > 0 && (
                <div style={{background:'#fff7ed',border:'1.5px solid #fed7aa',borderRadius:10,padding:'12px 16px',marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#c2410c',marginBottom:6}}>
                    Candidats reportes ({candidats.filter(c=>
                      c.presence==='ABSENT'
                      || c.presence==='NON_RENSEIGNEE'
                      || (c.presence==='PRESENT' && !c.fiche_aptitude_id)
                    ).length}) — une nouvelle liste Brouillon a ete generee automatiquement
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {candidats.filter(c=>
                      c.presence==='ABSENT'
                      || c.presence==='NON_RENSEIGNEE'
                      || (c.presence==='PRESENT' && !c.fiche_aptitude_id)
                    ).map(c=>(
                      <span key={c.id} style={{background:'#fff',border:'1px solid #fed7aa',borderRadius:8,padding:'3px 10px',fontSize:11,color:'#c2410c',fontWeight:600}}>
                        {c.nom} {c.prenom} ({c.matricule})
                        <span style={{marginLeft:5,fontSize:10,opacity:.7}}>
                          {c.presence==='ABSENT'?'absent':c.presence==='NON_RENSEIGNEE'?'sans feedback':'présent sans visite'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{background:'white',borderRadius:12,border:'1px solid #f1f5f9',overflow:'hidden'}}>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{background:'#f8fafc',borderBottom:'1px solid #f1f5f9'}}>
                        {['Nom','Matricule','Presence','Aptitude','Statut integration','Collaborateur','Actions'].map(h => (
                          <th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {candidats.filter(c => c.presence === 'PRESENT').length === 0 ? (
                        <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:13}}>Aucun candidat présent.</td></tr>
                      ) : candidats
                        .filter(c => c.presence === 'PRESENT')
                        .map((c) => (
                        <tr key={c.id} style={{borderBottom:'1px solid #f8fafc'}}>
                          <td style={{padding:'10px 12px',fontWeight:600,color:'#0f172a'}}>{c.nom} {c.prenom}</td>
                          <td style={{padding:'10px 12px',fontFamily:'monospace',color:'#475569'}}>{c.matricule}</td>
                          <td style={{padding:'10px 12px'}}>
                            <span style={{background:'#dcfce7',color:'#15803d',fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20}}>
                              Present
                            </span>
                          </td>
                          <td style={{padding:'10px 12px'}}><EtatBadge val={c.etat_embauche}/></td>
                          <td style={{padding:'10px 12px'}}><IntegBadge val={c.statut_integration}/></td>
                          <td style={{padding:'10px 12px'}}>
                            {c.collaborateur
                              ? <span style={{fontSize:11,color:'#15803d',fontWeight:600}}>OK ID:{c.collaborateur}</span>
                              : <span style={{fontSize:11,color:'#94a3b8'}}>—</span>}
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            <ActionsCandidatRow candidat={c} listeCloturee={listeCloturee} onRefresh={load}/>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div>
              {docsErr && (
                <div style={{display:'flex',alignItems:'center',gap:8,background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',padding:'10px 16px',borderRadius:10,marginBottom:14,fontSize:13}}>
                  <IcoWarn/> {docsErr}
                </div>
              )}
              {docsLoading ? (
                <div style={{display:'flex',justifyContent:'center',padding:30}}>
                  <div style={{width:24,height:24,border:'3px solid #e2e8f0',borderTopColor:'#1d4ed8',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
                </div>
              ) : (
                <div style={{background:'white',borderRadius:12,border:'1px solid #f1f5f9',overflow:'hidden'}}>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead>
                        <tr style={{background:'#f8fafc',borderBottom:'1px solid #f1f5f9'}}>
                          {['Nom','Matricule','Statut fiche','Actions'].map(h => (
                            <th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {docsMedecin.length === 0 ? (
                          <tr><td colSpan={4} style={{textAlign:'center',padding:32,color:'#94a3b8',fontSize:13}}>Aucun document médecin disponible pour cette liste.</td></tr>
                        ) : docsMedecin.map((d, i) => {
                          const fiche = d?.fiche_aptitude || d?.resultat_fiche_aptitude || null;
                          const ficheId = fiche?.id || d?.fiche_aptitude_id || null;
                          const statutFiche =
                            (fiche?.aptitude && String(fiche.aptitude).toUpperCase().startsWith('INAPTE')) ? 'INAPTE'
                              : fiche?.aptitude ? 'APTE'
                                : 'EN_ATTENTE';
                          const candidatRow = d?.candidat || d;
                          const btnDocMedecinStyle = { display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:7,border:'1.5px solid #bfdbfe',background:'#eff6ff',color:'#1d4ed8',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap' };
                          return (
                            <tr key={d?.id || d?.candidat_id || i} style={{borderBottom: i < docsMedecin.length - 1 ? '1px solid #f8fafc' : 'none'}}>
                              <td style={{padding:'10px 12px',fontWeight:600,color:'#0f172a'}}>{d?.nom || d?.candidat?.nom || d?.candidat_nom || '—'} {d?.prenom || d?.candidat?.prenom || d?.candidat_prenom || ''}</td>
                              <td style={{padding:'10px 12px',fontFamily:'monospace',color:'#475569'}}>{d?.matricule || d?.candidat?.matricule || d?.candidat_matricule || '—'}</td>
                              <td style={{padding:'10px 12px'}}><DocBadge val={statutFiche}/></td>
                              <td style={{padding:'10px 12px'}}>
                                {ficheId ? (
                                  <button onClick={() => imprimerFiche(ficheId, d?.candidat || d)} disabled={printingFiche === ficheId}
                                    style={{...btnDocMedecinStyle, opacity: printingFiche === ficheId ? 0.7 : 1}}>
                                    {printingFiche === ficheId ? '⏳ …' : 'Voir fiche aptitude'}
                                  </button>
                                ) : (
                                  <span style={{fontSize:11,color:'#94a3b8'}}>En attente</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}



    </div>
  );
}