import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getNotificationsHSSE,
  marquerCommeLue,
  getEnqueteHSSE,
} from '../../api/hsseNotificationsApi';
import { buildEnqueteHtml } from '../infirmier/PrintEnquete';
import { printHTML } from '../../utils/printHelper';

const P = {
  blue900: '#0c4a6e',
  blue700: '#0369a1',
  blue500: '#0ea5e9',
  blue50: '#f0f9ff',
  red: '#ef4444',
  redBg: '#fef2f2',
  green: '#22c55e',
  greenBg: '#f0fdf4',
  text: '#0f172a',
  text2: '#334155',
  muted: '#94a3b8',
  border: '#e2e8f0',
  white: '#ffffff',
};

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
};

const fmtDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR');
};

const isReadNotification = (n) => Boolean(n?.lu ?? n?.est_lu ?? n?.is_read ?? n?.read_at ?? n?.date_lecture);

const getAccidentIdFromNotif = (n) => n?.accident_id ?? n?.accident?.id ?? n?.accident ?? null;

function buildAccidentFromNotification(notification, fallbackInfirmierNom) {
  const a = notification?.accident ?? {};
  const collab = notification?.collaborateur ?? {};

  return {
    id: getAccidentIdFromNotif(notification),
    collaborateur_nom:
      a.collaborateur_nom ||
      notification?.collaborateur_nom ||
      notification?.nom_collaborateur ||
      collab.nom_complet ||
      collab.nom ||
      '—',
    collaborateur_matricule:
      a.collaborateur_matricule ||
      notification?.collaborateur_matricule ||
      notification?.matricule ||
      collab.matricule ||
      '',
    date_accident: a.date_accident || notification?.date_accident || notification?.accident_date || null,
    heure_accident: a.heure_accident || notification?.heure_accident || '',
    lieu_accident: a.lieu_accident || notification?.lieu_accident || '',
    siege_lesion: a.siege_lesion || notification?.siege_lesion || '',
    nature_lesion: a.nature_lesion || notification?.nature_lesion || '',
    infirmiere_nom: a.infirmiere_nom || notification?.infirmiere_nom || fallbackInfirmierNom || '—',
  };
}

export default function EnquetesHSSE({ onUnreadCountChange }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotificationsHSSE();
      const rows = Array.isArray(data) ? data : [];
      setItems(rows);
      if (onUnreadCountChange) {
        onUnreadCountChange(rows.filter((n) => !isReadNotification(n)).length);
      }
    } catch (e) {
      void e;
      setError('Impossible de charger les notifications d\'enquête.');
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleVoirEnquete = async (notification) => {
    const notifId = notification?.id;
    const accidentId = getAccidentIdFromNotif(notification);

    if (!accidentId) {
      setFeedback({ type: 'error', text: 'Accident introuvable pour cette notification.' });
      return;
    }

    setBusyId(notifId ?? accidentId);
    setFeedback(null);

    try {
      // Marquer comme lue si pas encore lu
      const alreadyRead = isReadNotification(notification);
      if (!alreadyRead && notifId != null) {
        await marquerCommeLue(notifId);
        setItems((prev) =>
          prev.map((n) =>
            n.id === notifId
              ? {
                  ...n,
                  lu: true,
                  est_lu: true,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : n,
          ),
        );
      }

      // Ouvrir le PDF
      const enquete = await getEnqueteHSSE(accidentId);
      const enqueteId = enquete?.id ?? enquete?.pk;

      if (!enquete || enqueteId == null) {
        setFeedback({ type: 'error', text: 'Aucune enquête enregistrée pour cet accident.' });
        return;
      }

      const accident = buildAccidentFromNotification(notification, user?.username || '—');
      printHTML(buildEnqueteHtml(accident, enquete, accident.infirmiere_nom || user?.username || '—'));

      // Mettre à jour le compteur
      if (onUnreadCountChange) {
        setItems((prev) => {
          const next = prev.map((n) => (n.id === notifId ? { ...n, lu: true, est_lu: true, is_read: true } : n));
          const nextUnreadCount = next.filter((n) => !isReadNotification(n)).length;
          queueMicrotask(() => onUnreadCountChange(nextUnreadCount));
          return next;
        });
      }
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setFeedback({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Impossible d\'ouvrir l\'enquête.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = items.filter((n) => !isReadNotification(n)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: P.white,
          border: `1px solid ${P.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: P.blue900, marginBottom: 4 }}>
            Enquêtes accidents de travail
          </div>
          <div style={{ fontSize: 12.5, color: P.text2 }}>
            {unreadCount > 0
              ? `${unreadCount} nouvelle(s) enquête(s) à consulter.`
              : 'Aucune nouvelle enquête non lue.'}
          </div>
        </div>
        <button
          type="button"
          onClick={loadNotifications}
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${P.blue500}55`,
            background: P.blue50,
            color: P.blue700,
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            background: feedback.type === 'success' ? P.greenBg : P.redBg,
            color: feedback.type === 'success' ? P.green : P.red,
            borderLeft: `3px solid ${feedback.type === 'success' ? P.green : P.red}`,
          }}
        >
          {feedback.text}
        </div>
      )}

      {error && (
        <div
          style={{
            background: P.redBg,
            borderLeft: `3px solid ${P.red}`,
            borderRadius: 8,
            padding: '11px 14px',
            fontSize: 12.5,
            color: '#7f1d1d',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: P.white,
          border: `1px solid ${P.border}`,
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,.05)',
          overflow: 'hidden',
        }}
      >
        {loading && items.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: P.muted }}>Chargement des notifications…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: P.muted }}>Aucune notification d'enquête.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Collaborateur', "Date accident", "Créée le", 'Statut', 'Action'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === 'Action' ? 'right' : 'left',
                      padding: '11px 12px',
                      fontSize: 10.5,
                      color: P.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '.5px',
                      borderBottom: `1px solid ${P.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((notification) => {
                const read = isReadNotification(notification);
                const notifId = notification?.id;
                const rowBg = read ? 'transparent' : P.blue50;
                const collabNom =
                  notification?.collaborateur_nom ||
                  notification?.nom_collaborateur ||
                  notification?.accident?.collaborateur_nom ||
                  notification?.collaborateur?.nom_complet ||
                  '—';
                const dateAccident =
                  notification?.date_accident ||
                  notification?.accident_date ||
                  notification?.accident?.date_accident ||
                  null;
                const dateCreation = notification?.created_at || notification?.date_creation || notification?.created || null;

                return (
                  <tr key={notifId ?? `${collabNom}-${dateCreation}`} style={{ background: rowBg }}>
                    <td
                      style={{
                        padding: '11px 12px',
                        color: P.text,
                        borderBottom: `1px solid ${P.border}`,
                        fontWeight: read ? 500 : 700,
                      }}
                    >
                      {collabNom}
                    </td>
                    <td style={{ padding: '11px 12px', color: P.text2, borderBottom: `1px solid ${P.border}` }}>
                      {fmtDate(dateAccident)}
                    </td>
                    <td style={{ padding: '11px 12px', color: P.text2, borderBottom: `1px solid ${P.border}` }}>
                      {fmtDateTime(dateCreation)}
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${P.border}` }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          color: read ? P.green : P.red,
                          background: read ? P.greenBg : P.redBg,
                        }}
                      >
                        {read ? 'Lue' : 'Non lue'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: `1px solid ${P.border}`, textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleVoirEnquete(notification)}
                        disabled={busyId === (notifId ?? getAccidentIdFromNotif(notification))}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: read ? `linear-gradient(135deg,${P.green},${P.green})` : `linear-gradient(135deg,${P.blue700},${P.blue500})`,
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: busyId === (notifId ?? getAccidentIdFromNotif(notification)) ? 'wait' : 'pointer',
                          opacity: busyId === (notifId ?? getAccidentIdFromNotif(notification)) ? 0.65 : 1,
                        }}
                      >
                        {busyId === (notifId ?? getAccidentIdFromNotif(notification)) ? 'Traitement…' : read ? 'Voir à nouveau' : 'Voir & Traiter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
