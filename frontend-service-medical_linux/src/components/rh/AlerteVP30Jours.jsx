// src/components/rh/AlerteVP30Jours.jsx
// Alertes VP RH — redesign aligné sur le thème bleu de l'app (cohérent avec Listes d'embauche)
import { useMemo, useState, useEffect, useCallback } from 'react';
import { fetchVpAlertsRh } from '../../api/Medicalworkapi';
import {
  creerListeVisitePeriodique,
  creerListeVisitePeriodiqueEtSoumettre,
  patchListeVisitePeriodique,
} from '../../api/visitesPeriodiquesApi';
import { afficherReferenceListeVisitePeriodique } from '../../utils/referenceListeVisitePeriodique';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { getUserSiteId } from '../../utils/siteAccessControl';

const T = {
  primary: '#0284c7', primaryDark: '#0369a1', primaryDeep: '#0c4a6e',
  border: '#bae6fd', borderLight: '#e0f2fe', bg: '#f0f9ff', bgCard: '#ffffff',
  muted: '#64748b', danger: '#b91c1c', dangerBg: '#fef2f2',
  warning: '#d97706', warningBg: '#fffbeb', success: '#15803d', successBg: '#dcfce7',
};

const CB = { width: 16, height: 16, minWidth: 16, minHeight: 16, cursor: 'pointer', accentColor: T.primary };

function pickCollaborateurPkAlert(r) {
  if (!r || typeof r !== 'object') return null;
  const fromFiche =
    r.fiche && typeof r.fiche === 'object'
      ? (r.fiche.collaborateur_id ??
        (r.fiche.collaborateur && typeof r.fiche.collaborateur === 'object'
          ? (r.fiche.collaborateur.id ?? r.fiche.collaborateur.pk)
          : r.fiche.collaborateur))
      : null;
  const nested = r.collaborateur && typeof r.collaborateur === 'object' ? (r.collaborateur.id ?? r.collaborateur.pk) : null;
  const v = r.collaborateur_id ?? fromFiche ?? r.collaborateur ?? nested ?? null;
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isNaN(n) ? null : n;
}
function pickNomPrenom(r) {
  if (!r || typeof r !== 'object') return { nom: '', prenom: '' };
  const c = r.collaborateur && typeof r.collaborateur === 'object' ? r.collaborateur : null;
  const cf = r.fiche?.collaborateur && typeof r.fiche.collaborateur === 'object' ? r.fiche.collaborateur : null;
  const src = c || cf;
  if (src) return { nom: String(src.nom || '').trim(), prenom: String(src.prenom || '').trim() };
  return { nom: String(r.nom ?? r.collaborateur_nom ?? '').trim(), prenom: String(r.prenom ?? r.collaborateur_prenom ?? '').trim() };
}
function pickMatricule(r) {
  if (!r || typeof r !== 'object') return '';
  const c = r.collaborateur && typeof r.collaborateur === 'object' ? r.collaborateur : null;
  const cf = r.fiche?.collaborateur && typeof r.fiche.collaborateur === 'object' ? r.fiche.collaborateur : null;
  const src = c || cf;
  if (src?.matricule) return String(src.matricule).trim();
  return String(r.matricule ?? r.collaborateur_matricule ?? '').trim();
}
function pickDepartementLabel(r) {
  const nested = r?.collaborateur && typeof r.collaborateur === 'object' ? (r.collaborateur.departement ?? r.collaborateur.department) : null;
  const d = r?.departement ?? r?.collaborateur_departement ?? r?.department ?? nested ?? null;
  return d ? String(d) : '—';
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('fr-FR');
}
function pickJoursRestants(r) {
  if (r == null || typeof r !== 'object') return null;
  if (typeof r.jours_avant_echeance === 'number') return r.jours_avant_echeance;
  const raw = r.jours_avant_echeance ?? r.joursAvantEcheance ?? r.jours_restants;
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function pickEstEnRetard(r) {
  if (r == null || typeof r !== 'object') return false;
  return r.est_en_retard === true;
}
function badgeDelaiVpRh(r) {
  const enRetard = pickEstEnRetard(r);
  const jours = pickJoursRestants(r);
  if (enRetard) {
    const x = jours != null ? Math.abs(jours) : '—';
    return { text: `En retard · ${x} j.`, color: T.danger, bg: T.dangerBg, dot: '#ef4444' };
  }
  const x = jours != null ? jours : '—';
  return { text: `Dans ${x} j.`, color: T.warning, bg: T.warningBg, dot: '#f59e0b' };
}
function rowKey(r, idx) {
  if (r?.collaborateur_id != null) return `c-${r.collaborateur_id}`;
  if (r?.matricule != null && String(r.matricule).trim()) return `m-${String(r.matricule).trim()}`;
  return `i-${idx}`;
}
const todayIso = () => new Date().toISOString().slice(0, 10);
const EMPTY_DRAFT_SET = new Set();

const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcoSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IcoBell = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
export function AlerteVP30Jours({
  onHasAlertsChange,
  onListePeriodiqueCreee,
  draftCollabIdSet,
  onSoumissionSucces,
  onDraftCollabsAdded,
  onDraftCollabsRemoved,
  refreshSignal = 0,
  embedded = false,
  onHorizonAlertCollaborateurIds,
}) {
  const draftSet = draftCollabIdSet ?? EMPTY_DRAFT_SET;
  const [alerts, setAlerts] = useState({
    count: 0,
    results: [],
    count_api: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [dateVisite, setDateVisite] = useState(todayIso);
  const [creating, setCreating] = useState(false);
  const [alertsRefreshing, setAlertsRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  /** Après un premier POST brouillon réussi : id connu → prochains enregistrements en PATCH (pas de second POST). */
  const [listeBrouillonId, setListeBrouillonId] = useState(null);
  const [listeBrouillonRefLabel, setListeBrouillonRefLabel] = useState('');

  const reloadAlerts = useCallback(async () => {
    try {
      const res = await fetchVpAlertsRh();
      const safe = res && typeof res === 'object' ? res : {};
      const cnt = typeof safe.count === 'number' ? safe.count : (Array.isArray(safe.results) ? safe.results.length : 0);
      const cntApi = typeof safe.count_api === 'number' ? safe.count_api : cnt;
      setAlerts({
        count: cnt,
        count_api: cntApi,
        results: Array.isArray(safe.results) ? safe.results : [],
      });
      setError('');
    } catch (e) {
      console.error(e);
      setError('Impossible de charger les alertes.');
      setAlerts({
        count: 0,
        count_api: 0,
        results: [],
      });
    }
  }, []);

  const siteKey = getUserSiteId();

  useEffect(() => {
    let mounted = true;
    setListeBrouillonId(null);
    setListeBrouillonRefLabel('');
    setLoading(true); setError('');
    (async () => {
      try {
        const res = await fetchVpAlertsRh();
        if (!mounted) return;
        const safe = res && typeof res === 'object' ? res : {};
        const cnt = typeof safe.count === 'number' ? safe.count : (Array.isArray(safe.results) ? safe.results.length : 0);
        const cntApi = typeof safe.count_api === 'number' ? safe.count_api : cnt;
        setAlerts({
          count: cnt,
          count_api: cntApi,
          results: Array.isArray(safe.results) ? safe.results : [],
        });
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setError('Impossible de charger les alertes.');
        setAlerts({
          count: 0,
          count_api: 0,
          results: [],
        });
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [siteKey]);

  useEffect(() => {
    const onHz = () => {
      reloadAlerts();
    };
    window.addEventListener('rh-vp-horizon-changed', onHz);
    return () => window.removeEventListener('rh-vp-horizon-changed', onHz);
  }, [reloadAlerts]);

  useEffect(() => { if (!refreshSignal) return; reloadAlerts(); }, [refreshSignal, reloadAlerts]);
  const rowCount = (alerts.results || []).length;
  useEffect(() => {
    onHasAlertsChange?.(rowCount > 0 || (typeof alerts.count === 'number' && alerts.count > 0));
  }, [alerts.count, rowCount, onHasAlertsChange]);

  const sortedRows = useMemo(() => {
    const rows = [...(alerts.results || [])];
    rows.sort((a, b) => {
      const ta = new Date(a?.echeance || a?.date_echeance || 0).getTime();
      const tb = new Date(b?.echeance || b?.date_echeance || 0).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1; if (Number.isNaN(tb)) return -1;
      return ta - tb;
    });
    return rows;
  }, [alerts.results]);

  const selectableIds = useMemo(() => {
    const ids = new Set();
    sortedRows.forEach((r) => { const pk = pickCollaborateurPkAlert(r); if (pk != null) ids.add(pk); });
    return ids;
  }, [sortedRows]);

  useEffect(() => {
    onHorizonAlertCollaborateurIds?.(new Set(selectableIds));
  }, [selectableIds, onHorizonAlertCollaborateurIds]);

  const toggleRow = (pk) => {
    if (pk == null) return;
    setSelected((prev) => { const next = new Set(prev); if (next.has(pk)) next.delete(pk); else next.add(pk); return next; });
  };
  const toggleAll = () => {
    if (selectableIds.size === 0) return;
    if (selected.size === selectableIds.size) setSelected(new Set()); else setSelected(new Set(selectableIds));
  };

  const collaborateur_ids = useMemo(() => [...selected].filter((id) => selectableIds.has(id)), [selected, selectableIds]);
  const nSel = collaborateur_ids.length;
  const disabledActions =
    creating || alertsRefreshing || !dateVisite?.trim() || (nSel === 0 && listeBrouillonId == null);

  const handleCreerBrouillon = async () => {
    if (disabledActions) return;
    if (!dateVisite?.trim()) { setActionErr('Choisissez une date de visite.'); return; }
    const wasUpdate = listeBrouillonId != null;
    setCreating(true); setActionErr(''); setActionMsg('');
    try {
      let liste;
      if (wasUpdate) {
        liste = await patchListeVisitePeriodique(listeBrouillonId, {
          date_visite: dateVisite,
          ...(nSel > 0 ? { collaborateur_ids } : {}),
        });
      } else {
        liste = await creerListeVisitePeriodique({ date_visite: dateVisite, collaborateur_ids });
        const lid = liste?.id ?? liste?.pk;
        if (lid != null && lid !== '') {
          setListeBrouillonId(Number(lid) || lid);
          setListeBrouillonRefLabel(afficherReferenceListeVisitePeriodique(liste));
        }
      }
      onDraftCollabsAdded?.(collaborateur_ids);
      setActionMsg(
        wasUpdate
          ? `Brouillon ${afficherReferenceListeVisitePeriodique(liste)} mis à jour.`
          : `Liste brouillon ${afficherReferenceListeVisitePeriodique(liste)} — vous pouvez l'envoyer depuis « Suivi des listes » ou cliquer à nouveau pour mettre à jour.`,
      );
      onListePeriodiqueCreee?.();
    } catch (e) { setActionErr(formatAxiosError(e) || 'Impossible de créer la liste.'); }
    finally { setCreating(false); }
  };

  const handleCreerEtSoumettre = async () => {
    if (disabledActions) return;
    if (!dateVisite?.trim()) { setActionErr('Choisissez une date de visite.'); return; }
    const idsSnapshot = [...collaborateur_ids]; const nSoumis = listeBrouillonId != null && nSel === 0 ? 0 : idsSnapshot.length;
    setCreating(true); setAlertsRefreshing(true); setActionErr(''); setActionMsg('');
    try {
      const liste = await creerListeVisitePeriodiqueEtSoumettre({
        date_visite: dateVisite,
        collaborateur_ids: nSel > 0 ? collaborateur_ids : [],
        listeIdExisting: listeBrouillonId ?? undefined,
      });
      setListeBrouillonId(null);
      setListeBrouillonRefLabel('');
      setSelected(new Set()); onListePeriodiqueCreee?.();
      await reloadAlerts();
      if (idsSnapshot.length) onDraftCollabsRemoved?.(idsSnapshot);
      onSoumissionSucces?.({ referenceLabel: afficherReferenceListeVisitePeriodique(liste), nbCollaborateurs: nSoumis });
    } catch (e) { setActionErr(formatAxiosError(e) || "Impossible de créer ou d'envoyer la liste."); }
    finally { setAlertsRefreshing(false); setCreating(false); }
  };

  const headerBlock = (
    <div style={{ padding: '14px 18px', background: `linear-gradient(135deg, ${T.bg}, #e0f2fe)`, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
        <span style={{ color: T.primary, flexShrink: 0 }}><IcoBell /></span>
        <span style={{ fontWeight: 800, fontSize: 14, color: T.primaryDeep }}>Échéances à anticiper</span>
      </div>
    </div>
  );

  const shellCard = embedded
    ? { borderRadius: 0, border: 'none', overflow: 'hidden', background: T.bgCard, marginBottom: 0, boxShadow: 'none' }
    : { borderRadius: 14, border: `1.5px solid ${T.border}`, overflow: 'hidden', background: T.bgCard, marginBottom: 0, boxShadow: '0 4px 22px rgba(14,165,233,.10)' };

  if (loading) {
    return (
      <div style={shellCard}>
        {!embedded && headerBlock}
        <div style={{ padding: embedded ? 20 : 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>Chargement…</div>
      </div>
    );
  }

  /* Vide réel : pas de lignes ; si le backend envoie count>0 sans lignes, on n’affiche pas « tout va bien ». */
  if (rowCount === 0 && alerts.count === 0) {
    return (
      <div style={shellCard}>
        {!embedded && headerBlock}
        {error ? (
          <div style={{ padding: '12px 18px', color: T.danger, fontSize: 13 }}>{error}</div>
        ) : (
          <div style={{ padding: embedded ? '16px 18px' : '18px 20px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
              {embedded
                ? 'Aucune alerte pour le moment. Après envoi d’une liste, les collaborateurs concernés ne s’affichent plus ici.'
                : 'Aucune alerte pour le moment. Après envoi d’une liste, les personnes concernées ne s’affichent plus ici.'}
            </p>
            {(siteKey === null || siteKey === undefined || String(siteKey).trim() === '') && (
              <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9a3412', lineHeight: 1.45 }}>
                Aucun site n’est associé à votre session : les résultats peuvent être vides. Vérifiez votre profil.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (rowCount === 0 && alerts.count > 0) {
    return (
      <div style={shellCard}>
        {!embedded && headerBlock}
        <div style={{ padding: '14px 18px', fontSize: 13, color: T.primaryDeep }}>
          Données incomplètes : le serveur signale des alertes mais la liste détaillée est vide. Réessayez ou contactez le support technique.
          {error && <div style={{ marginTop: 10, color: T.danger }}>{error}</div>}
        </div>
      </div>
    );
  }

  const allSelected = selectableIds.size > 0 && selected.size === selectableIds.size;

  const datePickerEl = (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: T.primaryDeep, background: 'white', border: `1.5px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
      <IcoCalendar />
      <input type="date" value={dateVisite} onChange={(e) => setDateVisite(e.target.value)} disabled={creating || alertsRefreshing} aria-label="Date de visite" style={{ border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 12, color: T.primaryDeep, background: 'transparent', cursor: 'pointer' }} />
    </label>
  );

  const actionButtonsEl = (
    <>
      <button type="button" disabled={disabledActions} onClick={handleCreerEtSoumettre} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: disabledActions ? '#bae6fd' : `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, color: disabledActions ? '#94a3b8' : 'white', fontWeight: 700, fontSize: 12.5, cursor: disabledActions ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: disabledActions ? 'none' : '0 2px 10px rgba(2,132,199,.3)' }}>
        <IcoSend />Envoyer à l&apos;infirmier{nSel > 0 ? ` (${nSel})` : ''}
      </button>
      <button type="button" disabled={disabledActions} onClick={handleCreerBrouillon} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${disabledActions ? '#e2e8f0' : T.border}`, background: 'white', color: disabledActions ? '#cbd5e1' : T.primaryDark, fontWeight: 700, fontSize: 12, cursor: disabledActions ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        <IcoSave />{listeBrouillonId != null ? 'Mettre à jour le brouillon' : 'Brouillon'}{nSel > 0 ? ` (${nSel})` : ''}
      </button>
    </>
  );

  return (
    <div style={shellCard}>
      {/* En-tête + actions */}
      <div
        style={{
          padding: embedded ? '12px 16px' : '14px 18px',
          background: embedded ? '#fafafa' : `linear-gradient(135deg, ${T.bg}, #e0f2fe)`,
          borderBottom: `1px solid ${embedded ? '#e2e8f0' : T.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {embedded ? (
            <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.45, flex: '1 1 200px' }}>
              <strong style={{ color: T.primaryDeep }}>{alerts.count}</strong>
              {alerts.count <= 1 ? ' collaborateur à traiter — ' : ' collaborateurs à traiter — '}
              cochez les lignes, puis envoi à l&apos;infirmier ou brouillon.
            </p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: '1 1 220px', minWidth: 0 }}>
              <span style={{ color: T.primary, flexShrink: 0, marginTop: 2 }}><IcoBell /></span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: T.primaryDeep }}>Échéances à anticiper</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                  <strong style={{ color: T.primaryDark }}>{alerts.count}</strong>
                  {alerts.count <= 1 ? ' personne — ' : ' personnes — '}
                  sélection puis envoi ou brouillon.
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {datePickerEl}
            {actionButtonsEl}
          </div>
        </div>
        {actionErr && <div style={{ marginTop: 8, fontSize: 12, color: T.danger, fontWeight: 600, background: T.dangerBg, padding: '6px 10px', borderRadius: 6, border: `1px solid #fecaca` }}>{actionErr}</div>}
        {listeBrouillonId != null && listeBrouillonRefLabel && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 11.5, color: T.primaryDeep, background: T.bg, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}` }}>
            <span>Édition du brouillon <strong>{listeBrouillonRefLabel}</strong> — les prochains enregistrements mettent à jour cette liste (PATCH), sans nouveau POST.</span>
            <button
              type="button"
              disabled={creating || alertsRefreshing}
              onClick={() => { setListeBrouillonId(null); setListeBrouillonRefLabel(''); setActionMsg(''); }}
              style={{ fontSize: 11, fontWeight: 700, color: T.primaryDark, background: 'white', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: creating || alertsRefreshing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              Nouvelle liste
            </button>
          </div>
        )}
        {actionMsg && <div style={{ marginTop: 8, fontSize: 12, color: T.success, fontWeight: 600, background: T.successBg, padding: '6px 10px', borderRadius: 6, border: `1px solid #bbf7d0` }}>{actionMsg}</div>}
        {error && <div style={{ marginTop: 8, fontSize: 12, color: T.danger }}>{error}</div>}
      </div>

      {/* Tableau */}
      <div style={{ position: 'relative', overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
        {alertsRefreshing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(2px)' }} aria-busy="true">
            <span style={{ fontSize: 13, color: T.primary, fontWeight: 700 }}>Mise à jour…</span>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: embedded ? '#f1f5f9' : `linear-gradient(135deg, #e0f2fe, #bae6fd)`, borderBottom: `1px solid ${T.border}` }}>
              <th style={{ width: 44, padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                <input type="checkbox" checked={allSelected} disabled={creating || alertsRefreshing || selectableIds.size === 0} onChange={toggleAll} title="Tout sélectionner" aria-label="Tout sélectionner" style={CB} />
              </th>
              {['Collaborateur', 'Dernière visite', 'Délai restant', 'Département'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 800, color: T.primaryDeep, textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && alerts.count > 0 && (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 13 }}>{alerts.count} alerte(s) signalée(s) mais la liste détaillée est vide.</td></tr>
            )}
            {sortedRows.map((r, idx, arr) => {
              const pk = pickCollaborateurPkAlert(r);
              const canSelect = pk != null;
              const delai = badgeDelaiVpRh(r);
              const { nom, prenom } = pickNomPrenom(r);
              const mat = pickMatricule(r);
              const nomComplet = `${nom} ${prenom}`.trim() || '—';
              const isSelected = pk != null && selected.has(pk);
              const inDraft = pk != null && draftSet.has(pk);

              return (
                <tr key={rowKey(r, idx)} onClick={() => { if (canSelect && !creating && !alertsRefreshing) toggleRow(pk); }}
                  style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${T.borderLight}` : 'none', cursor: canSelect && !creating && !alertsRefreshing ? 'pointer' : 'default', background: isSelected ? '#f0f9ff' : (idx % 2 === 0 ? 'white' : '#fafcff'), transition: 'background .1s' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} disabled={creating || alertsRefreshing || !canSelect} onChange={() => toggleRow(pk)} aria-label={`Sélectionner ${nomComplet}`} style={CB} />
                  </td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{nomComplet}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {mat && <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10.5, color: T.primary, background: T.bg, padding: '1px 6px', borderRadius: 4, border: `1px solid ${T.border}` }}>{mat}</span>}
                      {inDraft && <span style={{ fontSize: 10, fontWeight: 700, color: T.primaryDark, background: T.bg, padding: '2px 7px', borderRadius: 10, border: `1px solid ${T.border}` }}>Brouillon en cours</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{fmtDate(r.derniere_visite_date ?? r.derniere_vp_date ?? r.derniereVpDate)}</td>
                  <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: delai.color, background: delai.bg, padding: '3px 9px', borderRadius: 20 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: delai.dot, flexShrink: 0 }} />{delai.text}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', verticalAlign: 'middle' }}>{pickDepartementLabel(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AlerteVP30Jours;