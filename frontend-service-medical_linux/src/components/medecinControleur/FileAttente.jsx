// src/components/medecinControleur/Fileattente.jsx
import { useState } from 'react';
import ListesDuJour from './ListesDuJour';
import DetailListe from './DetailListe';

export default function Fileattente({ items = [], onUpdateItem }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: 20,
      }}
    >
      {/* Colonne gauche — Liste */}
      <div style={{ minHeight: 0 }}>
        <ListesDuJour items={items} selectedItem={selectedItem} onSelect={setSelectedItem} />
      </div>

      {/* Colonne droite — Détail */}
      <div style={{ minHeight: 0 }}>
        <DetailListe item={selectedItem} onUpdateItem={onUpdateItem} />
      </div>
    </div>
  );
}
