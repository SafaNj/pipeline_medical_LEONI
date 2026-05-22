import { useEffect, useMemo, useState } from 'react';
import PrintCertificatRouter from './PrintCertificatRouter';
import { creerCertificat, modifierCertificat, getFicheAptitude, getCertificatParFiche } from '../../api/Medicalworkapi';

const SKY = { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985' };

const inputSx = {
  width: '100%',
  padding: '9px 12px',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 9,
  fontSize: 13,
  color: '#0f172a',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

function safeJsonParse(s) {
  if (!s || typeof s !== 'string') return null;
  const raw = s.trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 900,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '.8px',
      paddingBottom: 7,
      borderBottom: '1.5px solid #e2e8f0',
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ fontSize: 10.5, fontWeight: 700, color: SKY[700], textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </label>
  );
}

export default function TabCertificatMateur({ fiche, onFicheUpdated }) {
  const today = new Date().toISOString().split('T')[0];
  const existing = fiche?.certificat || null;
  const [openZones, setOpenZones] = useState({ coupe: false, preparation: false, montage: false });
  const draftKey = fiche?.id != null ? `pfe-mateur-cert-draft-v1:${fiche.id}` : '';

  const [dateEmission, setDateEmission] = useState(existing?.date_emission || today);
  const [typeVisite, setTypeVisite] = useState(fiche?.type_visite || '');

  const [headerCertificatMedical, setHeaderCertificatMedical] = useState(true);
  const [headerReprisePoste, setHeaderReprisePoste] = useState(false);

  const [avisEtatGeneral, setAvisEtatGeneral] = useState('');
  const [avisDebout, setAvisDebout] = useState('');
  const [avisAssis, setAvisAssis] = useState('');
  const [avisCharge4, setAvisCharge4] = useState('');
  const [avisPoignetBrasEpaule, setAvisPoignetBrasEpaule] = useState('');
  const [avisCou, setAvisCou] = useState('');
  const [avisEffortPrecision, setAvisEffortPrecision] = useState('');
  const [avisRotationEquipe, setAvisRotationEquipe] = useState('');

  const [apcMaladiePro, setApcMaladiePro] = useState('');
  const [apcAccident, setApcAccident] = useState('');
  const [apcChroniques, setApcChroniques] = useState('');

  const [zoneCoupeCoupe, setZoneCoupeCoupe] = useState('');
  const [zoneCoupeSertissage, setZoneCoupeSertissage] = useState('');
  const [zoneCoupeAutres, setZoneCoupeAutres] = useState('');

  const [zonePrepEpissure, setZonePrepEpissure] = useState('');
  const [zonePrepRetreint, setZonePrepRetreint] = useState('');
  const [zonePrepTorsadage, setZonePrepTorsadage] = useState('');
  const [zonePrepEiamage, setZonePrepEiamage] = useState('');
  const [zonePrepKabatec, setZonePrepKabatec] = useState('');
  const [zonePrepLovage, setZonePrepLovage] = useState('');
  const [zonePrepAutres, setZonePrepAutres] = useState('');

  const [zoneMontageSousElement, setZoneMontageSousElement] = useState('');
  const [zoneMontageLAD, setZoneMontageLAD] = useState('');
  const [zoneMontagePU, setZoneMontagePU] = useState('');
  const [zoneMontageAgrafs, setZoneMontageAgrafs] = useState('');
  const [zoneMontageVissage, setZoneMontageVissage] = useState('');
  const [zoneMontageGoulotte, setZoneMontageGoulotte] = useState('');
  const [zoneMontageBOL, setZoneMontageBOL] = useState('');
  const [zoneMontageCFinal, setZoneMontageCFinal] = useState('');
  const [zoneMontageAutrePostes, setZoneMontageAutrePostes] = useState('');

  const [autresRemarques, setAutresRemarques] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // hydrate depuis certificat.description (JSON) si présent
  useEffect(() => {
    const desc = existing?.description || '';
    const parsed = safeJsonParse(desc);
    const data = parsed?.__mateur_cert_v1 || parsed;
    if (!data || typeof data !== 'object') return;

    setTypeVisite(data.type_visite || fiche?.type_visite || '');

    const entete = data.entete || {};
    if (entete.certificat_medical_aptitude !== undefined) setHeaderCertificatMedical(!!entete.certificat_medical_aptitude);
    if (entete.reprise_au_poste !== undefined) setHeaderReprisePoste(!!entete.reprise_au_poste);

    const avis = data.avis || {};
    const apc = avis.a_prendre_en_consideration || {};
    setAvisEtatGeneral(avis.etat_general_efficience || '');
    setAvisDebout(avis.debout_prolonge || '');
    setAvisAssis(avis.assis_prolonge || '');
    setAvisCharge4(avis.charge_sup_4kg || '');
    setAvisPoignetBrasEpaule(avis.poignet_bras_epaule || '');
    setAvisCou(avis.cou || '');
    setAvisEffortPrecision(avis.effort_precision_concentration || '');
    setAvisRotationEquipe(avis.rotation_equipe_possible || '');
    setApcMaladiePro(apc.maladie_professionnelle || '');
    setApcAccident(apc.accident_travail_sequelles || '');
    setApcChroniques(apc.maladies_chroniques || '');

    const zones = data.zones || {};
    const coupe = zones.coupe || {};
    setZoneCoupeCoupe(coupe.coupe || '');
    setZoneCoupeSertissage(coupe.sertissage_manuel || '');
    setZoneCoupeAutres(coupe.autres_remarques || '');

    const prep = zones.preparation || {};
    setZonePrepEpissure(prep.epissure || '');
    setZonePrepRetreint(prep.retreint || '');
    setZonePrepTorsadage(prep.torsadage || '');
    setZonePrepEiamage(prep.eiamage || '');
    setZonePrepKabatec(prep.kabatec || '');
    setZonePrepLovage(prep.lovage || '');
    setZonePrepAutres(prep.autres_remarques || '');

    const montage = zones.montage || {};
    setZoneMontageSousElement(montage.sous_element || '');
    setZoneMontageLAD(montage.montage_lad || '');
    setZoneMontagePU(montage.pu || '');
    setZoneMontageAgrafs(montage.c_agrafs || '');
    setZoneMontageVissage(montage.vissage || '');
    setZoneMontageGoulotte(montage.montage_goulotte || '');
    setZoneMontageBOL(montage.bol || '');
    setZoneMontageCFinal(montage.c_final || '');
    setZoneMontageAutrePostes(montage.autre_postes_montage || '');

    setAutresRemarques(data.autres_remarques || '');

    // Ouvrir automatiquement les zones qui contiennent déjà des données (meilleure lisibilité).
    const coupeFilled = Boolean(
      String(coupe.coupe || '').trim()
      || String(coupe.sertissage_manuel || '').trim()
      || String(coupe.autres_remarques || '').trim()
    );
    const prepFilled = Boolean(
      String(prep.epissure || '').trim()
      || String(prep.retreint || '').trim()
      || String(prep.torsadage || '').trim()
      || String(prep.eiamage || '').trim()
      || String(prep.kabatec || '').trim()
      || String(prep.lovage || '').trim()
      || String(prep.autres_remarques || '').trim()
    );
    const montageFilled = Boolean(
      String(montage.sous_element || '').trim()
      || String(montage.montage_lad || '').trim()
      || String(montage.pu || '').trim()
      || String(montage.c_agrafs || '').trim()
      || String(montage.vissage || '').trim()
      || String(montage.montage_goulotte || '').trim()
      || String(montage.bol || '').trim()
      || String(montage.c_final || '').trim()
      || String(montage.autre_postes_montage || '').trim()
    );
    setOpenZones({
      coupe: coupeFilled,
      preparation: prepFilled,
      montage: montageFilled,
    });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hydrate depuis brouillon local si le certificat n'a pas de `description` (ou retour écran).
  useEffect(() => {
    if (!draftKey) return;
    const hasServerDesc = existing?.description && String(existing.description).trim() !== '';
    if (hasServerDesc) return;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const parsedDraft = JSON.parse(raw);
      const desc = parsedDraft?.description;
      const parsed = safeJsonParse(desc);
      const data = parsed?.__mateur_cert_v1 || parsed;
      if (!data || typeof data !== 'object') return;
      const entete = data.entete || {};
      if (entete.certificat_medical_aptitude !== undefined) setHeaderCertificatMedical(!!entete.certificat_medical_aptitude);
      if (entete.reprise_au_poste !== undefined) setHeaderReprisePoste(!!entete.reprise_au_poste);
      const avis = data.avis || {};
      const apc = avis.a_prendre_en_consideration || {};
      setTypeVisite(data.type_visite || fiche?.type_visite || '');
      setAvisEtatGeneral(avis.etat_general_efficience || '');
      setAvisDebout(avis.debout_prolonge || '');
      setAvisAssis(avis.assis_prolonge || '');
      setAvisCharge4(avis.charge_sup_4kg || '');
      setAvisPoignetBrasEpaule(avis.poignet_bras_epaule || '');
      setAvisCou(avis.cou || '');
      setAvisEffortPrecision(avis.effort_precision_concentration || '');
      setAvisRotationEquipe(avis.rotation_equipe_possible || '');
      setApcMaladiePro(apc.maladie_professionnelle || '');
      setApcAccident(apc.accident_travail_sequelles || '');
      setApcChroniques(apc.maladies_chroniques || '');

      const zones = data.zones || {};
      const coupe = zones.coupe || {};
      setZoneCoupeCoupe(coupe.coupe || '');
      setZoneCoupeSertissage(coupe.sertissage_manuel || '');
      setZoneCoupeAutres(coupe.autres_remarques || '');

      const prep = zones.preparation || {};
      setZonePrepEpissure(prep.epissure || '');
      setZonePrepRetreint(prep.retreint || '');
      setZonePrepTorsadage(prep.torsadage || '');
      setZonePrepEiamage(prep.eiamage || '');
      setZonePrepKabatec(prep.kabatec || '');
      setZonePrepLovage(prep.lovage || '');
      setZonePrepAutres(prep.autres_remarques || '');

      const montage = zones.montage || {};
      setZoneMontageSousElement(montage.sous_element || '');
      setZoneMontageLAD(montage.montage_lad || '');
      setZoneMontagePU(montage.pu || '');
      setZoneMontageAgrafs(montage.c_agrafs || '');
      setZoneMontageVissage(montage.vissage || '');
      setZoneMontageGoulotte(montage.montage_goulotte || '');
      setZoneMontageBOL(montage.bol || '');
      setZoneMontageCFinal(montage.c_final || '');
      setZoneMontageAutrePostes(montage.autre_postes_montage || '');

      setAutresRemarques(data.autres_remarques || '');
      setOpenZones({
        coupe: true,
        preparation: true,
        montage: true,
      });
    } catch {
      /* ignore */
    }
  }, [draftKey, existing?.description]); // eslint-disable-line react-hooks/exhaustive-deps

  const formForPrintAndSave = useMemo(() => {
    const certPayload = {
      __mateur_cert_v1: {
        version: 1,
        type_visite: typeVisite || fiche?.type_visite || '',
        aptitude: fiche?.aptitude || '',
        precision_aptitude: fiche?.precision_aptitude || '',
        entete: {
          certificat_medical_aptitude: !!headerCertificatMedical,
          reprise_au_poste: !!headerReprisePoste,
        },
        avis: {
          etat_general_efficience: avisEtatGeneral,
          debout_prolonge: avisDebout,
          assis_prolonge: avisAssis,
          charge_sup_4kg: avisCharge4,
          poignet_bras_epaule: avisPoignetBrasEpaule,
          cou: avisCou,
          effort_precision_concentration: avisEffortPrecision,
          rotation_equipe_possible: avisRotationEquipe,
          a_prendre_en_consideration: {
            maladie_professionnelle: apcMaladiePro,
            accident_travail_sequelles: apcAccident,
            maladies_chroniques: apcChroniques,
          },
        },
        zones: {
          coupe: {
            coupe: zoneCoupeCoupe,
            sertissage_manuel: zoneCoupeSertissage,
            autres_remarques: zoneCoupeAutres,
          },
          preparation: {
            epissure: zonePrepEpissure,
            retreint: zonePrepRetreint,
            torsadage: zonePrepTorsadage,
            eiamage: zonePrepEiamage,
            kabatec: zonePrepKabatec,
            lovage: zonePrepLovage,
            autres_remarques: zonePrepAutres,
          },
          montage: {
            sous_element: zoneMontageSousElement,
            montage_lad: zoneMontageLAD,
            pu: zoneMontagePU,
            c_agrafs: zoneMontageAgrafs,
            vissage: zoneMontageVissage,
            montage_goulotte: zoneMontageGoulotte,
            bol: zoneMontageBOL,
            c_final: zoneMontageCFinal,
            autre_postes_montage: zoneMontageAutrePostes,
          },
        },
        autres_remarques: autresRemarques,
      },
    };

    return {
      fiche_aptitude: fiche?.id,
      date_emission: dateEmission || today,
      description: JSON.stringify(certPayload),
    };
  }, [
    fiche?.id,
    fiche?.aptitude,
    fiche?.precision_aptitude,
    fiche?.type_visite,
    dateEmission,
    today,
    typeVisite,
    headerCertificatMedical,
    headerReprisePoste,
    avisEtatGeneral,
    avisDebout,
    avisAssis,
    avisCharge4,
    avisPoignetBrasEpaule,
    avisCou,
    avisEffortPrecision,
    avisRotationEquipe,
    apcMaladiePro,
    apcAccident,
    apcChroniques,
    zoneCoupeCoupe,
    zoneCoupeSertissage,
    zoneCoupeAutres,
    zonePrepEpissure,
    zonePrepRetreint,
    zonePrepTorsadage,
    zonePrepEiamage,
    zonePrepKabatec,
    zonePrepLovage,
    zonePrepAutres,
    zoneMontageSousElement,
    zoneMontageLAD,
    zoneMontagePU,
    zoneMontageAgrafs,
    zoneMontageVissage,
    zoneMontageGoulotte,
    zoneMontageBOL,
    zoneMontageCFinal,
    zoneMontageAutrePostes,
    autresRemarques,
  ]);

  // Sauvegarde brouillon local (debounce léger) pour éviter perte de saisie zones.
  useEffect(() => {
    if (!draftKey || !fiche?.id) return undefined;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            version: 1,
            ficheId: fiche.id,
            ...formForPrintAndSave,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [draftKey, fiche?.id, formForPrintAndSave]);

  const handleSave = async () => {
    if (!fiche?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (existing?.id) {
        await modifierCertificat(existing.id, formForPrintAndSave);
      } else {
        await creerCertificat(formForPrintAndSave);
      }
      const fresh = await getFicheAptitude(fiche.id);
      // IMPORTANT: certains endpoints ne renvoient pas toujours `certificat.description`.
      // Pour garantir le rechargement des zones + impression PDF, on tente de récupérer le certificat complet.
      try {
        const rows = await getCertificatParFiche(fiche.id);
        if (Array.isArray(rows) && rows.length) {
          const c = rows[0];
          if (c) {
            fresh.certificat = { ...(fresh.certificat || {}), ...c };
          }
        }
      } catch {
        /* ignore */
      }
      if (onFicheUpdated) onFicheUpdated(fresh);
      setSuccess('Certificat Mateur enregistré');
      // Nettoyer le brouillon (la saisie est désormais persistée côté backend)
      try { if (draftKey) sessionStorage.removeItem(draftKey); } catch { /* ignore */ }
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      const d = e?.response?.data;
      setError(d && typeof d === 'object' ? JSON.stringify(d) : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
      <SectionTitle>Certificat d'aptitude — Mateur</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <FieldLabel required>Date d'émission</FieldLabel>
          <input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} style={inputSx} />
        </div>
        <div>
          <FieldLabel required>Visite</FieldLabel>
          <select value={typeVisite} onChange={(e) => setTypeVisite(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }}>
            <option value="">Sélectionner…</option>
            <option value="EMBAUCHE">Embauche</option>
            <option value="PERIODIQUE">Périodique</option>
            <option value="SPONTANEE">Situation d'urgence</option>
            <option value="REPRISE">Reprise</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '12px 14px', border: `1.5px solid ${SKY[100]}`, borderRadius: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>En-tête du certificat</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
            <input type="checkbox" checked={headerCertificatMedical} onChange={(e) => setHeaderCertificatMedical(e.target.checked)} />
            Certificat médicale d&apos;aptitude
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
            <input type="checkbox" checked={headerReprisePoste} onChange={(e) => setHeaderReprisePoste(e.target.checked)} />
            Reprise au poste de travail
          </label>
        </div>
      </div>

      <div style={{ padding: '12px 14px', background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 8 }}>
          Avis Service médecine de travail
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <div><FieldLabel>État général efficience</FieldLabel><textarea rows={2} value={avisEtatGeneral} onChange={(e) => setAvisEtatGeneral(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Debout prolongé</FieldLabel><textarea rows={2} value={avisDebout} onChange={(e) => setAvisDebout(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Assis prolongé</FieldLabel><textarea rows={2} value={avisAssis} onChange={(e) => setAvisAssis(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Charge &gt; 4 kgr</FieldLabel><textarea rows={2} value={avisCharge4} onChange={(e) => setAvisCharge4(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Poignet / Bras / Épaule</FieldLabel><textarea rows={2} value={avisPoignetBrasEpaule} onChange={(e) => setAvisPoignetBrasEpaule(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Cou</FieldLabel><textarea rows={2} value={avisCou} onChange={(e) => setAvisCou(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Effort / précision / concentration</FieldLabel><textarea rows={2} value={avisEffortPrecision} onChange={(e) => setAvisEffortPrecision(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          <div><FieldLabel>Rotation équipe possible</FieldLabel><textarea rows={2} value={avisRotationEquipe} onChange={(e) => setAvisRotationEquipe(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>À prendre en considération</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div><FieldLabel>Maladie professionnelle</FieldLabel><textarea rows={2} value={apcMaladiePro} onChange={(e) => setApcMaladiePro(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
            <div><FieldLabel>Accident de travail avec séquelles</FieldLabel><textarea rows={2} value={apcAccident} onChange={(e) => setApcAccident(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
            <div><FieldLabel>Maladies chroniques</FieldLabel><textarea rows={2} value={apcChroniques} onChange={(e) => setApcChroniques(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', border: `1.5px solid ${SKY[100]}`, borderRadius: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>Zones</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {/* Zone Coupe */}
          <div>
            <button
              type="button"
              onClick={() => setOpenZones((p) => ({ ...p, coupe: !p.coupe }))}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: `1.5px solid ${openZones.coupe ? SKY[400] : SKY[100]}`,
                background: openZones.coupe ? SKY[50] : 'white',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 11.5,
                fontFamily: 'inherit',
                color: openZones.coupe ? SKY[800] : '#475569',
                textAlign: 'left',
                width: 'fit-content',
              }}
            >
              Zone Coupe
            </button>
            {openZones.coupe && (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><FieldLabel>Coupe</FieldLabel><textarea rows={3} value={zoneCoupeCoupe} onChange={(e) => setZoneCoupeCoupe(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Sertissage manuel</FieldLabel><textarea rows={3} value={zoneCoupeSertissage} onChange={(e) => setZoneCoupeSertissage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Autres remarques</FieldLabel><textarea rows={3} value={zoneCoupeAutres} onChange={(e) => setZoneCoupeAutres(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
              </div>
            )}
          </div>

          {/* Zone Préparation */}
          <div>
            <button
              type="button"
              onClick={() => setOpenZones((p) => ({ ...p, preparation: !p.preparation }))}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: `1.5px solid ${openZones.preparation ? SKY[400] : SKY[100]}`,
                background: openZones.preparation ? SKY[50] : 'white',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 11.5,
                fontFamily: 'inherit',
                color: openZones.preparation ? SKY[800] : '#475569',
                textAlign: 'left',
                width: 'fit-content',
              }}
            >
              Zone Préparation
            </button>
            {openZones.preparation && (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div><FieldLabel>Epissure</FieldLabel><textarea rows={2} value={zonePrepEpissure} onChange={(e) => setZonePrepEpissure(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Retreint</FieldLabel><textarea rows={2} value={zonePrepRetreint} onChange={(e) => setZonePrepRetreint(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Torsadage</FieldLabel><textarea rows={2} value={zonePrepTorsadage} onChange={(e) => setZonePrepTorsadage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Eiamage</FieldLabel><textarea rows={2} value={zonePrepEiamage} onChange={(e) => setZonePrepEiamage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Kabatec</FieldLabel><textarea rows={2} value={zonePrepKabatec} onChange={(e) => setZonePrepKabatec(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Lovage</FieldLabel><textarea rows={2} value={zonePrepLovage} onChange={(e) => setZonePrepLovage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div style={{ gridColumn: 'span 2' }}><FieldLabel>Autres remarques</FieldLabel><textarea rows={2} value={zonePrepAutres} onChange={(e) => setZonePrepAutres(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
              </div>
            )}
          </div>

          {/* Zone Montage */}
          <div>
            <button
              type="button"
              onClick={() => setOpenZones((p) => ({ ...p, montage: !p.montage }))}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: `1.5px solid ${openZones.montage ? SKY[400] : SKY[100]}`,
                background: openZones.montage ? SKY[50] : 'white',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 11.5,
                fontFamily: 'inherit',
                color: openZones.montage ? SKY[800] : '#475569',
                textAlign: 'left',
                width: 'fit-content',
              }}
            >
              Zone Montage
            </button>
            {openZones.montage && (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div><FieldLabel>Sous élément</FieldLabel><textarea rows={2} value={zoneMontageSousElement} onChange={(e) => setZoneMontageSousElement(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Montage LAD</FieldLabel><textarea rows={2} value={zoneMontageLAD} onChange={(e) => setZoneMontageLAD(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>PU</FieldLabel><textarea rows={2} value={zoneMontagePU} onChange={(e) => setZoneMontagePU(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>C. Agrafs</FieldLabel><textarea rows={2} value={zoneMontageAgrafs} onChange={(e) => setZoneMontageAgrafs(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Vissage</FieldLabel><textarea rows={2} value={zoneMontageVissage} onChange={(e) => setZoneMontageVissage(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>Montage goulotte</FieldLabel><textarea rows={2} value={zoneMontageGoulotte} onChange={(e) => setZoneMontageGoulotte(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>BOL</FieldLabel><textarea rows={2} value={zoneMontageBOL} onChange={(e) => setZoneMontageBOL(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div><FieldLabel>C. Final</FieldLabel><textarea rows={2} value={zoneMontageCFinal} onChange={(e) => setZoneMontageCFinal(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
                <div style={{ gridColumn: 'span 4' }}><FieldLabel>Autre postes Montage</FieldLabel><textarea rows={2} value={zoneMontageAutrePostes} onChange={(e) => setZoneMontageAutrePostes(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} /></div>
              </div>
            )}
          </div>
        </div>

        <div>
          <FieldLabel>Autres remarques</FieldLabel>
          <textarea rows={3} value={autresRemarques} onChange={(e) => setAutresRemarques(e.target.value)} style={{ ...inputSx, resize: 'vertical' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
        <PrintCertificatRouter fiche={fiche} form={formForPrintAndSave} />
        <button onClick={handleSave} disabled={saving} style={{
          border: 'none',
          borderRadius: 12,
          padding: '12px 18px',
          fontWeight: 900,
          cursor: saving ? 'not-allowed' : 'pointer',
          background: saving ? '#94a3b8' : `linear-gradient(135deg, ${SKY[500]}, ${SKY[700]})`,
          color: 'white',
          fontFamily: 'inherit',
          boxShadow: saving ? 'none' : `0 6px 20px ${SKY[300]}`,
        }}>
          {saving ? 'Enregistrement…' : (existing?.id ? 'Modifier' : 'Émettre')}
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginTop: 12 }}>{error}</div>}
      {success && <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#059669', padding: '9px 14px', borderRadius: 9, fontSize: 13, marginTop: 12 }}>{success}</div>}
    </div>
  );
}

