import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { getNombreNonLues } from '../api/hsseNotificationsApi';
import VueExtractionMedecins from '../components/hsse/VueExtractionMedecins';
import EnquetesHSSE from '../components/hsse/EnquetesHSSE';
import LogoutButton from '../components/LogoutButton';
import SiteAssignmentWarning from '../components/common/SiteAssignmentWarning';
import { getUserSiteId, getUserSiteName } from '../utils/siteAccessControl';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const P = {
  blue900:'#0c4a6e',blue800:'#075985',blue700:'#0369a1',blue600:'#0284c7',
  blue500:'#0ea5e9',blue400:'#38bdf8',blue300:'#7dd3fc',blue200:'#bae6fd',
  blue100:'#e0f2fe',blue50:'#f0f9ff',
  red:'#ef4444',redBg:'#fef2f2',orange:'#f97316',orangeBg:'#fff7ed',
  amber:'#f59e0b',amberBg:'#fffbeb',green:'#22c55e',greenBg:'#f0fdf4',
  text:'#0f172a',text2:'#334155',muted:'#94a3b8',
  border:'#e2e8f0',bg:'#f0f9ff',white:'#ffffff',
  sidebar:'linear-gradient(195deg,#f0f9ff 0%,#e0f2fe 20%,#bae6fd 45%,#7dd3fc 68%,#38bdf8 85%,#0ea5e9 100%)',
};

const I = {
  Dashboard:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  Alert:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Car:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Virus:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
  Calendar:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Package:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  File:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  User:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Settings:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Logout:()=><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  Refresh:()=><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  Shield:()=><svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Ambulance:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/><line x1="9" y1="7" x2="9" y2="13"/><line x1="6" y1="10" x2="12" y2="10"/></svg>,
  TrendUp:()=><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  ChevL:()=><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:()=><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Check:()=><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  X:()=><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Activity:()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const NAV = [
  { section:'Vue Globale', items:[{ id:'dashboard', label:'Tableau de bord', Icon:I.Dashboard }]},
  { section:'Sécurité', items:[
    { id:'incidents',  label:'Incidents',                Icon:I.Alert },
    { id:'accidents',  label:'Accidents de travail',     Icon:I.Car },
    { id:'maladies',   label:'Maladies professionnelles',Icon:I.Virus },
  ]},
  { section:'Médical', items:[
    { id:'visites',       label:'Visites médicales',     Icon:I.Calendar },
    { id:'contrevisites', label:'Contre-visites',        Icon:I.User },
    { id:'urgences',      label:'Transferts urgences',   Icon:I.Ambulance },
  ]},
  { section:'Gestion', items:[
    { id:'stock',         label:'Inventaire & Stock',    Icon:I.Package },
    { id:'declarations',  label:'Déclarations CNAM',     Icon:I.File },
  ]},
  { section:'Configuration', items:[
    { id:'parametres',          label:'Heures / Effectifs',            Icon:I.Settings },
    { id:'extraction_medecins', label:'Extraction activité médecins', Icon:I.File },
  ]},
];

const MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fn = v => v == null ? '—' : Number(v).toLocaleString('fr-FR');
const fr = v => v == null ? <em style={{color:P.muted,fontSize:11}}>N/A</em> : Number(v).toFixed(4);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:P.white, border:`1px solid ${P.border}`, borderRadius:8, padding:'8px 12px', boxShadow:'0 4px 16px rgba(0,0,0,.1)', fontSize:12 }}>
      {label && <div style={{ fontWeight:700, color:P.text, marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, color:P.text2 }}>
          <span style={{ width:8,height:8,borderRadius:2,background:p.color,flexShrink:0 }}/>
          <span>{p.name} : </span>
          <strong style={{ color:p.color }}>{fn(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

function Card({ children, style={} }) {
  return <div style={{ background:P.white,border:`1px solid ${P.border}`,borderRadius:14,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.05)',...style }}>{children}</div>;
}

function CardTitle({ icon:Icon, children }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${P.border}` }}>
      <span style={{ width:30,height:30,borderRadius:8,background:P.blue50,display:'flex',alignItems:'center',justifyContent:'center',color:P.blue500 }}>{Icon&&<Icon/>}</span>
      <span style={{ fontSize:14,fontWeight:700,color:P.blue900 }}>{children}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, color, Icon }) {
  return (
    <div style={{ background:P.white,border:`1px solid ${color}22`,borderTop:`3px solid ${color}`,borderRadius:12,padding:'16px 18px',minWidth:0,boxShadow:'0 2px 8px rgba(0,0,0,.04)',display:'flex',flexDirection:'column',gap:8 }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
        <span style={{ fontSize:10.5,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:'.6px',lineHeight:1.4 }}>{label}</span>
        <span style={{ width:32,height:32,borderRadius:8,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',color,flexShrink:0 }}>{Icon&&<Icon/>}</span>
      </div>
      <div style={{ fontSize:34,fontWeight:900,color,lineHeight:1 }}>{fn(value)}</div>
      {sub && <div style={{ fontSize:11,color:P.muted }}>{sub}</div>}
    </div>
  );
}

function VueDashboard({ data }) {
  if (!data) return null;
  const { incidents,accidents_travail:AT,accidents_trajet:Aj,maladies_professionnelles:MP,contre_visites:CV,transferts_urgences:TU,declarations_cnam:CNAM,inventaire:INV,parametre:PARAM,ratios_desactive_si_heures_nulles:WARN,mois,annee } = data;

  const accPieData = [
    { name:'Acc. travail', value:AT?.nombre||0, color:P.red },
    { name:'Acc. trajet',  value:Aj?.nombre||0, color:P.orange },
    { name:'Maladies pro.',value:MP?.nombre||0, color:P.blue500 },
    { name:'Incidents',    value:incidents?.nombre_total||0, color:P.amber },
  ].filter(d=>d.value>0);
  const accPieTotal = accPieData.reduce((s,d)=>s+d.value,0);

  const joursData = [
    { name:'Acc. travail', jours:AT?.jours_perdus_total||0, repos:AT?.jours_repos_initial_total||0 },
    { name:'Acc. trajet',  jours:Aj?.jours_perdus_total||0, repos:Aj?.jours_repos_initial_total||0 },
    { name:'Mal. pro.',    jours:MP?.jours_repos_total||0,  repos:MP?.jours_repos_total||0 },
  ];

  const cvTotal = (CV?.repos_accorde||0)+(CV?.refus||0);
  const cvPct = cvTotal>0 ? Math.round((CV?.repos_accorde||0)/cvTotal*100) : 0;

  const stockData = [
    { name:'Rupture',      val:INV?.medicaments?.rupture||0,           color:P.red },
    { name:'Stock limité', val:INV?.medicaments?.stock_limite||0,      color:P.orange },
    { name:'Près expir.',  val:INV?.medicaments?.proche_expiration||0, color:P.amber },
    { name:'Périmés',      val:INV?.medicaments?.perimes||0,           color:P.blue500 },
  ];

  const cnamData = [
    { name:'Soumises',   value:CNAM?.soumises_mois||0, color:P.green },
    { name:'En attente', value:CNAM?.en_attente||0,    color:P.amber },
    { name:'En retard',  value:CNAM?.en_retard||0,     color:P.red },
  ].filter(d=>d.value>0);

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
      {WARN && (
        <div style={{ background:P.amberBg,borderLeft:`3px solid ${P.amber}`,borderRadius:8,padding:'11px 16px',fontSize:12.5,color:'#78350f',display:'flex',alignItems:'center',gap:10 }}>
          <I.Alert/> Les heures travaillées ne sont pas renseignées — ratios Q107/Q110 désactivés.
        </div>
      )}

      {PARAM && (
        <div style={{ background:`linear-gradient(135deg,${P.blue200},${P.blue300})`,borderRadius:14,padding:'16px 22px',color:P.blue900,display:'flex',alignItems:'center',justifyContent:'space-between',border:`1px solid ${P.blue300}`,boxShadow:'0 2px 12px rgba(14,165,233,.15)' }}>
          <div style={{ display:'flex',gap:28,alignItems:'center' }}>
            {[{l:'Heures travaillées',v:`${fn(PARAM.heures_travaillees)} h`},{l:'Effectif',v:`${fn(PARAM.effectif_utilise_pour_mp)} pers.`},{l:'Période',v:`${MOIS[mois]} ${annee}`}].map(({l,v},i)=>(
              <div key={i}>
                <div style={{ fontSize:9.5,opacity:.55,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:17,fontWeight:800 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11,color:P.blue600,fontWeight:600,display:'flex',alignItems:'center',gap:6 }}><I.Activity/> Supervision active</div>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14 }}>
        <KpiCard label="Incidents" value={incidents?.nombre_total||0} color={P.amber} Icon={I.Alert} sub={`${incidents?.nombre_avec_bon||0} avec bon CNAM`}/>
        <KpiCard label="Accidents travail" value={AT?.nombre||0} color={P.red} Icon={I.Car} sub={`${AT?.jours_perdus_total||0} jours perdus`}/>
        <KpiCard label="Accidents trajet" value={Aj?.nombre||0} color={P.orange} Icon={I.Car} sub={`${Aj?.jours_perdus_total||0} jours perdus`}/>
        <KpiCard label="Maladies pro." value={MP?.nombre||0} color={P.blue500} Icon={I.Virus} sub={`${MP?.jours_repos_total||0} jours de repos`}/>
      </div>

      {/* Row 2 — 3 graphiques */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16 }}>
        {/* PIE évènements */}
        <Card>
          <CardTitle icon={I.Activity}>Répartition des évènements</CardTitle>
          {accPieTotal===0 ? (
            <div style={{ height:240,display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,fontSize:13 }}>Aucun évènement ce mois</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={accPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value" labelLine={false}>
                    {accPieData.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
                    <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize:22,fontWeight:900,fill:P.red }}>{accPieTotal}</text>
                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize:10,fill:P.muted }}>évènements</text>
                  </Pie>
                  <Tooltip content={<ChartTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex',flexDirection:'column',gap:6,marginTop:4 }}>
                {accPieData.map((d,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:6 }}><span style={{ width:10,height:10,borderRadius:3,background:d.color }}/><span style={{ color:P.text2 }}>{d.name}</span></div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}><span style={{ fontWeight:700,color:d.color }}>{d.value}</span><span style={{ fontSize:10.5,color:P.muted }}>{Math.round(d.value/accPieTotal*100)}%</span></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* BAR jours perdus */}
        <Card>
          <CardTitle icon={I.Alert}>Jours perdus par catégorie</CardTitle>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={joursData} margin={{ top:5,right:10,left:-15,bottom:5 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ fill:`${P.blue500}08` }}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
              <Bar dataKey="jours" name="Jours perdus" radius={[6,6,0,0]} fill={P.red}/>
              <Bar dataKey="repos" name="Repos initial" radius={[6,6,0,0]} fill={`${P.red}50`}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Contre-visites gauge */}
        <Card>
          <CardTitle icon={I.User}>Contre-visites</CardTitle>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0' }}>
            <div style={{ position:'relative',width:140,height:140 }}>
              <svg viewBox="0 0 140 140" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke={`${P.green}20`} strokeWidth="12"/>
                <circle cx="70" cy="70" r="58" fill="none" stroke={P.green} strokeWidth="12" strokeDasharray={`${cvPct/100*364.4} 364.4`} strokeLinecap="round"/>
              </svg>
              <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
                <span style={{ fontSize:30,fontWeight:900,color:P.green }}>{cvPct}%</span>
                <span style={{ fontSize:10,color:P.muted }}>accordées</span>
              </div>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8 }}>
            <div style={{ textAlign:'center',padding:'12px 8px',background:P.greenBg,borderRadius:9 }}>
              <div style={{ fontSize:24,fontWeight:800,color:P.green }}>{fn(CV?.repos_accorde)}</div>
              <div style={{ fontSize:10.5,color:P.green,fontWeight:600,marginTop:3 }}>Repos accordé</div>
            </div>
            <div style={{ textAlign:'center',padding:'12px 8px',background:P.redBg,borderRadius:9 }}>
              <div style={{ fontSize:24,fontWeight:800,color:P.red }}>{fn(CV?.refus)}</div>
              <div style={{ fontSize:10.5,color:P.red,fontWeight:600,marginTop:3 }}>Refus</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 — stock + CNAM + indicateurs */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16 }}>
        {/* Stock barres */}
        <Card>
          <CardTitle icon={I.Package}>Alertes inventaire</CardTitle>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {stockData.map(({ name,val,color })=>{
              const mx=Math.max(...stockData.map(d=>d.val),1);
              return (
                <div key={name}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                    <span style={{ fontSize:12,color:P.text2 }}>{name}</span>
                    <span style={{ fontSize:14,fontWeight:800,color }}>{val}</span>
                  </div>
                  <div style={{ height:10,borderRadius:5,background:`${color}15`,overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:5,background:color,width:`${Math.round(val/mx*100)}%`,transition:'width .6s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>
          {INV?.equipements_endommages>0 && (
            <div style={{ marginTop:14,padding:'9px 12px',background:P.amberBg,borderLeft:`3px solid ${P.amber}`,borderRadius:6,fontSize:12,color:'#92400e' }}>
              {INV.equipements_endommages} équipement(s) endommagé(s)
            </div>
          )}
        </Card>

        {/* CNAM donut */}
        <Card>
          <CardTitle icon={I.File}>Déclarations CNAM</CardTitle>
          {cnamData.length===0 ? (
            <div style={{ height:180,display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,fontSize:13 }}>Aucune déclaration</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={cnamData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value" labelLine={false}>
                    {cnamData.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
                  </Pie>
                  <Tooltip content={<ChartTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex',flexDirection:'column',gap:7,marginTop:4 }}>
                {cnamData.map((d,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:6 }}><span style={{ width:9,height:9,borderRadius:2,background:d.color }}/><span style={{ color:P.text2 }}>{d.name}</span></div>
                    <span style={{ fontWeight:700,color:d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {CNAM?.en_retard>0 && (
            <div style={{ marginTop:12,padding:'8px 12px',background:P.redBg,borderLeft:`3px solid ${P.red}`,borderRadius:6,fontSize:11.5,color:'#7f1d1d',fontWeight:600 }}>
              {CNAM.en_retard} déclaration(s) en retard — action requise
            </div>
          )}
        </Card>

        {/* Ratios + urgences */}
        <Card>
          <CardTitle icon={I.TrendUp}>Indicateurs clés</CardTitle>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <div style={{ padding:'13px 14px',background:`${P.red}08`,border:`1px solid ${P.red}20`,borderRadius:10 }}>
              <div style={{ fontSize:10.5,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4 }}>Ratio fréquence Q107 (travail)</div>
              <div style={{ fontSize:20,fontWeight:900,color:P.red }}>{fr(AT?.ratio_q107)}</div>
              <div style={{ fontSize:10,color:P.muted,marginTop:2 }}>× 200 000 h travaillées</div>
            </div>
            <div style={{ padding:'13px 14px',background:`${P.orange}08`,border:`1px solid ${P.orange}20`,borderRadius:10 }}>
              <div style={{ fontSize:10.5,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4 }}>Ratio gravité Q110 (travail)</div>
              <div style={{ fontSize:20,fontWeight:900,color:P.orange }}>{fr(AT?.ratio_q110)}</div>
              <div style={{ fontSize:10,color:P.muted,marginTop:2 }}>× 200 000 h travaillées</div>
            </div>
            <div style={{ padding:'13px 14px',background:TU?.nombre>0?P.redBg:P.greenBg,border:`1px solid ${TU?.nombre>0?P.red:P.green}20`,borderRadius:10,display:'flex',alignItems:'center',gap:12 }}>
              <span style={{ fontSize:28,fontWeight:900,color:TU?.nombre>0?P.red:P.green }}>{fn(TU?.nombre)}</span>
              <div><div style={{ fontSize:12,fontWeight:700,color:P.text2 }}>Transferts urgences</div><div style={{ fontSize:10.5,color:P.muted }}>ce mois</div></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function VueIncidents({ data }) {
  if (!data) return null;
  const inc = data.incidents;
  const total = inc?.nombre_total||0;
  const pieData = [{ name:'Avec bon CNAM',value:inc?.nombre_avec_bon||0,color:P.amber },{ name:'Sans bon',value:inc?.nombre_sans_bon||0,color:P.blue400 }].filter(d=>d.value>0);
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
      <Card>
        <CardTitle icon={I.Alert}>Répartition des incidents</CardTitle>
        {total===0 ? <div style={{ height:220,display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,fontSize:13 }}>Aucun incident ce mois</div> : (
          <>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={88} dataKey="value" paddingAngle={4} label={({ name, percent })=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:P.border }}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
                </Pie>
                <Tooltip content={<ChartTip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex',gap:20,justifyContent:'center' }}>
              {[{l:'Total',v:total,c:P.blue500},{l:'Avec bon',v:inc?.nombre_avec_bon,c:P.amber},{l:'Sans bon',v:inc?.nombre_sans_bon,c:P.blue400}].map(({l,v,c})=>(
                <div key={l} style={{ textAlign:'center' }}><div style={{ fontSize:20,fontWeight:800,color:c }}>{fn(v)}</div><div style={{ fontSize:11,color:P.muted }}>{l}</div></div>
              ))}
            </div>
          </>
        )}
      </Card>
      <Card>
        <CardTitle icon={I.Activity}>Statistiques incidents</CardTitle>
        <div style={{ display:'flex',flexDirection:'column',gap:16,marginTop:8 }}>
          {[{ l:'Total incidents',v:total,c:P.blue500,pct:100 },{ l:'Avec bon CNAM',v:inc?.nombre_avec_bon||0,c:P.amber,pct:total>0?Math.round((inc?.nombre_avec_bon||0)/total*100):0 },{ l:'Sans bon',v:inc?.nombre_sans_bon||0,c:P.blue400,pct:total>0?Math.round((inc?.nombre_sans_bon||0)/total*100):0 }].map(({ l,v,c,pct })=>(
            <div key={l}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                <span style={{ fontSize:12.5,color:P.text2 }}>{l}</span>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ fontSize:14,fontWeight:800,color:c }}>{fn(v)}</span>
                  <span style={{ fontSize:10.5,background:`${c}15`,color:c,padding:'1px 7px',borderRadius:12,fontWeight:700 }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height:8,borderRadius:4,background:`${c}15`,overflow:'hidden' }}>
                <div style={{ height:'100%',borderRadius:4,background:c,width:`${pct}%`,transition:'width .5s' }}/>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AccidentsFiltresBar({
  P,
  filtreCategorie, setFiltreCategorie,
  filtreCriticite, setFiltreCriticite,
  filtrePlantSection, setFiltrePlantSection,
  filtreLieu, setFiltreLieu,
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '12px 14px', background: P.white, borderRadius: 12,
      border: `1px solid ${P.border}`, boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: P.text2, textTransform: 'uppercase', letterSpacing: '.5px' }}>Filtres :</span>
      <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 12, color: P.text, background: P.white, cursor: 'pointer', outline: 'none' }}>
        <option value="tous">Catégorie : Tous</option>
        <option value="travail">Travail</option>
        <option value="trajet">Trajet</option>
      </select>
      <select value={filtreCriticite} onChange={e => setFiltreCriticite(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 12, color: P.text, background: P.white, cursor: 'pointer', outline: 'none' }}>
        <option value="">Criticité : Tous</option>
        <option value="FAIBLE">Faible</option>
        <option value="MODEREE">Modérée</option>
        <option value="GRAVE">Grave</option>
        <option value="TRES_GRAVE">Très grave</option>
      </select>
      <select value={filtrePlantSection} onChange={e => setFiltrePlantSection(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 12, color: P.text, background: P.white, cursor: 'pointer', outline: 'none' }}>
        <option value="">Site / Plant : Tous</option>
        <option value="LTN1-2-4">LTN1-2-4</option>
        <option value="LTN3">LTN3</option>
        <option value="LTN5">LTN5</option>
        <option value="Mateur sud">Mateur Sud</option>
        <option value="Mateur Nord">Mateur Nord</option>
        <option value="Menzel Hayet">Menzel Hayet</option>
      </select>
      <select value={filtreLieu} onChange={e => setFiltreLieu(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${P.border}`, fontSize: 12, color: P.text, background: P.white, cursor: 'pointer', outline: 'none' }}>
        <option value="">Lieu : Tous</option>
        <option value="Production">Production</option>
        <option value="Locaux sanitaires">Locaux sanitaires</option>
        <option value="Cantines">Cantines</option>
        <option value="Périphérie">Périphérie</option>
        <option value="MMC">MMC</option>
        <option value="Zone des déchets">Zone des déchets</option>
        <option value="Parking">Parking</option>
        <option value="Administration">Administration</option>
        <option value="Locaux techniques">Locaux techniques</option>
        <option value="Zone fumeurs">Zone fumeurs</option>
        <option value="Autres">Autres</option>
      </select>
      <button
        type="button"
        onClick={() => {
          setFiltreCategorie('tous');
          setFiltreCriticite('');
          setFiltrePlantSection('');
          setFiltreLieu('');
        }}
        style={{ padding: '6px 13px', borderRadius: 8, border: `1px solid ${P.border}`, background: P.white, color: P.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
      >
        Réinitialiser
      </button>
    </div>
  );
}

function VueAccidents({ data }) {
  if (!data) return null;
  const AT=data.accidents_travail, Aj=data.accidents_trajet;
  const compareData = [
    { name:'Accidents',  travail:AT?.nombre||0,                              trajet:Aj?.nombre||0 },
    { name:'Avec arrêt', travail:AT?.nombre_avec_jours_repos_geq_1||0,       trajet:Aj?.nombre_avec_jours_repos_geq_1||0 },
    { name:'J. repos',   travail:AT?.jours_repos_initial_total||0,           trajet:Aj?.jours_repos_initial_total||0 },
    { name:'J. perdus',  travail:AT?.jours_perdus_total||0,                  trajet:Aj?.jours_perdus_total||0 },
  ];
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <Card>
        <CardTitle icon={I.Car}>Comparaison — Travail vs Trajet</CardTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={compareData} margin={{ top:5,right:20,left:0,bottom:5 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false}/>
            <XAxis dataKey="name" tick={{ fontSize:12,fill:P.muted }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip/>} cursor={{ fill:`${P.blue500}06` }}/>
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12,paddingTop:10 }}/>
            <Bar dataKey="travail" name="Accidents travail" fill={P.red}    radius={[6,6,0,0]}/>
            <Bar dataKey="trajet"  name="Accidents trajet"  fill={P.orange} radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        {[{ title:'Accidents de travail',d:AT,color:P.red },{ title:'Accidents de trajet',d:Aj,color:P.orange }].map(({ title,d,color })=>(
          <Card key={title}>
            <CardTitle icon={I.Car}>{title}</CardTitle>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
              <div style={{ textAlign:'center',padding:'14px',background:`${color}08`,borderRadius:10 }}>
                <div style={{ fontSize:32,fontWeight:900,color }}>{fn(d?.nombre)}</div>
                <div style={{ fontSize:11,color:P.muted,marginTop:4 }}>accidents</div>
              </div>
              <div style={{ textAlign:'center',padding:'14px',background:`${color}06`,borderRadius:10 }}>
                <div style={{ fontSize:32,fontWeight:900,color }}>{fn(d?.jours_perdus_total)}</div>
                <div style={{ fontSize:11,color:P.muted,marginTop:4 }}>jours perdus</div>
              </div>
            </div>
            {[{ l:'Avec arrêt ≥1 jour',v:fn(d?.nombre_avec_jours_repos_geq_1) },{ l:'Ratio fréquence Q107',v:fr(d?.ratio_q107),s:'× 200 000 h' },{ l:'Jours repos initial',v:fn(d?.jours_repos_initial_total) },{ l:'Ratio gravité Q110',v:fr(d?.ratio_q110),s:'× 200 000 h' }].map(({ l,v,s },i,arr)=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<arr.length-1?`1px solid ${P.border}`:'none' }}>
                <span style={{ fontSize:12.5,color:P.text2 }}>{l}{s&&<span style={{ fontSize:10,color:P.muted,marginLeft:4 }}>{s}</span>}</span>
                <span style={{ fontSize:13.5,fontWeight:800,color }}>{v}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

function VueMaladies({ data }) {
  if (!data) return null;
  const mp=data.maladies_professionnelles, param=data.parametre;
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
      <Card>
        <CardTitle icon={I.Virus}>Indicateurs maladies pro.</CardTitle>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20 }}>
          {[{ l:'Cas TMS déclarés',v:mp?.nombre||0,c:P.blue500 },{ l:'Jours repos',v:mp?.jours_repos_total||0,c:P.amber },{ l:'Taux TMS ‰',v:mp?.ratio_pour_1000_travailleurs!=null?Number(mp.ratio_pour_1000_travailleurs).toFixed(2):'—',c:P.blue600 }].map(({ l,v,c })=>(
            <div key={l} style={{ textAlign:'center',padding:'16px 10px',background:`${c}08`,border:`1px solid ${c}20`,borderRadius:10 }}>
              <div style={{ fontSize:26,fontWeight:900,color:c }}>{v}</div>
              <div style={{ fontSize:11,color:P.muted,marginTop:5 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'14px 16px',background:P.blue50,borderRadius:10,fontSize:12.5,color:P.blue800 }}>
          <strong>Effectif utilisé (Nbre d'employés) :</strong> {param?`${fn(param.effectif_utilise_pour_mp)} travailleurs`:'Total collaborateurs (base de données)'}<br/>
          <span style={{ fontSize:11,color:P.blue600,marginTop:4,display:'block' }}>Formule : (Nombre de TMS ÷ Nombre d'employés) × 1 000</span>
        </div>
      </Card>
      <Card>
        <CardTitle icon={I.Activity}>Détail</CardTitle>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',alignItems:'center',gap:16,padding:'18px',background:P.blue50,borderRadius:12 }}>
            <div style={{ fontSize:52,fontWeight:900,color:P.blue600,lineHeight:1 }}>{fn(mp?.jours_repos_total)}</div>
            <div><div style={{ fontSize:14,fontWeight:700,color:P.blue800 }}>jours de repos</div><div style={{ fontSize:12,color:P.muted,marginTop:3 }}>initial + prolongation + rechute</div></div>
          </div>
          <div style={{ padding:'13px 14px',background:`${P.blue500}08`,border:`1px solid ${P.blue500}20`,borderRadius:10 }}>
            <div style={{ fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6 }}>Taux maladies pro. (TMS) × 1 000 travailleurs</div>
            <div style={{ fontSize:28,fontWeight:900,color:P.blue600 }}>{mp?.ratio_pour_1000_travailleurs!=null?Number(mp.ratio_pour_1000_travailleurs).toFixed(4):<em style={{ fontSize:14,color:P.muted }}>Effectif non renseigné</em>}</div>
            <div style={{ fontSize:10,color:P.muted,marginTop:4 }}>= (Nombre de TMS ÷ Nombre d'employés) × 1 000</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function VueVisites({ data }) {
  if (!data) return null;
  const traitant=data.visites_medecin_traitant||[];
  const travail=data.visites_medicales_medecin_travail||[];
  const byMed={};
  travail.forEach(row=>{ const k=row.medecin||'Inconnu'; if(!byMed[k]) byMed[k]={medecin:k,total:0}; byMed[k].total+=row.nombre; byMed[k][row.type_visite_display]=(byMed[k][row.type_visite_display]||0)+row.nombre; });
  const tB=traitant.map(r=>({ name:r.medecin||'—',consultations:r.nombre }));
  const mB=Object.values(byMed).map(m=>({ name:m.medecin,total:m.total }));
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
      <Card>
        <CardTitle icon={I.User}>Consultations — Médecin traitant</CardTitle>
        {tB.length===0 ? <div style={{ height:200,display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,fontSize:13 }}>Aucune consultation ce mois</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tB} layout="vertical" margin={{ top:5,right:20,left:10,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false} width={80}/>
              <Tooltip content={<ChartTip/>} cursor={{ fill:`${P.blue500}08` }}/>
              <Bar dataKey="consultations" name="Consultations" fill={P.blue400} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
      <Card>
        <CardTitle icon={I.Calendar}>Visites aptitude — Médecin travail</CardTitle>
        {mB.length===0 ? <div style={{ height:200,display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,fontSize:13 }}>Aucune visite ce mois</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mB} layout="vertical" margin={{ top:5,right:20,left:10,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false} width={80}/>
              <Tooltip content={<ChartTip/>} cursor={{ fill:`${P.blue500}08` }}/>
              <Bar dataKey="total" name="Total visites" fill={P.blue500} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

function VueContrevisites({ data }) {
  if (!data) return null;
  const cv=data.contre_visites;
  const total=(cv?.repos_accorde||0)+(cv?.refus||0);
  const pct=total>0?Math.round((cv?.repos_accorde||0)/total*100):0;
  const pd=[{ name:'Repos accordé',value:cv?.repos_accorde||0,color:P.green },{ name:'Refus',value:cv?.refus||0,color:P.red }].filter(d=>d.value>0);
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
      <Card>
        <CardTitle icon={I.User}>Résultat des contre-visites</CardTitle>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pd.length?pd:[{ name:'Aucune',value:1,color:P.border }]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
              {(pd.length?pd:[{ color:P.border }]).map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
            </Pie>
            <Tooltip content={<ChartTip/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <div style={{ textAlign:'center',padding:'12px',background:P.greenBg,borderRadius:9 }}><div style={{ fontSize:28,fontWeight:900,color:P.green }}>{fn(cv?.repos_accorde)}</div><div style={{ fontSize:11,color:P.green,fontWeight:600,marginTop:3 }}>Repos accordé</div></div>
          <div style={{ textAlign:'center',padding:'12px',background:P.redBg,borderRadius:9 }}><div style={{ fontSize:28,fontWeight:900,color:P.red }}>{fn(cv?.refus)}</div><div style={{ fontSize:11,color:P.red,fontWeight:600,marginTop:3 }}>Refus</div></div>
        </div>
      </Card>
      <Card>
        <CardTitle icon={I.Activity}>Taux d'accord</CardTitle>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 0' }}>
          <div style={{ position:'relative',width:160,height:160 }}>
            <svg viewBox="0 0 160 160" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="65" fill="none" stroke={`${P.green}20`} strokeWidth="14"/>
              <circle cx="80" cy="80" r="65" fill="none" stroke={P.green} strokeWidth="14" strokeDasharray={`${pct/100*408.4} 408.4`} strokeLinecap="round"/>
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:34,fontWeight:900,color:P.green }}>{pct}%</span>
              <span style={{ fontSize:11,color:P.muted }}>accordées</span>
            </div>
          </div>
          <div style={{ marginTop:14,fontSize:13,color:P.text2 }}>{total} contre-visite(s) ce mois</div>
        </div>
      </Card>
    </div>
  );
}

function VueUrgences({ data }) {
  if (!data) return null;
  const nb=data.transferts_urgences?.nombre||0;
  return (
    <Card style={{ maxWidth:480 }}>
      <CardTitle icon={I.Ambulance}>Transferts aux urgences</CardTitle>
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'30px 0',background:nb>0?P.redBg:P.greenBg,borderRadius:12 }}>
        <div style={{ fontSize:80,fontWeight:900,color:nb>0?P.red:P.green,lineHeight:1 }}>{fn(nb)}</div>
        <div style={{ fontSize:14,color:P.muted,marginTop:10 }}>transfert(s) aux urgences ce mois</div>
        {nb===0 && <div style={{ marginTop:12,color:P.green,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6 }}><I.Check/> Aucun transfert — bilan excellent</div>}
      </div>
    </Card>
  );
}

function VueStock({ data }) {
  if (!data) return null;
  const inv=data.inventaire;
  const articles=inv?.medicaments?.quantites_par_article||[];
  const alertesData=[
    { name:'Rupture',      val:inv?.medicaments?.rupture||0,           color:P.red },
    { name:'Stock limité', val:inv?.medicaments?.stock_limite||0,      color:P.orange },
    { name:'Près expir.',  val:inv?.medicaments?.proche_expiration||0, color:P.amber },
    { name:'Périmés',      val:inv?.medicaments?.perimes||0,           color:P.blue500 },
  ];
  const top10=articles.slice(0,10).map(a=>({ name:a.nom.length>18?a.nom.slice(0,18)+'…':a.nom,quantite:a.quantite }));
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        <Card>
          <CardTitle icon={I.Alert}>Alertes stock</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertesData} margin={{ top:5,right:10,left:-10,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11,fill:P.muted }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ fill:`${P.blue500}06` }}/>
              <Bar dataKey="val" name="Médicaments" radius={[6,6,0,0]}>{alertesData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <CardTitle icon={I.Package}>Top 10 — Quantités</CardTitle>
          {top10.length===0 ? <div style={{ height:200,display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,fontSize:13 }}>Aucun article</div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top10} layout="vertical" margin={{ top:5,right:20,left:10,bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.border} horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:10,fill:P.muted }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:10,fill:P.muted }} axisLine={false} tickLine={false} width={90}/>
                <Tooltip content={<ChartTip/>} cursor={{ fill:`${P.blue500}06` }}/>
                <Bar dataKey="quantite" name="Quantité" fill={P.blue400} radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      {inv?.equipements_endommages>0 && <div style={{ padding:'11px 16px',background:P.amberBg,borderLeft:`3px solid ${P.amber}`,borderRadius:8,fontSize:12.5,color:'#78350f',fontWeight:600 }}>{inv.equipements_endommages} équipement(s) médical/aux endommagé(s) signalé(s) ce mois</div>}
      <Card>
        <CardTitle icon={I.Package}>Inventaire complet — {articles.length} article(s)</CardTitle>
        <div style={{ maxHeight:340,overflowY:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead style={{ position:'sticky',top:0,background:P.white }}>
              <tr>{['Médicament / Article','Quantité','Statut'].map((h,i)=><th key={h} style={{ padding:'9px 10px',textAlign:i===0?'left':'right',color:P.muted,fontWeight:700,fontSize:10.5,textTransform:'uppercase',letterSpacing:'.5px',borderBottom:`2px solid ${P.border}` }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {articles.map((a,i)=>(
                <tr key={i} style={{ background:a.quantite===0?`${P.red}06`:'transparent' }}>
                  <td style={{ padding:'9px 10px',color:P.text,borderBottom:`1px solid ${P.border}` }}>{a.nom}</td>
                  <td style={{ padding:'9px 10px',textAlign:'right',fontWeight:700,color:a.quantite===0?P.red:P.text,borderBottom:`1px solid ${P.border}` }}>{fn(a.quantite)}</td>
                  <td style={{ padding:'9px 10px',textAlign:'right',borderBottom:`1px solid ${P.border}` }}>{a.quantite===0&&<span style={{ padding:'2px 8px',borderRadius:12,background:P.red,color:'white',fontSize:10.5,fontWeight:700 }}>RUPTURE</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function VueDeclarations({ data }) {
  if (!data) return null;
  const d=data.declarations_cnam;
  const pieData=[{ name:'Soumises',value:d?.soumises_mois||0,color:P.green },{ name:'En attente',value:d?.en_attente||0,color:P.amber },{ name:'En retard',value:d?.en_retard||0,color:P.red }].filter(x=>x.value>0);
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
      <Card>
        <CardTitle icon={I.File}>Répartition CNAM</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData.length?pieData:[{ name:'Aucune',value:1,color:P.border }]} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={4} label={({ name,value })=>`${name}: ${value}`} labelLine={{ stroke:P.border }}>
              {(pieData.length?pieData:[{ color:P.border }]).map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
            </Pie>
            <Tooltip content={<ChartTip/>}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <CardTitle icon={I.Activity}>Suivi des déclarations</CardTitle>
        <div style={{ display:'grid',gridTemplateColumns:'1fr',gap:12 }}>
          {[{ l:'Déclarations soumises ce mois',v:d?.soumises_mois,c:P.green,bg:P.greenBg,Ic:I.Check },{ l:'En attente de soumission',v:d?.en_attente,c:P.amber,bg:P.amberBg,Ic:I.Alert },{ l:'En retard (délai légal)',v:d?.en_retard,c:P.red,bg:P.redBg,Ic:I.X }].map((item)=>(
            <div key={item.l} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:item.bg,border:`1px solid ${item.c}20`,borderRadius:10 }}>
              <span style={{ width:36,height:36,borderRadius:9,background:`${item.c}20`,display:'flex',alignItems:'center',justifyContent:'center',color:item.c,flexShrink:0 }}><item.Ic/></span>
              <div style={{ flex:1 }}><div style={{ fontSize:12,color:P.text2,marginBottom:2 }}>{item.l}</div><div style={{ fontSize:26,fontWeight:900,color:item.c,lineHeight:1 }}>{fn(item.v)}</div></div>
            </div>
          ))}
        </div>
        {d?.en_retard>0 && <div style={{ marginTop:14,padding:'10px 14px',background:P.redBg,borderLeft:`3px solid ${P.red}`,borderRadius:8,fontSize:12.5,color:'#7f1d1d',fontWeight:700 }}>Action immédiate requise — {d.en_retard} déclaration(s) hors délai</div>}
      </Card>
    </div>
  );
}

function VueParametres({ mois, annee, onSaved }) {
  const siteId = getUserSiteId();
  const [heures,setHeures]=useState('');
  const [effectif,setEffectif]=useState('');
  const [loading,setLoading]=useState(false);
  const [existing,setExisting]=useState(null);
  const [msg,setMsg]=useState(null);
  useEffect(()=>{
    axiosInstance.get('/hsee/parametres-mensuels/',{ params:{ annee,mois, site_id: siteId } }).then(r=>{
      const list=Array.isArray(r.data)?r.data:(r.data?.results||[]);
      const found=list.find(p=>p.annee===annee&&p.mois===mois);
      if(found){ setExisting(found); setHeures(String(found.heures_travaillees)); setEffectif(found.effectif_travailleurs!=null?String(found.effectif_travailleurs):''); }
      else{ setExisting(null); setHeures(''); setEffectif(''); }
    }).catch(()=>{});
  },[mois,annee]);
  const handleSave=async()=>{
    if(!heures) return; setLoading(true); setMsg(null);
    try{
      const payload={ annee,mois,heures_travaillees:parseInt(heures),effectif_travailleurs:effectif?parseInt(effectif):null };
      if(existing) await axiosInstance.patch(`/hsee/parametres-mensuels/${existing.id}/`,payload);
      else         await axiosInstance.post('/hsee/parametres-mensuels/',payload);
      setMsg({ type:'success',text:'Paramètres enregistrés.' }); if(onSaved) onSaved();
    } catch(e){
      const st=e?.response?.status; const detail=e?.response?.data?.detail;
      let text='Erreur lors de la sauvegarde.';
      if(st===403) text='Accès refusé : rôle insuffisant.';
      else if(typeof detail==='string') text=detail;
      setMsg({ type:'error',text });
    } finally{ setLoading(false); }
  };
  const inp={ width:'100%',padding:'10px 14px',border:`1.5px solid ${P.border}`,borderRadius:9,fontSize:13.5,outline:'none',color:P.text,background:P.white,boxSizing:'border-box',fontFamily:'inherit' };
  return (
    <Card style={{ maxWidth:540 }}>
      <CardTitle icon={I.Settings}>Paramètres HSEE — {MOIS[mois]} {annee}</CardTitle>
      <p style={{ fontSize:12.5,color:P.muted,marginBottom:22,lineHeight:1.7,borderLeft:`3px solid ${P.blue200}`,paddingLeft:12 }}>Ces valeurs sont nécessaires pour calculer les ratios Q107 (fréquence) et Q110 (gravité) des accidents, ainsi que le ratio maladies professionnelles pour 1 000 travailleurs.</p>
      <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
        <div>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:7 }}>Heures travaillées ce mois *</label>
          <input type="number" style={inp} value={heures} onChange={e=>setHeures(e.target.value)} placeholder="ex : 160 000" min="0"/>
          <div style={{ fontSize:11,color:P.muted,marginTop:5 }}>Total heures de travail de l'ensemble des salariés</div>
        </div>
        <div>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:P.muted,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:7 }}>Effectif travailleurs (optionnel)</label>
          <input type="number" style={inp} value={effectif} onChange={e=>setEffectif(e.target.value)} placeholder="ex : 850" min="0"/>
          <div style={{ fontSize:11,color:P.muted,marginTop:5 }}>Si vide, utilise le nombre total de collaborateurs en base</div>
        </div>
        {msg&&<div style={{ padding:'10px 14px',borderRadius:8,fontSize:13,background:msg.type==='success'?P.greenBg:P.redBg,color:msg.type==='success'?P.green:P.red,borderLeft:`3px solid ${msg.type==='success'?P.green:P.red}` }}>{msg.text}</div>}
        <button type="button" onClick={handleSave} disabled={loading||!heures} style={{ padding:'11px 24px',borderRadius:9,border:'none',background:(!loading&&heures)?`linear-gradient(135deg,${P.blue600},${P.blue400})`:P.border,color:(!loading&&heures)?'white':P.muted,fontWeight:700,fontSize:14,cursor:(!loading&&heures)?'pointer':'not-allowed',boxShadow:(!loading&&heures)?`0 4px 14px ${P.blue500}44`:'none' }}>
          {loading?'Enregistrement…':existing?'Mettre à jour':'Enregistrer'}
        </button>
      </div>
    </Card>
  );
}

const DashboardHSSE = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const siteId = getUserSiteId();
  const siteName = getUserSiteName();
  const hasSite = siteId !== null && siteId !== undefined && String(siteId).trim() !== '';
  const [mois,setMois]=useState(now.getMonth()+1);
  const [annee,setAnnee]=useState(now.getFullYear());
  const [vue,setVue]=useState('dashboard');
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [erreur,setErreur]=useState(null);
  const [sbOpen,setSbOpen]=useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filtreCategorie,   setFiltreCategorie]   = useState('tous');
  const [filtreCriticite,   setFiltreCriticite]   = useState('');
  const [filtrePlantSection,setFiltrePlantSection]= useState('');
  const [filtreLieu,        setFiltreLieu]        = useState('');

  const fetchDashboard=useCallback(async()=>{
    if (!hasSite) return;
    setLoading(true); setErreur(null);
    try{
      const params = { annee, mois, site_id: siteId };
      if (vue === 'accidents') {
        if (filtreCategorie && filtreCategorie !== 'tous') params.categorie = filtreCategorie;
        if (filtreCriticite) params.criticite = filtreCriticite;
        if (filtrePlantSection) params.plant_section = filtrePlantSection.trim();
        if (filtreLieu) params.lieu = filtreLieu.trim();
      }
      const r=await axiosInstance.get('/hsee/dashboard/',{ params });
      setData(r.data);
    }
    catch(e){ setErreur(e?.response?.data?.detail||'Erreur de chargement.'); }
    finally{ setLoading(false); }
  },[annee,mois,hasSite,siteId,vue,filtreCategorie,filtreCriticite,filtrePlantSection,filtreLieu]);

  const fetchUnreadCount = useCallback(async () => {
    if (!hasSite) return;
    try {
      const count = await getNombreNonLues();
      setUnreadCount(Number.isFinite(count) && count > 0 ? count : 0);
    } catch {
      // keep previous badge value on transient errors
    }
  }, [hasSite]);

  useEffect(() => {
    if (!hasSite) return undefined;
    void fetchUnreadCount();
    const timer = setInterval(() => {
      void fetchUnreadCount();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount, hasSite]);

  useEffect(()=>{ if(!hasSite) return; if(vue!=='parametres'&&vue!=='extraction_medecins') fetchDashboard(); },[annee,mois,vue,filtreCategorie,filtreCriticite,filtrePlantSection,filtreLieu,fetchDashboard,hasSite]);
  const handleLogout=async()=>{ await logout(); navigate('/login'); };
  const annees=[]; for(let y=now.getFullYear();y>=now.getFullYear()-4;y--) annees.push(y);

  const renderVue=()=>{
    if(vue==='parametres') return <VueParametres mois={mois} annee={annee} onSaved={fetchDashboard}/>;
    if(vue==='extraction_medecins') return <VueExtractionMedecins mois={mois} annee={annee}/>;
    if(loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:380 }}><div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}><div style={{ width:42,height:42,border:`3px solid ${P.blue100}`,borderTop:`3px solid ${P.blue500}`,borderRadius:'50%',animation:'spin .8s linear infinite' }}/><span style={{ color:P.muted,fontSize:13 }}>Chargement des données…</span></div></div>;
    if(erreur) return <div style={{ background:P.redBg,borderLeft:`3px solid ${P.red}`,borderRadius:10,padding:'18px 22px',color:'#7f1d1d',fontSize:13.5,display:'flex',alignItems:'center',gap:14 }}><I.Alert/> {erreur} <button onClick={fetchDashboard} style={{ marginLeft:'auto',padding:'6px 14px',borderRadius:7,border:'none',background:P.red,color:'white',cursor:'pointer',fontSize:12,fontWeight:600 }}>Réessayer</button></div>;
    if(!data) return null;
    if(vue==='accidents') return (
      <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
        <EnquetesHSSE onUnreadCountChange={setUnreadCount} />
        <AccidentsFiltresBar
          P={P}
          filtreCategorie={filtreCategorie} setFiltreCategorie={setFiltreCategorie}
          filtreCriticite={filtreCriticite} setFiltreCriticite={setFiltreCriticite}
          filtrePlantSection={filtrePlantSection} setFiltrePlantSection={setFiltrePlantSection}
          filtreLieu={filtreLieu} setFiltreLieu={setFiltreLieu}
        />
        <VueAccidents data={data}/>
      </div>
    );
    switch(vue){
      case 'dashboard':    return <VueDashboard    data={data}/>;
      case 'incidents':    return <VueIncidents    data={data}/>;
      case 'maladies':     return <VueMaladies     data={data}/>;
      case 'visites':      return <VueVisites      data={data}/>;
      case 'contrevisites':return <VueContrevisites data={data}/>;
      case 'urgences':     return <VueUrgences     data={data}/>;
      case 'stock':        return <VueStock        data={data}/>;
      case 'declarations': return <VueDeclarations data={data}/>;
      default:             return null;
    }
  };
  const labelVue=NAV.flatMap(s=>s.items).find(i=>i.id===vue)?.label||'';

  return (
    <div style={{ display:'flex',height:'100vh',overflow:'hidden',background:P.bg,fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${P.blue200};border-radius:10px}`}</style>
      <aside style={{ width:sbOpen?248:0,minWidth:sbOpen?248:0,overflow:'hidden',background:P.sidebar,display:'flex',flexDirection:'column',height:'100vh',borderRight:`1px solid ${P.blue200}`,transition:'width .22s ease,min-width .22s ease',flexShrink:0,boxShadow:'4px 0 20px rgba(14,165,233,.13)' }}>
        <div style={{ padding:'20px 16px 14px',borderBottom:`1px solid rgba(2,132,199,.18)`,flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:11 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${P.blue600},${P.blue700})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',flexShrink:0,boxShadow:'0 4px 14px rgba(14,165,233,.4)' }}><I.Shield/></div>
            <div><div style={{ fontWeight:800,fontSize:15,color:'#0c4a6e',lineHeight:1.2 }}>HSEE</div><div style={{ fontSize:10,color:P.blue700,fontWeight:600 }}>{siteName || 'Non assigné'}</div></div>
          </div>
        </div>
        <nav style={{ flex:1,overflowY:'auto',padding:'8px 0 10px' }}>
          {NAV.map(section=>(
            <div key={section.section} style={{ marginBottom:2 }}>
              <div style={{ fontSize:9.5,fontWeight:700,color:P.blue700,opacity:.7,textTransform:'uppercase',letterSpacing:'1px',padding:'11px 16px 5px' }}>{section.section}</div>
              {section.items.map((item)=>{
                const active=vue===item.id;
                return (
                  <button key={item.id} type="button" onClick={()=>{ if (!hasSite) return; setVue(item.id); }} style={{ width:'calc(100% - 14px)',margin:'1px 7px',display:'flex',alignItems:'center',gap:10,padding:'8px 11px',background:active?P.blue600:'transparent',color:active?'white':'#0c4a6e',border:active?`1px solid ${P.blue500}`:'1px solid transparent',borderRadius:8,cursor:'pointer',fontSize:12.5,fontWeight:active?700:600,textAlign:'left',transition:'all .12s',boxShadow:active?'0 3px 10px rgba(2,132,199,.3)':'none' }}>
                    <item.Icon/>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      {item.label}
                      {item.id === 'accidents' && unreadCount > 0 && (
                        <span style={{ minWidth:18,height:18,padding:'0 6px',borderRadius:999,background:'#dc2626',color:'white',fontSize:10.5,fontWeight:800,display:'inline-flex',alignItems:'center',justifyContent:'center',lineHeight:1 }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding:'11px 13px',borderTop:`1px solid rgba(2,132,199,.2)`,flexShrink:0,background:'rgba(255,255,255,.35)',backdropFilter:'blur(10px)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${P.blue600},${P.blue700})`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',boxShadow:'0 2px 8px rgba(14,165,233,.28)',flexShrink:0 }}><I.User/></div>
            <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,color:'#0c4a6e',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.username}</div><div style={{ fontSize:9.5,color:P.blue700,fontWeight:600 }}>Responsable HSEE</div></div>
            <LogoutButton onClick={handleLogout} />
          </div>
        </div>
      </aside>
      <main style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0,height:'100vh',overflow:'hidden' }}>
        <header style={{ display:'flex',flexDirection:'column',padding:'12px 22px',background:P.white,borderBottom:`1px solid ${P.border}`,flexShrink:0,zIndex:10,boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
          {/* Ligne 1: Titre et boutons de base */}
          <div style={{ height:44,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <button type="button" onClick={()=>setSbOpen(o=>!o)} title={sbOpen?'Fermer le menu':'Ouvrir le menu'} style={{ width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${P.blue600},${P.blue500})`,border:'none',cursor:'pointer',color:'white',borderRadius:9,boxShadow:`0 3px 12px ${P.blue500}55`,transition:'all .18s',flexShrink:0,fontSize:18,fontWeight:900,lineHeight:1 }}>{sbOpen ? '‹' : '›'}</button>
              <div style={{ width:1,height:20,background:P.border }}/>
              <span style={{ fontSize:14.5,fontWeight:700,color:P.blue900 }}>{labelVue}</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:9 }}>
              {(vue==='dashboard' || vue==='accidents') && (<>
              <select value={mois} onChange={e=>setMois(Number(e.target.value))} style={{ padding:'6px 11px',borderRadius:8,border:`1px solid ${P.border}`,fontSize:13,color:P.text,background:P.white,cursor:'pointer',outline:'none' }}>
                {MOIS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={annee} onChange={e=>setAnnee(Number(e.target.value))} style={{ padding:'6px 11px',borderRadius:8,border:`1px solid ${P.border}`,fontSize:13,color:P.text,background:P.white,cursor:'pointer',outline:'none' }}>
                {annees.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <button type="button" onClick={fetchDashboard} disabled={loading} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:8,background:P.blue50,border:`1px solid ${P.blue200}`,color:P.blue600,cursor:'pointer',fontSize:12.5,fontWeight:600 }}><I.Refresh/> Actualiser</button>
              <div style={{ padding:'5px 12px',borderRadius:8,background:`linear-gradient(135deg,${P.blue800},${P.blue600})`,color:'white',fontSize:12,fontWeight:700 }}>{MOIS[mois]} {annee}</div>
              </>)}
            </div>
          </div>
        </header>
        <div style={{ flex:1,padding:'22px',overflowY:'auto',minHeight:0 }}>
          {hasSite ? renderVue() : <SiteAssignmentWarning />}
        </div>
      </main>
    </div>
  );
};

export default DashboardHSSE;