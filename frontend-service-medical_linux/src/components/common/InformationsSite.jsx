import { useState, useEffect } from 'react';
import { getSite, modifierSite } from '../../api/sitesApi';

const P = {
  white: '#fff',
  lightGray: '#f8f9fa',
  gray: '#6b7280',
  darkGray: '#1f2937',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  orange: '#f97316',
};

const InformationsSite = ({ siteId }) => {
  const [formData, setFormData] = useState({
    raison_sociale: '',
    nature_activite: '',
    numero_cnss: '',
    adresse: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Charger les infos du site au montage
  useEffect(() => {
    if (!siteId) {
      console.log('InformationsSite siteId:', siteId);
      setErrorMsg('Site non identifié');
      setLoading(false);
      return;
    }
    
    getSite(siteId)
      .then(data => {
        setFormData({
          raison_sociale: data.raison_sociale || '',
          nature_activite: data.nature_activite || '',
          numero_cnss: data.numero_cnss || '',
          adresse: data.adresse || '',
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur chargement site:', err);
        setErrorMsg('Erreur lors du chargement des informations');
        setLoading(false);
      });
  }, [siteId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteId) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await modifierSite(siteId, formData);
      setSuccessMsg('Informations mises à jour avec succès');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setErrorMsg('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '600px',
        marginBottom: '40px',
      }}>
        <h2 style={{
          marginBottom: '20px',
          fontSize: '20px',
          fontWeight: 600,
          color: P.darkGray,
        }}>
          Informations du site
        </h2>

        {successMsg && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#d1fae5',
            border: '1px solid #6ee7b7',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#065f46',
          }}>
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#991b1b',
          }}>
            ✗ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          {/* Raison Sociale */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              fontSize: '14px',
              color: P.darkGray,
            }}>
              Raison sociale *
            </label>
            <input
              type="text"
              name="raison_sociale"
              value={formData.raison_sociale}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Nature d'activité */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              fontSize: '14px',
              color: P.darkGray,
            }}>
              Nature d'activité
            </label>
            <input
              type="text"
              name="nature_activite"
              value={formData.nature_activite}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Numéro CNSS */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              fontSize: '14px',
              color: P.darkGray,
            }}>
              Numéro CNSS
            </label>
            <input
              type="text"
              name="numero_cnss"
              value={formData.numero_cnss}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              fontSize: '14px',
              color: P.darkGray,
            }}>
              Adresse
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: saving ? '#d1d5db' : P.blue,
              color: P.white,
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InformationsSite;
