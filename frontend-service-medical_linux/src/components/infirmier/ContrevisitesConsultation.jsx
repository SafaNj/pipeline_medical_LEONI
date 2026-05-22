// src/components/infirmier/ContrevisitesConsultation.jsx
import { useState, useEffect } from 'react';
import { getContreVisitesPourConsultation } from '../../api/Contrevisiteapi';
import SuiviContreVisitesView from '../medecinControleur/SuiviView';

export default function ContrevisitesConsultation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getContreVisitesPourConsultation()
      .then((rows) =>
        setData(
          (rows || []).map((cv) => ({
            ...cv,
            date: cv.date || cv.date_contre_visite,
          }))
        )
      )
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou matricule…"
          style={{
            flex: 1,
            padding: '9px 13px',
            border: '1.5px solid #bae6fd',
            borderRadius: 9,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>
      <SuiviContreVisitesView
        suivi={data}
        loading={loading}
        readOnly
        searchQuery={search}
        medecinNom={null}
        onDemandeExpertise={() => {}}
      />
    </div>
  );
}
