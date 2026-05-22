// src/components/rh/SurveillanceSpecialeRHPage.jsx — RH : listes surveillance médicale spéciale (SMS)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx-js-style/dist/xlsx.bundle.js';
import {
  getListesSurveillanceSpeciale,
  getListeSurveillanceSpecialeDetail,
  createListeSurveillanceSpeciale,
  patchListeSurveillanceSpeciale,
  archiverListeSurveillanceSpeciale,
  deleteListeSurveillanceSpeciale,
  getLignesSurveillanceSpeciale,
  createLigneSurveillanceSpeciale,
  deleteLigneSurveillanceSpeciale,
  soumettreListeSurveillanceSpeciale,
  notifierVeilleListeSurveillanceSpeciale,
  parseRapportListeSmsSurveillance,
} from '../../api/surveillanceSpecialeApi';
import { getFicheAptitude, getFichesParCollaborateur, getFichesParMatricule } from '../../api/Medicalworkapi';
import { normalizeLigneVisitePeriodique } from '../../utils/ligneVisitePeriodique';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { printHTML } from '../../utils/printHelper';
import { buildFicheAptitudePrintHtml } from '../../utils/fichePrintTemplate';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { isSmsVeilleEnvoye, isSmsJourJEnvoye } from '../../utils/contreVisiteSms';
import { SmsVeilleBadge, SmsLigneBadge } from '../contreVisite/SmsContreVisiteBadges';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const MOIS_FILTRE = [
  { n: 1, lbl: 'Janvier' }, { n: 2, lbl: 'Février' }, { n: 3, lbl: 'Mars' }, { n: 4, lbl: 'Avril' },
  { n: 5, lbl: 'Mai' }, { n: 6, lbl: 'Juin' }, { n: 7, lbl: 'Juillet' }, { n: 8, lbl: 'Août' },
  { n: 9, lbl: 'Septembre' }, { n: 10, lbl: 'Octobre' }, { n: 11, lbl: 'Novembre' }, { n: 12, lbl: 'Décembre' },
];

/** Filtre archives RH : année et/ou mois sur date_visite (même logique que listes d’embauche). */
function archiveListeMatchesDate(l, annee, mois) {
  const a = annee === '' || annee == null ? null : Number(annee);
  const m = mois === '' || mois == null ? null : Number(mois);
  if (a == null && m == null) return true;
  if (!l.date_visite) return false;
  const d = new Date(l.date_visite);
  if (Number.isNaN(d.getTime())) return false;
  if (a != null && d.getFullYear() !== a) return false;
  if (m != null && d.getMonth() + 1 !== m) return false;
  return true;
}

const ANNEE_MIN_ARCHIVES_RH = 2026;

function visiteArchiveRHAffichable(l) {
  if (!l.date_visite) return true;
  const d = new Date(l.date_visite);
  if (Number.isNaN(d.getTime())) return true;
  return d.getFullYear() >= ANNEE_MIN_ARCHIVES_RH;
}

const IcoArchive = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" rx="1" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

/** Valeur pour <input type="date" /> (AAAA-MM-JJ). */
function toInputDate(val) {
  if (val == null || val === '') return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

const STATUTS = {
  BROUILLON: { label: 'Brouillon', bg: '#f1f5f9', color: '#475569' },
  SOUMISE: { label: 'Soumise', bg: '#f1f5f9', color: '#475569' },
  EN_TRAITEMENT: { label: 'En traitement', bg: '#fef9c3', color: '#a16207' },
  CLOTUREE: { label: 'Clôturée', bg: '#dcfce7', color: '#15803d' },
  ARCHIVEE: { label: 'Archivée', bg: '#ede9fe', color: '#6d28d9' },
};

function StatutBadge({ statut }) {
  const s = STATUTS[statut] || { label: statut || '—', bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function ligneNomComplet(l) {
  if (l.collaborateur_nom) return l.collaborateur_nom;
  if (l.nom_prenom) return l.nom_prenom;
  const n = [l.nom, l.prenom].filter(Boolean).join(' ').trim();
  return n || '—';
}

function ligneMatricule(l) {
  return l.collaborateur_matricule || l.matricule || '—';
}

function traitementTermine(l) {
  return l.traitement_termine === true || l.traitement_termine === 'true' || l.traitement_fini === true;
}

/** Extrait un pk fiche (nombre ou id en fin d’URL DRF) depuis les formes API courantes. */
function extractPkFromFicheLike(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (/^\d+$/.test(t)) return Number(t);
    const m = t.match(/\/(\d+)\/?(?:\?|#|$)/);
    if (m) {
      const n = Number(m[1]);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
  if (typeof raw === 'object') {
    const id = raw.id ?? raw.pk;
    if (id != null && id !== raw) return extractPkFromFicheLike(id);
    for (const k of ['url', 'href']) {
      const u = raw[k];
      if (typeof u === 'string') {
        const p = extractPkFromFicheLike(u);
        if (p != null) return p;
      }
    }
  }
  return null;
}

function pickFicheIdLigneSurv(row) {
  if (!row || typeof row !== 'object') return null;
  const sources = [
    row.fiche_aptitude_id,
    row.derniere_fiche_id,
    row.fiche_id,
    row.fiche_visite_id,
    row.fiche_aptitude,
    row.resultat_fiche_aptitude,
    row.derniere_fiche,
    row.fiche,
    row.visite,
  ];
  for (const s of sources) {
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const nested = s.fiche_aptitude_id ?? s.fiche_aptitude ?? s.fiche_id ?? s.fiche;
      const pkNested = extractPkFromFicheLike(nested);
      if (pkNested != null) return pkNested;
    }
    const pk = extractPkFromFicheLike(s);
    if (pk != null) return pk;
  }
  const vis = row.visite;
  if (vis && typeof vis === 'object') {
    const pk = extractPkFromFicheLike(vis.fiche_aptitude_id ?? vis.fiche_aptitude);
    if (pk != null) return pk;
  }
  return null;
}

/**
 * Fiche explicitement liée à la ligne SMS / visite (pas la « dernière fiche » globale du collaborateur).
 * Sert à l’UI « Voir fiche » : évite d’afficher une ancienne fiche avant examen médecin.
 */
function pickFicheIdLigneSmsLieeVisite(row) {
  if (!row || typeof row !== 'object') return null;
  const sources = [
    row.fiche_aptitude_id,
    row.fiche_id,
    row.fiche_visite_id,
    row.fiche_aptitude,
    row.resultat_fiche_aptitude,
    row.visite,
  ];
  for (const s of sources) {
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const nested = s.fiche_aptitude_id ?? s.fiche_aptitude ?? s.fiche_id ?? s.fiche;
      const pkNested = extractPkFromFicheLike(nested);
      if (pkNested != null) return pkNested;
    }
    const pk = extractPkFromFicheLike(s);
    if (pk != null) return pk;
  }
  const vis = row.visite;
  if (vis && typeof vis === 'object') {
    const pk = extractPkFromFicheLike(vis.fiche_aptitude_id ?? vis.fiche_aptitude);
    if (pk != null) return pk;
  }
  return null;
}

/** Fiche imprimable côté RH : après traitement médecin, ou dès que l’API lie une fiche à cette ligne. */
function peutAfficherFicheAptitudeSms(ligne) {
  if (!ligne || typeof ligne !== 'object') return false;
  if (traitementTermine(ligne)) return true;
  return pickFicheIdLigneSmsLieeVisite(ligne) != null;
}

function sameVisiteDay(ficheDate, listeIso) {
  const a = toInputDate(ficheDate);
  const b = toInputDate(listeIso);
  return Boolean(a && b && a === b);
}

/** Si la ligne liste allégée n’expose pas l’id fiche, retrouver la fiche du collaborateur pour la date de visite. */
async function resolveFicheIdPourLigneSms(ligne, listeDateVisite) {
  let list = [];
  const mat = ligneMatricule(ligne);
  if (mat && mat !== '—') {
    try {
      list = await getFichesParMatricule(String(mat).trim());
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list) || list.length === 0) {
    const pk = normalizeLigneVisitePeriodique(ligne).collaborateurPk;
    if (pk != null && Number.isFinite(pk)) {
      try {
        list = await getFichesParCollaborateur(pk);
      } catch {
        list = [];
      }
    }
  }
  if (!Array.isArray(list) || list.length === 0) return null;

  const pickDate = (f) =>
    f?.date_visite ?? f?.date_de_visite ?? f?.date_visite_medecin ?? f?.dateVisite ?? f?.date;

  const day = listeDateVisite ? toInputDate(listeDateVisite) : '';
  let pool = list;
  if (day) {
    const onDay = list.filter((f) => sameVisiteDay(pickDate(f), day));
    if (onDay.length > 0) pool = onDay;
    else {
      const listeMs = new Date(`${day}T12:00:00`).getTime();
      if (Number.isFinite(listeMs)) {
        const scored = [...list]
          .map((f) => {
            const d = pickDate(f);
            const fds = d ? new Date(d).getTime() : NaN;
            const diff = Number.isFinite(fds) ? Math.abs(fds - listeMs) : Number.POSITIVE_INFINITY;
            return { f, diff };
          })
          .sort((a, b) => a.diff - b.diff || Number(b.f?.id ?? 0) - Number(a.f?.id ?? 0));
        if (scored[0] && scored[0].diff !== Number.POSITIVE_INFINITY) pool = [scored[0].f];
      }
    }
  }

  pool.sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  return extractPkFromFicheLike(pool[0]);
}

function pickObservationsLigneSurv(row) {
  if (!row || typeof row !== 'object') return '';
  const candidates = [
    row.observations_complementaires,
    row.observations_medecin,
    row.remarque_medecin,
    row.remarques_medecin,
    row.observation_medecin,
    row.resultat_observation,
    row.observation,
  ];
  for (const v of candidates) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  // SMS Mateur : si observations_complementaires contient du JSON (__sms_mateur_v1),
  // n'afficher que le champ lisible "observations_libres".
  const rawJson =
    row.observations_complementaires
    ?? row.observations_medecin
    ?? row.remarque_medecin
    ?? row.observation_medecin
    ?? row.resultat_observation;
  if (rawJson != null) {
    const s = String(rawJson).trim();
    if (s.startsWith('{') && s.includes('__sms_mateur_v1')) {
      try {
        const parsed = JSON.parse(s);
        const p = parsed?.__sms_mateur_v1;
        const obs = p?.observations_libres ?? p?.observations ?? p?.observation ?? '';
        if (obs != null && String(obs).trim() !== '') return String(obs).trim();
        return '—';
      } catch {
        /* ignore */
      }
    }
  }
  if (!traitementTermine(row) && pickFicheIdLigneSmsLieeVisite(row) == null) return '';
  const ficheBlocks = [row.fiche_aptitude, row.resultat_fiche_aptitude, row.derniere_fiche].filter(
    (x) => x && typeof x === 'object',
  );
  for (const fiche of ficheBlocks) {
    const oc =
      fiche.observations_complementaires ??
      fiche.observations_medecin ??
      fiche.precision_aptitude ??
      fiche.aptitude;
    if (oc != null && String(oc).trim() !== '') return String(oc).trim();
  }
  return '';
}

async function enrichirObservationsLignesSurveillance(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const needIds = new Set();
  for (const row of rows) {
    if (pickObservationsLigneSurv(row)) continue;
    const mayHaveFicheLiee = traitementTermine(row) || pickFicheIdLigneSmsLieeVisite(row) != null;
    if (!mayHaveFicheLiee) continue;
    const fid = pickFicheIdLigneSurv(row);
    if (fid != null && fid !== '') needIds.add(String(fid));
  }
  if (needIds.size === 0) return rows;
  const obsBy = new Map();
  await Promise.all(
    [...needIds].map(async (idStr) => {
      try {
        const f = await getFicheAptitude(idStr);
        const t = f?.observations_complementaires ?? f?.observations_medecin ?? f?.precision_aptitude;
        if (t != null && String(t).trim() !== '') obsBy.set(idStr, String(t).trim());
      } catch {
        /* ignore */
      }
    }),
  );
  if (obsBy.size === 0) return rows;
  return rows.map((row) => {
    if (pickObservationsLigneSurv(row)) return row;
    const fid = pickFicheIdLigneSurv(row);
    if (fid == null) return row;
    const t = obsBy.get(String(fid));
    return t ? { ...row, observations_complementaires: t } : row;
  });
}

/** Cette liste est une suite (report) d’une liste précédente. */
function origineListeReportee(d) {
  if (!d || typeof d !== 'object') return null;
  const oid = d.liste_origine_id ?? d.parent_liste_id ?? d.liste_parent_id ?? d.liste_source_id;
  if (oid == null || oid === '') return null;
  const ref = d.liste_origine_reference ?? d.parent_liste_reference ?? d.liste_source_reference;
  return { id: oid, ref: ref || String(oid) };
}

function enrichFicheDepuisLigneSurv(fiche, ligne) {
  const out = { ...fiche };
  const nom = ligneNomComplet(ligne);
  if (!out.collaborateur_nom && nom && nom !== '—') out.collaborateur_nom = nom;
  const mat = ligneMatricule(ligne);
  if (!out.collaborateur_matricule && mat && mat !== '—') out.collaborateur_matricule = mat;
  return out;
}

/** Export Excel des lignes d’une liste SMS clôturée (RH). */
function exportListeSmsClotureeVersExcel(liste, lignes) {
  const arr = Array.isArray(lignes) ? lignes : [];
  const refBase = liste?.reference || `SMS_${liste?.id ?? ''}`;
  const datePart = toInputDate(liste?.date_visite) || 'sans_date';
  const rows = arr.map((l, i) => ({
    'N°': i + 1,
    Collaborateur: ligneNomComplet(l),
    Matricule: ligneMatricule(l) === '—' ? '' : String(ligneMatricule(l)),
    'SMS jour J': isSmsJourJEnvoye(l) ? 'Oui' : 'Non',
    Présence: l.presence != null && String(l.presence).trim() !== '' ? String(l.presence).trim() : '',
    Traitement: traitementTermine(l) ? 'Oui' : 'Non',
    'Résultat / observation': pickObservationsLigneSurv(l) || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 30 }, { wch: 14 }, { wch: 11 }, { wch: 14 }, { wch: 12 }, { wch: 45 },
  ];
  const HEADER_BLUE = 'FF1d4ed8';
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
  XLSX.utils.book_append_sheet(wb, ws, 'Lignes SMS');
  const safe = String(refBase).replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `${safe}_${datePart}.xlsx`);
}

export default function SurveillanceSpecialeRHPage() {
  const { user } = useAuth();
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState('list'); // list | detail | create
  const [listeCourante, setListeCourante] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loadDetail, setLoadDetail] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [createTitre, setCreateTitre] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [matriculeAdd, setMatriculeAdd] = useState('');
  const [matriculeAddError, setMatriculeAddError] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [veilleBusy, setVeilleBusy] = useState(false);
  const [dateVisiteEdit, setDateVisiteEdit] = useState('');
  const [dateVisiteBusy, setDateVisiteBusy] = useState(false);
  const [deleteListeBusy, setDeleteListeBusy] = useState(false);
  const [printFicheBusy, setPrintFicheBusy] = useState(null);
  const [exportExcelBusy, setExportExcelBusy] = useState(false);
  const [listesArchivees, setListesArchivees] = useState([]);
  const [rhSmsTab, setRhSmsTab] = useState('actives');
  const [filtreArchiveAnnee, setFiltreArchiveAnnee] = useState('');
  const [filtreArchiveMois, setFiltreArchiveMois] = useState('');
  const [archivingId, setArchivingId] = useState(null);

  const loadListes = useCallback(async () => {
    setLoading(true);
    try {
      const actives = await getListesSurveillanceSpeciale();
      const arr = Array.isArray(actives) ? actives : [];
      setListes(arr.filter((l) => String(l.statut || '').toUpperCase() !== 'ARCHIVEE'));
      try {
        const archivedRaw = await getListesSurveillanceSpeciale({ archived: true });
        const ar = Array.isArray(archivedRaw) ? archivedRaw : [];
        setListesArchivees(
          ar.filter((l) => l.statut === 'ARCHIVEE').filter(visiteArchiveRHAffichable),
        );
      } catch {
        setListesArchivees([]);
      }
    } catch {
      setListes([]);
      setListesArchivees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const anneesPourFiltreArchive = useMemo(() => {
    const ys = new Set();
    const y0 = new Date().getFullYear();
    for (let y = Math.max(y0, ANNEE_MIN_ARCHIVES_RH); y >= ANNEE_MIN_ARCHIVES_RH; y -= 1) ys.add(y);
    listesArchivees.forEach((l) => {
      if (!l?.date_visite) return;
      const d = new Date(l.date_visite);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() >= ANNEE_MIN_ARCHIVES_RH) ys.add(d.getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [listesArchivees]);

  const listesArchiveesFiltrees = useMemo(
    () => listesArchivees.filter((l) => archiveListeMatchesDate(l, filtreArchiveAnnee, filtreArchiveMois)),
    [listesArchivees, filtreArchiveAnnee, filtreArchiveMois],
  );

  const filtresArchivesActifs = !!(filtreArchiveAnnee || filtreArchiveMois);

  useEffect(() => {
    loadListes();
  }, [loadListes]);

  useEffect(() => {
    if (listeCourante?.id != null && listeCourante.date_visite != null && listeCourante.date_visite !== '') {
      setDateVisiteEdit(toInputDate(listeCourante.date_visite));
    } else if (listeCourante?.id != null) {
      setDateVisiteEdit('');
    }
  }, [listeCourante?.id, listeCourante?.date_visite]);

  const refreshDetail = useCallback(async (listeId) => {
    if (!listeId) return;
    setLoadDetail(true);
    try {
      const [det, lignesArr] = await Promise.all([
        getListeSurveillanceSpecialeDetail(listeId),
        getLignesSurveillanceSpeciale(listeId),
      ]);
      const lignesRaw = Array.isArray(lignesArr) ? lignesArr : [];
      const nonBrouillon = det?.statut && det.statut !== 'BROUILLON';
      const lignesEnrichies = nonBrouillon ? await enrichirObservationsLignesSurveillance(lignesRaw) : lignesRaw;
      setListeCourante(det);
      setLignes(lignesEnrichies);
    } catch {
      setListeCourante(null);
      setLignes([]);
    } finally {
      setLoadDetail(false);
    }
  }, []);

  const openDetail = async (l) => {
    setSub('detail');
    setListeCourante(l);
    await refreshDetail(l.id);
  };

  const goToListeSms = async (listeId) => {
    if (listeId == null || listeId === '') return;
    setSub('detail');
    const fromCache = listes.find((x) => String(x.id) === String(listeId));
    setListeCourante(fromCache || { id: listeId });
    await refreshDetail(listeId);
    await loadListes();
  };

  const backList = () => {
    setSub('list');
    setListeCourante(null);
    setLignes([]);
    loadListes();
  };

  const handleCreate = async () => {
    if (!createDate.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Date requise', text: 'Indiquez la date de visite.' });
      return;
    }
    setCreateBusy(true);
    try {
      const created = await createListeSurveillanceSpeciale({
        date_visite: createDate.trim(),
        titre: createTitre.trim() || undefined,
      });
      setCreateDate('');
      setCreateTitre('');
      setSub('detail');
      setListeCourante(created);
      await refreshDetail(created.id);
      await Swal.fire({ icon: 'success', title: 'Liste créée', timer: 1800, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Création', text: formatAxiosError(e) || e?.message || 'Erreur.' });
    } finally {
      setCreateBusy(false);
    }
  };

  const handleAddLigne = async () => {
    if (!listeCourante?.id) return;
    if (!matriculeAdd.trim()) {
      setMatriculeAddError('');
      await Swal.fire({ icon: 'info', title: 'Matricule', text: 'Saisissez le matricule du collaborateur.' });
      return;
    }
    setAddBusy(true);
    setMatriculeAddError('');
    try {
      await createLigneSurveillanceSpeciale({
        liste: Number(listeCourante.id),
        matricule: String(matriculeAdd.trim()),
      });
      setMatriculeAdd('');
      await refreshDetail(listeCourante.id);
    } catch (e) {
      setMatriculeAddError(formatAxiosError(e) || e?.message || 'Erreur.');
    } finally {
      setAddBusy(false);
    }
  };

  const handleDeleteListe = async () => {
    if (!listeCourante?.id || listeCourante.statut !== 'BROUILLON') return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer cette liste ?',
      text: 'La liste brouillon et ses lignes seront supprimées définitivement.',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setDeleteListeBusy(true);
    try {
      await deleteListeSurveillanceSpeciale(listeCourante.id);
      await Swal.fire({ icon: 'success', title: 'Liste supprimée', timer: 1800, showConfirmButton: false });
      backList();
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Suppression', text: formatAxiosError(e) || e?.message || 'Erreur.' });
    } finally {
      setDeleteListeBusy(false);
    }
  };

  const handleDeleteListeFromRow = async (e, l) => {
    e.stopPropagation();
    if (l.statut !== 'BROUILLON') return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer cette liste ?',
      text: `La liste ${l.reference || `#${l.id}`} (brouillon) sera supprimée.`,
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setDeleteListeBusy(true);
    try {
      await deleteListeSurveillanceSpeciale(l.id);
      await loadListes();
      await Swal.fire({ icon: 'success', title: 'Liste supprimée', timer: 1600, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Suppression', text: formatAxiosError(err) || err?.message || 'Erreur.' });
    } finally {
      setDeleteListeBusy(false);
    }
  };

  const handleVoirFiche = async (ligne) => {
    if (printFicheBusy != null) return;
    if (!peutAfficherFicheAptitudeSms(ligne)) {
      await Swal.fire({
        icon: 'info',
        title: 'Fiche non disponible',
        text: 'La fiche d’aptitude liée à cette visite SMS apparaîtra après l’examen du médecin du travail.',
      });
      return;
    }
    setPrintFicheBusy(ligne.id);
    try {
      let fid = pickFicheIdLigneSmsLieeVisite(ligne) ?? pickFicheIdLigneSurv(ligne);
      if (fid == null && traitementTermine(ligne)) {
        fid = await resolveFicheIdPourLigneSms(ligne, listeCourante?.date_visite);
      }
      if (fid == null) {
        await Swal.fire({ icon: 'info', title: 'Fiche', text: 'Aucune fiche d’aptitude liée à cette ligne.' });
        return;
      }
      const ficheRaw = await getFicheAptitude(fid);
      const ficheEnrichie = enrichFicheDepuisLigneSurv(ficheRaw, ligne);
      const printCfg = getSitePrintConfig(ficheEnrichie, user);
      const html = buildFicheAptitudePrintHtml(ficheEnrichie, printCfg, user);
      printHTML(html);
    } catch {
      await Swal.fire({ icon: 'error', title: 'Fiche', text: 'Impossible de charger la fiche (permissions ou réseau).' });
    } finally {
      setPrintFicheBusy(null);
    }
  };

  const handleDeleteLigne = async (ligne) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Retirer ce collaborateur ?',
      text: `${ligneNomComplet(ligne)} sera retiré de la liste.`,
      showCancelButton: true,
      confirmButtonText: 'Retirer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setDelBusy(ligne.id);
    try {
      await deleteLigneSurveillanceSpeciale(ligne.id);
      await refreshDetail(listeCourante.id);
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Suppression', text: formatAxiosError(e) || e?.message || 'Erreur.' });
    } finally {
      setDelBusy(null);
    }
  };

  const handleSoumettre = async () => {
    if (!listeCourante?.id) return;
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Soumettre à l’infirmier ?',
      text: 'Vous ne pourrez plus modifier les lignes.',
      showCancelButton: true,
      confirmButtonText: 'Soumettre',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ca8a04',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setSubmitBusy(true);
    try {
      await soumettreListeSurveillanceSpeciale(listeCourante.id);
      await refreshDetail(listeCourante.id);
      await loadListes();
      await Swal.fire({ icon: 'success', title: 'Liste soumise', timer: 2000, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Soumission', text: formatAxiosError(e) || e?.message || 'Erreur.' });
    } finally {
      setSubmitBusy(false);
    }
  };

  const handleSaveDateVisite = async () => {
    if (!listeCourante?.id || !dateVisiteEdit.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Date', text: 'Choisissez une date de visite.' });
      return;
    }
    const current = toInputDate(listeCourante.date_visite);
    if (dateVisiteEdit.trim() === current) return;
    setDateVisiteBusy(true);
    try {
      await patchListeSurveillanceSpeciale(listeCourante.id, { date_visite: dateVisiteEdit.trim() });
      await refreshDetail(listeCourante.id);
      await loadListes();
      await Swal.fire({ icon: 'success', title: 'Date mise à jour', timer: 1600, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Date de visite', text: formatAxiosError(e) || e?.message || 'Erreur.' });
    } finally {
      setDateVisiteBusy(false);
    }
  };

  const handleVeille = async () => {
    if (!listeCourante?.id) return;
    setVeilleBusy(true);
    try {
      const res = await notifierVeilleListeSurveillanceSpeciale(listeCourante.id);
      await refreshDetail(listeCourante.id);
      await loadListes();
      const n = Number(res?.sms_count);
      const extra = Number.isFinite(n) && n > 0 ? ` ${n} SMS.` : '';
      await Swal.fire({ icon: 'success', title: 'SMS veille', text: `Envoi traité.${extra}`, timer: 2400, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'SMS veille', text: formatAxiosError(e) || e?.message || 'Erreur.' });
    } finally {
      setVeilleBusy(false);
    }
  };

  const handleArchiver = async (l) => {
    if (!l?.id || l.statut !== 'CLOTUREE') return;
    const refTxt = String(l.reference || `#${l.id}`).trim();
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Archiver cette liste ?',
      html:
        `<p style="text-align:left;margin:0">La liste <strong>${refTxt}</strong> passera en statut <strong>Archivée</strong>.</p>`
        + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">Elle n’apparaîtra plus dans les listes actives (infirmier / médecin) et sera consultable ici sous l’onglet <strong>Archives</strong>.</p>',
      showCancelButton: true,
      confirmButtonText: 'Archiver',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#4338ca',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setArchivingId(l.id);
    try {
      await archiverListeSurveillanceSpeciale(l.id);
      await loadListes();
      setRhSmsTab('archives');
      if (listeCourante?.id != null && String(listeCourante.id) === String(l.id)) {
        setSub('list');
        setListeCourante(null);
        setLignes([]);
      }
      await Swal.fire({ icon: 'success', title: 'Liste archivée', text: `La liste ${refTxt} a été archivée.`, timer: 2200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Archivage',
        text: formatAxiosError(e) || String(e.response?.data?.detail || e.response?.data?.error || e.message || 'Erreur lors de l’archivage.'),
      });
    } finally {
      setArchivingId(null);
    }
  };

  const handleExportExcel = async () => {
    if (!listeCourante?.id || !['CLOTUREE', 'ARCHIVEE'].includes(listeCourante.statut)) return;
    if (!lignes.length) {
      await Swal.fire({ icon: 'info', title: 'Export Excel', text: 'Aucune ligne à exporter.' });
      return;
    }
    setExportExcelBusy(true);
    try {
      exportListeSmsClotureeVersExcel(listeCourante, lignes);
      await Swal.fire({
        icon: 'success',
        title: 'Export Excel',
        text: 'Le fichier a été téléchargé.',
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Export Excel',
        text: e?.message || 'Impossible de générer le fichier.',
      });
    } finally {
      setExportExcelBusy(false);
    }
  };

  const isBrouillon = listeCourante?.statut === 'BROUILLON';
  const nbLignesListe = listeCourante?.nombre_lignes ?? lignes.length;
  const dateVisiteServeur = toInputDate(listeCourante?.date_visite);
  const dateVisiteModifiee = isBrouillon && dateVisiteEdit.trim() !== '' && dateVisiteEdit.trim() !== dateVisiteServeur;

  if (sub === 'create') {
    return (
      <div style={{ maxWidth: 480 }}>
        <button
          type="button"
          onClick={() => { setSub('list'); setCreateDate(''); setCreateTitre(''); }}
          style={{ marginBottom: 16, border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
        >
          ← Retour
        </button>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 22 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Nouvelle liste</h2>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Date de visite *</label>
          <input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 14, boxSizing: 'border-box' }} />
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Titre (optionnel)</label>
          <input value={createTitre} onChange={(e) => setCreateTitre(e.target.value)} placeholder="Campagne / motif" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 18, boxSizing: 'border-box' }} />
          <button
            type="button"
            disabled={createBusy}
            onClick={handleCreate}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none', background: createBusy ? '#93c5fd' : '#1d4ed8',
              color: 'white', fontWeight: 700, cursor: createBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {createBusy ? '…' : 'Créer et ouvrir'}
          </button>
        </div>
      </div>
    );
  }

  if (sub === 'detail' && listeCourante) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={backList} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
            ← Listes
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{listeCourante.reference || `Liste #${listeCourante.id}`}</span>
          <StatutBadge statut={listeCourante.statut} />
          <SmsVeilleBadge liste={listeCourante} />
          {['SOUMISE', 'EN_TRAITEMENT'].includes(listeCourante.statut) && !isSmsVeilleEnvoye(listeCourante) && (
            <button
              type="button"
              disabled={veilleBusy}
              onClick={handleVeille}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d',
                fontWeight: 700, fontSize: 12, cursor: veilleBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {veilleBusy ? '…' : 'SMS veille'}
            </button>
          )}
          {['CLOTUREE', 'ARCHIVEE'].includes(listeCourante.statut) && (
            <button
              type="button"
              disabled={exportExcelBusy || loadDetail || lignes.length === 0}
              onClick={handleExportExcel}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #86efac',
                background: exportExcelBusy || loadDetail ? '#f1f5f9' : '#ecfdf5',
                color: exportExcelBusy || loadDetail ? '#94a3b8' : '#15803d',
                fontWeight: 700,
                fontSize: 12,
                cursor: exportExcelBusy || loadDetail ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {exportExcelBusy ? '…' : 'Export Excel'}
            </button>
          )}
          {listeCourante.statut === 'CLOTUREE' && (
            <button
              type="button"
              disabled={archivingId != null || loadDetail}
              onClick={() => handleArchiver(listeCourante)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #c7d2fe',
                background: archivingId != null || loadDetail ? '#f1f5f9' : '#eef2ff',
                color: archivingId != null || loadDetail ? '#94a3b8' : '#4338ca',
                fontWeight: 700,
                fontSize: 12,
                cursor: archivingId != null || loadDetail ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {archivingId === listeCourante.id ? '…' : 'Archiver'}
            </button>
          )}
          {isBrouillon && (
            <button
              type="button"
              disabled={deleteListeBusy}
              onClick={handleDeleteListe}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontWeight: 700,
                fontSize: 12,
                cursor: deleteListeBusy ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {deleteListeBusy ? '…' : 'Supprimer la liste'}
            </button>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' }}>
          {listeCourante.titre ? <><strong>{listeCourante.titre}</strong><span aria-hidden> · </span></> : null}
          {isBrouillon ? (
            <>
              <span style={{ fontWeight: 600, color: '#475569' }}>Date de visite</span>
              <input
                type="date"
                value={dateVisiteEdit}
                onChange={(e) => setDateVisiteEdit(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: 13 }}
              />
              <button
                type="button"
                disabled={dateVisiteBusy || !dateVisiteModifiee}
                onClick={handleSaveDateVisite}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #bfdbfe',
                  background: dateVisiteModifiee && !dateVisiteBusy ? '#eff6ff' : '#f1f5f9',
                  color: dateVisiteModifiee && !dateVisiteBusy ? '#1d4ed8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: dateVisiteBusy || !dateVisiteModifiee ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {dateVisiteBusy ? '…' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <span>Visite : {fmtDate(listeCourante.date_visite)}</span>
          )}
          <span>
            · {nbLignesListe} ligne{nbLignesListe !== 1 ? 's' : ''}
          </span>
        </div>

        {(() => {
          const origine = origineListeReportee(listeCourante);
          if (!origine?.id) return null;
          return (
            <div
              style={{
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 22 }}>↩️</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8', marginBottom: 3 }}>Liste suite (report)</div>
                <div style={{ fontSize: 12, color: '#1e40af' }}>
                  Cette liste reprend des collaborateurs non traités d’une liste précédente (réf. {origine.ref}).
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToListeSms(origine.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#1d4ed8',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Liste d’origine
              </button>
            </div>
          );
        })()}

        {(() => {
          const rapport = parseRapportListeSmsSurveillance(listeCourante);
          const nbNonTraites = lignes.filter((l) => !traitementTermine(l)).length;
          if (!['CLOTUREE', 'ARCHIVEE'].includes(listeCourante.statut) || !rapport?.id) return null;
          return (
            <div
              style={{
                background: '#fff7ed',
                border: '1.5px solid #fed7aa',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 22 }}>📋</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#c2410c', marginBottom: 3 }}>
                  {nbNonTraites > 0
                    ? `${nbNonTraites} collaborateur${nbNonTraites > 1 ? 's' : ''} non traité${nbNonTraites > 1 ? 's' : ''} — nouvelle liste générée`
                    : 'Nouvelle liste générée automatiquement'}
                </div>
                <div style={{ fontSize: 12, color: '#92400e' }}>
                  Les collaborateurs non pris en charge à la clôture ont été reportés dans une liste brouillon. Planifiez une nouvelle date de visite.
                  {rapport.ref ? ` Référence : ${rapport.ref}.` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToListeSms(rapport.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#c2410c',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Voir la liste reportée
              </button>
            </div>
          );
        })()}

        {isBrouillon && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Matricule</label>
              <input
                value={matriculeAdd}
                onChange={(e) => {
                  setMatriculeAdd(e.target.value);
                  setMatriculeAddError('');
                }}
                placeholder="Chaîne telle qu’en base (ex. 50234567890)"
                style={{ width: '100%', padding: 9, borderRadius: 8, border: `1px solid ${matriculeAddError ? '#f87171' : '#cbd5e1'}`, marginTop: 4, boxSizing: 'border-box' }}
              />
              {matriculeAddError ? (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>{matriculeAddError}</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={addBusy}
              onClick={handleAddLigne}
              style={{
                padding: '9px 16px', borderRadius: 8, border: 'none', background: addBusy ? '#93c5fd' : '#1d4ed8',
                color: 'white', fontWeight: 700, cursor: addBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {addBusy ? '…' : 'Ajouter'}
            </button>
            <button
              type="button"
              disabled={submitBusy || lignes.length === 0 || !listeCourante.date_visite}
              onClick={handleSoumettre}
              style={{
                padding: '9px 16px', borderRadius: 8, border: 'none', background: submitBusy ? '#fde68a' : '#ca8a04',
                color: 'white', fontWeight: 700, cursor: submitBusy || lignes.length === 0 ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {submitBusy ? '…' : 'Soumettre à l’infirmier'}
            </button>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loadDetail ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {(isBrouillon
                    ? ['Collaborateur', 'Matricule', 'SMS jour J', 'Présence', 'Traitement', 'Actions']
                    : ['Collaborateur', 'Matricule', 'SMS jour J', 'Présence', 'Traitement', 'Résultat / observation', 'Voir fiche']
                  ).map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={isBrouillon ? 6 : 7} style={{ padding: 28, textAlign: 'center', color: '#94a3b8' }}>
                      Aucune ligne — ajoutez des collaborateurs (matricule).
                    </td>
                  </tr>
                ) : (
                  lignes.map((l, i) => (
                    <tr key={l.id} style={{ borderTop: i ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{ligneNomComplet(l)}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{ligneMatricule(l)}</td>
                      <td style={{ padding: '10px 14px' }}><SmsLigneBadge ligne={l} /></td>
                      <td style={{ padding: '10px 14px' }}>{l.presence || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>{traitementTermine(l) ? 'Oui' : 'Non'}</td>
                      {isBrouillon ? (
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            type="button"
                            disabled={delBusy === l.id}
                            onClick={() => handleDeleteLigne(l)}
                            style={{
                              padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2',
                              color: '#b91c1c', fontSize: 11, fontWeight: 600, cursor: delBusy === l.id ? 'wait' : 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            {delBusy === l.id ? '…' : 'Retirer'}
                          </button>
                        </td>
                      ) : (
                        <>
                          <td style={{ padding: '10px 14px', maxWidth: 320, color: '#475569', verticalAlign: 'top', wordBreak: 'break-word' }}>
                            {pickObservationsLigneSurv(l) || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                            {peutAfficherFicheAptitudeSms(l) ? (
                              <button
                                type="button"
                                disabled={printFicheBusy != null}
                                onClick={() => handleVoirFiche(l)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #bfdbfe',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: printFicheBusy != null ? 'wait' : 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {printFicheBusy === l.id ? '…' : 'Voir fiche'}
                              </button>
                            ) : (
                              <span title="Disponible après la visite du médecin du travail">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  /* liste */
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 560 }}>
          Surveillance médicale spéciale — campagnes et listes SMS (création, lignes, soumission à l’infirmier).
        </p>
        <button
          type="button"
          onClick={() => setSub('create')}
          style={{
            padding: '9px 16px', borderRadius: 10, border: 'none', background: '#1d4ed8', color: 'white',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Nouvelle liste
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setRhSmsTab('actives')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: rhSmsTab === 'actives' ? '1.5px solid #1d4ed8' : '1px solid #e2e8f0',
            background: rhSmsTab === 'actives' ? '#eff6ff' : 'white',
            color: rhSmsTab === 'actives' ? '#1d4ed8' : '#64748b',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Listes actives
        </button>
        <button
          type="button"
          onClick={() => setRhSmsTab('archives')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: rhSmsTab === 'archives' ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
            background: rhSmsTab === 'archives' ? '#eef2ff' : 'white',
            color: rhSmsTab === 'archives' ? '#4338ca' : '#64748b',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IcoArchive />
          Archives
          <span style={{ fontSize: 11, opacity: 0.85 }}>({listesArchivees.length})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Chargement…</div>
      ) : rhSmsTab === 'actives' ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Référence', 'Titre', 'Date visite', 'Statut', 'SMS veille', 'Actions'].map((h, idx) => (
                  <th key={`h-${idx}`} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                    Aucune liste. Créez une campagne pour commencer.
                  </td>
                </tr>
              ) : (
                listes.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: i ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8' }}>{l.reference || `#${l.id}`}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{l.titre || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>{fmtDate(l.date_visite)}</td>
                    <td style={{ padding: '12px 14px' }}><StatutBadge statut={l.statut} /></td>
                    <td style={{ padding: '12px 14px' }}><SmsVeilleBadge liste={l} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openDetail(l)}
                          style={{
                            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white',
                            color: '#475569', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Ouvrir
                        </button>
                        {l.statut === 'CLOTUREE' && (
                          <button
                            type="button"
                            disabled={archivingId != null}
                            onClick={() => handleArchiver(l)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: '1px solid #c7d2fe',
                              background: '#eef2ff',
                              color: '#4338ca',
                              fontWeight: 600,
                              fontSize: 12,
                              cursor: archivingId != null ? 'wait' : 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {archivingId === l.id ? '…' : 'Archiver'}
                          </button>
                        )}
                        {l.statut === 'BROUILLON' && (
                          <button
                            type="button"
                            disabled={deleteListeBusy}
                            onClick={(e) => handleDeleteListeFromRow(e, l)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              fontWeight: 600,
                              fontSize: 12,
                              cursor: deleteListeBusy ? 'wait' : 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#4338ca', flexWrap: 'wrap' }}>
            <IcoArchive />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Archives SMS (surveillance spéciale)</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              — {listesArchiveesFiltrees.length} liste{listesArchiveesFiltrees.length !== 1 ? 's' : ''}
              {filtresArchivesActifs
                ? ` affichée${listesArchiveesFiltrees.length !== 1 ? 's' : ''} sur ${listesArchivees.length}`
                : ''}{' '}
              (statut Archivée · visites à partir de {ANNEE_MIN_ARCHIVES_RH})
            </span>
          </div>
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 12, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcoArchive />
            Listes au statut <strong>Archivée</strong> dont la date de visite est en {ANNEE_MIN_ARCHIVES_RH} ou après (ou sans date renseignée). Filtrez par année et mois comme pour les archives d’embauche.
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: 12,
              marginBottom: 16,
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="rh-sms-arch-annee" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Année</label>
              <select
                id="rh-sms-arch-annee"
                value={filtreArchiveAnnee}
                onChange={(e) => setFiltreArchiveAnnee(e.target.value)}
                style={{
                  minWidth: 120,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#0f172a',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="">Toutes les années</option>
                {anneesPourFiltreArchive.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="rh-sms-arch-mois" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Mois</label>
              <select
                id="rh-sms-arch-mois"
                value={filtreArchiveMois}
                onChange={(e) => setFiltreArchiveMois(e.target.value)}
                style={{
                  minWidth: 160,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#0f172a',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="">Tous les mois</option>
                {MOIS_FILTRE.map(({ n, lbl }) => (
                  <option key={n} value={String(n)}>{lbl}</option>
                ))}
              </select>
            </div>
            {filtresArchivesActifs && (
              <button
                type="button"
                onClick={() => { setFiltreArchiveAnnee(''); setFiltreArchiveMois(''); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #c7d2fe',
                  background: 'white',
                  color: '#4338ca',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  alignSelf: 'flex-end',
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Référence', 'Titre', 'Date visite', 'Statut', 'SMS veille', 'Actions'].map((h, idx) => (
                    <th key={`ah-${idx}`} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listesArchiveesFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                      {listesArchivees.length === 0
                        ? 'Aucune liste archivée pour le moment. Une liste clôturée peut être archivée depuis l’onglet Listes actives ou depuis le détail.'
                        : 'Aucune liste ne correspond aux filtres année / mois.'}
                    </td>
                  </tr>
                ) : (
                  listesArchiveesFiltrees.map((l, i) => (
                    <tr key={l.id} style={{ borderTop: i ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8' }}>{l.reference || `#${l.id}`}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{l.titre || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{fmtDate(l.date_visite)}</td>
                      <td style={{ padding: '12px 14px' }}><StatutBadge statut={l.statut} /></td>
                      <td style={{ padding: '12px 14px' }}><SmsVeilleBadge liste={l} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          type="button"
                          onClick={() => openDetail(l)}
                          style={{
                            padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white',
                            color: '#475569', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
