// src/components/infirmier/ListesVisitesPeriodiquesInfirmier.jsx
// File d'attente infirmier pour les listes de VISITES PÉRIODIQUES (hors embauche).
import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx-js-style';
import { getMedecinsTravail } from '../../api/embaucheApi';
import {
  getListesVisitesPeriodiquesSoumises,
  getListeVisitePeriodique,
  getLignesListePeriodique,
  setPresenceLignePeriodique,
  assignerMedecinListePeriodique,
  cloturerListeVisitePeriodique,
  notifierSmsVeilleListePeriodique,
  notifierLigneVisitePeriodiqueJourJ,
} from '../../api/visitesPeriodiquesApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import {
  enrichLigneVisitePeriodique,
  pickPosteDepuisPayloadCollaborateur,
  resolveEtatAptitudeVisitePeriodique,
  sortLignesVisitePeriodique,
} from '../../utils/ligneVisitePeriodique';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsLigneBadge, SmsVeilleBadge } from '../contreVisite/SmsContreVisiteBadges';
import { afficherReferenceListeVisitePeriodique } from '../../utils/referenceListeVisitePeriodique';
import { getCollaborateurById } from '../../api/actInfirmierApi';
import Swal from 'sweetalert2';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const STATUT_CFG = {
  SOUMISE: { bg: '#dbeafe', color: '#1d4ed8', text: 'Soumise' },
  EN_TRAITEMENT: { bg: '#fef9c3', color: '#a16207', text: 'En traitement' },
  CLOTUREE: { bg: '#dcfce7', color: '#15803d', text: 'Clôturée' },
};

const IcoBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IcoDoctor = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
    <path d="M6 22v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </svg>
);

const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const IcoClipboard = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3h8a2 2 0 0 1 2 2v2H6V5a2 2 0 0 1 2-2z" />
    <rect x="6" y="7" width="12" height="14" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
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
const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
function ligneAFicheAptitude(l) {
  if (!l || typeof l !== 'object') return false;
  if (l.fiche_aptitude_id != null && String(l.fiche_aptitude_id).trim() !== '') return true;
  const f = l.fiche_aptitude;
  if (typeof f === 'number' && !Number.isNaN(f)) return true;
  if (f && typeof f === 'object' && (f.id != null || f.pk != null)) return true;
  return false;
}

async function enrichirPostesDepuisRh(lignesEnriched) {
  const pks = [
    ...new Set(
      lignesEnriched
        .filter((row) => !String(row.poste || '').trim())
        .map((row) => row.collaborateurPk ?? row.collaborateur_id)
        .filter((id) => id != null && id !== '' && !Number.isNaN(Number(id))),
    ),
  ].map(Number);
  if (!pks.length) return lignesEnriched;

  const posteParPk = new Map();
  await Promise.all(
    pks.map(async (pk) => {
      try {
        const data = await getCollaborateurById(pk);
        const p = pickPosteDepuisPayloadCollaborateur(data);
        posteParPk.set(pk, p);
      } catch {
        posteParPk.set(pk, '');
      }
    }),
  );

  return lignesEnriched.map((row) => {
    if (String(row.poste || '').trim()) return row;
    const pk = row.collaborateurPk ?? row.collaborateur_id;
    if (pk == null) return row;
    const p = posteParPk.get(Number(pk));
    return p ? { ...row, poste: p } : row;
  });
}

const IcoArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ETAT_CFG = {
  EN_ATTENTE: { bg: '#f1f5f9', color: '#94a3b8', text: 'En attente' },
  APTE: { bg: '#dcfce7', color: '#15803d', text: 'Apte ✓' },
  INAPTE: { bg: '#fef2f2', color: '#b91c1c', text: 'Inapte' },
};

function ModalMedecin({ listeId, currentMedecinId, onClose, onDone }) {
  const [medecins, setMedecins] = useState([]);
  const [selected, setSelected] = useState(currentMedecinId ? String(currentMedecinId) : '');
  const [loading, setLoading] = useState(false);
  const [loadMed, setLoadMed] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoadMed(true);
    getMedecinsTravail()
      .then(setMedecins)
      .catch(() => setMedecins([]))
      .finally(() => setLoadMed(false));
  }, []);

  const handleSave = async () => {
    if (!selected) {
      setErr('Veuillez sélectionner un médecin.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await assignerMedecinListePeriodique(listeId, Number(selected));
      onDone();
    } catch (e) {
      setErr(e.response?.data?.error || e.response?.data?.detail || "Erreur lors de l'assignation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 16,
          width: 440,
          maxWidth: '92vw',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        }}
      >
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize: 16, fontWeight: 800, color: '#0c4a6e', marginBottom: 16 }}>
          <IcoDoctor /> Médecin du travail — visite périodique
        </div>
        {err && (
          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 12,
              padding: '8px 12px',
              borderRadius: 8,
              marginBottom: 12,
              border: '1px solid #fecaca',
            }}
          >
            {err}
          </div>
        )}
        {loadMed ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#0284c7', fontSize: 13 }}>
            Chargement des médecins…
          </div>
        ) : medecins.length === 0 ? (
          <div
            style={{
              padding: '16px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
              color: '#a16207',
              fontSize: 13,
              marginBottom: 16,
              display:'inline-flex',
              alignItems:'center',
              gap:6,
            }}
          >
            <IcoWarn /> Aucun médecin du travail trouvé.
          </div>
        ) : (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 9,
              border: '1.5px solid #e2e8f0',
              fontSize: 13,
              marginBottom: 16,
              background: 'white',
              color: '#0f172a',
              outline: 'none',
            }}
          >
            <option value="">— Choisir un médecin du travail —</option>
            {medecins.map((m) => (
              <option key={m.id} value={String(m.id)}>
                Dr. {m.nom_complet}
                {m.specialite ? ` — ${m.specialite}` : ''}
              </option>
            ))}
          </select>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !selected || medecins.length === 0}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: !selected || loading ? '#93c5fd' : '#0284c7',
              color: 'white',
              cursor: !selected ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            {loading ? '…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailListe({ listeId, onBack }) {
  const [liste, setListe] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadPres, setLoadPres] = useState(null);
  const [clotLoad, setClotLoad] = useState(false);
  const [showMed, setShowMed] = useState(false);
  const [veilleBusy, setVeilleBusy] = useState(false);
  const [jourJBusyId, setJourJBusyId] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: 'warn' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const det = await getListeVisitePeriodique(listeId);
      setListe(det);
      const L = det.lignes ?? (await getLignesListePeriodique(listeId));
      const raw = Array.isArray(L) ? L : [];
      const enriched = sortLignesVisitePeriodique(raw.map((row) => enrichLigneVisitePeriodique(row)));
      setLignes(await enrichirPostesDepuisRh(enriched));
    } catch {
      setListe(null);
      setLignes([]);
    } finally {
      setLoading(false);
    }
  }, [listeId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNotifierVeille = async () => {
    if (!liste?.id || liste.statut === 'BROUILLON' || liste.statut === 'CLOTUREE' || veilleBusy) return;
    setVeilleBusy(true);
    try {
      const result = await notifierSmsVeilleListePeriodique(liste.id);
      await load();
      const extra = result != null && typeof result === 'object' && result.sms_count != null
        ? ` (${result.sms_count} SMS)`
        : '';
      await Swal.fire({
        icon: 'success',
        title: 'SMS veille (J−1)',
        text: `Demande traitée par le serveur.${extra}`,
        timer: 2200,
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

  const handleNotifierJourJ = async (ligne) => {
    if (!ligne?.id || liste?.statut === 'ARCHIVEE' || jourJBusyId === ligne.id) return;
    setJourJBusyId(ligne.id);
    try {
      await notifierLigneVisitePeriodiqueJourJ(ligne.id);
      await load();
      await Swal.fire({
        icon: 'success',
        title: 'SMS jour J',
        text: 'Demande traitée.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'SMS jour J',
        text: formatAxiosError(e) || e?.message || 'Échec.',
      });
    } finally {
      setJourJBusyId(null);
    }
  };

  const handlePresence = async (ligne, valeur) => {
    if (ligne.presence === valeur || liste?.statut === 'CLOTUREE') return;
    setLoadPres(ligne.id);
    try {
      await setPresenceLignePeriodique(ligne.id, valeur);
      await load();
      setMsg({ text: '', type: 'ok' });
    } catch (e) {
      setMsg({ text: e.response?.data?.error || e.response?.data?.detail || 'Erreur.', type: 'err' });
    } finally {
      setLoadPres(null);
    }
  };

  const handleCloturer = async () => {
    if (!liste.medecin_nom && !liste.medecin) {
      setMsg({ text: 'Assignez un médecin du travail avant de clôturer.', type: 'warn', icon: 'warn' });
      return;
    }
    const nonRens = lignes.filter((l) => l.presence === 'NON_RENSEIGNEE').length;
    const { isConfirmed } = await Swal.fire({
      title: 'Clôturer cette liste de visites périodiques ?',
      html: nonRens > 0
        ? `Il y a <strong>${nonRens}</strong> ligne(s) sans présence renseignée.<br/>Continuer la clôture ?`
        : 'Cette action est irréversible.',
      icon: nonRens > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Clôturer',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#64748b',
      customClass: { popup: 'swal2-vp-inf' },
      buttonsStyling: true,
    });
    if (!isConfirmed) return;
    setClotLoad(true);
    try {
      await cloturerListeVisitePeriodique(listeId);
      await load();
      setMsg({ text: '✓ Liste clôturée.', type: 'ok' });
    } catch (e) {
      setMsg({ text: e.response?.data?.error || e.response?.data?.detail || 'Erreur.', type: 'err' });
    } finally {
      setClotLoad(false);
    }
  };

  if (loading || !liste) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div
          style={{
            width: 28,
            height: 28,
            border: '3px solid #bae6fd',
            borderTopColor: '#0284c7',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const nbPresents = lignes.filter((l) => l.presence === 'PRESENT').length;
  const nbAbsents = lignes.filter((l) => l.presence === 'ABSENT').length;
  const nbAttente = lignes.filter(
    (l) =>
      l.presence === 'NON_RENSEIGNEE' || (l.presence === 'PRESENT' && !ligneAFicheAptitude(l))
  ).length;
  const isCloturee = liste.statut === 'CLOTUREE';
  const canCloturer = !isCloturee && lignes.length > 0;
  const noMedecin = !liste.medecin_nom && !liste.medecin && !isCloturee;

  const statCfg = STATUT_CFG[liste.statut] || { bg: '#f1f5f9', color: '#475569', text: liste.statut };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 20px',
          borderBottom: '1px solid rgba(2,132,199,.18)',
          flexShrink: 0,
          background: 'rgba(255,255,255,.7)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'rgba(2,132,199,.1)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#0c4a6e',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <IcoBack />
          Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0c4a6e' }}>
              {afficherReferenceListeVisitePeriodique(liste)}
            </span>
            <span
              style={{
                background: '#fef3c7',
                color: '#b45309',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              Visite périodique
            </span>
            <span
              style={{
                background: statCfg.bg,
                color: statCfg.color,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
              }}
            >
              {statCfg.text}
            </span>
            <SmsVeilleBadge liste={liste} />
            {liste.statut !== 'BROUILLON' && liste.statut !== 'CLOTUREE' && !isSmsVeilleEnvoye(liste) && (
              <button
                type="button"
                onClick={handleNotifierVeille}
                disabled={veilleBusy}
                style={{
                  marginLeft: 4,
                  padding: '4px 12px',
                  borderRadius: 8,
                  border: '1px solid #bae6fd',
                  background: veilleBusy ? '#f1f5f9' : 'white',
                  color: '#0369a1',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  cursor: veilleBusy ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {veilleBusy ? '…' : 'Envoyer SMS veille'}
              </button>
            )}
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize: 12, color: '#0284c7', marginTop: 2 }}>
            <IcoCalendar />{fmtDate(liste.date_visite)}
          </div>
          {isSmsVeilleEnvoye(liste) && liste.statut !== 'BROUILLON' && (
            <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: '#065f46', background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px' }}>
              Rappel SMS veille (J−1) enregistré côté serveur.
            </div>
          )}
        </div>
        {!isCloturee && (
          <button
            type="button"
            onClick={() => setShowMed(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 9,
              border: liste.medecin_nom ? '1.5px solid #bae6fd' : '2px solid #f59e0b',
              background: liste.medecin_nom ? 'white' : '#fffbeb',
              color: liste.medecin_nom ? '#0284c7' : '#b45309',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            <IcoDoctor />
            {liste.medecin_nom ? `Dr. ${liste.medecin_nom}` : 'Assigner médecin'}
          </button>
        )}
        {canCloturer && (
          <button
            type="button"
            onClick={handleCloturer}
            disabled={clotLoad}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 16px',
              background: '#15803d',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            <IcoLock />
            {clotLoad ? '…' : 'Clôturer'}
          </button>
        )}
        {isCloturee && (
          <span
            style={{
              fontSize: 12,
              color: '#15803d',
              background: '#dcfce7',
              padding: '6px 12px',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            ✓ Clôturée
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 10,
          padding: '12px 20px',
          flexShrink: 0,
        }}
      >
        {[
          { label: 'Total', val: lignes.length, color: '#0284c7', bg: '#e0f2fe' },
          { label: 'Présents', val: nbPresents, color: '#15803d', bg: '#dcfce7' },
          { label: 'Absents', val: nbAbsents, color: '#b91c1c', bg: '#fef2f2' },
          { label: 'En attente', val: nbAttente, color: '#a16207', bg: '#fef9c3' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: s.bg, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: s.color,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {s.val}
            </div>
            <div style={{ fontSize: 11, color: s.color, opacity: 0.8, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {msg.text && (
        <div
          style={{
            margin: '0 20px 8px',
            background: msg.type === 'err' ? '#fef2f2' : msg.type === 'ok' ? '#f0fdf4' : '#fef9c3',
            border: `1px solid ${msg.type === 'err' ? '#fecaca' : msg.type === 'ok' ? '#86efac' : '#fde68a'}`,
            color: msg.type === 'err' ? '#b91c1c' : msg.type === 'ok' ? '#15803d' : '#a16207',
            padding: '9px 14px',
            borderRadius: 10,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {msg.text}
          <button
            type="button"
            onClick={() => setMsg({ text: '', type: 'warn' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 18 }}
          >
            ×
          </button>
        </div>
      )}

      {!isCloturee && noMedecin && (
        <div
          style={{
            margin: '0 20px 6px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            padding: '9px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            display:'inline-flex',
            alignItems:'center',
            gap:6,
          }}
        >
          <IcoWarn /> Assignez un médecin avant clôture.
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0f2fe', overflow: 'hidden' }}>
          <div
            style={{
              padding: '10px 14px',
              background: '#fffbeb',
              borderBottom: '1px solid #fde68a',
              fontSize: 11,
              fontWeight: 700,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
            >
            Collaborateurs — visite périodique (hors embauche)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fbff', borderBottom: '1px solid #e0f2fe' }}>
                {['#', 'Nom', 'Matricule', 'Poste', 'Présence', 'SMS jour J', 'Aptitude'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#0284c7',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    Aucune ligne dans cette liste.
                  </td>
                </tr>
              ) : (
                lignes.map((c, i) => {
                  const etatKey = resolveEtatAptitudeVisitePeriodique(c);
                  const displayNom = `${c.nom || ''} ${c.prenom || ''}`.trim() || c.nom_complet || '—';
                  const etatCfg = ETAT_CFG[etatKey] || ETAT_CFG.EN_ATTENTE;
                  const isLoad = loadPres === c.id;
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: i < lignes.length - 1 ? '1px solid #f0f9ff' : 'none',
                        background: c.presence === 'ABSENT' ? '#fffbeb' : 'white',
                      }}
                    >
                      <td style={{ padding: '11px 14px', color: '#94a3b8', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0c4a6e' }}>
                        {displayNom}
                      </td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#0284c7', fontSize: 12 }}>
                        {c.matricule || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#475569' }}>{c.poste || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {isCloturee ? (
                          <span
                            style={{
                              background:
                                c.presence === 'PRESENT'
                                  ? '#dcfce7'
                                  : c.presence === 'ABSENT'
                                    ? '#fef2f2'
                                    : '#f1f5f9',
                              color:
                                c.presence === 'PRESENT'
                                  ? '#15803d'
                                  : c.presence === 'ABSENT'
                                    ? '#b91c1c'
                                    : '#94a3b8',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 20,
                            }}
                          >
                            {c.presence === 'PRESENT'
                              ? 'Présent'
                              : c.presence === 'ABSENT'
                                ? 'Absent'
                                : '—'}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 5 }}>
                            {[
                              { val: 'PRESENT', label: 'Présent', bg: '#15803d' },
                              { val: 'ABSENT', label: 'Absent', bg: '#b91c1c' },
                            ].map((opt) => {
                              const isActive = c.presence === opt.val;
                              return (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => handlePresence(c, opt.val)}
                                  disabled={isLoad}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 7,
                                    border: 'none',
                                    background: isActive ? opt.bg : '#f1f5f9',
                                    color: isActive ? 'white' : '#64748b',
                                    cursor: isLoad ? 'wait' : 'pointer',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    fontFamily: 'inherit',
                                    opacity: isLoad ? 0.6 : 1,
                                  }}
                                >
                                  {isLoad && isActive ? '…' : opt.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <SmsLigneBadge ligne={c} />
                          {liste?.statut !== 'ARCHIVEE' && c?.id != null && (
                            <button
                              type="button"
                              onClick={() => handleNotifierJourJ(c)}
                              disabled={jourJBusyId === c.id}
                              title="Renvoyer le SMS jour J pour cette ligne"
                              style={{
                                padding: '4px 10px',
                                borderRadius: 7,
                                border: '1px solid #e2e8f0',
                                background: jourJBusyId === c.id ? '#f1f5f9' : 'white',
                                color: '#0369a1',
                                fontSize: 10,
                                fontWeight: 800,
                                fontFamily: 'inherit',
                                cursor: jourJBusyId === c.id ? 'wait' : 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {jourJBusyId === c.id ? '…' : 'Renvoyer SMS'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span
                          style={{
                            background: etatCfg.bg,
                            color: etatCfg.color,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 20,
                          }}
                        >
                          {etatCfg.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMed && (
        <ModalMedecin
          listeId={liste.id}
          currentMedecinId={liste.medecin}
          onClose={() => setShowMed(false)}
          onDone={() => {
            setShowMed(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function VueListes({ onSelect }) {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setListes(await getListesVisitesPeriodiquesSoumises());
    } catch {
      setListes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExportVisites = async () => {
    setExportLoading(true);
    try {
      const rows = listes.map((l) => ({
        Référence: afficherReferenceListeVisitePeriodique(l),
        Date: l.date_visite ? new Date(l.date_visite).toLocaleDateString('fr-FR') : '',
        Statut: STATUT_CFG[l.statut]?.text || l.statut || '',
        Collaborateurs: l.nombre_lignes ?? l.nombre_candidats ?? 0,
        Présents: l.nombre_presents ?? 0,
        Taux: `${Math.round(((l.nombre_presents || 0) / (l.nombre_lignes || l.nombre_candidats || 1)) * 100)}%`,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Visites périodiques');
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `visites-periodiques-${dateStr}.xlsx`);
    } catch (err) {
      console.error('Erreur export visites périodiques:', err);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div
          style={{
            width: 28,
            height: 28,
            border: '3px solid #bae6fd',
            borderTopColor: '#0284c7',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(2,132,199,.18)',
          flexShrink: 0,
          background: 'rgba(255,255,255,.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0c4a6e' }}>Visites périodiques (RH)</div>
          <div style={{ fontSize: 12, color: '#b45309', marginTop: 2, fontWeight: 600 }}>
            Flux séparé des listes d&apos;embauche · {listes.length} liste{listes.length !== 1 ? 's' : ''} à traiter
          </div>
        </div>
        <button
          onClick={handleExportVisites}
          disabled={exportLoading}
          style={{
            padding: '7px 15px',
            border: '1px solid #bfdbfe',
            background: 'white',
            color: exportLoading ? '#d1d5db' : '#2563eb',
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: exportLoading ? 'not-allowed' : 'pointer',
            transition: 'all .12s',
            opacity: exportLoading ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => !exportLoading && (e.currentTarget.style.background = '#eff6ff')}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          {exportLoading ? 'Export en cours…' : 'Exporter Excel'}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {listes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width:40, height:40, margin:'0 auto 14px', color:'#0284c7' }}><IcoClipboard /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0c4a6e', marginBottom: 6 }}>
              Aucune liste périodique en attente
            </div>
            <div style={{ fontSize: 13, color: '#0284c7' }}>
              La RH envoie les listes depuis l&apos;écran &quot;Visites périodiques&quot;.
            </div>
          </div>
        ) : (
          listes.map((l) => {
            const pct = l.nombre_lignes || l.nombre_candidats
              ? Math.round(((l.nombre_presents || 0) / (l.nombre_lignes || l.nombre_candidats)) * 100)
              : 0;
            const cfg = STATUT_CFG[l.statut] || { bg: '#f1f5f9', color: '#475569', text: l.statut };
            const n = l.nombre_lignes ?? l.nombre_candidats ?? 0;
            return (
              <div
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(l.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(l.id)}
                style={{
                  background: 'white',
                  borderRadius: 13,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  border: '2px solid #fde68a',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0c4a6e' }}>
                    {afficherReferenceListeVisitePeriodique(l)}
                  </div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize: 11, color: '#0284c7', marginTop: 2 }}><IcoCalendar />{fmtDate(l.date_visite)}</div>
                  </div>
                  <span
                    style={{
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                  >
                    {cfg.text}
                  </span>
                </div>
                {l.medecin_nom ? (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize: 11, color: '#0284c7', marginBottom: 8, fontWeight: 600 }}>
                    <IcoDoctor /> Dr. {l.medecin_nom}
                  </div>
                ) : (
                  <div
                    style={{
                      display:'inline-flex',
                      alignItems:'center',
                      gap:6,
                      fontSize: 11,
                      color: '#b45309',
                      marginBottom: 8,
                      background: '#fffbeb',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontWeight: 600,
                      border: '1px solid #fde68a',
                    }}
                  >
                    <IcoWarn /> Médecin non assigné
                  </div>
                )}
                <div style={{ height: 5, background: '#e0f2fe', borderRadius: 4, marginBottom: 10 }}>
                  <div
                    style={{
                      height: 5,
                      background: pct === 100 ? '#22c55e' : '#d97706',
                      borderRadius: 4,
                      width: `${pct}%`,
                      transition: 'width .3s',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    👥 {n} collaborateur{n !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize: 11, color: '#0284c7', fontWeight: 700 }}>
                    Ouvrir <IcoArrowRight />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(245,158,11,.25)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={load}
          style={{
            width: '100%',
            padding: '9px',
            borderRadius: 10,
            border: '1.5px solid #fde68a',
            background: 'rgba(254,243,199,.5)',
            color: '#92400e',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'inherit',
          }}
        >
          ↻ Actualiser
        </button>
      </div>
    </div>
  );
}

export default function ListesVisitesPeriodiquesInfirmier() {
  const [selectedId, setSelectedId] = useState(null);
  if (selectedId) {
    return <DetailListe listeId={selectedId} onBack={() => setSelectedId(null)} />;
  }
  return <VueListes onSelect={setSelectedId} />;
}
