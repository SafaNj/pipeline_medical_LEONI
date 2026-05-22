// src/components/infirmier/PrintEnquete.jsx
import { printHTML } from '../../utils/printHelper';
import { getEnquete } from '../../api/actInfirmierApi';
import { uiAlert } from '../../utils/uiAlert';

function esc(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildEnqueteHtml(accident, enquete, nomInfirmier) {
  const a = accident || {};
  const e = enquete  || {};
  const fmt   = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');
  const val   = (v) => (v !== null && v !== undefined && String(v).trim() !== '') ? esc(String(v)) : '';

  /* ── Témoins ── */
  const temoins = Array.isArray(e.temoins) ? e.temoins : [];

  /* Lignes témoins : toujours au moins 2 lignes comme dans le Word */
  const minRows = Math.max(temoins.length, 2);
  let temoinsRows = '';
  for (let i = 0; i < minRows; i++) {
    const t = temoins[i] || {};
    temoinsRows += `
      <tr style="height:22px;">
        <td style="border:1px solid #aaa;padding:3px 6px;font-size:9pt;">${val(t.nom)}</td>
        <td style="border:1px solid #aaa;padding:3px 6px;font-size:9pt;">${val(t.matricule)}</td>
        <td style="border:1px solid #aaa;padding:3px 6px;font-size:9pt;">${val(t.cin)}</td>
        <td style="border:1px solid #aaa;padding:3px 6px;font-size:9pt;">${val(t.telephone)}</td>
      </tr>`;
  }

  /* ── HTML complet ── */
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Enquête initiale d'accident</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 18mm 18mm 18mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #111;
      background: white;
    }
    .page {
      width: 100%;
    }

    /* ── EN-TÊTE ── */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #aaa;
      margin-bottom: 22px;
    }
    .header-table td {
      border: 1.5px solid #aaa;
      padding: 10px 14px;
      vertical-align: middle;
    }
    .header-logo {
      width: 100px;
      text-align: center;
    }
    .header-title {
      text-align: center;
      font-size: 13pt;
      font-weight: 700;
      color: #5a8fc2;
      letter-spacing: .3px;
    }
    .header-brand {
      width: 90px;
      text-align: center;
      font-size: 18pt;
      font-weight: 900;
      color: #1a2b4a;
      letter-spacing: 1px;
    }

    /* ── SECTIONS ── */
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #5a8fc2;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::before {
      content: '▶';
      font-size: 8pt;
    }
    .field-line {
      font-size: 10pt;
      color: #111;
      margin-bottom: 8px;
      min-height: 14px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
    }
    .field-label {
      font-weight: 600;
    }

    /* ── TABLEAU TÉMOINS ── */
    .temoins-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .temoins-table th {
      background: #f0f4f8;
      border: 1px solid #aaa;
      padding: 5px 8px;
      font-size: 9.5pt;
      font-weight: 700;
      text-align: left;
      color: #374151;
    }
    .temoins-table td {
      border: 1px solid #aaa;
      padding: 4px 8px;
      font-size: 9.5pt;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ═══ EN-TÊTE (exactement comme le Word) ═══ -->
  <table class="header-table">
    <tr>
      <td class="header-logo">
        <!-- Case vide à gauche comme dans le document -->
      </td>
      <td class="header-title">
        Enquête initiale d'accident
      </td>
      <td class="header-brand">
        LEONI
      </td>
    </tr>
  </table>

  <!-- ═══ SECTION VICTIME ═══ -->
  <div class="section">
    <div class="section-title">Victime</div>

    <div class="field-line">
      <span class="field-label">-Nom et prénom :</span>
      &nbsp;${val(a.collaborateur_nom)}
    </div>

    <div class="field-line">
      <span class="field-label">-Matricule :</span>
      &nbsp;${val(a.collaborateur_matricule)}
    </div>

    <div class="field-line">
      <span class="field-label">-Numéro de téléphone :</span>
      &nbsp;${val(e.telephone_victime)}
    </div>

    <div class="field-line">
      <span class="field-label">-Appartenance :</span>
      &nbsp;${val(e.appartenance)}
    </div>

    <div class="field-line">
      <span class="field-label">-Horaire de travail :</span>
      &nbsp;${val(e.horaire_travail)}
    </div>
  </div>

  <!-- ═══ SECTION ACCIDENT ═══ -->
  <div class="section">
    <div class="section-title">Accident</div>

    <div class="field-line">
      <span class="field-label">-Date et heure de l'accident :</span>
      &nbsp;${val(fmt(a.date_accident))}${a.heure_accident ? '&nbsp;&nbsp;à&nbsp;&nbsp;' + val(a.heure_accident) : ''}
    </div>

    <div class="field-line">
      <span class="field-label">-Lieu de l'accident :</span>
      &nbsp;${val(a.lieu_accident)}
    </div>

    <div class="field-line" style="min-height:32px;padding-bottom:6px;">
      <span class="field-label">-Circonstances de l'accident :</span>
      &nbsp;${val(e.circonstances)}
    </div>

    <div class="field-line">
      <span class="field-label">-Siège et type de lésion :</span>
      &nbsp;${val(a.siege_lesion)}${a.nature_lesion ? ' — ' + val(a.nature_lesion) : ''}
    </div>

    <div class="field-line">
      <span class="field-label">-Lieu où la victime a été transportée :</span>
      &nbsp;${val(e.lieu_transport)}
    </div>
  </div>

  <!-- ═══ SECTION TÉMOINS ═══ -->
  <div class="section">
    <div class="section-title" style="color:#1a2b4a;font-size:12pt;">Témoins</div>

    <table class="temoins-table">
      <thead>
        <tr>
          <th>Nom et prénom</th>
          <th>Matricule</th>
          <th>CIN</th>
          <th>N° téléphone</th>
        </tr>
      </thead>
      <tbody>
        ${temoinsRows}
      </tbody>
    </table>
  </div>

</div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════
   Composant bouton — utilisé dans la LISTE des accidents
   (entre Imprimer AT et Modifier)
═══════════════════════════════════════════════ */
export default function PrintEnquete({ accident, infirmiereNom, currentUser }) {
  const handlePrint = async () => {
    if (!accident?.id) return;
    try {
      const data = await getEnquete(accident.id);
      const eid  = data?.id ?? data?.pk;
      if (!data || eid == null) {
        await uiAlert({
          icon: 'info',
          title: 'Enquête',
          text: 'Aucune enquête enregistrée pour cet accident.',
        });
        return;
      }
      const nom =
        (infirmiereNom && infirmiereNom !== '—' && String(infirmiereNom).trim())
          ? infirmiereNom
          : accident?.infirmiere_nom || currentUser?.username || '—';
      printHTML(buildEnqueteHtml(accident, data, nom));
    } catch {
      await uiAlert({
        icon: 'error',
        title: 'Enquête',
        text: "Impossible de charger l'enquête pour impression.",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      title="Imprimer l'enquête (PDF)"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        border: '1.5px solid #d1fae5',
        background: '#ecfdf5',
        borderRadius: 7,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        color: '#065f46',
        transition: 'all .12s',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background    = '#059669';
        e.currentTarget.style.color         = 'white';
        e.currentTarget.style.borderColor   = '#059669';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background    = '#ecfdf5';
        e.currentTarget.style.color         = '#065f46';
        e.currentTarget.style.borderColor   = '#d1fae5';
      }}
    >
      {/* Icône document */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      Enquête
    </button>
  );
}