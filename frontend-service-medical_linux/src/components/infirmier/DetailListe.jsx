// src/components/infirmier/DetailListe.jsx
import { useState } from 'react';
import Swal from 'sweetalert2';
import { activerListe, terminerListe, getListeDetail, notifierItem } from '../../api/actInfirmierApi';
import { effectuerItem, annulerItem, supprimerItem } from '../../api/planningApi';
import AjouterItem from './AjouterItem';

const sessLabel = (s) =>
  ({ MATIN: 'Matin', MIDI: 'Midi', APRES_MIDI: 'Après-midi' }[s] || s);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';

/* ── Icônes SVG inline (color explicite) ── */
const IcoStethoscope = ({ c='#0f172a', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M4.5 9.5a5.5 5.5 0 0011 0v-3a1 1 0 00-1-1h-9a1 1 0 00-1 1v3z"/><path d="M10 9.5V17a4 4 0 008 0v-1"/><circle cx="18" cy="16" r="1.5" fill={c} stroke="none"/></svg>;
const IcoSearch      = ({ c='#0f172a', size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoUser        = ({ c='#3b82f6', size=12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoUsers       = ({ c='#cbd5e1', size=34 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoList        = ({ c='#e2e8f0', size=52 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.2" fill={c} stroke="none"/><circle cx="3" cy="12" r="1.2" fill={c} stroke="none"/><circle cx="3" cy="18" r="1.2" fill={c} stroke="none"/></svg>;
const IcoClose       = ({ c='#dc2626', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoTrash       = ({ c='#64748b', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
const IcoPlay        = ({ c='white', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoStop        = ({ c='white', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const IcoPhone       = ({ c='#94a3b8', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013 5.18 2 2 0 015 3h3a2 2 0 012 1.72c.12 1.27.37 2.51.73 3.7a2 2 0 01-.45 2.11L9.91 11.09a16 16 0 006 6l1.56-1.56a2 2 0 012.11-.45c1.19.36 2.43.61 3.7.73a2 2 0 011.72 2z"/></svg>;

function StatusBadge({ statut }) {
  const cfg = {
    EN_PREPARATION: { bg: '#f1f5f9', color: '#475569', text: 'En préparation' },
    ACTIVE:         { bg: '#dbeafe', color: '#1d4ed8', text: 'Active'         },
    TERMINEE:       { bg: '#dcfce7', color: '#15803d', text: 'Terminée'       },
    EN_ATTENTE:     { bg: '#ffedd5', color: '#c2410c', text: 'En attente'     },
    EFFECTUEE:      { bg: '#dcfce7', color: '#15803d', text: 'Effectuée'      },
    ANNULEE:        { bg: '#fee2e2', color: '#b91c1c', text: 'Annulée'        },
  }[statut] || { bg: '#f1f5f9', color: '#475569', text: statut };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {cfg.text}
    </span>
  );
}

function ActionBtn({ title, label, bgBase, bgHover, borderColor, textBase, textHover, iconBase, iconHover, onClick, disabled }) {
  const [hover, setHover] = useState(false);
  const active = hover && !disabled;
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 34,
        minWidth: 92,
        padding: '0 10px',
        borderRadius: 9,
        border: `1px solid ${borderColor}`,
        background: active ? bgHover : bgBase,
        color: active ? textHover : textBase,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'all .15s',
        fontSize: 12,
        fontWeight: 800,
        opacity: disabled ? 0.6 : 1,
      }}>
      {active ? iconHover : iconBase}
      <span>{label}</span>
    </button>
  );
}

function ItemRow({ item, editable, onEffectuer, onAnnuler, onSupprimer, onNotifier, itemError }) {
  const [busy, setBusy] = useState(false);
  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  const nom = item.collaborateur_nom ||
    (item.collaborateur && typeof item.collaborateur === 'object'
      ? `${item.collaborateur.nom} ${item.collaborateur.prenom}`.trim()
      : `Collaborateur #${item.collaborateur}`);
  const initials = nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const rowBg     = { EN_ATTENTE:'#f8fafc', EFFECTUEE:'#f0fdf4', ANNULEE:'#fef9f9' }[item.statut]||'#f8fafc';
  const rowBorder = { EN_ATTENTE:'#f1f5f9', EFFECTUEE:'#bbf7d0', ANNULEE:'#fecaca' }[item.statut]||'#f1f5f9';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, padding:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', borderRadius:12, marginBottom:0,
        background:rowBg, border:`1px solid ${rowBorder}`, opacity: busy ? 0.6 : 1, transition:'opacity .15s' }}>

        <span style={{ width:26, height:26, borderRadius:'50%', background:'#e2e8f0', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#475569' }}>
        {item.ordre ?? '—'}
      </span>

      <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
        background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:800 }}>
        {initials}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13.5, fontWeight:700, color:'#0f172a' }}>
          <span>{nom}</span>
          <span title={item.sms_envoye ? 'SMS envoyé' : 'SMS non envoyé'} style={{ display:'inline-flex', alignItems:'center' }}>
            <IcoPhone c={item.sms_envoye ? '#16a34a' : '#94a3b8'} size={14}/>
          </span>
        </div>
        {item.motif && <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{item.motif}</div>}
      </div>

      <StatusBadge statut={item.statut} />

      {editable && item.statut === 'EN_ATTENTE' && (
        <div style={{
          display:'flex',
          gap:8,
          flexShrink:0,
          alignItems:'center',
          marginLeft:8,
          padding:'4px 6px',
          borderRadius:10,
          border:'1px solid #dbeafe',
          background:'#f8fbff'
        }}>
          <ActionBtn
            title="Renvoi SMS manuel"
            label="Renvoi"
            bgBase="#e0f2fe"
            bgHover="#0ea5e9"
            borderColor="#7dd3fc"
            textBase="#0369a1"
            textHover="#ffffff"
            iconBase={<IcoPhone c="#0369a1" size={13}/>}
            iconHover={<IcoPhone c="white" size={13}/>}
            onClick={() => run(onNotifier)}
            disabled={busy}
          />
          <ActionBtn
            title="Annuler ce passage"
            label="Annuler"
            bgBase="#fef2f2"
            bgHover="#dc2626"
            borderColor="#fca5a5"
            textBase="#b91c1c"
            textHover="#ffffff"
            iconBase={<IcoClose c="#dc2626" size={13}/>}
            iconHover={<IcoClose c="white" size={13}/>}
            onClick={() => run(onAnnuler)}
            disabled={busy}
          />
          <ActionBtn
            title="Supprimer"
            label="Supprimer"
            bgBase="#f8fafc"
            bgHover="#475569"
            borderColor="#cbd5e1"
            textBase="#334155"
            textHover="#ffffff"
            iconBase={<IcoTrash c="#64748b" size={13}/>}
            iconHover={<IcoTrash c="white" size={13}/>}
            onClick={async () => {
              const r = await Swal.fire({
                icon: 'warning',
                title: 'Supprimer ce passage ?',
                text: 'Cette action retire le collaborateur de la liste.',
                showCancelButton: true,
                confirmButtonText: 'Supprimer',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                focusCancel: true,
              });
              if (r.isConfirmed) run(onSupprimer);
            }}
            disabled={busy}
          />
        </div>
      )}

      </div>
      {itemError && (
        <div style={{ margin:'0 14px 8px', color:'#b91c1c', fontSize:12, fontWeight:600 }}>
          {itemError}
        </div>
      )}
    </div>
  );
}

export default function DetailListe({ liste, onUpdate }) {
  const [busyStatut, setBusyStatut] = useState(false);
  const [errStatut,  setErrStatut]  = useState('');
  const [showActiverConfirm, setShowActiverConfirm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [itemErrors, setItemErrors] = useState({});

  if (!liste) {
    return (
      <div style={{ height:'100%', background:'white', borderRadius:16, border:'1px solid #f1f5f9',
        boxShadow:'0 1px 3px rgba(0,0,0,.06)', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:12 }}>
        <IcoList c="#e2e8f0" size={52}/>
        <p style={{ color:'#94a3b8', fontSize:15, margin:0 }}>Sélectionnez une liste pour voir le détail</p>
      </div>
    );
  }

  const editable = true;

  const toast = (text) => {
    if (!text) { setFeedback(''); return; }
    setFeedback(text);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleActiver = () => {
    setShowActiverConfirm(true);
  };

  const confirmActiver = async () => {
    setShowActiverConfirm(false);
    setErrStatut(''); setBusyStatut(true);
    try {
      await activerListe(liste.id);
      let detail = liste;
      try { detail = await getListeDetail(liste.id); } catch {}
      onUpdate(detail);
      toast('Liste activée. 2 premiers collaborateurs seront notifiés par SMS.');
    } catch {
      setErrStatut("Erreur lors de l'activation.");
    } finally {
      setBusyStatut(false);
    }
  };

  const handleTerminer = async () => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Terminer cette liste ?',
      html:
        '<p style="text-align:left;margin:0;font-size:15px">Aucun patient ne pourra être ajouté après.</p>'
        + '<p style="text-align:left;margin:12px 0 0;font-size:13px;color:#64748b">La liste passera en statut terminé.</p>',
      showCancelButton: true,
      confirmButtonText: 'Terminer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#64748b',
      focusCancel: true,
    });
    if (!confirm.isConfirmed) return;
    setErrStatut(''); setBusyStatut(true);
    try { onUpdate(await terminerListe(liste.id)); }
    catch { setErrStatut('Erreur lors de la finalisation.'); }
    finally { setBusyStatut(false); }
  };

  const updateItem = (updatedItem) =>
    onUpdate({ ...liste, items: liste.items.map(i => i.id === updatedItem.id ? updatedItem : i) });

  const removeItem = (itemId) =>
    onUpdate({ ...liste, items: liste.items.filter(i => i.id !== itemId).map((i, idx) => ({ ...i, ordre: idx+1 })) });

  const handleEffectuer = async (item) => {
    try {
      const updated = await effectuerItem(item.id);
      updateItem(updated);
      setItemErrors(prev => ({ ...prev, [item.id]: '' }));
      if (updated?.statut === 'EFFECTUEE') {
        toast('SMS de notification envoyé au prochain collaborateur');
      }
    } catch (e) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.response?.data?.error || '';
      const msg = status === 404
        ? 'Action impossible: endpoint backend introuvable pour effectuer ce passage.'
        : (detail || 'Erreur lors de la mise à jour du passage.');
      setItemErrors(prev => ({ ...prev, [item.id]: msg }));
    }
  };
  const handleAnnuler = async (item) => {
    try {
      const updated = await annulerItem(item.id);
      updateItem(updated);
      setItemErrors(prev => ({ ...prev, [item.id]: '' }));
    } catch (e) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.response?.data?.error || '';
      const msg = status === 404
        ? 'Action impossible: endpoint backend introuvable pour annuler ce passage.'
        : (detail || 'Erreur lors de l\'annulation du passage.');
      setItemErrors(prev => ({ ...prev, [item.id]: msg }));
    }
  };

  const handleSupprimer = async (item) => {
    try {
      await supprimerItem(item.id);
      removeItem(item.id);
      setItemErrors(prev => ({ ...prev, [item.id]: '' }));
    } catch (e) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.response?.data?.error || '';
      const isMalformedDeleteResponse =
        status === 502 ||
        String(e?.message || '').includes('ERR_CONTENT_LENGTH_MISMATCH');

      if (isMalformedDeleteResponse) {
        try {
          const refreshed = await getListeDetail(liste.id);
          const stillExists = (refreshed?.items || []).some(i => i.id === item.id);
          if (!stillExists) {
            onUpdate(refreshed);
            setItemErrors(prev => ({ ...prev, [item.id]: '' }));
            return;
          }
        } catch {
          // On laisse ensuite le message d'erreur normal.
        }
      }

      const msg = status === 404
        ? 'Action impossible: endpoint backend introuvable pour supprimer ce passage.'
        : (detail || 'Erreur lors de la suppression du passage.');
      setItemErrors(prev => ({ ...prev, [item.id]: msg }));
    }
  };

  const handleNotifier = async (item) => {
    const attemptNotifier = async (attempt) => {
      try {
        const result = await notifierItem(item.id);
        const sent = result?.sent;

        if (sent === false) {
          throw new Error('Envoi SMS échoué : service téléphonie a répondu sent=false.');
        }

        setItemErrors(prev => ({ ...prev, [item.id]: '' }));
        try {
          const listeDetail = await getListeDetail(liste.id);
          onUpdate(listeDetail);
        } catch {
          updateItem({ ...item, sms_envoye: true });
        }

        toast('SMS de notification manuel envoyé.');
        return;
      } catch (e) {
        const status = e?.response?.status;

        if (status === 502 && attempt < 2) {
          // tentative automatique simple
          return await attemptNotifier(attempt + 1);
        }

        const detail = e?.response?.data?.detail || e?.response?.data?.error || e?.message || '';
        const msg = status === 502
          ? 'Service SMS momentanément indisponible (502). Réessayez dans quelques instants.'
          : String(detail).includes('Collaborateur ou numéro de téléphone non configuré')
            ? 'Ce collaborateur n\'a pas de numéro de téléphone enregistré.'
            : 'Erreur lors du renvoi SMS.';
        setItemErrors(prev => ({ ...prev, [item.id]: msg }));
      }
    };

    await attemptNotifier(1);
  };

  const handleAdded     = (newItem)    => onUpdate({ ...liste, items: [...(liste.items || []), newItem] });

  const items   = liste.items || [];
  const total   = items.length;
  const enAtt   = items.filter(i => i.statut === 'EN_ATTENTE').length;
  const effec   = items.filter(i => i.statut === 'EFFECTUEE').length;
  const annules = items.filter(i => i.statut === 'ANNULEE').length;
  const pct     = total ? Math.round(effec / total * 100) : 0;
  const isConsult = liste.type_liste === 'CONSULTATION';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', borderRadius:16,
      border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.06)', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'20px 22px 14px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:8 }}>
              {isConsult
                ? <><IcoStethoscope c="#1d4ed8" size={18}/> Consultation</>
                : <><IcoSearch c="#6d28d9" size={18}/> Contre-visite</>
              }
            </h3>
            <p style={{ fontSize:13, color:'#64748b', marginTop:4, textTransform:'capitalize' }}>
              {fmtDate(liste.date)} · {sessLabel(liste.session)}
            </p>
            {liste.medecin_nom && (
              <p style={{ fontSize:12.5, color:'#3b82f6', marginTop:4, fontWeight:600,
                display:'flex', alignItems:'center', gap:5 }}>
                <IcoUser c="#3b82f6" size={12}/> {liste.medecin_nom}
              </p>
            )}
          </div>
          <StatusBadge statut={liste.statut} />
        </div>

        {/* Compteurs */}
        <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
          {[
            { lbl:'Total',      val:total,   color:'#475569' },
            { lbl:'En attente', val:enAtt,   color:'#d97706' },
            { lbl:'Effectués',  val:effec,   color:'#16a34a' },
            { lbl:'Annulés',    val:annules, color:'#dc2626' },
          ].map(m => (
            <div key={m.lbl} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:18, fontWeight:800, color:m.color }}>{m.val}</span>
              <span style={{ fontSize:11.5, color:'#94a3b8' }}>{m.lbl}</span>
            </div>
          ))}
          {total > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:100 }}>
              <div style={{ flex:1, height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', borderRadius:3,
                  background: pct===100?'#16a34a':'#3b82f6', transition:'width .4s' }}/>
              </div>
              <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{pct}%</span>
            </div>
          )}
        </div>

        {errStatut && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c',
            padding:'8px 12px', borderRadius:8, fontSize:13, marginTop:10 }}>{errStatut}</div>
        )}

        {feedback && (
          <div style={{ background:'#dcfce7', border:'1px solid #86efac', color:'#166534',
            padding:'8px 12px', borderRadius:8, fontSize:13, marginTop:10 }}>{feedback}</div>
        )}

        {/* Boutons statut */}
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {liste.statut === 'EN_PREPARATION' && (
            <button onClick={handleActiver} disabled={busyStatut}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', background:'#0d9488',
                color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700,
                cursor: busyStatut?'not-allowed':'pointer', fontFamily:'inherit', opacity: busyStatut?0.7:1 }}>
              <IcoPlay c="white" size={13}/> {busyStatut ? 'Activation…' : 'Activer la liste'}
            </button>
          )}
          {liste.statut === 'ACTIVE' && (
            <button onClick={handleTerminer} disabled={busyStatut}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', background:'#ea580c',
                color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700,
                cursor: busyStatut?'not-allowed':'pointer', fontFamily:'inherit', opacity: busyStatut?0.7:1 }}>
              <IcoStop c="white" size={13}/> {busyStatut ? 'Finalisation…' : 'Terminer la liste'}
            </button>
          )}
        </div>
      </div>

      {showActiverConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:30 }}>
          <div style={{ width:360, background:'white', borderRadius:14, padding:20, boxShadow:'0 10px 30px rgba(0,0,0,.2)' }}>
            <h4 style={{ margin:0, marginBottom:12, color:'#0f172a' }}>Confirmer l'activation</h4>
            <p style={{ margin:0, color:'#334155', fontSize:14, lineHeight:1.5 }}>
              En activant cette liste, les 2 premiers collaborateurs seront notifiés par SMS automatiquement.
            </p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
              <button onClick={() => setShowActiverConfirm(false)} style={{ padding:'8px 14px', border:'1px solid #cbd5e1', borderRadius:8, background:'white', color:'#334155', cursor:'pointer' }}>Annuler</button>
              <button onClick={confirmActiver} style={{ padding:'8px 14px', border:'none', borderRadius:8, background:'#0d9488', color:'white', cursor:'pointer' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Ajout item */}
      {editable && <AjouterItem listeId={liste.id} onAdded={handleAdded} itemsExistants={items}/>}

      {/* Liste items */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 22px 18px' }}>
        {total === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 16px', background:'#f8fafc',
            borderRadius:12, border:'1.5px dashed #e2e8f0' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
              <IcoUsers c="#cbd5e1" size={34}/>
            </div>
            <p style={{ color:'#94a3b8', fontSize:14, margin:0 }}>Aucun patient dans cette liste</p>
            {editable && <p style={{ color:'#cbd5e1', fontSize:12.5, marginTop:4 }}>Utilisez le formulaire ci-dessus pour ajouter des patients</p>}
          </div>
        ) : (
          items.map(item => (
            <ItemRow key={item.id} item={item} editable={editable}
              onEffectuer={() => handleEffectuer(item)}
              onAnnuler={()   => handleAnnuler(item)}
              onSupprimer={()  => handleSupprimer(item)}
              onNotifier={() => handleNotifier(item)}
              itemError={itemErrors[item.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}