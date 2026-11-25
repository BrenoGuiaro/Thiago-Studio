import {useMemo} from 'react';
import {getSlots,isoDate} from '../services/availability';
import {cls} from '../ui';
export default function SlotPicker({value,onChange,...q}){
 const slots=useMemo(()=>value.date&&q.duration?getSlots({date:value.date,...q}):[],[value.date,q.professionalId,q.duration,q.ignoreId,q.serviceIds.join()]);
 return <div>
  <input type="date" min={q.skipAdvance?undefined:isoDate(new Date())} value={value.date} onChange={e=>onChange({date:e.target.value,time:''})} className={cls.input+' max-w-xs'}/>
  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
   {slots.map(s=><button type="button" key={s.time} onClick={()=>onChange({...value,time:s.time})}
    className={`rounded-lg border px-2 py-2 text-sm ${value.time===s.time?'border-neutral-900 bg-neutral-900 text-white':'border-stone-300 bg-white hover:border-neutral-500'}`}>{s.time}</button>)}
  </div>
  {value.date&&q.duration>0&&!slots.length&&<p className="mt-3 text-sm text-stone-500">Nenhum horário disponível nesta data. Tente outro dia ou profissional.</p>}
 </div>;
}
