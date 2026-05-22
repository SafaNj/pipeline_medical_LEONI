// src/components/infirmier/SurveillanceSpecialeInfirmier.jsx
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  getListesSurveillanceSpeciale,
  getListeSurveillanceSpecialeDetail,
  getLignesSurveillanceSpeciale,
  getMedecinsTravailSurveillanceSpeciale,
  assignerMedecinListeSurveillanceSpeciale,
  patchPresenceLigneSurveillanceSpeciale,
  cloturerListeSurveillanceSpeciale,
  notifierVeilleListeSurveillanceSpeciale,
  parseResultatClotureSurveillanceSpeciale,
  mergeReponsesClotureSurveillanceSpeciale,
} from '../../api/surveillanceSpecialeApi';
import { formatAxiosError } from '../../api/apiErrorUtils';
import { isSmsVeilleEnvoye } from '../../utils/contreVisiteSms';
import { SmsVeilleBadge, SmsLigneBadge } from '../contreVisite/SmsContreVisiteBadges';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const STATUT_CFG = {
  SOUMISE: { bg: '#f1f5f9', color: '#475569', text: 'Soumise' },
  EN_TRAITEMENT: { bg: '#fef9c3', color: '#a16207', text: 'En traitement' },
  CLOTUREE: { bg: '#dcfce7', color: '#15803d', text: 'Clôturée' },
};

/** Libellé affichable (API médecins : champs variables selon le serializer Django). */
function libelleMedecinTravail(m) {
  if (!m || typeof m !== 'object') return '';
  const nc = String(m.nom_complet ?? '').trim();
  if (nc) return nc;
  const np = [m.prenom, m.nom].filter(Boolean).join(' ').trim();
  if (np) return np;
  const fn = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (fn) return fn;
  const u = m.user;
  if (u && typeof u === 'object') {
    const ufn = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    if (ufn) return ufn;
    if (u.username) return String(u.username).trim();
  }
  if (m.username) return String(m.username).trim();
  if (m.email) return String(m.email).trim();
  return m.id != null ? `Médecin #${m.id}` : 'Médecin';
}

function medecinOptionValue(m) {
  if (!m || typeof m !== 'object') return '';
  for (const c of [m.id, m.user_id, m.pk]) {
    if (c != null && c !== '' && typeof c !== 'object') return String(c);
  }
  if (m.user != null && typeof m.user === 'object' && m.user.id != null) return String(m.user.id);
  return '';
}

function ligneNom(l) {
  return l.collaborateur_nom || l.nom_prenom || [l.nom, l.prenom].filter(Boolean).join(' ').trim() || '—';
}

function ligneMat(l) {
  return l.collaborateur_matricule || l.matricule || '—';
}

function traitementTermine(l) {
  return (
    l.traitement_termine === true
    || l.traitement_termine === 'true'
    || l.traitement_fini === true
    || l.traitement_fini === 'true'
  );
}

function ModalMedecin({ listeId, currentMedecinId, onClose, onDone }) {
  const [medecins, setMedecins] = useState([]);
  const [selected, setSelected] = useState(currentMedecinId ? String(currentMedecinId) : '');
  const [loading, setLoading] = useState(false);
  const [loadMed, setLoadMed] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoadMed(true);
    getMedecinsTravailSurveillanceSpeciale()
      .then(setMedecins)
      .catch(() => setMedecins([]))
      .finally(() => setLoadMed(false));
  }, []);

  const handleSave = async () => {
    if (!selected) {
      setErr('Sélectionnez un médecin.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await assignerMedecinListeSurveillanceSpeciale(listeId, Number(selected));
      onDone();
    } catch (e) {
      setErr(formatAxiosError(e) || 'Erreur assignation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: 420, maxWidth: '92vw', padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0c4a6e', marginBottom: 14 }}>Assigner un médecin</div>
        {err && <div style={{ background: '#fef2f2', color: '#b91c1c', fontSize: 12, padding: 8, borderRadius: 8, marginBottom: 10 }}>{err}</div>}
        {loadMed ? (
          <div style={{ padding: 16, textAlign: 'center' }}>Chargement…</div>
        ) : (
          <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
            <option value="">— Choisir —</option>
            {medecins.map((m) => {
              const value = medecinOptionValue(m);
              const label = libelleMedecinTravail(m);
              const spec = m.specialite ?? m.specialite_nom ?? m.specialite_libelle;
              return (
                <option key={value || label} value={value}>
                  Dr. {label}
                  {spec ? ` — ${spec}` : ''}
                </option>
              );
            })}
          </select>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <button type="button" onClick={handleSave} disabled={loading || !selected} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
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
  const [showMed, setShowMed] = useState(false);
  const [presBusy, setPresBusy] = useState(null);
  const [clotBusy, setClotBusy] = useState(false);
  const [veilleBusy, setVeilleBusy] = useState(false);
  const [raisonReport, setRaisonReport] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [det, lignesArr] = await Promise.all([
        getListeSurveillanceSpecialeDetail(listeId),
        getLignesSurveillanceSpeciale(listeId),
      ]);
      setListe(det);
      setLignes(Array.isArray(lignesArr) ? lignesArr : []);
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

  const handlePresence = async (ligne, presence) => {
    if (liste?.statut === 'CLOTUREE') return;
    setPresBusy(ligne.id);
    try {
      const body = { presence };
      if (presence === 'REPORTE') {
        const r = raisonReport[ligne.id]?.trim();
        if (r) body.raison_report = r;
      }
      await patchPresenceLigneSurveillanceSpeciale(ligne.id, body);
      await load();
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Présence', text: formatAxiosError(e) || 'Erreur.' });
    } finally {
      setPresBusy(null);
    }
  };

  const handleCloturer = async () => {
    const nonTraites = lignes.filter((l) => !traitementTermine(l)).length;
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Clôturer cette liste ?',
      html:
        nonTraites > 0
          ? `<p style="text-align:left;margin:0">Il reste <strong>${nonTraites}</strong> ligne(s) sans <strong>traitement médecin terminé</strong>.</p>`
            + '<p style="text-align:left;margin:12px 0 0">Comme pour une liste d’embauche, le serveur doit créer une <strong>liste reportée</strong> en brouillon contenant uniquement ces collaborateurs, pour une nouvelle date de visite.</p>'
            + '<p style="text-align:left;margin:12px 0 0">Confirmer la clôture ?</p>'
          : '<p style="text-align:left;margin:0">La liste passera en statut clôturé. Les collaborateurs sans traitement terminé doivent être reportés automatiquement si le backend est configuré comme pour l’embauche.</p>',
      showCancelButton: true,
      confirmButtonText: 'Clôturer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setClotBusy(true);
    try {
      const res = await cloturerListeSurveillanceSpeciale(listeId);
      let merged = res;
      try {
        const detail = await getListeSurveillanceSpecialeDetail(listeId);
        merged = mergeReponsesClotureSurveillanceSpeciale(res, detail);
      } catch {
        merged = res;
      }
      await load();
      const parsed = parseResultatClotureSurveillanceSpeciale(merged);
      const attendListeReportee = nonTraites > 0;
      const okReportee = !attendListeReportee || parsed.nouvelleListeId != null;
      const nombreAffiche =
        parsed.nombreReportes > 0
          ? parsed.nombreReportes
          : (parsed.nouvelleListeId != null && nonTraites > 0 ? nonTraites : parsed.nombreReportes);
      const normStatut = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const statutCloture = normStatut(merged?.statut ?? res?.statut) === 'CLOTUREE';

      if (attendListeReportee && parsed.nouvelleListeId != null) {
        const refTxt = parsed.nouvelleListeRef || `#${parsed.nouvelleListeId}`;
        const rh =
          parsed.rhNotifiesCount != null && parsed.rhNotifiesCount !== ''
            ? `<p style="text-align:left;margin:8px 0 0">RH notifiés : <strong>${parsed.rhNotifiesCount}</strong>.</p>`
            : '';
        await Swal.fire({
          icon: 'success',
          title: 'Liste clôturée',
          html:
            `<p style="text-align:left;margin:0"><strong>${nombreAffiche}</strong> collaborateur(s) non pris en charge — liste reportée (brouillon) : <strong>${refTxt}</strong>.</p>`
            + rh
            + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">La RH peut ouvrir cette nouvelle liste, fixer une date de visite et la soumettre à nouveau.</p>',
          confirmButtonText: 'OK',
        });
      } else if (attendListeReportee && !okReportee && statutCloture) {
        // Clôture HTTP OK + statut liste, mais l’API n’expose pas l’id liste reportée (limitation backend).
        // Côté front on ne peut pas inventer l’id : message de succès + consigne RH (sans alerte « erreur »).
        await Swal.fire({
          icon: 'success',
          title: 'Liste clôturée',
          html:
            `<p style="text-align:left;margin:0">La liste est bien passée en <strong>clôturé</strong>.</p>`
            + `<p style="text-align:left;margin:12px 0 0">Il y avait <strong>${nonTraites}</strong> ligne(s) sans traitement médecin terminé ; une liste reportée en brouillon aurait dû être créée côté serveur, mais la réponse ne contient pas son identifiant.</p>`
            + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">Demandez à la <strong>RH</strong> de vérifier dans <strong>Surveillance SMS</strong> les listes en brouillon ou reportées pour ce site. Pour afficher automatiquement la référence ici, l’API doit renvoyer les mêmes champs qu’à l’embauche (<code>nouvelle_liste_reportee_id</code>, etc.).</p>',
          confirmButtonText: 'OK',
        });
      } else if (attendListeReportee && !okReportee) {
        await Swal.fire({
          icon: 'warning',
          title: 'Clôture incomplète',
          html:
            '<p style="text-align:left;margin:0">La réponse ne confirme pas le statut <strong>clôturé</strong> et ne contient pas l’identifiant d’une liste reportée. Rechargez la page ou contactez l’administrateur.</p>',
          confirmButtonText: 'OK',
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Liste clôturée',
          text: 'La liste est passée en statut clôturé.',
          timer: 2800,
          showConfirmButton: true,
        });
      }
      onBack();
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Clôture', text: formatAxiosError(e) || 'Erreur.' });
    } finally {
      setClotBusy(false);
    }
  };

  const handleVeille = async () => {
    setVeilleBusy(true);
    try {
      const res = await notifierVeilleListeSurveillanceSpeciale(listeId);
      await load();
      const n = Number(res?.sms_count);
      const extra = Number.isFinite(n) && n > 0 ? ` ${n} SMS.` : '';
      await Swal.fire({ icon: 'success', title: 'SMS veille', text: `Traité.${extra}`, timer: 2200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'SMS veille', text: formatAxiosError(e) || 'Erreur.' });
    } finally {
      setVeilleBusy(false);
    }
  };

  if (loading || !liste) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 28, height: 28, border: '3px solid #bae6fd', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const isCloturee = liste.statut === 'CLOTUREE';
  const cfg = STATUT_CFG[liste.statut] || { bg: '#f1f5f9', color: '#475569', text: liste.statut };
  const canAssign = !isCloturee && ['SOUMISE', 'EN_TRAITEMENT'].includes(liste.statut);
  const medecinNom =
    liste.medecin_nom
    || (liste.medecin && typeof liste.medecin === 'object' ? libelleMedecinTravail(liste.medecin) : '')
    || liste.medecin?.nom_complet
    || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #bae6fd', flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} style={{ border: 'none', background: 'rgba(2,132,199,.1)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', color: '#0c4a6e', fontWeight: 600, fontFamily: 'inherit' }}>← Retour</button>
        <span style={{ fontWeight: 800, color: '#0c4a6e' }}>{liste.reference || `#${liste.id}`}</span>
        <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{cfg.text}</span>
        <SmsVeilleBadge liste={liste} />
        {['SOUMISE', 'EN_TRAITEMENT'].includes(liste.statut) && !isSmsVeilleEnvoye(liste) && (
          <button type="button" disabled={veilleBusy} onClick={handleVeille} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: 11, cursor: veilleBusy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {veilleBusy ? '…' : 'SMS veille'}
          </button>
        )}
        {canAssign && (
          <button type="button" onClick={() => setShowMed(true)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 9, border: medecinNom ? '1px solid #bae6fd' : '2px solid #f59e0b', background: medecinNom ? 'white' : '#fffbeb', color: medecinNom ? '#0284c7' : '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            {medecinNom || 'Assigner médecin'}
          </button>
        )}
        {!isCloturee && lignes.length > 0 && (
          <button type="button" disabled={clotBusy} onClick={handleCloturer} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: '#15803d', color: 'white', fontWeight: 700, fontSize: 12, cursor: clotBusy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {clotBusy ? '…' : 'Clôturer'}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#0284c7', marginBottom: 12 }}>Visite : {fmtDate(liste.date_visite)}{liste.titre ? ` · ${liste.titre}` : ''}</div>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0f2fe', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fbff' }}>
                {['#', 'Collaborateur', 'Matricule', 'SMS', 'Présence', 'Traitement'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.id} style={{ borderTop: i ? '1px solid #f0f9ff' : 'none' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0c4a6e' }}>{ligneNom(l)}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{ligneMat(l)}</td>
                  <td style={{ padding: '10px 12px' }}><SmsLigneBadge ligne={l} /></td>
                  <td style={{ padding: '10px 12px' }}>
                    {isCloturee ? (
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{l.presence || '—'}</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {['PRESENT', 'ABSENT', 'REPORTE'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              disabled={presBusy === l.id}
                              onClick={() => handlePresence(l, p)}
                              style={{
                                padding: '4px 8px', borderRadius: 6, border: 'none',
                                background: l.presence === p ? (p === 'PRESENT' ? '#15803d' : p === 'ABSENT' ? '#b91c1c' : '#ca8a04') : '#f1f5f9',
                                color: l.presence === p ? 'white' : '#64748b', fontSize: 10, fontWeight: 700, cursor: presBusy === l.id ? 'wait' : 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              {p === 'REPORTE' ? 'Reporté' : p.charAt(0) + p.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                        {l.presence === 'REPORTE' && (
                          <input
                            placeholder="Raison report"
                            value={raisonReport[l.id] ?? ''}
                            onChange={(e) => setRaisonReport((prev) => ({ ...prev, [l.id]: e.target.value }))}
                            style={{ fontSize: 11, padding: 4, borderRadius: 6, border: '1px solid #e2e8f0', maxWidth: 220 }}
                          />
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{traitementTermine(l) ? 'Terminé' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMed && (
        <ModalMedecin
          listeId={liste.id}
          currentMedecinId={typeof liste.medecin === 'object' && liste.medecin != null ? liste.medecin.id : liste.medecin}
          onClose={() => setShowMed(false)}
          onDone={() => { setShowMed(false); load(); }}
        />
      )}
    </div>
  );
}

function VueListes({ onSelect }) {
  const [listes, setListes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const all = await getListesSurveillanceSpeciale();
      setListes(
        (Array.isArray(all) ? all : []).filter(
          (l) =>
            l.statut &&
            l.statut !== 'BROUILLON' &&
            l.statut !== 'CLOTUREE' &&
            l.statut !== 'ARCHIVEE',
        ),
      );
    } catch (e) {
      setListes([]);
      const msg = formatAxiosError(e) || 'Impossible de charger les listes.';
      setLoadError(
        e?.response?.status === 502
          ? `${msg} (502 : proxy ou Django injoignable / erreur serveur — consulter les logs backend.)`
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 28, height: 28, border: '3px solid #bae6fd', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(2,132,199,.18)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0c4a6e' }}>Surveillance médicale spéciale</div>
        <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4 }}>{listes.length} liste{listes.length !== 1 ? 's' : ''} à traiter</div>
      </div>
      {loadError && (
        <div style={{ margin: '0 12px 12px', padding: 12, borderRadius: 10, background: '#fef2f2', color: '#991b1b', fontSize: 13, lineHeight: 1.45 }}>
          {loadError}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {listes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aucune liste soumise pour le moment.</div>
        ) : (
          listes.map((l) => {
            const cfg = STATUT_CFG[l.statut] || { bg: '#f1f5f9', color: '#475569', text: l.statut };
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelect(l.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: 10, padding: 14, borderRadius: 12,
                  border: '2px solid #e0f2fe', background: 'white', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 800, color: '#0c4a6e' }}>{l.reference || `#${l.id}`}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.text}</span>
                    {isSmsVeilleEnvoye(l) && <SmsVeilleBadge liste={l} />}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#0284c7', marginTop: 6 }}>{fmtDate(l.date_visite)} · {l.nombre_lignes ?? '?'} ligne(s)</div>
              </button>
            );
          })
        )}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(2,132,199,.15)' }}>
        <button type="button" onClick={load} style={{ width: '100%', padding: 9, borderRadius: 10, border: '1px solid #bae6fd', background: 'rgba(224,242,254,.5)', color: '#0284c7', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Actualiser
        </button>
      </div>
    </div>
  );
}

export default function SurveillanceSpecialeInfirmier() {
  const [selectedId, setSelectedId] = useState(null);
  if (selectedId) {
    return <DetailListe listeId={selectedId} onBack={() => setSelectedId(null)} />;
  }
  return <VueListes onSelect={setSelectedId} />;
}
