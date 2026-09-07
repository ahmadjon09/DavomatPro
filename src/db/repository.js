const DB='davomatpro', VERSION=3;
const STORES=['groups','students','attendance','tasks','settings'];
const seedGroups=[{id:'g1',name:'Frontend 24',room:'204-xona',color:'#635bff'},{id:'g2',name:'Grafik dizayn',room:'108-xona',color:'#18a978'},{id:'g3',name:'Rus tili A2',room:'302-xona',color:'#f59e42'}];
const names=['Aziza Karimova','Bekzod Rahimov','Dilshod Nurmatov','Madina Sobirova','Jasur Aliyev','Nilufar Hamidova','Sardor Tursunov','Malika Ismoilova','Akmal Qodirov','Zarina Abdullayeva','Otabek Mirzayev','Shahnoza Ergasheva'];
function open(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const d=r.result;STORES.forEach(x=>{if(!d.objectStoreNames.contains(x))d.createObjectStore(x,{keyPath:'id'})});/* v3: o‘quvchi bo‘yicha belgilash olib tashlandi — eski "taskProgress" jadvalini o‘chiramiz */if(d.objectStoreNames.contains('taskProgress'))d.deleteObjectStore('taskProgress')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function all(store){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function put(store,val){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store,'readwrite').objectStore(store).put(val);r.onsuccess=()=>res(val);r.onerror=()=>rej(r.error)})}
async function remove(store,id){const d=await open();return new Promise(r=>{const q=d.transaction(store,'readwrite').objectStore(store).delete(id);q.onsuccess=r})}
async function delWhere(store,pred){const items=(await all(store)).filter(pred);if(!items.length)return 0;const d=await open();return new Promise((res,rej)=>{const t=d.transaction(store,'readwrite');items.forEach(x=>t.objectStore(store).delete(x.id));t.oncomplete=()=>res(items.length);t.onerror=()=>rej(t.error)})}
function newId(prefix){return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random()*1296).toString(36)}`}
/* Day key used by attendance and homework alike: YYYY-MM-DD. */
function dayKey(d=new Date()){return d.toISOString().slice(0,10)}
/* Demo homework so the "Uy vazifasi" screen is not empty on first run. Only touches the seeded demo groups. */
async function seedTasks(){const groups=await all('groups');
 if(!groups.some(g=>['g1','g2','g3'].includes(g.id)))return;
 const date=dayKey(),now=Date.now();
 const plans=[{groupId:'g1',title:'12–14-mashqlarni yechish',note:'Daftarga to‘liq yechib, rasmini guruhga yuboring.',deadline:'20:00'},{groupId:'g3',title:'«Mening kunim» inshosi',note:'Kamida 120 ta so‘z, rus tilida.',deadline:'21:00'}];
 for(const p of plans){const g=groups.find(x=>x.id===p.groupId);if(!g)continue;
  await put('tasks',{id:newId('k'),groupId:g.id,date,title:p.title,note:p.note,deadline:p.deadline,createdAt:now,updatedAt:now,demo:true});}
 await put('settings',{id:'tasksSeeded',value:true})}
async function init(){const settings=await all('settings'),initialized=settings.some(x=>x.id==='initialized');
 if(!(await all('groups')).length&&!initialized){for(const g of seedGroups)await put('groups',g);let i=0;for(const g of seedGroups)for(const n of names.slice(0,g.id==='g1'?12:8))await put('students',{id:`s${++i}`,groupId:g.id,name:n,phone:'+998 90 123 45 67'});await seedTasks();await put('settings',{id:'initialized',value:true})}
 else if(!(await all('tasks')).length&&!settings.some(x=>x.id==='tasksSeeded'))await seedTasks()}
async function clearAll(){const d=await open();return Promise.all(STORES.map(store=>new Promise((res,rej)=>{const r=d.transaction(store,'readwrite').objectStore(store).clear();r.onsuccess=res;r.onerror=()=>rej(r.error)})))}
export const repo={init,all,put,remove,delWhere,newId,dayKey,clearAll,
 async logs(date,groupId){return (await all('attendance')).filter(x=>x.date===date&&x.groupId===groupId)},
 async history(studentId){return (await all('attendance')).filter(x=>x.studentId===studentId).sort((a,b)=>b.date.localeCompare(a.date))},
 async mark(studentId,groupId,date,status){return put('attendance',{id:`${date}_${studentId}`,studentId,groupId,date,status,updatedAt:Date.now()})}};
