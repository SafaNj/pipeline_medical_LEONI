// src/components/rh/ListesEmbauche.jsx
// ─── Mode normal : onglets par statut. Mode archivesOnly (vue RH « Archives visites ») : archives 2026+ uniquement
import { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  getListes,
  archiverListe,
  soumettreListe,
  exportListe,
  deleteListe,
  updateDateVisite,
  notifierSmsVeilleListeEmbauche,
} from '../../api/embaucheApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsVeilleBadge } from '../contreVisite/SmsContreVisiteBadges';
import { uiAlert, uiConfirm } from '../../utils/uiAlert';

/* ── Helpers ── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const MOIS_FILTRE = [
  { n: 1, lbl: 'Janvier' }, { n: 2, lbl: 'Février' }, { n: 3, lbl: 'Mars' }, { n: 4, lbl: 'Avril' },
  { n: 5, lbl: 'Mai' }, { n: 6, lbl: 'Juin' }, { n: 7, lbl: 'Juillet' }, { n: 8, lbl: 'Août' },
  { n: 9, lbl: 'Septembre' }, { n: 10, lbl: 'Octobre' }, { n: 11, lbl: 'Novembre' }, { n: 12, lbl: 'Décembre' },
];

/** Filtre archives RH : année et/ou mois sur date_visite ; listes sans date exclues si un filtre est actif */
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

/** Années proposées dans le filtre + périmètre visite (à partir de 2026) */
const ANNEE_MIN_ARCHIVES_RH = 2026;

function visiteArchiveRHAffichable(l) {
  if (!l.date_visite) return true;
  const d = new Date(l.date_visite);
  if (Number.isNaN(d.getTime())) return true;
  return d.getFullYear() >= ANNEE_MIN_ARCHIVES_RH;
}

/* ── Config statuts ── */
const STATUT_CFG = {
  BROUILLON:     { bg: '#f1f5f9', color: '#475569', text: 'Brouillon',      dot: '#94a3b8' },
  SOUMISE:       { bg: '#dbeafe', color: '#1d4ed8', text: 'Soumise',        dot: '#3b82f6' },
  EN_TRAITEMENT: { bg: '#fef9c3', color: '#a16207', text: 'En traitement',  dot: '#eab308' },
  REPORTEE:      { bg: '#fef2f2', color: '#dc2626', text: 'Reportée',       dot: '#ef4444' },
  CLOTUREE:      { bg: '#dcfce7', color: '#15803d', text: 'Clôturée',       dot: '#22c55e' },
  ARCHIVEE:      { bg: '#ede9fe', color: '#6d28d9', text: 'Archivée',       dot: '#8b5cf6' },
};

const StatutBadge = ({ statut }) => {
  const c = STATUT_CFG[statut] || { bg: '#f1f5f9', color: '#475569', text: statut, dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.text}
    </span>
  );
};

/* ── Logique de classification ──
   • REPORTEE = BROUILLON sans date_visite, ou CLOTUREE anormale sans date (affichage « reportée »)
   • Les autres statuts viennent du backend (ARCHIVEE uniquement dans l’onglet Archives)
*/
const getEffectifStatut = (l) => {
  if (l.statut === 'BROUILLON' && !l.date_visite) return 'REPORTEE';
  if (l.statut === 'CLOTUREE' && !l.date_visite) return 'REPORTEE';
  return l.statut;
};

/* ── Icônes ── */
const IcoArchive  = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const IcoWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 15" />
  </svg>
);
const IcoArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/** Brouillon sans date : planifier la visite de rattrapage puis soumission à l’infirmier */
function ModalPlanifierDate({ liste, submitting, onClose, onConfirm }) {
  const [date, setDate] = useState('');
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-planif-title"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 14, maxWidth: 420, width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,.18)', border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 id="modal-planif-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Planifier la visite — {liste?.reference}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
            Indiquez la date de visite de rattrapage avant d’envoyer la liste à l’infirmier.
          </p>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Date de visite <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
              fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px 18px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={!!submitting}
            style={{
              padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'white', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(date)}
            disabled={!!submitting}
            style={{
              padding: '9px 16px', borderRadius: 8, border: 'none',
              background: submitting ? '#93c5fd' : '#1d4ed8', color: 'white',
              fontWeight: 700, fontSize: 13, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {submitting ? '…' : 'Confirmer et soumettre'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Brouillon : modifier la date de visite (sans soumission) */
function ModalModifierDate({ liste, saving, onClose, onConfirm }) {
  const [date, setDate] = useState(() => {
    const d = liste?.date_visite;
    if (!d) return '';
    const s = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-modif-date-title"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 14, maxWidth: 420, width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,.18)', border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 id="modal-modif-date-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Modifier la date — {liste?.reference}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
            La liste restera en <strong>Brouillon</strong> (aucune soumission automatique).
          </p>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Date de visite <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
              fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px 18px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={!!saving}
            style={{
              padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'white', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(date)}
            disabled={!!saving}
            style={{
              padding: '9px 16px', borderRadius: 8, border: 'none',
              background: saving ? '#93c5fd' : '#1d4ed8', color: 'white',
              fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TableListes — composant tableau générique réutilisable
══════════════════════════════════════════════════════ */
function TableListes({
  listes, onDetailClick, onSoumettre, onExport, onDelete, onArchiver,
  submitting, exporting, deleting, archiving,
  veilleListeId, onNotifierVeille,
  onModifierDate, savingDateId,
}) {
  if (listes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 20px', color: '#94a3b8', fontSize: 14 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}><IcoArchive /></div>
        Aucune liste dans cette catégorie.
      </div>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: '1px solid #f1f5f9', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            {['Référence', 'Date visite', 'Candidats', 'Présents', 'Aptes', 'Statut', 'SMS veille', 'Actions'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '11px 14px',
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {listes.map((l, i) => {
            const effStatut = getEffectifStatut(l);
            // Vraie clôture uniquement (pas les CLOTUREE sans date reclassées en REPORTEE)
            const canArchive =
              effStatut === 'CLOTUREE' && l.nombre_presents != null && l.statut !== 'ARCHIVEE';

            return (
              <tr key={l.id}
                style={{ borderBottom: i < listes.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Référence */}
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8', cursor: 'pointer' }}
                  onClick={() => onDetailClick(l)}>
                  {l.reference}
                </td>

                {/* Date visite */}
                <td style={{ padding: '12px 14px', color: '#475569' }}>
                  {l.date_visite ? fmtDate(l.date_visite) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f97316', fontWeight: 700, fontSize: 11 }}>
                      <IcoClock /> À planifier
                    </span>
                  )}
                </td>

                {/* Candidats / Présents / Aptes */}
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{l.nombre_candidats ?? '—'}</td>
                <td style={{ padding: '12px 14px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>{l.nombre_presents ?? '—'}</td>
                <td style={{ padding: '12px 14px', color: '#1d4ed8', fontWeight: 600, textAlign: 'center' }}>{l.nombre_aptes ?? '—'}</td>

                {/* Statut */}
                <td style={{ padding: '12px 14px' }}>
                  <StatutBadge statut={effStatut} />
                </td>

                {/* SMS veille (badge + envoi manuel soumise / en traitement) */}
                <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    <SmsVeilleBadge liste={l} />
                    {['SOUMISE', 'EN_TRAITEMENT'].includes(l.statut) && !isSmsVeilleEnvoye(l) && (
                      <button
                        type="button"
                        onClick={() => onNotifierVeille(l)}
                        disabled={veilleListeId === l.id}
                        style={{
                          padding: '4px 9px', borderRadius: 7, border: '1px solid #bbf7d0',
                          background: veilleListeId === l.id ? '#ecfdf5' : '#f0fdf4', color: '#15803d',
                          cursor: veilleListeId === l.id ? 'wait' : 'pointer', fontSize: 10, fontWeight: 700,
                          fontFamily: 'inherit', whiteSpace: 'nowrap',
                        }}
                      >
                        {veilleListeId === l.id ? '…' : 'SMS veille'}
                      </button>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Détail — toujours visible */}
                    <button onClick={() => onDetailClick(l)}
                      style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: 'inherit' }}>
                      Détail
                    </button>

                    {/* Soumettre — BROUILLON seulement */}
                    {l.statut === 'BROUILLON' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onModifierDate?.(l)}
                          disabled={savingDateId === l.id}
                          style={{
                            padding: '5px 10px', borderRadius: 7, border: '1px solid #bfdbfe',
                            background: savingDateId === l.id ? '#f1f5f9' : '#eff6ff',
                            color: '#1d4ed8', cursor: savingDateId === l.id ? 'wait' : 'pointer',
                            fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                          }}
                        >
                          {savingDateId === l.id ? '…' : (l.date_visite ? 'Modifier date' : 'Planifier date')}
                        </button>
                        <button onClick={() => onSoumettre(l)} disabled={submitting === l.id}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: submitting === l.id ? '#93c5fd' : '#1d4ed8', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                          {submitting === l.id ? '…' : 'Soumettre'}
                        </button>
                        <button onClick={() => onDelete(l)} disabled={deleting === l.id}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                          {deleting === l.id ? '…' : 'Supprimer'}
                        </button>
                      </>
                    )}

                    {/* Export Excel — en traitement, clôturée ou archivée (hors cas reclassé « reportée » sans date) */}
                    {(l.statut === 'ARCHIVEE' || ['EN_TRAITEMENT', 'CLOTUREE'].includes(l.statut)) && effStatut !== 'REPORTEE' && (
                      <button onClick={() => onExport(l)} disabled={exporting === l.id}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #86efac', background: exporting === l.id ? '#f1f5f9' : '#ecfdf5', color: '#15803d', cursor: exporting === l.id ? 'wait' : 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                        {exporting === l.id ? '…' : 'Export Excel'}
                      </button>
                    )}

                    {/* ── Bouton ARCHIVER — CLOTUREE avec feedback infirmier ── */}
                    {canArchive && (
                      <button onClick={() => onArchiver(l)} disabled={archiving === l.id}
                        title="Archiver cette liste clôturée"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 7,
                          border: '1px solid #c7d2fe', background: archiving === l.id ? '#e0e7ff' : '#eef2ff',
                          color: '#4338ca', cursor: archiving === l.id ? 'wait' : 'pointer',
                          fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                          opacity: archiving === l.id ? 0.85 : 1,
                        }}>
                        <IcoArchive /> {archiving === l.id ? '…' : 'Archiver'}
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Composant principal
══════════════════════════════════════════════════ */
export default function ListesEmbauche({ onNouvelleClick, onDetailClick, defaultSection, archivesOnly }) {
  const [listes,           setListes]           = useState([]);
  const [listesArchivees, setListesArchivees]  = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [archiving,        setArchiving]        = useState(null);
  const [section,          setSection]          = useState(archivesOnly ? 'archives' : (defaultSection || 'brouillon'));
  const [submitting,       setSubmitting]       = useState(null);
  const [exporting,        setExporting]        = useState(null);
  const [deleting,         setDeleting]         = useState(null);
  const [veilleListeId,    setVeilleListeId]    = useState(null);
  /** { liste } — brouillon sans date : planifier puis soumettre */
  const [planifierModal,   setPlanifierModal]   = useState(null);
  /** { liste } — brouillon : modifier date sans soumettre */
  const [modifierDateModal, setModifierDateModal] = useState(null);
  const [savingDateId, setSavingDateId] = useState(null);
  /** Filtres onglet Archives : date de visite (année / mois), chaînes vides = tout */
  const [filtreArchiveAnnee, setFiltreArchiveAnnee] = useState('');
  const [filtreArchiveMois, setFiltreArchiveMois] = useState('');

  /* ── Chargement : actives + archivées ; mode archivesOnly = archivées filtrées (visite ≥ 2026 ou sans date) ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (archivesOnly) {
        setListes([]);
        try {
          const archivedRaw = await getListes({ archived: true });
          const ar = Array.isArray(archivedRaw) ? archivedRaw : [];
          setListesArchivees(
            ar
              .filter((l) => l.statut === 'ARCHIVEE')
              .filter(visiteArchiveRHAffichable),
          );
        } catch {
          setListesArchivees([]);
        }
      } else {
        const actives = await getListes();
        setListes(Array.isArray(actives) ? actives : []);
        try {
          const archivedRaw = await getListes({ archived: true });
          const ar = Array.isArray(archivedRaw) ? archivedRaw : [];
          setListesArchivees(ar.filter((l) => l.statut === 'ARCHIVEE'));
        } catch {
          setListesArchivees([]);
        }
      }
    } catch {
      setListes([]);
      setListesArchivees([]);
    } finally {
      setLoading(false);
    }
  }, [archivesOnly]);

  useEffect(() => { load(); }, [load]);

  /* ── Archivage API (PATCH …/archiver/) — uniquement si CLOTUREE côté backend ── */
  const handleArchiver = async (l) => {
    const refTxt = String(l.reference || `#${l.id}`).trim();
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Archiver cette liste ?',
      html:
        `<p style="text-align:left;margin:0">La liste <strong>${refTxt}</strong> passera en statut <strong>Archivée</strong>.</p>`
        + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">Elle n’apparaîtra plus que dans le menu <strong>Archives visites</strong> (ou onglet Archives dans les listes d’embauche).</p>',
      showCancelButton: true,
      confirmButtonText: 'Archiver',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#4338ca',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setArchiving(l.id);
    try {
      await archiverListe(l.id);
      await load();
      setSection('archives');
      await Swal.fire({ icon: 'success', title: 'Liste archivée', text: `La liste ${refTxt} a été archivée.`, timer: 2200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Archivage',
        text: formatAxiosError(e) || String(e.response?.data?.detail || e.response?.data?.error || e.message || 'Erreur lors de l’archivage.'),
      });
    } finally {
      setArchiving(null);
    }
  };

  /* ── Tri par onglet — Archives = seulement ARCHIVEE (API), pas les CLOTUREE non archivées ── */
  const bySection = {
    brouillon:     listes.filter((l) => getEffectifStatut(l) === 'BROUILLON'),
    soumise:       listes.filter((l) => getEffectifStatut(l) === 'SOUMISE'),
    en_traitement: listes.filter((l) => getEffectifStatut(l) === 'EN_TRAITEMENT'),
    reportee:      listes.filter((l) => getEffectifStatut(l) === 'REPORTEE'),
    cloturee:      listes.filter((l) => getEffectifStatut(l) === 'CLOTUREE'),
    archives:      listesArchivees,
  };

  const anneesPourFiltreArchive = useMemo(() => {
    const ys = new Set();
    const y0 = new Date().getFullYear();
    for (let y = Math.max(y0, ANNEE_MIN_ARCHIVES_RH); y >= ANNEE_MIN_ARCHIVES_RH; y--) ys.add(y);
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

  /* ── Alerte reportées ── */
  const reportees = bySection.reportee;

  /* ── Handlers actions ── */
  const handleSoumettre = async (l) => {
    // Liste reportée (brouillon sans date) : modal obligatoire — pas d’appel API sans date
    if (l.statut === 'BROUILLON' && !l.date_visite) {
      setPlanifierModal({ liste: l });
      return;
    }
    const refTxt = String(l.reference || `#${l.id}`).trim();
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Soumettre à l’infirmier ?',
      html:
        `<p style="text-align:left;margin:0">La liste <strong>${refTxt}</strong> sera envoyée à l’infirmier.</p>`
        + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">Vous ne pourrez plus modifier les candidats de cette liste.</p>',
      showCancelButton: true,
      confirmButtonText: 'Soumettre',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ca8a04',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(l.id);
    try {
      await soumettreListe(l.id);
      await load();
      await Swal.fire({ icon: 'success', title: 'Liste soumise', timer: 2000, showConfirmButton: false });
    } catch (e) {
      const d = e.response?.data;
      if (d?.code === 'DATE_VISITE_REQUISE') {
        setPlanifierModal({ liste: l });
        return;
      }
      await Swal.fire({
        icon: 'error',
        title: 'Soumission',
        text: formatAxiosError(e) || d?.error || d?.detail || 'Erreur lors de la soumission.',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handleConfirmPlanifierDate = async (dateStr) => {
    const l = planifierModal?.liste;
    if (!l) return;
    const trimmed = String(dateStr || '').trim();
    if (!trimmed) {
      await uiAlert({ icon: 'warning', title: 'Date requise', text: 'Veuillez indiquer la date de visite de rattrapage.' });
      return;
    }
    setSubmitting(l.id);
    try {
      await updateDateVisite(l.id, trimmed);
      await soumettreListe(l.id);
      setPlanifierModal(null);
      await load();
    } catch (e) {
      const d = e.response?.data;
      if (d?.code === 'DATE_VISITE_REQUISE') {
        await uiAlert({ icon: 'warning', title: 'Date requise', text: 'Veuillez indiquer la date de visite de rattrapage.' });
        return;
      }
      await uiAlert({
        icon: 'error',
        title: 'Erreur',
        text: d?.error || d?.detail || 'Erreur lors de la planification ou de la soumission.',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handleModifierDate = (l) => {
    if (!l || l.statut !== 'BROUILLON') return;
    setModifierDateModal({ liste: l });
  };

  const handleConfirmModifierDate = async (dateStr) => {
    const l = modifierDateModal?.liste;
    if (!l) return;
    const trimmed = String(dateStr || '').trim();
    if (!trimmed) {
      await uiAlert({ icon: 'warning', title: 'Date requise', text: 'Veuillez indiquer la date de visite.' });
      return;
    }
    setSavingDateId(l.id);
    try {
      await updateDateVisite(l.id, trimmed);
      setModifierDateModal(null);
      await load();
    } catch (e) {
      const d = e.response?.data;
      await uiAlert({
        icon: 'error',
        title: 'Modification date',
        text: formatAxiosError(e) || d?.error || d?.detail || 'Erreur lors de la modification de la date.',
      });
    } finally {
      setSavingDateId(null);
    }
  };

  const handleExport = async (l) => {
    setExporting(l.id);
    try {
      const resp = await exportListe(l.id);
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${l.reference}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      await uiAlert({ icon: 'error', title: 'Export', text: "Erreur lors de l'export." });
    }
    finally { setExporting(null); }
  };

  const handleDelete = async (l) => {
    const ok = await uiConfirm({
      title: 'Suppression',
      text: `Supprimer définitivement ${l.reference} ?`,
      confirmButtonText: 'Supprimer',
    });
    if (!ok) return;
    setDeleting(l.id);
    try { await deleteListe(l.id); await load(); }
    catch {
      await uiAlert({ icon: 'error', title: 'Suppression', text: 'Erreur lors de la suppression.' });
    }
    finally { setDeleting(null); }
  };

  const handleNotifierVeilleListe = async (l) => {
    setVeilleListeId(l.id);
    try {
      const res = await notifierSmsVeilleListeEmbauche(l.id);
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
      setVeilleListeId(null);
    }
  };

  const tableProps = {
    onDetailClick,
    onSoumettre: handleSoumettre,
    onExport: handleExport,
    onDelete: handleDelete,
    onArchiver: handleArchiver,
    submitting, exporting, deleting,
    archiving,
    veilleListeId,
    onNotifierVeille: handleNotifierVeilleListe,
    onModifierDate: handleModifierDate,
    savingDateId,
  };

  /* ── Config des onglets ── */
  const TABS = [
    {
      k: 'brouillon',
      label: 'Brouillon',
      color: '#475569',
      activeBg: '#f1f5f9',
      count: bySection.brouillon.length,
      badgeColor: '#64748b',
    },
    {
      k: 'soumise',
      label: 'Soumise',
      color: '#1d4ed8',
      activeBg: '#dbeafe',
      count: bySection.soumise.length,
      badgeColor: '#1d4ed8',
    },
    {
      k: 'en_traitement',
      label: 'En traitement',
      color: '#a16207',
      activeBg: '#fef9c3',
      count: bySection.en_traitement.length,
      badgeColor: '#ca8a04',
    },
    {
      k: 'reportee',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <IcoWarn /> Reportée
        </span>
      ),
      color: '#dc2626',
      activeBg: '#fef2f2',
      count: bySection.reportee.length,
      badgeColor: '#dc2626',
      pulse: bySection.reportee.length > 0,
    },
    {
      k: 'cloturee',
      label: 'Clôturée',
      color: '#15803d',
      activeBg: '#dcfce7',
      count: bySection.cloturee.length,
      badgeColor: '#15803d',
    },
    {
      k: 'archives',
      label: 'Archives',
      color: '#4338ca',
      activeBg: '#eef2ff',
      count: bySection.archives.length,
      badgeColor: '#4338ca',
    },
  ];

  /* ── Loading spinner ── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Vue « Archives visites » (menu latéral) : uniquement table + filtres, années ≥ 2026 ── */
  if (archivesOnly) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#4338ca', flexWrap: 'wrap' }}>
          <IcoArchive />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Archives des visites</span>
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
          Listes au statut <strong>Archivée</strong> dont la date de visite est en {ANNEE_MIN_ARCHIVES_RH} ou après (ou sans date renseignée).
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginBottom: 16,
          padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="rh-archives-annee" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Année</label>
            <select
              id="rh-archives-annee"
              value={filtreArchiveAnnee}
              onChange={(e) => setFiltreArchiveAnnee(e.target.value)}
              style={{
                minWidth: 120, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 13, fontFamily: 'inherit', color: '#0f172a', background: 'white', cursor: 'pointer',
              }}
            >
              <option value="">Toutes les années</option>
              {anneesPourFiltreArchive.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="rh-archives-mois" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Mois</label>
            <select
              id="rh-archives-mois"
              value={filtreArchiveMois}
              onChange={(e) => setFiltreArchiveMois(e.target.value)}
              style={{
                minWidth: 160, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1',
                fontSize: 13, fontFamily: 'inherit', color: '#0f172a', background: 'white', cursor: 'pointer',
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
                padding: '8px 12px', borderRadius: 8, border: '1px solid #c7d2fe', background: 'white',
                color: '#4338ca', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end',
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
        <TableListes listes={listesArchiveesFiltrees} {...tableProps} />
      </div>
    );
  }

  return (
    <div>
      {planifierModal?.liste && (
        <ModalPlanifierDate
          liste={planifierModal.liste}
          submitting={submitting === planifierModal.liste.id}
          onClose={() => setPlanifierModal(null)}
          onConfirm={handleConfirmPlanifierDate}
        />
      )}
      {modifierDateModal?.liste && (
        <ModalModifierDate
          liste={modifierDateModal.liste}
          saving={savingDateId === modifierDateModal.liste.id}
          onClose={() => setModifierDateModal(null)}
          onConfirm={handleConfirmModifierDate}
        />
      )}
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)} 70%{box-shadow:0 0 0 6px rgba(220,38,38,0)} }
      `}</style>

      {/* ── Alerte reportées ── */}
      {reportees.length > 0 && section !== 'reportee' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#fef2f2', border: '2px solid #fca5a5',
          borderRadius: 14, padding: '14px 20px', marginBottom: 20,
          boxShadow: '0 2px 12px rgba(220,38,38,.12)',
          animation: 'slideIn .3s ease',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' }}>
            <IcoWarn />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#dc2626', marginBottom: 3, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IcoWarn /> {reportees.length} liste{reportees.length > 1 ? 's' : ''} de candidats reportés en attente
            </div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>
              {reportees.reduce((s, l) => s + (l.nombre_candidats || 0), 0)} candidat(s) reportés nécessitent une nouvelle visite médicale.
            </div>
          </div>
          <button onClick={() => setSection('reportee')}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Voir les listes <IcoArrowRight />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Listes d'embauche</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {listes.length} liste{listes.length !== 1 ? 's' : ''} active{listes.length !== 1 ? 's' : ''}
            {listesArchivees.length > 0 && ` · ${listesArchivees.length} archivée${listesArchivees.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <button onClick={onNouvelleClick}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
          + Nouvelle liste
        </button>
      </div>

      {/* ── Onglets — 6 sections ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f1f5f9', paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const active = section === tab.k;
          return (
            <button key={tab.k} onClick={() => setSection(tab.k)}
              style={{
                position: 'relative',
                padding: '9px 16px', borderRadius: '10px 10px 0 0', border: 'none',
                background: active ? tab.activeBg : 'transparent',
                color: active ? tab.color : '#94a3b8',
                fontSize: 13, fontWeight: active ? 800 : 600,
                cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: active ? `3px solid ${tab.color}` : '3px solid transparent',
                transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
              <span>{tab.label}</span>

              {/* Badge compteur */}
              <span style={{
                background: active ? tab.color : '#e2e8f0',
                color: active ? 'white' : '#64748b',
                fontSize: 10, fontWeight: 800,
                padding: '1px 7px', borderRadius: 99,
                minWidth: 20, textAlign: 'center',
                animation: tab.pulse && !active ? 'pulse 2s infinite' : 'none',
              }}>
                {tab.count}
              </span>

              {/* Point rouge pulsant si alerte non sélectionnée */}
              {tab.pulse && !active && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#dc2626', boxShadow: '0 0 0 3px rgba(220,38,38,.25)',
                  animation: 'pulse 2s infinite',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Contenu par onglet ── */}

      {section === 'brouillon' && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
            Listes en cours de préparation — non encore soumises à l'infirmier
          </div>
          <TableListes listes={bySection.brouillon} {...tableProps} />
        </div>
      )}

      {section === 'soumise' && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            Listes transmises à l'infirmier — en attente de prise en charge
          </div>
          <TableListes listes={bySection.soumise} {...tableProps} />
        </div>
      )}

      {section === 'en_traitement' && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#a16207', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
            Visites médicales en cours de réalisation
          </div>
          <TableListes listes={bySection.en_traitement} {...tableProps} />
        </div>
      )}

      {section === 'reportee' && (
        <div>
          {bySection.reportee.length > 0 && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12,
              padding: '12px 18px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <IcoWarn />
              <div>
                <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 13 }}>
                  {reportees.length} liste{reportees.length > 1 ? 's' : ''} — {reportees.reduce((s, l) => s + (l.nombre_candidats || 0), 0)} candidat(s) en attente
                </span>
                <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>
                  Ces candidats ont été reportés lors d'une clôture précédente. Définissez une date et soumettez.
                </div>
              </div>
            </div>
          )}
          <TableListes listes={bySection.reportee} {...tableProps} />
        </div>
      )}

      {section === 'cloturee' && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Listes clôturées — visibles ici jusqu’à archivage manuel (bouton Archiver).
          </div>
          <TableListes listes={bySection.cloturee} {...tableProps} />
        </div>
      )}

      {section === 'archives' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#4338ca', flexWrap: 'wrap' }}>
            <IcoArchive />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Archives des visites</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              — {listesArchiveesFiltrees.length} liste{listesArchiveesFiltrees.length !== 1 ? 's' : ''}
              {filtresArchivesActifs
                ? ` affichée${listesArchiveesFiltrees.length !== 1 ? 's' : ''} sur ${listesArchivees.length}`
                : ''}{' '}
              (statut Archivée)
            </span>
          </div>
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 12, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcoArchive />
            Seules les listes passées en <strong>Archivée</strong> via le bouton Archiver (onglet Clôturée) apparaissent ici.
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginBottom: 16,
            padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="rh-archives-annee" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Année</label>
              <select
                id="rh-archives-annee"
                value={filtreArchiveAnnee}
                onChange={(e) => setFiltreArchiveAnnee(e.target.value)}
                style={{
                  minWidth: 120, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1',
                  fontSize: 13, fontFamily: 'inherit', color: '#0f172a', background: 'white', cursor: 'pointer',
                }}
              >
                <option value="">Toutes les années</option>
                {anneesPourFiltreArchive.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="rh-archives-mois" style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Mois</label>
              <select
                id="rh-archives-mois"
                value={filtreArchiveMois}
                onChange={(e) => setFiltreArchiveMois(e.target.value)}
                style={{
                  minWidth: 160, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1',
                  fontSize: 13, fontFamily: 'inherit', color: '#0f172a', background: 'white', cursor: 'pointer',
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
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #c7d2fe', background: 'white',
                  color: '#4338ca', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end',
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
          <TableListes listes={listesArchiveesFiltrees} {...tableProps} />
        </div>
      )}
    </div>
  );
}