import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Scissors,Clock} from 'lucide-react';
import {list,getSettings} from '../services/db';
import {book,setStatus,sortByTime} from '../services/appointments';
import {canCancel,toMin} from '../services/availability';
import SlotPicker from '../components/SlotPicker';
import {cls,money,fmtDate,Label,Badge} from '../ui';

const sum=(arr,k)=>arr.reduce((t,x)=>t+x[k],0);
const names=ids=>list('services').filter(s=>ids.includes(s.id)).map(s=>s.name).join(', ');
const proName=id=>list('professionals').find(p=>p.id===id)?.name;

function Catalog({onBook}){
 const services=list('services').filter(s=>s.active),cats=[...new Set(services.map(s=>s.category))];
 return <div className="space-y-8">
  {cats.map(c=><section key={c}><h2 className="mb-3 text-lg font-semibold">{c}</h2>
   <div className="grid gap-3 sm:grid-cols-2">{services.filter(s=>s.category===c).map(s=><div key={s.id} className={cls.card}>
    <div className="flex justify-between"><h3 className="font-medium">{s.name}</h3><span className="font-semibold text-neutral-900">{money(s.price)}</span></div>
    <p className="mt-1 text-sm text-stone-500">{s.description}</p>
    <p className="mt-2 flex items-center gap-1 text-xs text-stone-500"><Clock size={14}/>{s.duration} min</p></div>)}</div></section>)}
  <section><h2 className="mb-3 text-lg font-semibold">Nossa equipe</h2>
   <div className="grid gap-3 sm:grid-cols-3">{list('professionals').map(p=><div key={p.id} className={cls.card}>
    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-neutral-950">{p.name[0]}</div>
    <h3 className="font-medium">{p.name}</h3><p className="text-sm text-stone-500">{names(p.serviceIds)}</p></div>)}</div></section>
  <button className={cls.btn} onClick={onBook}>Agendar agora</button>
 </div>;
}

function Booking(){
 const services=list('services').filter(s=>s.active);
 const [step,setStep]=useState(0),[sel,setSel]=useState([]),[pro,setPro]=useState(''),[slot,setSlot]=useState({date:'',time:''});
 const [c,setC]=useState({clientName:'',phone:'',email:'',notes:''}),[done,setDone]=useState(null),[err,setErr]=useState('');
 const chosen=services.filter(s=>sel.includes(s.id)),duration=sum(chosen,'duration'),total=sum(chosen,'price');
 const eligible=list('professionals').filter(p=>sel.every(id=>p.serviceIds.includes(id)));
 const toggle=id=>{setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);setPro('');setSlot({date:'',time:''})};
 const valid=[sel.length>0,eligible.length>0,!!slot.time,c.clientName.trim().length>1&&c.phone.replace(/\D/g,'').length>=10][step];
 const confirm=()=>{try{setDone(book({serviceIds:sel,professionalId:pro||null,...slot,client:c}))}catch(e){setErr(e.message)}};
 if(done)return <div className={cls.card+' space-y-2 text-center'}>
  <h2 className="text-xl font-semibold text-emerald-700">Agendamento confirmado! ✓</h2>
  <p>{names(done.serviceIds)}</p><p>{fmtDate(done.date)} às {done.start} com {proName(done.professionalId)}</p>
  <p className="font-semibold">{money(done.total)}</p><p className="text-sm text-stone-500">Para consultar, reagendar ou cancelar, use "Meus agendamentos" com seu telefone.</p></div>;
 const titles=['1. Escolha os serviços','2. Escolha o profissional','3. Data e horário','4. Seus dados e confirmação'];
 return <div className="space-y-4">
  <h2 className="text-lg font-semibold">{titles[step]}</h2>
  {step===0&&<div className="space-y-2">{services.map(s=><label key={s.id} className={`${cls.card} flex cursor-pointer items-center gap-3 ${sel.includes(s.id)?'border-neutral-900 ring-1 ring-neutral-900':''}`}>
   <input type="checkbox" checked={sel.includes(s.id)} onChange={()=>toggle(s.id)}/><span className="flex-1">{s.name}<span className="block text-xs text-stone-500">{s.duration} min</span></span><b>{money(s.price)}</b></label>)}</div>}
  {step===1&&(eligible.length?<div className="grid gap-2 sm:grid-cols-2">{[{id:'',name:'Qualquer profissional disponível'},...eligible].map(p=>
   <button key={p.id} onClick={()=>{setPro(p.id);setSlot({date:'',time:''})}} className={`${cls.card} text-left ${pro===p.id?'border-neutral-900 ring-1 ring-neutral-900':''}`}>{p.name}</button>)}</div>
   :<p className="text-sm text-red-600">Nenhum profissional realiza todos esses serviços juntos. Volte e agende separadamente.</p>)}
  {step===2&&<SlotPicker value={slot} onChange={setSlot} serviceIds={sel} professionalId={pro||null} duration={duration}/>}
  {step===3&&<div className="grid gap-3 sm:grid-cols-2">
   <Label t="Nome *"><input className={cls.input} value={c.clientName} onChange={e=>setC({...c,clientName:e.target.value})}/></Label>
   <Label t="Telefone / WhatsApp *"><input className={cls.input} inputMode="tel" placeholder="(19) 99999-9999" value={c.phone} onChange={e=>setC({...c,phone:e.target.value})}/></Label>
   <Label t="E-mail (opcional)"><input className={cls.input} type="email" value={c.email} onChange={e=>setC({...c,email:e.target.value})}/></Label>
   <Label t="Observações"><input className={cls.input} value={c.notes} onChange={e=>setC({...c,notes:e.target.value})}/></Label>
   <div className="rounded-xl bg-neutral-50 p-3 text-sm sm:col-span-2"><b>Resumo:</b> {names(sel)} · {duration} min · {fmtDate(slot.date)} às {slot.time} · <b>{money(total)}</b></div>
  </div>}
  {sel.length>0&&<p className="text-sm text-stone-500">Total: {duration} min · {money(total)}</p>}
  {err&&<p className="text-sm text-red-600">{err}</p>}
  <div className="flex gap-2">{step>0&&<button className={cls.ghost} onClick={()=>{setStep(step-1);setErr('')}}>Voltar</button>}
   {step<3?<button className={cls.btn} disabled={!valid} onClick={()=>setStep(step+1)}>Continuar</button>:<button className={cls.btn} disabled={!valid} onClick={confirm}>Confirmar agendamento</button>}</div>
 </div>;
}

function MyAppointments(){
 const [phone,setPhone]=useState(''),[q,setQ]=useState(null),[resch,setResch]=useState(null),[slot,setSlot]=useState({date:'',time:''}),[,force]=useState(0),[err,setErr]=useState('');
 const digits=s=>s.replace(/\D/g,'');
 const mine=q?sortByTime(list('appointments').filter(a=>digits(a.phone)===q)).reverse():[];
 const cancel=a=>{if(window.confirm('Cancelar este agendamento?')){setStatus(a.id,'cancelado');force(n=>n+1)}};
 const reschedule=a=>{try{book({serviceIds:a.serviceIds,professionalId:a.professionalId,...slot,client:a,ignoreId:a.id});setResch(null);setErr('');force(n=>n+1)}catch(e){setErr(e.message)}};
 return <div className="space-y-4">
  <div className="flex max-w-md gap-2"><input className={cls.input} placeholder="Seu telefone" value={phone} onChange={e=>setPhone(e.target.value)}/><button className={cls.btn} onClick={()=>setQ(digits(phone))}>Buscar</button></div>
  <p className="text-xs text-stone-500">Cancelamento e reagendamento permitidos até {getSettings().cancelLimitHours}h antes do horário.</p>
  {q!==null&&!mine.length&&<p className="text-sm text-stone-500">Nenhum agendamento encontrado para este telefone.</p>}
  {mine.map(a=><div key={a.id} className={cls.card}>
   <div className="flex flex-wrap items-center justify-between gap-2"><b>{fmtDate(a.date)} · {a.start}–{a.end}</b><Badge s={a.status}/></div>
   <p className="text-sm text-stone-600">{names(a.serviceIds)} · {proName(a.professionalId)} · {money(a.total)}</p>
   {a.status==='confirmado'&&(canCancel(a)?<div className="mt-2 flex gap-2"><button className={cls.ghost} onClick={()=>{setResch(a.id);setSlot({date:'',time:''});setErr('')}}>Reagendar</button><button className={cls.ghost} onClick={()=>cancel(a)}>Cancelar</button></div>
    :<p className="mt-2 text-xs text-amber-700">Prazo de alteração encerrado. Entre em contato com o salão.</p>)}
   {resch===a.id&&<div className="mt-3 space-y-2 border-t pt-3"><SlotPicker value={slot} onChange={setSlot} serviceIds={a.serviceIds} professionalId={a.professionalId} duration={toMin(a.end)-toMin(a.start)} ignoreId={a.id}/>
    {err&&<p className="text-sm text-red-600">{err}</p>}<button className={cls.btn} disabled={!slot.time} onClick={()=>reschedule(a)}>Confirmar novo horário</button></div>}
  </div>)}
 </div>;
}

export default function Home(){
 const [tab,setTab]=useState('servicos'),tabs=[['servicos','Serviços'],['agendar','Agendar'],['meus','Meus agendamentos']];
 return <div className="mx-auto max-w-3xl px-4 pb-16">
  <header className="flex items-center justify-between gap-4 py-5"><Link to="/" aria-label="Thiago Guiaro Studio - início" className="inline-flex items-center"><img src="/logo-thiago-guiaro.png" alt="Thiago Guiaro Studio" className="h-20 w-auto max-w-[220px] object-contain"/></Link><Link to="/admin" className="text-xs font-medium text-stone-500 transition hover:text-neutral-950">Área administrativa</Link></header>
  <nav className="mb-6 flex gap-1 rounded-xl bg-stone-200 p-1">{tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium ${tab===k?'bg-white shadow':'text-stone-600'}`}>{l}</button>)}</nav>
  {tab==='servicos'&&<Catalog onBook={()=>setTab('agendar')}/>}{tab==='agendar'&&<Booking/>}{tab==='meus'&&<MyAppointments/>}
 </div>;
}
