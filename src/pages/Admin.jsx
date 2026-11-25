import {useState} from 'react';
import {Link} from 'react-router-dom';
import {LayoutDashboard,CalendarDays,Scissors,Users,UserRound,Settings,LogOut,X} from 'lucide-react';
import {list,upsert,remove,getSettings,saveSettings} from '../services/db';
import {book,setStatus,sortByTime} from '../services/appointments';
import {isoDate} from '../services/availability';
import SlotPicker from '../components/SlotPicker';
import {cls,money,fmtDate,Label,Badge,STATUS} from '../ui';

const svcName=ids=>list('services').filter(s=>ids.includes(s.id)).map(s=>s.name).join(', ');
const proName=id=>list('professionals').find(p=>p.id===id)?.name||'—';
const DAYS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function Login({onOk}){
 const [pw,setPw]=useState(''),[err,setErr]=useState(false);
 return <div className="flex min-h-screen items-center justify-center p-4"><form className={cls.card+' w-full max-w-sm space-y-3'} onSubmit={e=>{e.preventDefault();pw===getSettings().adminPassword?onOk():setErr(true)}}>
  <div className="flex justify-center pb-2"><img src="/logo-thiago-guiaro.png" alt="Thiago Guiaro Studio" className="h-28 w-auto max-w-full object-contain"/></div><h1 className="text-xl font-bold text-neutral-950">Área restrita</h1>
  <Label t="Senha"><input type="password" autoFocus className={cls.input} value={pw} onChange={e=>setPw(e.target.value)}/></Label>
  {err&&<p className="text-sm text-red-600">Senha incorreta.</p>}
  <button className={cls.btn+' w-full'}>Entrar</button><p className="text-xs text-stone-400">Senha demo: admin123 (altere em Configurações)</p>
  <Link to="/" className="block text-center text-xs text-stone-500">← Voltar ao site</Link></form></div>;
}

function Dashboard(){
 const today=list('appointments').filter(a=>a.date===isoDate(new Date()));
 const active=today.filter(a=>!['cancelado','faltou'].includes(a.status));
 const kpis=[['Agendamentos hoje',today.length],['Faturamento previsto',money(active.reduce((t,a)=>t+a.total,0))],['Concluídos',today.filter(a=>a.status==='concluido').length],['Cancelamentos / faltas',today.length-active.length]];
 return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{kpis.map(([l,v])=><div key={l} className={cls.card}><p className="text-sm text-stone-500">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}</div>;
}

function NewAppointment({date,onDone}){
 const services=list('services').filter(s=>s.active),pros=list('professionals');
 const [sel,setSel]=useState([]),[pro,setPro]=useState(''),[slot,setSlot]=useState({date,time:''}),[c,setC]=useState({clientName:'',phone:'',email:'',notes:''}),[err,setErr]=useState('');
 const duration=services.filter(s=>sel.includes(s.id)).reduce((t,s)=>t+s.duration,0);
 const save=()=>{try{book({serviceIds:sel,professionalId:pro||null,...slot,client:c,skipAdvance:true});onDone()}catch(e){setErr(e.message)}};
 return <div className={cls.card+' space-y-3'}><h3 className="font-semibold">Novo agendamento</h3>
  <div className="flex flex-wrap gap-2">{services.map(s=><label key={s.id} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-sm"><input type="checkbox" checked={sel.includes(s.id)} onChange={()=>{setSel(x=>x.includes(s.id)?x.filter(i=>i!==s.id):[...x,s.id]);setSlot({...slot,time:''})}}/>{s.name}</label>)}</div>
  <select className={cls.input} value={pro} onChange={e=>{setPro(e.target.value);setSlot({...slot,time:''})}}><option value="">Qualquer profissional</option>{pros.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
  <SlotPicker value={slot} onChange={setSlot} serviceIds={sel} professionalId={pro||null} duration={duration} skipAdvance/>
  <div className="grid gap-2 sm:grid-cols-2"><input className={cls.input} placeholder="Nome" value={c.clientName} onChange={e=>setC({...c,clientName:e.target.value})}/><input className={cls.input} placeholder="Telefone" value={c.phone} onChange={e=>setC({...c,phone:e.target.value})}/></div>
  {err&&<p className="text-sm text-red-600">{err}</p>}
  <div className="flex gap-2"><button className={cls.btn} disabled={!slot.time||!c.clientName||!c.phone} onClick={save}>Salvar</button><button className={cls.ghost} onClick={onDone}>Fechar</button></div></div>;
}

function Agenda(){
 const [date,setDate]=useState(isoDate(new Date())),[pro,setPro]=useState(''),[adding,setAdding]=useState(false),[,force]=useState(0);
 const rows=sortByTime(list('appointments').filter(a=>a.date===date&&(!pro||a.professionalId===pro)));
 return <div className="space-y-4">
  <div className="flex flex-wrap gap-2"><input type="date" className={cls.input+' max-w-44'} value={date} onChange={e=>setDate(e.target.value)}/>
   <select className={cls.input+' max-w-52'} value={pro} onChange={e=>setPro(e.target.value)}><option value="">Todos os profissionais</option>{list('professionals').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
   <button className={cls.btn} onClick={()=>setAdding(true)}>+ Novo</button></div>
  {adding&&<NewAppointment date={date} onDone={()=>{setAdding(false);force(n=>n+1)}}/>}
  {!rows.length&&<p className="text-sm text-stone-500">Nenhum agendamento em {fmtDate(date)}.</p>}
  {rows.map(a=><div key={a.id} className={cls.card+' flex flex-wrap items-center gap-3'}>
   <div className="w-24 font-semibold">{a.start}–{a.end}</div>
   <div className="min-w-48 flex-1"><b>{a.clientName}</b> <span className="text-sm text-stone-500">{a.phone}</span><p className="text-sm text-stone-600">{svcName(a.serviceIds)} · {proName(a.professionalId)} · {money(a.total)}</p>{a.notes&&<p className="text-xs italic text-stone-500">{a.notes}</p>}</div>
   <Badge s={a.status}/>
   <select className={cls.ghost} value={a.status} onChange={e=>{setStatus(a.id,e.target.value);force(n=>n+1)}}>{Object.entries(STATUS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></div>)}
 </div>;
}

function BlocksInput({value,onChange}){
 const [t,setT]=useState('');
 const add=()=>{const m=t.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})-(\d{2}:\d{2})$/);if(m){onChange([...value,{date:m[1],start:m[2],end:m[3]}]);setT('')}};
 return <div><div className="flex gap-2"><input className={cls.input} placeholder="2026-12-24 13:00-15:00" value={t} onChange={e=>setT(e.target.value)}/><button type="button" className={cls.ghost} onClick={add}>Adicionar</button></div>
  <div className="mt-2 flex flex-wrap gap-1">{value.map((b,i)=><span key={i} className="flex items-center gap-1 rounded-full bg-stone-200 px-2 py-1 text-xs">{b.date} {b.start}-{b.end}<button type="button" onClick={()=>onChange(value.filter((_,j)=>j!==i))}><X size={12}/></button></span>)}</div></div>;
}

function Crud({entity,fields,blank,cols}){
 const [rows,setRows]=useState(list(entity)),[f,setF]=useState(null);
 const set=(k,v)=>setF(x=>({...x,[k]:v})),refresh=()=>setRows(list(entity));
 const toggle=(k,v)=>set(k,f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]);
 const input=x=>{const v=f[x.k];
  if(x.t==='bool')return <input type="checkbox" checked={v} onChange={e=>set(x.k,e.target.checked)}/>;
  if(x.t==='multi')return <div className="flex flex-wrap gap-2">{x.options().map(o=><label key={o.v} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={v.includes(o.v)} onChange={()=>toggle(x.k,o.v)}/>{o.l}</label>)}</div>;
  if(x.t==='blocks')return <BlocksInput value={v} onChange={nv=>set(x.k,nv)}/>;
  return <input className={cls.input} type={x.t} value={v} onChange={e=>set(x.k,x.t==='number'?+e.target.value:e.target.value)}/>};
 return <div className="space-y-3"><button className={cls.btn} onClick={()=>setF(structuredClone(blank))}>+ Novo</button>
  <div className="space-y-2">{rows.map(r=><div key={r.id} className={cls.card+' flex flex-wrap items-center gap-3'}><div className="min-w-48 flex-1">{cols(r)}</div>
   <button className={cls.ghost} onClick={()=>setF(structuredClone(r))}>Editar</button><button className={cls.ghost} onClick={()=>{if(window.confirm('Excluir?')){remove(entity,r.id);refresh()}}}>Excluir</button></div>)}</div>
  {f&&<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"><form className={cls.card+' max-h-[90vh] w-full max-w-lg space-y-3 overflow-auto'} onSubmit={e=>{e.preventDefault();upsert(entity,f);setF(null);refresh()}}>
   {fields.map(x=><Label key={x.k} t={x.l}>{input(x)}</Label>)}
   <div className="flex gap-2"><button className={cls.btn}>Salvar</button><button type="button" className={cls.ghost} onClick={()=>setF(null)}>Cancelar</button></div></form></div>}
 </div>;
}

const Services=()=><Crud entity="services" blank={{name:'',category:'',description:'',duration:30,price:0,active:true}}
 fields={[{k:'name',l:'Nome',t:'text'},{k:'category',l:'Categoria',t:'text'},{k:'description',l:'Descrição',t:'text'},{k:'duration',l:'Duração (min)',t:'number'},{k:'price',l:'Preço (R$)',t:'number'},{k:'active',l:'Ativo',t:'bool'}]}
 cols={r=><><b>{r.name}</b> <span className="text-xs text-stone-500">{r.category} · {r.duration} min · {money(r.price)} {r.active?'':'· INATIVO'}</span></>}/>;
const Pros=()=><Crud entity="professionals" blank={{name:'',serviceIds:[],workDays:[1,2,3,4,5],start:'09:00',end:'18:00',blocks:[]}}
 fields={[{k:'name',l:'Nome',t:'text'},{k:'serviceIds',l:'Especialidades',t:'multi',options:()=>list('services').map(s=>({v:s.id,l:s.name}))},{k:'workDays',l:'Dias de trabalho',t:'multi',options:()=>DAYS.map((l,v)=>({v,l}))},{k:'start',l:'Início do expediente',t:'time'},{k:'end',l:'Fim do expediente',t:'time'},{k:'blocks',l:'Bloqueios (data HH:MM-HH:MM)',t:'blocks'}]}
 cols={r=><><b>{r.name}</b><p className="text-xs text-stone-500">{r.workDays.map(d=>DAYS[d]).join(', ')} · {r.start}–{r.end} · {svcName(r.serviceIds)}{r.blocks.length?` · ${r.blocks.length} bloqueio(s)`:''}</p></>}/>;

function Clients(){
 const map={};list('appointments').forEach(a=>{const k=a.phone.replace(/\D/g,'');(map[k]=map[k]||[]).push(a)});
 const rows=Object.values(map).map(sortByTime);
 return <div className="space-y-2">{!rows.length&&<p className="text-sm text-stone-500">Nenhum cliente ainda.</p>}{rows.map(l=>{const last=l[l.length-1];return <div key={last.phone} className={cls.card}>
  <b>{last.clientName}</b> <span className="text-sm text-stone-500">{last.phone}{last.email&&` · ${last.email}`}</span>
  <p className="text-sm text-stone-600">{l.length} visita(s) · Gasto concluído: {money(l.filter(a=>a.status==='concluido').reduce((t,a)=>t+a.total,0))} · Última: {fmtDate(last.date)}</p></div>})}</div>;
}

function Config(){
 const [s,setS]=useState(getSettings()),[ok,setOk]=useState(false);
 return <form className={cls.card+' max-w-md space-y-3'} onSubmit={e=>{e.preventDefault();saveSettings(s);setOk(true)}}>
  <Label t="Nome do salão"><input className={cls.input} value={s.salonName} onChange={e=>setS({...s,salonName:e.target.value})}/></Label>
  <Label t="Antecedência mínima para agendar (horas)"><input type="number" min="0" className={cls.input} value={s.minAdvanceHours} onChange={e=>setS({...s,minAdvanceHours:+e.target.value})}/></Label>
  <Label t="Cancelar/reagendar até X horas antes"><input type="number" min="0" className={cls.input} value={s.cancelLimitHours} onChange={e=>setS({...s,cancelLimitHours:+e.target.value})}/></Label>
  <Label t="Senha do administrador"><input className={cls.input} value={s.adminPassword} onChange={e=>setS({...s,adminPassword:e.target.value})}/></Label>
  <button className={cls.btn}>Salvar</button>{ok&&<span className="ml-3 text-sm text-emerald-700">Salvo ✓</span>}</form>;
}

const TABS=[['dash','Dashboard',LayoutDashboard,Dashboard],['agenda','Agenda',CalendarDays,Agenda],['svc','Serviços',Scissors,Services],['pro','Profissionais',UserRound,Pros],['cli','Clientes',Users,Clients],['cfg','Configurações',Settings,Config]];

export default function Admin(){
 const [ok,setOk]=useState(()=>sessionStorage.getItem('admin')==='1'),[tab,setTab]=useState('dash');
 if(!ok)return <Login onOk={()=>{sessionStorage.setItem('admin','1');setOk(true)}}/>;
 const Page=TABS.find(t=>t[0]===tab)[3];
 return <div className="min-h-screen md:flex">
  <aside className="flex gap-1 overflow-x-auto bg-stone-900 p-2 text-stone-200 md:w-56 md:flex-col md:p-4">
   <div className="mb-3 flex shrink-0 items-center justify-center rounded-xl bg-white p-2 md:justify-start"><img src="/logo-thiago-guiaro.png" alt="Thiago Guiaro Studio" className="h-16 w-auto max-w-full object-contain"/></div>
   {TABS.map(([k,l,Icon])=><button key={k} onClick={()=>setTab(k)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${tab===k?'bg-neutral-900 text-white':'hover:bg-stone-800'}`}><Icon size={16}/>{l}</button>)}
   <button onClick={()=>{sessionStorage.removeItem('admin');setOk(false)}} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-stone-800 md:mt-auto"><LogOut size={16}/>Sair</button></aside>
  <main className="flex-1 p-4 md:p-8"><h1 className="mb-4 text-xl font-bold">{TABS.find(t=>t[0]===tab)[1]}</h1><Page key={tab}/></main></div>;
}
