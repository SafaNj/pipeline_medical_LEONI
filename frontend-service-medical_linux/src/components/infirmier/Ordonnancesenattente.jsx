// src/components/infirmier/OrdonnancesEnAttente.jsx
import { useState, useEffect, useCallback } from 'react';
import { getLignesEnAttente, donnerLigneOrdonnance, ignorerLigneOrdonnance } from '../../api/consultationsApi';

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';

function stockMeta(statut, quantite) {
  const s = String(statut || '').toUpperCase();
  const q = Number(quantite ?? 0);
  if (s === 'NON_REFERENCE') return { label:'Non référencé', bg:'#fefce8', color:'#92400e', border:'#fde68a', ok:false, raison:'non_ref' };
  if (s === 'EPUISE' || q <= 0) return { label:'Épuisé',    bg:'#fef2f2', color:'#b91c1c', border:'#fecaca', ok:false, raison:'epuise' };
  if (s === 'FAIBLE')            return { label:'Faible',    bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', ok:true,  raison:null };
  return                                { label:'En stock',  bg:'#ecfeff', color:'#0e7490', border:'#a5f3fc', ok:true,  raison:null };
}

/* ─── Icons ───────────────────────────────────────────────── */
const IcoRefresh  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const IcoCheck    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX        = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPill     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7"/><circle cx="18" cy="18" r="3"/><path d="m15.5 15.5 5 5"/></svg>;
const IcoWarn     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoSkip     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IcoChevron  = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>;
const IcoUser     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

/* ─── Skeleton ────────────────────────────────────────────── */
const Skeleton = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {[1,2,3].map(i => <div key={i} style={{ height:80, borderRadius:14, background:'linear-gradient(90deg,#f0f9ff 25%,#e0f2fe 50%,#f0f9ff 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />)}
  </div>
);

/* ─── Input style ─────────────────────────────────────────── */
const inputS = { border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, outline:'none', background:'white', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color .14s' };

/* ══════════════════════════════════════════════════════════
   MODAL DONNER
══════════════════════════════════════════════════════════ */
function ModalDonner({ ligne, onConfirm, onClose }) {
  const [quantite,   setQuantite]   = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [err,        setErr]        = useState('');

  const nom    = ligne.medicament_info?.nom    || ligne.texte || '—';
  const dosage = ligne.medicament_info?.dosage || '';
  const unite  = ligne.medicament_info?.unite  || 'comprime';
  const cond   = ligne.medicament_info?.conditionnement || 'boite';
  const qpc    = Number(ligne.medicament_info?.qte_par_conditionnement || 1);
  const dispo  = ligne.stock_info?.quantite ?? 0;
  const meta   = stockMeta(ligne.stock_info?.statut, dispo);
  const collab = ligne.collaborateur_info || {};

  // Label lisible
  const uniteLabel = { comprime:'comprimé', gelule:'gélule', ampoule:'ampoule', millilitre:'ml',
    sachet:'sachet', suppositoire:'suppositoire', patch:'patch', unite:'unité' }[unite] || unite;
  const condLabel  = { boite:'boîte', flacon:'flacon', tube:'tube', sachet:'sachet',
    plaquette:'plaquette', unite:'unité' }[cond] || cond;

  // Nombre de boîtes équivalent
  const nbBoites = quantite && Number(quantite) > 0 ? (Number(quantite) / qpc).toFixed(2) : null;

  const go = async () => {
    const q = Number(quantite);
    if (!q || q <= 0) { setErr('Quantité invalide.'); return; }
    if (q > dispo)    { setErr(`Maximum disponible : ${dispo} ${uniteLabel}(s)`); return; }
    setErr(''); setSubmitting(true);
    try   { await onConfirm(ligne.id, q); onClose(); }
    catch (e) { setErr(e?.response?.data?.error || 'Erreur lors de la dispensation.'); }
    finally   { setSubmitting(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(12,74,110,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:16, backdropFilter:'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:460, background:'white', borderRadius:18, boxShadow:'0 24px 70px rgba(14,165,233,.25)', animation:'mIn .18s ease' }}>
        <style>{`@keyframes mIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f9ff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0c4a6e' }}>Dispenser le médicament</div>
            <div style={{ fontSize:12, color:'#7dd3fc', marginTop:2 }}>
              Ordonnance de <strong>{collab.nom} {collab.prenom}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:'none', background:'#f0f9ff', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><IcoX /></button>
        </div>

        <div style={{ padding:'16px 20px 22px', display:'flex', flexDirection:'column', gap:12 }}>

          {/* Patient */}
          <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:15, fontWeight:800, flexShrink:0 }}>
              {(collab.nom?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#0c4a6e' }}>{collab.nom} {collab.prenom}</div>
              <div style={{ fontSize:11.5, color:'#0369a1', marginTop:1 }}>
                {collab.poste}{collab.matricule && <span style={{ marginLeft:7, fontFamily:'monospace', opacity:.7 }}>#{collab.matricule}</span>}
              </div>
            </div>
          </div>

          {/* Médicament + stock */}
          <div style={{ background:'#fafafa', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:6 }}>
                <IcoPill />
                {nom} {dosage && <span style={{ fontWeight:500, color:'#64748b' }}>{dosage}</span>}
                <span style={{ fontSize:11, background:'#e0f2fe', color:'#0369a1', padding:'1px 7px', borderRadius:99, fontWeight:600 }}>{uniteLabel}</span>
              </div>
              <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:3 }}>Prescription : <em>"{ligne.texte}"</em></div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <span style={{ display:'block', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, border:`1px solid ${meta.border}`, background:meta.bg, color:meta.color }}>{meta.label}</span>
              <span style={{ fontSize:11.5, color:'#64748b', fontWeight:600, marginTop:3, display:'block' }}>
                Dispo : <strong style={{ color:meta.color }}>{dispo} {uniteLabel}(s)</strong>
              </span>
            </div>
          </div>

          {/* ── Info conditionnement — clé pour l'infirmier ── */}
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div style={{ fontSize:12.5, color:'#1d4ed8', lineHeight:1.7 }}>
              1 <strong>{condLabel}</strong> contient <strong>{qpc} {uniteLabel}(s)</strong>
              <span style={{ color:'#60a5fa', margin:'0 5px' }}>·</span>
              Stock actuel : <strong>{dispo} {uniteLabel}(s)</strong>
              <span style={{ color:'#60a5fa', margin:'0 5px' }}>·</span>
              soit ≈ <strong>{(dispo / qpc).toFixed(1)} {condLabel}(s)</strong>
            </div>
          </div>

          {/* Quantité en comprimés */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 }}>
              Quantité à dispenser (en {uniteLabel}s) *
            </label>
            <input type="number" min="1" max={dispo} style={inputS}
              placeholder={`Ex: ${qpc} ${uniteLabel}(s) = 1 ${condLabel}`}
              value={quantite} onChange={e => setQuantite(e.target.value)}
              onFocus={e => e.target.style.borderColor='#0ea5e9'} onBlur={e => e.target.style.borderColor='#e2e8f0'}
              onKeyDown={e => e.key==='Enter' && go()} autoFocus />
            {/* Équivalent boîtes en temps réel */}
            {quantite && Number(quantite) > 0 && qpc > 1 && (
              <div style={{ fontSize:12, color:'#6b7280', marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                {quantite} {uniteLabel}(s) ≈ <strong style={{ color:'#374151' }}>{nbBoites} {condLabel}(s)</strong>
              </div>
            )}
          </div>

          {/* Résumé dispensation */}
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:9, padding:'9px 13px', fontSize:12, color:'#166534', lineHeight:1.6 }}>
            <strong>{quantite||'?'} {uniteLabel}(s)</strong> de <strong>{nom}</strong> seront débitées du stock.
            {quantite && Number(quantite) > 0 && (
              <span style={{ color:'#4ade80', margin:'0 4px' }}>·</span>
            )}
            {quantite && Number(quantite) > 0 && (
              <span>Reste après : <strong>{Math.max(0, dispo - Number(quantite))} {uniteLabel}(s)</strong></span>
            )}
          </div>

          {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'8px 12px', fontSize:12.5 }}>{err}</div>}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:2 }}>
            <button onClick={onClose} style={{ padding:'9px 18px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'white', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
            <button onClick={go} disabled={submitting} style={{ padding:'9px 22px', border:'none', borderRadius:9, background:submitting?'#e2e8f0':'linear-gradient(135deg,#0ea5e9,#0284c7)', color:submitting?'#94a3b8':'white', fontSize:13, fontWeight:700, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:submitting?'none':'0 3px 10px rgba(14,165,233,.3)' }}>
              <IcoCheck />{submitting ? 'En cours…' : `Confirmer · ${quantite||'?'} ${uniteLabel}(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL IGNORER
══════════════════════════════════════════════════════════ */
function ModalIgnorer({ ligne, onConfirm, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const collab = ligne.collaborateur_info || {};
  const go = async () => {
    setSubmitting(true);
    try { await onConfirm(ligne.id); onClose(); }
    finally { setSubmitting(false); }
  };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(12,74,110,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:16, backdropFilter:'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:400, background:'white', borderRadius:18, boxShadow:'0 20px 60px rgba(0,0,0,.15)', animation:'mIn .18s ease' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #fef3c7', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0c4a6e' }}>Ignorer cette ligne</div>
            <div style={{ fontSize:12, color:'#92400e', marginTop:2 }}>Aucune modification du stock</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:'none', background:'#fefce8', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#a16207' }}><IcoX /></button>
        </div>
        <div style={{ padding:'16px 20px 22px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#fefce8', border:'1px solid #fde68a', borderRadius:10, padding:'11px 14px' }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:'#0c4a6e', marginBottom:4 }}>
              {collab.nom} {collab.prenom} — <em>"{ligne.texte}"</em>
            </div>
            <div style={{ fontSize:12.5, color:'#92400e', lineHeight:1.6 }}>
              Cette ligne sera marquée <strong>ignorée</strong> et disparaîtra de la liste. Le stock ne sera pas modifié.
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 18px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'white', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
            <button onClick={go} disabled={submitting} style={{ padding:'9px 18px', border:'none', borderRadius:9, background:submitting?'#e2e8f0':'#64748b', color:submitting?'#94a3b8':'white', fontSize:13, fontWeight:700, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <IcoSkip />{submitting ? 'En cours…' : 'Ignorer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARTE ORDONNANCE (accordion)
══════════════════════════════════════════════════════════ */
function CarteOrdonnance({ group, idx, busy, onDonner, onIgnorer }) {
  // Première ordonnance (la plus récente) ouverte par défaut
  const [open, setOpen] = useState(idx === 0);

  const collab   = group.collab || {};
  const initiale = (collab.nom?.[0] || '?').toUpperCase();
  const nomComplet = collab.nom && collab.prenom ? `${collab.nom} ${collab.prenom}` : `Ordonnance #${group.ordonnanceId}`;

  // Résumé médicaments pour le header fermé
  const resumeMeds = group.lignes.map(l => l.texte).filter(Boolean);
  const resumeStr  = resumeMeds.length > 0
    ? resumeMeds.slice(0, 3).join(', ') + (resumeMeds.length > 3 ? ` +${resumeMeds.length - 3}` : '')
    : '—';

  // Compter dispensables vs non liés
  const nbDispo  = group.lignes.filter(l => !!l.medicament && (l.stock_info?.quantite ?? 0) > 0).length;
  const nbBloque = group.lignes.length - nbDispo;

  return (
    <div style={{ background:'white', border:`1px solid ${open ? '#bae6fd' : '#e8edf5'}`, borderRadius:14, overflow:'hidden', boxShadow: open ? '0 4px 18px rgba(14,165,233,.10)' : '0 1px 4px rgba(0,0,0,.05)', transition:'all .2s' }}>

      {/* ── Header cliquable ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px', border:'none', background: open ? 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' : 'white', cursor:'pointer', textAlign:'left', transition:'background .2s' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'white'; }}
      >
        {/* Avatar */}
        <div style={{ width:42, height:42, borderRadius:12, background: open ? 'linear-gradient(135deg,#0ea5e9,#0369a1)' : 'linear-gradient(135deg,#94a3b8,#64748b)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:16, fontWeight:800, flexShrink:0, transition:'background .2s' }}>
          {initiale}
        </div>

        {/* Texte principal */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Titre : "Ordonnance de Prénom NOM" */}
          <div style={{ fontSize:13.5, fontWeight:800, color: open ? '#0c4a6e' : '#374151', marginBottom:3, display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
            <IcoUser />
            Ordonnance de <span style={{ color: open ? '#0284c7' : '#374151' }}>{nomComplet}</span>
          </div>

          {/* Sous-titre : médicaments résumés (visible seulement fermé) */}
          {!open && (
            <div style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              <IcoPill />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{resumeStr}</span>
            </div>
          )}

          {/* Infos patient (visible ouvert) */}
          {open && collab.poste && (
            <div style={{ fontSize:11.5, color:'#0369a1', display:'flex', gap:8 }}>
              <span>{collab.poste}</span>
              {collab.matricule && <span style={{ fontFamily:'monospace', opacity:.75 }}>#{collab.matricule}</span>}
            </div>
          )}
        </div>

        {/* Badges droite */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:3 }}>{fmtDate(group.date)}</div>
            <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
              {nbDispo > 0 && (
                <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#ecfeff', color:'#0e7490', border:'1px solid #a5f3fc' }}>
                  {nbDispo} dispensable{nbDispo > 1 ? 's' : ''}
                </span>
              )}
              {nbBloque > 0 && (
                <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#fefce8', color:'#92400e', border:'1px solid #fde68a' }}>
                  {nbBloque} à ignorer
                </span>
              )}
            </div>
          </div>
          <div style={{ color: open ? '#0284c7' : '#94a3b8', transition:'color .2s', display:'flex' }}>
            <IcoChevron open={open} />
          </div>
        </div>
      </button>

      {/* ── Lignes médicaments (accordion) ── */}
      {open && (
        <div style={{ borderTop:'1px solid #f0f9ff' }}>
          {group.lignes.map((ligne, lidx) => {
            const hasMed  = !!ligne.medicament;
            const nom     = ligne.medicament_info?.nom    || null;
            const dosage  = ligne.medicament_info?.dosage || '';
            const dispo   = ligne.stock_info?.quantite ?? 0;
            const meta    = stockMeta(ligne.stock_info?.statut, dispo);
            const canGive = hasMed && meta.ok;
            const isBusy  = busy[ligne.id];

            return (
              <div key={ligne.id}
                style={{ padding:'12px 16px', borderTop: lidx > 0 ? '1px solid #f0f9ff' : 'none', display:'flex', alignItems:'center', gap:12, transition:'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background='#fafcff'}
                onMouseLeave={e => e.currentTarget.style.background='white'}
              >
                {/* Numéro */}
                <div style={{ width:26, height:26, borderRadius:8, background:'#e0f2fe', color:'#0369a1', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {ligne.ordre || lidx + 1}
                </div>

                {/* Infos médicament */}
                <div style={{ flex:1, minWidth:0 }}>
                  {/* Texte prescription */}
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a' }}>{ligne.texte}</div>

                  {/* Médicament lié au stock */}
                  {hasMed && nom && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, flexWrap:'wrap' }}>
                      <span style={{ color:'#0369a1', display:'flex' }}><IcoPill /></span>
                      <span style={{ fontSize:12, color:'#0369a1', fontWeight:600 }}>{nom}{dosage ? ` ${dosage}` : ''}</span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, border:`1px solid ${meta.border}`, background:meta.bg, color:meta.color, fontWeight:700 }}>
                        {meta.label} · {dispo} unité{dispo !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Non référencé */}
                  {!hasMed && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:4, background:'#fefce8', border:'1px solid #fde68a', borderRadius:8, padding:'4px 10px' }}>
                      <span style={{ color:'#a16207', display:'flex' }}><IcoWarn /></span>
                      <span style={{ fontSize:12, color:'#92400e', fontWeight:600 }}>Absent du stock — cliquer "Ignorer" pour clôturer</span>
                    </div>
                  )}

                  {/* Stock épuisé */}
                  {hasMed && !meta.ok && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:4, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'4px 10px' }}>
                      <span style={{ color:'#b91c1c', display:'flex' }}><IcoWarn /></span>
                      <span style={{ fontSize:12, color:'#b91c1c', fontWeight:600 }}>Stock épuisé — entrée de stock ou "Ignorer"</span>
                    </div>
                  )}
                </div>

                {/* Boutons */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button
                    onClick={() => canGive && !isBusy && onDonner({ ...ligne, collaborateur_info: collab })}
                    disabled={!canGive || isBusy}
                    title={!canGive ? (meta.raison === 'non_ref' ? 'Non référencé' : 'Stock épuisé') : 'Dispenser'}
                    style={{ padding:'7px 14px', border:'none', borderRadius:8, background: canGive && !isBusy ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : '#f1f5f9', color: canGive && !isBusy ? 'white' : '#94a3b8', fontSize:12.5, fontWeight:700, cursor: canGive && !isBusy ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:5, boxShadow: canGive && !isBusy ? '0 2px 8px rgba(14,165,233,.28)' : 'none', transition:'all .14s' }}
                    onMouseEnter={e => { if (canGive && !isBusy) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                  >
                    <IcoCheck />{isBusy ? '…' : 'Donner'}
                  </button>

                  <button
                    onClick={() => !isBusy && onIgnorer({ ...ligne, collaborateur_info: collab })}
                    disabled={isBusy}
                    style={{ padding:'7px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, background:'white', color:'#64748b', fontSize:12.5, fontWeight:600, cursor: isBusy ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:5, transition:'all .14s' }}
                    onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <IcoSkip />Ignorer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function OrdonnancesEnAttente({ onLoad }) {
  const [lignes,       setLignes]      = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState('');
  const [successMsg,   setSuccessMsg]  = useState('');
  const [modalDonner,  setModalDonner] = useState(null);
  const [modalIgnorer, setModalIgnorer]= useState(null);
  const [busy,         setBusy]        = useState({});

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getLignesEnAttente();
      setLignes(data);
      // Badge parent
      if (onLoad) {
        const nb = Object.keys(data.filter(l => !!l.medicament).reduce((acc, l) => { acc[l.ordonnance]=1; return acc; }, {})).length;
        onLoad(nb);
      }
    }
    catch { setError('Impossible de charger les ordonnances.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDonner = async (ligneId, quantite) => {
    setBusy(p => ({ ...p, [ligneId]: true }));
    try {
      await donnerLigneOrdonnance(ligneId, quantite);
      setLignes(prev => {
        const next = prev.filter(l => l.id !== ligneId);
        if (onLoad) {
          const nb = Object.keys(next.filter(l=>!!l.medicament).reduce((acc,l)=>{acc[l.ordonnance]=1;return acc;},{})).length;
          onLoad(nb);
        }
        return next;
      });
      flash('✓ Médicament dispensé — stock mis à jour');
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur lors de la dispensation.');
    } finally { setBusy(p => ({ ...p, [ligneId]: false })); }
  };

  const handleIgnorer = async (ligneId) => {
    setBusy(p => ({ ...p, [ligneId]: true }));
    try {
      await ignorerLigneOrdonnance(ligneId);
      setLignes(prev => prev.filter(l => l.id !== ligneId));
      flash('Ligne ignorée et retirée de la liste');
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur.');
    } finally { setBusy(p => ({ ...p, [ligneId]: false })); }
  };

  /* 
   * On affiche UNIQUEMENT les lignes avec un médicament référencé en stock.
   * Les médicaments absents du stock sont silencieusement ignorés.
   */
  const lignesStock = lignes.filter(l => !!l.medicament);

  /* Grouper par ordonnance + tri : dernière en tête (date_ordonnance desc) */
  const groups = Object.values(
    lignesStock.reduce((acc, l) => {
      const k = l.ordonnance;
      if (!acc[k]) acc[k] = { ordonnanceId: k, date: l.date_ordonnance, collab: l.collaborateur_info || null, lignes: [] };
      acc[k].lignes.push(l);
      return acc;
    }, {})
  ).sort((a, b) => {
    // Tri décroissant sur la date
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return db - da;
  });

  const nbOrdonnances = groups.length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* En-tête */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#0c4a6e' }}>Ordonnances en attente</div>
          {!loading && lignesStock.length > 0 && (
            <span style={{ background:'#0284c7', color:'white', borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
              {lignesStock.length} ligne{lignesStock.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={load} style={{ padding:'7px 13px', border:'1.5px solid #bae6fd', borderRadius:8, background:'white', color:'#0369a1', fontSize:12.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
          <IcoRefresh /> Actualiser
        </button>
      </div>



      {/* Messages */}
      {successMsg && (
        <div style={{ background:'#ecfeff', border:'1px solid #a5f3fc', color:'#0e7490', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          <IcoCheck /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:10, padding:'10px 14px', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ border:'none', background:'none', cursor:'pointer', color:'#b91c1c', display:'flex' }}><IcoX /></button>
        </div>
      )}

      {/* Contenu */}
      {loading ? <Skeleton /> : lignesStock.length === 0 ? (
        <div style={{ background:'#f0f9ff', border:'1px dashed #bae6fd', borderRadius:14, padding:40, textAlign:'center' }}>
          <div style={{ fontSize:34, marginBottom:10 }}></div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0c4a6e', marginBottom:5 }}>Aucune ordonnance en attente</div>
          <div style={{ fontSize:12.5, color:'#7dd3fc' }}>Toutes les prescriptions ont été traitées.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {groups.map((group, idx) => (
            <CarteOrdonnance
              key={group.ordonnanceId}
              group={group}
              idx={idx}
              busy={busy}
              onDonner={setModalDonner}
              onIgnorer={setModalIgnorer}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalDonner  && <ModalDonner  ligne={modalDonner}  onConfirm={handleDonner}  onClose={() => setModalDonner(null)}  />}
      {modalIgnorer && <ModalIgnorer ligne={modalIgnorer} onConfirm={handleIgnorer} onClose={() => setModalIgnorer(null)} />}
    </div>
  );
}