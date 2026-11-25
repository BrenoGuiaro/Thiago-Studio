import {list,getSettings} from './db';
export const toMin=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
export const toTime=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export const isoDate=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const at=(date,time)=>new Date(`${date}T${time}:00`);
const INACTIVE=['cancelado','faltou'];
/** Profissional livre em [start,end) (minutos)? Respeita expediente, bloqueios e agendamentos. */
export function proFree(pro,date,start,end,ignoreId){
 const dow=new Date(date+'T12:00').getDay();
 if(!pro.workDays.includes(dow)||start<toMin(pro.start)||end>toMin(pro.end))return false;
 const clash=(s,e)=>start<e&&end>s;
 if(pro.blocks.some(b=>b.date===date&&clash(toMin(b.start),toMin(b.end))))return false;
 return !list('appointments').some(a=>a.id!==ignoreId&&a.professionalId===pro.id&&a.date===date&&!INACTIVE.includes(a.status)&&clash(toMin(a.start),toMin(a.end)));
}
/** Horários (de 30 em 30 min). professionalId vazio = qualquer profissional apto a todos os serviços. */
export function getSlots({date,professionalId,serviceIds,duration,ignoreId,skipAdvance}){
 const minTime=Date.now()+getSettings().minAdvanceHours*36e5;
 const pros=list('professionals').filter(p=>(!professionalId||p.id===professionalId)&&serviceIds.every(id=>p.serviceIds.includes(id)));
 const out=[];
 for(let m=8*60;m+duration<=20*60;m+=30){
  if(!skipAdvance&&at(date,toTime(m)).getTime()<minTime)continue;
  const pro=pros.find(p=>proFree(p,date,m,m+duration,ignoreId));
  if(pro)out.push({time:toTime(m),professionalId:pro.id});
 }
 return out;
}
export const canCancel=a=>a.status==='confirmado'&&at(a.date,a.start).getTime()-Date.now()>=getSettings().cancelLimitHours*36e5;
