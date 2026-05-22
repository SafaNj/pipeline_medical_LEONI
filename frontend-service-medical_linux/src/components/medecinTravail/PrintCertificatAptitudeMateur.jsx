import { printHTML } from '../../utils/printHelper';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';
function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function tryParseJson(s) {
  if (!s || typeof s !== 'string') return null;
  const raw = s.trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Déballage description (objet, JSON simple ou JSON doublement sérialisé). */
function parseCertDescription(rawDesc) {
  let meta =
    typeof rawDesc === 'string'
      ? tryParseJson(rawDesc)
      : rawDesc && typeof rawDesc === 'object'
        ? rawDesc
        : null;
  let guard = 0;
  while (typeof meta === 'string' && guard++ < 5) {
    const inner = tryParseJson(meta);
    if (!inner) break;
    meta = inner;
  }
  if (!meta || typeof meta !== 'object') return null;
  if (meta.__mateur_cert_v1 && typeof meta.__mateur_cert_v1 === 'object') {
    return meta.__mateur_cert_v1;
  }
  if (meta.avis || meta.zones) return meta;
  return null;
}

function checkbox(checked) {
  return checked ? '☑' : '☐';
}

export function buildCertificatAptitudeMateurHTML(fiche, form, siteConfig) {
  const cert = form || fiche?.certificat || {};
  const payload = parseCertDescription(cert?.description);

  const typeVisite = payload?.type_visite || fiche?.type_visite || '';
  const aptitude = payload?.aptitude || fiche?.aptitude || '';
  const precision = payload?.precision_aptitude ?? fiche?.precision_aptitude ?? '';

  const nom = fiche?.collaborateur_nom || '';
  const matricule = fiche?.collaborateur_matricule || '';
  const poste = fiche?.collaborateur_poste || '';
  const dateVisite = fiche?.date_visite || '';

  const avis = payload?.avis || {};
  const apc = avis?.a_prendre_en_consideration || {};
  const zoneCoupe = payload?.zones?.coupe || {};
  const zonePrep = payload?.zones?.preparation || {};
  const zoneMontage = payload?.zones?.montage || {};
  const autresRemarques = String(payload?.autres_remarques || '').trim();
  const entete = payload?.entete || {};
  const enteteCert = entete?.certificat_medical_aptitude !== undefined ? !!entete.certificat_medical_aptitude : true;
  const enteteReprise = !!entete?.reprise_au_poste;

  const title1 = "CERTIFICAT MEDICALE D'APTITUDE";
  const title2 = 'REPRISE AU POSTE DE TRAVAIL';

  const is = (t) => String(typeVisite || '').toUpperCase() === t;
  const isApt = (a) => String(aptitude || '').toUpperCase() === a;
  const visitIsUrgence = is('SPONTANEE');
  const aptIsDef = isApt('INAPTE_DEFINITIF_MEME_POSTE') || isApt('INAPTE_DEFINITIF_ENTREPRISE');

  const cell = (v) => esc(String(v ?? '').trim());

  /** Case à droite du libellé (comme formulaire papier LEONI). */
  const chkRight = (checked) => `<span class="cb">${checkbox(checked)}</span>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>${esc(title1)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 9mm 10mm 9mm; }
    :root { --line: #4a4a4a; --lineW: 0.7px; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      font-size: 10pt;
      line-height: 1.25;
      margin: 0;
      /* meilleure netteté en print/zoom */
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
    .top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .svc {
      font-size: 9.5pt;
      font-weight: 700;
      line-height: 1.2;
      white-space: pre-line;
      max-width: 38%;
    }
    .mid {
      flex: 1;
      text-align: center;
      padding: 0 6px;
    }
    .midWrap{
      display:flex;
      align-items:flex-start;
      justify-content:center;
      gap:10px;
      margin-top: 2mm; /* descendre un peu titre+cases */
    }
    .headLine{
      display:flex;
      align-items: center; /* case et texte au même niveau */
      justify-content: flex-start;
      gap: 8px;
    }
    .headLine .cb{
      font-size: 12pt;
      line-height: 1;
      font-family: "Segoe UI Symbol", Arial, sans-serif;
      width: 14px;          /* même colonne pour les 2 cases */
      text-align: center;
      flex: 0 0 14px;
      transform: translateY(-0.5px);
    }
    .headBlock{
      display: inline-block; /* permet centrage tout en gardant alignement interne */
      text-align: left;
    }
    .t1 {
      font-size: 10.2pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0;
      letter-spacing: 0.02em;
    }
    .t2 {
      font-size: 9.4pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 3px 0 0;
      letter-spacing: 0.02em;
    }
    .logoSlot {
      width: 88px;
      min-height: 36px;
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      margin-top: -4mm; /* logo encore plus en haut */
    }
    .leoniLogo{
      width: 72px; /* un peu plus petit comme l'original */
      height: auto;
      object-fit: contain;
      display:block;
    }
    .intro {
      margin-top: 8px;
      margin-bottom: 4px;
    }
    .row {
      margin-top: 5px;
      display: flex;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 4px 8px;
    }
    .lbl { font-weight: 700; flex-shrink: 0; }
    .dots {
      flex: 1;
      min-width: 140px;
      border-bottom: 1px dotted #000;
      min-height: 15px;
      padding: 0 4px 1px;
    }
    /* Visite : libellés puis case à droite (même ligne que l’original) */
    .visitRow {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 18px;
      margin-top: 8px;
      margin-bottom: 4px;
    }
    .pair {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pair .cb {
      font-size: 11pt;
      line-height: 1;
      font-family: "Segoe UI Symbol", Arial, sans-serif;
    }
    .blockTit {
      margin-top: 10px;
      margin-bottom: 6px;
      font-weight: 700;
    }
    /* Aptitude : même principe que « Visite » — texte puis case juste à côté */
    .aptBlock {
      margin-top: 4px;
      width: 100%;
    }
    .aptPair {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 6px 0;
    }
    .aptPair > span:first-of-type {
      font-size: 10pt;
      line-height: 1.35;
    }
    .aptPair .cb {
      flex-shrink: 0;
      font-size: 11pt;
      line-height: 1;
      margin-top: 2px;
      font-family: "Segoe UI Symbol", Arial, sans-serif;
    }
    .tab {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border: var(--lineW) solid var(--line);
      table-layout: fixed;
    }
    .tab th,
    .tab td {
      border: var(--lineW) solid var(--line);
      padding: 4px 3px;
      vertical-align: middle;
      font-size: 8.5pt;
      text-align: center;
      word-break: normal;
      hyphens: none;
    }
    .tab th {
      font-weight: 600;
      font-size: 7pt; /* aspect plus proche du scan */
      line-height: 1.05;
      padding: 5px 4px;
    }
    .tab td {
      height: 28px;
      vertical-align: middle;
    }
    /* Remplissage page : grandes cases comme l'original */
    .tab tbody td{
      height: 58px;
      vertical-align: top;
      padding-top: 8px;
    }
    /* Colonnes à libellés longs : pas de chevauchement */
    .tab .th-stack {
      font-size: 6.8pt;
      font-weight: 600;
      line-height: 1.05;
      padding: 6px 5px !important;
      white-space: normal;
      word-break: keep-all;
      overflow-wrap: normal;
      hyphens: none;
    }
    .tabCap {
      font-size: 7.4pt;
      font-weight: 600;
      line-height: 1.15;
    }
    /* Sous-colonnes « A prendre en considération » — empilement comme formulaire papier */
    .apcTh {
      font-size: 6.6pt;
      font-weight: 600;
      line-height: 1.05;
      padding: 6px 5px !important;
      white-space: normal;
      vertical-align: middle;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    /* Barre "Zone ..." comme le scan (titre dans un bandeau encadré) */
    .zoneBar {
      margin-top: 10px;
      border: var(--lineW) solid var(--line);
      border-bottom: none;
      text-align: center;
      font-size: 8.2pt;
      font-weight: 600;
      padding: 2px 0 1px;
      line-height: 1.1;
    }
    .z {
      width: 100%;
      border-collapse: collapse;
      border: var(--lineW) solid var(--line);
      border-top: none; /* raccord avec le bandeau Zone */
    }
    .z th,
    .z td {
      border: var(--lineW) solid var(--line);
      padding: 5px 4px;
      font-size: 9pt;
      vertical-align: middle;
      text-align: center;
    }
    .z th {
      font-weight: 600;
      font-size: 7.2pt;
      line-height: 1.1;
      padding: 4px 3px;
    }
    /* grandes zones d'écriture comme le formulaire papier */
    .z tbody td {
      height: 52px;
      vertical-align: top;
      padding-top: 7px;
    }
    .z.zPrep tbody td { height: 60px; }
    .z.zMontage tbody td { height: 66px; }
    /* "Autres Remarques" à l'intérieur de Zone Montage (comme scan) */
    .z.zMontage .mRemLabel {
      height: auto;
      text-align: left;
      font-size: 7.2pt;
      font-weight: 600;
      padding: 3px 4px 2px;
      vertical-align: middle;
    }
    .z.zMontage .mRemBox {
      height: 85px; /* pour éviter bas de page vide */
      text-align: left;
      font-size: 8.6pt;
      font-weight: 500;
      padding: 7px 8px 6px;
      vertical-align: top;
      white-space: pre-wrap;
    }
    .freeTit {
      font-weight: 900;
      margin-top: 12px;
      margin-bottom: 4px;
      font-size: 10pt;
    }
    .free {
      border: var(--lineW) solid var(--line);
      min-height: 44px;
      padding: 8px;
      white-space: pre-wrap;
      font-size: 9.5pt;
    }
  </style></head><body>
    <div class="top">
      <div class="svc">Service Médical&#10;Mateur Sud</div>
      <div class="mid">
        <div class="midWrap">
          <div class="headBlock">
            <div class="headLine"><span class="cb">${checkbox(enteteCert)}</span><span class="t1">${esc(title1)}</span></div>
            <div class="headLine"><span class="cb">${checkbox(enteteReprise)}</span><span class="t2">${esc(title2)}</span></div>
          </div>
        </div>
      </div>
      <div class="logoSlot">
        <img class="leoniLogo" src="https://i.imgur.com/P8t9SW7.png" alt="LEONI" referrerpolicy="no-referrer" />
      </div>
    </div>

    <div class="intro">Je soussigné, certifie avoir examiné</div>

    <div class="row"><span class="lbl">Mr / Mme :</span><span class="dots">${esc(nom)}</span></div>
    <div class="row"><span class="lbl">Matricule :</span><span class="dots">${esc(matricule)}</span></div>
    <div class="row"><span class="lbl">Poste de travail :</span><span class="dots">${esc(poste)}</span></div>

    <div class="visitRow">
      <span class="lbl">Visite :</span>
      <span class="pair"><span>Embauche</span>${chkRight(is('EMBAUCHE'))}</span>
      <span class="pair"><span>Périodique</span>${chkRight(is('PERIODIQUE'))}</span>
      <span class="pair"><span>Situation d'urgence</span>${chkRight(visitIsUrgence)}</span>
      <span class="pair"><span>Reprise</span>${chkRight(is('REPRISE'))}</span>
    </div>

    <div class="blockTit">Et atteste que l'intéressé(e) est :</div>
    <div class="aptBlock">
      <div class="aptPair">
        <span>APTE au poste mentionné / Peut reprendre son poste de travail</span>
        ${chkRight(isApt('APTE_AU_POSTE'))}
      </div>
      <div class="aptPair">
        <span>INAPTE temporaire au poste mentionné</span>
        ${chkRight(isApt('INAPTE_TEMPORAIRE'))}
      </div>
      <div class="aptPair">
        <span>INAPTE définitif au poste mentionné</span>
        ${chkRight(aptIsDef)}
      </div>
    </div>

    <table class="tab">
      <colgroup>
        <col style="width:7%" /><col style="width:7%" /><col style="width:7%" /><col style="width:7%" />
        <col style="width:7%" /><col style="width:6%" /><col style="width:12%" /><col style="width:12%" />
        <col style="width:11.67%" /><col style="width:11.67%" /><col style="width:11.66%" />
      </colgroup>
      <thead>
        <tr>
          <th colspan="11" class="tabCap">Avis Service Médecine de travail<br/>concernant état de santé général et contre-indication au poste de travail</th>
        </tr>
        <tr>
          <th rowspan="2">Etat Général<br/>Efficience</th>
          <th rowspan="2">Debout<br/>prolongé</th>
          <th rowspan="2">Assis<br/>prolongé</th>
          <th rowspan="2">Charge &gt;4<br/>kgr</th>
          <th rowspan="2">Poignet<br/>Bras Epaule</th>
          <th rowspan="2">Cou</th>
          <th rowspan="2" class="th-stack">Effort<br/>Précision<br/>Concentration</th>
          <th rowspan="2" class="th-stack">Rotation<br/>Equipe<br/>Possible</th>
          <th colspan="3">A prendre en considération</th>
        </tr>
        <tr>
          <th class="apcTh">Maladie<br/>Professionnelle</th>
          <th class="apcTh">Accident<br/>de<br/>travail<br/>avec<br/>séquels</th>
          <th class="apcTh">Maladies<br/>chroniques</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${cell(avis?.etat_general_efficience)}</td>
          <td>${cell(avis?.debout_prolonge)}</td>
          <td>${cell(avis?.assis_prolonge)}</td>
          <td>${cell(avis?.charge_sup_4kg)}</td>
          <td>${cell(avis?.poignet_bras_epaule)}</td>
          <td>${cell(avis?.cou)}</td>
          <td>${cell(avis?.effort_precision_concentration)}</td>
          <td>${cell(avis?.rotation_equipe_possible)}</td>
          <td>${cell(apc?.maladie_professionnelle)}</td>
          <td>${cell(apc?.accident_travail_sequelles)}</td>
          <td>${cell(apc?.maladies_chroniques)}</td>
        </tr>
      </tbody>
    </table>

    <div class="zoneBar">Zone Coupe</div>
    <table class="z zCoupe">
      <thead><tr><th>Coupe</th><th>Sertissage manuel</th><th>Autres Remarques</th></tr></thead>
      <tbody><tr><td>${cell(zoneCoupe?.coupe)}</td><td>${cell(zoneCoupe?.sertissage_manuel)}</td><td>${cell(zoneCoupe?.autres_remarques)}</td></tr></tbody>
    </table>

    <div class="zoneBar">Zone Préparation</div>
    <table class="z zPrep">
      <thead>
        <tr>
          <th>Epissure</th><th>Retreint</th><th>Torsadage</th><th>Etamage</th><th>Kabatec</th><th>Lovage</th><th>Autres remarques</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${cell(zonePrep?.epissure)}</td>
          <td>${cell(zonePrep?.retreint)}</td>
          <td>${cell(zonePrep?.torsadage)}</td>
          <td>${cell(zonePrep?.eiamage)}</td>
          <td>${cell(zonePrep?.kabatec)}</td>
          <td>${cell(zonePrep?.lovage)}</td>
          <td>${cell(zonePrep?.autres_remarques)}</td>
        </tr>
      </tbody>
    </table>

    <div class="zoneBar">Zone Montage</div>
    <table class="z zMontage">
      <thead>
        <tr>
          <th>Sous élément</th><th>Montage LAD</th><th>PU</th><th>C. Agrafs</th><th>Vissage</th><th>Montage goulotte</th><th>BOL</th><th>C. Final</th><th>Autre postes Montage</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${cell(zoneMontage?.sous_element)}</td>
          <td>${cell(zoneMontage?.montage_lad)}</td>
          <td>${cell(zoneMontage?.pu)}</td>
          <td>${cell(zoneMontage?.c_agrafs)}</td>
          <td>${cell(zoneMontage?.vissage)}</td>
          <td>${cell(zoneMontage?.montage_goulotte)}</td>
          <td>${cell(zoneMontage?.bol)}</td>
          <td>${cell(zoneMontage?.c_final)}</td>
          <td>${cell(zoneMontage?.autre_postes_montage)}</td>
        </tr>
        <tr>
          <td colspan="9" class="mRemLabel">Autres Remarques</td>
        </tr>
        <tr>
          <td colspan="9" class="mRemBox">${esc(autresRemarques)}</td>
        </tr>
      </tbody>
    </table>
  </body></html>`;
}

export default function PrintCertificatAptitudeMateur({ fiche, form, label, title, siteConfig }) {
  const btnLabel = label || "Imprimer certificat d'aptitude";
  const btnTitle = title || btnLabel;
  const handlePrint = () => {
    const html = buildCertificatAptitudeMateurHTML(fiche, form, siteConfig);
    printHTML(html);
  };
  return (
    <button onClick={handlePrint} title={btnTitle}
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      {btnLabel}
    </button>
  );
}
