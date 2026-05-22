// src/components/rh/VisitesPeriodiquesRHPage.jsx
// Page RH Visites Périodiques — layout amélioré, deux sections visuellement distinctes
import { useState, useMemo, useEffect, useCallback } from 'react';
import CollaborateursSansVisite from './CollaborateursSansVisite';
import AlerteVP30Jours from './AlerteVP30Jours';
import ListesVisitesPeriodiquesRH from './ListesVisitesPeriodiquesRH';
import { getListesVisitesPeriodiques, getLignesListePeriodique, keepListeVpPourMedecin } from '../../api/visitesPeriodiquesApi';
import { enrichLigneVisitePeriodique } from '../../utils/ligneVisitePeriodique';

/** Listes VP non terminées : les collaborateurs des lignes ne doivent plus apparaître dans « À planifier ». */
function listeVpReserveCollaborateursPourPlanif(liste) {
  if (!liste || typeof liste !== 'object') return false;
  const st = String(liste.statut || '').toUpperCase();
  if (st === 'CLOTUREE' || st === 'ARCHIVEE') return false;
  if (liste.archivee === true || liste.archived === true || liste.est_archivee === true) return false;
  return true;
}

function collectCollaborateurIdsDepuisLignesVp(rows) {
  const ids = new Set();
  if (!Array.isArray(rows)) return ids;
  for (const row of rows) {
    const e = enrichLigneVisitePeriodique(row);
    const pk = e.collaborateurPk ?? e.collaborateur_id;
    if (pk == null || pk === '') continue;
    const n = Number(pk);
    if (!Number.isNaN(n)) ids.add(n);
  }
  return ids;
}

const T = {
  primary: '#0284c7', primaryDark: '#0369a1', primaryDeep: '#0c4a6e',
  border: '#bae6fd', bg: '#f0f9ff',
};

export default function VisitesPeriodiquesRHPage({ onOpenFiche }) {
  const [listesKey, setListesKey] = useState(0);
  const [, setHasAlerts] = useState(false);
  const [horizonAlertCollaborateurIds, setHorizonAlertCollaborateurIds] = useState(() => new Set());
  const [draftCollabIds, setDraftCollabIds] = useState([]);
  const [toast, setToast] = useState('');
  const [alertRefreshSignal, setAlertRefreshSignal] = useState(0);

  const handleHorizonAlertIds = useCallback((ids) => {
    setHorizonAlertCollaborateurIds(ids instanceof Set ? ids : new Set());
  }, []);

  const draftCollabIdSet = useMemo(
    () => new Set(draftCollabIds.map(Number).filter((n) => !Number.isNaN(n))),
    [draftCollabIds],
  );

  const [collabIdsDansListesVpActives, setCollabIdsDansListesVpActives] = useState(() => new Set());
  const [vpCollabExcludeNonce, setVpCollabExcludeNonce] = useState(0);

  const bumpVpCollabExcludeFromListes = useCallback(() => {
    setVpCollabExcludeNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getListesVisitesPeriodiques({ page_size: 500 });
        const listes = (Array.isArray(all) ? all : [])
          .filter((l) => keepListeVpPourMedecin(l) && listeVpReserveCollaborateursPourPlanif(l));
        const merged = new Set();
        await Promise.all(
          listes.map(async (liste) => {
            if (!liste?.id) return;
            try {
              const raw = await getLignesListePeriodique(liste.id);
              const rows = Array.isArray(raw) ? raw : [];
              collectCollaborateurIdsDepuisLignesVp(rows).forEach((id) => merged.add(id));
            } catch {
              /* ligne indisponible pour cette liste */
            }
          }),
        );
        if (!cancelled) setCollabIdsDansListesVpActives(merged);
      } catch {
        if (!cancelled) setCollabIdsDansListesVpActives(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, [listesKey, alertRefreshSignal, vpCollabExcludeNonce]);

  const excludeCollaborateurIdsPourSansVisite = useMemo(() => {
    const s = new Set();
    horizonAlertCollaborateurIds.forEach((id) => {
      const n = Number(id);
      if (!Number.isNaN(n)) s.add(n);
    });
    draftCollabIdSet.forEach((id) => {
      const n = Number(id);
      if (!Number.isNaN(n)) s.add(n);
    });
    collabIdsDansListesVpActives.forEach((id) => {
      const n = Number(id);
      if (!Number.isNaN(n)) s.add(n);
    });
    return s;
  }, [horizonAlertCollaborateurIds, draftCollabIdSet, collabIdsDansListesVpActives]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const addDraftCollabs = useCallback((ids) => {
    const nums = (ids || []).map(Number).filter((n) => !Number.isNaN(n));
    if (!nums.length) return;
    setDraftCollabIds((prev) => [...new Set([...prev, ...nums])]);
  }, []);

  const removeDraftCollabs = useCallback((ids) => {
    const drop = new Set((ids || []).map(Number).filter((n) => !Number.isNaN(n)));
    if (!drop.size) return;
    setDraftCollabIds((prev) => prev.filter((id) => !drop.has(Number(id))));
  }, []);

  const handleListeSoumiseCollaborateurs = useCallback((ids) => {
    removeDraftCollabs(ids);
    setAlertRefreshSignal((s) => s + 1);
  }, [removeDraftCollabs]);

  const handleSoumissionSuccesAlertes = useCallback(({ referenceLabel, nbCollaborateurs }) => {
    const n = Number(nbCollaborateurs) || 0;
    const collabLabel = n <= 1 ? 'collaborateur' : 'collaborateurs';
    const retireLabel = n <= 1 ? 'retiré' : 'retirés';
    setToast(`✓ Liste ${referenceLabel} envoyée à l'infirmier. ${n} ${collabLabel} ${retireLabel} des alertes.`);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 20, paddingBottom: 16 }}>

      {/* Toast succès */}
      {toast && (
        <div role="status" style={{ flexShrink: 0, padding: '11px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1px solid #6ee7b7', color: '#065f46', fontSize: 13, fontWeight: 700, lineHeight: 1.45, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          {toast}
        </div>
      )}

      {/* ── Section 1 : alertes regroupées (échéances + complément sans visite prolongée) */}
      <section
        style={{
          flexShrink: 0,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(15,23,42,.06)',
        }}
      >
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.primaryDeep }}>À planifier</h2>
        </div>
        <AlerteVP30Jours
          embedded
          onHorizonAlertCollaborateurIds={handleHorizonAlertIds}
          onHasAlertsChange={setHasAlerts}
          onListePeriodiqueCreee={() => setListesKey((k) => k + 1)}
          draftCollabIdSet={draftCollabIdSet}
          onSoumissionSucces={handleSoumissionSuccesAlertes}
          onDraftCollabsAdded={addDraftCollabs}
          onDraftCollabsRemoved={removeDraftCollabs}
          refreshSignal={alertRefreshSignal}
        />
        <div style={{ borderTop: '1px solid #e2e8f0', background: '#fafafa' }}>
          <CollaborateursSansVisite
            embedded
            excludeCollaborateurIds={excludeCollaborateurIdsPourSansVisite}
            onListeCreee={() => setListesKey((k) => k + 1)}
            onHasAlertsChange={() => {}}
          />
        </div>
      </section>

      {/* ── Section 2 : Suivi des listes */}
      <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Titre section */}
        <div style={{ marginBottom: 10, flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.primaryDeep }}>Suivi des listes</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Brouillons, listes envoyées et clôturées.</p>
        </div>
        <ListesVisitesPeriodiquesRH
          key={listesKey}
          embedded
          onListeSoumiseCollaborateurs={handleListeSoumiseCollaborateurs}
          onOpenFiche={onOpenFiche}
          onListesFetchDone={bumpVpCollabExcludeFromListes}
        />
      </section>
    </div>
  );
}