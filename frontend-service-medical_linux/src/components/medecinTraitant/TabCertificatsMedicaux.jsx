import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  creerCertificatAptitudeGenerale,
  creerCertificatBonneSante,
  creerCertificatExemption,
  creerCertificatPermis,
  creerCertificatPrenuptial,
  getCertificatsAptitudeGeneraleByConsultation,
  getCertificatsBonneSanteByConsultation,
  getCertificatsExemptionByConsultation,
  getCertificatsPermisByConsultation,
  getCertificatsPrenuptialByConsultation,
  updateCertificatAptitudeGenerale,
  updateCertificatBonneSante,
  updateCertificatExemption,
  updateCertificatPermis,
  updateCertificatPrenuptial,
} from '../../api/consultationsApi';
import PrintCertificatAptitudeGenerale from './PrintCertificatAptitudeGenerale';
import PrintCertificatBonneSante from './PrintCertificatBonneSante';
import PrintCertificatExemption from './PrintCertificatExemption';
import PrintCertificatPermis from './PrintCertificatPermis';
import PrintCertificatPrenuptial from './PrintCertificatPrenuptial';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 9,
  fontSize: 13.5,
  outline: 'none',
  color: '#0c4a6e',
  background: 'white',
  boxSizing: 'border-box',
};

function SubTabBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
        background: active ? '#e0f2fe' : 'white',
        color: active ? '#0369a1' : '#475569',
        fontWeight: 700,
        fontSize: 12.5,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function ExistingList({ list, onEdit, title, formatItem }) {
  if (!Array.isArray(list) || list.length === 0) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>{title}</div>
      {list.map((item) => (
        <div key={item.id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '8px 10px',
          marginBottom: 6,
        }}>
          <div style={{ fontSize: 12.5, color: '#0f172a' }}>{formatItem(item)}</div>
          <button
            type="button"
            onClick={() => onEdit(item)}
            style={{
              padding: '5px 10px',
              borderRadius: 7,
              border: '1px solid #7dd3fc',
              background: 'white',
              color: '#0284c7',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Modifier
          </button>
        </div>
      ))}
    </div>
  );
}

function FormBonneSante({ consultationId, medecin, patientNom, siteConfig }) {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom_prenom_enfant: '', date_naissance: '' });

  const load = useCallback(async () => {
    if (!consultationId) return;
    setLoadingList(true);
    try {
      const data = await getCertificatsBonneSanteByConsultation(consultationId);
      setList(data);
      if (data.length > 0) setSelectedForPrint(data[0]);
    } finally {
      setLoadingList(false);
    }
  }, [consultationId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.nom_prenom_enfant.trim() || !form.date_naissance) {
      setError('Nom/prénom enfant et date de naissance sont requis.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        consultation: consultationId,
        nom_prenom_enfant: form.nom_prenom_enfant.trim(),
        date_naissance: form.date_naissance,
        nom_prenom: patientNom,
      };
      const saved = editingId
        ? await updateCertificatBonneSante(editingId, payload)
        : await creerCertificatBonneSante(payload);
      setSelectedForPrint(saved);
      setEditingId(null);
      setForm({ nom_prenom_enfant: '', date_naissance: '' });
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur de sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ExistingList
        list={list}
        title={loadingList ? 'Chargement des certificats...' : 'Certificats existants'}
        onEdit={(c) => {
          setEditingId(c.id);
          setSelectedForPrint(c);
          setForm({
            nom_prenom_enfant: c.nom_prenom_enfant || '',
            date_naissance: (c.date_naissance || '').slice(0, 10),
          });
        }}
        formatItem={(c) => `${c.nom_prenom_enfant || '—'} — ${c.date_naissance || '—'}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Nom et prénom enfant *</label>
          <input
            value={form.nom_prenom_enfant}
            onChange={(e) => setForm((f) => ({ ...f, nom_prenom_enfant: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Date naissance enfant *</label>
          <input
            type="date"
            value={form.date_naissance}
            onChange={(e) => setForm((f) => ({ ...f, date_naissance: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        Auto backend: nom/prénom médecin, date émission, nom patient.
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          {editingId ? 'Enregistrer modification' : 'Créer certificat'}
        </button>
        <PrintCertificatBonneSante certificat={{ ...selectedForPrint, nom_prenom: patientNom }} medecin={medecin} siteConfig={siteConfig} />
      </div>
    </div>
  );
}

function FormExemption({ consultationId, medecin, patientNom, siteConfig }) {
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [duree, setDuree] = useState('');

  const load = useCallback(async () => {
    if (!consultationId) return;
    const data = await getCertificatsExemptionByConsultation(consultationId);
    setList(data);
    if (data.length > 0) setSelectedForPrint(data[0]);
  }, [consultationId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!duree.trim()) {
      setError('Durée exemption obligatoire.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { consultation: consultationId, duree_exemption: duree.trim(), nom_patient: patientNom };
      const saved = editingId
        ? await updateCertificatExemption(editingId, payload)
        : await creerCertificatExemption(payload);
      setSelectedForPrint(saved);
      setEditingId(null);
      setDuree('');
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur de sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ExistingList
        list={list}
        title="Certificats existants"
        onEdit={(c) => {
          setEditingId(c.id);
          setSelectedForPrint(c);
          setDuree(c.duree_exemption || '');
        }}
        formatItem={(c) => `${c.nom_patient || c.nom_prenom || '—'} — ${c.duree_exemption || '—'}`}
      />

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Durée exemption *</label>
        <input value={duree} onChange={(e) => setDuree(e.target.value)} placeholder="Ex: 3 jours" style={inputStyle} />
      </div>

      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        Auto backend: nom patient, nom/prénom médecin.
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          {editingId ? 'Enregistrer modification' : 'Créer certificat'}
        </button>
        <PrintCertificatExemption certificat={{ ...selectedForPrint, nom_patient: patientNom }} medecin={medecin} siteConfig={siteConfig} />
      </div>
    </div>
  );
}

function FormPermis({ consultationId, medecin, patientNom, siteConfig }) {
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    cin: '',
    cin_delivree_a: '',
    cin_date: '',
    numero_ordre_medecin: '',
    lieu_exercice_medecin: '',
    groupe_permis: 'GROUPE_1',
    paragraphe: '',
    sous_paragraphe: '',
    classe: '',
    examine_par_specialiste: false,
    examine_par_specialiste_type: '',
    certificat_delivre_par_specialiste: false,
    certificat_delivre_par_specialiste_type: '',
    inapte_conduite: false,
    inapte_conduite_raison: '',
  });
  const labelStyle = { fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, display: 'block' };

  const load = useCallback(async () => {
    if (!consultationId) return;
    const data = await getCertificatsPermisByConsultation(consultationId);
    setList(data);
    if (data.length > 0) setSelectedForPrint(data[0]);
  }, [consultationId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.cin_delivree_a || !form.cin_date || !form.numero_ordre_medecin || !form.lieu_exercice_medecin) {
      setError('Veuillez remplir les champs obligatoires du permis.');
      return;
    }
    if (form.examine_par_specialiste && !form.examine_par_specialiste_type.trim()) {
      setError('Type spécialiste obligatoire si "examiné par spécialiste" est coché.');
      return;
    }
    if (form.certificat_delivre_par_specialiste && !form.certificat_delivre_par_specialiste_type.trim()) {
      setError('Type spécialiste obligatoire si "certificat spécialiste" est coché.');
      return;
    }
    if (form.inapte_conduite && !form.inapte_conduite_raison.trim()) {
      setError('Raison obligatoire si "inapte à la conduite" est cochée.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { consultation: consultationId, ...form, nom_prenom: patientNom };
      const saved = editingId
        ? await updateCertificatPermis(editingId, payload)
        : await creerCertificatPermis(payload);
      setSelectedForPrint(saved);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Erreur de sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ExistingList
        list={list}
        title="Certificats existants"
        onEdit={(c) => {
          setEditingId(c.id);
          setSelectedForPrint(c);
          setForm((f) => ({ ...f, ...c, cin_date: (c.cin_date || '').slice(0, 10) }));
        }}
        formatItem={(c) => `${c.nom_prenom || '—'} — ${c.groupe_permis || '—'}`}
      />

      <div style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Informations générales</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>CIN</label>
            <input value={form.cin} onChange={(e) => setForm((f) => ({ ...f, cin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CIN délivrée à *</label>
            <input value={form.cin_delivree_a} onChange={(e) => setForm((f) => ({ ...f, cin_delivree_a: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date CIN *</label>
            <input type="date" value={form.cin_date} onChange={(e) => setForm((f) => ({ ...f, cin_date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>N° ordre médecin *</label>
            <input value={form.numero_ordre_medecin} onChange={(e) => setForm((f) => ({ ...f, numero_ordre_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Lieu exercice médecin *</label>
            <input value={form.lieu_exercice_medecin} onChange={(e) => setForm((f) => ({ ...f, lieu_exercice_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Groupe permis</label>
            <select value={form.groupe_permis} onChange={(e) => setForm((f) => ({ ...f, groupe_permis: e.target.value }))} style={inputStyle}>
              <option value="GROUPE_1">Groupe 1</option>
              <option value="GROUPE_2">Groupe 2</option>
              <option value="LES_DEUX">Les deux</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Références réglementaires</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Paragraphe</label>
            <input value={form.paragraphe} onChange={(e) => setForm((f) => ({ ...f, paragraphe: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sous paragraphe</label>
            <input value={form.sous_paragraphe} onChange={(e) => setForm((f) => ({ ...f, sous_paragraphe: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Classe</label>
            <input value={form.classe} onChange={(e) => setForm((f) => ({ ...f, classe: e.target.value }))} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12.5, color: '#334155' }}>
          <input type="checkbox" checked={form.examine_par_specialiste} onChange={(e) => setForm((f) => ({ ...f, examine_par_specialiste: e.target.checked }))} /> Examiné par spécialiste
        </label>
        {form.examine_par_specialiste && (
          <input placeholder="Type spécialiste *" value={form.examine_par_specialiste_type} onChange={(e) => setForm((f) => ({ ...f, examine_par_specialiste_type: e.target.value }))} style={inputStyle} />
        )}

        <label style={{ fontSize: 12.5, color: '#334155' }}>
          <input type="checkbox" checked={form.certificat_delivre_par_specialiste} onChange={(e) => setForm((f) => ({ ...f, certificat_delivre_par_specialiste: e.target.checked }))} /> Certificat délivré par spécialiste
        </label>
        {form.certificat_delivre_par_specialiste && (
          <input placeholder="Type spécialiste *" value={form.certificat_delivre_par_specialiste_type} onChange={(e) => setForm((f) => ({ ...f, certificat_delivre_par_specialiste_type: e.target.value }))} style={inputStyle} />
        )}

        <label style={{ fontSize: 12.5, color: '#334155' }}>
          <input type="checkbox" checked={form.inapte_conduite} onChange={(e) => setForm((f) => ({ ...f, inapte_conduite: e.target.checked }))} /> Inapte à la conduite
        </label>
        {form.inapte_conduite && (
          <input placeholder="Raison inaptitude *" value={form.inapte_conduite_raison} onChange={(e) => setForm((f) => ({ ...f, inapte_conduite_raison: e.target.value }))} style={inputStyle} />
        )}
      </div>

      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        Auto backend: nom/prénom, date naissance, lieu naissance, adresse résidence.
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          {editingId ? 'Enregistrer modification' : 'Créer certificat'}
        </button>
        <PrintCertificatPermis certificat={{ ...selectedForPrint, nom_prenom: patientNom }} medecin={medecin} siteConfig={siteConfig} />
      </div>
    </div>
  );
}

function FormPrenuptial({ consultationId, medecin, patientNom, siteConfig }) {
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    cin_delivree_a: '',
    cin_date: '',
    numero_adresse_medecin: '',
    ville_medecin: '',
    gouvernorat_medecin: '',
    numero_ordre_medecin: '',
    specialite_medecin: '',
    lieu_exercice_medecin: '',
    lieu_signature: '',
    groupe_sanguin_fait: false,
    hepatite_b_fait: false,
    hepatite_c_fait: false,
    radio_thorax_fait: false,
    autres_examens: '',
  });

  const labelStyle = { fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, display: 'block' };
  const readonlyStyle = {
    ...inputStyle,
    background: '#f8fafc',
    color: '#334155',
  };
  const fmt = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('fr-FR');
  };

  const autoFields = useMemo(() => ({
    nom_prenom: selectedForPrint?.nom_prenom || patientNom || '—',
    nom_prenom_medecin: selectedForPrint?.nom_prenom_medecin || medecin?.nom || medecin?.username || '—',
    date_naissance: selectedForPrint?.date_naissance || '—',
    lieu_naissance: selectedForPrint?.lieu_naissance || '—',
    cin: selectedForPrint?.cin || '—',
    adresse_patient: selectedForPrint?.adresse_patient || '—',
    date_emission: selectedForPrint?.date_emission || '—',
  }), [selectedForPrint, patientNom, medecin]);

  const formatApiError = (e) => {
    const data = e?.response?.data;
    if (!data) return 'Erreur de sauvegarde.';
    if (typeof data === 'string') return data;
    if (data.detail && typeof data.detail === 'string') return data.detail;

    return Object.entries(data)
      .map(([field, msg]) => {
        const text = Array.isArray(msg) ? msg.join(', ') : String(msg);
        return `${field}: ${text}`;
      })
      .join(' | ');
  };

  const load = useCallback(async () => {
    if (!consultationId) return;
    const data = await getCertificatsPrenuptialByConsultation(consultationId);
    setList(data);
    if (data.length > 0) setSelectedForPrint(data[0]);
  }, [consultationId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    const beforeIds = new Set((list || []).map((x) => x.id));

    if (!form.numero_ordre_medecin || !form.specialite_medecin || !form.lieu_exercice_medecin || !form.numero_adresse_medecin || !form.ville_medecin || !form.gouvernorat_medecin) {
      setError('Veuillez remplir les champs obligatoires: N° ordre, spécialité, lieu exercice, numéro adresse médecin, ville (rue), gouvernorat.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        consultation: consultationId,
        adresse_medecin: form.numero_adresse_medecin.trim(),
        ville_medecin: form.ville_medecin.trim(),
        gouvernorat_medecin: form.gouvernorat_medecin.trim(),
        numero_ordre_medecin: form.numero_ordre_medecin.trim(),
        specialite_medecin: form.specialite_medecin.trim(),
        lieu_exercice_medecin: form.lieu_exercice_medecin.trim(),
        groupe_sanguin_fait: !!form.groupe_sanguin_fait,
        hepatite_b_fait: !!form.hepatite_b_fait,
        hepatite_c_fait: !!form.hepatite_c_fait,
        radio_thorax_fait: !!form.radio_thorax_fait,
        autres_examens: form.autres_examens?.trim() || '',
      };

      if (form.cin_delivree_a?.trim()) payload.cin_delivree_a = form.cin_delivree_a.trim();
      if (form.cin_date) payload.cin_date = form.cin_date;
      payload.lieu_signature = form.lieu_signature?.trim() || form.ville_medecin.trim();

      const saved = editingId
        ? await updateCertificatPrenuptial(editingId, payload)
        : await creerCertificatPrenuptial(payload);
      setSelectedForPrint(saved);
      setEditingId(null);
      if (!editingId) {
        setForm((f) => ({
          ...f,
          cin_delivree_a: '',
          cin_date: '',
          lieu_signature: '',
          groupe_sanguin_fait: false,
          hepatite_b_fait: false,
          hepatite_c_fait: false,
          radio_thorax_fait: false,
          autres_examens: '',
        }));
      }
      await load();
    } catch (e) {
      // Certains backends peuvent créer l'enregistrement puis retourner 400/500.
      // On recharge la liste et, si un nouvel id apparaît, on considère la création réussie.
      if (!editingId && [400, 500].includes(e?.response?.status)) {
        try {
          const data = await getCertificatsPrenuptialByConsultation(consultationId);
          setList(data);
          if (data.length > 0) setSelectedForPrint(data[0]);
          const createdAnyway = data.some((x) => !beforeIds.has(x.id));
          if (createdAnyway) {
            setError('');
            setForm((f) => ({
              ...f,
              cin_delivree_a: '',
              cin_date: '',
              lieu_signature: '',
              groupe_sanguin_fait: false,
              hepatite_b_fait: false,
              hepatite_c_fait: false,
              radio_thorax_fait: false,
              autres_examens: '',
            }));
            return;
          }
        } catch (_) {
          // ignore fallback fetch errors and show original error
        }
      }

      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ExistingList
        list={list}
        title="Certificats existants"
        onEdit={(c) => {
          setEditingId(c.id);
          setSelectedForPrint(c);
          setForm({
            cin_delivree_a: c.cin_delivree_a || '',
            cin_date: (c.cin_date || '').slice(0, 10),
            numero_adresse_medecin: c.numero_adresse_medecin || c.adresse_medecin || '',
            ville_medecin: c.ville_medecin || '',
            gouvernorat_medecin: c.gouvernorat_medecin || '',
            numero_ordre_medecin: c.numero_ordre_medecin || '',
            specialite_medecin: c.specialite_medecin || '',
            lieu_exercice_medecin: c.lieu_exercice_medecin || '',
            lieu_signature: c.lieu_signature || '',
            groupe_sanguin_fait: !!c.groupe_sanguin_fait,
            hepatite_b_fait: !!c.hepatite_b_fait,
            hepatite_c_fait: !!c.hepatite_c_fait,
            radio_thorax_fait: !!c.radio_thorax_fait,
            autres_examens: c.autres_examens || '',
          });
        }}
        formatItem={(c) => `${c.nom_prenom || '—'} — ${c.cin || '—'}`}
      />

      <div style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>Champs auto-remplis (lecture seule)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Nom et prénom</label>
            <input value={autoFields.nom_prenom} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={labelStyle}>Nom et prénom médecin</label>
            <input value={autoFields.nom_prenom_medecin} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date de naissance</label>
            <input value={fmt(autoFields.date_naissance)} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={labelStyle}>Lieu de naissance</label>
            <input value={autoFields.lieu_naissance} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={labelStyle}>CIN</label>
            <input value={autoFields.cin} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={labelStyle}>Adresse patient</label>
            <input value={autoFields.adresse_patient} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date émission</label>
            <input value={fmt(autoFields.date_emission)} readOnly style={readonlyStyle} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Champs à saisir manuellement</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>CIN délivrée à (optionnel)</label>
            <input value={form.cin_delivree_a} onChange={(e) => setForm((f) => ({ ...f, cin_delivree_a: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date CIN (optionnel)</label>
            <input type="date" value={form.cin_date} onChange={(e) => setForm((f) => ({ ...f, cin_date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Numéro adresse médecin *</label>
            <input value={form.numero_adresse_medecin} onChange={(e) => setForm((f) => ({ ...f, numero_adresse_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ville médecin (rue) *</label>
            <input value={form.ville_medecin} onChange={(e) => setForm((f) => ({ ...f, ville_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Gouvernorat médecin *</label>
            <input value={form.gouvernorat_medecin} onChange={(e) => setForm((f) => ({ ...f, gouvernorat_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>N° ordre médecin *</label>
            <input value={form.numero_ordre_medecin} onChange={(e) => setForm((f) => ({ ...f, numero_ordre_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Spécialité médecin *</label>
            <input value={form.specialite_medecin} onChange={(e) => setForm((f) => ({ ...f, specialite_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Lieu exercice médecin (exerçant à) *</label>
            <input value={form.lieu_exercice_medecin} onChange={(e) => setForm((f) => ({ ...f, lieu_exercice_medecin: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Lieu signature (optionnel)</label>
            <input value={form.lieu_signature} onChange={(e) => setForm((f) => ({ ...f, lieu_signature: e.target.value }))} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Examens (cases à cocher)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <label><input type="checkbox" checked={form.groupe_sanguin_fait} onChange={(e) => setForm((f) => ({ ...f, groupe_sanguin_fait: e.target.checked }))} /> Groupe sanguin fait</label>
          <label><input type="checkbox" checked={form.hepatite_b_fait} onChange={(e) => setForm((f) => ({ ...f, hepatite_b_fait: e.target.checked }))} /> Hépatite B faite</label>
          <label><input type="checkbox" checked={form.hepatite_c_fait} onChange={(e) => setForm((f) => ({ ...f, hepatite_c_fait: e.target.checked }))} /> Hépatite C faite</label>
          <label><input type="checkbox" checked={form.radio_thorax_fait} onChange={(e) => setForm((f) => ({ ...f, radio_thorax_fait: e.target.checked }))} /> Radio thorax faite</label>
        </div>

        <label style={labelStyle}>Autres examens (optionnel)</label>
        <textarea value={form.autres_examens} onChange={(e) => setForm((f) => ({ ...f, autres_examens: e.target.value }))} rows={3} style={{ ...inputStyle, marginBottom: 0, resize: 'vertical' }} />
      </div>

      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        Champs backend couverts: consultation, nom_prenom, nom_prenom_medecin, date_naissance, lieu_naissance, cin, cin_delivree_a, cin_date, adresse_patient, numero_adresse_medecin, ville_medecin, gouvernorat_medecin, numero_ordre_medecin, specialite_medecin, lieu_exercice_medecin, lieu_signature, groupe_sanguin_fait, hepatite_b_fait, hepatite_c_fait, radio_thorax_fait, autres_examens, date_emission.
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          {editingId ? 'Enregistrer modification' : 'Créer certificat'}
        </button>
        <PrintCertificatPrenuptial certificat={{ ...selectedForPrint, nom_prenom: patientNom }} medecin={medecin} siteConfig={siteConfig} />
      </div>
    </div>
  );
}

function FormAptitudeGenerale({ consultationId, medecin, patientNom, siteConfig }) {
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    est_bonne_sante: false,
    indemne_pathologie_contagieuse: false,
    apte_sport: false,
    apte_collectivite: false,
  });

  const readonlyStyle = {
    ...inputStyle,
    background: '#f8fafc',
    color: '#334155',
  };

  const fmt = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('fr-FR');
  };

  const autoFields = useMemo(() => ({
    nom_prenom_patient: selectedForPrint?.nom_prenom_patient || patientNom || '—',
    date_naissance: selectedForPrint?.date_naissance || '—',
    nom_prenom_medecin: selectedForPrint?.nom_prenom_medecin || medecin?.nom || medecin?.username || '—',
    date_emission: selectedForPrint?.date_emission || '—',
  }), [selectedForPrint, patientNom, medecin]);

  const load = useCallback(async () => {
    if (!consultationId) return;
    const data = await getCertificatsAptitudeGeneraleByConsultation(consultationId);
    setList(data);
    if (data.length > 0) {
      setSelectedForPrint(data[0]);
    }
  }, [consultationId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        consultation: consultationId,
        est_bonne_sante: !!form.est_bonne_sante,
        indemne_pathologie_contagieuse: !!form.indemne_pathologie_contagieuse,
        apte_sport: !!form.apte_sport,
        apte_collectivite: !!form.apte_collectivite,
      };

      const saved = editingId
        ? await updateCertificatAptitudeGenerale(editingId, payload)
        : await creerCertificatAptitudeGenerale(payload);

      setSelectedForPrint(saved);
      setEditingId(null);
      await load();
    } catch (e) {
      const data = e?.response?.data;
      if (typeof data === 'string') setError(data);
      else if (data?.detail) setError(data.detail);
      else if (data && typeof data === 'object') {
        setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' | '));
      } else {
        setError('Erreur de sauvegarde.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ExistingList
        list={list}
        title="Certificats existants"
        onEdit={(c) => {
          setEditingId(c.id);
          setSelectedForPrint(c);
          setForm({
            est_bonne_sante: !!c.est_bonne_sante,
            indemne_pathologie_contagieuse: !!c.indemne_pathologie_contagieuse,
            apte_sport: !!c.apte_sport,
            apte_collectivite: !!c.apte_collectivite,
          });
        }}
        formatItem={(c) => `${c.nom_prenom_patient || '—'} — ${fmt(c.date_emission)}`}
      />

      <div style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>Champs auto-remplis (lecture seule)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, display: 'block' }}>Nom patient</label>
            <input value={autoFields.nom_prenom_patient} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, display: 'block' }}>Date naissance</label>
            <input value={fmt(autoFields.date_naissance)} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, display: 'block' }}>Médecin</label>
            <input value={autoFields.nom_prenom_medecin} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 4, display: 'block' }}>Date émission</label>
            <input value={fmt(autoFields.date_emission)} readOnly style={readonlyStyle} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: 'white' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>Conditions d'aptitude</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label><input type="checkbox" checked={form.est_bonne_sante} onChange={(e) => setForm((f) => ({ ...f, est_bonne_sante: e.target.checked }))} /> En bonne santé clinique</label>
          <label><input type="checkbox" checked={form.indemne_pathologie_contagieuse} onChange={(e) => setForm((f) => ({ ...f, indemne_pathologie_contagieuse: e.target.checked }))} /> Indemne de pathologie contagieuse</label>
          <label><input type="checkbox" checked={form.apte_sport} onChange={(e) => setForm((f) => ({ ...f, apte_sport: e.target.checked }))} /> Apte pour pratiquer le sport</label>
          <label><input type="checkbox" checked={form.apte_collectivite} onChange={(e) => setForm((f) => ({ ...f, apte_collectivite: e.target.checked }))} /> Apte à être en collectivité</label>
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', fontSize: 12.5, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '9px 14px', border: 'none', borderRadius: 8, background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          {editingId ? 'Enregistrer modification' : 'Créer certificat'}
        </button>
        <PrintCertificatAptitudeGenerale certificat={{ ...selectedForPrint, nom_prenom_patient: patientNom }} medecin={medecin} siteConfig={siteConfig} />
      </div>
    </div>
  );
}

export default function TabCertificatsMedicaux({ item }) {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState('bonne-sante');
  const consultationId = item?.consultation?.id;
  const printSiteContext = useMemo(() => {
    const consultationSite = item?.consultation?.site_details || item?.consultation?.site || item?.site || null;
    return {
      ...user,
      ...item?.consultation,
      site: consultationSite,
      site_id: consultationSite?.id ?? consultationSite?.site_id ?? item?.consultation?.site_id ?? user?.site_id ?? null,
      site_nom: consultationSite?.nom ?? consultationSite?.site_nom ?? item?.consultation?.site_nom ?? user?.site_nom ?? '',
    };
  }, [item, user]);

  const getNomPatient = (itm) => {
    if (!itm) return 'Patient';
    return itm.collaborateur_nom ||
      (itm.collaborateur && typeof itm.collaborateur === 'object'
        ? `${itm.collaborateur.nom || ''} ${itm.collaborateur.prenom || ''}`.trim()
        : `Patient #${itm.collaborateur || ''}`);
  };

  const medecin = useMemo(() => ({
    nom: user?.full_name || user?.nom || user?.username || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Médecin',
    username: user?.username || '',
  }), [user]);

  const patientNom = useMemo(() => getNomPatient(item), [item]);

  if (!consultationId) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        background: '#fff7ed',
        border: '1.5px dashed #fed7aa',
        borderRadius: 12,
        color: '#92400e',
      }}>
        <p style={{ fontWeight: 700 }}>Consultation requise</p>
        <p style={{ fontSize: 13, marginTop: 6, color: '#b45309' }}>
          Créez d'abord une consultation pour émettre des certificats médicaux.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SubTabBtn active={subTab === 'aptitude'} onClick={() => setSubTab('aptitude')}>Aptitude générale</SubTabBtn>
        <SubTabBtn active={subTab === 'bonne-sante'} onClick={() => setSubTab('bonne-sante')}>Bonne santé</SubTabBtn>
        <SubTabBtn active={subTab === 'exemption'} onClick={() => setSubTab('exemption')}>Exemption</SubTabBtn>
        <SubTabBtn active={subTab === 'permis'} onClick={() => setSubTab('permis')}>Permis conduire</SubTabBtn>
        <SubTabBtn active={subTab === 'prenuptial'} onClick={() => setSubTab('prenuptial')}>Prénuptial</SubTabBtn>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 14 }}>
        {subTab === 'aptitude' && (
          <FormAptitudeGenerale consultationId={consultationId} medecin={medecin} patientNom={patientNom} siteConfig={printSiteContext} />
        )}
        {subTab === 'bonne-sante' && (
          <FormBonneSante consultationId={consultationId} medecin={medecin} patientNom={patientNom} siteConfig={printSiteContext} />
        )}
        {subTab === 'exemption' && (
          <FormExemption consultationId={consultationId} medecin={medecin} patientNom={patientNom} siteConfig={printSiteContext} />
        )}
        {subTab === 'permis' && (
          <FormPermis consultationId={consultationId} medecin={medecin} patientNom={patientNom} siteConfig={printSiteContext} />
        )}
        {subTab === 'prenuptial' && (
          <FormPrenuptial consultationId={consultationId} medecin={medecin} patientNom={patientNom} siteConfig={printSiteContext} />
        )}
      </div>
    </div>
  );
}
