/**
 * État plat du certificat Mateur (liste d’embauche) — aligné sur Nouvellefiche.jsx / creerCertificat description.
 */
export function makeEmptyEmbaucheMateurCert() {
  return {
    // En-tête (2 cases à cocher en haut du certificat papier)
    certHeaderCertificatMedical: true,
    certHeaderReprisePoste: false,
    certAvisEtatGeneral: '',
    certAvisDebout: '',
    certAvisAssis: '',
    certAvisCharge4: '',
    certAvisPoignetBrasEpaule: '',
    certAvisCou: '',
    certAvisEffortPrecision: '',
    certAvisRotationEquipe: '',
    certApcMaladiePro: '',
    certApcAccident: '',
    certApcMaladiesChroniques: '',
    certZoneCoupeCoupe: '',
    certZoneCoupeSertissage: '',
    certZoneCoupeAutres: '',
    certZonePrepEpissure: '',
    certZonePrepRetreint: '',
    certZonePrepTorsadage: '',
    certZonePrepEiamage: '',
    certZonePrepKabatec: '',
    certZonePrepLovage: '',
    certZonePrepAutres: '',
    certZoneMontageSousElement: '',
    certZoneMontageLAD: '',
    certZoneMontagePU: '',
    certZoneMontageAgrafs: '',
    certZoneMontageVissage: '',
    certZoneMontageGoulotte: '',
    certZoneMontageBOL: '',
    certZoneMontageCFinal: '',
    certZoneMontageAutrePostes: '',
    certAutresRemarques: '',
  };
}

/**
 * Objet `description` pour POST certificat (même structure que Nouvellefiche).
 */
export function buildMateurCertificatDescriptionForApi(cert, { type_visite, aptitude, precision_aptitude }) {
  const c = cert && typeof cert === 'object' ? cert : makeEmptyEmbaucheMateurCert();
  return {
    __mateur_cert_v1: {
      version: 1,
      type_visite,
      aptitude,
      precision_aptitude: precision_aptitude != null ? String(precision_aptitude) : '',
      entete: {
        certificat_medical_aptitude: !!c.certHeaderCertificatMedical,
        reprise_au_poste: !!c.certHeaderReprisePoste,
      },
      avis: {
        etat_general_efficience: c.certAvisEtatGeneral,
        debout_prolonge: c.certAvisDebout,
        assis_prolonge: c.certAvisAssis,
        charge_sup_4kg: c.certAvisCharge4,
        poignet_bras_epaule: c.certAvisPoignetBrasEpaule,
        cou: c.certAvisCou,
        effort_precision_concentration: c.certAvisEffortPrecision,
        rotation_equipe_possible: c.certAvisRotationEquipe,
        a_prendre_en_consideration: {
          maladie_professionnelle: c.certApcMaladiePro,
          accident_travail_sequelles: c.certApcAccident,
          maladies_chroniques: c.certApcMaladiesChroniques,
        },
      },
      zones: {
        coupe: {
          coupe: c.certZoneCoupeCoupe,
          sertissage_manuel: c.certZoneCoupeSertissage,
          autres_remarques: c.certZoneCoupeAutres,
        },
        preparation: {
          epissure: c.certZonePrepEpissure,
          retreint: c.certZonePrepRetreint,
          torsadage: c.certZonePrepTorsadage,
          eiamage: c.certZonePrepEiamage,
          kabatec: c.certZonePrepKabatec,
          lovage: c.certZonePrepLovage,
          autres_remarques: c.certZonePrepAutres,
        },
        montage: {
          sous_element: c.certZoneMontageSousElement,
          montage_lad: c.certZoneMontageLAD,
          pu: c.certZoneMontagePU,
          c_agrafs: c.certZoneMontageAgrafs,
          vissage: c.certZoneMontageVissage,
          montage_goulotte: c.certZoneMontageGoulotte,
          bol: c.certZoneMontageBOL,
          c_final: c.certZoneMontageCFinal,
          autre_postes_montage: c.certZoneMontageAutrePostes,
        },
      },
      autres_remarques: c.certAutresRemarques,
    },
  };
}
