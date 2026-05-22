// src/components/infirmier/PrintAT.jsx
// Style professionnel LEONI — en-tête avec logo, tons gris sobre
// Props : accident {obj}, infirmiereNom {string}, currentUser {obj}

import { printHTML } from '../../utils/printHelper';

const CRITICITE_LABELS_PRINT = {
  FAIBLE: 'Faible',
  MODEREE: 'Modérée',
  GRAVE: 'Grave',
  TRES_GRAVE: 'Très grave',
};
const CRITICITE_LEGACY_PRINT = {
  Faible: 'FAIBLE',
  'Modérée': 'MODEREE',
  Modérée: 'MODEREE',
  Grave: 'GRAVE',
  'Très grave': 'TRES_GRAVE',
};
function normalizeCriticitePrint(v) {
  if (v == null || v === '') return '';
  const s = String(v).trim();
  if (CRITICITE_LABELS_PRINT[s]) return s;
  return CRITICITE_LEGACY_PRINT[s] ?? s;
}
function criticiteLibellePrint(v) {
  const code = normalizeCriticitePrint(v);
  return (code && CRITICITE_LABELS_PRINT[code]) || v || '—';
}
/** Badge en-tête (majuscules, aligné ancien rendu). */
function criticiteBadgeUpperPrint(v) {
  const code = normalizeCriticitePrint(v);
  const m = { FAIBLE: 'FAIBLE', MODEREE: 'MODÉRÉE', GRAVE: 'GRAVE', TRES_GRAVE: 'TRÈS GRAVE' };
  return m[code] || String(v || '').toUpperCase();
}

function buildAThtml(a, nomInfirmier) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const val = (v) => (v !== null && v !== undefined && String(v).trim() !== '') ? String(v) : '—';
  const today = fmt(new Date());
  const now   = new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

  const reposTotal = a.total_jours_perdus ?? ((a.repos_initial || 0) + (a.prolongation || 0));

  const cell = (label, value, colspan) =>
    `<td colspan="${colspan || 1}" style="padding:6px 8px;border:1px solid #ccc;vertical-align:top;background:white;">
      <div style="font-size:6.8pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;">${label}</div>
      <div style="font-size:9.5pt;color:#111;font-weight:600;min-height:14px;line-height:1.4;">${val(value)}</div>
    </td>`;

  const sectionHeader = (title, num) =>
    `<tr><td colspan="4" style="background:#9ca3af;color:white;font-weight:800;font-size:8pt;
      text-transform:uppercase;letter-spacing:1.2px;padding:5px 9px;border:1px solid #9ca3af;">
      <span style="opacity:.55;margin-right:7px;">${num}</span>${title}
    </td></tr>`;

  const checkBox = (checked) =>
    `<span style="display:inline-block;width:11px;height:11px;border:1.5px solid #555;
      background:${checked ? '#374151' : 'white'};margin-right:5px;vertical-align:middle;
      text-align:center;line-height:10px;color:white;font-size:8pt;">${checked ? '&#10003;' : ''}</span>`;

  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"/>
<title>AT — ${val(a.collaborateur_nom)}</title>
<style>
  @page { size:A4 portrait; margin:0; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:9.5pt; color:#111; background:white; }
  .page { padding:12mm 13mm 12mm 13mm; min-height:297mm; display:flex; flex-direction:column; }
  table { width:100%; border-collapse:collapse; margin-bottom:6px; }
  td { border:1px solid #ccc; }
</style>
</head><body>
<div class="page">

  <!-- ══ EN-TÊTE ══ -->
  <div style="display:flex;align-items:stretch;margin-bottom:10px;border:1.5px solid #d1d5db;border-radius:4px;overflow:hidden;">

    <!-- Logo LEONI -->
    <div style="background:#f1f3f5;padding:10px 18px;display:flex;align-items:center;justify-content:center;min-width:120px;flex-shrink:0;border-right:1px solid #d1d5db;">
      <img src="https://i.imgur.com/P8t9SW7.png" style="height:42px;width:auto;object-fit:contain;" alt="LEONI"/>
    </div>


    <!-- Titre document -->
    <div style="flex:1;padding:10px 16px;display:flex;flex-direction:column;justify-content:center;background:#f8f9fa;">
      <div style="font-size:6.5pt;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;">Service Médical — Infirmerie d'Entreprise</div>
      <div style="font-size:14pt;font-weight:900;color:#1a2b4a;letter-spacing:.5px;text-transform:uppercase;line-height:1.1;">Déclaration d'Accident du Travail</div>
      
    </div>

    <!-- Bloc date / criticité -->
    <div style="padding:10px 14px;background:#f1f3f5;border-left:1px solid #d1d5db;display:flex;flex-direction:column;justify-content:center;text-align:right;min-width:140px;flex-shrink:0;">
      <div style="font-size:7pt;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Date d'accident</div>
      <div style="font-size:10.5pt;font-weight:800;color:#1a2b4a;margin:2px 0;">${fmt(a.date_accident)}${a.heure_accident ? '<br><span style=\"font-size:8.5pt;font-weight:600;\">' + a.heure_accident + '</span>' : ''}</div>
      ${a.criticite ? `<div style="margin-top:5px;display:inline-block;background:#9ca3af;color:white;font-size:7pt;font-weight:800;padding:2px 8px;border-radius:2px;letter-spacing:.8px;">${criticiteBadgeUpperPrint(a.criticite)}</div>` : ''}
    </div>

  </div>

  <!-- ══ BARRE INFO ══ -->
  <div style="display:flex;justify-content:space-between;background:#f1f3f5;border:1px solid #d1d5db;
    padding:4px 10px;margin-bottom:8px;font-size:7.5pt;color:#374151;">
    <span>Édité le <strong>${today}</strong> à <strong>${now}</strong></span>
    <span>Criticité : <strong>${criticiteLibellePrint(a.criticite)}</strong></span>
    <span>Total jours perdus : <strong>${reposTotal} jour(s)</strong></span>
    <span style="color:#9ca3af;font-style:italic;">Document confidentiel</span>
  </div>

  <!-- ══ 1. IDENTITÉ ══ -->
  <table>
    ${sectionHeader("Identification du collaborateur accidenté", "01")}
    <tr>
      ${cell('Nom et Prénom', a.collaborateur_nom, 2)}
      ${cell('Matricule', a.collaborateur_matricule)}
      ${cell('Sexe', a.collaborateur_sexe)}
    </tr>
    <tr>
      ${cell('Poste / Fonction', a.collaborateur_poste, 2)}
      ${cell('Département / Service', a.collaborateur_department)}
      ${cell('Téléphone', a.collaborateur_telephone)}
    </tr>
    <tr>
      ${cell('Plant section', a.plant_section)}
      ${cell('Département', a.collaborateur_department)}
      ${cell('Date d\'embauche', fmt(a.collaborateur_date_embauche))}
    </tr>
  </table>

  <!-- ══ 2. CIRCONSTANCES ══ -->
  <table>
    ${sectionHeader("Circonstances de l'accident", "02")}
    <tr>
      ${cell('Date', fmt(a.date_accident))}
      ${cell('Heure', a.heure_accident || '—')}
      ${cell('Type / Accident du trajet', a.type_accident)}
      ${cell('Lieu précis', a.lieu_accident)}
    </tr>
    <tr>
      <td colspan="4" style="padding:6px 8px;border:1px solid #ccc;background:white;">
        <div style="font-size:6.8pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">Description des circonstances</div>
        <div style="font-size:9pt;min-height:34px;line-height:1.65;color:#111;">${val(a.description)}</div>
      </td>
    </tr>
    <tr>
      ${cell('Agent matériel causal', a.agent_materiel, 2)}
      ${cell('Témoins', a.temoins, 2)}
    </tr>
  </table>

  <!-- ══ 3. LÉSION & CAUSE ══ -->
  <table>
    ${sectionHeader("Nature de la lésion et cause", "03")}
    <tr>
      ${cell('Siège de la lésion', a.siege_lesion)}
      ${cell('Nature de la lésion', a.nature_lesion)}
      ${cell('Cause directe', a.cause_accident)}
      ${cell('Criticité', criticiteLibellePrint(a.criticite))}
    </tr>
  </table>

  <!-- ══ 4. ARRÊT & SUIVI ══ -->
  <table>
    ${sectionHeader("Arrêt de travail et suivi médical", "04")}
    <tr>
      ${cell('Repos initial (jours)', a.repos_initial ?? 0)}
      ${cell('Prolongation (jours)', a.prolongation ?? 0)}
      ${cell('Total jours perdus', reposTotal)}
      ${cell('Reprise médecin du travail', fmt(a.reprise_medecin_travail))}
    </tr>
  </table>

  <!-- ══ 5. DÉCLARATION & TRANSPORT ══ -->
  <table>
    ${sectionHeader("Déclaration et transport", "05")}
    <tr>
      ${cell('N°01 / CNAM', a.num_cnam)}
      ${cell('Date déclaration service médical', fmt(a.date_declaration_service_medical))}
      ${cell('Date sortie déclaration', fmt(a.date_sortie_declaration))}
      ${cell('Chauffeur / Transport', a.chauffeur_sortie)}
    </tr>
    <tr>
      <td colspan="4" style="padding:7px 9px;border:1px solid #ccc;background:white;">
        <div style="font-size:6.8pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Reporting obligatoire</div>
        <div style="display:flex;gap:32px;font-size:9pt;">
          <span>${checkBox(a.reporting_interne)} Reporting interne</span>
          <span>${checkBox(a.reporting_wsd)} Reporting WSD</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- ══ INFIRMIER ══ -->
  <div style="display:flex;align-items:center;gap:10px;background:#f8f9fa;border:1px solid #d1d5db;
    border-radius:4px;padding:7px 12px;margin-top:4px;">
    <div style="font-size:6.8pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;flex-shrink:0;">Déclaré par l'infirmier(e) :</div>
    <div style="font-size:10pt;font-weight:800;color:#1a2b4a;letter-spacing:.3px;">${nomInfirmier}</div>
  </div>

  <!-- ══ PIED DE PAGE ══ -->
  <div style="margin-top:auto;padding-top:8px;border-top:1.5px solid #d1d5db;
    display:flex;justify-content:space-between;align-items:center;font-size:7pt;color:#9ca3af;">
    <div>
      <div style="font-weight:700;color:#6b7280;margin-bottom:1px;">LEONI — Service Médical</div>
      <div>Généré le ${today} à ${now}</div>
    </div>
    <div style="text-align:center;color:#e5e7eb;font-size:18pt;font-weight:900;letter-spacing:3px;">LEONI</div>

  </div>

</div>
</body></html>`;
}

export default function PrintAT({ accident, infirmiereNom, currentUser }) {
  const handlePrint = () => {
    if (!accident) return;
    const nom = (infirmiereNom && infirmiereNom !== '—' && infirmiereNom.trim())
      ? infirmiereNom
      : accident?.infirmiere_nom || currentUser?.username || '—';
    const html = buildAThtml(accident, nom);
    printHTML(html);
  };

  return (
    <button onClick={handlePrint} title="Imprimer la déclaration AT"
      style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px',
        border:'1.5px solid #d1d5db', background:'#f3f4f6', borderRadius:7,
        cursor:'pointer', fontSize:12, fontWeight:700, color:'#374151',
        transition:'all .12s', flexShrink:0, whiteSpace:'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.background='#374151'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#374151'; }}
      onMouseLeave={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#374151'; e.currentTarget.style.borderColor='#d1d5db'; }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Imprimer
    </button>
  );
}