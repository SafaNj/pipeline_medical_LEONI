import { printHTML } from '../../utils/printHelper';

import { getSitePrintConfig } from '../../utils/siteConfig';

import { useAuth } from '../../context/AuthContext';

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



function normalizeBool(v) {

  return v === true || v === 1 || v === '1' || v === 'true' || v === 'on';

}



function check(checked) {

  return checked ? '&#x2611;' : '&#x2610;';

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



/** Ligne type formulaire officiel : libellé + tirets pointillés + valeur. */

function dottedLine(label, value) {

  return `<div class="dline"><span class="dline-lbl">${label}</span><span class="dline-track"><span class="dline-val">${esc(value)}</span></span></div>`;

}



/** Ligne vide (tirets seuls), ex. 2e ligne qualifications. */

function dottedBlankLine() {

  return `<div class="dline"><span class="dline-lbl"></span><span class="dline-track"><span class="dline-val"></span></span></div>`;

}

/** Nom affiché pour la ligne « Je soussigné(e) … » (session / formulaire). */
export function medecinDisplayNameFromUser(user) {
  if (!user || typeof user !== 'object') return '';
  const fr = [user.prenom, user.nom].filter((x) => String(x || '').trim()).join(' ').trim();
  if (fr) return fr;
  const en = [user.first_name, user.last_name].filter((x) => String(x || '').trim()).join(' ').trim();
  if (en) return en;
  return pickValue(user.full_name, user.name, user.username);
}

/** Pied de page Journal officiel (Annexe n° 3 — pages JO 2221 / 2222). */
function joFooter(joPageNum) {

  return `<footer class="jo-footer" role="contentinfo">

    <div class="jo-footer-line"></div>

    <div class="jo-footer-row">

      <span class="jo-foot-l"><strong>N° 63</strong></span>

      <span class="jo-foot-c"><em>Journal Officiel de la République Tunisienne — 7 août 2009</em></span>

      <span class="jo-foot-r"><strong>Page ${joPageNum}</strong></span>

    </div>

  </footer>`;

}



export function buildFicheAptitudeMaturHTML(fiche, siteConfigInput, formInput) {

  const fi = fiche || {};

  const cfg = getSitePrintConfig(fi, siteConfigInput);

  const form = formInput || {};



  const entrepriseRaison = pickValue(fi.raison_sociale, fi.entreprise_raison_sociale, cfg.footerCompanySite);

  const entrepriseAdresse = pickValue(fi.adresse_entreprise, fi.entreprise_adresse, cfg.footerCompanyAddress);

  const entrepriseActivite = pickValue(fi.nature_activite, fi.entreprise_nature_activite);

  const entrepriseCnss = pickValue(fi.numero_cnss_entreprise, fi.cnss_entreprise, fi.entreprise_cnss);



  const nom = pickValue(fi.collaborateur_nom, fi.nom, fi.collaborateur?.nom);

  const prenom = pickValue(fi.collaborateur_prenom, fi.prenom, fi.collaborateur?.prenom);

  const nomPrenom = pickValue(`${nom} ${prenom}`.trim(), fi.collaborateur_nom, fi.nom);



  const dateNaiss = pickValue(fi.collaborateur_date_naissance, fi.date_naissance, fi.collaborateur?.date_naissance);

  const lieuNaiss = pickValue(fi.collaborateur_lieu_naissance, fi.lieu_naissance, fi.collaborateur?.lieu_naissance);

  const adresseTrav = pickValue(fi.collaborateur_adresse, fi.adresse, fi.collaborateur?.adresse);

  const cnssTrav = pickValue(fi.collaborateur_cnss, fi.numero_cnss, fi.cnss, fi.collaborateur?.cnss);

  const qualifs = pickValue(fi.qualifications, fi.qualifications_professionnelles);

  const dateRecrut = pickValue(fi.collaborateur_date_recrutement, fi.date_recrutement);

  const posteTrav = pickValue(fi.collaborateur_poste, fi.poste, fi.collaborateur?.poste);



  const aptitude = pickValue(fi.aptitude, fi.avis_aptitude);

  const precision = pickValue(fi.precision_aptitude, fi.precision, fi.precisionAptitude);



  const medecin = pickValue(
    form?.medecin_connecte_nom,
    form?.medecinConnecteNom,
    fi.medecin_nom,
    fi.medecin,
    cfg.medecinNom,
  );



  const aptePoste = aptitude === 'APTE_AU_POSTE';

  const apteAmenagement = aptitude === 'APTE_AMENAGEMENT_POSTE';

  const apteChangement = aptitude === 'INAPTE_DEFINITIF_MEME_POSTE';

  const inapteTemp = aptitude === 'INAPTE_TEMPORAIRE';

  const inapteDef = aptitude === 'INAPTE_DEFINITIF_ENTREPRISE';



  const aptePostePrecis = pickValue(precision, posteTrav);



  const age = pickValue(fi.collaborateur_age, ageFromDate(dateNaiss));

  const dn = fmtDate(dateNaiss);

  const dateLieuNaiss = [dn, lieuNaiss ? `à ${lieuNaiss}` : '', age ? `(${age} ans)` : ''].filter(Boolean).join(' ');



  const formEx = form?.examens_ulterieurs;

  const ficheEx = fi.examens_ulterieurs ?? fi.examensUlterieurs;

  const exams = Array.isArray(formEx)

    ? formEx

    : Array.isArray(ficheEx)

      ? ficheEx

      : [];



  const col = '#000';



  function aptRow(checked, labelAfterBox, dottedValue) {

    return `<div class="aptline"><span class="aptbox">${check(checked)}</span><span class="aptlbl">${labelAfterBox}</span><span class="apttrack"><span class="aptval">${esc(dottedValue)}</span></span></div>`;

  }



  const tableRows = Array.from({ length: 9 })

    .map((_, idx) => {

      const row = exams[idx] || {};

      const p = normalizeBool(row.p);

      const r = normalizeBool(row.r);

      const s = normalizeBool(row.s);

      const dateNature = pickValue(row.date_nature, row.dateNature);

      const concl = pickValue(row.conclusion, row.conclusions);

      const med = pickValue(row.medecin, row.signature);

      const typeHint = [p && 'P', r && 'R', s && 'S'].filter(Boolean).join(' ');

      const leftText = [typeHint, dateNature].filter(Boolean).join(' · ');

      return `<tr>

        <td class="c1"><div class="tbl-r1"><span class="tbl-chk">${check(p || r || s)}</span><span class="tbl-dots">${esc(leftText)}</span></div></td>

        <td class="c2"><div class="concline">${esc(concl)}</div><div class="concline concline2"></div></td>

        <td class="c3"><div class="sigcell">${esc(med)}</div></td>

      </tr>`;

    })

    .join('');



  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>

<title>Annexe n° 3 — Fiche d'aptitude au travail</title>

<style>

  @page { size: A4 portrait; margin: 7mm 9mm 7mm 9mm; }

  * { box-sizing: border-box; }

  body {

    font-family: "Times New Roman", Times, serif;

    color: ${col};

    font-size: 11pt;

    line-height: 1.36;

    margin: 0;

  }

  /* Une feuille = hauteur utile A4 moins marges @page — pied de page en bas */

  .page-shell {

    display: flex;

    flex-direction: column;

    min-height: 274mm;

  }

  .page-shell--p2 {

    min-height: 276mm;

  }

  /* Page 1 : remplir l’espace au-dessus du pied de page, signature bas de contenu */

  .p1 {

    display: flex;

    flex-direction: column;

    flex: 1 1 auto;

    min-height: 0;

  }

  .jo-footer {

    flex-shrink: 0;

    width: 100%;

    font-size: 9.5pt;

    line-height: 1.2;

    margin-top: 5px;

    padding-top: 0;

  }

  .jo-footer-line {

    border-top: 1px solid ${col};

    width: 100%;

    margin: 0 0 5px;

  }

  .jo-footer-row {

    display: flex;

    justify-content: space-between;

    align-items: baseline;

    width: 100%;

    gap: 8px;

  }

  .jo-foot-l {

    flex: 0 0 auto;

    text-align: left;

  }

  .jo-foot-c {

    flex: 1 1 auto;

    text-align: center;

    padding: 0 6px;

  }

  .jo-foot-r {

    flex: 0 0 auto;

    text-align: right;

    white-space: nowrap;

  }

  .hdr {

    text-align: center;

    margin-bottom: 11px;

    flex-shrink: 0;

  }

  .hdr-ann {

    font-weight: 700;

    font-size: 12pt;

    margin: 0 0 3px;

  }

  .hdr-title {

    font-weight: 700;

    font-size: 14pt;

    margin: 0 0 8px;

    text-transform: uppercase;

    letter-spacing: 0.02em;

  }

  .hdr-legal {

    font-weight: 400;

    font-size: 10pt;

    line-height: 1.34;

    max-width: 92%;

    margin: 0 auto;

  }

  .p1 > .sec:not(.sec3-wrap) {

    flex-shrink: 0;

  }

  .p1 > header + .sec:not(.sec3-wrap) {

    margin-top: 4px;

  }

  .sec {

    margin-top: 15px;

  }

  .sec-h {

    font-weight: 700;

    font-size: 11.5pt;

    margin: 0 0 8px;

    text-transform: uppercase;

  }



  .dline {

    display: flex;

    align-items: flex-end;

    width: 100%;

    margin-bottom: 9px;

  }

  .dline-lbl {

    flex-shrink: 0;

    padding-right: 3px;

  }

  .dline-track {

    flex: 1;

    border-bottom: 1px dotted ${col};

    min-height: 16px;

    text-align: left;

  }

  .dline-val {

    display: block;

    padding: 0 2px 1px;

  }



  .sec3-intro {

    margin: 5px 0 9px;

    text-align: justify;

  }

  .sec3-med-inline {

    font-weight: 700;

    padding: 0 3px;

  }

  .sec3-wrap {

    display: flex;

    flex-direction: column;

    flex: 0 0 auto;

    min-height: 0;

  }

  .aptline {

    display: flex;

    align-items: flex-end;

    flex-wrap: wrap;

    width: 100%;

    margin: 8px 0 10px;

    gap: 6px;

  }

  .aptbox {

    flex-shrink: 0;

    font-family: "Times New Roman", Times, serif;

    font-size: 12pt;

    line-height: 1;

  }

  .aptlbl {

    flex: 0 1 auto;

  }

  .apttrack {

    flex: 1 1 100px;

    border-bottom: 1px dotted ${col};

    min-height: 16px;

    min-width: 40px;

  }

  .aptval {

    display: block;

    padding: 0 2px 1px;

  }



  .amen-extra {

    margin: 5px 0 10px 19px;

  }



  .sig-block {

    margin-top: 10px;

    margin-bottom: 0;

    text-align: right;

    font-weight: 400;

    font-size: 11pt;

    flex-shrink: 0;

  }

  .sig-block:last-child {

    margin-bottom: 10mm;

  }

  .sig-mednom {

    text-align: right;

    margin-top: 4px;

    margin-bottom: 10mm;

    font-size: 10.5pt;

    flex-shrink: 0;

  }



  .pagebreak {

    page-break-before: always;

    break-before: page;

  }



  .exam-wrap {

    margin-top: 4px;

  }

  .page-shell--p2 .exam-wrap--p2 {

    flex: 1 1 auto;

    display: flex;

    flex-direction: column;

    min-height: 0;

    margin-top: 0;

  }

  .exam-cap {

    font-weight: 700;

    font-size: 10.5pt;

    margin-bottom: 4px;

    text-transform: uppercase;

  }

  .page-shell--p2 .exam-cap {

    font-size: 10.5pt;

    margin-bottom: 4px;

  }

  .exam-table {

    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;

    font-size: 10pt;

  }

  .page-shell--p2 .exam-table {

    flex: 1 1 auto;

    font-size: 10pt;

  }

  .page-shell--p2 .exam-table th,

  .page-shell--p2 .exam-table td {

    padding: 3px 4px;

    font-size: 10pt;

  }

  .page-shell--p2 .tbl-chk {

    font-size: 11pt;

  }

  .page-shell--p2 .exam-table .th-prs {

    border: 1px solid ${col};

    padding: 0 2px;

    font-size: 8.5pt;

  }

  .exam-table th,

  .exam-table td {

    border: 1px solid ${col};

    padding: 4px 5px;

    vertical-align: top;

  }

  .exam-table th {

    font-weight: 700;

    text-align: center;

    line-height: 1.15;

  }

  .exam-table tbody tr {

    height: 20mm;

  }

  .page-shell--p2 .exam-table tbody tr {

    height: 18mm;

  }

  .c1 { width: 30%; }

  .c2 { width: 42%; }

  .c3 { width: 28%; }

  .tbl-r1 {

    display: flex;

    align-items: flex-end;

    gap: 6px;

    width: 100%;

  }

  .tbl-chk {

    flex-shrink: 0;

    font-size: 12pt;

    line-height: 1;

  }

  .tbl-dots {

    flex: 1;

    border-bottom: 1px dotted ${col};

    min-height: 14px;

    white-space: pre-wrap;

    word-break: break-word;

  }

  .page-shell--p2 .tbl-dots {

    min-height: 11px;

  }

  .concline {

    min-height: 13px;

    margin-bottom: 2px;

    white-space: pre-wrap;

    border-bottom: 1px dotted ${col};

    padding-bottom: 1px;

  }

  .concline2 {

    min-height: 12px;

  }

  .sigcell {

    min-height: 0;

    white-space: pre-wrap;

    border: none;

  }

  /* Colonne signature : pas de lignes pointillées décoratives au-dessus du nom */

  .page-shell--p2 .c3 .sigcell {

    padding-top: 2px;

    min-height: 0;

    border: none;

    border-bottom: none;

  }

</style></head><body>



<div class="page-shell page-shell--p1">

<div class="p1">

  <header class="hdr">

    <p class="hdr-ann">Annexe n° 3</p>

    <p class="hdr-title">FICHE D&#8217;APTITUDE AU TRAVAIL</p>

    <p class="hdr-legal">En application des dispositions de l'article 11 du Décret n° 2000-1985 du 12 septembre 2000 portant organisation et fonctionnement des services de médecine du travail</p>

  </header>



  <section class="sec">

    <h2 class="sec-h">1- L&#8217;ENTREPRISE</h2>

    ${dottedLine('Raison sociale :', entrepriseRaison)}

    ${dottedLine('Adresse :', entrepriseAdresse)}

    ${dottedLine("Nature d'activité :", entrepriseActivite)}

    ${dottedLine("N° d'affiliation à la caisse nationale de", entrepriseCnss)}

  </section>



  <section class="sec">

    <h2 class="sec-h">2- LE TRAVAILLEUR</h2>

    ${dottedLine('Nom et prénom :', nomPrenom)}

    ${dottedLine('Date et lieu de naissance :', dateLieuNaiss)}

    ${dottedLine('Adresse :', adresseTrav)}

    ${dottedLine("N° d'immatriculation à la caisse nationale", cnssTrav)}

    ${dottedLine('Qualifications professionnelles :', qualifs)}

    ${dottedBlankLine()}

    ${dottedLine('Date de recrutement :', fmtDate(dateRecrut))}

    ${dottedLine('Poste du travail :', posteTrav)}

  </section>



  <section class="sec sec3-wrap">

    <h2 class="sec-h">3- EXAMEN MEDICAL A L&#8217;EMBAUCHE</h2>

    <p class="sec3-intro">Je soussigné(e) <span class="sec3-med-inline">${medecin ? esc(medecin) : '…………………………'}</span> médecin du travail, certifie que le travailleur susnommé est :</p>

    ${aptRow(aptePoste, 'Apte au poste (à préciser) :', aptePoste ? aptePostePrecis : '')}

    ${aptRow(apteAmenagement, 'Apte avec aménagement du poste (à préciser):', apteAmenagement ? precision : '')}

    <div class="amen-extra">${dottedBlankLine()}</div>

    ${aptRow(apteChangement, 'Apte après changement du poste (à préciser):', apteChangement ? precision : '')}

    ${aptRow(inapteTemp, 'Inapte temporaire au poste (préciser la période):', inapteTemp ? precision : '')}

    ${aptRow(inapteDef, "Inapte définitif à tout poste du travail dans l'entreprise:", '')}

    <div class="sig-block">Signature du médecin du travail</div>

    ${medecin ? `<div class="sig-mednom">${esc(medecin)}</div>` : ''}

  </section>

</div>
${joFooter(2221)}
</div>

<div class="page-shell page-shell--p2 pagebreak">

<div class="exam-wrap exam-wrap--p2">

  <h2 class="exam-cap">4- EXAMENS MEDICAUX ULTERIEURS</h2>

  <table class="exam-table">

    <thead>

      <tr>

        <th>Date et Nature de l'examen médical ( <span class="th-prs">P</span> périodique,

          <span class="th-prs">R</span> de reprise du travail,

          <span class="th-prs">S</span> spontané )</th>

        <th>Conclusions en matière d'aptitude au travail (à préciser)</th>

        <th>Nom, prénom et Signature du médecin du travail</th>

      </tr>

    </thead>

    <tbody>${tableRows}</tbody>

  </table>

</div>
${joFooter(2222)}
</div>

</body></html>`;

}



export default function PrintFicheAptitudeMateur({ fiche, siteConfig, form, label, title }) {

  const { user } = useAuth();

  const btnLabel = label || "Imprimer fiche d'aptitude";

  const btnTitle = title || btnLabel;



  function handlePrint() {

    const med = medecinDisplayNameFromUser(user);

    const merged = med ? { ...form, medecin_connecte_nom: med } : form;

    printHTML(buildFicheAptitudeMaturHTML(fiche, siteConfig, merged));

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

        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 012 2h-2"/>

        <rect x="6" y="14" width="12" height="8"/>

      </svg>

      {btnLabel}

    </button>

  );

}

