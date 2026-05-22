// src/components/rh/ListesVisitesPeriodiquesRH.jsx
// Suivi des listes VP — redesign cohérent avec le thème bleu
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx-js-style/dist/xlsx.bundle.js';
import {
  getListesVisitesPeriodiques,
  soumettreListeVisitePeriodique,
  archiverListeVisitePeriodique,
  getLignesListePeriodique,
  notifierSmsVeilleListePeriodique,
  notifierLigneVisitePeriodiqueJourJ,
} from '../../api/visitesPeriodiquesApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { getCollaborateurById } from '../../api/actInfirmierApi';
import { getFicheAptitude } from '../../api/Medicalworkapi';
import { enrichLigneVisitePeriodique, sortLignesVisitePeriodique } from '../../utils/ligneVisitePeriodique';
import { isSmsVeilleEnvoye, isSmsJourJEnvoye } from '../../utils/contreVisiteSms';
import { SmsLigneBadge, SmsVeilleBadge } from '../contreVisite/SmsContreVisiteBadges';
import { pickDepartementCollaborateur } from '../../utils/ficheCollaborateur';
import { afficherReferenceListeVisitePeriodique } from '../../utils/referenceListeVisitePeriodique';
import Swal from 'sweetalert2';

const C = {
  primary: '#0284c7', primaryDark: '#0369a1', primaryDeep: '#0c4a6e',
  border: '#bae6fd', borderLight: '#e0f2fe', bg: '#f0f9ff', muted: '#64748b',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUT_CFG = {
  BROUILLON:     { bg: '#f1f5f9', color: '#475569', text: 'Brouillon',     dot: '#94a3b8' },
  SOUMISE:       { bg: '#dbeafe', color: '#1d4ed8', text: 'Soumise',       dot: '#3b82f6' },
  EN_TRAITEMENT: { bg: '#fef9c3', color: '#a16207', text: 'En traitement', dot: '#eab308' },
  CLOTUREE:      { bg: '#dcfce7', color: '#15803d', text: 'Clôturée',      dot: '#22c55e' },
  ARCHIVEE:      { bg: '#ede9fe', color: '#6d28d9', text: 'Archivée',      dot: '#8b5cf6' },
};

const IcoChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoClipboard = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const IcoSend = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcoArchive = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" rx="1" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

function relativeTimeFr(fromMs) {
  if (fromMs == null || Number.isNaN(fromMs)) return '—';
  const sec = Math.floor((Date.now() - fromMs) / 1000);
  if (sec < 10) return "à l'instant";
  if (sec < 60) return `il y a ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function pickMedecinListe(l) {
  if (!l || typeof l !== 'object') return null;
  const m = l.medecin_nom ?? l.medecinNom ?? (typeof l.medecin === 'string' ? l.medecin : null) ?? l.medecin?.nom ?? l.medecin?.username ?? l.medecin_assigne_nom ?? null;
  const s = m != null ? String(m).trim() : '';
  return s || null;
}

/** Liste exclue de l’onglet « Actives » (statut ARCHIVEE ou indicateurs archive côté API). */
function isListeArchiveePourRh(l) {
  if (!l || typeof l !== 'object') return false;
  const st = String(l.statut || '').toUpperCase();
  if (st === 'ARCHIVEE') return true;
  if (l.archivee === true || l.archived === true || l.est_archivee === true) return true;
  return false;
}

/** scope : actives = hors ARCHIVEE (données déjà filtrées au chargement) ; archivees = uniquement archivées (?archived=true). */
function filterByTab(listes, tab, scope) {
  if (!Array.isArray(listes)) return [];
  if (scope === 'archivees') return listes;
  if (tab === 'toutes') return listes;
  if (tab === 'attente') return listes.filter((x) => x.statut === 'BROUILLON' || x.statut === 'SOUMISE');
  if (tab === 'cloturees') return listes.filter((x) => x.statut === 'CLOTUREE' && !isListeArchiveePourRh(x));
  return listes;
}

function labelPresence(p) {
  if (p === 'PRESENT') return { text: 'Présent', bg: '#dcfce7', color: '#15803d' };
  if (p === 'ABSENT') return { text: 'Absent', bg: '#fef2f2', color: '#b91c1c' };
  return { text: 'Non renseignée', bg: '#f1f5f9', color: '#64748b' };
}

function labelAptitude(row) {
  const e = row.etat_embauche ?? row.etat_visite ?? row.etat_periodique ?? '';
  const fiche = row.fiche_aptitude_id ?? row.fiche_aptitude;
  if (e === 'APTE') return 'Apte';
  if (e === 'INAPTE') return 'Inapte';
  if (e && String(e).trim()) return String(e).replace(/_/g, ' ');
  if (fiche) return typeof fiche === 'object' ? `Fiche #${fiche.id ?? '—'}` : `Fiche #${fiche}`;
  return '—';
}

/** Identifiant fiche d’aptitude rattachée à la ligne VP (pour « Voir fiche »). */
function pickFicheIdLigne(row) {
  if (!row || typeof row !== 'object') return null;
  const raw = row.fiche_aptitude_id ?? row.fiche_aptitude ?? row.fiche_id;
  if (raw && typeof raw === 'object') {
    const id = raw.id ?? raw.pk;
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  }
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

/** Texte affiché dans la colonne Observations (ligne API + fiche imbriquée si présente). */
function pickObservationsLigneListeVp(row) {
  if (!row || typeof row !== 'object') return '';
  const candidates = [
    row.observations_complementaires,
    row.observations_medecin,
    row.observations_complementaire,
    row.observations_medecin_liste,
    row.observation,
    row.remarque_medecin,
    row.remarque_visite,
  ];
  for (const v of candidates) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  const fiche = row.fiche_aptitude;
  if (fiche && typeof fiche === 'object') {
    const oc =
      fiche.observations_complementaires ??
      fiche.observations_medecin ??
      fiche.observations_complementaire ??
      fiche.observation;
    if (oc != null && String(oc).trim() !== '') return String(oc).trim();
  }
  return '';
}

/** Complète les observations depuis la fiche API si la ligne n’a que l’id fiche (réponse liste allégée). */
async function enrichirObservationsDepuisFichesSiBesoin(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const needIds = new Set();
  for (const row of rows) {
    if (pickObservationsLigneListeVp(row)) continue;
    const fid = pickFicheIdLigne(row);
    if (fid != null && fid !== '') needIds.add(String(fid));
  }
  if (needIds.size === 0) return rows;
  const obsByFicheId = new Map();
  await Promise.all(
    [...needIds].map(async (idStr) => {
      try {
        const f = await getFicheAptitude(idStr);
        const t = f?.observations_complementaires ?? f?.observations_medecin ?? f?.observations_complementaire;
        if (t != null && String(t).trim() !== '') obsByFicheId.set(idStr, String(t).trim());
      } catch {
        /* ignore */
      }
    }),
  );
  if (obsByFicheId.size === 0) return rows;
  return rows.map((row) => {
    if (pickObservationsLigneListeVp(row)) return row;
    const fid = pickFicheIdLigne(row);
    if (fid == null || fid === '') return row;
    const t = obsByFicheId.get(String(fid));
    return t ? { ...row, observations_complementaires: t } : row;
  });
}

/** Export Excel — liste VP clôturée ou archivée (pas d’identifiant fiche, uniquement libellés). */
function exportListeVpClotureeVersExcel(liste, lignes) {
  const arr = Array.isArray(lignes) ? lignes : [];
  const refBase = afficherReferenceListeVisitePeriodique(liste);
  const dv = liste?.date_visite;
  const datePart =
    dv != null && dv !== ''
      ? (typeof dv === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dv) ? dv.slice(0, 10) : new Date(dv).toISOString().slice(0, 10))
      : 'sans_date';
  const rows = arr.map((row, i) => {
    const dept =
      row.departement
      || pickDepartementCollaborateur(row.collaborateur)
      || pickDepartementCollaborateur(row)
      || '';
    const pres = labelPresence(row.presence);
    return {
      'N°': i + 1,
      Nom: row.nom || '',
      Prénom: row.prenom || '',
      Matricule: row.matricule || '',
      Département: dept === '—' ? '' : String(dept),
      Présence: pres.text,
      'SMS jour J': isSmsJourJEnvoye(row) ? 'Oui' : 'Non',
      Observations: pickObservationsLigneListeVp(row) || '',
      'Suivi / aptitude': labelAptitude(row),
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 11 }, { wch: 40 }, { wch: 22 },
  ];
  const HEADER_BLUE = 'FF0284c7';
  const HEADER_FONT = 'FFFFFFFF';
  const headers = Object.keys(rows[0] || {});
  headers.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      fill: { patternType: 'solid', fgColor: { rgb: HEADER_BLUE } },
      font: { bold: true, color: { rgb: HEADER_FONT }, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Visites périodiques');
  const safe = String(refBase).replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `VP_${safe}_${datePart}.xlsx`);
}

async function enrichirDepartementsDepuisRh(lignesEnriched) {
  const pks = [...new Set(
    lignesEnriched.filter((row) => !String(row.departement || '').trim())
      .map((row) => row.collaborateurPk ?? row.collaborateur_id)
      .filter((id) => id != null && id !== '' && !Number.isNaN(Number(id))),
  )].map(Number);
  if (!pks.length) return lignesEnriched;
  const deptParPk = new Map();
  await Promise.all(pks.map(async (pk) => {
    try { deptParPk.set(pk, pickDepartementCollaborateur(await getCollaborateurById(pk))); }
    catch { deptParPk.set(pk, ''); }
  }));
  return lignesEnriched.map((row) => {
    if (String(row.departement || '').trim()) return row;
    const pk = row.collaborateurPk ?? row.collaborateur_id;
    if (pk == null) return row;
    const d = deptParPk.get(Number(pk));
    return d ? { ...row, departement: d } : row;
  });
}

function extractCollaborateurIdsFromLignes(rows) {
  if (!Array.isArray(rows)) return [];
  const out = new Set();
  rows.forEach((row) => {
    const pk = row?.collaborateurPk ?? row?.collaborateur_id;
    if (pk != null && pk !== '') { const n = Number(pk); if (!Number.isNaN(n)) out.add(n); }
  });
  return [...out];
}

const StatutBadge = ({ statut }) => {
  const cfg = STATUT_CFG[statut] || STATUT_CFG.BROUILLON;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, color: cfg.color, fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.text}
    </span>
  );
};

export default function ListesVisitesPeriodiquesRH({
  embedded = false,
  onListeSoumiseCollaborateurs,
  onOpenFiche,
  /** Appelé après chaque chargement des listes (sync « À planifier » côté parent). */
  onListesFetchDone,
}) {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [tick, setTick] = useState(0);
  const [scopeTab, setScopeTab] = useState('actives');
  const [filterTab, setFilterTab] = useState('attente');
  const [expandedId, setExpandedId] = useState(null);
  const [lignesCache, setLignesCache] = useState({});
  const [lignesLoadingId, setLignesLoadingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);
  const [veilleBusyId, setVeilleBusyId] = useState(null);
  const [jourJBusyId, setJourJBusyId] = useState(null);
  const [exportExcelBusyId, setExportExcelBusyId] = useState(null);

  /**
   * @param {string} [overrideScope] — forcer le périmètre (ex. après archivage : 'archivees') sans attendre
   *   le prochain rendu ; sinon évite le bug où `await load()` après `setScopeTab` recharge encore l’ancien onglet.
   */
  const fetchListes = useCallback(async (overrideScope) => {
    const scope = overrideScope != null && overrideScope !== '' ? overrideScope : scopeTab;
    setLoading(true); setMsg('');
    try {
      if (scope === 'archivees') {
        setListes(await getListesVisitesPeriodiques({ archived: true }));
      } else {
        const all = await getListesVisitesPeriodiques({});
        setListes(all.filter((l) => !isListeArchiveePourRh(l)));
      }
      setLastRefreshAt(Date.now());
    } catch {
      setListes([]); setMsg('Impossible de charger les listes (vérifiez le backend).');
    } finally {
      setLoading(false);
      try {
        onListesFetchDone?.();
      } catch {
        /* no-op */
      }
    }
  }, [scopeTab, onListesFetchDone]);

  useEffect(() => { fetchListes(); }, [fetchListes]);
  useEffect(() => { const id = setInterval(() => setTick((n) => n + 1), 60000); return () => clearInterval(id); }, []);

  const sorted = useMemo(() => [...listes].sort((a, b) => new Date(b.date_creation || b.date_visite || 0) - new Date(a.date_creation || a.date_visite || 0)), [listes]);
  const filtered = useMemo(() => filterByTab(sorted, filterTab, scopeTab), [sorted, filterTab, scopeTab]);
  const metaRefresh = useMemo(() => (lastRefreshAt ? relativeTimeFr(lastRefreshAt) : '—'), [lastRefreshAt, tick]);

  const toggleExpand = async (liste) => {
    if (expandedId === liste.id) { setExpandedId(null); return; }
    setExpandedId(liste.id);
    if (lignesCache[liste.id]) return;
    setLignesLoadingId(liste.id);
    try {
      const raw = await getLignesListePeriodique(liste.id);
      const arr = Array.isArray(raw) ? raw : [];
      const enriched = arr.map((l) => enrichLigneVisitePeriodique(l));
      const withDept = await enrichirDepartementsDepuisRh(enriched);
      const withObs = await enrichirObservationsDepuisFichesSiBesoin(withDept);
      const ordered = sortLignesVisitePeriodique(withObs);
      setLignesCache((prev) => ({ ...prev, [liste.id]: ordered }));
    } catch { setLignesCache((prev) => ({ ...prev, [liste.id]: [] })); }
    finally { setLignesLoadingId(null); }
  };

  const handleNotifierVeille = async (liste, e) => {
    e?.stopPropagation?.();
    if (!liste?.id || veilleBusyId === liste.id) return;
    setVeilleBusyId(liste.id);
    try {
      const res = await notifierSmsVeilleListePeriodique(liste.id);
      await fetchListes();
      const extra = res != null && typeof res === 'object' && res.sms_count != null
        ? ` (${res.sms_count} SMS)`
        : '';
      await Swal.fire({
        icon: 'success',
        title: 'SMS veille (J−1)',
        text: `Demande traitée par le serveur.${extra}`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'SMS veille',
        text: formatAxiosError(err) || err?.message || 'Échec.',
      });
    } finally {
      setVeilleBusyId(null);
    }
  };

  const handleSoumettre = async (id, e) => {
    e?.stopPropagation?.();
    setBusyId(id); setMsg('');
    const cached = lignesCache[id];
    const listeObj = listes.find((x) => x.id === id);
    const dv = listeObj?.date_visite != null && String(listeObj.date_visite).trim() !== ''
      ? String(listeObj.date_visite).trim().slice(0, 10)
      : '';
    try {
      await soumettreListeVisitePeriodique(id, dv ? { date_visite: dv } : {});
      await fetchListes();
      let ids = extractCollaborateurIdsFromLignes(cached);
      if (!ids.length) {
        try { const raw = await getLignesListePeriodique(id); ids = extractCollaborateurIdsFromLignes(Array.isArray(raw) ? raw.map((l) => enrichLigneVisitePeriodique(l)) : []); }
        catch { ids = []; }
      }
      onListeSoumiseCollaborateurs?.(ids);
      setLignesCache((prev) => { const next = { ...prev }; delete next[id]; return next; });
    } catch { setMsg("Échec de l'envoi à l'infirmier."); }
    finally { setBusyId(null); }
  };

  const handleArchiver = async (liste, e) => {
    e?.stopPropagation?.();
    if (liste?.statut !== 'CLOTUREE') return;
    const ref = afficherReferenceListeVisitePeriodique(liste);
    const { isConfirmed } = await Swal.fire({
      title: `Archiver la liste ${ref} ?`,
      text: "Elle ne sera plus visible pour l'infirmier ni le médecin du travail, et apparaîtra dans l'onglet « Archivées ».",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Archiver',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#4338ca',
      cancelButtonColor: '#64748b',
      customClass: { popup: 'swal2-vp-rh' },
      buttonsStyling: true,
    });
    if (!isConfirmed) return;
    setArchivingId(liste.id); setMsg('');
    try {
      await archiverListeVisitePeriodique(liste.id);
      setExpandedId((cur) => (cur === liste.id ? null : cur));
      setLignesCache((prev) => { const next = { ...prev }; delete next[liste.id]; return next; });
      setScopeTab('archivees');
      setFilterTab('toutes');
      await fetchListes('archivees');
    } catch (err) {
      const d = err?.response?.data;
      setMsg(d?.detail || d?.error || "Échec de l'archivage (vérifiez le backend : PATCH …/archiver/).");
    } finally {
      setArchivingId(null);
    }
  };

  const FILTERS_ACTIVES = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'attente', label: 'En attente' },
    { key: 'cloturees', label: 'Clôturées' },
  ];
  /** Alias historique : évite ReferenceError si une référence `FILTERS` subsiste (HMR / copie locale). */
  const FILTERS = FILTERS_ACTIVES;

  const handleExportExcelVp = async (liste) => {
    if (!liste?.id || (liste.statut !== 'CLOTUREE' && liste.statut !== 'ARCHIVEE')) return;
    setExportExcelBusyId(liste.id);
    try {
      let lignes = lignesCache[liste.id];
      if (!lignes || lignes.length === 0) {
        const raw = await getLignesListePeriodique(liste.id);
        const arr = Array.isArray(raw) ? raw : [];
        const enriched = arr.map((x) => enrichLigneVisitePeriodique(x));
        const withDept = await enrichirDepartementsDepuisRh(enriched);
        const withObs = await enrichirObservationsDepuisFichesSiBesoin(withDept);
        lignes = sortLignesVisitePeriodique(withObs);
        setLignesCache((prev) => ({ ...prev, [liste.id]: lignes }));
      }
      if (!lignes.length) {
        await Swal.fire({ icon: 'info', title: 'Export Excel', text: 'Aucune ligne à exporter.' });
        return;
      }
      exportListeVpClotureeVersExcel(liste, lignes);
      await Swal.fire({
        icon: 'success',
        title: 'Export Excel',
        text: 'Le fichier a été téléchargé.',
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Export Excel',
        text: formatAxiosError(err) || err?.message || 'Impossible de générer le fichier.',
      });
    } finally {
      setExportExcelBusyId(null);
    }
  };

  const handleNotifierJourJ = async (listeId, row, ev) => {
    ev?.stopPropagation?.();
    if (!row?.id || jourJBusyId === row.id) return;
    setJourJBusyId(row.id);
    try {
      await notifierLigneVisitePeriodiqueJourJ(row.id);
      const lid = listeId;
      if (lid != null) {
        setLignesCache((prev) => { const next = { ...prev }; delete next[lid]; return next; });
        try {
          const raw = await getLignesListePeriodique(lid);
          const arr = Array.isArray(raw) ? raw : [];
          const enriched = arr.map((x) => enrichLigneVisitePeriodique(x));
          const withDept = await enrichirDepartementsDepuisRh(enriched);
          const withObs = await enrichirObservationsDepuisFichesSiBesoin(withDept);
          setLignesCache((prev) => ({ ...prev, [lid]: sortLignesVisitePeriodique(withObs) }));
        } catch { /* ignore */ }
      }
      await Swal.fire({ icon: 'success', title: 'SMS jour J', text: 'Demande traitée.', timer: 1800, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'SMS jour J', text: formatAxiosError(err) || err?.message || 'Échec.' });
    } finally {
      setJourJBusyId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, paddingBottom: 8 }}>

      {/* En-tête standalone (non embedded) */}
      {!embedded && (
        <div style={{ borderRadius: 14, border: `1.5px solid ${C.border}`, overflow: 'hidden', background: 'white', boxShadow: '0 4px 20px rgba(14,165,233,.12)', flexShrink: 0 }}>
          <div style={{ padding: '14px 18px', background: `linear-gradient(135deg, ${C.bg}, #e0f2fe)`, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IcoClipboard />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.primaryDeep }}>Listes de visites périodiques</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                  Ces listes sont <strong>distinctes</strong> des listes d&apos;embauche. Soumettez un brouillon à l&apos;infirmier pour organiser le passage médecin.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
          {msg}
        </div>
      )}

      {/* Portée Actives / Archivées + filtres (actives) + actualiser */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, background: '#e2e8f0', borderRadius: 10, padding: 4 }}>
            {[
              { key: 'actives', label: 'Actives' },
              { key: 'archivees', label: 'Archivées' },
            ].map(({ key, label }) => {
              const active = scopeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setScopeTab(key); setExpandedId(null); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 7,
                    border: 'none',
                    background: active ? 'white' : 'transparent',
                    color: active ? C.primaryDeep : C.muted,
                    fontWeight: active ? 800 : 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                    transition: 'all .12s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {scopeTab === 'actives' && (
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
              {FILTERS_ACTIVES.map(({ key, label }) => {
                const active = filterTab === key;
                return (
                  <button key={key} type="button"
                    onClick={() => { setFilterTab(key); setExpandedId(null); }}
                    style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: active ? 'white' : 'transparent', color: active ? C.primaryDeep : C.muted, fontWeight: active ? 800 : 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .12s' }}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Dernière mise à jour : {metaRefresh}</span>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => fetchListes()} disabled={loading}
            style={{ padding: 0, border: 'none', background: 'none', color: loading ? '#cbd5e1' : C.primary, fontWeight: 700, fontSize: 11.5, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', textDecoration: loading ? 'none' : 'underline', textUnderlineOffset: 2 }}>
            Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 240, borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${C.border}`, background: 'white', boxShadow: '0 4px 22px rgba(14,165,233,.10)' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 580 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, #e0f2fe, #bae6fd)`, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ width: 36, padding: '10px 8px' }} aria-hidden />
                {['Référence', 'Date visite', 'Collaborateurs', 'Médecin assigné', 'SMS veille', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 800, color: C.primaryDeep, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center', color: C.muted, fontSize: 13 }}>Chargement…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 36, textAlign: 'center', color: C.muted, fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>📋</div>
                    {scopeTab === 'archivees'
                      ? 'Aucune liste archivée.'
                      : filterTab === 'attente'
                        ? 'Aucune liste en attente (brouillon ou soumise).'
                        : filterTab === 'cloturees'
                          ? 'Aucune liste clôturée (non archivée).'
                          : "Aucune liste pour l'instant."}
                  </td>
                </tr>
              )}
              {!loading && filtered.map((l, rowIdx) => {
                const n = l.nombre_lignes ?? l.nombre_candidats ?? '—';
                const med = pickMedecinListe(l);
                const isClosed = l.statut === 'CLOTUREE' || l.statut === 'ARCHIVEE';
                const open = expandedId === l.id;
                const lignes = lignesCache[l.id];
                const loadingLines = lignesLoadingId === l.id;

                return (
                  <React.Fragment key={l.id}>
                    <tr
                      role="button" tabIndex={0}
                      onClick={() => toggleExpand(l)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(l); } }}
                      style={{
                        borderBottom: `1px solid ${C.borderLight}`,
                        background: open ? '#f0f9ff' : (isClosed ? '#f8fafc' : (rowIdx % 2 === 0 ? 'white' : '#fafcff')),
                        opacity: isClosed ? 0.72 : 1,
                        cursor: 'pointer',
                        transition: 'background .12s',
                      }}
                    >
                      <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <IcoChevron open={open} />
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-block', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: C.primaryDeep, background: `linear-gradient(135deg, ${C.bg}, #e0f2fe)`, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px' }}>
                          {afficherReferenceListeVisitePeriodique(l)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{fmtDate(l.date_visite)}</td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 12, color: C.primaryDeep, background: C.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>
                          {n}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontSize: 12 }}>
                        {med ? (
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{/^dr\.?\s/i.test(med) ? med : `Dr. ${med}`}</span>
                        ) : (
                          <span style={{ color: C.muted, fontStyle: 'italic', fontSize: 11.5 }}>Non assigné</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <SmsVeilleBadge liste={l} />
                          {(l.statut === 'SOUMISE' || l.statut === 'EN_TRAITEMENT') && !isSmsVeilleEnvoye(l) && (
                            <button
                              type="button"
                              onClick={(ev) => handleNotifierVeille(l, ev)}
                              disabled={veilleBusyId === l.id}
                              title="Demander l’envoi du SMS veille (J−1) — nécessite une route sur le serveur"
                              style={{
                                padding: '4px 10px',
                                borderRadius: 7,
                                border: `1px solid ${C.border}`,
                                background: veilleBusyId === l.id ? '#f1f5f9' : 'white',
                                color: C.primaryDark,
                                fontSize: 10,
                                fontWeight: 800,
                                fontFamily: 'inherit',
                                cursor: veilleBusyId === l.id ? 'wait' : 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {veilleBusyId === l.id ? '…' : 'SMS veille'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <StatutBadge statut={l.statut} />
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {l.statut === 'BROUILLON' && (
                            <button type="button" onClick={(e) => handleSoumettre(l.id, e)} disabled={busyId === l.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: busyId === l.id ? '#e5e7eb' : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: 'white', cursor: busyId === l.id ? 'wait' : 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', boxShadow: busyId === l.id ? 'none' : '0 2px 8px rgba(2,132,199,.25)' }}>
                              <IcoSend />{busyId === l.id ? '…' : "Envoyer"}
                            </button>
                          )}
                          {(l.statut === 'CLOTUREE' || l.statut === 'ARCHIVEE') && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleExportExcelVp(l); }}
                              disabled={exportExcelBusyId === l.id}
                              title="Télécharger les lignes de la liste en Excel"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 11px',
                                borderRadius: 8,
                                border: '1px solid #86efac',
                                background: exportExcelBusyId === l.id ? '#f1f5f9' : '#ecfdf5',
                                color: exportExcelBusyId === l.id ? '#94a3b8' : '#15803d',
                                cursor: exportExcelBusyId === l.id ? 'wait' : 'pointer',
                                fontSize: 11,
                                fontWeight: 800,
                                fontFamily: 'inherit',
                              }}
                            >
                              {exportExcelBusyId === l.id ? '…' : 'Export Excel'}
                            </button>
                          )}
                          {scopeTab === 'actives' && l.statut === 'CLOTUREE' && !isListeArchiveePourRh(l) && (
                            <button
                              type="button"
                              onClick={(e) => handleArchiver(l, e)}
                              disabled={archivingId === l.id}
                              title="Retire la liste des écrans infirmier et médecin"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 11px',
                                borderRadius: 8,
                                border: '1px solid #c7d2fe',
                                background: archivingId === l.id ? '#e0e7ff' : '#eef2ff',
                                color: '#4338ca',
                                cursor: archivingId === l.id ? 'wait' : 'pointer',
                                fontSize: 11,
                                fontWeight: 800,
                                fontFamily: 'inherit',
                                opacity: archivingId === l.id ? 0.85 : 1,
                              }}
                            >
                              <IcoArchive />{archivingId === l.id ? '…' : 'Archiver'}
                            </button>
                          )}
                          {l.statut !== 'BROUILLON' && l.statut !== 'CLOTUREE' && l.statut !== 'ARCHIVEE' && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Sous-tableau collaborateurs */}
                    {open && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={8} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ padding: '14px 18px 16px', background: 'linear-gradient(180deg, #f0f9ff, #ffffff)' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.primaryDeep, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ color: C.primary }}><IcoClipboard /></span> Collaborateurs de la liste
                            </div>
                            {isSmsVeilleEnvoye(l) && (
                              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#ecfdf5', border: '1px solid #bbf7d0', fontSize: 11.5, fontWeight: 600, color: '#065f46' }}>
                                Rappel SMS veille (J−1) enregistré côté serveur pour cette liste.
                              </div>
                            )}
                            {loadingLines && <div style={{ padding: '12px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Chargement des lignes…</div>}
                            {!loadingLines && (!lignes || lignes.length === 0) && (
                              <div style={{ padding: '12px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Aucune ligne ou données indisponibles.</div>
                            )}
                            {!loadingLines && lignes && lignes.length > 0 && (
                              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ background: '#e0f2fe' }}>
                                      {['Nom', 'Prénom', 'Matricule', 'Département', 'Présence', 'SMS jour J', 'Observations', 'Suivi / aptitude'].map((h) => (
                                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 9, fontWeight: 800, color: C.primaryDeep, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lignes.map((row, j) => {
                                      const dept = row.departement || pickDepartementCollaborateur(row.collaborateur) || pickDepartementCollaborateur(row) || '—';
                                      const pres = labelPresence(row.presence);
                                      const ficheId = pickFicheIdLigne(row);
                                      const obsText = pickObservationsLigneListeVp(row);
                                      return (
                                        <tr key={row.id ?? j} style={{ borderBottom: j < lignes.length - 1 ? `1px solid ${C.borderLight}` : 'none', background: j % 2 === 0 ? 'white' : '#fafcff' }}>
                                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{row.nom || '—'}</td>
                                          <td style={{ padding: '8px 10px', color: '#334155' }}>{row.prenom || '—'}</td>
                                          <td style={{ padding: '8px 10px', fontFamily: 'ui-monospace,monospace', color: C.primary, fontSize: 11.5 }}>{row.matricule || '—'}</td>
                                          <td style={{ padding: '8px 10px', color: '#475569' }}>{dept}</td>
                                          <td style={{ padding: '8px 10px' }}>
                                            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: pres.bg, color: pres.color }}>{pres.text}</span>
                                          </td>
                                          <td style={{ padding: '8px 10px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                              <SmsLigneBadge ligne={row} />
                                              {l.statut !== 'ARCHIVEE' && row?.id != null && (
                                                <button
                                                  type="button"
                                                  onClick={(ev) => handleNotifierJourJ(l.id, row, ev)}
                                                  disabled={jourJBusyId === row.id}
                                                  title="Renvoyer le SMS jour J pour cette ligne"
                                                  style={{
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    border: `1px solid ${C.border}`,
                                                    background: jourJBusyId === row.id ? '#f1f5f9' : 'white',
                                                    color: C.primaryDark,
                                                    fontSize: 9.5,
                                                    fontWeight: 800,
                                                    fontFamily: 'inherit',
                                                    cursor: jourJBusyId === row.id ? 'wait' : 'pointer',
                                                    whiteSpace: 'nowrap',
                                                  }}
                                                >
                                                  {jourJBusyId === row.id ? '…' : 'Renvoyer SMS'}
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                          <td
                                            style={{
                                              padding: '8px 10px',
                                              color: obsText ? '#334155' : '#94a3b8',
                                              fontStyle: obsText ? 'normal' : 'italic',
                                              fontSize: 11.5,
                                              lineHeight: 1.45,
                                              maxWidth: 240,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 3,
                                              WebkitBoxOrient: 'vertical',
                                              verticalAlign: 'top',
                                            }}
                                            title={obsText || undefined}
                                          >
                                            {obsText || '—'}
                                          </td>
                                          <td style={{ padding: '8px 10px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                                            {ficheId ? (
                                              <button
                                                type="button"
                                                onClick={() => onOpenFiche?.({ ...row, fiche_aptitude_id: ficheId, derniere_fiche_id: ficheId })}
                                                disabled={!onOpenFiche}
                                                title={onOpenFiche ? 'Ouvrir la fiche d’aptitude' : undefined}
                                                style={{
                                                  padding: '5px 11px',
                                                  borderRadius: 8,
                                                  border: `1px solid ${onOpenFiche ? C.border : '#e2e8f0'}`,
                                                  background: onOpenFiche ? C.bg : '#f8fafc',
                                                  color: onOpenFiche ? C.primary : '#cbd5e1',
                                                  cursor: onOpenFiche ? 'pointer' : 'not-allowed',
                                                  fontWeight: 700,
                                                  fontSize: 11,
                                                  fontFamily: 'inherit',
                                                }}
                                              >
                                                Voir fiche
                                              </button>
                                            ) : (
                                              <span style={{ color: '#334155', fontSize: 12 }}>{labelAptitude(row)}</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}