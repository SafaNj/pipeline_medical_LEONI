// src/components/rh/FichesAptitudeRH.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFichesAptitude, getFicheAptitude } from '../../api/Medicalworkapi';
import { printHTML } from '../../utils/printHelper';
import { buildFicheAptitudePrintHtml } from '../../utils/fichePrintTemplate';
import { getSitePrintConfig } from '../../utils/siteConfig';
import { uiAlert } from '../../utils/uiAlert';

/* Aligné sur Suivi contre-visites (médecin contrôleur) */
const C = {
  primary: '#0284c7',
  primary2: '#0369a1',
  dark: '#0c4a6e',
  light: '#e0f2fe',
  light2: '#f0f9ff',
  border: '#bae6fd',
  accent: '#38bdf8',
  text: '#0f172a',
  muted: '#64748b',
};

const TYPE_CFG = {
  EMBAUCHE: { label: 'Embauche', bg: '#e0f2fe', color: '#0369a1' },
  PERIODIQUE: { label: 'Périodique', bg: '#dbeafe', color: '#1d4ed8' },
  REPRISE: { label: 'Reprise', bg: '#fef9c3', color: '#a16207' },
  SPONTANEE: { label: 'Spontanée', bg: '#f3f4f6', color: '#374151' },
};

const fmtDateShort = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const IcoCalendar = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoHistory = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcoDownload = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function nomPrenomDepuisFiche(f) {
  const c = f?.collaborateur;
  if (c && typeof c === 'object') {
    const nom = String(c.nom || '').trim();
    const prenom = String(c.prenom || '').trim();
    if (nom || prenom) return { nom: nom || '—', prenom: prenom || '—' };
  }
  const full = String(f?.collaborateur_nom || '').trim();
  if (!full) return { nom: '—', prenom: '—' };
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { nom: parts[0], prenom: '—' };
  return { nom: parts[parts.length - 1], prenom: parts.slice(0, -1).join(' ') };
}

function medecinLabel(f) {
  const m = f?.medecin_nom;
  if (!m) return '—';
  const s = String(m).trim();
  return /^dr\.?\s/i.test(s) ? s : `Dr. ${s}`;
}

const parseDateVisite = (str) => {
  if (!str) return new Date(0);
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) return d;
  const p = String(str).split('T')[0].split('-');
  if (p.length >= 3) return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return new Date(0);
};

function Pagination({ total, pageSize, currentPage, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '16px 20px',
        borderTop: `1px solid ${C.light}`,
        background: C.light2,
        borderRadius: '0 0 16px 16px',
      }}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '8px 16px',
          borderRadius: 8,
          border: `1.5px solid ${C.border}`,
          background: currentPage === 1 ? C.light2 : 'white',
          color: currentPage === 1 ? '#cbd5e1' : C.primary,
          fontWeight: 700,
          fontSize: 13,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        Préc.
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background:
              p === currentPage ? `linear-gradient(135deg,${C.primary},${C.accent})` : C.light2,
            color: p === currentPage ? 'white' : C.muted,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '8px 16px',
          borderRadius: 8,
          border: `1.5px solid ${C.border}`,
          background: currentPage === totalPages ? C.light2 : 'white',
          color: currentPage === totalPages ? '#cbd5e1' : C.primary,
          fontWeight: 700,
          fontSize: 13,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        Suiv.
      </button>
    </div>
  );
}

export default function FichesAptitudeRH() {
  const { user } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('');
  const [printingId, setPrintingId] = useState(null);

  const now = new Date();
  const [filtreAnnee, setFiltreAnnee] = useState(now.getFullYear());
  const [filtreMois, setFiltreMois] = useState(now.getMonth() + 1);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const MOIS = [
    { n: 1, lbl: 'Janvier' },
    { n: 2, lbl: 'Février' },
    { n: 3, lbl: 'Mars' },
    { n: 4, lbl: 'Avril' },
    { n: 5, lbl: 'Mai' },
    { n: 6, lbl: 'Juin' },
    { n: 7, lbl: 'Juillet' },
    { n: 8, lbl: 'Août' },
    { n: 9, lbl: 'Septembre' },
    { n: 10, lbl: 'Octobre' },
    { n: 11, lbl: 'Novembre' },
    { n: 12, lbl: 'Décembre' },
  ];

  useEffect(() => {
    getFichesAptitude()
      .then((d) => setFiches(Array.isArray(d) ? d : []))
      .catch(() => setFiches([]))
      .finally(() => setLoading(false));
  }, []);

  // Ouvrir directement une fiche depuis une alerte RH (fallback: impression PDF)
  useEffect(() => {
    let ficheId = null;
    try {
      ficheId = localStorage.getItem('rh_open_fiche_id');
    } catch {
      ficheId = null;
    }
    if (!ficheId) return;
    const n = parseInt(String(ficheId), 10);
    if (Number.isNaN(n)) return;
    try {
      localStorage.removeItem('rh_open_fiche_id');
    } catch {
      /* ignore */
    }
    // On imprime la fiche pour "ouvrir" rapidement le détail (pas de route dédiée dans l'app)
    setTimeout(() => {
      // eslint-disable-next-line no-use-before-define
      imprimerPdf(n);
    }, 50);
  }, []);

  const q = search.trim().toLowerCase();
  const apresRecherche = fiches.filter((f) => {
    const { nom, prenom } = nomPrenomDepuisFiche(f);
    const mat = (f.collaborateur_matricule || '').toLowerCase();
    if (!q) return true;
    return (
      nom.toLowerCase().includes(q) ||
      prenom.toLowerCase().includes(q) ||
      mat.includes(q) ||
      (f.collaborateur_nom || '').toLowerCase().includes(q)
    );
  });

  const apresType = apresRecherche.filter((f) => !typeF || f.type_visite === typeF);

  const anneesDispos = [
    ...new Set(apresType.map((f) => parseDateVisite(f.date_visite).getFullYear())),
  ].sort((a, b) => b - a);

  const filtered = apresType.filter((f) => {
    const d = parseDateVisite(f.date_visite);
    return d.getFullYear() === filtreAnnee && d.getMonth() + 1 === filtreMois;
  });

  const sorted = [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0));
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const pageData = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const moisLabel = MOIS.find((m) => m.n === filtreMois)?.lbl || '';

  const imprimerPdf = async (ficheId) => {
    if (printingId === ficheId) return;
    setPrintingId(ficheId);
    try {
      const full = await getFicheAptitude(ficheId);
      const rowListe = fiches.find((f) => Number(f.id) === Number(ficheId));
      const printCfg = getSitePrintConfig(full, rowListe || {}, user);
      const html = buildFicheAptitudePrintHtml(full, printCfg, rowListe || {}, user);
      printHTML(html);
    } catch {
      await uiAlert({
        icon: 'error',
        title: 'Impression',
        text: "Impossible de charger la fiche d'aptitude (vérifiez les permissions).",
      });
    } finally {
      setPrintingId(null);
    }
  };

  const cols = ['Nom', 'Prénom', 'Matricule', 'Date de visite', 'Médecin', 'Type de visite', 'Fiche PDF'];

  if (loading) {
    return (
      <>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderRadius: 10,
                marginBottom: 8,
                background: `linear-gradient(90deg,${C.light2} 25%,${C.light} 50%,${C.light2} 75%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
              }}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Rechercher par nom ou matricule…"
          style={{
            flex: 1,
            minWidth: 200,
            padding: '9px 13px',
            border: '1.5px solid #bfdbfe',
            borderRadius: 9,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <select
          value={typeF}
          onChange={(e) => {
            setTypeF(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '9px 12px',
            border: '1.5px solid #bfdbfe',
            borderRadius: 9,
            fontSize: 13,
            background: 'white',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filtres année / mois (même logique que suivi contre-visites) */}
      <div
        style={{
          background: 'white',
          borderRadius: 14,
          border: `1px solid ${C.light}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.05)',
          padding: '16px 20px',
          marginBottom: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcoCalendar />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Filtrer :</span>
        </div>
        <select
          value={filtreAnnee}
          onChange={(e) => {
            setFiltreAnnee(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            background: 'white',
            cursor: 'pointer',
          }}
        >
          {(anneesDispos.length ? anneesDispos : [now.getFullYear()]).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {MOIS.map(({ n, lbl }) => {
            const count = apresType.filter((f) => {
              const d = parseDateVisite(f.date_visite);
              return d.getFullYear() === filtreAnnee && d.getMonth() + 1 === n;
            }).length;
            const active = filtreMois === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setFiltreMois(n);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '5px 13px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  position: 'relative',
                  background: active
                    ? `linear-gradient(135deg,${C.primary},${C.accent})`
                    : count > 0
                      ? C.light
                      : '#f8fafc',
                  color: active ? 'white' : count > 0 ? C.primary : '#94a3b8',
                  boxShadow: active ? `0 2px 8px rgba(2,132,199,.3)` : 'none',
                }}
              >
                {lbl.slice(0, 3)}
                {count > 0 && !active && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      background: C.primary,
                      color: 'white',
                      fontSize: 9,
                      fontWeight: 800,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <span
          style={{
            background: C.light,
            color: C.primary,
            fontSize: 12,
            fontWeight: 700,
            padding: '5px 14px',
            borderRadius: 20,
          }}
        >
          {sorted.length} / {apresType.length}
        </span>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}
      >
        <div
          style={{
            padding: '13px 18px',
            background: C.light2,
            borderBottom: `1px solid ${C.light}`,
            borderLeft: `4px solid ${C.primary}`,
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <IcoHistory />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>
            {moisLabel} {filtreAnnee}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              background: C.light,
              color: C.primary,
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 12px',
              borderRadius: 20,
            }}
          >
            {sorted.length} enreg.
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.light2 }}>
                {cols.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '11px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      borderBottom: `1px solid ${C.light}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((f, idx) => {
                const rowBg = idx % 2 === 0 ? 'white' : C.light2;
                const { nom, prenom } = nomPrenomDepuisFiche(f);
                const type = TYPE_CFG[f.type_visite] || {
                  label: f.type_visite || '—',
                  bg: '#f1f5f9',
                  color: '#475569',
                };
                return (
                  <tr
                    key={f.id}
                    style={{
                      background: rowBg,
                      borderBottom: `1px solid ${C.light}`,
                      transition: 'background .1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.light;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = rowBg;
                    }}
                  >
                    <td style={{ padding: '11px 16px', color: C.text, fontWeight: 600 }}>{nom}</td>
                    <td style={{ padding: '11px 16px', color: C.text, fontWeight: 600 }}>{prenom}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span
                        style={{
                          background: C.light,
                          color: C.primary,
                          padding: '2px 9px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {f.collaborateur_matricule || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#334155', whiteSpace: 'nowrap' }}>
                      {fmtDateShort(f.date_visite)}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#334155' }}>{medecinLabel(f)}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: type.bg,
                          color: type.color,
                        }}
                      >
                        {type.label}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <button
                        type="button"
                        onClick={() => imprimerPdf(f.id)}
                        disabled={printingId === f.id}
                        title="Ouvrir / imprimer la fiche d'aptitude (PDF)"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: 7,
                          background: `linear-gradient(135deg,${C.primary},${C.accent})`,
                          color: 'white',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: printingId === f.id ? 'wait' : 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: `0 2px 8px rgba(2,132,199,.25)`,
                        }}
                      >
                        <IcoDownload />
                        {printingId === f.id ? '…' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>📋</div>
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>
              Aucune visite en {moisLabel} {filtreAnnee}
            </p>
          </div>
        )}
        <Pagination
          total={sorted.length}
          pageSize={PAGE_SIZE}
          currentPage={safePage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
