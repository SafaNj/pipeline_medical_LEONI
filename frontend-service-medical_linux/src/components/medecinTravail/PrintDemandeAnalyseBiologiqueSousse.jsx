import { printHTML } from '../../utils/printHelper';
import { primaryActionButtonStyle, primaryActionBtnEnter, primaryActionBtnLeave } from './primaryActionButtonStyle';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { getNextPrintSequence } from './printSequence';
import { SOUSSE_GMTGS_LOGO_PNG as SOUSSE_GMTGS_LOGO, SOUSSE_CERT_LOGO_JPG as SOUSSE_CERT_LOGO } from './soussePrintAssets';

const ANALYSES = [
  { key: 'glycemie', label: 'Glycemie' },
  { key: 'creatinine', label: 'Creatinine' },
  { key: 'nfs', label: 'NFS' },
  { key: 'vs', label: 'VS' },
  { key: 'transaminases', label: 'Transaminases' },
  { key: 'acide_urique', label: 'Acide urique' },
  { key: 'triglycerides', label: 'Triglycerides' },
  { key: 'cholesterol', label: 'Cholesterol' },
  { key: 'copro_parasitologique', label: 'Copro-parasitologique' },
];

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br/>');
}

function fmtDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
}

function pickValue(...values) {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === null || value === undefined) continue;
    if (String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function buildHtml(fiche, form, siteConfig) {
  const fi = fiche || {};
  const bi = form || {};
  const cfg = siteConfig || getSitePrintConfig(fi, bi);
  const _sequence = bi.numero_labo || getNextPrintSequence({
    formCode: 'FOR-AMT-07',
    templateKey: cfg.templateKey,
    siteId: fi.site_id || cfg.site_id,
    prefix: 'FOR-AMT-07',
  });

  const nomComplet = pickValue(fi.collaborateur_nom, fi.nom_prenom, bi.nom_prenom, bi.collaborateur_nom);
  const dateNaissance = pickValue(fi.collaborateur_date_naissance, bi.date_naissance);
  const entreprise = pickValue(fi.raison_sociale, fi.entreprise, bi.entreprise, 'Leoni Massadine');
  const profession = pickValue(fi.collaborateur_poste, fi.poste, bi.profession, bi.poste);
  const matricule = pickValue(fi.collaborateur_matricule, fi.matricule, bi.matricule);
  const dateDemande = pickValue(bi.date_demande, fi.date_visite, new Date());
  const autreAtcd = pickValue(
    bi.autre_atcd,
    fi.autre_atcd,
    fi.demandes_bilan?.[0]?.autre_atcd
  );

  const atcd = {
    hta: !!bi.hta,
    anemie: !!bi.anemie,
    hepatite: !!bi.hepatite,
    autre: !!bi.autre || !!autreAtcd,
    diabete: !!bi.diabete,
    dyslipidemie: !!bi.dyslipidemie,
    goutte: !!bi.goutte,
  };
  const autreAtcdLabel =
    autreAtcd && String(autreAtcd).trim() !== '' && String(autreAtcd).trim().toUpperCase() !== 'OUI'
      ? `Autre : ${autreAtcd}`
      : 'Autre............';

  const anticoagulants = String(bi.anticoagulants || '').toLowerCase();
  const anticoagulantsOui = anticoagulants === 'oui' || bi.anticoagulants_oui === true || bi.anticoagulants === true;
  const anticoagulantsNon = anticoagulants === 'non' || bi.anticoagulants_non === true;

  const autresRisquesTextRaw = pickValue(
    typeof bi.autres_risques === 'string' ? bi.autres_risques : '',
    typeof fi.autres_risques === 'string' ? fi.autres_risques : '',
    typeof fi.demandes_bilan?.[0]?.autres_risques === 'string' ? fi.demandes_bilan[0].autres_risques : '',
  );
  const autresRisquesText = String(autresRisquesTextRaw || '').trim();
  const autresRisquesChecked = autresRisquesText !== '' || bi.autres_risques === true;
  const autresRisquesLabel = autresRisquesText ? `Autres risques : ${autresRisquesText}` : 'Autres risques..............';

  const leftReasons = [
    ['Chimique', bi.chimique],
    ['Infectieux', bi.infectieux],
    ['Chauffeur', bi.chauffeur],
    ['Travail posté / Nuit', bi.travail_poste_nuit],
    [autresRisquesLabel, autresRisquesChecked],
  ];

  const rightReasons = [
    ['Dépistage..............', bi.depistage],
    ['Suivi des pathologies chroniques..............', bi.suivi_pathologies_chroniques],
  ];

  const analyses = [
    ['NFS', bi.nfs],
    ['Triglycérides', bi.triglycerides],
    ['Transaminases', bi.transaminases],
    ['Créatininémie', bi.creatinine],
    ['Cholestérol', bi.cholesterol],
    ['Acide urique', bi.acide_urique],
    ['Glycémie', bi.glycemie],
    ['LDL/HDL Cholestrol', bi.ldl_hdl_cholesterol],
    ['VS', bi.vs],
  ];

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>FOR-AMT-07</title>
  <style>
  @page{size:A4 portrait;margin:10mm 10mm 10mm 10mm;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;color:#000;font-size:11pt;line-height:1.35;background:white;}
  .page{width:100%;min-height:275mm;display:flex;flex-direction:column;}

  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
  .header-left{display:flex;align-items:center;gap:6px;}
  .logo-seal{width:72px;height:72px;object-fit:contain;filter:none;}
  .logo-text-block{display:flex;flex-direction:column;}
  .gmtgs-text{font-weight:900;font-size:20pt;letter-spacing:2px;line-height:1;}
  .gmtgs-sub{font-size:8pt;font-weight:700;margin-top:3px;}
  .header-center{text-align:center;flex:1;padding:0 15px;}
  .title{font-size:12pt;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;}
  .doc-box{border:2px solid #000;padding:5px 9px;font-size:9pt;font-weight:700;line-height:1.55;text-align:left;white-space:nowrap;}

  .info-section{margin-bottom:8px;}
  .line{display:flex;align-items:baseline;gap:6px;margin:7px 0;}
  .lbl{font-weight:700;white-space:nowrap;font-size:10pt;}
  .dotline{border-bottom:1px solid #000;flex:1;min-height:18px;}
  .dotline-short{border-bottom:1px solid #000;min-width:130px;margin-left:4px;}

  .atcd-section{margin:8px 0;}
  .atcd-title{font-weight:700;font-size:10.5pt;margin-bottom:5px;}
  .atcd-row{display:flex;align-items:center;gap:20px;margin-bottom:5px;}

  .anticoa-line{display:flex;align-items:center;gap:10px;margin:8px 0;}

  .cb-item{display:flex;align-items:center;gap:5px;font-size:10.2pt;}
  .cb{width:13px;height:13px;border:1.5px solid #000;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;font-weight:900;flex-shrink:0;}

  .raison-title{font-weight:700;font-size:10pt;margin-bottom:3px;}
  .raison-wrap{border:1.5px solid #000;display:flex;margin:10px 0 12px;}
  .raison-col{flex:1;padding:8px 10px;}
  .raison-col:first-child{border-right:1.5px solid #000;}
  .raison-col-title{font-weight:700;margin-bottom:6px;font-size:10pt;}
  .raison-item{display:flex;align-items:center;gap:5px;font-size:10pt;margin:5px 0;}

  .analyses-table{width:100%;border-collapse:collapse;margin:10px 0 12px;}
  .analyses-table td{padding:6px 8px;font-size:10.2pt;vertical-align:middle;width:33.33%;}

  .sign-row{display:flex;justify-content:space-between;align-items:flex-end;margin:22px 0 8px;}
  .sign-date{font-weight:700;font-size:10pt;}
  .sign-medecin{font-style:italic;font-weight:700;font-size:10pt;}

  .note-sms{font-size:9.5pt;font-weight:700;margin:6px 0 12px;}

  .bottom-footer{border-top:2px solid #000;padding-top:10px;display:flex;align-items:center;gap:10px;margin-top:auto;}
  .cert-logo{width:70px;height:auto;object-fit:contain;filter:none;}
  .footer-addr{text-align:center;flex:1;font-size:9pt;font-weight:700;line-height:1.45;}

  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  </style></head><body>
  <div class="page">

    <div class="header">
      <div class="header-left">
        <img class="logo-seal" src="${SOUSSE_GMTGS_LOGO}" alt="Logo GMTGS"/>
      </div>
      <div class="header-center">
        <div class="title">DEMANDE D'ANALYSES BIOLOGIQUES</div>
      </div>
      <div class="doc-box">
        <div>FOR-AMT-07</div>
        <div>Edition : 04</div>
        <div>Juillet 2024</div>
        <div>Page 1 sur 1</div>
      </div>
    </div>

    <div class="info-section">
      <div class="line">
        <span class="lbl">- Nom et Prénom :</span>
        <span class="dotline">${esc(nomComplet)}</span>
      </div>
      <div class="line">
        <span class="lbl">- Date de naissance :</span>
        <span class="dotline">${esc(fmtDate(dateNaissance))}</span>
      </div>
      <div class="line">
        <span class="lbl">- Entreprise :</span>
        <span class="dotline">${esc(entreprise)}</span>
      </div>
      <div class="line">
        <span class="lbl">- Profession/poste :</span>
        <span class="dotline">${esc(profession)}</span>
        <span class="lbl" style="white-space:nowrap;margin-left:8px;">Matricule :</span>
        <span class="dotline-short">${esc(matricule)}</span>
      </div>
    </div>

    <div class="atcd-section">
      <div class="atcd-title">- ATCD médicaux :</div>
      <div class="atcd-row">
        <div class="cb-item"><div class="cb">${atcd.hta ? 'X' : ''}</div><span>HTA</span></div>
        <div class="cb-item"><div class="cb">${atcd.anemie ? 'X' : ''}</div><span>Anémie</span></div>
        <div class="cb-item"><div class="cb">${atcd.hepatite ? 'X' : ''}</div><span>Hépatite</span></div>
        <div class="cb-item"><div class="cb">${atcd.autre ? 'X' : ''}</div><span>${esc(autreAtcdLabel)}</span></div>
      </div>
      <div class="atcd-row">
        <div class="cb-item"><div class="cb">${atcd.diabete ? 'X' : ''}</div><span>Diabète</span></div>
        <div class="cb-item"><div class="cb">${atcd.dyslipidemie ? 'X' : ''}</div><span>Dyslipidémie</span></div>
        <div class="cb-item"><div class="cb">${atcd.goutte ? 'X' : ''}</div><span>Goutte</span></div>
      </div>
    </div>

    <div class="anticoa-line">
      <span class="lbl">- Prise de médicaments anticoagulants :</span>
      <div class="cb-item" style="margin-left:30px;"><div class="cb">${anticoagulantsOui ? 'X' : ''}</div><span>Oui</span></div>
      <div class="cb-item" style="margin-left:40px;"><div class="cb">${anticoagulantsNon ? 'X' : ''}</div><span>Non</span></div>
    </div>

    <div class="raison-title">Raison de la demande:</div>

    <div class="raison-wrap">
      <div class="raison-col">
        <div class="raison-col-title">❖ Dans le cadre de la SMS* :</div>
        <div class="raison-item"><div class="cb">${leftReasons[0][1] ? 'X' : ''}</div><span>Chimique</span></div>
        <div class="raison-item"><div class="cb">${leftReasons[1][1] ? 'X' : ''}</div><span>Infectieux</span></div>
        <div class="raison-item"><div class="cb">${leftReasons[2][1] ? 'X' : ''}</div><span>Chauffeur</span></div>
        <div class="raison-item"><div class="cb">${leftReasons[3][1] ? 'X' : ''}</div><span>Travail posté / Nuit</span></div>
        <div class="raison-item"><div class="cb">${leftReasons[4][1] ? 'X' : ''}</div><span>${esc(leftReasons[4][0])}</span></div>
      </div>
      <div class="raison-col">
        <div class="raison-col-title">❖ Dans le cadre général :</div>
        <div class="raison-item"><div class="cb">${rightReasons[0][1] ? 'X' : ''}</div><span>Dépistage..........................................</span></div>
        <div class="raison-item"><div class="cb">${rightReasons[1][1] ? 'X' : ''}</div><span>Suivi des pathologies chroniques...................</span></div>
      </div>
    </div>

    <table class="analyses-table">
      <tr>
        <td><div class="cb-item"><div class="cb">${analyses[0][1] ? 'X' : ''}</div><span>${esc(analyses[0][0])}</span></div></td>
        <td><div class="cb-item"><div class="cb">${analyses[1][1] ? 'X' : ''}</div><span>${esc(analyses[1][0])}</span></div></td>
        <td><div class="cb-item"><div class="cb">${analyses[2][1] ? 'X' : ''}</div><span>${esc(analyses[2][0])}</span></div></td>
      </tr>
      <tr>
        <td><div class="cb-item"><div class="cb">${analyses[3][1] ? 'X' : ''}</div><span>${esc(analyses[3][0])}</span></div></td>
        <td><div class="cb-item"><div class="cb">${analyses[4][1] ? 'X' : ''}</div><span>${esc(analyses[4][0])}</span></div></td>
        <td><div class="cb-item"><div class="cb">${analyses[5][1] ? 'X' : ''}</div><span>${esc(analyses[5][0])}</span></div></td>
      </tr>
      <tr>
        <td><div class="cb-item"><div class="cb">${analyses[6][1] ? 'X' : ''}</div><span>${esc(analyses[6][0])}</span></div></td>
        <td><div class="cb-item"><div class="cb">${analyses[7][1] ? 'X' : ''}</div><span>${esc(analyses[7][0])}</span></div></td>
        <td><div class="cb-item"><div class="cb">${analyses[8][1] ? 'X' : ''}</div><span>${esc(analyses[8][0])}</span></div></td>
      </tr>
    </table>

    <div class="sign-row">
      <div class="sign-date">Date : ${esc(fmtDate(dateDemande))}</div>
      <div class="sign-medecin">Cachet et Signature du Médecin</div>
    </div>

    <div class="note-sms">*SMS: Surveillance Médicale Spéciale.</div>

    <div class="bottom-footer">
      <img class="cert-logo" src="${SOUSSE_CERT_LOGO}" alt="Certification ISO 9001"/>
      <div class="footer-addr">
        <strong>Groupement de Médecine du Travail du Gouvernorat de Sousse</strong><br/>
        Lotissement Monoprix, en face de EPI School, Kalaa Sghira 4021<br/>
        Tél : 73 820 195 - 73 820 196 - 73 820 197 - Fax : 73 820 194<br/>
        E-mail : gmtgs.technique@gmail.com
      </div>
    </div>

  </div>
  </body></html>`;
}

export default function PrintDemandeAnalyseBiologiqueSousse({ fiche, form, label, title }) {
  function handlePrint() {
    const siteConfig = getSitePrintConfig(fiche, form);
    const html = buildHtml(fiche, form, siteConfig);
    printHTML(html);
  }

  return (
    <button
      onClick={handlePrint}
      title={title || 'Imprimer FOR-AMT-07'}
      style={primaryActionButtonStyle()}
      onMouseEnter={primaryActionBtnEnter}
      onMouseLeave={primaryActionBtnLeave}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      {label || 'Imprimer FOR-AMT-07'}
    </button>
  );
}