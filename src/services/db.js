// Camada de persistência (localStorage). Para usar uma API REST, troque apenas estas funções por fetch().
/** @typedef {{id:string,category:string,name:string,description:string,duration:number,price:number,active:boolean}} Service */
/** @typedef {{id:string,name:string,serviceIds:string[],workDays:number[],start:string,end:string,blocks:{date:string,start:string,end:string}[]}} Professional */
/** @typedef {{id:string,clientName:string,phone:string,email?:string,notes?:string,serviceIds:string[],professionalId:string,date:string,start:string,end:string,total:number,status:'confirmado'|'em_atendimento'|'concluido'|'cancelado'|'faltou',createdAt:string}} Appointment */
/** @typedef {{salonName:string,minAdvanceHours:number,cancelLimitHours:number,adminPassword:string}} SalonSettings */
const KEY='salon_db_v1';
const seed={
 services:[
  {id:'s1',category:'Cabelo',name:'Corte feminino',description:'Lavagem, corte e finalização',duration:60,price:120,active:true},
  {id:'s2',category:'Cabelo',name:'Corte masculino',description:'Tesoura ou máquina, com acabamento',duration:30,price:60,active:true},
  {id:'s3',category:'Cabelo',name:'Coloração',description:'Cor completa com tratamento',duration:120,price:260,active:true},
  {id:'s4',category:'Cabelo',name:'Escova modelada',description:'Escova com finalização',duration:45,price:70,active:true},
  {id:'s5',category:'Barba',name:'Barba completa',description:'Toalha quente e navalha',duration:30,price:45,active:true},
  {id:'s6',category:'Unhas',name:'Manicure',description:'Esmaltação e cuidados com cutículas',duration:45,price:40,active:true}],
 professionals:[
  {id:'p1',name:'Camila Rocha',serviceIds:['s1','s3','s4'],workDays:[2,3,4,5,6],start:'09:00',end:'18:00',blocks:[]},
  {id:'p2',name:'Bruno Alves',serviceIds:['s2','s5'],workDays:[1,2,3,4,5],start:'10:00',end:'19:00',blocks:[]},
  {id:'p3',name:'Fernanda Lima',serviceIds:['s4','s6'],workDays:[1,3,5,6],start:'09:00',end:'17:00',blocks:[]}],
 appointments:[],
 settings:{salonName:'Thiago Guiaro Studio',minAdvanceHours:2,cancelLimitHours:4,adminPassword:'admin123'}};
let cache=null;
const load=()=>{if(!cache){try{cache=JSON.parse(localStorage.getItem(KEY))}catch{}if(!cache)cache=structuredClone(seed)}return cache};
const save=()=>localStorage.setItem(KEY,JSON.stringify(cache));
export const uid=()=>Math.random().toString(36).slice(2,9);
export const list=e=>[...load()[e]];
export const upsert=(e,o)=>{const d=load(),i=d[e].findIndex(x=>x.id===o.id);if(i>=0)d[e][i]={...d[e][i],...o};else d[e].push({...o,id:o.id||uid()});save()};
export const remove=(e,id)=>{const d=load();d[e]=d[e].filter(x=>x.id!==id);save()};
export const getSettings=()=>load().settings;
export const saveSettings=s=>{load().settings={...load().settings,...s};save()};
