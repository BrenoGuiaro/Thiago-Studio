export const money=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const fmtDate=d=>new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
export const STATUS={confirmado:'Confirmado',em_atendimento:'Em atendimento',concluido:'Concluído',cancelado:'Cancelado',faltou:'Faltou'};
export const STATUS_COLOR={confirmado:'bg-sky-100 text-sky-800',em_atendimento:'bg-amber-100 text-amber-800',concluido:'bg-emerald-100 text-emerald-800',cancelado:'bg-stone-200 text-stone-600',faltou:'bg-red-100 text-red-700'};
export const cls={
 btn:'rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-950 disabled:cursor-not-allowed disabled:opacity-40',
 ghost:'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100',
 input:'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500',
 card:'rounded-2xl border border-stone-200 bg-white p-4 shadow-sm'};
export const Label=({t,children})=><label className="block text-sm"><span className="mb-1 block text-stone-600">{t}</span>{children}</label>;
export const Badge=({s})=><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s]}`}>{STATUS[s]}</span>;
