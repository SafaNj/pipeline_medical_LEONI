// src/components/medecinTravail/TabFiche.jsx — REDESIGN bleu ciel style infirmier
import { useState, useEffect } from 'react';
import AptitudeBadge from './Aptitudebadge';
import EnteteMaladiesChroniques, { resolveCollaborateurId } from '../common/EnteteMaladiesChroniques';
import PrintFicheAptitudeRouter from './PrintFicheAptitudeRouter';
import { modifierFicheAptitude } from '../../api/Medicalworkapi';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { useAuth } from '../../context/AuthContext';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';
import { buildFichePayloadByTemplate } from '../../utils/ficheTemplate';
import { deriveMessadineCertificatChoice, normalizeDateRepriseForApi } from '../../utils/messadineAptitudeCert';
import { getFicheCollaborateurNomComplet } from '../../utils/ficheCollaborateur';
import { primaryActionButtonStyle, PRIMARY_ACTION_GRADIENT, PRIMARY_ACTION_SHADOW } from './primaryActionButtonStyle';
import { getSite } from '../../api/sitesApi';
import { getUserSiteId } from '../../utils/siteAccessControl';
import { padMateurExamRows } from '../../utils/mateurExamUlterieurs';

const SKY = { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985' };

const APTITUDE_OPTIONS = [
  { value:'APTE_AU_POSTE',               label:'Apte au poste' },
  { value:'APTE_AMENAGEMENT_POSTE',       label:'Apte — Aménagement de poste' },
  { value:'INAPTE_TEMPORAIRE',            label:'Inapte temporaire' },
  { value:'INAPTE_DEFINITIF_MEME_POSTE',  label:'Inapte définitif (même poste)' },
  { value:'INAPTE_DEFINITIF_ENTREPRISE',  label:'Inapte définitif (entreprise)' },
];
const TYPE_OPTIONS = [
  { value:'PERIODIQUE', label:'Visite Périodique' },
  { value:'REPRISE',    label:'Visite de Reprise' },
  { value:'SPONTANEE',  label:'Visite Spontanée' },
  { value:'EMBAUCHE',   label:"Visite d'Embauche" },
];

const IcPrint = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IcSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IcUser  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcBuild = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
const IcCal   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;

function SectionBar({ icon: Icon, children }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:7,fontSize:10.5,fontWeight:800,color:SKY[700],textTransform:'uppercase',letterSpacing:'.7px',paddingBottom:8,borderBottom:`2px solid ${SKY[100]}`,marginBottom:12 }}>
      <div style={{width:22,height:22,borderRadius:6,background:SKY[50],border:`1px solid ${SKY[200]}`,display:'flex',alignItems:'center',justifyContent:'center',color:SKY[600]}}>
        {Icon && <Icon/>}
      </div>
      {children}
    </div>
  );
}

function ROField({ label, value, mono }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3}}>
      <div style={{fontSize:10,fontWeight:700,color:SKY[600],textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</div>
      <div style={{background:SKY[50],border:`1.5px solid ${SKY[100]}`,borderRadius:9,padding:'8px 11px',fontSize:mono?12:13,color:'#334155',fontFamily:mono?'monospace':'inherit',minHeight:36}}>
        {value||<span style={{color:'#cbd5e1'}}>—</span>}
      </div>
    </div>
  );
}

const inpSx = { width:'100%',padding:'9px 12px',background:'white',border:`1.5px solid ${SKY[200]}`,borderRadius:9,fontSize:13,color:'#0f172a',fontFamily:'inherit',outline:'none',boxSizing:'border-box',transition:'border-color .15s,box-shadow .15s' };

function Inp({ label, value, onChange, type='text', mono, readOnly = false }) {
  const [f,setF]=useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3}}>
      {!!label && (
        <div style={{fontSize:10,fontWeight:700,color:SKY[700],textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</div>
      )}
      <input
        type={type}
        value={value||''}
        readOnly={readOnly}
        onChange={(e) => (readOnly ? undefined : onChange(e.target.value))}
        style={{
          ...inpSx,
          background: readOnly ? '#f8fafc' : 'white',
          color: readOnly ? '#334155' : '#0f172a',
          fontFamily:mono?'monospace':'inherit',
          borderColor: readOnly ? SKY[200] : (f ? SKY[400] : SKY[200]),
          boxShadow: readOnly ? 'none' : (f ? `0 0 0 3px ${SKY[100]}` : 'none'),
        }}
        onFocus={() => { if (!readOnly) setF(true); }}
        onBlur={() => { if (!readOnly) setF(false); }}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, rows=2, readOnly = false }) {
  const [f,setF]=useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3}}>
      {!!label && (
        <div style={{fontSize:10,fontWeight:700,color:SKY[700],textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</div>
      )}
      <textarea
        rows={rows}
        value={value||''}
        readOnly={readOnly}
        onChange={(e) => (readOnly ? undefined : onChange(e.target.value))}
        style={{
          ...inpSx,
          resize:'vertical',
          background: readOnly ? '#f8fafc' : 'white',
          color: readOnly ? '#334155' : '#0f172a',
          borderColor: readOnly ? SKY[200] : (f ? SKY[400] : SKY[200]),
          boxShadow: readOnly ? 'none' : (f ? `0 0 0 3px ${SKY[100]}` : 'none'),
        }}
        onFocus={() => { if (!readOnly) setF(true); }}
        onBlur={() => { if (!readOnly) setF(false); }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  const [f,setF]=useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3}}>
      <div style={{fontSize:10,fontWeight:700,color:SKY[700],textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</div>
      <select value={value||''} onChange={e=>onChange(e.target.value)}
        style={{...inpSx,cursor:'pointer',appearance:'none',borderColor:f?SKY[400]:SKY[200],boxShadow:f?`0 0 0 3px ${SKY[100]}`:'none'}}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function buildForm(f,toISO) {
  const dateOrText = (v) => {
    if (v == null) return '';
    const s = String(v).trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return s;
  };
  return {
    type_visite:f?.type_visite||'',date_visite:toISO(f?.date_visite)||'',aptitude:f?.aptitude||'',
    raison_sociale:f?.raison_sociale||'',nature_activite:f?.nature_activite||'',
    numero_cnss_entreprise:f?.numero_cnss_entreprise||'',adresse_entreprise:f?.adresse_entreprise||'',
    qualifications:f?.qualifications||'',
    precision_aptitude:f?.precision_aptitude||'',
    // Messadine : `date_reprise` peut être une date OU un texte (selon le choix).
    date_reprise: dateOrText(f?.date_reprise),
    // Messadine : « et ce pour une durée de » (texte libre)
    duree_aptitude: String(f?.duree_aptitude || '').trim(),
    examens_ulterieurs: Array.isArray(f?.examens_ulterieurs) ? f.examens_ulterieurs : [],
  };
}

export default function TabFiche({ fiche, onFicheUpdated, entrepriseEditable = false }) {
  const { user } = useAuth();
  const fmt    = d=>d?new Date(d).toLocaleDateString('fr-FR'):'—';
  const toISO  = d=>{
    if(!d) return '';
    try{
      const dt=new Date(d);
      if(Number.isNaN(dt.getTime())) return '';
      return dt.toISOString().split('T')[0];
    }catch{
      return '';
    }
  };
  const siteConfig = getSitePrintConfig(user, fiche);
  const templateBranch = resolveSiteTemplateFromSources(fiche, fiche?.site_details, user, siteConfig);
  const isMessadineTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE;
  const isMaturTemplate = templateBranch === SITE_TEMPLATE_BRANCH.MATEUR;
  const hideEntrepriseFields = isMessadineTemplate;
  const [form,setForm]     = useState(()=>buildForm(null,toISO));
  const [saving,setSaving] = useState(false);
  const [success,setSuccess]=useState('');
  const [error,setError]   = useState('');
  const [btnHov,setBtnHov] = useState('');
  const [sousseAptitudeChoice, setSousseAptitudeChoice] = useState('');
  const [maturExamRows, setMaturExamRows] = useState(() => padMateurExamRows([]));
  const [maturExamVisibleCount, setMaturExamVisibleCount] = useState(1);
  const draftKey = fiche?.id != null ? `pfe-tabfiche-draft-v1:${fiche.id}` : '';

  useEffect(()=>{
    if(!fiche?.id)return;
    const nextForm = buildForm(fiche,toISO);
    // Restaurer brouillon local (si l'utilisateur a saisi puis a navigué sans sauvegarder).
    let restored = null;
    if (draftKey) {
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1 && String(parsed.ficheId) === String(fiche.id) && parsed.form) {
            restored = parsed;
          }
        }
      } catch { /* ignore */ }
    }
    const formToUse = restored?.form && typeof restored.form === 'object' ? { ...nextForm, ...restored.form } : nextForm;
    setForm(formToUse);
    setMaturExamRows(
      isMaturTemplate ? padMateurExamRows(formToUse.examens_ulterieurs) : [],
    );
    setMaturExamVisibleCount(1);
    setSousseAptitudeChoice(
      isMessadineTemplate
        ? (restored?.sousseAptitudeChoice || deriveMessadineCertificatChoice(formToUse))
        : ''
    );
    setError('');setSuccess('');
  },[fiche?.id]); // eslint-disable-line

  useEffect(() => {
    if (!isMaturTemplate) return;
    // Keep form.examens_ulterieurs synced with local rows
    setForm((prev) => ({ ...prev, examens_ulterieurs: maturExamRows }));
  }, [maturExamRows, isMaturTemplate]);

  // Si des lignes (au-delà de la 1ère) contiennent déjà des données, afficher jusqu'à la dernière remplie.
  useEffect(() => {
    if (!isMaturTemplate) return;
    const rows = Array.isArray(maturExamRows) ? maturExamRows : [];
    let lastFilledIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r) continue;
      const filled = Boolean(
        String(r.date_nature || '').trim()
        || String(r.conclusion || '').trim()
        || String(r.medecin || '').trim()
        || r.p || r.r || r.s
      );
      if (filled) lastFilledIdx = i;
    }
    const needed = Math.max(1, lastFilledIdx + 1);
    setMaturExamVisibleCount((prev) => (prev < needed ? needed : prev));
  }, [isMaturTemplate, maturExamRows]);

  // Sauvegarde brouillon (debounce léger)
  useEffect(() => {
    if (!draftKey || !fiche?.id) return undefined;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            version: 1,
            ficheId: fiche.id,
            sousseAptitudeChoice: isMessadineTemplate ? sousseAptitudeChoice : '',
            form,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [draftKey, fiche?.id, form, sousseAptitudeChoice, isMessadineTemplate]);

  // Auto-remplir entreprise depuis le site (admin) quand la fiche n'a pas ces champs
  useEffect(() => {
    let cancelled = false;
    if (!fiche?.id) return undefined;
    const siteId = getUserSiteId();
    if (!siteId) return undefined;

    (async () => {
      try {
        const s = await getSite(siteId);
        if (cancelled || !s) return;
        setForm((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          const raison = s.raison_sociale ?? s.company_name ?? s.companyName ?? '';
          const nat = s.nature_activite ?? s.natureActivite ?? s.activity ?? '';
          const cnss = s.numero_cnss_entreprise ?? s.numeroCnssEntreprise ?? s.cnss_entreprise ?? '';
          const adr = s.adresse_entreprise ?? s.adresseEntreprise ?? s.address ?? s.adresse ?? '';
          const qual = s.qualifications ?? s.qualificationsSite ?? s.qualifications_site ?? '';

          if (!String(next.raison_sociale || '').trim()) next.raison_sociale = String(raison || '');
          if (!String(next.nature_activite || '').trim()) next.nature_activite = String(nat || '');
          if (!String(next.numero_cnss_entreprise || '').trim()) next.numero_cnss_entreprise = String(cnss || '');
          if (!String(next.adresse_entreprise || '').trim()) next.adresse_entreprise = String(adr || '');
          if (!String(next.qualifications || '').trim()) next.qualifications = String(qual || '');
          return next;
        });
      } catch {
        // ignore
      }
    })();

    return () => { cancelled = true; };
  }, [fiche?.id]);

  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleSave=async()=>{
    if(!form.aptitude){setError("L'aptitude est requise.");return;}
    if(!form.date_visite){setError('La date de visite est requise.');return;}
    setError('');setSaving(true);
    try{
      const payload = buildFichePayloadByTemplate({
        templateBranch,
        ...form,
        numero_cnss: fiche?.collaborateur_cnss || fiche?.numero_cnss,
        collaborateur: fiche?.collaborateur || null,
        matricule: fiche?.matricule || fiche?.collaborateur_matricule || '',
      });

      // Messadine/Sousse : Messadine utilise `duree_aptitude` (texte libre) pour "et ce pour une durée de"
      if (isMessadineTemplate) {
        if (sousseAptitudeChoice === 'APTITUDE') {
          payload.duree_aptitude = String(form.duree_aptitude || '').trim();
        } else if (sousseAptitudeChoice === 'REPRISE_MO_AT') {
          payload.date_reprise = normalizeDateRepriseForApi(form.date_reprise || form.precision_aptitude);
        } else if (sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE') {
          payload.date_reprise = null;
          payload.duree_aptitude = '';
        } else {
          payload.date_reprise = normalizeDateRepriseForApi(form.date_reprise);
        }
      } else if (String(form.type_visite || '').toUpperCase() === 'REPRISE') {
        payload.date_reprise = normalizeDateRepriseForApi(form.date_reprise || form.precision_aptitude);
      } else {
        payload.date_reprise = normalizeDateRepriseForApi(form.date_reprise);
      }

      const updated=await modifierFicheAptitude(fiche.id,payload);
      setForm(buildForm(updated,toISO));
      if (isMaturTemplate) {
        setMaturExamRows(padMateurExamRows(updated?.examens_ulterieurs));
      }
      setError('');
      setSuccess("Fiche d'aptitude modifiée avec succès");
      // Nettoyer le brouillon (la saisie est désormais persistée côté backend)
      try { if (draftKey) sessionStorage.removeItem(draftKey); } catch { /* ignore */ }
      setTimeout(()=>setSuccess(''),3500);
      if(onFicheUpdated)onFicheUpdated(updated);
    }catch(e){
      const d=e?.response?.data;
      setError(d&&typeof d==='object'?Object.entries(d).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | '):"Erreur lors de la modification.");
    }finally{setSaving(false);}
  };

  if(!fiche)return null;

  return (
    <div style={{padding:'20px 22px',overflowY:'auto',flex:1}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <EnteteMaladiesChroniques collaborateurId={resolveCollaborateurId(fiche)} style={{ marginBottom: 18 }} />

      {/* Collaborateur */}
      <div style={{marginBottom:20,animation:'fadeIn .25s ease'}}>
        <SectionBar icon={IcUser}>Informations collaborateur</SectionBar>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <ROField label="Nom complet"       value={getFicheCollaborateurNomComplet(fiche)}/>
          <ROField label="Matricule"         value={fiche.collaborateur_matricule} mono/>
          <ROField label="CIN"               value={fiche.collaborateur_cin} mono/>
          <ROField label="Poste"             value={fiche.collaborateur_poste}/>
          <ROField label="Date de naissance" value={fmt(fiche.collaborateur_date_naissance)}/>
          <ROField label="Lieu de naissance" value={fiche.collaborateur_lieu_naissance}/>
          <div style={{gridColumn:'1/-1'}}><ROField label="Adresse" value={fiche.collaborateur_adresse}/></div>
        </div>
      </div>

      {!hideEntrepriseFields && (
        <div style={{marginBottom:20}}>
          <SectionBar icon={IcBuild}>Informations entreprise</SectionBar>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Inp    label="Raison sociale"      value={form.raison_sociale}         onChange={(v) => set('raison_sociale', v)} readOnly={!entrepriseEditable} />
            <Inp    label="Nature d'activité"   value={form.nature_activite}        onChange={(v) => set('nature_activite', v)} readOnly={!entrepriseEditable} />
            <Inp    label="N° CNSS entreprise"  value={form.numero_cnss_entreprise} onChange={(v) => set('numero_cnss_entreprise', v)} mono readOnly={!entrepriseEditable} />
            <div style={{gridColumn:'1/-1'}}><Inp label="Adresse entreprise" value={form.adresse_entreprise} onChange={(v) => set('adresse_entreprise', v)} readOnly={!entrepriseEditable} /></div>
            <div style={{gridColumn:'1/-1'}}><Textarea label="Qualifications" value={form.qualifications} onChange={(v) => set('qualifications', v)} readOnly={!entrepriseEditable} /></div>
          </div>
        </div>
      )}

      {/* Visite */}
      <div style={{marginBottom:20}}>
        <SectionBar icon={IcCal}>Visite médicale</SectionBar>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {!isMaturTemplate && (
            <Select
              label="Type de visite *"
              value={form.type_visite}
              onChange={(v) => {
                set('type_visite', v);
                if (isMessadineTemplate) {
                  const up = String(v || '').toUpperCase();
                  if (up === 'REPRISE') {
                    setSousseAptitudeChoice('REPRISE_MO_AT');
                    setForm((p) => ({ ...p, aptitude: p.aptitude || 'APTE_AU_POSTE' }));
                  } else {
                    // revenir sur un choix cohérent
                    const next = deriveMessadineCertificatChoice({ ...form, type_visite: v });
                    setSousseAptitudeChoice(next || (String(form.aptitude || '').toUpperCase() === 'INAPTE_TEMPORAIRE' ? 'APTITUDE_TEMPORAIRE' : 'APTITUDE'));
                  }
                }
              }}
              options={TYPE_OPTIONS}
            />
          )}
          <Inp    label="Date de visite *" value={form.date_visite} onChange={v=>set('date_visite',v)} type="date"/>
        </div>
      </div>

      {isMaturTemplate && (
        <div style={{marginBottom:20}}>
          <SectionBar icon={IcCheck}>4 — Examens médicaux ultérieurs</SectionBar>
          <div style={{ border: `1.5px solid ${SKY[200]}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', background: SKY[50], borderBottom: `1.5px solid ${SKY[200]}` }}>
              <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Date et Nature de l’examen (P/R/S)</div>
              <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Conclusions en matière d’aptitude (à préciser)</div>
              <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Nom, prénom et Signature du médecin</div>
            </div>
            {maturExamRows.slice(0, maturExamVisibleCount).map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', borderBottom: idx === (maturExamVisibleCount - 1) ? 'none' : `1px solid ${SKY[100]}` }}>
                <div style={{ padding: 10 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <button type="button" onClick={() => setMaturExamRows((prev) => prev.map((r,i)=> i!==idx?r:{...r,p:!r.p,r:false,s:false}))}
                      style={{ border:'1.5px solid #e2e8f0', background: row.p ? SKY[50] : 'white', borderRadius: 10, padding:'6px 10px', cursor:'pointer', fontWeight: 800, color: row.p ? SKY[700] : '#64748b' }}>P</button>
                    <button type="button" onClick={() => setMaturExamRows((prev) => prev.map((r,i)=> i!==idx?r:{...r,r:!r.r,p:false,s:false}))}
                      style={{ border:'1.5px solid #e2e8f0', background: row.r ? SKY[50] : 'white', borderRadius: 10, padding:'6px 10px', cursor:'pointer', fontWeight: 800, color: row.r ? SKY[700] : '#64748b' }}>R</button>
                    <button type="button" onClick={() => setMaturExamRows((prev) => prev.map((r,i)=> i!==idx?r:{...r,s:!r.s,p:false,r:false}))}
                      style={{ border:'1.5px solid #e2e8f0', background: row.s ? SKY[50] : 'white', borderRadius: 10, padding:'6px 10px', cursor:'pointer', fontWeight: 800, color: row.s ? SKY[700] : '#64748b' }}>S</button>
                  </div>
                  <Textarea label="Date + nature" value={row.date_nature} onChange={(v)=>setMaturExamRows((prev)=>prev.map((r,i)=>i!==idx?r:{...r,date_nature:v}))} rows={3}/>
                </div>
                <div style={{ padding: 10 }}>
                  <Textarea label="Conclusions" value={row.conclusion} onChange={(v)=>setMaturExamRows((prev)=>prev.map((r,i)=>i!==idx?r:{...r,conclusion:v}))} rows={4}/>
                </div>
                <div style={{ padding: 10 }}>
                  <Textarea label="Médecin" value={row.medecin} onChange={(v)=>setMaturExamRows((prev)=>prev.map((r,i)=>i!==idx?r:{...r,medecin:v}))} rows={4}/>
                </div>
              </div>
            ))}
          </div>
          {maturExamVisibleCount < maturExamRows.length && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setMaturExamVisibleCount((c) => Math.min(maturExamRows.length, c + 1))}
                style={{
                  ...primaryActionButtonStyle({ minHeight: 34, padding: '6px 12px', fontSize: 12 }),
                  background: PRIMARY_ACTION_GRADIENT,
                  boxShadow: PRIMARY_ACTION_SHADOW,
                }}
                title="Ajouter une ligne"
              >
                + Ajouter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aptitude */}
      <div style={{marginBottom:20}}>
        <SectionBar icon={IcCheck}>Résultat d'aptitude</SectionBar>
        {isMessadineTemplate ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
            {[
              { key:'APTITUDE', label:'Aptitude', cls:'g' },
              { key:'REPRISE_MO_AT', label:'Reprise MO-AT', cls:'a' },
              { key:'APTITUDE_TEMPORAIRE', label:'Aptitude temporaire', cls:'r' },
            ].map((a) => {
              const active = sousseAptitudeChoice === a.key;
              const activeColor = a.cls === 'g' ? '#16a34a' : a.cls === 'a' ? '#d97706' : '#dc2626';
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => {
                    setSousseAptitudeChoice(a.key);
                    if (a.key === 'APTITUDE_TEMPORAIRE') {
                      setForm((p) => ({
                        ...p,
                        aptitude: 'INAPTE_TEMPORAIRE',
                        // sortir du mode reprise si on venait de REPRISE_MO_AT
                        type_visite: String(p.type_visite || '').toUpperCase() === 'REPRISE' ? 'PERIODIQUE' : p.type_visite,
                        precision_aptitude: '',
                        date_reprise: '',
                      }));
                    } else if (a.key === 'REPRISE_MO_AT') {
                      setForm((p) => ({ ...p, aptitude: 'APTE_AU_POSTE', type_visite: 'REPRISE', precision_aptitude: '' }));
                    } else {
                      setForm((p) => ({
                        ...p,
                        aptitude: 'APTE_AU_POSTE',
                        type_visite: String(p.type_visite || '').toUpperCase() === 'REPRISE' ? 'PERIODIQUE' : p.type_visite,
                        precision_aptitude: '',
                        date_reprise: '',
                      }));
                    }
                  }}
                  style={{
                    border:`1.5px solid ${active ? activeColor : '#e2e8f0'}`,
                    background: active ? '#f8fafc' : 'white',
                    color: active ? activeColor : '#64748b',
                    borderRadius:10,
                    padding:'10px 12px',
                    fontSize:12.5,
                    fontWeight:active ? 700 : 600,
                    cursor:'pointer',
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <Select label="Aptitude *" value={form.aptitude} onChange={v=>set('aptitude',v)} options={APTITUDE_OPTIONS}/>
            {!!form.aptitude && (
              <div style={{ marginTop: 12 }}>
                <Inp
                  label="Précision aptitude"
                  value={form.precision_aptitude}
                  onChange={v => set('precision_aptitude', v)}
                />
              </div>
            )}
          </>
        )}
        <div style={{marginTop:10}}><AptitudeBadge aptitude={form.aptitude||fiche.aptitude} size="lg"/></div>
        {isMessadineTemplate && (
          <div style={{marginTop:14,padding:'14px 15px',background:`linear-gradient(135deg, ${SKY[50]}, #f8fbff)`,border:`1.5px solid ${SKY[200]}`,borderRadius:12,display:'grid',gap:12}}>
            {sousseAptitudeChoice === 'APTITUDE' && (
              <>
                <div style={{ lineHeight: 1.45 }}>
                  <div style={{ fontSize: 12, color: SKY[700], fontWeight: 900 }}>
                    1) Est apte/inapte pour le poste de
                  </div>
                  <div style={{ fontSize: 12, color: SKY[800], fontWeight: 800 }}>
                    {fiche.collaborateur_poste || '—'}
                  </div>
                </div>
                <Inp
                  label=""
                  value={form.precision_aptitude}
                  onChange={v=>set('precision_aptitude',v)}
                />
                <Inp
                  label="et ce pour une durée de"
                  value={form.duree_aptitude}
                  onChange={v=>set('duree_aptitude', v)}
                  type="text"
                />
              </>
            )}
            {sousseAptitudeChoice === 'APTITUDE_TEMPORAIRE' && (
              <Inp
                label="2) Est apte Temporairement pour une période de"
                value={form.precision_aptitude}
                onChange={v=>set('precision_aptitude',v)}
              />
            )}
            {sousseAptitudeChoice === 'REPRISE_MO_AT' && (
              <Inp
                label="3) Peut reprendre son travail à dater du"
                value={form.precision_aptitude}
                onChange={(v) => {
                  set('precision_aptitude', v);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Médecin */}
      <div style={{marginTop:20,padding:'11px 14px',background:SKY[50],borderRadius:11,border:`1.5px solid ${SKY[100]}`,display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${SKY[500]},${SKY[700]})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:12,fontWeight:800,flexShrink:0}}>
          {fiche.medecin_nom?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'MD'}
        </div>
        <div>
          <div style={{fontSize:11.5,color:SKY[600],fontWeight:700}}>Médecin du travail</div>
          <div style={{fontSize:13,color:SKY[800],fontWeight:800}}>{fiche.medecin_nom||'—'}</div>
        </div>
        <div style={{marginLeft:'auto',fontSize:11,color:'#94a3b8'}}>Créée le {fmt(fiche.date_creation)}</div>
      </div>

      {/* Messages */}
      {error   && <div style={{background:'#fef2f2',border:'1.5px solid #fecaca',color:'#dc2626',padding:'10px 14px',borderRadius:10,fontSize:13,marginTop:12,display:'flex',alignItems:'center',gap:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>{error}</div>}
      {success && <div style={{background:'#f0fdf4',border:'1.5px solid #86efac',color:'#15803d',padding:'10px 14px',borderRadius:10,fontSize:13,marginTop:12,display:'flex',alignItems:'center',gap:8}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{success}</div>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
        <PrintFicheAptitudeRouter fiche={{ ...fiche, ...form }} form={form} />

        {/* Bouton Modifier — dégradé sky */}
        <button type="button" onClick={handleSave} disabled={saving}
          onMouseEnter={()=>setBtnHov('save')} onMouseLeave={()=>setBtnHov('')}
          style={{
            ...primaryActionButtonStyle({ marginBottom: 0 }),
            background: saving ? '#94a3b8' : btnHov === 'save' ? SKY[700] : PRIMARY_ACTION_GRADIENT,
            boxShadow: saving ? 'none' : btnHov === 'save' ? '0 4px 14px rgba(3, 105, 161, 0.32)' : PRIMARY_ACTION_SHADOW,
            transform: btnHov === 'save' && !saving ? 'translateY(-1px)' : 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
          <IcSave/>
          {saving?'Enregistrement…':'Modifier la fiche'}
        </button>
      </div>
    </div>
  );
}