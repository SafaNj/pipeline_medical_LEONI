import { useState } from 'react';
import CreerConsultation from './CreerConsultation';
import CreerOrdonnance   from './CreerOrdonnance';
import CreerCertificat   from './CreerCertificat';
import PrintOrdonnance from './Printordonnance';
import PrintCertificatMedical from './Printcertificatmedical';
import { useAuth } from '../../context/AuthContext';

const sessLabel = (s) =>
  ({ MATIN: '☀️ Matin', MIDI: '🌤 Midi', APRES_MIDI: '🌆 Après-midi' }[s] || s);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }) : '—';

const fmtDatetime = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }) : '—';

/* ── Badge statut item ── */
function StatusBadge({ statut }) {
  const cfg = {
    EN_ATTENTE: { bg: '#fff7ed', color: '#c2410c', text: 'En attente' },
    EFFECTUEE:  { bg: '#dcfce7', color: '#15803d', text: 'Effectué'   },
    ANNULEE:    { bg: '#fee2e2', color: '#b91c1c', text: 'Annulé'     },
  }[statut] || { bg: '#f1f5f9', color: '#475569', text: statut };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {cfg.text}
    </span>
  );
}

/* ── Carte consultation déjà créée ── */
function ConsultationCard({ consultation, onConsultationUpdated, onOrdonnanceAdded, onOrdonnanceUpdated, onCertificatAdded, onCertificatUpdated }) {
  const { user } = useAuth();
  const [showOrdonnance,  setShowOrdonnance]  = useState(false);
  const [showCertificat,  setShowCertificat]  = useState(false);
  const [showEditConsult, setShowEditConsult] = useState(false);
  const [editOrdonnance,  setEditOrdonnance]  = useState(null);
  const [editCertificat,  setEditCertificat]  = useState(null);

  const medecin = {
    nom:        user?.full_name || user?.nom || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    titre:      user?.titre      || 'Docteur',
    specialite: user?.specialite || 'Médecine Générale',
    ville:      user?.ville      || 'Menzel Hayet',
  };

  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      borderRadius: 12, padding: '14px 16px', marginTop: 10,
    }}>
      {/* Diagnostic */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        ✓ Consultation effectuée
      </div>
      <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.6, marginBottom: 10 }}>
        {consultation.diagnostic}
      </div>

      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => setShowEditConsult(true)}
          style={{
            padding: '6px 14px', border: '1.5px solid #60a5fa',
            borderRadius: 8, background: 'white', color: '#2563eb',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Modifier consultation
        </button>
      </div>

      {/* Ordonnances existantes */}
      {consultation.ordonnances?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {consultation.ordonnances.map(o => (
            <div key={o.id} style={{
              background: 'white', border: '1px solid #d1fae5',
              borderRadius: 8, padding: '8px 12px', marginBottom: 6,
              fontSize: 12.5, color: '#065f46',
            }}>
               <strong>Ordonnance</strong> — {fmtDatetime(o.date_emission)}
              <div style={{ color: '#374151', marginTop: 4, whiteSpace: 'pre-line' }}>
                {o.medicaments}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <button
                  onClick={() => setEditOrdonnance(o)}
                  style={{
                    padding: '5px 10px', border: '1.5px solid #22c55e',
                    borderRadius: 7, background: 'white', color: '#16a34a',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Modifier
                </button>
                <PrintOrdonnance
                  medecin={medecin}
                  data={{
                    patientNom: consultation.collaborateur_nom || '',
                    patientCin: consultation.collaborateur_cin || '',
                    lignes: String(o.medicaments || '').split('\n').map(l => l.trim()).filter(Boolean).map(texte => ({ texte })),
                  }}
                  siteConfig={consultation}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificats existants */}
      {consultation.certificats?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {consultation.certificats.map(c => (
            <div key={c.id} style={{
              background: 'white', border: '1px solid #e9d5ff',
              borderRadius: 8, padding: '8px 12px', marginBottom: 6,
              fontSize: 12.5, color: '#6d28d9',
            }}>
               <strong>Certificat</strong> — {c.jours_repos} jour{c.jours_repos > 1 ? 's' : ''} de repos à partir du{' '}
              {new Date(c.date_debut_repos).toLocaleDateString('fr-FR')}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <button
                  onClick={() => setEditCertificat(c)}
                  style={{
                    padding: '5px 10px', border: '1.5px solid #a78bfa',
                    borderRadius: 7, background: 'white', color: '#7c3aed',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Modifier
                </button>
                <PrintCertificatMedical
                  medecin={medecin}
                  data={{
                    patientNom: consultation.collaborateur_nom || '',
                    patientCin: consultation.collaborateur_cin || '',
                    jours: Number(c.jours_repos || 0),
                    dateDebut: c.date_debut_repos,
                  }}
                  siteConfig={consultation}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Boutons ajouter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowOrdonnance(true)}
          style={{
            padding: '6px 14px', border: '1.5px solid #22c55e',
            borderRadius: 8, background: 'white', color: '#16a34a',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
           Ajouter ordonnance
        </button>
        <button
          onClick={() => setShowCertificat(true)}
          style={{
            padding: '6px 14px', border: '1.5px solid #a78bfa',
            borderRadius: 8, background: 'white', color: '#7c3aed',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
           Ajouter certificat
        </button>
      </div>

      {/* Modals */}
      {showOrdonnance && (
        <CreerOrdonnance
          consultation={consultation}
          onCreated={(o) => { onOrdonnanceAdded(o); setShowOrdonnance(false); }}
          onClose={() => setShowOrdonnance(false)}
        />
      )}
      {showCertificat && (
        <CreerCertificat
          consultation={consultation}
          onCreated={(c) => { onCertificatAdded(c); setShowCertificat(false); }}
          onClose={() => setShowCertificat(false)}
        />
      )}

      {showEditConsult && (
        <CreerConsultation
          item={{ ...consultation, collaborateur: consultation.collaborateur, collaborateur_nom: consultation.collaborateur_nom }}
          mode="edit"
          initialConsultation={consultation}
          onCreated={(c) => { onConsultationUpdated(c); setShowEditConsult(false); }}
          onClose={() => setShowEditConsult(false)}
        />
      )}

      {editOrdonnance && (
        <CreerOrdonnance
          consultation={consultation}
          mode="edit"
          initialOrdonnance={editOrdonnance}
          onCreated={(o) => { onOrdonnanceUpdated(o); setEditOrdonnance(null); }}
          onClose={() => setEditOrdonnance(null)}
        />
      )}

      {editCertificat && (
        <CreerCertificat
          consultation={consultation}
          mode="edit"
          initialCertificat={editCertificat}
          onCreated={(c) => { onCertificatUpdated(c); setEditCertificat(null); }}
          onClose={() => setEditCertificat(null)}
        />
      )}
    </div>
  );
}

/* ── Item row ── */
function ItemRow({ item, onConsultationCreated, onConsultationUpdated, onOrdonnanceAdded, onOrdonnanceUpdated, onCertificatAdded, onCertificatUpdated }) {
  const [showCreer, setShowCreer] = useState(false);

  const nom = item.collaborateur_nom ||
    (item.collaborateur && typeof item.collaborateur === 'object'
      ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
      : `Collaborateur #${item.collaborateur}`);

  const initials = nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const consultation = item.consultation || null;

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12, marginBottom: 8,
      background: item.statut === 'EFFECTUEE' ? '#f0fdf4' : '#f8fafc',
      border: `1px solid ${item.statut === 'EFFECTUEE' ? '#bbf7d0' : '#f1f5f9'}`,
    }}>
      {/* Ligne principale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        {/* Ordre */}
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: '#e2e8f0', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#475569',
        }}>
          {item.ordre ?? '—'}
        </span>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: item.statut === 'EFFECTUEE'
            ? 'linear-gradient(135deg,#22c55e,#16a34a)'
            : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 12, fontWeight: 800,
        }}>
          {initials}
        </div>

        {/* Nom + motif */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{nom}</div>
          {item.motif && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{item.motif}</div>
          )}
        </div>

        <StatusBadge statut={item.statut} />

        {/* Bouton consulter (seulement EN_ATTENTE et pas encore de consultation) */}
        {item.statut === 'EN_ATTENTE' && !consultation && (
          <button
            onClick={() => setShowCreer(true)}
            style={{
              padding: '7px 14px', background: '#2563eb',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Consulter
          </button>
        )}
      </div>

      {/* Carte consultation si existante */}
      {consultation && (
        <ConsultationCard
          consultation={consultation}
          onConsultationUpdated={onConsultationUpdated}
          onOrdonnanceAdded={onOrdonnanceAdded}
          onOrdonnanceUpdated={onOrdonnanceUpdated}
          onCertificatAdded={onCertificatAdded}
          onCertificatUpdated={onCertificatUpdated}
        />
      )}

      {/* Modal créer consultation */}
      {showCreer && (
        <CreerConsultation
          item={item}
          onCreated={(c) => { onConsultationCreated(item.id, c); setShowCreer(false); }}
          onClose={() => setShowCreer(false)}
        />
      )}
    </div>
  );
}

/* ── COMPOSANT PRINCIPAL ── */
export default function DetailListe({ liste, onUpdate }) {
  if (!liste) {
    return (
      <div style={{
        height: '100%', background: 'white', borderRadius: 16,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none"
          stroke="#e2e8f0" strokeWidth="1.3" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="8" y1="9"  x2="16" y2="9"  />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="11" y2="17" />
        </svg>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>
          Sélectionnez une liste pour commencer
        </p>
      </div>
    );
  }

  const items     = liste.items || [];
  const enAttente = items.filter(i => i.statut === 'EN_ATTENTE').length;
  const effectues = items.filter(i => i.statut === 'EFFECTUEE').length;
  const total     = items.length;
  const pct       = total ? Math.round(effectues / total * 100) : 0;

  /* Quand une consultation est créée → marque item EFFECTUEE + attache consultation */
  const handleConsultationCreated = (itemId, consultation) => {
    const newItems = items.map(i =>
      i.id === itemId
        ? { ...i, statut: 'EFFECTUEE', consultation }
        : i
    );
    onUpdate({ ...liste, items: newItems });
  };

  const handleConsultationUpdated = (itemId, consultation) => {
    const newItems = items.map(i => {
      if (i.id !== itemId || !i.consultation) return i;
      return {
        ...i,
        consultation: { ...i.consultation, ...consultation },
      };
    });
    onUpdate({ ...liste, items: newItems });
  };

  /* Quand une ordonnance est ajoutée → l'ajoute dans consultation.ordonnances */
  const handleOrdonnanceAdded = (itemId, ordonnance) => {
    const newItems = items.map(i => {
      if (i.id !== itemId || !i.consultation) return i;
      return {
        ...i,
        consultation: {
          ...i.consultation,
          ordonnances: [...(i.consultation.ordonnances || []), ordonnance],
        },
      };
    });
    onUpdate({ ...liste, items: newItems });
  };

  const handleOrdonnanceUpdated = (itemId, ordonnance) => {
    const newItems = items.map(i => {
      if (i.id !== itemId || !i.consultation) return i;
      return {
        ...i,
        consultation: {
          ...i.consultation,
          ordonnances: (i.consultation.ordonnances || []).map((o) => (o.id === ordonnance.id ? { ...o, ...ordonnance } : o)),
        },
      };
    });
    onUpdate({ ...liste, items: newItems });
  };

  /* Quand un certificat est ajouté → l'ajoute dans consultation.certificats */
  const handleCertificatAdded = (itemId, certificat) => {
    const newItems = items.map(i => {
      if (i.id !== itemId || !i.consultation) return i;
      return {
        ...i,
        consultation: {
          ...i.consultation,
          certificats: [...(i.consultation.certificats || []), certificat],
        },
      };
    });
    onUpdate({ ...liste, items: newItems });
  };

  const handleCertificatUpdated = (itemId, certificat) => {
    const newItems = items.map(i => {
      if (i.id !== itemId || !i.consultation) return i;
      return {
        ...i,
        consultation: {
          ...i.consultation,
          certificats: (i.consultation.certificats || []).map((c) => (c.id === certificat.id ? { ...c, ...certificat } : c)),
        },
      };
    });
    onUpdate({ ...liste, items: newItems });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'white', borderRadius: 16,
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '20px 22px 14px',
        borderBottom: '1px solid #f1f5f9', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 12,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              🩺 Consultation
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3, textTransform: 'capitalize' }}>
              {fmtDate(liste.date)} • {sessLabel(liste.session)}
            </p>
            {liste.medecin_nom && (
              <p style={{ fontSize: 12.5, color: '#3b82f6', marginTop: 3, fontWeight: 600 }}>
                👨‍⚕️ {liste.medecin_nom}
              </p>
            )}
          </div>
          <span style={{
            background: liste.statut === 'ACTIVE' ? '#dbeafe' : '#f1f5f9',
            color: liste.statut === 'ACTIVE' ? '#1d4ed8' : '#475569',
            fontSize: 11, fontWeight: 700,
            padding: '3px 9px', borderRadius: 20,
          }}>
            {liste.statut === 'ACTIVE' ? 'Active' : 'En préparation'}
          </span>
        </div>

        {/* Compteurs + barre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {[
            { lbl: 'Total',      val: total,     color: '#475569' },
            { lbl: 'En attente', val: enAttente,  color: '#d97706' },
            { lbl: 'Consultés',  val: effectues,  color: '#16a34a' },
          ].map(m => (
            <div key={m.lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.val}</span>
              <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{m.lbl}</span>
            </div>
          ))}
          {total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 100 }}>
              <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 3,
                  background: pct === 100 ? '#16a34a' : '#3b82f6',
                  transition: 'width .4s',
                }} />
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{pct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Liste items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 18px' }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            background: '#f8fafc', borderRadius: 12,
            border: '1.5px dashed #e2e8f0',
          }}>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Aucun patient dans cette liste</p>
          </div>
        ) : (
          // Afficher EN_ATTENTE en premier, puis EFFECTUEE
          [...items]
            .sort((a, b) => {
              if (a.statut === 'EN_ATTENTE' && b.statut !== 'EN_ATTENTE') return -1;
              if (a.statut !== 'EN_ATTENTE' && b.statut === 'EN_ATTENTE') return 1;
              return (a.ordre ?? 0) - (b.ordre ?? 0);
            })
            .map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onConsultationCreated={handleConsultationCreated}
                onConsultationUpdated={(c) => handleConsultationUpdated(item.id, c)}
                onOrdonnanceAdded={(o) => handleOrdonnanceAdded(item.id, o)}
                onOrdonnanceUpdated={(o) => handleOrdonnanceUpdated(item.id, o)}
                onCertificatAdded={(c) => handleCertificatAdded(item.id, c)}
                onCertificatUpdated={(c) => handleCertificatUpdated(item.id, c)}
              />
            ))
        )}
      </div>
    </div>
  );
}