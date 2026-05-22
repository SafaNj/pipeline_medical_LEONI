// src/components/medecinControleur/HistoriquePatient.jsx
import { useState, useCallback } from 'react';
import { searchCollaborateurs, getContreVisitesByMatricule, getDemandesExpertise } from '../../api/Contrevisiteapi';
import { getAccidentsByCollaborateur, getMaladiesByCollaborateur, getMaladiesChroniques } from '../../api/actInfirmierApi';
import { getConsultationsByCollaborateur } from '../../api/consultationsApi';
import { getFichesParCollaborateur } from '../../api/Medicalworkapi';
import { displayDepartementControleMedical } from '../../utils/ficheCollaborateur';

/* ─── Helpers ─────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const getInitials = (nom = '', prenom = '') => `${nom[0] || ''}${prenom[0] || ''}`.toUpperCase();

/** Réponse API (Promise.allSettled) → tableau ; accepte aussi DRF { results }. */
const listFromSettled = (r) => {
  if (r.status !== 'fulfilled') return [];
  const v = r.value;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.results)) return v.results;
  return [];
};

const matriculeEgaux = (a, b) => {
  const sa = String(a ?? '').trim();
  const sb = String(b ?? '').trim();
  if (sa === sb) return true;
  const na = sa.replace(/^0+/, '') || '0';
  const nb = sb.replace(/^0+/, '') || '0';
  return na === nb;
};

/** Si l’API ne filtre pas par query param, on restreint côté client. */
function filtrerMaladiesChroniquesPourCollaborateur(rows, collaborateurId, matStr) {
  const idStr = collaborateurId != null ? String(collaborateurId).trim() : '';
  return (rows || []).filter((r) => {
    const fk = r.collaborateur ?? r.collaborateur_id;
    if (fk != null && typeof fk !== 'object' && String(fk) === idStr) return true;
    if (fk != null && typeof fk === 'object' && fk.id != null && String(fk.id) === idStr) return true;
    if (matriculeEgaux(r.collaborateur_matricule ?? r.matricule_collaborateur, matStr)) return true;
    return false;
  });
}

/** Demandes d'expertise : matricule ou liaison à une contre-visite de ce patient. */
const filterExpertisesPourHistorique = (expertises, mat, contrevisites) => {
  const cvIds = new Set((contrevisites || []).map((cv) => cv.id).filter((x) => x != null));
  return expertises.filter((e) => {
    const cvRef = e.contre_visite ?? e.contre_visite_id;
    if (cvRef != null && cvIds.has(cvRef)) return true;
    if (matriculeEgaux(e.collaborateur_matricule, mat)) return true;
    if (matriculeEgaux(e.matricule, mat)) return true;
    return false;
  });
};

/* ─── Palette — zéro violet ───────────────────────────── */
const P = {
  blue:      '#0284c7', blueDark: '#0369a1', blueDeep: '#0c4a6e',
  blueLight: '#e0f2fe', bluePale: '#f0f9ff', blueBdr: '#bae6fd',
  amber:     '#d97706', amberDark: '#92400e', amberBg: '#fff7ed',
  red:       '#dc2626', redDark: '#991b1b',  redBg:   '#fef2f2',
  cyan:      '#0891b2', cyanDark: '#164e63', cyanBg:  '#ecfeff', cyanBdr: '#a5f3fc',
  teal:      '#0d9488', tealDark: '#065f46', tealBg:  '#f0fdfa',
  rose:      '#e11d48', roseDark: '#9f1239', roseBg:  '#fff1f2',
  green:     '#16a34a', greenBg:  '#f0fdf4',
  muted:     '#64748b', text: '#0f172a',     border: '#e2e8f0',
  bg:        '#f8fafc', white: '#ffffff',
};

/* ─── Icônes SVG ──────────────────────────────────────── */
const IcoSearch   = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoClose    = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoCalendar = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoClock    = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoFile     = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoAlert    = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoSteth    = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19a7 7 0 007-7V7a4 4 0 00-8 0v5a4 4 0 008 0"/><circle cx="9" cy="20" r="2"/></svg>;
const IcoCheck    = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoHeart    = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;

/* ─── Onglets (pas de « Chronologie » : données par onglet dédié) ─── */
const TABS = [
  { key: 'contrevisites', label: 'Contre-visites',  accent: P.blue     },
  { key: 'at_mp',         label: 'AT / MP',         accent: P.amber    },
  { key: 'consultations', label: 'Consultations',   accent: P.cyan     },
  { key: 'maladies_chroniques', label: 'Maladies chroniques', accent: P.roseDark },
  { key: 'aptitude',      label: 'Fiches aptitude', accent: P.teal     },
  { key: 'expertises',    label: 'Expertises',      accent: P.blueDark },
];

/** Libellés / durées alignés sur les serializers backend (AccidentTravail / MaladieProfessionnelle) */
const titleAT = (a) =>
  [a.description, a.nature_lesion, a.type_accident, a.categorie_accident].find(Boolean) || 'Accident de travail';

const joursArretAT = (a) => {
  const t = a.total_jours_perdus ?? a.total_jour_perdu;
  if (t != null && t !== '' && Number(t) > 0) return `${t} j`;
  const r = (Number(a.repos_initial) || 0) + (Number(a.prolongation) || 0);
  return r > 0 ? `${r} j` : '—';
};

const titleMP = (m) => m.maladie || 'Maladie professionnelle';

const joursArretMP = (m) => {
  const t = m.repos_total;
  if (t != null && Number(t) > 0) return `${t} j`;
  const r = (Number(m.repos_initial) || 0) + (Number(m.prolongation) || 0) + (Number(m.rechute) || 0);
  return r > 0 ? `${r} j` : '—';
};

const dateMP = (m) => m.date_debut_maladie || m.date_declaration_service_medical || m.date_creation;

/* ─── UI atoms ────────────────────────────────────────── */
const Badge = ({ color, bg, bdr, children }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background: bg||P.blueLight, color: color||P.blueDark, border:`1px solid ${bdr||'transparent'}`, fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20, whiteSpace:'nowrap' }}>
    {children}
  </span>
);

const StatCard = ({ num, label, color, active, onClick }) => (
  <button onClick={onClick} style={{ background: active ? color : P.white, border:`1.5px solid ${active ? color : P.border}`, borderRadius:12, padding:'12px 10px', textAlign:'center', flex:1, cursor:'pointer', transition:'all .18s', boxShadow: active ? `0 4px 14px ${color}33` : 'none', outline:'none' }}>
    <div style={{ fontSize:22, fontWeight:800, color: active ? P.white : color, lineHeight:1 }}>{num}</div>
    <div style={{ fontSize:10.5, color: active ? `${P.white}bb` : P.muted, marginTop:4, fontWeight:600, lineHeight:1.3 }}>{label}</div>
  </button>
);

const TlItem = ({ dot, last, children }) => (
  <div style={{ display:'flex', gap:14, paddingBottom: last ? 0 : 16 }}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:24, flexShrink:0 }}>
      <div style={{ width:11, height:11, borderRadius:'50%', background:dot, marginTop:5, flexShrink:0, boxShadow:`0 0 0 3px ${dot}22` }} />
      {!last && <div style={{ width:1.5, flex:1, background:P.border, marginTop:5 }} />}
    </div>
    <div style={{ flex:1, background:P.white, border:`1.5px solid ${P.border}`, borderRadius:12, padding:'13px 16px', marginBottom: last ? 0 : 2 }}>
      {children}
    </div>
  </div>
);

const TlHead = ({ badge, badgeColor, badgeBg, title, date }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7, gap:8 }}>
    <div>
      <Badge color={badgeColor} bg={badgeBg}>{badge}</Badge>
      <div style={{ fontSize:13, fontWeight:700, color:P.blueDeep, marginTop:5 }}>{title}</div>
    </div>
    <div style={{ display:'flex', alignItems:'center', gap:4, color:P.muted, fontSize:11.5, flexShrink:0, marginTop:2 }}>
      <IcoCalendar /> {date}
    </div>
  </div>
);

const TlMeta = ({ children }) => <div style={{ fontSize:12.5, color:P.muted, lineHeight:1.65 }}>{children}</div>;
const TlTags = ({ children }) => <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>{children}</div>;
const Empty  = ({ text }) => (
  <div style={{ textAlign:'center', padding:'52px 20px' }}>
    <div style={{ fontSize:40, marginBottom:12, opacity:.12 }}>○</div>
    <div style={{ fontSize:13.5, fontWeight:700, color:'#94a3b8' }}>{text}</div>
  </div>
);
const SecTitle = ({ icon, color=P.blueDark, count, children }) => (
  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:16, fontSize:11, fontWeight:800, color, textTransform:'uppercase', letterSpacing:'.7px' }}>
    {icon}{children}
    {count!==undefined && <span style={{ background:P.blueLight, color:P.blueDark, fontSize:10.5, fontWeight:700, padding:'1px 8px', borderRadius:20 }}>{count}</span>}
  </div>
);

/* ════════════════ VUES PAR ONGLET ═══════════════════════ */

function TabContreVisites({ items }) {
  if (!items.length) return <Empty text="Aucune contre-visite enregistrée" />;
  return (
    <div>
      <SecTitle icon={<IcoFile />} count={items.length}>Contre-visites</SecTitle>
      <div style={{ background:P.white, borderRadius:14, border:`1.5px solid ${P.border}`, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
          <thead>
            <tr style={{ background:P.bluePale, borderBottom:`2px solid ${P.blueBdr}` }}>
              {['Date','Repos','À partir du','Département','Avis','Remarque'].map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:P.blueDark, textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((cv,i) => (
              <tr key={cv.id} style={{ borderBottom: i<items.length-1 ? `1px solid ${P.bluePale}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = P.bluePale}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding:'10px 14px', color:P.muted, fontWeight:600 }}>{fmt(cv.date)}</td>
                <td style={{ padding:'10px 14px' }}><Badge color={P.amberDark} bg={P.amberBg}>{cv.duree_repos}j</Badge></td>
                <td style={{ padding:'10px 14px', color:P.text }}>{fmt(cv.a_partir)}</td>
                <td style={{ padding:'10px 14px', color:P.blue, fontWeight:700 }}>{displayDepartementControleMedical(cv.controle_medical)||'—'}</td>
                <td style={{ padding:'10px 14px', color:P.muted, maxWidth:180 }}>
                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:170 }} title={cv.controle_medical?.avis_medecin_controleur}>
                    {cv.controle_medical?.avis_medecin_controleur || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>—</span>}
                  </div>
                </td>
                <td style={{ padding:'10px 14px', color:P.muted, maxWidth:140 }}>
                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }} title={cv.remarque}>
                    {cv.remarque || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabATMP({ accidents, maladies }) {
  if (!accidents.length && !maladies.length) return <Empty text="Aucun AT ni MP enregistré" />;
  return (
    <div>
      {accidents.length > 0 && (
        <>
          <SecTitle icon={<IcoAlert />} color={P.amberDark} count={accidents.length}>Accidents de travail</SecTitle>
          <div style={{ marginBottom:24 }}>
            {accidents.map((a,i) => (
              <TlItem key={a.id} dot={P.amber} last={i===accidents.length-1}>
                <TlHead badge="AT" badgeColor={P.amberDark} badgeBg={P.amberBg} title={titleAT(a)} date={fmt(a.date_accident||a.date)} />
                <TlMeta>Siège : {a.siege_lesion || '—'} · Arrêt : <strong>{joursArretAT(a)}</strong></TlMeta>
                {(a.lieu_accident || a.cause_accident) && (
                  <TlMeta>{a.lieu_accident && <>Lieu : {a.lieu_accident}</>}{a.lieu_accident && a.cause_accident ? ' · ' : ''}{a.cause_accident && <>Cause : {a.cause_accident}</>}</TlMeta>
                )}
                <TlTags>
                  {a.criticite && <Badge color={P.amberDark} bg={P.amberBg}>{a.criticite}</Badge>}
                  {a.type_accident && <Badge color={P.blueDark} bg={P.blueLight}>{a.type_accident}</Badge>}
                </TlTags>
              </TlItem>
            ))}
          </div>
        </>
      )}
      {maladies.length > 0 && (
        <>
          <SecTitle icon={<IcoAlert />} color={P.redDark} count={maladies.length}>Maladies professionnelles</SecTitle>
          {maladies.map((m,i) => (
            <TlItem key={m.id} dot={P.red} last={i===maladies.length-1}>
              <TlHead
                badge={`MP — Tableau ${m.code_tableau_cnam || '—'}`}
                badgeColor={P.redDark}
                badgeBg={P.redBg}
                title={titleMP(m)}
                date={fmt(dateMP(m))}
              />
              <TlMeta>Segment : {m.segment || '—'} · Arrêt : <strong>{joursArretMP(m)}</strong></TlMeta>
              {m.cause && <TlMeta>Cause : {m.cause}</TlMeta>}
              <TlTags>
                {m.decision_medecin && <Badge color={P.redDark} bg={P.redBg}>{m.decision_medecin}</Badge>}
                {m.nature_travail && <Badge color={P.blueDark} bg={P.blueLight}>{m.nature_travail}</Badge>}
              </TlTags>
            </TlItem>
          ))}
        </>
      )}
    </div>
  );
}

function TabConsultations({ items }) {
  if (!items.length) return <Empty text="Aucune consultation enregistrée" />;
  return (
    <div>
      <SecTitle icon={<IcoSteth />} color={P.cyanDark} count={items.length}>Consultations médicales</SecTitle>
      {items.map((c,i) => (
        <TlItem key={c.id} dot={P.cyan} last={i===items.length-1}>
          <TlHead badge="Consultation" badgeColor={P.cyanDark} badgeBg={P.cyanBg} title={c.motif||'Consultation médicale'} date={fmt(c.date_consultation||c.date)} />
          {c.diagnostic && <TlMeta>Diagnostic : {c.diagnostic}</TlMeta>}
          {c.remarque && <TlMeta>Remarque : {c.remarque}</TlMeta>}
          {c.medecin_nom && <TlTags><Badge color={P.cyanDark} bg={P.cyanBg} bdr={P.cyanBdr}>Dr. {c.medecin_nom}</Badge></TlTags>}
        </TlItem>
      ))}
    </div>
  );
}

function TabMaladiesChroniques({ items }) {
  if (!items.length) return <Empty text="Aucune maladie chronique enregistrée" />;
  const libelleType = (m) => {
    const t = m.type_maladie || '—';
    if (t === 'Autre' && (m.type_maladie_autre || '').trim()) return `Autre (${m.type_maladie_autre})`;
    return t;
  };
  return (
    <div>
      <SecTitle icon={<IcoHeart />} color={P.roseDark} count={items.length}>Maladies chroniques</SecTitle>
      {items.map((m, i) => (
        <TlItem key={m.id} dot={P.rose} last={i === items.length - 1}>
          <TlHead
            badge="Déclaration"
            badgeColor={P.roseDark}
            badgeBg={P.roseBg}
            title={libelleType(m)}
            date={fmt(m.date_declaration)}
          />
          {m.commentaire && <TlMeta>{m.commentaire}</TlMeta>}
          <TlTags>
            {m.infirmiere_nom && <Badge color={P.roseDark} bg={P.roseBg}>Inf. {m.infirmiere_nom}</Badge>}
            {m.collaborateur_nom && <Badge color={P.muted} bg={P.bg}>{m.collaborateur_nom}</Badge>}
          </TlTags>
        </TlItem>
      ))}
    </div>
  );
}

function TabAptitude({ items }) {
  if (!items.length) return <Empty text="Aucune fiche d'aptitude enregistrée" />;
  return (
    <div>
      <SecTitle icon={<IcoCheck />} color={P.tealDark} count={items.length}>Fiches d'aptitude</SecTitle>
      {items.map((f,i) => (
        <TlItem key={f.id} dot={P.teal} last={i===items.length-1}>
          <TlHead badge={f.type_visite||'Visite médicale'} badgeColor={P.tealDark} badgeBg={P.tealBg} title={`Aptitude : ${f.aptitude||'—'}`} date={fmt(f.date_visite)} />
          {f.precision_aptitude && <TlMeta>{f.precision_aptitude}</TlMeta>}
          <TlTags>
            <Badge color={f.aptitude==='APTE'?P.green:P.redDark} bg={f.aptitude==='APTE'?P.greenBg:P.redBg}>{f.aptitude||'—'}</Badge>
            {f.medecin_travail_nom && <Badge color={P.blueDark} bg={P.blueLight}>Dr. {f.medecin_travail_nom}</Badge>}
          </TlTags>
        </TlItem>
      ))}
    </div>
  );
}

function TabExpertises({ items }) {
  if (!items.length) return <Empty text="Aucune demande d'expertise enregistrée" />;
  return (
    <div>
      <SecTitle icon={<IcoFile />} count={items.length}>Demandes d'expertise</SecTitle>
      {items.map((e,i) => (
        <TlItem key={e.id} dot={P.blueDark} last={i===items.length-1}>
          <TlHead badge="Expertise" badgeColor={P.blueDark} badgeBg={P.blueLight} title={`DR : ${e.dr||'—'}`} date={fmt(e.date_demande)} />
          {e.collaborateur_nom && <TlMeta>Collaborateur : <strong>{e.collaborateur_nom} {e.collaborateur_prenom}</strong> · Matricule : {e.collaborateur_matricule||'—'}</TlMeta>}
          {e.poste && <TlMeta>Poste : {e.poste}</TlMeta>}
          {e.pieces_jointes && <TlMeta>Pièces : {e.pieces_jointes}</TlMeta>}
          {e.autres_missions && <TlMeta>Autres missions : {e.autres_missions}</TlMeta>}
        </TlItem>
      ))}
    </div>
  );
}

/* ════════════════ COMPOSANT PRINCIPAL ═══════════════════ */
export default function HistoriquePatient() {
  const [matricule, setMatricule] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [patient,   setPatient]   = useState(null);
  const [data,      setData]      = useState(null);
  const [activeTab, setActiveTab] = useState('contrevisites');

  const handleSearch = useCallback(async () => {
    const mat = matricule.trim();
    if (!mat) { setError('Veuillez saisir un matricule.'); return; }
    setError(''); setLoading(true); setPatient(null); setData(null); setActiveTab('contrevisites');
    try {
      const collabs = await searchCollaborateurs(mat);
      const collab  = collabs.find(c => String(c.matricule||'').trim()===mat) || collabs[0];
      if (!collab) { setError(`Aucun collaborateur trouvé pour le matricule "${mat}".`); setLoading(false); return; }
      setPatient(collab);
      const id = collab.id;
      const [cvs, ats, mps, cons, fichesRes, expsAll, mcSettled] = await Promise.allSettled([
        getContreVisitesByMatricule(mat), getAccidentsByCollaborateur(id),
        getMaladiesByCollaborateur(id),   getConsultationsByCollaborateur(id),
        getFichesParCollaborateur(id),    getDemandesExpertise(),
        getMaladiesChroniques({ collaborateur: id }),
      ]);
      const contrevisites = listFromSettled(cvs);
      const expertises = filterExpertisesPourHistorique(listFromSettled(expsAll), mat, contrevisites);
      let maladiesChroniques = listFromSettled(mcSettled);
      if (!maladiesChroniques.length) {
        try {
          const all = await getMaladiesChroniques();
          const arr = Array.isArray(all) ? all : (all?.results ?? []);
          maladiesChroniques = filtrerMaladiesChroniquesPourCollaborateur(arr, id, mat);
        } catch { maladiesChroniques = []; }
      }
      setData({
        contrevisites,
        accidents: listFromSettled(ats),
        maladies: listFromSettled(mps),
        consultations: listFromSettled(cons),
        maladiesChroniques,
        fiches: listFromSettled(fichesRes),
        expertises,
      });
    } catch { setError('Erreur lors du chargement des données.'); }
    finally  { setLoading(false); }
  }, [matricule]);

  const total = data
    ? data.contrevisites.length + data.accidents.length + data.maladies.length +
      data.consultations.length + data.maladiesChroniques.length + data.fiches.length + data.expertises.length
    : 0;

  const STATS = data ? [
    { key:'contrevisites', num:data.contrevisites.length,               label:'Contre-visites', color:P.blue     },
    { key:'at_mp',         num:data.accidents.length+data.maladies.length, label:'AT / MP',       color:P.amber    },
    { key:'consultations', num:data.consultations.length,               label:'Consultations',  color:P.cyan     },
    { key:'maladies_chroniques', num:data.maladiesChroniques.length,    label:'M. chroniques',   color:P.roseDark },
    { key:'aptitude',      num:data.fiches.length,                      label:'Aptitude',       color:P.teal     },
    { key:'expertises',    num:data.expertises.length,                  label:'Expertises',     color:P.blueDark },
  ] : [];

  return (
    <div style={{ width:'100%', minHeight:'100%', display:'flex', flexDirection:'column', background:P.bg }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .hp-search-btn:hover:not(:disabled) { background:${P.blueDark} !important; box-shadow:0 4px 14px ${P.blue}55 !important; transform:translateY(-1px); }
        .hp-clear-btn:hover  { background:${P.bluePale} !important; border-color:${P.blueBdr} !important; color:${P.blueDark} !important; }
        .hp-tab:hover        { color:${P.blue} !important; background:${P.bluePale} !important; }
        .hp-input:focus      { border-color:${P.blue} !important; box-shadow:0 0 0 3px ${P.blue}20 !important; }
        .hp-tr:hover         { background:${P.bluePale} !important; }
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{ background:`linear-gradient(135deg,#e0f7ff 0%,#bae6fd 50%,#7dd3fc 100%)`, borderBottom:`1.5px solid #7dd3fc`, padding:'20px 28px 18px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:`linear-gradient(135deg,${P.blue},${P.blueDark})`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', boxShadow:`0 3px 10px ${P.blue}44` }}>
            <IcoClock />
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:P.blueDeep, letterSpacing:'-.2px' }}>Historique Patient</div>
            <div style={{ fontSize:11.5, color:P.blueDark, marginTop:1 }}>Recherche par matricule — contre-visites, AT/MP, consultations, maladies chroniques, aptitude</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, position:'relative' }}>
            <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:P.muted, pointerEvents:'none', display:'flex' }}>
              <IcoSearch />
            </div>
            <input
              className="hp-input"
              value={matricule}
              onChange={e => setMatricule(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSearch()}
              placeholder="Matricule du collaborateur…"
              style={{ width:'100%', padding:'11px 14px 11px 40px', border:`1.5px solid ${P.blueBdr}`, borderRadius:10, fontSize:13.5, outline:'none', background:'white', color:P.text, fontFamily:'inherit', transition:'border-color .15s, box-shadow .15s', boxSizing:'border-box' }}
            />
          </div>

          <button className="hp-search-btn" onClick={handleSearch} disabled={loading}
            style={{ padding:'11px 22px', background:P.blue, color:'white', border:'none', borderRadius:10, fontSize:13.5, fontWeight:700, cursor: loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, transition:'all .18s', opacity: loading?.7:1, flexShrink:0, boxShadow:`0 2px 8px ${P.blue}44` }}>
            {loading ? <div style={{ width:15, height:15, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> : <IcoSearch />}
            {loading ? 'Chargement…' : 'Rechercher'}
          </button>

          {data && (
            <button className="hp-clear-btn"
              onClick={() => { setPatient(null); setData(null); setMatricule(''); setError(''); setActiveTab('contrevisites'); }}
              style={{ padding:'11px 16px', background:'white', color:P.muted, border:`1.5px solid ${P.border}`, borderRadius:10, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, flexShrink:0, transition:'all .15s' }}>
              <IcoClose /> Effacer
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop:10, background:P.redBg, border:`1px solid #fca5a5`, color:P.red, borderRadius:9, padding:'8px 13px', fontSize:12.5, display:'flex', alignItems:'center', gap:6 }}>
            <IcoAlert /> {error}
          </div>
        )}
      </div>

      {/* ══ EMPTY STATE ══ */}
      {!patient && !loading && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
          <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div style={{ fontSize:15, fontWeight:700, color:'#94a3b8' }}>Saisir un matricule pour afficher l'historique</div>
          <div style={{ fontSize:12.5, color:'#cbd5e1' }}>Contre-visites · AT/MP · Consultations · Maladies chroniques · Aptitude · Expertises</div>
        </div>
      )}

      {/* ══ RÉSULTATS ══ */}
      {patient && data && (
        <div style={{ flex:'1 1 auto', minHeight:0, display:'flex', flexDirection:'column', animation:'fadeUp .3s ease' }}>

          {/* Carte patient */}
          <div style={{ padding:'16px 28px', background:P.white, borderBottom:`1.5px solid ${P.border}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:48, height:48, borderRadius:13, background:`linear-gradient(135deg,${P.blue},${P.blueDeep})`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:15, fontWeight:800, flexShrink:0, boxShadow:`0 4px 12px ${P.blue}44` }}>
                {getInitials(patient.nom, patient.prenom)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:800, color:P.blueDeep }}>{patient.nom} {patient.prenom}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:5, fontSize:12, color:P.muted }}>
                  <span style={{ background:P.blueLight, color:P.blueDark, padding:'1px 9px', borderRadius:6, fontWeight:800, letterSpacing:'.3px' }}>{patient.matricule}</span>
                  {patient.department && <span>Dept : <strong style={{ color:P.text }}>{patient.department}</strong></span>}
                  {patient.poste && <span>Poste : <strong style={{ color:P.text }}>{patient.poste}</strong></span>}
                  {patient.date_embauche && <span>Embauche : <strong style={{ color:P.text }}>{fmt(patient.date_embauche)}</strong></span>}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:26, fontWeight:900, color:P.blue, lineHeight:1 }}>{total}</div>
                <div style={{ fontSize:11, color:P.muted, fontWeight:600 }}>événements</div>
              </div>
            </div>

            {/* Stats cliquables */}
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              {STATS.map(s => (
                <StatCard key={s.key} num={s.num} label={s.label} color={s.color}
                  active={activeTab===s.key} onClick={() => setActiveTab(s.key)} />
              ))}
            </div>
          </div>

          {/* Onglets */}
          <div style={{ display:'flex', borderBottom:`1.5px solid ${P.border}`, background:P.white, flexShrink:0, overflowX:'auto', paddingLeft:16 }}>
            {TABS.map(tab => (
              <button key={tab.key} className="hp-tab" onClick={() => setActiveTab(tab.key)}
                style={{ padding:'12px 16px', border:'none', background:'none', fontSize:12.5, fontWeight: activeTab===tab.key ? 800 : 500, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap', fontFamily:'inherit', color: activeTab===tab.key ? tab.accent : P.muted, borderBottom: activeTab===tab.key ? `2.5px solid ${tab.accent}` : '2.5px solid transparent', borderRadius:'4px 4px 0 0' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenu */}
          <div style={{ padding:'22px 28px 32px' }}>
            {activeTab==='contrevisites' && <TabContreVisites items={data.contrevisites} />}
            {activeTab==='at_mp'         && <TabATMP accidents={data.accidents} maladies={data.maladies} />}
            {activeTab==='consultations' && <TabConsultations items={data.consultations} />}
            {activeTab==='maladies_chroniques' && <TabMaladiesChroniques items={data.maladiesChroniques} />}
            {activeTab==='aptitude'      && <TabAptitude items={data.fiches} />}
            {activeTab==='expertises'    && <TabExpertises items={data.expertises} />}
          </div>
        </div>
      )}
    </div>
  );
}