// Cliente falso en memoria para la prueba de humo de la interfaz.
(()=>{const ME='me-1',PX='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#a86"/><circle cx="200" cy="200" r="90" fill="#fdc"/></svg>');
const db={session:null,profiles:[],photos:[],matches:[],messages:[],
 invites:[{id:'i1',from_id:'p3',to_id:ME,drink:'mars',voice:'p3/v.m4a',voice_secs:9,voice_peaks:null,status:'pending',hidden:false,created_at:new Date(Date.now()-40*36e5).toISOString()}],
 people:[{id:'p1',name:'Fabiola',age:29,gender:'Mujer',district:'Barranco',style:'Mystery',bio:'Fiesta, fiesta y fiesta. Libre pensadora.',veil:PX,intro_voice:'p1/i.m4a',intro_secs:11,intro_peaks:null},
  {id:'p2',name:'Andrea',age:27,gender:'Mujer',district:'San Isidro',style:'Golden',bio:'Brunch los domingos, karaoke los jueves.',veil:null,intro_voice:null},
  {id:'p3',name:'Daniela',age:28,gender:'Mujer',district:'Miraflores',style:'Romantic',bio:'Jazz y discos.',veil:PX}]};
window.__db=db;const ok=d=>Promise.resolve({data:d,error:null});
function q(t){let rows=(db[t]||[]).slice(),op='select',payload,single=false;const f=[];
 const b={select(){return b;},insert(p){op='insert';payload=p;return b;},update(p){op='update';payload=p;return b;},delete(){op='delete';return b;},
  eq(k,v){f.push(r=>r[k]===v);return b;},in(k,v){f.push(r=>v.includes(r[k]));return b;},or(){return b;},order(){return b;},limit(){return b;},
  maybeSingle(){single=true;return b;},single(){single=true;return b;},
  then(res,rej){let out;
   if(op==='insert'){const arr=(Array.isArray(payload)?payload:[payload]).map(p=>({id:'n'+Math.random(),created_at:new Date().toISOString(),...p}));
     if(t==='profiles')arr.forEach(p=>{p.inv={heaven:1,vendetta:1,sunshine:1};p.cheers=0;p.water_day=null;});db[t].push(...arr);out=single?arr[0]:arr;}
   else if(op==='update'){rows.filter(r=>f.every(x=>x(r))).forEach(r=>Object.assign(db[t].find(z=>z===r)||r,payload));out=null;}
   else if(op==='delete'){db[t]=db[t].filter(r=>!f.every(x=>x(r)));out=null;}
   else{rows=rows.filter(r=>f.every(x=>x(r)));if(t==='invites')rows=rows.filter(r=>r.to_id!==ME||!r.hidden);if(t==='matches')rows=rows;out=single?(rows[0]||null):rows;}
   return ok(out).then(res,rej);}};return b;}
const rpcs={check_code:a=>a.p_code==='BARRA-01',expire_invites:()=>null,discover:()=>db.people.filter(p=>p.id!=='p3'&&!db.invites.some(i=>i.to_id===p.id)),
 people:a=>db.people.filter(p=>a.p_ids.includes(p.id)),
 send_invite:a=>{const me=db.profiles[0];if(a.p_drink==='water')me.water_day=new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'});else delete me.inv[a.p_drink];const i={id:'s'+Math.random(),from_id:ME,to_id:a.p_to,drink:a.p_drink,voice:a.p_voice,status:'pending',hidden:false,created_at:new Date().toISOString()};db.invites.push(i);return {invite:i.id,crossed:false};},
 answer_invite:a=>{const i=db.invites.find(x=>x.id===a.p_id);if(!a.p_accept){i.hidden=true;return null;}i.status='accepted';const m={id:'m1',a:i.from_id,b:ME,drink:i.drink,invite_id:i.id,closed:false,crossed:false,gift:null,created_at:new Date().toISOString()};db.matches.push(m);db.photos.push({owner:i.from_id,path:i.from_id+'/p.jpg',pos:0});db.messages.push({id:'x1',match_id:'m1',sender:i.from_id,voice:i.voice,voice_secs:i.voice_secs,body:null,created_at:i.created_at});return m.id;},
 block_user:()=>null,close_match:a=>{db.matches.forEach(m=>m.closed=true);return null;},delete_me:()=>null};
window.supabase={createClient:()=>({
 auth:{getSession:()=>ok({session:db.session}),onAuthStateChange(){},signOut:()=>ok(null),
  signUp:()=>{db.session={user:{id:ME}};return ok({session:db.session,user:{id:ME,identities:[1]}});},
  signInWithPassword:()=>{db.session={user:{id:ME}};return ok({session:db.session});}},
 from:q,rpc:(n,a)=>ok(rpcs[n](a||{})),
 storage:{from:()=>({createSignedUrls:ps=>ok(ps.map(p=>({path:p,signedUrl:PX}))),upload:()=>ok({}),remove:()=>ok({})})},
 channel:()=>{const c={on:()=>c,subscribe:()=>c};return c;},removeChannel(){}})};})();
