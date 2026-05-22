import { useState, useEffect } from 'react';
import { getMedicaments, creerActe } from '../../api/stockApi';
import { getDossierByCollaborateur, parseAllergiesApiPayload } from '../../api/medicalRecordsApi';

const inputStyle = {
  width: '100%',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '9px 11px',
  fontSize: 13,
  outline: 'none',
  background: 'white',
};

const btnPrimary = {
  border: 'none',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  background: '#2563eb',
  color: 'white',
};

export default function ActeInfirmier() {
  const [medicaments, setMedicaments] = useState([]);
  const [selectedMed, setSelectedMed] = useState('');

  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadMeds, setLoadMeds] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allergieInfo, setAllergieInfo] = useState(null);
  const [allergieAucuneEnregistree, setAllergieAucuneEnregistree] = useState(false);

  useEffect(() => {
    getMedicaments()
      .then(data => setMedicaments(Array.isArray(data) ? data : []))
      .finally(() => setLoadMeds(false));
  }, []);

  // Handler to be called when a collaborateur is selected elsewhere in the UI.
  const handleSelectCollaborateur = async (collab) => {
    if (!collab) {
      setAllergieInfo(null);
      setAllergieAucuneEnregistree(false);
      return;
    }
    setAllergieInfo(null);
    setAllergieAucuneEnregistree(false);
    try {
      const dossier = await getDossierByCollaborateur(collab.id, collab.matricule);
      const parsed = parseAllergiesApiPayload(dossier);
      if (parsed.lignes.length > 0) {
        setAllergieInfo(parsed.lignes.join(', '));
      } else {
        setAllergieInfo(null);
      }
      setAllergieAucuneEnregistree(parsed.afficherAucuneEnregistree);
    } catch {
      setAllergieInfo(null);
      setAllergieAucuneEnregistree(false);
    }
  };


  // Récupérer l'objet médicament sélectionné
  const medObj = medicaments.find(m => m.id === Number(selectedMed));

  // Récupérer le stock
  const stockInfo = medObj?.stock_info;

  // Stock disponible ?
  const stockOk = stockInfo && stockInfo.quantite > 0;

  const handleSubmit = async () => {
    if (!selectedMed || !quantite) {
      setError('Médicament et quantité sont requis.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await creerActe({
        type_acte: 'OUVERTURE',
        medicament: Number(selectedMed),
        quantite: Number(quantite),
        motif: motif.trim() || null,
      });
      setSuccess('Boîte enregistrée avec succès.');
      setSelectedMed('');
      setQuantite('');
      setMotif('');
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.error ||
        data?.detail ||
        Object.values(data ?? {}).flat().join(' ') ||
        'Erreur lors de la création.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ouverture de boîte</div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
          {success}
        </div>
      )}

      {allergieInfo && (
        <div style={{
          background: '#fef2f2',
          border: '1.5px solid #fca5a5',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c' }}>Attention — Allergie connue</div>
            <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>{allergieInfo}</div>
          </div>
        </div>
      )}

      {allergieAucuneEnregistree && !allergieInfo && (
        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            marginBottom: 12,
            padding: '8px 10px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          Aucune allergie enregistrée
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
        <select
          style={inputStyle}
          value={selectedMed}
          onChange={(e) => setSelectedMed(e.target.value)}
          disabled={loadMeds}
        >
          <option value="">{loadMeds ? 'Chargement des médicaments...' : 'Sélectionner un médicament'}</option>
          {medicaments.map(m => (
            <option key={m.id} value={m.id}>
              {m.nom} {m.dosage} - Stock: {m.stock_info?.quantite ?? 0} {m.stock_info?.unite ?? m.unite ?? ''}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          max={stockInfo?.quantite ?? undefined}
          style={inputStyle}
          placeholder="Nombre de boîtes ouvertes"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        <input
          style={inputStyle}
          placeholder="Motif (optionnel)"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        {selectedMed && (
          <div style={{ fontSize: 12.5, color: stockOk ? '#166534' : '#b45309' }}>
            Stock actuel: {stockInfo?.quantite ?? 0} {stockInfo?.unite ?? medObj?.unite ?? ''}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedMed || !quantite || !stockOk}
            style={{
              ...btnPrimary,
              opacity: loading || !selectedMed || !quantite || !stockOk ? 0.65 : 1,
              cursor: loading || !selectedMed || !quantite || !stockOk ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Enregistrement…' : 'Enregistrer ouverture'}
          </button>
        </div>
      </div>
    </div>
  );
}
