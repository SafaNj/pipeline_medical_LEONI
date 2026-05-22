/**
 * Étape « Fiche d'aptitude » — Liste d'embauche — template MATEUR uniquement.
 * Aligné sur Nouvellefiche.jsx (choix document, aptitude, examens ultérieurs, certificat).
 */
import React, { useEffect, useMemo, useState } from 'react';

const APTITUDES_CERT_MATEUR = [
  { value: 'APTE_AU_POSTE', label: 'APTE au poste mentionné / Peut reprendre son poste de travail', cls: 'g' },
  { value: 'INAPTE_TEMPORAIRE', label: 'INAPTE temporaire au poste mentionné', cls: 'r' },
  { value: 'INAPTE_DEFINITIF_MEME_POSTE', label: 'INAPTE définitif au poste mentionné', cls: 'r' },
];

function VeSectionTitle({ children, SKY }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: SKY[700],
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
        paddingBottom: 7,
        borderBottom: `2px solid ${SKY[100]}`,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div style={{ width: 3, height: 14, borderRadius: 3, background: `linear-gradient(${SKY[400]}, ${SKY[700]})` }} />
      {children}
    </div>
  );
}

function VeFocusInput({ style, SKY, ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...style,
        borderColor: f ? SKY[400] : style?.borderColor,
        boxShadow: f ? `0 0 0 3px ${SKY[100]}` : 'none',
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function VeFocusSelect({ style, SKY, children, ...props }) {
  const [f, setF] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...style,
        borderColor: f ? SKY[400] : style?.borderColor,
        boxShadow: f ? `0 0 0 3px ${SKY[100]}` : 'none',
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    >
      {children}
    </select>
  );
}

function VeFocusTextarea({ style, SKY, ...props }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...style,
        borderColor: f ? SKY[400] : style?.borderColor,
        boxShadow: f ? `0 0 0 3px ${SKY[100]}` : 'none',
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function FieldLabel({ children, required, SKY }) {
  return (
    <label
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: SKY[700],
        textTransform: 'uppercase',
        letterSpacing: '.5px',
        display: 'block',
        marginBottom: 5,
      }}
    >
      {children}
      {required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
    </label>
  );
}

export default function EmbaucheMateurEtape2({
  SKY,
  inpSx,
  lblSx,
  APT_STYLE,
  aptitudeChoices,
  fForm,
  setFForm,
  enterpriseReadOnly,
  embaucheMateurDocType,
  setEmbaucheMateurDocType,
  embaucheMaturExamRows,
  setEmbaucheMaturExamRows,
  embaucheMateurCert,
  setEmbaucheMateurCert,
  hideDocChoice = false,
}) {
  const inputSx = useMemo(() => ({ ...inpSx, resize: 'vertical' }), [inpSx]);
  const [maturExamVisibleCount, setMaturExamVisibleCount] = useState(1);
  const [certOpenZones, setCertOpenZones] = useState({ coupe: false, preparation: false, montage: false });

  const setCert = (key, value) => setEmbaucheMateurCert((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (embaucheMateurDocType !== 'CERTIFICAT') return;
    const coupeHas = !!(embaucheMateurCert?.certZoneCoupeCoupe || embaucheMateurCert?.certZoneCoupeSertissage || embaucheMateurCert?.certZoneCoupeAutres);
    const prepHas = !!(embaucheMateurCert?.certZonePrepEpissure || embaucheMateurCert?.certZonePrepRetreint || embaucheMateurCert?.certZonePrepTorsadage || embaucheMateurCert?.certZonePrepEiamage || embaucheMateurCert?.certZonePrepKabatec || embaucheMateurCert?.certZonePrepLovage || embaucheMateurCert?.certZonePrepAutres);
    const montageHas = !!(embaucheMateurCert?.certZoneMontageSousElement || embaucheMateurCert?.certZoneMontageLAD || embaucheMateurCert?.certZoneMontagePU || embaucheMateurCert?.certZoneMontageAgrafs || embaucheMateurCert?.certZoneMontageVissage || embaucheMateurCert?.certZoneMontageGoulotte || embaucheMateurCert?.certZoneMontageBOL || embaucheMateurCert?.certZoneMontageCFinal || embaucheMateurCert?.certZoneMontageAutrePostes);
    setCertOpenZones((prev) => ({
      coupe: prev.coupe || coupeHas,
      preparation: prev.preparation || prepHas,
      montage: prev.montage || montageHas,
    }));
  }, [embaucheMateurDocType, embaucheMateurCert]);

  // Si des lignes (au-delà de la 1ère) contiennent déjà des données, afficher jusqu'à la dernière remplie.
  useEffect(() => {
    if (embaucheMateurDocType !== 'FICHE') return;
    const rows = Array.isArray(embaucheMaturExamRows) ? embaucheMaturExamRows : [];
    let lastFilledIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r) continue;
      const filled = Boolean(
        String(r.date_nature || '').trim()
        || String(r.conclusion || '').trim()
        || String(r.medecin || '').trim()
        || r.p || r.r || r.s
      );
      if (filled) lastFilledIdx = i;
    }
    const needed = Math.max(1, lastFilledIdx + 1);
    setMaturExamVisibleCount((prev) => (prev < needed ? needed : prev));
  }, [embaucheMateurDocType, embaucheMaturExamRows]);

  const setF = (field) => (e) => setFForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      {!hideDocChoice && (
        <>
          <VeSectionTitle SKY={SKY}>Document à délivrer (Mateur)</VeSectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 10, marginBottom: 18 }}>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
              }}
              onClick={() => setEmbaucheMateurDocType('FICHE')}
              style={{
                cursor: 'pointer',
                padding: '12px 14px',
                borderRadius: 12,
                border: `2px solid ${embaucheMateurDocType === 'FICHE' ? SKY[400] : SKY[100]}`,
                background: embaucheMateurDocType === 'FICHE' ? SKY[50] : 'white',
                color: '#0f172a',
                fontWeight: 800,
              }}
            >
              Fiche d'aptitude (Annexe n°3)
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>Formulaire + impression sur 2 pages.</div>
            </div>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
              }}
              onClick={() => setEmbaucheMateurDocType('CERTIFICAT')}
              style={{
                cursor: 'pointer',
                padding: '12px 14px',
                borderRadius: 12,
                border: `2px solid ${embaucheMateurDocType === 'CERTIFICAT' ? SKY[400] : SKY[100]}`,
                background: embaucheMateurDocType === 'CERTIFICAT' ? SKY[50] : 'white',
                color: '#0f172a',
                fontWeight: 800,
              }}
            >
              Certificat d'aptitude
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>Saisie des zones (travail / circulation / protection).</div>
            </div>
          </div>
        </>
      )}

      {embaucheMateurDocType !== 'CERTIFICAT' && (
        <>
          <VeSectionTitle SKY={SKY}>Informations visite</VeSectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div>
              <label style={lblSx}>Date de visite *</label>
              <VeFocusInput SKY={SKY} className="ve-inp" type="date" value={fForm.date_visite} onChange={setF('date_visite')} style={inpSx} />
            </div>
            <div>
              <label style={lblSx}>Raison sociale</label>
              <VeFocusInput SKY={SKY} className="ve-inp" value={fForm.raison_sociale} onChange={setF('raison_sociale')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : 'white', cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} />
            </div>
            <div>
              <label style={lblSx}>Nature d'activité</label>
              <VeFocusInput SKY={SKY} className="ve-inp" value={fForm.nature_activite} onChange={setF('nature_activite')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : 'white', cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} />
            </div>
            <div>
              <label style={lblSx}>N° CNSS entreprise</label>
              <VeFocusInput SKY={SKY} className="ve-inp" value={fForm.numero_cnss_entreprise} onChange={setF('numero_cnss_entreprise')} readOnly={enterpriseReadOnly} style={{ ...inpSx, fontFamily: 'monospace', background: enterpriseReadOnly ? '#f8fafc' : 'white', cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lblSx}>Adresse entreprise</label>
              <VeFocusInput SKY={SKY} className="ve-inp" value={fForm.adresse_entreprise} onChange={setF('adresse_entreprise')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : 'white', cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lblSx}>Qualifications</label>
              <VeFocusInput SKY={SKY} className="ve-inp" value={fForm.qualifications} onChange={setF('qualifications')} readOnly={enterpriseReadOnly} style={{ ...inpSx, background: enterpriseReadOnly ? '#f8fafc' : 'white', cursor: enterpriseReadOnly ? 'not-allowed' : 'text' }} />
            </div>
          </div>
        </>
      )}

      {embaucheMateurDocType === 'CERTIFICAT' && (
        <>
          <VeSectionTitle SKY={SKY}>Visite (certificat)</VeSectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div>
              <FieldLabel SKY={SKY} required>
                Visite
              </FieldLabel>
              <VeFocusSelect SKY={SKY} className="ve-inp" value={fForm.type_visite} onChange={setF('type_visite')} style={{ ...inpSx, cursor: 'pointer' }}>
                <option value="">Sélectionner…</option>
                <option value="EMBAUCHE">Embauche</option>
                <option value="PERIODIQUE">Périodique</option>
                <option value="SPONTANEE">Situation d'urgence</option>
                <option value="REPRISE">Reprise</option>
              </VeFocusSelect>
            </div>
            <div>
              <FieldLabel SKY={SKY} required>
                Date de visite
              </FieldLabel>
              <VeFocusInput SKY={SKY} className="ve-inp" type="date" value={fForm.date_visite} onChange={setF('date_visite')} style={inpSx} />
            </div>
          </div>

          <VeSectionTitle SKY={SKY}>En-tête du certificat</VeSectionTitle>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!embaucheMateurCert?.certHeaderCertificatMedical} onChange={(e) => setCert('certHeaderCertificatMedical', e.target.checked)} />
              Certificat médicale d&apos;aptitude
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!embaucheMateurCert?.certHeaderReprisePoste} onChange={(e) => setCert('certHeaderReprisePoste', e.target.checked)} />
              Reprise au poste de travail
            </label>
          </div>
        </>
      )}

      <VeSectionTitle SKY={SKY}>Résultat d'aptitude</VeSectionTitle>
      {embaucheMateurDocType === 'CERTIFICAT' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {APTITUDES_CERT_MATEUR.map((a) => {
            const s = APT_STYLE[a.cls];
            const sel = fForm.aptitude === a.value;
            return (
              <div
                key={a.value}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                }}
                onClick={() => setFForm((p) => ({ ...p, aptitude: a.value }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 13px',
                  borderRadius: 11,
                  cursor: 'pointer',
                  border: `2px solid ${sel ? s.selBorder : '#e2e8f0'}`,
                  background: sel ? s.selBg : '#f8fafc',
                  color: sel ? s.color : '#64748b',
                  fontSize: 12.5,
                  fontWeight: sel ? 700 : 500,
                  transition: 'all .15s cubic-bezier(.4,0,.2,1)',
                  boxShadow: sel ? `0 4px 14px ${s.dot}25` : 'none',
                  transform: sel ? 'translateY(-1px)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: sel ? s.dot : '#e2e8f0',
                    flexShrink: 0,
                    transition: 'background .15s',
                  }}
                />
                <span style={{ lineHeight: 1.35 }}>{a.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
          {(aptitudeChoices || []).map((a) => {
            const cls = a.val === 'APTE_AU_POSTE' || a.val === 'APTE_AMENAGEMENT_POSTE' ? (a.val === 'APTE_AU_POSTE' ? 'g' : 'a') : 'r';
            const s = APT_STYLE[cls];
            const sel = fForm.aptitude === a.val;
            return (
              <div
                key={a.val}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                }}
                onClick={() => setFForm((p) => ({ ...p, aptitude: a.val }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 13px',
                  borderRadius: 11,
                  cursor: 'pointer',
                  border: `2px solid ${sel ? s.selBorder : '#e2e8f0'}`,
                  background: sel ? s.selBg : '#f8fafc',
                  color: sel ? s.color : '#64748b',
                  fontSize: 12.5,
                  fontWeight: sel ? 700 : 500,
                  transition: 'all .15s cubic-bezier(.4,0,.2,1)',
                  boxShadow: sel ? `0 4px 14px ${s.dot}25` : 'none',
                  transform: sel ? 'translateY(-1px)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: sel ? s.dot : '#e2e8f0',
                    flexShrink: 0,
                    transition: 'background .15s',
                  }}
                />
                <span style={{ lineHeight: 1.25 }}>{a.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {!!fForm.aptitude && embaucheMateurDocType === 'FICHE' && (
        <div
          style={{
            padding: '14px 16px',
            marginBottom: 16,
            background: `linear-gradient(135deg, ${SKY[50]}, #f0f9ff)`,
            border: `1.5px solid ${SKY[200]}`,
            borderRadius: 12,
          }}
        >
          <label style={lblSx}>Précision aptitude</label>
          <VeFocusInput
            SKY={SKY}
            className="ve-inp"
            type="text"
            value={fForm.precision_aptitude}
            onChange={setF('precision_aptitude')}
            placeholder="Ex. : poste compatible avec restrictions…"
            style={{ ...inpSx, marginTop: 6, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {embaucheMateurDocType === 'FICHE' && (
        <>
          <VeSectionTitle SKY={SKY}>4 — Examens médicaux ultérieurs (Mateur)</VeSectionTitle>
          <div style={{ border: `1.5px solid ${SKY[200]}`, borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', background: SKY[50], borderBottom: `1.5px solid ${SKY[200]}` }}>
              <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Date et Nature de l'examen (P/R/S)</div>
              <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Conclusions en matière d'aptitude au travail (à préciser)</div>
              <div style={{ padding: '10px 12px', fontWeight: 900, color: SKY[800], fontSize: 11 }}>Nom, prénom et Signature du médecin</div>
            </div>
            {embaucheMaturExamRows.slice(0, maturExamVisibleCount).map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', borderBottom: idx === (maturExamVisibleCount - 1) ? 'none' : `1px solid ${SKY[100]}` }}>
                <div style={{ padding: 10 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        setEmbaucheMaturExamRows((prev) =>
                          prev.map((r, i) => (i !== idx ? r : { ...r, p: !r.p, r: false, s: false })),
                        )
                      }
                      style={{
                        border: '1.5px solid #e2e8f0',
                        background: row.p ? SKY[50] : 'white',
                        borderRadius: 10,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        color: row.p ? SKY[700] : '#64748b',
                      }}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEmbaucheMaturExamRows((prev) =>
                          prev.map((r, i) => (i !== idx ? r : { ...r, r: !r.r, p: false, s: false })),
                        )
                      }
                      style={{
                        border: '1.5px solid #e2e8f0',
                        background: row.r ? SKY[50] : 'white',
                        borderRadius: 10,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        color: row.r ? SKY[700] : '#64748b',
                      }}
                    >
                      R
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEmbaucheMaturExamRows((prev) =>
                          prev.map((r, i) => (i !== idx ? r : { ...r, s: !r.s, p: false, r: false })),
                        )
                      }
                      style={{
                        border: '1.5px solid #e2e8f0',
                        background: row.s ? SKY[50] : 'white',
                        borderRadius: 10,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        color: row.s ? SKY[700] : '#64748b',
                      }}
                    >
                      S
                    </button>
                  </div>
                  <label style={lblSx}>Date + nature</label>
                  <VeFocusTextarea
                    SKY={SKY}
                    className="ve-inp"
                    rows={3}
                    value={row.date_nature}
                    onChange={(e) =>
                      setEmbaucheMaturExamRows((prev) =>
                        prev.map((r, i) => (i !== idx ? r : { ...r, date_nature: e.target.value })),
                      )
                    }
                    style={{ ...inputSx, marginTop: 4 }}
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <label style={lblSx}>Conclusions</label>
                  <VeFocusTextarea
                    SKY={SKY}
                    className="ve-inp"
                    rows={4}
                    value={row.conclusion}
                    onChange={(e) =>
                      setEmbaucheMaturExamRows((prev) =>
                        prev.map((r, i) => (i !== idx ? r : { ...r, conclusion: e.target.value })),
                      )
                    }
                    style={{ ...inputSx, marginTop: 4 }}
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <label style={lblSx}>Médecin</label>
                  <VeFocusTextarea
                    SKY={SKY}
                    className="ve-inp"
                    rows={4}
                    value={row.medecin}
                    onChange={(e) =>
                      setEmbaucheMaturExamRows((prev) =>
                        prev.map((r, i) => (i !== idx ? r : { ...r, medecin: e.target.value })),
                      )
                    }
                    style={{ ...inputSx, marginTop: 4 }}
                  />
                </div>
              </div>
            ))}
          </div>
          {maturExamVisibleCount < embaucheMaturExamRows.length && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -10, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setMaturExamVisibleCount((c) => Math.min(embaucheMaturExamRows.length, c + 1))}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${SKY[400]}, ${SKY[700]})`,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                  boxShadow: '0 3px 12px rgba(14,165,233,.28)',
                }}
              >
                + Ajouter
              </button>
            </div>
          )}
        </>
      )}

      {embaucheMateurDocType === 'CERTIFICAT' && (
        <>
          <VeSectionTitle SKY={SKY}>Contenu du certificat (Mateur)</VeSectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 18 }}>
            <div style={{ padding: '12px 14px', background: SKY[50], border: `1.5px solid ${SKY[200]}`, borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: SKY[800], marginBottom: 6 }}>
                Avis Service médecine de travail concernant état de santé général et contre-indication au poste de travail
              </div>
              <div style={{ height: 10 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div>
                  <FieldLabel SKY={SKY}>État général efficience</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisEtatGeneral} onChange={(e) => setCert('certAvisEtatGeneral', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Debout prolongé</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisDebout} onChange={(e) => setCert('certAvisDebout', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Assis prolongé</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisAssis} onChange={(e) => setCert('certAvisAssis', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Charge &gt; 4 kgr</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisCharge4} onChange={(e) => setCert('certAvisCharge4', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Poignet / Bras / Épaule</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisPoignetBrasEpaule} onChange={(e) => setCert('certAvisPoignetBrasEpaule', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Cou</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisCou} onChange={(e) => setCert('certAvisCou', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Effort / précision / concentration</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisEffortPrecision} onChange={(e) => setCert('certAvisEffortPrecision', e.target.value)} style={inputSx} />
                </div>
                <div>
                  <FieldLabel SKY={SKY}>Rotation équipe possible</FieldLabel>
                  <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certAvisRotationEquipe} onChange={(e) => setCert('certAvisRotationEquipe', e.target.value)} style={inputSx} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <FieldLabel SKY={SKY}>À prendre en considération</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div>
                    <FieldLabel SKY={SKY}>Maladie professionnelle</FieldLabel>
                    <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certApcMaladiePro} onChange={(e) => setCert('certApcMaladiePro', e.target.value)} style={inputSx} />
                  </div>
                  <div>
                    <FieldLabel SKY={SKY}>Accident de travail avec séquelles</FieldLabel>
                    <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certApcAccident} onChange={(e) => setCert('certApcAccident', e.target.value)} style={inputSx} />
                  </div>
                  <div>
                    <FieldLabel SKY={SKY}>Maladies chroniques</FieldLabel>
                    <VeFocusTextarea SKY={SKY} rows={2} value={embaucheMateurCert.certApcMaladiesChroniques} onChange={(e) => setCert('certApcMaladiesChroniques', e.target.value)} style={inputSx} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 14px', border: `1.5px solid ${SKY[200]}`, borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: SKY[800], marginBottom: 10 }}>Zones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <button type="button" onClick={() => setCertOpenZones((p) => ({ ...p, coupe: !p.coupe }))}
                    style={{ padding: '6px 10px', borderRadius: 10, border: `1.5px solid ${certOpenZones.coupe ? SKY[400] : SKY[100]}`, background: certOpenZones.coupe ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11.5, color: certOpenZones.coupe ? SKY[800] : '#475569', textAlign: 'left', width: 'fit-content' }}>
                    Zone Coupe
                  </button>
                  {certOpenZones.coupe && (
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div><FieldLabel SKY={SKY}>Coupe</FieldLabel><VeFocusTextarea SKY={SKY} rows={4} value={embaucheMateurCert.certZoneCoupeCoupe} onChange={(e) => setCert('certZoneCoupeCoupe', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Sertissage manuel</FieldLabel><VeFocusTextarea SKY={SKY} rows={4} value={embaucheMateurCert.certZoneCoupeSertissage} onChange={(e) => setCert('certZoneCoupeSertissage', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Autres remarques</FieldLabel><VeFocusTextarea SKY={SKY} rows={4} value={embaucheMateurCert.certZoneCoupeAutres} onChange={(e) => setCert('certZoneCoupeAutres', e.target.value)} style={inputSx} /></div>
                    </div>
                  )}
                </div>

                <div>
                  <button type="button" onClick={() => setCertOpenZones((p) => ({ ...p, preparation: !p.preparation }))}
                    style={{ padding: '6px 10px', borderRadius: 10, border: `1.5px solid ${certOpenZones.preparation ? SKY[400] : SKY[100]}`, background: certOpenZones.preparation ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11.5, color: certOpenZones.preparation ? SKY[800] : '#475569', textAlign: 'left', width: 'fit-content' }}>
                    Zone Préparation
                  </button>
                  {certOpenZones.preparation && (
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div><FieldLabel SKY={SKY}>Epissure</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepEpissure} onChange={(e) => setCert('certZonePrepEpissure', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Retreint</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepRetreint} onChange={(e) => setCert('certZonePrepRetreint', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Torsadage</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepTorsadage} onChange={(e) => setCert('certZonePrepTorsadage', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Eiamage</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepEiamage} onChange={(e) => setCert('certZonePrepEiamage', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Kabatec</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepKabatec} onChange={(e) => setCert('certZonePrepKabatec', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Lovage</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepLovage} onChange={(e) => setCert('certZonePrepLovage', e.target.value)} style={inputSx} /></div>
                      <div style={{ gridColumn: 'span 2' }}><FieldLabel SKY={SKY}>Autres remarques</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZonePrepAutres} onChange={(e) => setCert('certZonePrepAutres', e.target.value)} style={inputSx} /></div>
                    </div>
                  )}
                </div>

                <div>
                  <button type="button" onClick={() => setCertOpenZones((p) => ({ ...p, montage: !p.montage }))}
                    style={{ padding: '6px 10px', borderRadius: 10, border: `1.5px solid ${certOpenZones.montage ? SKY[400] : SKY[100]}`, background: certOpenZones.montage ? SKY[50] : 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11.5, color: certOpenZones.montage ? SKY[800] : '#475569', textAlign: 'left', width: 'fit-content' }}>
                    Zone Montage
                  </button>
                  {certOpenZones.montage && (
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div><FieldLabel SKY={SKY}>Sous élément</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageSousElement} onChange={(e) => setCert('certZoneMontageSousElement', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Montage LAD</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageLAD} onChange={(e) => setCert('certZoneMontageLAD', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>PU</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontagePU} onChange={(e) => setCert('certZoneMontagePU', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>C. Agrafs</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageAgrafs} onChange={(e) => setCert('certZoneMontageAgrafs', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Vissage</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageVissage} onChange={(e) => setCert('certZoneMontageVissage', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>Montage goulotte</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageGoulotte} onChange={(e) => setCert('certZoneMontageGoulotte', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>BOL</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageBOL} onChange={(e) => setCert('certZoneMontageBOL', e.target.value)} style={inputSx} /></div>
                      <div><FieldLabel SKY={SKY}>C. Final</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageCFinal} onChange={(e) => setCert('certZoneMontageCFinal', e.target.value)} style={inputSx} /></div>
                      <div style={{ gridColumn: 'span 4' }}><FieldLabel SKY={SKY}>Autre postes Montage</FieldLabel><VeFocusTextarea SKY={SKY} rows={3} value={embaucheMateurCert.certZoneMontageAutrePostes} onChange={(e) => setCert('certZoneMontageAutrePostes', e.target.value)} style={inputSx} /></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <FieldLabel SKY={SKY}>Autres remarques</FieldLabel>
              <VeFocusTextarea SKY={SKY} rows={4} value={embaucheMateurCert.certAutresRemarques} onChange={(e) => setCert('certAutresRemarques', e.target.value)} style={inputSx} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
