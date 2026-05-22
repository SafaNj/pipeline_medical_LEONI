// src/components/infirmier/GestionStock.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  getMedicaments, getAlertes,
  creerMedicament, modifierMedicament, creerStock, modifierStock, entreeStock,
  exportStockMedicaments,
} from '../../api/stockApi';
import { getLignesEnAttente } from '../../api/consultationsApi';
import DonDirect from './DonDirect';
import HistoriqueDispensations from './Historiquedispensations';
import OrdonnancesEnAttente from './Ordonnancesenattente';
import { uiAlert } from '../../utils/uiAlert';

const UNITES_DISPENSATION = [
  { value:'comprime',     label:'Comprimé'     },
  { value:'gelule',       label:'Gélule'       },
  { value:'ampoule',      label:'Ampoule'      },
  { value:'millilitre',   label:'Millilitre'   },
  { value:'sachet',       label:'Sachet'       },
  { value:'suppositoire', label:'Suppositoire' },
  { value:'patch',        label:'Patch'        },
  { value:'unite',        label:'Unité'        },
  { value:'autre',        label:'Autre'        },
];
const CONDITIONNEMENTS = [
  { value:'boite',     label:'Boîte'     },
  { value:'flacon',    label:'Flacon'    },
  { value:'tube',      label:'Tube'      },
  { value:'sachet',    label:'Sachet'    },
  { value:'plaquette', label:'Plaquette' },
  { value:'unite',     label:'Unité'     },
];

function stockMeta(statut, quantite, seuil) {
  const s = String(statut||'').toUpperCase();
  const q = Number(quantite ?? 0);
  const sl = Number(seuil ?? 0);
  if (s === 'EPUISE' || q <= 0)
    return { label:'Épuisé',      bg:'#fef2f2', color:'#b91c1c', border:'#fecaca', barColor:'#ef4444', niveau:'vide' };
  if (sl > 0 && q <= sl * 0.4)
    return { label:'Très faible', bg:'#fef2f2', color:'#b91c1c', border:'#fecaca', barColor:'#ef4444', niveau:'critique' };
  if (s === 'FAIBLE' || (sl > 0 && q <= sl))
    return { label:'Faible',      bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', barColor:'#f59e0b', niveau:'faible' };
  return   { label:'OK',          bg:'#f0fdf9', color:'#0f766e', border:'#99f6e4', barColor:'#0d9488', niveau:'ok' };
}

function daysTo(d) {
  if (!d) return null;
  const diff = new Date(d) - new Date(new Date().toDateString());
  return Number.isNaN(diff) ? null : Math.ceil(diff / 86400000);
}
const labelUnite = (val, perso) => {
  if (val === 'autre' && perso && String(perso).trim()) return String(perso).trim();
  return UNITES_DISPENSATION.find(u => u.value === val)?.label || val || '—';
};
const labelCond  = (val) => CONDITIONNEMENTS.find(c => c.value === val)?.label || val || '—';

/* ── Styles ── */
const inputS  = { width:'100%', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'9px 11px', fontSize:13, outline:'none', background:'white', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .14s' };
const selectS = { ...inputS, cursor:'pointer' };
const labelS  = { display:'block', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:5 };

/* ── Icônes SVG (color explicite, jamais currentColor) ── */
const IcoRefresh = ({ c='#0369a1', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const IcoPlus    = ({ c='white',   size=12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoClose   = ({ c='#64748b', size=11 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPill    = ({ c='#0369a1', size=18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>;
const IcoBox     = ({ c='#1d4ed8', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoSearch  = ({ c='#94a3b8', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoBell    = ({ c='#0369a1', size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IcoCheck   = ({ c='#0d9488', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoWarn    = ({ c='#d97706', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoDanger  = ({ c='#dc2626', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoClock   = ({ c='#92400e', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoEdit    = ({ c='#0f766e', size=12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

/* ── Barre de stock visuelle (compacte, inline) ── */
function StockBar({ quantite, seuil, statut }) {
  const q  = Number(quantite ?? 0);
  const sl = Number(seuil ?? 0);
  const meta = stockMeta(statut || (q <= 0 ? 'EPUISE' : q <= sl * 0.4 ? 'FAIBLE' : q <= sl ? 'FAIBLE' : 'OK'), q, sl);
  const maxRef   = Math.max(q, sl * 3, 1);
  const pctStock = Math.min(100, Math.round(q / maxRef * 100));
  const pctSeuil = sl > 0 ? Math.min(100, Math.round(sl / maxRef * 100)) : null;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
      {/* Badge statut */}
      <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10.5, fontWeight:700, color:meta.color, flexShrink:0 }}>
        {meta.niveau==='ok'                                     && <IcoCheck  c="#0d9488" size={10}/>}
        {meta.niveau==='faible'                                 && <IcoWarn   c="#d97706" size={10}/>}
        {(meta.niveau==='critique'||meta.niveau==='vide')       && <IcoDanger c="#dc2626" size={10}/>}
        {meta.label}
      </span>
      {/* Barre courte 100px */}
      <div style={{ position:'relative', width:100, height:5, background:'#e2e8f0', borderRadius:3, flexShrink:0 }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:3,
          width:`${pctStock}%`, background:meta.barColor, transition:'width .4s' }}/>
        {pctSeuil !== null && (
          <div style={{ position:'absolute', top:-2, bottom:-2, width:2,
            left:`${pctSeuil}%`, background:'#94a3b8', borderRadius:1 }}
            title={`Seuil : ${sl}`}/>
        )}
      </div>
      {/* Seuil texte */}
      {sl > 0 && <span style={{ fontSize:10, color:'#94a3b8', flexShrink:0 }}>⚑ {sl}</span>}
    </div>
  );
}
  function ModalModifierMedicament({ medicament, stock, onClose, onUpdated }) {
    const qpc = medicament?.qte_par_conditionnement || 1;
    const nbCondInitialRaw = stock?.quantite ? (Number(stock.quantite) / qpc) : '';
    const nbCondInitial = Number.isFinite(Number(nbCondInitialRaw)) && Number(nbCondInitialRaw) > 0
      ? String(Math.max(1, Math.round(Number(nbCondInitialRaw))))
      : '';
    const [form, setForm] = useState({
      nom: medicament?.nom || '',
      dosage: medicament?.dosage || '',
      unite: medicament?.unite || 'comprime',
      unite_personnalise: medicament?.unite_personnalise || '',
      conditionnement: medicament?.conditionnement || 'boite',
      qte_par_conditionnement: String(medicament?.qte_par_conditionnement || 1),
      nb_cond: nbCondInitial,
      seuil_alerte: String(stock?.seuil_alerte ?? ''),
      date_expiration: stock?.date_expiration || '',
    });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const uniteLabel = labelUnite(form.unite, form.unite_personnalise);
    const condLabel = labelCond(form.conditionnement);
    const qpcCurrent = Number(form.qte_par_conditionnement) || 1;
    const unites = form.nb_cond ? Number.parseInt(form.nb_cond, 10) * qpcCurrent : 0;

    const go = async () => {
      if (!form.nom.trim()) { setErr('Le nom est obligatoire.'); return; }
      if (form.unite === 'autre' && !form.unite_personnalise?.trim()) {
        setErr('Précisez l\'unité personnalisée lorsque « Autre » est sélectionné.');
        return;
      }
      if (!form.qte_par_conditionnement || Number(form.qte_par_conditionnement) < 1) {
        setErr('La quantité par conditionnement doit être ≥ 1.');
        return;
      }
      const nbCondInt = Number.parseInt(form.nb_cond, 10);
      if (!form.nb_cond || !Number.isInteger(nbCondInt) || nbCondInt <= 0) {
        setErr(`Le nombre de ${condLabel.toLowerCase()}s doit être supérieur à 0.`);
        return;
      }
      if (form.seuil_alerte === '' || Number(form.seuil_alerte) < 0) {
        setErr("Le seuil d'alerte doit être supérieur ou égal à 0.");
        return;
      }
      setErr('');
      setLoading(true);
      try {
        const updatedMed = await modifierMedicament(medicament.id, {
          nom: form.nom.trim(),
          dosage: form.dosage.trim(),
          unite: form.unite,
          unite_personnalise: form.unite === 'autre' ? form.unite_personnalise.trim() : '',
          conditionnement: form.conditionnement,
          qte_par_conditionnement: Number(form.qte_par_conditionnement),
        });

        const stockPayload = {
          quantite: nbCondInt * Number(form.qte_par_conditionnement),
          seuil_alerte: Number(form.seuil_alerte),
          date_expiration: form.date_expiration || null,
        };
        if (stock?.id) {
          await modifierStock(stock.id, stockPayload);
        } else {
          await creerStock({ medicament: medicament.id, ...stockPayload });
        }

        onUpdated(updatedMed);
        onClose();
      } catch (e) {
        setErr(e?.response?.data?.nom?.[0] || e?.response?.data?.detail || 'Modification impossible.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16, backdropFilter:'blur(5px)' }}>
        <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:500, background:'white', borderRadius:18, boxShadow:'0 24px 70px rgba(0,0,0,.15)', animation:'mIn .18s ease' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Modifier médicament</div>
            <button onClick={onClose} style={{ width:32, height:32, border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
              <IcoClose c="#64748b" size={13}/>
            </button>
          </div>
          <div style={{ padding:'16px 20px 22px', display:'flex', flexDirection:'column', gap:13 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={labelS}>Nom *</label>
                <input style={inputS} placeholder="Ex: Paracétamol" value={form.nom} onChange={e=>set('nom',e.target.value)}
                  onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} autoFocus/>
              </div>
              <div>
                <label style={labelS}>Dosage</label>
                <input style={inputS} placeholder="Ex: 500mg" value={form.dosage} onChange={e=>set('dosage',e.target.value)}
                  onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={labelS}>Conditionnement reçu</label>
                <select style={selectS} value={form.conditionnement} onChange={e=>set('conditionnement',e.target.value)}>
                  {CONDITIONNEMENTS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Qté de comprimé par boîte</label>
                <input type="number" min="1" style={inputS} placeholder="Ex: 20"
                  value={form.qte_par_conditionnement} onChange={e=>set('qte_par_conditionnement',e.target.value)}
                  onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
            </div>
            <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:-4 }}>Nombre d&apos;unités de dispensation dans un conditionnement (ex. comprimés par boîte).</div>
            <div>
              <label style={labelS}>Unité de dispensation (ce qu&apos;on donne au patient)</label>
              <select style={selectS} value={form.unite} onChange={e=>{ set('unite',e.target.value); if (e.target.value!=='autre') set('unite_personnalise',''); }}>
                {UNITES_DISPENSATION.map(u=><option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              {form.unite === 'autre' && (
                <input style={{ ...inputS, marginTop:8 }} placeholder="Ex: goutte, puff, dose…"
                  value={form.unite_personnalise} onChange={e=>set('unite_personnalise',e.target.value)}
                  onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              )}
            </div>

            <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#0f766e', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                Stock
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={labelS}>Nombre de {condLabel.toLowerCase()}s *</label>
                  <input type="number" min="1" step="1" style={inputS} placeholder="Ex: 5" value={form.nb_cond}
                    onChange={e=>set('nb_cond', e.target.value.replace(/[^\d]/g, ''))}/>
                </div>
                <div>
                  <label style={labelS}>Seuil d'alerte *</label>
                  <input type="number" min="0" style={inputS} placeholder="Ex: 20" value={form.seuil_alerte} onChange={e=>set('seuil_alerte',e.target.value)}/>
                </div>
              </div>
              <div style={{ marginTop:10 }}>
                <label style={labelS}>Date de péremption</label>
                <input type="date" style={inputS} value={form.date_expiration} onChange={e=>set('date_expiration',e.target.value)}/>
              </div>
            </div>

            {unites > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf9', border:'1px solid #99f6e4', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#0f766e' }}>
                <IcoCheck c="#0d9488" size={13}/>
                Nouveau stock: <strong>{unites} {uniteLabel.toLowerCase()}(s)</strong>
              </div>
            )}

            {form.qte_par_conditionnement >= 1 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#e0f2fe', border:'1px solid #7dd3fc', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#0369a1' }}>
                <IcoBox c="#0369a1" size={13}/>
                <span>1 <strong>{condLabel.toLowerCase()}</strong> = <strong>{form.qte_par_conditionnement} {uniteLabel.toLowerCase()}(s)</strong> dans le stock</span>
              </div>
            )}
            {err && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'8px 12px', fontSize:12.5 }}><IcoDanger c="#dc2626" size={13}/>{err}</div>}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={onClose} style={{ padding:'9px 18px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'white', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
              <button onClick={go} disabled={loading} style={{ padding:'9px 22px', border:'none', borderRadius:9, background:loading?'#e2e8f0':'linear-gradient(135deg,#14b8a6,#0f766e)', color:loading?'#94a3b8':'white', fontSize:13, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:loading?'none':'0 3px 10px rgba(15,118,110,.25)' }}>
                <IcoEdit c={loading?'#94a3b8':'white'} size={12}/>{loading?'Enregistrement…':'Modifier tout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

/* ══════════════════════════════════════════════════════════
   MODAL ENTRÉE DE STOCK
══════════════════════════════════════════════════════════ */
function ModalEntreeStock({ medicament, stockId, onClose, onSuccess }) {
  const qteParCond = medicament?.qte_par_conditionnement || 1;
  const condLabel  = labelCond(medicament?.conditionnement);
  const uniteLabel = labelUnite(medicament?.unite, medicament?.unite_personnalise);
  const [nbCond, setNbCond] = useState('');
  const [motif,  setMotif]  = useState('');
  const [dateExp,setDateExp]= useState('');
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState('');
  const unitesCalculees = nbCond ? Number(nbCond) * qteParCond : 0;

  const go = async () => {
    if (!nbCond || Number(nbCond) <= 0) { setErr('Entrez un nombre de conditionnements valide.'); return; }
    setErr(''); setLoading(true);
    try {
      // On envoie directement les unités = nb_boites × qte_par_conditionnement
      const qteTotale = Number(nbCond) * qteParCond;
      await entreeStock({ stock_id:stockId, quantite:qteTotale, motif:motif.trim()||'', date_expiration:dateExp||null });
      onSuccess(); onClose();
    } catch (e) { setErr(e?.response?.data?.error || "Erreur lors de l'entrée de stock."); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16, backdropFilter:'blur(5px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:460, background:'white', borderRadius:18, boxShadow:'0 24px 70px rgba(0,0,0,.15)', animation:'mIn .18s ease' }}>
        <style>{`@keyframes mIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Entrée de stock</div>
            <div style={{ fontSize:12.5, color:'#64748b', marginTop:2 }}><strong>{medicament?.nom}</strong> {medicament?.dosage}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
            <IcoClose c="#64748b" size={13}/>
          </button>
        </div>
        <div style={{ padding:'16px 20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#1d4ed8', lineHeight:1.7 }}>
            <IcoBox c="#1d4ed8" size={13}/>
            1 <strong>{condLabel.toLowerCase()}</strong> = <strong>{qteParCond} {uniteLabel.toLowerCase()}(s)</strong> dans le stock
          </div>
          <div>
            <label style={labelS}>Nombre de {condLabel.toLowerCase()}s reçus *</label>
            <input type="number" min="1" style={inputS} placeholder={`Ex: 2 ${condLabel.toLowerCase()}s`}
              value={nbCond} onChange={e=>setNbCond(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} autoFocus/>
          </div>
          {unitesCalculees > 0 && (
            <div style={{ background:'#f0fdf9', border:'1px solid #99f6e4', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#0f766e' }}>
                <IcoBox c="#0f766e" size={12}/> {nbCond} {condLabel.toLowerCase()}(s) × {qteParCond}
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:'#0f766e' }}>+ {unitesCalculees} {uniteLabel.toLowerCase()}(s)</div>
            </div>
          )}
          <div>
            <label style={labelS}>Date de péremption (optionnel)</label>
            <input type="date" style={inputS} value={dateExp} onChange={e=>setDateExp(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
          <div>
            <label style={labelS}>Motif (optionnel)</label>
            <input type="text" style={inputS} placeholder="Ex: Livraison mensuelle..." value={motif} onChange={e=>setMotif(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
          {err && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'8px 12px', fontSize:12.5 }}><IcoDanger c="#dc2626" size={13}/>{err}</div>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 18px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'white', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
            <button onClick={go} disabled={loading||!nbCond} style={{ padding:'9px 22px', border:'none', borderRadius:9, background:loading||!nbCond?'#e2e8f0':'linear-gradient(135deg,#0ea5e9,#0284c7)', color:loading||!nbCond?'#94a3b8':'white', fontSize:13, fontWeight:700, cursor:loading||!nbCond?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:loading||!nbCond?'none':'0 3px 10px rgba(14,165,233,.3)' }}>
              <IcoBox c={loading||!nbCond?'#94a3b8':'white'} size={13}/>{loading?'Enregistrement…':`Ajouter${unitesCalculees>0?' '+unitesCalculees+' '+uniteLabel.toLowerCase()+'(s)':''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL NOUVEAU MÉDICAMENT
══════════════════════════════════════════════════════════ */
function ModalNouveauMedicament({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nom:'', dosage:'', unite:'comprime', unite_personnalise:'', conditionnement:'boite', qte_par_conditionnement:'1',
  });
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const uniteLabel=labelUnite(form.unite, form.unite_personnalise);
  const condLabel=labelCond(form.conditionnement);

  const go = async () => {
    if (!form.nom.trim()) { setErr('Le nom est obligatoire.'); return; }
    if (form.unite === 'autre' && !form.unite_personnalise?.trim()) {
      setErr('Précisez l\'unité personnalisée lorsque « Autre » est sélectionné.');
      return;
    }
    if (!form.qte_par_conditionnement||Number(form.qte_par_conditionnement)<1) { setErr('La quantité par conditionnement doit être ≥ 1.'); return; }
    setErr(''); setLoading(true);
    try {
      const med = await creerMedicament({
        nom: form.nom.trim(),
        dosage: form.dosage.trim(),
        unite: form.unite,
        unite_personnalise: form.unite === 'autre' ? form.unite_personnalise.trim() : '',
        conditionnement: form.conditionnement,
        qte_par_conditionnement: Number(form.qte_par_conditionnement),
      });
      onCreated(med); onClose();
    } catch(e) {
      const d = e?.response?.data;
      setErr(d?.unite_personnalise?.[0] || d?.nom?.[0] || d?.detail || 'Création impossible.');
    }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16, backdropFilter:'blur(5px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:500, background:'white', borderRadius:18, boxShadow:'0 24px 70px rgba(0,0,0,.15)', animation:'mIn .18s ease' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Nouveau médicament</div>
          <button onClick={onClose} style={{ width:32, height:32, border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
            <IcoClose c="#64748b" size={13}/>
          </button>
        </div>
        <div style={{ padding:'16px 20px 22px', display:'flex', flexDirection:'column', gap:13 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={labelS}>Nom *</label>
              <input style={inputS} placeholder="Ex: Paracétamol" value={form.nom} onChange={e=>set('nom',e.target.value)}
                onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} autoFocus/>
            </div>
            <div>
              <label style={labelS}>Dosage</label>
              <input style={inputS} placeholder="Ex: 500mg" value={form.dosage} onChange={e=>set('dosage',e.target.value)}
                onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={labelS}>Conditionnement reçu</label>
              <select style={selectS} value={form.conditionnement} onChange={e=>set('conditionnement',e.target.value)}>
                {CONDITIONNEMENTS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Qté de comprimé par boîte</label>
              <input type="number" min="1" style={inputS} placeholder="Ex: 20"
                value={form.qte_par_conditionnement} onChange={e=>set('qte_par_conditionnement',e.target.value)}
                onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
          </div>
          <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:-4 }}>Nombre d&apos;unités de dispensation dans un conditionnement (ex. comprimés par boîte).</div>
          <div>
            <label style={labelS}>Unité de dispensation (ce qu&apos;on donne au patient)</label>
            <select style={selectS} value={form.unite} onChange={e=>{ set('unite',e.target.value); if (e.target.value!=='autre') set('unite_personnalise',''); }}>
              {UNITES_DISPENSATION.map(u=><option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
            {form.unite === 'autre' && (
              <input style={{ ...inputS, marginTop:8 }} placeholder="Ex: goutte, puff, dose…"
                value={form.unite_personnalise} onChange={e=>set('unite_personnalise',e.target.value)}
                onFocus={e=>e.target.style.borderColor='#0ea5e9'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            )}
          </div>
          {form.qte_par_conditionnement >= 1 && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#e0f2fe', border:'1px solid #7dd3fc', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#0369a1' }}>
              <IcoBox c="#0369a1" size={13}/>
              <span>1 <strong>{condLabel.toLowerCase()}</strong> de <strong>{form.nom||'…'}</strong> = <strong>{form.qte_par_conditionnement} {uniteLabel.toLowerCase()}(s)</strong> dans le stock</span>
            </div>
          )}
          {err && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'8px 12px', fontSize:12.5 }}><IcoDanger c="#dc2626" size={13}/>{err}</div>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 18px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'white', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
            <button onClick={go} disabled={loading} style={{ padding:'9px 22px', border:'none', borderRadius:9, background:loading?'#e2e8f0':'linear-gradient(135deg,#0ea5e9,#0284c7)', color:loading?'#94a3b8':'white', fontSize:13, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:loading?'none':'0 3px 10px rgba(14,165,233,.25)' }}>
              <IcoPlus c={loading?'#94a3b8':'white'} size={12}/>{loading?'Enregistrement…':'Créer le médicament'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal stock initial ── */
function ModalStockInitial({ medicament, onClose, onSubmit }) {
  const qpc=medicament?.qte_par_conditionnement||1;
  const condLabel=labelCond(medicament?.conditionnement);
  const uniteLabel=labelUnite(medicament?.unite, medicament?.unite_personnalise);
  const [form,setForm]=useState({ nb_cond:'', seuil_alerte:'', date_expiration:'' });
  const [loading,setLoading]=useState(false);
  const unites=form.nb_cond?Number(form.nb_cond)*qpc:0;
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const go=async()=>{ if(!form.nb_cond||!form.seuil_alerte) return; setLoading(true); await onSubmit(medicament,{ quantite:form.nb_cond, seuil_alerte:form.seuil_alerte, date_expiration:form.date_expiration }); setLoading(false); };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2100, padding:16, backdropFilter:'blur(5px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:420, background:'white', borderRadius:18, boxShadow:'0 24px 70px rgba(0,0,0,.15)', animation:'mIn .18s ease' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Stock initial</div>
            <div style={{ fontSize:12.5, color:'#64748b', marginTop:2 }}>{medicament.nom} {medicament.dosage}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:'1.5px solid #e2e8f0', background:'#f8fafc', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.borderColor='#fca5a5';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
            <IcoClose c="#64748b" size={13}/>
          </button>
        </div>
        <div style={{ padding:'16px 20px 22px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#e0f2fe', border:'1px solid #7dd3fc', borderRadius:10, padding:'9px 13px', fontSize:12.5, color:'#0369a1' }}>
            <IcoBox c="#0369a1" size={13}/> 1 {condLabel.toLowerCase()} = {qpc} {uniteLabel.toLowerCase()}(s)
          </div>
          <div>
            <label style={labelS}>Nombre de {condLabel.toLowerCase()}s initial(es) *</label>
            <input type="number" min="1" style={inputS} placeholder="Ex: 5" value={form.nb_cond} onChange={e=>set('nb_cond',e.target.value)} autoFocus/>
          </div>
          {unites>0 && (
            <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f0fdf9', border:'1px solid #99f6e4', borderRadius:9, padding:'9px 13px', fontSize:12.5, color:'#0f766e', fontWeight:700 }}>
              <IcoCheck c="#0d9488" size={13}/> Stock initial : {unites} {uniteLabel.toLowerCase()}(s)
            </div>
          )}
          <div>
            <label style={labelS}>Seuil d'alerte (en {uniteLabel.toLowerCase()}s) *</label>
            <input type="number" min="0" style={inputS} placeholder="Ex: 20" value={form.seuil_alerte} onChange={e=>set('seuil_alerte',e.target.value)}/>
          </div>
          <div>
            <label style={labelS}>Date de péremption</label>
            <input type="date" style={inputS} value={form.date_expiration} onChange={e=>set('date_expiration',e.target.value)}/>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 16px', border:'1.5px solid #e2e8f0', borderRadius:9, background:'white', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>Plus tard</button>
            <button onClick={go} disabled={loading||!form.nb_cond||!form.seuil_alerte} style={{ padding:'9px 20px', border:'none', borderRadius:9, background:loading||!form.nb_cond||!form.seuil_alerte?'#e2e8f0':'linear-gradient(135deg,#0ea5e9,#0284c7)', color:loading||!form.nb_cond||!form.seuil_alerte?'#94a3b8':'white', fontSize:13, fontWeight:700, cursor:loading||!form.nb_cond||!form.seuil_alerte?'not-allowed':'pointer' }}>
              {loading?'Enregistrement…':'Créer le stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB CATALOGUE
══════════════════════════════════════════════════════════ */
function TabCatalogue() {
  const [medicaments,setMedicaments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [search,setSearch]=useState('');
  const [modalNouv,setModalNouv]=useState(false);
  const [modalEntree,setModalEntree]=useState(null);
  const [modalStock,setModalStock]=useState(null);
  const [modalEdit,setModalEdit]=useState(null);

  const flash=(msg)=>{ setSuccess(msg); setTimeout(()=>setSuccess(''),4000); };

  const load=async()=>{
    setLoading(true); setError('');
    try { setMedicaments(Array.isArray(await getMedicaments())?await getMedicaments():[]); }
    catch { setError('Impossible de charger le catalogue.'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const filtered=useMemo(()=>medicaments.filter(m=>!search||`${m.nom} ${m.dosage}`.toLowerCase().includes(search.toLowerCase())),[medicaments,search]);

  const handleCreatedMed=async(med)=>{ await load(); if(!med?.stock_info?.id) setModalStock(med); flash(`Médicament "${med.nom}" créé`); };
  const handleUpdatedMed=async(med)=>{ await load(); flash(`Médicament "${med.nom}" modifié`); };
  const handleStockInitial=async(med,formStock)=>{
    try {
      await creerStock({ medicament:med.id, quantite:Number(formStock.quantite)*(med.qte_par_conditionnement||1), seuil_alerte:Number(formStock.seuil_alerte), date_expiration:formStock.date_expiration||null });
      setModalStock(null); await load(); flash('Stock initial ajouté');
    } catch { setError('Création du stock initial impossible.'); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <div style={{ flex:1, position:'relative' }}>
          <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><IcoSearch c="#94a3b8" size={13}/></div>
          <input style={{ ...inputS, paddingLeft:32 }} placeholder="Rechercher un médicament…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button onClick={load} title="Actualiser"
          style={{ padding:'9px 13px', border:'1.5px solid #bae6fd', borderRadius:9, background:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
          onMouseEnter={e=>e.currentTarget.style.background='#e0f2fe'}
          onMouseLeave={e=>e.currentTarget.style.background='white'}>
          <IcoRefresh c="#0369a1" size={13}/>
        </button>
        <button onClick={()=>setModalNouv(true)}
          style={{ padding:'9px 16px', border:'none', borderRadius:9, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', fontSize:12.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', boxShadow:'0 3px 10px rgba(14,165,233,.3)' }}>
          <IcoPlus c="white" size={12}/> Nouveau médicament
        </button>
      </div>

      {success && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f0fdf9', border:'1px solid #99f6e4', color:'#0f766e', borderRadius:9, padding:'9px 13px', fontSize:13, fontWeight:600 }}><IcoCheck c="#0d9488" size={13}/>{success}</div>}
      {error   && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:9, padding:'9px 13px', fontSize:13 }}><IcoDanger c="#dc2626" size={13}/>{error}</div>}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:82, borderRadius:12, background:'linear-gradient(90deg,#f8fafc 25%,#f1f5f9 50%,#f8fafc 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div style={{ background:'#f8fafc', border:'1px dashed #e2e8f0', borderRadius:12, padding:28, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
          {search?'Aucun résultat pour cette recherche.':'Aucun médicament dans le catalogue.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(m=>{
            const si=m.stock_info||{};
            const stockId=si?.id??null;
            const meta=stockMeta(si?.statut, si?.quantite, si?.seuil_alerte);
            const unite=labelUnite(m.unite, m.unite_personnalise);
            const cond=labelCond(m.conditionnement);
            const qpc=m.qte_par_conditionnement||1;

            return (
              <div key={m.id} style={{ background:'white', border:'1px solid #e8edf5', borderLeft:`4px solid ${meta.barColor}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:11, background:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  <IcoPill c="#0369a1" size={18}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between', flexWrap:'wrap' }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a' }}>
                      {m.nom} {m.dosage&&<span style={{ fontWeight:500, color:'#64748b' }}>{m.dosage}</span>}
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, border:`1px solid ${meta.border}`, background:meta.bg, color:meta.color, flexShrink:0 }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:11, background:'#e0f2fe', color:'#0369a1', borderRadius:99, padding:'2px 8px', fontWeight:600 }}>{unite}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8' }}>
                      <IcoBox c="#94a3b8" size={11}/> 1 {cond.toLowerCase()} = {qpc} {unite.toLowerCase()}(s)
                    </span>
                    <span style={{ fontSize:12, fontWeight:700, color:meta.color }}>
                      {si?.quantite??0} {unite.toLowerCase()}(s) en stock
                    </span>
                  </div>
                  {/* Barre de stock */}
                  <StockBar quantite={si?.quantite??0} seuil={si?.seuil_alerte??0} statut={si?.statut}/>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0, marginTop:2 }}>
                  <button
                    onClick={()=>setModalEdit({ medicament:m, stock:stockId ? si : null })}
                    style={{ padding:'7px 12px', border:'1.5px solid #99f6e4', borderRadius:9, background:'#f0fdfa', color:'#0f766e', fontSize:12.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
                    onMouseEnter={e=>e.currentTarget.style.background='#ccfbf1'}
                    onMouseLeave={e=>e.currentTarget.style.background='#f0fdfa'}>
                    <IcoEdit c="#0f766e" size={11}/> Modifier
                  </button>
                  <button
                    onClick={()=>{ if(stockId) setModalEntree({medicament:m,stockId}); else setModalStock(m); }}
                    style={{ padding:'7px 14px', border:'1.5px solid #7dd3fc', borderRadius:9, background:'#e0f2fe', color:'#0284c7', fontSize:12.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
                    onMouseEnter={e=>e.currentTarget.style.background='#bae6fd'}
                    onMouseLeave={e=>e.currentTarget.style.background='#e0f2fe'}>
                    <IcoPlus c="#0284c7" size={11}/> Entrée
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalNouv && <ModalNouveauMedicament onClose={()=>setModalNouv(false)} onCreated={handleCreatedMed}/>}
      {modalEntree && <ModalEntreeStock medicament={modalEntree.medicament} stockId={modalEntree.stockId} onClose={()=>setModalEntree(null)} onSuccess={async()=>{ await load(); flash('Stock mis à jour'); }}/>}
      {modalStock && <ModalStockInitial medicament={modalStock} onClose={()=>setModalStock(null)} onSubmit={handleStockInitial}/>}
      {modalEdit && <ModalModifierMedicament medicament={modalEdit.medicament} stock={modalEdit.stock} onClose={()=>setModalEdit(null)} onUpdated={handleUpdatedMed}/>} 
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB ALERTES
══════════════════════════════════════════════════════════ */
function TabAlertes({ active, onLoad }) {
  const [alertes,setAlertes]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  const load=async()=>{
    setLoading(true); setError('');
    try {
      const data = Array.isArray(await getAlertes()) ? await getAlertes() : [];
      setAlertes(data);
      // Met à jour le badge parent
      if (onLoad) {
        const n = data.filter(a=>['FAIBLE','EPUISE'].includes(String(a?.statut||'').toUpperCase())).length;
        onLoad(n);
      }
    }
    catch { setError('Impossible de charger les alertes.'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ if(active) load(); },[active]);

  const faibleOuEpuise=useMemo(()=>alertes.filter(a=>['FAIBLE','EPUISE'].includes(String(a?.statut||'').toUpperCase())),[alertes]);
  const peremption=useMemo(()=>alertes.filter(a=>{ const d=daysTo(a?.date_expiration); return d!==null&&d>=0&&d<=30; }),[alertes]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Alertes stock</div>
        <button onClick={load} style={{ padding:'7px 13px', border:'1.5px solid #e2e8f0', borderRadius:8, background:'white', color:'#64748b', fontSize:12.5, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
          onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'}
          onMouseLeave={e=>e.currentTarget.style.background='white'}>
          <IcoRefresh c="#64748b" size={12}/> Actualiser
        </button>
      </div>
      {error && <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:9, padding:'9px 13px', fontSize:13 }}><IcoDanger c="#dc2626" size={13}/>{error}</div>}
      {loading ? <div style={{ color:'#64748b', fontSize:13 }}>Chargement…</div> : alertes.length===0 ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf9', border:'1px solid #99f6e4', color:'#0f766e', borderRadius:10, padding:'12px 14px', fontSize:13, fontWeight:600 }}>
          <IcoCheck c="#0d9488" size={14}/> Aucune alerte — tout le stock est suffisant
        </div>
      ) : (
        <>
          {faibleOuEpuise.length>0 && (
            <section style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>
                <IcoWarn c="#d97706" size={14}/> Stock faible ou épuisé
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {faibleOuEpuise.map(a=>{
                  const meta=stockMeta(a?.statut,a?.quantite,a?.seuil_alerte);
                  const nom=a?.medicament_nom||`Médicament #${a?.medicament}`;
                  const unite=labelUnite(a?.medicament_unite, a?.medicament_unite_personnalise);
                  return (
                    <div key={a.id} style={{ border:`1px solid ${meta.border}`, borderLeft:`4px solid ${meta.barColor}`, borderRadius:10, padding:'10px 14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginBottom:6 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{nom}</div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, border:`1px solid ${meta.border}`, background:meta.bg, color:meta.color }}>{meta.label}</span>
                      </div>
                      <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>
                        Stock : <strong style={{ color:meta.color }}>{a?.quantite??0} {unite.toLowerCase()}(s)</strong> | Seuil : {a?.seuil_alerte??0}
                      </div>
                      <StockBar quantite={a?.quantite??0} seuil={a?.seuil_alerte??0} statut={a?.statut}/>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {peremption.length>0 && (
            <section style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>
                <IcoClock c="#92400e" size={14}/> Péremption proche (≤ 30 jours)
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {peremption.map(a=>{
                  const nom=a?.medicament_nom||`Médicament #${a?.medicament}`;
                  const jours=daysTo(a?.date_expiration);
                  const urgent=jours<=7;
                  return (
                    <div key={`exp-${a.id}`} style={{ border:`1px solid ${urgent?'#fecaca':'#fde68a'}`, borderLeft:`4px solid ${urgent?'#ef4444':'#f59e0b'}`, borderRadius:10, padding:'10px 14px', background:urgent?'#fef2f2':'#fffbeb' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{nom}</div>
                        <span style={{ fontSize:11, fontWeight:700, background:urgent?'#fee2e2':'#fef3c7', color:urgent?'#b91c1c':'#92400e', padding:'2px 8px', borderRadius:20 }}>
                          {jours} jour{jours>1?'s':''}
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:urgent?'#b91c1c':'#92400e', marginTop:4 }}>
                        <IcoClock c={urgent?'#b91c1c':'#92400e'} size={11}/>
                        Expire le {new Date(a.date_expiration).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════ */
const TABS = [
  { key:'catalogue',   label:'Catalogue & Stock'  },
  { key:'alertes',     label:'Alertes'            },
  { key:'ordonnances', label:'Ordonnances'         },
  { key:'don',         label:'Dispensation libre'  },
  { key:'historique',  label:'Historique'          },
];

const IcoHisto = ({ c='#7c3aed', size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

const TAB_ICONS = {
  catalogue:   (c) => <IcoBox    c={c} size={13}/>,
  alertes:     (c) => <IcoBell   c={c} size={13}/>,
  ordonnances: (c) => <IcoSearch c={c} size={13}/>,
  don:         (c) => <IcoPill   c={c} size={13}/>,
  historique:  (c) => <IcoHisto  c={c} size={13}/>,
};

export default function GestionStock() {
  const [tab,          setTab]          = useState('catalogue');
  const [nbAlertes,    setNbAlertes]    = useState(0);
  const [nbOrdonnances,setNbOrdonnances]= useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  // Charger les badges alertes + ordonnances dès le montage et toutes les 60s
  useEffect(()=>{
    const chargerBadges = () => {
      // Badge alertes
      getAlertes().then(data=>{
        const arr = Array.isArray(data) ? data : [];
        const n = arr.filter(a=>['FAIBLE','EPUISE'].includes(String(a?.statut||'').toUpperCase())).length;
        setNbAlertes(n);
      }).catch(()=>{});
      // Badge ordonnances — chargé dès le montage, plus besoin d'attendre le clic
      getLignesEnAttente().then(data=>{
        const arr = Array.isArray(data) ? data : [];
        setNbOrdonnances(arr.length);
      }).catch(()=>{});
    };
    chargerBadges();
    const timer = setInterval(chargerBadges, 60000); // rafraichit toutes les 60s
    return () => clearInterval(timer);
  },[]);

  // Fonction d'export Excel du stock
  const handleExportStock = async () => {
    setExportLoading(true);
    try {
      const blob = await exportStockMedicaments();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stock-medicaments-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      await uiAlert({ icon: 'error', title: 'Export', text: "Impossible de télécharger l'export Excel." });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:16, flex:1, minHeight:0, overflow:'auto' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse-badge{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
      `}</style>
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {TABS.map(t=>{
          const active   = tab===t.key;
          const icoColor = active ? 'white' : (t.key==='alertes' && nbAlertes>0 ? '#dc2626' : t.key==='ordonnances' && nbOrdonnances>0 ? '#0284c7' : '#64748b');
          const isAlerte = t.key==='alertes';
          const isOrdo   = t.key==='ordonnances';
          const hasAlert = isAlerte && nbAlertes>0;
          const hasOrdo  = isOrdo  && nbOrdonnances>0;
          const hasNotif = hasAlert || hasOrdo;
          const notifColor  = hasAlert ? '#dc2626' : '#0284c7';
          const notifBorder = hasAlert ? '#fecaca' : '#bae6fd';
          const notifBg     = hasAlert ? '#fef2f2' : '#eff6ff';
          const notifCount  = hasAlert ? nbAlertes : nbOrdonnances;

          return (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{
                position:'relative',
                padding:'8px 16px',
                border:`1.5px solid ${active ? (hasAlert?'#dc2626':'#0284c7') : (hasNotif?notifBorder:'#e2e8f0')}`,
                borderRadius:99,
                background: active ? (hasAlert?'#dc2626':'#0284c7') : (hasNotif?notifBg:'white'),
                color: active ? 'white' : (hasNotif?notifColor:'#64748b'),
                fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .15s',
                display:'flex', alignItems:'center', gap:6,
                boxShadow: hasNotif && !active ? `0 0 0 2px ${notifBorder}` : 'none',
              }}
              onMouseEnter={e=>{ if(!active) e.currentTarget.style.borderColor=hasAlert?'#ef4444':hasOrdo?'#7dd3fc':'#7dd3fc'; }}
              onMouseLeave={e=>{ if(!active) e.currentTarget.style.borderColor=hasNotif?notifBorder:'#e2e8f0'; }}>
              {TAB_ICONS[t.key](icoColor)} {t.label}
              {/* Badge notification */}
              {hasNotif && (
                <span style={{
                  position:'absolute', top:-7, right:-7,
                  minWidth:18, height:18, borderRadius:99,
                  background:notifColor, color:'white',
                  fontSize:10, fontWeight:900,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  padding:'0 4px', border:'2px solid white',
                  boxShadow:`0 2px 6px ${notifColor}80`,
                  animation:'pulse-badge 1.8s ease-in-out infinite',
                  lineHeight:1,
                }}>
                  {notifCount}
                </span>
              )}
            </button>
          );
        })}
        </div>
        <button 
          onClick={handleExportStock}
          disabled={exportLoading}
          style={{
            padding:'8px 16px',
            border:'1.5px solid #7dd3fc',
            borderRadius:99,
            background:exportLoading ? '#e2e8f0' : 'white',
            color:exportLoading ? '#94a3b8' : '#0284c7',
            fontSize:12.5, fontWeight:700, cursor:exportLoading ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap:6,
            transition:'all .15s',
            whiteSpace:'nowrap',
          }}
          onMouseEnter={e=>{ if(!exportLoading) e.currentTarget.style.background='#eff6ff'; }}
          onMouseLeave={e=>{ if(!exportLoading) e.currentTarget.style.background='white'; }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {exportLoading ? 'Export en cours…' : 'Exporter Excel'}
        </button>
      </div>
      {tab==='catalogue'   && <TabCatalogue/>}
      {tab==='alertes'     && <TabAlertes active={tab==='alertes'} onLoad={setNbAlertes}/>}
      {tab==='ordonnances' && <OrdonnancesEnAttente onLoad={setNbOrdonnances}/>}
      {tab==='don'         && <DonDirect/>}
      {tab==='historique'  && <HistoriqueDispensations/>}
    </div>
  );
}