// src/components/infirmier/ListesContreVisitesInfirmier.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  getListes,
  getListeDetail,
  getMedecinsControleurs,
  assignerMedecin,
  setPresenceLigne,
  cloturerListe,
  ajouterLigne,
} from '../../api/Contrevisiteapi';
import axiosInstance from '../../api/axios';
import { displayReposInitialValue } from '../../utils/contreVisiteRepos';
import { nextOrdrePourNouvelleLigne, sortLignesByOrdre } from '../../utils/contreVisiteOrdre';
import { SmsLigneBadge, SmsVeilleBadge } from '../contreVisite/SmsContreVisiteBadges';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';

/* ─── Icons ───────────────────────────────────────────────── */
const IcoArrowLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoAlertCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const pickReference = (liste) => {
  if (!liste || typeof liste !== 'object') return '—';
  return liste.reference || `CV-${liste.id}`;
};

const pickMedecinLabel = (liste) => {
  if (!liste || typeof liste !== 'object') return 'Non assigné';
  const raw =
    liste.medecin_nom ??
    liste.medecinName ??
    liste.medecin_name ??
    liste.medecin ??
    liste.medecin_controleur_nom ??
    liste.medecinControleurNom ??
    liste.medecin_controleur?.nom ??
    liste.medecin_controleur?.user?.full_name ??
    liste.medecin_controleur?.user?.username ??
    liste.medecin_controleur?.user?.first_name ??
    null;
  if (!raw) return 'Non assigné';
  const s = String(raw).trim();
  if (!s || s === '!!') return 'Non assigné';
  return s;
};

const STATUTS = {
  SOUMISE: { label: 'Soumise', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  EN_TRAITEMENT: { label: 'En traitement', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
};

const PRESENCES = {
  EN_ATTENTE: { label: 'En attente', bg: '#f3f4f6', color: '#6b7280' },
  PRESENT: { label: 'Présent', bg: '#f0fdf4', color: '#16a34a' },
  ABSENT: { label: 'Absent', bg: '#fee2e2', color: '#dc2626' },
  REPORTE: { label: 'Reporté', bg: '#fff7ed', color: '#ea580c' },
};

const StatutBadge = ({ statut }) => {
  const s = STATUTS[statut];
  if (!s) return null;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>;
};

const PresenceBadge = ({ presence }) => {
  const p = PRESENCES[presence];
  if (!p) return null;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: p.bg, color: p.color }}>{p.label}</span>;
};

const ResultatBadge = ({ verdict_saisi }) => {
  const done = Boolean(verdict_saisi);
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 99,
        background: done ? '#f0fdf4' : '#f3f4f6',
        color: done ? '#16a34a' : '#6b7280',
      }}
    >
      {done ? '✓ Traité' : 'En attente'}
    </span>
  );
};

/* ─── Styles ───────────────────────────────────────────────── */
const inp = { padding: '8px 11px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, color: '#0f172a', background: 'white', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
const lbl = { display: 'block', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 };
const btn = { padding: '8px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' };

/* ─────────────────────────────────────────────────────────────
   VUE LISTE — Listes de contre-visites pour infirmier
   ───────────────────────────────────────────────────────────── */
function VueListe({ listes, loading, filterStatut, onFilterChange, onOpenListe }) {
  const filtered = filterStatut ? listes.filter(l => l.statut === filterStatut) : listes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {[null, 'SOUMISE', 'EN_TRAITEMENT'].map(s => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            style={{ ...btn, background: filterStatut === s ? '#0284c7' : '#f3f4f6', color: filterStatut === s ? 'white' : '#64748b', flex: 1 }}>
            {s ? STATUTS[s].label : 'Tous'}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'white', borderRadius: 12, border: '1px solid #f3f4f6' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Aucune liste.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Référence', 'Date visite', 'Statut', 'SMS veille', 'Médecin assigné', 'Collaborateurs', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(liste => (
                <tr key={liste.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a' }}>{pickReference(liste)}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{fmtDate(liste.date_visite)}</td>
                  <td style={{ padding: '11px 14px' }}><StatutBadge statut={liste.statut} /></td>
                  <td style={{ padding: '11px 14px' }}><SmsVeilleBadge liste={liste} /></td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{pickMedecinLabel(liste)}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{liste.nombre_collaborateurs || 0}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => onOpenListe(liste)} style={{ ...btn, background: '#e0f2fe', color: '#0369a1', fontSize: 12 }}>Ouvrir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VUE DÉTAIL — Détail d'une liste côté infirmier
   ───────────────────────────────────────────────────────────── */
function VueDetail({ liste, medecins, onBack, loading }) {
  const [detail, setDetail] = useState(liste);
  const [selectedMedecin, setSelectedMedecin] = useState(null);
  const [assigningMedecin, setAssigningMedecin] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmCloture, setShowConfirmCloture] = useState(false);
  const [cloturing, setCloturing] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [addingLigne, setAddingLigne] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const isNotSoumise = detail.statut !== 'SOUMISE';
  /** SMS « 2 premiers de la file » : transition SOUMISE → EN_TRAITEMENT via assigner_medecin (backend). */
  const canAssignMedecin = detail.statut === 'SOUMISE' || detail.statut === 'EN_TRAITEMENT';
  const canCloture = detail.statut === 'EN_TRAITEMENT';
  const medecinActuelLabel = pickMedecinLabel(detail);
  const hasMedecinActuel = medecinActuelLabel !== 'Non assigné';
  const canAddCollab = detail.statut === 'SOUMISE' || detail.statut === 'EN_TRAITEMENT';

  const handleAssignMedecin = async () => {
    if (!selectedMedecin) { setError('Sélectionnez un médecin.'); return; }
    setAssigningMedecin(true);
    setError('');
    try {
      const updated = await assignerMedecin(detail.id, selectedMedecin.id);
      setDetail(updated);
      setSelectedMedecin(null);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur lors de l\'assignation.');
    } finally {
      setAssigningMedecin(false);
    }
  };

  const handleCloture = async () => {
    setCloturing(true);
    setError('');
    try {
      const result = await cloturerListe(detail.id);
      setShowConfirmCloture(false);
      setError(`✓ Liste clôturée. ${result.nombre_reportes || 0} collaborateur(s) reporté(s) dans la liste CV-${result.nouvelle_liste_id}`);
      setTimeout(() => onBack(), 2000);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur lors de la clôture.');
    } finally {
      setCloturing(false);
    }
  };

  const handleSetPresence = async (ligneId, presence, raison = null) => {
    try {
      const updated = await setPresenceLigne(ligneId, presence, raison);
      setDetail(prev => ({
        ...prev,
        lignes: prev.lignes.map(l => l.id === ligneId ? { ...l, presence: updated.presence, raison_report: updated.raison_report } : l),
      }));
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur lors de la mise à jour.');
    }
  };

  const handleSearch = async (val) => {
    setQuery(val);
    setSelectedCollab(null);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await axiosInstance.get('/employees/collaborateurs/', { params: { search: val.trim() } });
      const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setSuggestions(list.slice(0, 8));
      setShowDrop(true);
    } catch {
      setSuggestions([]);
      setShowDrop(false);
    } finally {
      setLoadingSearch(false);
    }
  };

  const pickCollab = (c) => {
    setSelectedCollab(c);
    setQuery(`${c.nom} ${c.prenom} · ${c.matricule}`);
    setShowDrop(false);
    setSuggestions([]);
  };

  const handleAddLigne = async () => {
    if (!selectedCollab?.id) return;
    setAddingLigne(true);
    setError('');
    try {
      await ajouterLigne({
        liste: detail.id,
        collaborateur: selectedCollab.id,
        ordre: nextOrdrePourNouvelleLigne(detail.lignes),
      });
      const updated = await getListeDetail(detail.id);
      setDetail(updated);
      setSelectedCollab(null);
      setQuery('');
      setSuggestions([]);
      setShowDrop(false);
    } catch (e) {
      setError(e?.response?.data?.detail || "Erreur lors de l'ajout (droit backend requis).");
    } finally {
      setAddingLigne(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* En-tête */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f3f4f6', padding: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={onBack} style={{ ...btn, background: '#f3f4f6', color: '#64748b', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}><IcoArrowLeft /> Retour</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{pickReference(detail)}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Date: {fmtDate(detail.date_visite)}</div>
          </div>
          <StatutBadge statut={detail.statut} />
        </div>

        {error && (
          <div style={{ background: error.includes('✓') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${error.includes('✓') ? '#bbf7d0' : '#fecaca'}`, color: error.includes('✓') ? '#16a34a' : '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcoAlertCircle /> {error}
          </div>
        )}

        {isSmsVeilleEnvoye(detail) && (
          <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 12 }}>
            Rappel SMS veille (J−1) : envoyé (confirmé par le serveur).
          </div>
        )}

        {/* Section assignation médecin */}
        {canAssignMedecin && (
          <div
            style={{
              background: 'linear-gradient(180deg,#f0f9ff, #ffffff)',
              border: '1px solid #e0f2fe',
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>Médecin contrôleur</div>
                {detail.statut === 'SOUMISE' && (
                  <div style={{ fontSize: 11, color: '#0369a1', marginTop: 6, lineHeight: 1.45 }}>
                    La première assignation (liste soumise) passe la liste en traitement ; les SMS pour les deux premiers de la file sont gérés par le serveur après cet appel.
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                  Actuel :{' '}
                  <span style={{ fontWeight: 800, color: hasMedecinActuel ? '#0f172a' : '#94a3b8' }}>
                    {hasMedecinActuel ? medecinActuelLabel : 'Non assigné'}
                  </span>
                </div>
              </div>
              {hasMedecinActuel && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: '#ecfeff',
                    color: '#0369a1',
                    border: '1px solid #a5f3fc',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Assigné
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={selectedMedecin ? selectedMedecin.id : ''}
                onChange={(e) => setSelectedMedecin(medecins.find((m) => m.id === parseInt(e.target.value)))}
                style={{ ...inp, flex: 1, background: 'white' }}
              >
                <option value="">{hasMedecinActuel ? '— Modifier le médecin —' : '— Sélectionner un médecin —'}</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} {m.prenom}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignMedecin}
                disabled={!selectedMedecin || assigningMedecin}
                style={{
                  ...btn,
                  background: selectedMedecin && !assigningMedecin ? 'linear-gradient(135deg,#0284c7,#38bdf8)' : '#9ca3af',
                  color: 'white',
                  cursor: selectedMedecin && !assigningMedecin ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedMedecin && !assigningMedecin ? '0 6px 18px rgba(2,132,199,.18)' : 'none',
                }}
              >
                {assigningMedecin ? 'Assignation…' : (hasMedecinActuel ? 'Modifier' : 'Assigner')}
              </button>
            </div>
          </div>
        )}

        {/* Ajouter collaborateur (même après soumission) */}
        {canAddCollab && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', marginBottom: 10 }}>Ajouter un collaborateur</div>
            <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Rechercher par matricule, nom, prénom…"
                  style={{ ...inp }}
                />
                {loadingSearch && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Recherche…</div>}
                {showDrop && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, maxHeight: 220, overflowY: 'auto', zIndex: 200, boxShadow: '0 12px 32px rgba(0,0,0,.14)' }}>
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCollab(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontFamily: 'inherit' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 900, color: '#1d4ed8' }}>
                          {(c.nom || '?')[0]?.toUpperCase?.() || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{c.nom} {c.prenom}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Matricule {c.matricule}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCollab && (
                  <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 800, fontSize: 12 }}>
                    ✓ {selectedCollab.nom} {selectedCollab.prenom} · {selectedCollab.matricule}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddLigne}
                disabled={!selectedCollab || addingLigne}
                style={{
                  ...btn,
                  background: selectedCollab && !addingLigne ? '#0284c7' : '#9ca3af',
                  color: 'white',
                  cursor: selectedCollab && !addingLigne ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {addingLigne ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8 }}>
              Disponible pour les listes <strong>Soumise</strong> / <strong>En traitement</strong>.
            </div>
          </div>
        )}

        {/* Actions */}
        {canCloture && (
          <button onClick={() => setShowConfirmCloture(true)} style={{ ...btn, background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
            <IcoCheck /> Clôturer la liste
          </button>
        )}
      </div>

      {/* Section collaborateurs */}
      <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: 12, border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 14, borderBottom: '1px solid #f3f4f6', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
          Collaborateurs ({(detail.lignes || []).length})
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {(detail.lignes || []).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Aucun collaborateur.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['N°', 'Nom', 'Matricule', 'Département', 'Repos init.', 'SMS jour J', 'Présence', 'Résultat', ...(detail.statut === 'EN_TRAITEMENT' ? ['Actions'] : [])].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortLignesByOrdre(detail.lignes || []).map((ligne, idx) => (
                  <tr key={ligne.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{ligne.collaborateur_nom || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{ligne.collaborateur_matricule || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{ligne.collaborateur_departement || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#0369a1', fontWeight: 700 }}>
                      {(() => {
                        const ri = displayReposInitialValue(
                          ligne.contre_visite?.repos_initial ?? ligne.contreVisite?.repos_initial,
                        );
                        return ri === '—' ? '—' : `${ri} j`;
                      })()}
                    </td>
                    <td style={{ padding: '10px 12px' }}><SmsLigneBadge ligne={ligne} /></td>
                    <td style={{ padding: '10px 12px' }}><PresenceBadge presence={ligne.presence} /></td>
                    <td style={{ padding: '10px 12px' }}><ResultatBadge verdict_saisi={ligne.verdict_saisi} /></td>
                    {detail.statut === 'EN_TRAITEMENT' && (
                      <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                        <button onClick={() => handleSetPresence(ligne.id, 'PRESENT')} style={{ ...btn, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', fontSize: 11 }}>✓ Présent</button>
                        <button onClick={() => handleSetPresence(ligne.id, 'ABSENT')} style={{ ...btn, background: '#fee2e2', color: '#dc2626', padding: '4px 10px', fontSize: 11 }}>✗ Absent</button>
                        <button onClick={() => handleSetPresence(ligne.id, 'REPORTE')} style={{ ...btn, background: '#fff7ed', color: '#ea580c', padding: '4px 10px', fontSize: 11 }}>⏱ Reporté</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal confirmation clôture */}
      {showConfirmCloture && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Clôturer la liste ?</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Les collaborateurs reportés (Absent ou Reporté) seront automatiquement ajoutés à une nouvelle liste de contre-visites.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirmCloture(false)} style={{ ...btn, background: '#f3f4f6', color: '#64748b' }}>Annuler</button>
              <button onClick={handleCloture} disabled={cloturing} style={{ ...btn, background: cloturing ? '#9ca3af' : '#16a34a', color: 'white', cursor: cloturing ? 'not-allowed' : 'pointer' }}>
                {cloturing ? 'Clôture…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ───────────────────────────────────────────────────────────── */
export default function ListesContreVisitesInfirmier() {
  const [listes, setListes] = useState([]);
  const [listeSelectionnee, setListeSelectionnee] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [listesData, medecinsData] = await Promise.all([
          getListes(),
          getMedecinsControleurs(),
        ]);
        // Filtrer côté frontend aussi (backend devrait le faire)
        const filtered = listesData.filter(l => ['SOUMISE', 'EN_TRAITEMENT'].includes(l.statut));
        setListes(filtered);
        setMedecins(medecinsData);
      } catch {
        setListes([]);
        setMedecins([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenListe = async (liste) => {
    try {
      const detail = await getListeDetail(liste.id);
      setListeSelectionnee(detail);
    } catch {
      // error handling
    }
  };

  const handleBack = async () => {
    setLoading(true);
    try {
      const listesData = await getListes();
      const filtered = listesData.filter(l => ['SOUMISE', 'EN_TRAITEMENT'].includes(l.statut));
      setListes(filtered);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setListeSelectionnee(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, padding: '16px 0' }}>
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px' }}>
        {!listeSelectionnee ? (
          <VueListe listes={listes} loading={loading} filterStatut={filterStatut} onFilterChange={setFilterStatut} onOpenListe={handleOpenListe} />
        ) : (
          <VueDetail liste={listeSelectionnee} medecins={medecins} onBack={handleBack} loading={loading} />
        )}
      </div>
    </div>
  );
}
