import { printHTML } from '../../utils/printHelper';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br/>');
}

function pickValue(...values) {
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

function fmtDate(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

function ageFromDate(dateValue) {
  if (!dateValue) return '';
  const born = new Date(dateValue);
  if (Number.isNaN(born.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
}

function check(checked) {
  return checked ? '&#x2611;' : '&#x2610;';
}

function truthy(v) {
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'on' || v === 'OUI' || v === 'oui';
}

function tryParseJson(s) {
  if (!s || typeof s !== 'string') return null;
  const raw = s.trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function dottedLine(label, value) {
  return `<div class="dline"><span class="dline-lbl">${label}</span><span class="dline-track"><span class="dline-val">${esc(value)}</span></span></div>`;
}

function dottedBlankLine() {
  return `<div class="dline"><span class="dline-lbl"></span><span class="dline-track"><span class="dline-val"></span></span></div>`;
}

function dottedBlock(n) {
  return Array.from({ length: n }, () => dottedBlankLine()).join('');
}

/** N lignes pointillées ; si texte déjà saisi : affichage puis N lignes pour suite manuscrite. */
function nLinesBlock(savedText, lineCount) {
  const n = Math.max(0, Number(lineCount) || 0);
  const t = String(savedText ?? '').trim();
  if (!t) return dottedBlock(n);
  return `<div class="filled-block">${esc(savedText)}</div>${dottedBlock(n)}`;
}

function fourLinesBlock(savedText) {
  return nLinesBlock(savedText, 4);
}

function joFooter(joPageNum) {
  return `<footer class="jo-footer">
    <div class="jo-footer-line"></div>
    <div class="jo-footer-row">
      <span class="jo-foot-l"><strong>Page ${joPageNum}</strong></span>
      <span class="jo-foot-c"><em>Journal Officiel de la République Tunisienne — 7 août 2009</em></span>
      <span class="jo-foot-r"><strong>N° 63</strong></span>
    </div>
  </footer>`;
}

export function buildFicheSurveillanceMateurHTML(fiche, collaborateur, siteConfigInput, formInput) {
  const fi = fiche || {};
  const col = '#000';
  getSitePrintConfig(fi, siteConfigInput);
  const form = formInput || {};

  const meta = tryParseJson(fi.observations_complementaires || fi.observations_medecin || '');
  const payload = meta && meta.__sms_mateur_v1 ? meta.__sms_mateur_v1 : null;

  const nom = pickValue(collaborateur?.nom, fi.collaborateur_nom, fi.nom);
  const prenom = pickValue(collaborateur?.prenom, fi.collaborateur_prenom, fi.prenom);
  const dateNaiss = pickValue(collaborateur?.date_naissance, fi.collaborateur_date_naissance);
  const lieuNaiss = pickValue(collaborateur?.lieu_naissance, fi.collaborateur_lieu_naissance);
  const cnss = pickValue(collaborateur?.cnss, fi.collaborateur_cnss, fi.numero_cnss, fi.cnss);
  const age = pickValue(fi.collaborateur_age, ageFromDate(dateNaiss));
  const dateLieuNaiss = [fmtDate(dateNaiss), lieuNaiss ? `à ${lieuNaiss}` : '', age ? `(${age} ans)` : ''].filter(Boolean).join(' ');

  const numDossier = pickValue(fi.numero_dossier_medical, fi.numero_dossier, fi.dossier_medical_numero, fi.id);
  const dateFiche = pickValue(form.date_etablissement_fiche, fmtDate(fi.date_visite), fmtDate(fi.created_at));

  const motifsSrc = payload?.motifs || form?.motifs || {};
  const motifs = {
    moins18: truthy(motifsSrc.moins18) || truthy(fi.sms_moins_18) || truthy(fi.sms_moins18) || truthy(fi.travailleur_moins_18),
    enceinteAllaitante: truthy(motifsSrc.enceinte_allaitante) || truthy(fi.sms_femme_enceinte) || truthy(fi.femme_enceinte),
    handicape: truthy(motifsSrc.handicape) || truthy(fi.sms_handicape) || truthy(fi.travailleur_handicape),
    travauxRisquesAcc: truthy(motifsSrc.travaux_risques_accidents) || truthy(fi.sms_risques_accidents) || truthy(fi.travaux_risques_accidents),
    maladieChronique: truthy(motifsSrc.maladie_chronique) || truthy(fi.sms_maladie_chronique) || truthy(fi.maladie_chronique),
    travauxMp: truthy(motifsSrc.travaux_maladies_professionnelles) || truthy(fi.sms_maladies_professionnelles) || truthy(fi.travaux_maladies_professionnelles),
  };

  const etudePosteCaracteristiques = pickValue(payload?.poste_caracteristiques, form?.poste_caracteristiques, fi.sms_etude_poste_caracteristiques, fi.etude_poste_caracteristiques);
  const etudePosteErgo = pickValue(payload?.poste_ergonomie, form?.poste_ergonomie, fi.sms_etude_poste_ergonomique, fi.etude_ergonomique);
  const tacheHabituelle = pickValue(payload?.tache_habituelle, form?.tache_habituelle, fi.sms_description_tache, fi.description_tache_habituelle, fi.tache_habituelle);

  const risqueAT = pickValue(payload?.risques_accidents, form?.risques_accidents, fi.sms_risque_accidents_travail, fi.risque_accidents_travail);
  const risqueMP = pickValue(payload?.tableaux_mp_et_agents, form?.tableaux_mp_et_agents, fi.sms_risque_maladies_professionnelles, fi.risque_maladies_professionnelles);
  const evalExpo = pickValue(payload?.evaluation_exposition, form?.evaluation_exposition, fi.sms_evaluation_exposition, fi.evaluation_exposition_risques);

  const mesures = pickValue(payload?.mesures_prevention, form?.mesures_prevention, fi.sms_mesures_prevention, fi.mesures_prevention);

  const rows = Array.isArray(payload?.surveillance_rows)
    ? payload.surveillance_rows
    : (Array.isArray(form?.surveillance_rows) ? form.surveillance_rows : []);

  function motifRow(checked, label) {
    return `<div class="motif-row"><span class="motif-box">${check(checked)}</span><span class="motif-txt">${label}</span></div>`;
  }

  function cellLines(field, lineCount = 8) {
    const n = Math.max(1, Number(lineCount) || 8);
    const lines = Array.from({ length: n }).map((_, idx) => {
      const r = rows[idx] || {};
      const v = esc(r?.[field] || '');
      return `<div class="cellLine"><span class="cellTxt">${v}</span></div>`;
    }).join('');
    return `<div class="cellLines">${lines}</div>`;
  }

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Annexe n° 2 — Fiche de Surveillance Médicale Spéciale</title>
<style>
  @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    color: ${col};
    font-size: 10.5pt;
    line-height: 1.22;
    margin: 0;
  }
  .page-shell {
    display: flex;
    flex-direction: column;
    min-height: 274mm;
  }
  .hdr {
    text-align: center;
    margin-bottom: 12px;
  }
  .hdr-ann {
    font-weight: 700;
    font-size: 11.5pt;
    margin: 0 0 4px;
  }
  .hdr-title {
    font-weight: 700;
    font-size: 14pt;
    margin: 0 0 10px;
    letter-spacing: 0.03em;
  }
  .hdr-legal {
    font-weight: 400;
    font-size: 10pt;
    line-height: 1.32;
    max-width: 96%;
    margin: 0 auto;
  }
  .dossier-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    font-size: 10.5pt;
  }
  .dossier-row .dline { flex: 1; min-width: 200px; margin-bottom: 0; }
  .sec {
    margin-top: 14px;
  }
  .sec-h {
    font-weight: 700;
    font-size: 11pt;
    margin: 0 0 8px;
  }
  .dline {
    display: flex;
    align-items: flex-end;
    width: 100%;
    margin-bottom: 9px;
  }
  .dline-lbl { flex-shrink: 0; padding-right: 4px; }
  .dline-track {
    flex: 1;
    border-bottom: 1px dotted ${col};
    min-height: 16px;
    text-align: left;
  }
  .dline-val { display: block; padding: 0 3px 1px; }
  .motifs-2col {
    display: flex;
    gap: 28px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .motifs-col {
    flex: 1;
    min-width: 240px;
  }
  .motif-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 5px 0 8px;
  }
  .motif-box {
    flex-shrink: 0;
    font-size: 12pt;
    line-height: 1;
    margin-top: 1px;
  }
  .motif-txt {
    flex: 1;
    line-height: 1.3;
    text-align: justify;
  }
  .sub-h {
    font-weight: 700;
    font-size: 10.5pt;
    margin: 10px 0 6px;
  }
  .sub-sub {
    font-weight: 700;
    margin: 8px 0 5px;
    font-size: 9.2pt;
    line-height: 1.25;
  }
  .block-fill {
    margin: 4px 0 8px;
  }
  .filled-block {
    white-space: pre-wrap;
    min-height: 20px;
    padding: 2px 0 6px;
    border-bottom: 1px dotted ${col};
  }
  .pagebreak {
    page-break-before: always;
    break-before: page;
  }
  .sms-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    border: 1px solid ${col};
    table-layout: fixed;
    font-size: 9.5pt;
  }
  .sms-table th,
  .sms-table td {
    padding: 4px 6px;
    vertical-align: top;
    text-align: center;
  }
  /* Comme l'original: séparateurs verticaux, pas de quadrillage horizontal */
  .sms-table th,
  .sms-table td {
    border-left: 1px solid ${col};
    border-right: none;
  }
  .sms-table th:first-child,
  .sms-table td:first-child { border-left: none; }
  .sms-table th:last-child,
  .sms-table td:last-child { border-right: none; }
  .sms-table th {
    font-weight: 700;
    line-height: 1.15;
    border-bottom: 1px solid ${col};
  }
  .sms-table tbody td {
    text-align: left;
    vertical-align: top;
    font-size: 9.5pt;
    border-top: none;
    border-bottom: none;
    padding-top: 2px;
  }
  .sms-table tbody tr{
    height: 118mm; /* occuper la page comme l'original */
  }
  .cellLines{
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .cellLine{
    position: relative;
    width: 100%;
    height: 6.8mm;           /* lignes alignées entre colonnes */
    display:flex;
    align-items:flex-end;
    padding-bottom: 1px;
    flex: 0 0 auto;
  }
  /* Ligne pointillée continue (plus propre que border:dotted) */
  .cellLine::after{
    content:"";
    position:absolute;
    left:0;
    right:0;
    bottom:0;
    height: 1px;
    background-image: radial-gradient(circle, ${col} 0.55px, transparent 0.65px);
    background-size: 3px 1px;
    background-repeat: repeat-x;
  }
  .cellTxt{
    display:block;
    padding-bottom: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Page 2 (original) : pas de ligne "----" au-dessus des blocs */
  .sec-after-dash {
    border-top: none;
    margin-top: 14px;
    padding-top: 0;
  }
  .jo-footer {
    flex-shrink: 0;
    width: 100%;
    font-size: 9.5pt;
    line-height: 1.2;
    margin-top: auto;
    padding-top: 8mm;
  }
  .jo-footer-line {
    border-top: 1px solid ${col};
    margin: 0 0 5px;
  }
  .jo-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .jo-foot-l { flex: 0 0 auto; text-align: left; }
  .jo-foot-c { flex: 1 1 auto; text-align: center; padding: 0 6px; }
  .jo-foot-r { flex: 0 0 auto; white-space: nowrap; text-align: right; }

  /* Page 2 uniquement : compacter pour tenir sur une feuille avec le pied JO (objectif 2 pages au total) */
  .page2-compact.page-shell {
    min-height: 274mm; /* garder le footer collé en bas */
  }
  .page2-compact .sec {
    margin-top: 8px;
  }
  .page2-compact .sec:first-of-type {
    margin-top: 0;
  }
  .page2-compact .sec-h {
    font-size: 10pt;
    margin: 0 0 5px;
  }
  .page2-compact .sub-sub {
    margin: 5px 0 3px;
    font-size: 9pt;
    line-height: 1.2;
  }
  .page2-compact .block-fill {
    margin: 2px 0 4px;
  }
  .page2-compact .dline {
    margin-bottom: 5px;
  }
  .page2-compact .dline-track {
    min-height: 12px;
  }
  .page2-compact .filled-block {
    min-height: 14px;
    padding: 1px 0 4px;
  }
  .page2-compact .sec-after-dash {
    margin-top: 8px;
    padding-top: 0;
  }
  .page2-compact .sms-table {
    margin-top: 5px;
    font-size: 9pt;
  }
  .page2-compact .sms-table th,
  .page2-compact .sms-table td {
    padding: 3px 4px;
  }
  .page2-compact .sms-table th {
    line-height: 1.08;
    font-size: 8.5pt;
  }
  .page2-compact .sms-table tbody td {
    font-size: 9pt;
  }
  .page2-compact .sms-table tbody tr{ height: 108mm; }
  .page2-compact .cellLine{ height: 6.0mm; }
  .page2-compact .jo-footer {
    padding-top: 0;
    font-size: 9pt;
  }
</style></head><body>

<div class="page-shell">
  <header class="hdr">
    <p class="hdr-ann">Annexe n° 2</p>
    <p class="hdr-title">FICHE DE SURVEILLANCE MEDICALE SPECIALE</p>
    <p class="hdr-legal">En application des articles 10 et 34 du décret n°2000-1985 du 12 septembre 2000 portant organisation et fonctionnement des services de médecine du travail</p>
  </header>

  <div class="dossier-row">
    ${dottedLine('N° du dossier médical :', numDossier)}
    ${dottedLine('Date d\'établissement de la fiche :', dateFiche)}
  </div>

  <section class="sec">
    <h2 class="sec-h">1- IDENTIFICATION DU TRAVAILLEUR</h2>
    ${dottedLine('Nom :', nom)}
    ${dottedLine('Prénom :', prenom)}
    ${dottedLine('Date et lieu de naissance :', dateLieuNaiss)}
    ${dottedLine('N° d\'affiliation à la caisse nationale :', cnss)}
  </section>

  <section class="sec">
    <h2 class="sec-h">2- MOTIF DE LA SURVEILLANCE MEDICALE SPECIALE</h2>
    <div class="motifs-2col">
      <div class="motifs-col">
        ${motifRow(motifs.moins18, 'Travailleur âgé de moins de 18 ans')}
        ${motifRow(motifs.enceinteAllaitante, 'Femme enceinte ou allaitante')}
        ${motifRow(motifs.travauxRisquesAcc, 'Travaux particuliers exposant aux risques d\'accidents de travail')}
        ${motifRow(motifs.travauxMp, 'Travaux exposant aux risques des maladies professionnelles')}
      </div>
      <div class="motifs-col">
        ${motifRow(motifs.handicape, 'Travailleur handicapé')}
        ${motifRow(motifs.maladieChronique, 'Travailleur atteint d\'une maladie chronique')}
      </div>
    </div>
  </section>

  <section class="sec">
    <h2 class="sec-h">3- ETUDE DU POSTE DU TRAVAIL ET DESCRIPTION DE LA TACHE HABITUELLE</h2>
    <div class="sub-h">3-1 ETUDE DU POSTE DU TRAVAIL</div>
    <div class="sub-sub">3-1-1 Caractéristiques du poste (implantation, accessibilité, matériel utilisé, produits manipulés, …)</div>
    <div class="block-fill">${fourLinesBlock(etudePosteCaracteristiques)}</div>
    <div class="sub-sub">3-1-2 Étude ergonomique des facteurs d'ambiance (éclairage, température, poussières, nuisances chimiques…)</div>
    <div class="block-fill">${fourLinesBlock(etudePosteErgo)}</div>
    <div class="sub-h" style="margin-top:12px;">3-2 DESCRIPTION DE LA TACHE HABITUELLE</div>
    <div class="block-fill">${fourLinesBlock(tacheHabituelle)}</div>
  </section>

  ${joFooter(2729)}
</div>

<div class="page-shell pagebreak page2-compact">
  <section class="sec">
    <h2 class="sec-h">4- DESCRIPTION ET EVALUATION DU RISQUE PROFESSIONNEL</h2>
    <div class="sub-sub">4.1 DESCRIPTION DES PRINCIPAUX RISQUES D'ACCIDENTS DE TRAVAIL</div>
    <div class="block-fill">${fourLinesBlock(risqueAT)}</div>
    <div class="sub-sub">4.2 DESIGNATION DU (OU DES) TABLEAU(X) DES MALADIES PROFESSIONNELLES ET DES AGENTS RESPONSABLES DES MALADIES</div>
    <div class="block-fill">${nLinesBlock(risqueMP, 3)}</div>
    <div class="sub-sub">4.3 EVALUATION DE L'EXPOSITION AU(X) RISQUE(S) EN PRECISANT LA DATE DU PRELEVEMENT OU DE L'ANALYSE, LE CAS ECHEANT</div>
    <div class="block-fill">${fourLinesBlock(evalExpo)}</div>
  </section>

  <section class="sec sec-after-dash">
    <h2 class="sec-h">5- SURVEILLANCE MEDICALE SPECIALE DU TRAVAILLEUR</h2>
    <table class="sms-table">
      <thead>
        <tr>
          <th style="width:13%;">Date de l'examen</th>
          <th style="width:28%;">Nature de l'examen<br/>(clinique, biologique, toxicologique, …)</th>
          <th style="width:36%;">Résultats de l'examen</th>
          <th style="width:23%;">Nom, prénom et signature du médecin du travail</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${cellLines('date_examen', 8)}</td>
          <td>${cellLines('nature_examen', 8)}</td>
          <td>${cellLines('resultats', 8)}</td>
          <td>${cellLines('medecin_signature', 8)}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="sec sec-after-dash">
    <h2 class="sec-h">6- MESURES PRISES DANS LE DOMAINE DE LA PREVENTION</h2>
    <div class="block-fill">${fourLinesBlock(mesures)}</div>
  </section>

  ${joFooter(2730)}
</div>

</body></html>`;
}

export default function PrintFicheSurveillanceMateur({ fiche, collaborateur, siteConfig, form, label, title }) {
  const btnLabel = label || 'Imprimer fiche SMS (Surveillance spéciale)';
  const btnTitle = title || btnLabel;

  function handlePrint() {
    printHTML(buildFicheSurveillanceMateurHTML(fiche, collaborateur, siteConfig, form));
  }

  return (
    <button
      onClick={handlePrint}
      title={btnTitle}
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      {btnLabel}
    </button>
  );
}
