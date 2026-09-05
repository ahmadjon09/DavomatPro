const DB='davomatpro', VERSION=2;
const STORES=['groups','students','attendance','tasks','taskProgress','settings'];
const seedGroups=[{id:'g1',name:'Frontend 24',room:'204-xona',color:'#635bff'},{id:'g2',name:'Grafik dizayn',room:'108-xona',color:'#18a978'},{id:'g3',name:'Rus tili A2',room:'302-xona',color:'#f59e42'}];
const names=['Aziza Karimova','Bekzod Rahimov','Dilshod Nurmatov','Madina Sobirova','Jasur Aliyev','Nilufar Hamidova','Sardor Tursunov','Malika Ismoilova','Akmal Qodirov','Zarina Abdullayeva','Otabek Mirzayev','Shahnoza Ergasheva'];
function open(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{const d=r.result;STORES.forEach(x=>{if(!d.objectStoreNames.contains(x))d.createObjectStore(x,{keyPath:'id'})});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function all(store){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function put(store,val){const d=await open();return new Promise((res,rej)=>{const r=d.transaction(store,'readwrite').objectStore(store).put(val);r.onsuccess=()=>res(val);r.onerror=()=>rej(r.error)})}
async function remove(store,id){const d=await open();return new Promise(r=>{const q=d.transaction(store,'readwrite').objectStore(store).delete(id);q.onsuccess=r})}
async function delWhere(store,pred){const items=(await all(store)).filter(pred);if(!items.length)return 0;const d=await open();return new Promise((res,rej)=>{const t=d.transaction(store,'readwrite');items.forEach(x=>t.objectStore(store).delete(x.id));t.oncomplete=()=>res(items.length);t.onerror=()=>rej(t.error)})}
function newId(prefix){return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random()*1296).toString(36)}`}
/* Day key used by attendance and daily tasks alike: YYYY-MM-DD. */
function dayKey(d=new Date()){return d.toISOString().slice(0,10)}
/* Demo daily tasks so the new "Vazifalar" screen is not empty on first run. Only touches the seeded demo groups. */
async function seedTasks(){const groups=await all('groups'),students=await all('students');
 if(!groups.some(g=>['g1','g2','g3'].includes(g.id)))return;
 const date=dayKey(),now=Date.now();
 const plans=[{groupId:'g1',title:'12–14-mashqlarni yechish',note:'Daftarga to‘liq yechib, rasmini guruhga yuboring.',deadline:'20:00'},{groupId:'g3',title:'«Mening kunim» inshosi',note:'Kamida 120 ta so‘z, rus tilida.',deadline:'21:00'}];
 for(const p of plans){const g=groups.find(x=>x.id===p.groupId);if(!g)continue;
  const task={id:newId('k'),groupId:g.id,date,title:p.title,note:p.note,deadline:p.deadline,createdAt:now,updatedAt:now,demo:true};
  await put('tasks',task);
  const list=students.filter(s=>s.groupId===g.id);
  for(let i=0;i<list.length;i++){if(i%7===6)continue;/* har 7-o‘quvchi belgilanmagan qoladi */
   const status=i%5===4?'undone':i%3===2?'partial':'done';
   await put('taskProgress',{id:`${task.id}_${list[i].id}`,taskId:task.id,studentId:list[i].id,groupId:g.id,date,status,updatedAt:now});}}
 await put('settings',{id:'tasksSeeded',value:true})}
async function init(){const settings=await all('settings'),initialized=settings.some(x=>x.id==='initialized');
 if(!(await all('groups')).length&&!initialized){for(const g of seedGroups)await put('groups',g);let i=0;for(const g of seedGroups)for(const n of names.slice(0,g.id==='g1'?12:8))await put('students',{id:`s${++i}`,groupId:g.id,name:n,phone:'+998 90 123 45 67'});await seedTasks();await put('settings',{id:'initialized',value:true})}
 else if(!(await all('tasks')).length&&!settings.some(x=>x.id==='tasksSeeded'))await seedTasks()}
async function clearAll(){const d=await open();return Promise.all(STORES.map(store=>new Promise((res,rej)=>{const r=d.transaction(store,'readwrite').objectStore(store).clear();r.onsuccess=res;r.onerror=()=>rej(r.error)})))}
export const repo={init,all,put,remove,delWhere,newId,dayKey,clearAll,
 async logs(date,groupId){return (await all('attendance')).filter(x=>x.date===date&&x.groupId===groupId)},
 async history(studentId){return (await all('attendance')).filter(x=>x.studentId===studentId).sort((a,b)=>b.date.localeCompare(a.date))},
 async mark(studentId,groupId,date,status){return put('attendance',{id:`${date}_${studentId}`,studentId,groupId,date,status,updatedAt:Date.now()})},
 /* --- kunlik vazifalar (daily tasks) --- */
 async tasksOn(date,groupId){return (await all('tasks')).filter(x=>x.date===date&&(!groupId||x.groupId===groupId)).sort((a,b)=>a.createdAt-b.createdAt)},
 async taskProgress(taskId){return (await all('taskProgress')).filter(x=>x.taskId===taskId)},
 async taskHistory(studentId){return (await all('taskProgress')).filter(x=>x.studentId===studentId).sort((a,b)=>b.date.localeCompare(a.date))},
 async markTask(taskId,studentId,groupId,date,status){return status==='none'?remove('taskProgress',`${taskId}_${studentId}`):put('taskProgress',{id:`${taskId}_${studentId}`,taskId,studentId,groupId,date,status,updatedAt:Date.now()})}};
