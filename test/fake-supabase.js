// Cliente falso en memoria para la prueba de humo de la interfaz.
(()=>{const U=new URLSearchParams(location.search).get('u');const ME=U?'me-'+U:'me-1',PX='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#a86"/><circle cx="200" cy="200" r="90" fill="#fdc"/></svg>');
const db={session:null,profiles:[],photos:[],matches:[],messages:[],rondas:[],apuntes:[],
 invites:[{id:'i1',from_id:'p3',to_id:ME,drink:'mars',voice:'p3/v.m4a',voice_secs:9,voice_peaks:null,status:'pending',hidden:false,created_at:new Date(Date.now()-40*36e5).toISOString()}],
 people:[{id:'p1',name:'Fabiola',age:29,gender:'Mujer',district:'Barranco',style:'Mystery',bio:'Fiesta, fiesta y fiesta. Libre pensadora.',veil:PX,intro_voice:'p1/i.m4a',intro_secs:11,intro_peaks:null},
  {id:'p2',name:'Andrea',age:27,gender:'Mujer',district:'San Isidro',style:'Golden',bio:'Brunch los domingos, karaoke los jueves.',veil:null,intro_voice:null},
  {id:'p3',name:'Daniela',age:28,gender:'Mujer',district:'Miraflores',style:'Romantic',bio:'Jazz y discos.',veil:PX}]};
if(U){const O=U==='a'?'me-b':'me-a';const t=new Date(Date.now()-6e5).toISOString();db.session={user:{id:ME}};db.invites=[];
 db.profiles.push({id:ME,name:U==='a'?'Miguel':'Lucía',birth:'1992-03-03',gender:'Hombre',interest:'Todos',district:'Miraflores',style:'Mystery',bio:'',inv:{heaven:1},cheers:0,water_day:null});
 db.people=[{id:O,name:U==='a'?'Lucía':'Miguel',age:30,gender:'Mujer',district:'Barranco',style:'Golden',bio:'',veil:PX}];db.photos.push({owner:O,path:O+'/p.jpg',pos:0});
 db.matches.push({id:'mc',a:'me-a',b:'me-b',drink:'heaven',invite_id:'x',closed:false,crossed:false,gift:null,created_at:t});
 db.messages.push({id:'c1',match_id:'mc',sender:'me-a',voice:'a/v.m4a',voice_secs:5,body:null,created_at:t},{id:'c2',match_id:'mc',sender:'me-b',voice:'b/v.m4a',voice_secs:6,body:null,created_at:t});
 localStorage.setItem('martini-salud','["mc"]');}
const BC=new BroadcastChannel('fake');const subs=[];BC.onmessage=e=>subs.forEach(f=>f(e.data));
window.__db=db;const ok=d=>Promise.resolve({data:d,error:null});
function q(t){let rows=(db[t]||[]).slice(),op='select',payload,single=false;const f=[];
 const b={select(){return b;},insert(p){op='insert';payload=p;return b;},update(p){op='update';payload=p;return b;},delete(){op='delete';return b;},
  eq(k,v){f.push(r=>r[k]===v);return b;},in(k,v){f.push(r=>v.includes(r[k]));return b;},or(){return b;},order(){return b;},limit(){return b;},
  maybeSingle(){single=true;return b;},single(){single=true;return b;},
  then(res,rej){let out;
   if(op==='insert'){const arr=(Array.isArray(payload)?payload:[payload]).map(p=>({id:'n'+Math.random(),created_at:new Date().toISOString(),...p}));
     if(t==='profiles')arr.forEach(p=>{p.inv={heaven:1,vendetta:1,sunshine:1};p.cheers=0;p.water_day=null;});db[t].push(...arr);out=single?arr[0]:arr;if(U&&t==='messages')arr.forEach(r=>BC.postMessage({pg:t,row:r}));}
   else if(op==='update'){rows.filter(r=>f.every(x=>x(r))).forEach(r=>Object.assign(db[t].find(z=>z===r)||r,payload));out=null;}
   else if(op==='delete'){db[t]=db[t].filter(r=>!f.every(x=>x(r)));out=null;}
   else{rows=rows.filter(r=>f.every(x=>x(r)));if(t==='invites')rows=rows.filter(r=>r.to_id!==ME||!r.hidden);if(t==='matches')rows=rows;out=single?(rows[0]||null):rows;}
   return ok(out).then(res,rej);}};return b;}
const rpcs={check_code:a=>a.p_code==='BARRA-01',expire_invites:()=>null,discover:()=>db.people.filter(p=>p.id!=='p3'&&!db.invites.some(i=>i.to_id===p.id)),
 people:a=>db.people.filter(p=>a.p_ids.includes(p.id)),
 send_invite:a=>{const me=db.profiles[0];if(a.p_drink==='water')me.water_day=new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'});else delete me.inv[a.p_drink];const i={id:'s'+Math.random(),from_id:ME,to_id:a.p_to,drink:a.p_drink,voice:a.p_voice,status:'pending',hidden:false,created_at:new Date().toISOString()};db.invites.push(i);return {invite:i.id,crossed:false};},
 answer_invite:a=>{const i=db.invites.find(x=>x.id===a.p_id);if(!a.p_accept){i.hidden=true;return null;}i.status='accepted';const m={id:'m1',a:i.from_id,b:ME,drink:i.drink,invite_id:i.id,closed:false,crossed:false,gift:null,created_at:new Date().toISOString()};db.matches.push(m);db.photos.push({owner:i.from_id,path:i.from_id+'/p.jpg',pos:0});db.messages.push({id:'x1',match_id:'m1',sender:i.from_id,voice:i.voice,voice_secs:i.voice_secs,body:null,created_at:i.created_at});return m.id;},
 rondas_feed:()=>[{id:'r1',owner:'p2',plan:'Viernes de jazz en Barranco. ¿Quién se anima a descubrir un bar nuevo conmigo?',drink:'aurora',voice:'p2/r.m4a',voice_secs:8,voice_peaks:null,created_at:new Date(Date.now()-5*36e5).toISOString(),joined:db.apuntes.some(x=>x.ronda_id==='r1'&&x.user_id===ME),name:'Andrea',age:27,district:'San Isidro',style:'Golden',veil:null},
   {id:'r2',owner:'p1',plan:'Café y buena conversación el domingo por la tarde. Sin prisa.',drink:'onenight',voice:null,created_at:new Date(Date.now()-20*36e5).toISOString(),joined:false,name:'Fabiola',age:29,district:'Barranco',style:'Mystery',veil:PX}],
 ronda_hands:()=>3-db.apuntes.filter(x=>x.user_id===ME).length,
 join_ronda:a=>{db.apuntes.push({ronda_id:a.p_id,user_id:ME,created_at:new Date().toISOString()});return 3-db.apuntes.filter(x=>x.user_id===ME).length;},
 open_ronda:a=>{const me=db.profiles[0];delete me.inv[a.p_drink];db.rondas.push({id:'rm',owner:ME,plan:a.p_plan,drink:a.p_drink,voice:a.p_voice,status:'open',created_at:new Date().toISOString()});db.apuntes.push({ronda_id:'rm',user_id:'p1',created_at:new Date().toISOString()},{ronda_id:'rm',user_id:'p2',created_at:new Date().toISOString()});return 'rm';},
 choose_ronda:a=>{const r=db.rondas.find(x=>x.id===a.p_id);r.status='chosen';const now=Date.now(),iso=t=>new Date(t).toISOString();db.matches.push({id:'m2',a:ME,b:a.p_user,drink:r.drink,invite_id:null,ronda_id:r.id,closed:false,crossed:false,gift:null,created_at:iso(now)});db.photos.push({owner:a.p_user,path:a.p_user+'/p.jpg',pos:0});
   db.messages.push({id:'y1',match_id:'m2',sender:ME,body:r.plan,voice:null,created_at:iso(now-9e5)},{id:'y2',match_id:'m2',sender:a.p_user,body:'#plan|Café|Un café en Barranco|'+iso(now-3*36e5),voice:null,created_at:iso(now-8e5)},{id:'y3',match_id:'m2',sender:ME,body:'#plan-ok|y2',voice:null,created_at:iso(now-7e5)},{id:'y4',match_id:'m2',sender:a.p_user,body:'#plan|Tragos|Un bar en Miraflores|'+iso(now+50*36e5),voice:null,created_at:iso(now-6e5)});return 'm2';},
 close_ronda:()=>{db.rondas.forEach(r=>r.status='closed');return null;},
 beta_buy:a=>{const me=db.profiles[0];me.inv[a.p_drink]=(me.inv[a.p_drink]||0)+1;return null;},beta_pack:a=>{const me=db.profiles[0];['heaven','minimal','citrus'].forEach(k=>me.inv[k]=(me.inv[k]||0)+1);return null;},beta_socio:()=>{db.profiles[0].socio=true;return null;},
 block_user:()=>null,close_match:a=>{db.matches.forEach(m=>m.closed=true);return null;},delete_me:()=>null};
window.supabase={createClient:()=>({
 auth:{getSession:()=>ok({session:db.session}),onAuthStateChange(){},signOut:()=>ok(null),
  signUp:()=>{db.session={user:{id:ME}};return ok({session:db.session,user:{id:ME,identities:[1]}});},
  signInWithPassword:()=>{db.session={user:{id:ME}};return ok({session:db.session});}},
 from:q,rpc:(n,a)=>ok(rpcs[n](a||{})),
 storage:{from:()=>({createSignedUrls:ps=>ok(ps.map(p=>({path:p,signedUrl:PX}))),upload:()=>ok({}),remove:()=>ok({})})},
 channel:name=>{const hs=[];const fn=d=>{if(d.pg)hs.filter(h=>h.t==='postgres_changes'&&h.o.table===d.pg&&h.o.event==='INSERT').forEach(h=>h.cb({new:d.row}));else if(d.ch===name)hs.filter(h=>h.t==='broadcast'&&h.o.event===d.event).forEach(h=>h.cb({payload:d.payload}));};
   const c={on:(t,o,cb)=>{hs.push({t,o,cb});return c;},subscribe:cb=>{subs.push(fn);c._fn=fn;setTimeout(()=>cb&&cb('SUBSCRIBED'),30);return c;},send:m=>{BC.postMessage({ch:name,event:m.event,payload:JSON.parse(JSON.stringify(m.payload))});return Promise.resolve('ok');}};return c;},
 removeChannel(c){const i=subs.indexOf(c._fn);if(i>=0)subs.splice(i,1);}})};})();
