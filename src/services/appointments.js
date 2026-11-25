import {list,upsert,uid} from './db';
import {getSlots,toMin,toTime} from './availability';
/** Cria (ou reagenda, com ignoreId) revalidando a disponibilidade no momento da gravação. */
export function book({serviceIds,professionalId,date,time,client,ignoreId,skipAdvance}){
 const svcs=list('services').filter(s=>serviceIds.includes(s.id));
 const duration=svcs.reduce((t,s)=>t+s.duration,0);
 const slot=getSlots({date,professionalId,serviceIds,duration,ignoreId,skipAdvance}).find(s=>s.time===time);
 if(!slot)throw new Error('Esse horário acabou de ficar indisponível. Escolha outro.');
 const{clientName,phone,email,notes}=client;
 const a={id:ignoreId||uid(),clientName,phone,email,notes,serviceIds,professionalId:slot.professionalId,date,start:time,end:toTime(toMin(time)+duration),
  total:svcs.reduce((t,s)=>t+s.price,0),status:'confirmado',...(ignoreId?{}:{createdAt:new Date().toISOString()})};
 upsert('appointments',a);return a;
}
export const setStatus=(id,status)=>upsert('appointments',{id,status});
export const sortByTime=arr=>[...arr].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
