/* Martini · MVP "Noche de apertura". Una pantalla, una idea, una acción. */
const { createClient } = window.supabase;

const CFG = window.MARTINI || {};
const sb = createClient(CFG.url || 'https://x.supabase.co', CFG.key || 'x', { auth: { persistSession: true, autoRefreshToken: true } });

/* ================= CATÁLOGO ================= */
const DR={
  heaven:{n:'Heaven Martini',t:'Una moderna experiencia sensitiva',s:'Romantic',tier:1,c:'#3FA2FF'},
  ice:{n:'Ice Sweets',t:'La frescura de amar la libertad',s:'Romantic',tier:2,c:'#55C8F2'},
  crimson:{n:'Crimson Passion',t:'Intenso, magnético y elegante',s:'Romantic',tier:2,c:'#FF2E4D'},
  minimal:{n:'Minimal Men',t:'Seductor moderno',s:'Fresh',tier:1,c:'#B8E04A'},
  citrus:{n:'Citrus Splash',t:'Vibrante y refrescante',s:'Fresh',tier:1,c:'#2FD8E0'},
  caribe:{n:'Caribbean Vibes',t:'Increíble sabor a sol y mar',s:'Fresh',tier:2,c:'#6A5CFF'},
  apple:{n:'Apple in Flames',t:'Profundo y exquisito',s:'Fresh',tier:3,c:'#2F86FF'},
  onenight:{n:'One Night',t:'Placentero como un secreto',s:'Mystery',tier:1,c:'#39E35F'},
  vendetta:{n:'Vendetta',t:'Rebelde y decidido',s:'Mystery',tier:2,c:'#2EE66B'},
  forest:{n:'Forest Mist',t:'Enigmático e indomable',s:'Mystery',tier:2,c:'#3BE37A'},
  nature:{n:'Nature Mystery',t:'Misterioso como la naturaleza',s:'Mystery',tier:3,c:'#9B6BFF'},
  sunshine:{n:'My Sunshine',t:'Fiesta de energía y diversión',s:'Golden',tier:1,c:'#F2A93B'},
  royal:{n:'Royal Party',t:'Brillante como el éxito',s:'Golden',tier:2,c:'#E8CF5A'},
  aurora:{n:'Golden Aurora',t:'Sofisticado y luminoso',s:'Golden',tier:2,c:'#F5B04A'},
  shake:{n:'ShakeshakeBoomboom',t:'Divertido, sensual y cautivador',s:'Golden',tier:3,c:'#FF4FD8'},
  mars:{n:'Love in Mars',t:'Un viaje estelar de sensaciones',s:'Dreamer',tier:3,c:'#FF3D6E'},
  cosmic:{n:'Cosmic Velvet',t:'Una seducción de otro mundo',s:'Dreamer',tier:3,c:'#B26BFF'},
  eclipse:{n:'Eclipse',t:'Nocturno y de carácter fuerte',s:'Night',tier:3,c:'#FF8A3D'},
  water:{n:'Cool Water',t:'Simple y cool',s:'Other',tier:0,c:'#3FE0D0'}
};
const PRICE={1:2.9,2:5.9,3:11.9};
const STY={
  Romantic:{d:'Sensible y detallista',img:'heaven',c:'#3FA2FF'},
  Fresh:{d:'Libre y espontáneo',img:'minimal',c:'#B8E04A'},
  Mystery:{d:'Intrigante y profundo',img:'onenight',c:'#39E35F'},
  Golden:{d:'Fiestero y brillante',img:'sunshine',c:'#F2A93B'},
  Dreamer:{d:'Soñador y de otro mundo',img:'cosmic',c:'#B26BFF'},
  Night:{d:'Nocturno y de carácter fuerte',img:'eclipse',c:'#FF8A3D'}
};
const DISTS=['Miraflores','Barranco','San Isidro','Lince','Magdalena','Jesús María','Pueblo Libre','Lima Cercado','Surquillo','San Borja','Surco','La Molina','San Miguel','Chorrillos','Los Olivos','SJL','Otro distrito de Lima'];
const MAXV=15, MAXC=30, MINV=2;
const TXT={
  generic:'Algo se derramó de nuestro lado. Inténtalo de nuevo.',
  offline:'Sin conexión. Tu barra te espera cuando vuelva la señal.',
  money:'En Martini no se habla de pagos. Edita tu mensaje.',
  short:'Muy corto. Graba al menos 2 segundos.',
  mic:'Martini necesita tu micrófono para el brindis. Actívalo en los ajustes del navegador.',
  terms:'Martini está en beta cerrada por invitación. Guardamos tu correo, nombre, fecha de nacimiento, distrito, a quién quieres conocer, tu foto, tu voz y tus mensajes, solo para que la app funcione: mostrarte a otras personas y que puedan brindar contigo. Tu foto solo la ven quienes brindan contigo. No vendemos ni compartimos tus datos; se alojan en Supabase y Vercel. Puedes borrar todo desde Perfil > Eliminar mi cuenta'+(CFG.contact?`, o escribirnos a ${CFG.contact}`:'')+'. Solo para mayores de 18. En Martini no se ofrece ni se pide dinero. Trata a los demás como en la barra de un buen bar; si alguien te incomoda, bloquéalo y repórtalo.'
};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MONEY=/(yape|plin|te pago|pagame|transferencia|cuenta bancaria|s\/ ?\d|\d+ ?(soles|lucas))/;
const moneyTalk=(t,phone=false)=>MONEY.test(norm(t))||(phone&&/(^|\D)9\d{2}[ -]?\d{3}[ -]?\d{3}(\D|$)/.test(t));

/* ================= UTILIDADES ================= */
const $app=document.getElementById('app'), $ph=document.getElementById('phone');
const I=(n,cls='')=>`<svg class="i ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const img=k=>`img/${k}.jpg`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+n.toFixed(2);
const courtesy=()=>((S.me&&S.me.cheers)||0)%3;
const cring=()=>{const n=courtesy();return `<span class="cring ${n===2?'near':''}" style="--p:${n}">${I('glass')}</span>`;};
const barAria=()=>`Mi barra: ${invCount()} tragos. ${courtesy()} de 3 brindis para el trago de la casa`;
const tier=t=>`<span class="tier t${t}">${t===0?'Gratis':'Tier '+t}</span>`;
const calm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const hap=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};
const sig=style=>(STY[style]||STY.Mystery).img;
const first=n=>esc(String(n||'').trim().split(' ')[0]);
const ageOf=b=>{if(!b)return 0;const d=new Date(b+'T12:00:00'),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a;};
const hoursLeft=ts=>Math.max(0,48-(Date.now()-new Date(ts).getTime())/36e5);
const hrs=h=>h>=1?`${Math.floor(h)} h`:'menos de 1 h';
const uid=()=>S.session?.user?.id;
const limaDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'});
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('martini-'+k))??d;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem('martini-'+k,JSON.stringify(v));}catch(e){}}};

function ice(ts){const h=hoursLeft(ts);const f=Math.max(.1,Math.min(1,h/48));const low=h<=12;const c=low?'#E6C27A':'#86E3AE';const top=3+(1-f)*12;
  return `<span class="ice ${low?'low':''}"><svg viewBox="0 0 16 20" aria-hidden="true"><rect x="1.5" y="${top.toFixed(1)}" width="13" height="${(16.5-top).toFixed(1)}" rx="3" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="1.3"/><path d="M5 ${(top+4).toFixed(1)}h3" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/></svg>Se enfría en ${hrs(h)}</span>`;}
function seedPeaks(s,n=28){let x=0;for(const c of String(s))x=(x*31+c.charCodeAt(0))>>>0;const o=[];for(let i=0;i<n;i++){x=(x*9301+49297)%233280;o.push(.25+.75*(x/233280)*(.55+.45*Math.sin(i/2.2)**2));}return o;}
function vn(path,secs,peaks,mine=false,where=''){if(!path)return '';secs=Math.max(1,Math.round(secs||1));const pk=(Array.isArray(peaks)&&peaks.length?peaks:seedPeaks(path));
  return `<button class="vn ${mine?'mine':''}" data-a="play" data-v="${esc(path)}" data-d="${secs}" data-w="${where}" type="button" aria-label="Escuchar nota de voz de ${secs} segundos"><span class="vp">${I('play','fill s')}</span><span class="vb">${pk.map(p=>`<i style="height:${Math.round(4+24*Math.min(1,p))}px"></i>`).join('')}</span><span class="vd">0:${String(secs).padStart(2,'0')}</span></button>`;}
function veilAv(p,size=48){const c=(STY[p?.style]||STY.Mystery).c;return p?.veil?`<span class="av veil" style="--c:${c};width:${size}px;height:${size}px"><img src="${esc(p.veil)}" alt=""></span>`:`<span class="av hide" style="--c:${c};width:${size}px;height:${size}px">${I('lock','s')}</span>`;}
function photoAv(url,p,size=44){const c=(STY[p?.style]||STY.Mystery).c;return url?`<span class="av ph" style="--c:${c};width:${size}px;height:${size}px"><img src="${esc(url)}" alt=""></span>`:veilAv(p,size);}
function toast(msg,icon='check'){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.innerHTML=I(icon)+`<span>${esc(msg)}</span>`;$ph.appendChild(t);setTimeout(()=>t.remove(),3400);}
function banner(title,sub,action,v){const b=document.createElement('button');b.type='button';b.className='banner';b.dataset.a=action;if(v)b.dataset.v=v;b.innerHTML=`<span class="appi"><img src="img/lips.png" alt=""></span><span class="grow"><b>${esc(title)}</b><span>${esc(sub)}</span></span><span class="small dim">ahora</span>`;$ph.appendChild(b);hap([10,40,10]);setTimeout(()=>b.remove(),6000);}
function err(e,fallback){console.error(e);if(!navigator.onLine)return toast(TXT.offline,'x');const m=e&&e.message||'';
  const mine=/[áéíóú¿¡]|Ese |Ya |Esta |Martini|trago|Correo|contraseña/.test(m)&&!/row-level|violates|JWT|fetch/i.test(m);toast(mine?m:(fallback||TXT.generic),'x');}
function track(){} /* medición: fuera de esta versión */
function clink(){const w=calm()?0:.45;setTimeout(()=>hap([12,40,18]),w*1000);try{const ac=new(window.AudioContext||window.webkitAudioContext)();[[2637,0],[3951,0],[2093,.11],[3136,.11]].forEach(([f,d],i)=>{const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+d+w;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12/(1+i%2),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+1.1);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+1.2);});}catch(e){}}
const preload=urls=>Promise.all(urls.filter(Boolean).map(u=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r();i.src=u;})));

/* Archivos privados: URLs firmadas con caché */
const URLS=new Map();
async function signed(bucket,paths){const need=[...new Set(paths.filter(p=>p&&!p.startsWith('blob:')&&!URLS.has(bucket+p)))];
  if(need.length){const {data}=await sb.storage.from(bucket).createSignedUrls(need,60*60*3);(data||[]).forEach(d=>{if(d.signedUrl)URLS.set(bucket+d.path,d.signedUrl);});}
  return paths.map(p=>p&&p.startsWith('blob:')?p:URLS.get(bucket+p));}
async function upload(bucket,blob,ext){const path=`${uid()}/${crypto.randomUUID()}.${ext}`;const {error}=await sb.storage.from(bucket).upload(path,blob,{contentType:blob.type||undefined,upsert:false});if(error)throw error;return path;}
/* Foto: recorte 4:5, 1080 px, JPEG .82, y un velo de 8×10 px para intuir color, nunca identidad */
async function prepPhoto(file){let src;try{src=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(e){src=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file);});}
  const W=src.width,H=src.height;let sw=W,sh=W*5/4;if(sh>H){sh=H;sw=H*4/5;}const sx=(W-sw)/2,sy=(H-sh)/2;
  const c=document.createElement('canvas');c.width=1080;c.height=1350;c.getContext('2d').drawImage(src,sx,sy,sw,sh,0,0,1080,1350);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.82));
  const v=document.createElement('canvas');v.width=8;v.height=10;v.getContext('2d').drawImage(c,0,0,8,10);
  return {blob,url:URL.createObjectURL(blob),veil:v.toDataURL('image/jpeg',.7)};}

/* ================= VOZ ================= */
const REC={mr:null,chunks:[],t0:0,iv:null,stream:null,mime:'',an:null,ac:null,samples:[]};
function recMime(){if(!window.MediaRecorder)return null;for(const m of['audio/mp4','audio/mp4;codecs=mp4a.40.2','audio/aac','audio/webm;codecs=opus','audio/webm'])if(MediaRecorder.isTypeSupported(m))return m;return '';}
async function recStart(max,onTick,onAuto){const mime=recMime();if(mime===null){toast('Este navegador no permite grabar voz','x');return false;}
  try{REC.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});}catch(e){toast(TXT.mic,'mic');return false;}
  REC.mime=mime;REC.chunks=[];REC.samples=[];
  try{REC.ac=new(window.AudioContext||window.webkitAudioContext)();const s=REC.ac.createMediaStreamSource(REC.stream);REC.an=REC.ac.createAnalyser();REC.an.fftSize=64;REC.an.smoothingTimeConstant=.35;s.connect(REC.an);}catch(e){REC.an=null;}
  REC.mr=new MediaRecorder(REC.stream,mime?{mimeType:mime}:undefined);REC.mr.ondataavailable=e=>{if(e.data.size)REC.chunks.push(e.data);};REC.mr.start(250);REC.t0=Date.now();hap(10);
  const buf=new Uint8Array(32);
  REC.iv=setInterval(()=>{const t=(Date.now()-REC.t0)/1000;let lv=.15+Math.random()*.2;if(REC.an){REC.an.getByteTimeDomainData(buf);let m=0;for(const b of buf)m=Math.max(m,Math.abs(b-128));lv=Math.min(1,m/70);}REC.samples.push(lv);
    onTick&&onTick(t,REC.samples);if(t>=max){hap(20);onAuto&&onAuto();}},50);return true;}
function toPeaks(s,n=28){if(!s.length)return null;const o=[];for(let i=0;i<n;i++){const a=Math.floor(i*s.length/n),b=Math.max(a+1,Math.floor((i+1)*s.length/n));o.push(Math.max(...s.slice(a,b)));}const mx=Math.max(...o)||1;return o.map(v=>Math.round(Math.max(.12,v/mx)*100)/100);}
function recStop(){return new Promise(res=>{const mr=REC.mr;if(!mr){res(null);return;}clearInterval(REC.iv);const secs=Math.round((Date.now()-REC.t0)/1000);const peaks=toPeaks(REC.samples);
  const done=()=>{REC.stream&&REC.stream.getTracks().forEach(t=>t.stop());try{REC.ac&&REC.ac.close();}catch(e){}REC.mr=null;};
  mr.onstop=()=>{const type=(mr.mimeType||REC.mime||'audio/webm');const blob=new Blob(REC.chunks,{type:type.split(';')[0]});done();hap(8);
    if(secs<MINV){toast(TXT.short,'mic');res(null);return;}res({blob,secs:Math.min(secs,MAXC),peaks,ext:/mp4|aac/.test(type)?'m4a':'webm',url:URL.createObjectURL(blob)});};
  try{mr.stop();}catch(e){done();res(null);}});}
function recCancel(){if(REC.mr){clearInterval(REC.iv);try{REC.mr.onstop=null;REC.mr.stop();}catch(e){}REC.stream&&REC.stream.getTracks().forEach(t=>t.stop());try{REC.ac&&REC.ac.close();}catch(e){}REC.mr=null;}}
const liveBars=(c)=>`<div class="live" id="live" style="--c:${c}">${Array.from({length:28},()=>'<i style="height:4px"></i>').join('')}</div>`;
function paintLive(t,samples,max){const bs=document.querySelectorAll('#live i');const last=samples.slice(-28);bs.forEach((b,i)=>{const v=last[i-(28-last.length)];b.style.height=(v==null?4:Math.round(4+24*v))+'px';});
  const lab=document.getElementById('rect');if(lab){lab.textContent=`0:${String(Math.min(max,Math.floor(t))).padStart(2,'0')} / 0:${max}`;lab.classList.toggle('late',t>=max-3);}}

let player=null,playBtn=null;
async function play(btn){const path=btn.dataset.v,dur=+btn.dataset.d;
  if(playBtn===btn&&player){player.pause();return;}
  if(player)player.pause();
  let [url]=await signed('voice',[path]);
  if(!url){toast('No pudimos cargar esta nota de voz','x');return;}
  const a=new Audio();a.setAttribute('playsinline','');a.preload='auto';a.src=url;player=a;playBtn=btn;const bs=[...btn.querySelectorAll('.vb i')];
  const reset=()=>{btn.querySelector('.vp').innerHTML=I('play','fill s');bs.forEach(b=>b.classList.remove('on'));btn.querySelector('.vd').textContent='0:'+String(dur).padStart(2,'0');if(player===a){player=null;playBtn=null;}};
  a.onplay=()=>{btn.querySelector('.vp').innerHTML=I('pause','fill s');};
  a.ontimeupdate=()=>{const d=isFinite(a.duration)&&a.duration>0?a.duration:dur;const p=a.currentTime/d;bs.forEach((b,i)=>b.classList.toggle('on',(i+.5)/bs.length<=p));btn.querySelector('.vd').textContent='0:'+String(Math.max(0,Math.ceil(d-a.currentTime))).padStart(2,'0');};
  a.onpause=a.onended=reset;a.onerror=()=>{reset();toast('No pudimos reproducir esta nota de voz','x');};
  a.play().then(()=>track('voice_play',{where:btn.dataset.w||S.screen})).catch(()=>reset());}

/* ================= ESTADO ================= */
let S={screen:'boot',stack:[],sheet:null,session:null,me:null,myPhoto:null,
  deck:[],di:0,looped:false,recv:[],sent:[],matches:[],people:{},photos:{},msgs:{},chat:null,
  act:'recibidas',ob:0,auth:'login',authStep:'code',code:null,D:null,editing:null,target:null,pick:null,voice:null,salud:null,saludQ:[],cmic:null,barTab:'carta',busy:false};
const lastRead=LS.get('read',{});
const markRead=id=>{lastRead[id]=new Date().toISOString();LS.set('read',lastRead);};
const lastOf=m=>(S.msgs[m.id]||[]).slice(-1)[0]||m.last;
const unread=m=>{const l=lastOf(m);return !m.closed&&l&&l.sender!==uid()&&(!lastRead[m.id]||l.created_at>lastRead[m.id]);};
const peerOf=m=>m.a===uid()?m.b:m.a;
const invCount=()=>Object.values(S.me?.inv||{}).reduce((a,b)=>a+b,0);
const waterOK=()=>S.me&&S.me.water_day!==limaDay();
const curPerson=()=>S.deck.length?S.deck[S.di%S.deck.length]:null;

/* ================= NAVEGACIÓN Y RENDER ================= */
const POUR=new Set(['sent','gift']);const RISE=new Set(['person']);
let lastScreen=null;
function go(screen,push=true){stopRec();if(push&&S.screen!==screen&&S.screen!=='boot')S.stack.push(S.screen);S.screen=screen;S.sheet=null;render(push?(RISE.has(screen)?'modal':'push'):'fade');}
function tab(t){stopRec();S.stack=[];S.sheet=null;S.screen=t;render('tab');}
function back(){stopRec();S.sheet=null;const from=S.screen;S.screen=S.stack.pop()||'personas';render(RISE.has(from)?'drop':'pop');}
function stopRec(){if(REC.mr)recCancel();S.cmic=null;if(S.voice&&S.voice.on)S.voice=null;if(S.D&&S.D.intro&&S.D.intro.on)S.D.intro=null;if(player)player.pause();}

function render(anim){
  let kind=anim===true?'fade':anim;
  const old=$app.querySelector('.screen:not(.ghost)');
  const sc0=old&&old.querySelector('.scroll');const prevScroll=kind?0:(sc0?sc0.scrollTop:0);
  const focusId=!kind&&document.activeElement&&document.activeElement.id;
  const v=V[S.screen]||V.personas;
  const segOld=!kind&&old?old.querySelector('.seg button.on'):null;const segX=segOld?segOld.getBoundingClientRect().left:null;
  if(kind&&old&&!calm()&&lastScreen!==S.screen){
    if(POUR.has(S.screen)&&kind!=='pop')kind='pour';
    [...$app.children].forEach(c=>{if(c!==old)c.remove();});
    old.className=old.className.replace(/\b(nv-[a-z-]+|enter)\b/g,'')+' ghost nv-'+kind+'-out';old.setAttribute('aria-hidden','true');
    old.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
    $app.insertAdjacentHTML('afterbegin',v());
    const nw=$app.querySelector('.screen');
    if(kind==='pour'){const c=nw.style.getPropertyValue('--glow')||'#86E3AE';const w='<svg viewBox="0 0 1200 28" preserveAspectRatio="none" aria-hidden="true"><path d="M0 14Q150-10 300 14T600 14T900 14T1200 14V28H0Z"/></svg>';const d=document.createElement('div');d.className='pour';d.style.setProperty('--c',c);d.innerHTML=w+w;$ph.appendChild(d);setTimeout(()=>d.remove(),1200);}
    setTimeout(()=>old.remove(),kind==='tab'?200:kind==='pour'?540:560);
  }else{$app.innerHTML=v();if(kind&&kind!=='fade')kind='fade';}
  const sc=$app.querySelector('.screen:not(.ghost)');
  if(kind&&sc)sc.classList.add('nv-'+kind+'-in');
  const scr=sc&&sc.querySelector('.scroll');if(scr&&!kind)scr.scrollTop=prevScroll;
  if(focusId){const f=document.getElementById(focusId);if(f&&f.tagName==='INPUT'){f.focus();}}
  if(S.sheet&&SHEETS[S.sheet.k])$app.insertAdjacentHTML('beforeend',SHEETS[S.sheet.k]());
  AFTER[S.screen]&&AFTER[S.screen](kind);
  polish(sc,segX);
  lastScreen=S.screen;
}
const rerender=()=>render(false);
/* Detalles de continuidad: el selector se desliza, el contador de la barra late cuando cambia. */
let lastInv=null;
function polish(sc,segX){if(!sc||calm())return;
  const on=sc.querySelector('.seg button.on');
  if(on&&segX!=null&&on.animate){const dx=segX-on.getBoundingClientRect().left;if(Math.abs(dx)>4)try{on.animate([{transform:`translateX(${dx}px)`},{transform:'none'}],{duration:320,easing:'cubic-bezier(.32,.72,0,1)',pseudoElement:'::before'});}catch(e){}}
  const bn=sc.querySelector('.barchip .bn');if(bn&&S.me){const n=invCount();if(lastInv!=null&&n!==lastInv)bn.classList.add(n>lastInv?'tick-up':'tick-down');lastInv=n;}}
function swapIn(){if(calm())return;const b=$app.querySelector('.screen:not(.ghost)>.scroll');if(b){b.classList.remove('swap');b.offsetWidth;b.classList.add('swap');}}
const live=['actividad','personas','bar','perfil'];

const shell=(cls,glow,inner)=>`<section class="screen ${cls}" style="--glow:${glow}">${inner}</section>`;
const topbar=(title,right='')=>`<div class="top pad"><button class="iconbtn" data-a="back" aria-label="Volver" type="button">${I('back')}</button><span class="title">${title}</span><span style="flex:1"></span>${right}</div>`;
const steps=n=>S.editing?topbar(''):`<div class="top pad">${n>1?`<button class="iconbtn" data-a="back" aria-label="Volver" type="button">${I('back')}</button>`:'<span style="width:44px"></span>'}<div class="progress"><i style="width:${n*20}%;--from:${(n-1)*20}%"></i></div><span class="small dim num">${n} de 5</span></div>`;
function greet(){const n=first(S.me?.name);const d=new Date(),h=d.getHours(),w=d.getDay();
  if((w===5||w===6)&&h>=17)return `Ya es ${w===5?'viernes':'sábado'}, ${n}.`;
  if(h>=19||h<5)return `Buenas noches, ${n}.`;if(h<12)return `Buenos días, ${n}.`;return `Buenas tardes, ${n}.`;}
const tabsbar=active=>{const n=S.recv.length+S.matches.filter(unread).length;const soon=S.recv.some(r=>hoursLeft(r.created_at)<=12);
  const items=[['personas','users','Personas'],['actividad','bell','Actividad'],['bar','glass','Bar'],['perfil','user','Perfil']];
  return `<nav class="tabs pad" aria-label="Secciones">${items.map(([k,ic,l])=>`<button type="button" data-a="tab" data-v="${k}" class="${active===k?'on':''}" ${active===k?'aria-current="page"':''}>${I(ic)}<span>${l}</span>${k==='actividad'&&n?`<span class="dot ${soon?'soon':''}">${n}</span>`:''}</button>`).join('')}</nav>`;};
const chipsOf=(key,opts,val)=>`<div class="chips">${opts.map(o=>`<button type="button" class="chip ${val===o?'on':''}" data-a="setd" data-k="${key}" data-v="${esc(o)}" aria-pressed="${val===o}">${esc(o)}</button>`).join('')}</div>`;
const TPL=(p,d)=>[`Elegí el ${d.n} porque es ${d.t.toLowerCase()}. Algo me dice que tú también.`,p.bio?`Leí tu frase y me quedé con ganas de saber más. ¿Me la cuentas con este trago?`:`Hola ${first(p.name)}. Tu estilo ${p.style} me dio curiosidad. ¿Brindamos?`,`¿Un ${d.n} este fin de semana? Algo simple: buena conversación y nada de prisa.`];

/* ================= VISTAS ================= */
const OB=[
  {img:'onenight',c:'#39E35F',t:'Invita un trago,<br><em>no un like.</em>',p:'Elige el cocktail que habla por ti y envíaselo a quien te interesa. Un trago dice más que mil corazones.'},
  {img:'vendetta',c:'#2EE66B',t:'Primero se escucha,<br><em>después se ve.</em>',p:'Ves su trago y escuchas su voz. Las fotos se revelan cuando los dos brindan.'},
  {img:'sunshine',c:'#F2A93B',t:'Si no te aceptan,<br><em>vuelve a tu barra.</em>',p:'Cada trago va a una persona a la vez. Si no lo acepta en 48 horas, regresa a ti para invitarlo a alguien más.'}
];
const V={
boot:()=>`<section class="screen splash" style="--glow:#86E3AE"><div><img class="lips" src="img/lips.png" alt=""><div class="lockup"><div class="wordmark">Martini</div></div></div></section>`,

splash:()=>`<section class="screen splash" style="--glow:#86E3AE" data-a="to-onb" tabindex="0" role="button" aria-label="Entrar">
  <div><img class="lips" src="img/lips.png" alt=""><div class="lockup"><div class="wordmark">Martini</div><div class="tagline">¿Qué cocktail eres hoy?</div></div></div>
  <div class="bottom quietfoot">El primer bar virtual del Perú</div></section>`,

onboarding:()=>{const o=OB[S.ob];return `<section class="screen onb" style="--glow:${o.c}">
  <div class="hero"><img src="${img(o.img)}" alt=""></div>
  <div class="scroll pad" style="margin-top:-40px;position:relative">
    <h1 class="display">${o.t}</h1><p class="lead">${o.p}</p>
    <div class="dots" role="tablist" aria-label="Pasos">${OB.map((_,i)=>`<button type="button" class="${i===S.ob?'on':''}" data-a="ob-go" data-v="${i}" aria-label="Paso ${i+1} de ${OB.length}"></button>`).join('')}</div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="ob-next" type="button">${S.ob<OB.length-1?'Siguiente':'Tengo una invitación'}</button>
    <button class="btn btn-ghost" data-a="auth" data-v="login" type="button">Ya tengo cuenta</button></div></section>`;},

auth:()=>{const up=S.auth==='signup',codeStep=up&&S.authStep==='code';const pre=new URLSearchParams(location.search).get('c')||S.code||'';
  const eye=`<button type="button" class="iconbtn eye" data-a="eye" aria-label="Ver contraseña">${I('eye','s')}</button>`;
  return shell('','#86E3AE',`${topbar('')}
  <form class="scroll pad" data-form="auth" id="authf" novalidate>
    ${codeStep?`<h1 class="display" style="font-size:34px">Tu <em>invitación</em></h1>
      <p class="lead">Martini abre por invitación. Escribe el código que te pasaron.</p>
      <div class="stack" style="margin-top:24px"><div class="field"><label for="code">Código</label><input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(pre)}" enterkeyhint="go"></div></div>`
    :up?`<h1 class="display" style="font-size:34px">Crea tu <em>cuenta</em></h1>
      <div class="stack" style="margin-top:24px">
        <div class="field"><label for="em">Correo</label><input id="em" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off"></div>
        <div class="field"><label for="pw">Contraseña</label><input id="pw" name="pass" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres">${eye}</div>
      </div>
      <label class="consent"><input type="checkbox" name="ok"><span>Soy mayor de 18 y acepto los <button type="button" class="inlink" data-a="sheet" data-v="terms">Términos</button> y el tratamiento de mis datos, incluido a quién quiero conocer, para usar Martini.</span></label>`
    :`<h1 class="display" style="font-size:34px">Bienvenido <em>de vuelta</em></h1>
      <div class="stack" style="margin-top:24px">
        <div class="field"><label for="em">Correo</label><input id="em" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off"></div>
        <div class="field"><label for="pw">Contraseña</label><input id="pw" name="pass" type="password" autocomplete="current-password">${eye}</div>
      </div>
      <button type="button" class="linkbtn" data-a="auth" data-v="signup">Tengo una invitación</button>`}
  </form>
  <div class="foot pad"><button class="btn btn-primary" type="submit" form="authf" ${S.busy?'disabled':''}>${S.busy?'Un momento…':codeStep?'Entrar al bar':up?'Continuar':'Entrar'}</button></div>`);},

about:()=>{const D=S.D;return shell('','#86E3AE',`${steps(1)}
  <div class="scroll pad">
    <h1 class="display" style="font-size:34px">Cuéntanos <em>de ti</em></h1>
    <div class="stack" style="margin-top:24px">
      <div class="field"><label for="nm">Nombre</label><input id="nm" data-in="name" value="${esc(D.name)}" autocomplete="given-name" maxlength="25" autocapitalize="words"></div>
      <div class="field"><label for="bd">Nacimiento</label><input id="bd" data-in="birth" type="date" value="${esc(D.birth)}" min="1940-01-01" max="${new Date().toISOString().slice(0,10)}"></div>
      <div class="field select"><label for="ds">Distrito</label><select id="ds" data-in="district"><option value="" ${D.district?'':'selected'} disabled>Elige</option>${DISTS.map(x=>`<option ${D.district===x?'selected':''}>${esc(x)}</option>`).join('')}</select>${I('chev','s')}</div>
    </div>
    <div style="height:20px"></div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="about-next" type="button">Continuar</button></div>`);},

conocer:()=>{const D=S.D;return shell('','#86E3AE',`${steps(2)}
  <div class="scroll pad">
    <h1 class="display" style="font-size:34px">¿A quién quieres <em>conocer?</em></h1>
    <div class="sec" style="margin-top:28px"><span class="eyebrow">Me identifico como</span>${chipsOf('gender',['Hombre','Mujer','No binario'],D.gender)}</div>
    <div class="sec"><span class="eyebrow">Me interesan</span>${chipsOf('interest',['Mujeres','Hombres','Todos'],D.interest)}</div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="conocer-next" type="button" ${D.gender&&D.interest?'':'disabled'}>Continuar</button></div>`);},

style:()=>{const st=S.D.style;const c=STY[st].c;return shell('',c,`${steps(3)}
  <div class="scroll pad">
    <h1 class="display" style="font-size:34px">¿Qué cocktail <em>eres?</em></h1>
    <p class="lead">Tu estilo es tu trago firma. Es lo primero que ven de ti.</p>
    <div class="styles">${Object.entries(STY).map(([k,s])=>`<button type="button" class="stylecard ${st===k?'on':''}" style="--glow:${s.c}" data-a="setd" data-k="style" data-v="${k}" aria-pressed="${st===k}"><img src="${img(s.img)}" alt=""><div><b>${k}</b><span>${s.d}</span></div>${st===k?`<span class="ck">${I('check','s')}</span>`:''}</button>`).join('')}</div>
    <div style="height:20px"></div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="${S.editing?'save-style':'next'}" data-v="foto" type="button">${S.editing?'Guardar':'Continuar'}</button></div>`);},

foto:()=>{const D=S.D;const p=D.photo;return shell('','#86E3AE',`${steps(4)}
  <div class="scroll pad">
    <h1 class="display" style="font-size:34px">Tu foto y <em>tu frase</em></h1>
    <p class="lead">Tu foto solo se ve cuando brindan contigo. Antes hablan tu trago y tu voz.</p>
    <label class="phs ${p?'':'add'}">${p?`<img src="${esc(p.url)}" alt="Tu foto"><span class="chg">${I('camera','s')} Cambiar</span>`:`${I('camera')}<span>Agregar foto</span>`}<input type="file" accept="image/*" data-file="1" hidden></label>
    <div class="field area" style="margin-top:16px"><textarea data-in="bio" maxlength="120" rows="2" placeholder="Algo que dirías en la barra…" aria-label="Tu frase">${esc(D.bio)}</textarea><span class="count num" id="bioc">${D.bio.length}/120</span></div>
    <div style="height:20px"></div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="${S.editing?'save-foto':'foto-next'}" type="button" ${p&&!S.busy?'':'disabled'}>${S.busy?'Guardando…':S.editing?'Guardar':'Continuar'}</button></div>`);},

brindis:()=>{const D=S.D;const v=D.intro;return shell('','#86E3AE',`${steps(5)}
  <div class="scroll pad" style="text-align:center">
    <h1 class="display" style="font-size:34px;text-align:left">Tu brindis de <em>presentación</em></h1>
    <p class="lead" style="text-align:left">Lo escuchan antes de invitarte. Di tu nombre y algo tuyo.</p>
    <div style="margin-top:36px">${voiceBlock('intro',v,'#86E3AE')}</div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="${S.editing?'save-intro':'finish'}" type="button" ${v&&v.blob&&!S.busy?'':'disabled'}>${S.busy?'Guardando…':'Guardar mi brindis'}</button>
    ${S.editing?'':`<button class="btn btn-ghost" data-a="finish" data-v="skip" type="button" ${S.busy?'disabled':''}>Ahora no</button>`}</div>`);},

gift:()=>shell('','#E6C27A',`<div class="scroll pad" style="text-align:center;padding-top:40px">
    <span class="eyebrow" style="color:var(--gold)">Regalo de bienvenida</span>
    <h1 class="display" style="margin-top:12px">Tienes 3 tragos<br><em>para invitar</em></h1>
    <div class="fan"><img src="${img('heaven')}" alt="Heaven Martini"><img src="${img('vendetta')}" alt="Vendetta"><img src="${img('sunshine')}" alt="My Sunshine"></div>
    <p class="lead" style="margin:22px auto 0">Un Heaven Martini, un Vendetta y un My Sunshine ya están en tu barra. Si alguien no acepta, el trago vuelve a ti.</p>
    <div class="water card" style="margin-top:24px;text-align:left"><img src="${img('water')}" alt=""><div><b class="h3" style="font-size:var(--t-body)">Y un Cool Water gratis cada día</b><div class="small muted">Para decir “me interesas” sin gastar un trago.</div></div></div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="tab" data-v="personas" type="button">Descubrir personas</button></div>`),

personas:()=>{const p=curPerson();const head=`<div class="pad brandbar"><span class="brand"><img src="img/lips.png" alt=""><span class="wordmark">Martini</span></span><button class="barchip" data-a="tab" data-v="bar" type="button" aria-label="${barAria()}">${cring()}<span class="bn">${invCount()}</span></button></div>`;
  if(!p)return shell('','#86E3AE',`${head}<div class="scroll pad"><h1 class="h2">${greet()}</h1>
    <div class="empty" style="padding-top:64px"><div class="h2">La barra recién abre</div>En un rato llega más gente.</div></div>
    ${tabsbar('personas')}`);
  const list=S.deck;const nx=list.length>1?list[(S.di+1)%list.length]:null;const d=DR[sig(p.style)];const c=STY[p.style]?.c||'#86E3AE';
  return shell('',c,`${head}
  <div class="scroll pad">
    <h1 class="h2">${greet()}</h1>
    <div class="deck tall">
      ${nx?`<div class="pcard behind"><img src="${img(sig(nx.style))}" alt=""></div>`:''}
      <div class="pcard" id="pcard" data-a="open-person" role="button" tabindex="0" aria-label="Ver a ${esc(p.name)}">
        <img src="${img(sig(p.style))}" alt="">
        <div class="shade"></div>
        <div class="tl"><span class="sig">Su trago<b>${d.n}</b></span>${tier(d.tier)}</div>
        <div class="info">
          <div class="who">${veilAv(p,48)}<div><div class="name">${esc(p.name)}, ${p.age}</div><div class="meta">${esc(p.district)}</div></div></div>
          ${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}
          ${p.intro_voice?`<div class="cardvoice">${vn(p.intro_voice,p.intro_secs,p.intro_peaks,false,'card')}</div>`:''}
        </div>
      </div>
    </div>
    <div class="actions">
      <div><button class="round" data-a="pass" type="button" aria-label="Pasar">${I('x')}</button><small>Pasar</small></div>
      <button class="btn btn-primary" data-a="invite" type="button">${I('glass')} Invitar un trago</button>
      <div><button class="round ${waterOK()?'':'off'}" data-a="water" type="button" aria-label="Enviar Cool Water gratis"><img src="${img('water')}" alt="">${waterOK()?'<span class="badge">1</span>':''}</button><small>${waterOK()?'Gratis hoy':'Vuelve mañana'}</small></div>
    </div>
    <div style="height:18px"></div>
  </div>${tabsbar('personas')}`);},

person:()=>{const p=S.target;const d=DR[sig(p.style)];return `<section class="screen" style="--glow:${d.c}">
  <div class="scroll">
    <div class="phero"><img src="${img(sig(p.style))}" alt="${d.n}">
      <div class="floating"><button class="iconbtn glass" data-a="back" aria-label="Volver" type="button">${I('back')}</button></div>
      <div class="floating r"><button class="iconbtn glass" data-a="sheet" data-v="safety" aria-label="Más opciones" type="button">${I('dots')}</button></div>
    </div>
    <div class="pad" style="margin-top:-70px;position:relative">
      ${veilAv(p,72)}
      <h1 class="display" style="margin-top:14px">${esc(p.name)}, ${p.age}</h1>
      <div class="small muted" style="margin-top:6px">${esc(p.district)} · Estilo ${esc(p.style)}</div>
      <div class="small" style="margin-top:14px;color:var(--muted)">Su trago firma: <b style="color:var(--fg);font-weight:500">${d.n}</b></div>
      ${p.bio?`<p style="margin:14px 0 0;color:#D9E3DD;font-size:var(--t-lead)">${esc(p.bio)}</p>`:''}
      ${p.intro_voice?`<div class="sec"><span class="eyebrow">Escucha su voz</span>${vn(p.intro_voice,p.intro_secs,p.intro_peaks,false,'person')}</div>`:''}
      <div style="height:20px"></div>
    </div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="invite" type="button">${I('glass')} Invitar un trago a ${first(p.name)}</button></div></section>`;},

pick:()=>{const p=S.target;const sel=S.pick?DR[S.pick]:null;const c=sel?sel.c:DR[sig(p.style)].c;
  const mine=Object.entries(S.me.inv||{}).filter(([,n])=>n>0).map(([k])=>k);const list=[...mine,...(waterOK()?['water']:[])];
  const card=k=>{const d=DR[k];const n=k==='water'?1:S.me.inv[k];const on=S.pick===k;
    return `<button type="button" class="dcard ${on?'on':''}" style="--c:${d.c}" data-a="pick" data-v="${k}" aria-pressed="${on}"><div class="im"><img src="${img(k)}" alt="">${tier(d.tier)}${n>1?`<span class="cnt">x${n}</span>`:''}</div><div class="tx"><b>${d.n}</b><div class="tg">${d.t}</div><div class="pr">${k==='water'?'Gratis hoy · sin voz':'En tu barra'}</div></div></button>`;};
  if(!list.length)return shell('',c,`${topbar('Para '+first(p.name))}<div class="scroll pad"><div class="empty" style="padding-top:80px"><div class="h2">Tu barra está vacía por hoy</div>Mañana vuelve tu Cool Water, y cada 3 brindis la casa invita uno.</div></div>
    <div class="foot pad"><button class="btn btn-primary" data-a="tab" data-v="personas" type="button">Volver a Descubrir</button></div>`);
  return shell('',c,`${topbar('Para '+first(p.name))}
  <div class="scroll pad">
    <h1 class="h2">Elige el trago que <em>habla por ti</em></h1>
    <div class="sec"><span class="eyebrow">En tu barra</span><div class="grid2">${list.map(card).join('')}</div></div>
    <div style="height:16px"></div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="pick-next" type="button" ${sel?'':'disabled'}>${sel?'Continuar con '+sel.n:'Elige un trago'}</button></div>`);},

record:()=>{const p=S.target;const d=DR[S.pick];const v=S.voice;const has=v&&v.blob;
  return shell('',d.c,`${topbar('Tu brindis')}
  <div class="scroll pad" style="text-align:center">
    <div class="recdrink"><img src="${img(S.pick)}" alt="${d.n}">${tier(d.tier)}</div>
    <h1 class="h2" style="margin-top:28px">Acompaña tu <em>${d.n}</em> con tu voz</h1>
    <p class="small muted" style="margin:8px auto 0;max-width:30ch">${first(p.name)} lo escuchará antes de ver tu foto. Hasta ${MAXV} segundos.</p>
    ${!has&&S.tpl!=null?`<div class="script"><span class="eyebrow">Léelo tal cual o a tu manera</span>${esc(TPL(p,d)[S.tpl])}</div>`:''}
    <div style="margin-top:18px">${voiceBlock('inv',v,d.c)}</div>
    ${!v?`<div class="ideas">${['Por qué este trago','Algo de su perfil','Un plan simple'].map((t,i)=>`<button type="button" class="chip ${S.tpl===i?'on':''}" data-a="tpl" data-v="${i}">${t}</button>`).join('')}</div><p class="small dim" style="margin-top:12px">Puedes grabarlo las veces que quieras antes de enviarlo.</p>`:''}
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="send" data-v="voice" type="button" ${has&&!S.busy?'':'disabled'}>${S.busy?'Sirviendo…':'Enviar invitación'}</button><button class="btn btn-ghost" data-a="send" data-v="novoice" type="button" ${S.busy||(v&&v.on)?'disabled':''}>Enviar sin brindis</button></div>`);},

sent:()=>{const p=S.target;const d=DR[S.sentDrink];return shell('',d.c,`<div class="scroll pad" style="text-align:center">
    <div class="rings"><img src="${img(S.sentDrink)}" alt="${d.n}"></div>
    <h1 class="display" style="margin-top:24px;font-size:34px">Tu ${d.n}<br><em>va en camino</em></h1>
    <p class="lead" style="margin:12px auto 0">${first(p.name)} tiene 48 horas para brindar. Si no, el trago vuelve a tu barra.</p>
    <div class="card statusrow sentrow">${ice(new Date().toISOString())}<span class="pill go num">${invCount()} en tu barra</span></div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="tab" data-v="personas" type="button">Seguir descubriendo</button><button class="btn btn-ghost" data-a="go-act" data-v="enviadas" type="button">Ver mis invitaciones</button></div>`);},

actividad:()=>{const t=S.act;let body='';const goDisc=`<button class="btn btn-primary" data-a="tab" data-v="personas" type="button" style="margin-top:20px">Descubrir personas</button>`;
  if(t==='recibidas'){body=S.recv.length?S.recv.map(r=>{const d=DR[r.drink];const f=S.people[r.from_id]||{};return `<article class="card rcard" data-inv="${r.id}"><img src="${img(r.drink)}" alt="${d.n}"><div style="min-width:0">
      <div class="head">${ice(r.created_at)}<span class="hr">${tier(d.tier)}<button type="button" class="iconbtn sm" data-a="sheet" data-v="safety-inv" data-id="${r.from_id}" aria-label="Más opciones">${I('dots','s')}</button></span></div>
      <div class="what">Alguien te invitó un <b>${d.n}</b></div>
      <div class="hint">${f.age?f.age+' años · ':''}${esc(f.district||'')}</div>
      ${r.drink==='water'?'<div class="hint" style="margin-top:10px">Te dejó un Cool Water: le interesas.</div>':vn(r.voice,r.voice_secs,r.voice_peaks,false,'recibidas')}
    </div>
    <div class="acts"><button class="btn btn-glass btn-sm" style="width:100%" data-a="decline" data-v="${r.id}" type="button">Ahora no</button><button class="btn btn-primary btn-sm" style="width:100%" data-a="accept" data-v="${r.id}" type="button">${I('glass','s')} Brindar</button></div></article>`;}).join('')
    :`<div class="empty"><div class="h2">Tu barra está tranquila</div>Todavía nadie se acerca a tu barra. Quien invita primero, recibe.${goDisc}</div>`;}
  if(t==='enviadas'){body=S.sent.length?`<div class="card" style="padding:4px 16px;margin-top:14px">${S.sent.map(s=>{const d=DR[s.drink];const p=S.people[s.to_id]||{};const m=s.status==='accepted'&&S.matches.find(x=>x.invite_id===s.id&&!x.closed);
      const st=s.status==='pending'?`<span class="sstate ${hoursLeft(s.created_at)<=12?'low':''}">En camino · se enfría en ${hrs(hoursLeft(s.created_at))}</span>`:s.status==='accepted'?`<span class="sstate go">¡Salud!${m?' · abrir chat':''}</span>`:`<span class="sstate">Volvió a tu barra</span>`;
      return `<button type="button" class="row" ${m?`data-a="open-chat" data-v="${m.id}"`:''}><img class="th" src="${img(s.drink)}" alt=""><div class="grow"><b>Para ${first(p.name||'')}</b>${st}</div></button>`;}).join('')}</div>${S.sent.some(s=>s.status==='pending')?`<div class="note" style="margin-top:14px">${I('return')}<span>Si no brindan en 48 horas, el trago regresa solo a tu barra.</span></div>`:''}`
    :`<div class="empty"><div class="h2">Aún no invitas a nadie</div>Tienes ${invCount()} ${invCount()===1?'trago':'tragos'} esperando.${goDisc}</div>`;}
  if(t==='chats'){const ms=S.matches.filter(m=>!m.closed);body=ms.length?`<div class="card" style="padding:4px 16px;margin-top:14px">${ms.map(m=>{const pid=peerOf(m);const p=S.people[pid]||{};const l=lastOf(m);const lt=!l?'Brindaron con '+DR[m.drink].n:l.voice?`Nota de voz · 0:${String(l.voice_secs||0).padStart(2,'0')}`:l.body;
      return `<button type="button" class="row" data-a="open-chat" data-v="${m.id}">${photoAv((S.photos[pid]||[])[0],p,46)}<div class="grow"><b>${first(p.name)}</b><span>${esc(lt)}</span></div>${unread(m)?'<span class="udot" aria-label="Sin leer"></span>':''}</button>`;}).join('')}</div>`
    :`<div class="empty"><div class="h2">Aquí aparecen tus brindis</div></div>`;}
  const cnt={recibidas:S.recv.length,chats:S.matches.filter(unread).length};
  return shell('','#86E3AE',`<div class="pad" style="padding-top:8px"><h1 class="display" style="font-size:34px">Actividad</h1>
   <div class="seg" role="tablist">${[['recibidas','Recibidas'],['enviadas','Enviadas'],['chats','Chats']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${t===k}" class="${t===k?'on':''}" data-a="act" data-v="${k}">${l}${cnt[k]?` <span class="segn">${cnt[k]}</span>`:''}</button>`).join('')}</div></div>
   <div class="scroll pad">${body}<div style="height:20px"></div></div>${tabsbar('actividad')}`);},

salud:()=>{const s=S.salud;const d=DR[s.drink];const p=S.people[s.peer]||{};const ph=(S.photos[s.peer]||[])[0];
  const line=s.role==='sender'?`${first(p.name)} aceptó tu ${d.n}.`:s.crossed?`${first(p.name)} ya te había invitado un ${d.n}.`:`Aceptaste el ${d.n} de ${first(p.name)}.`;
  return shell('saludscr',d.c,`<div class="scroll pad" style="text-align:center">
    <div class="clink sm"><img src="${img(s.drink)}" alt="${d.n}"><img src="${img(sig(S.me.style))}" alt=""><span class="ring"></span></div>
    <h1 class="salud" aria-label="¡Salud!">${[...'¡Salud!'].map((ch,i)=>`<span style="--i:${i}">${ch}</span>`).join('')}</h1>
    <div class="revealph" style="--c:${d.c}">${p.veil?`<img class="vl" src="${esc(p.veil)}" alt="">`:''}${ph?`<img class="rp" id="rp" src="${esc(ph)}" alt="Foto de ${esc(p.name)}">`:''}</div>
    <div class="rname"><div class="h2" style="font-size:var(--t-head-l)">${esc(p.name)}, ${p.age||''}</div><div class="small muted">${esc(p.district||'')} · Estilo ${esc(p.style||'')}</div>
    <p class="small muted" style="margin:10px 0 0">${line}</p>
    ${s.gift?`<div class="reward">${I('gift')}<span>La casa invita: un ${DR[s.gift].n} llegó a tu barra.</span></div>`:s.role==='sender'&&courtesy()?`<p class="small dim num" style="margin:8px 0 0">${courtesy()===2?'Un brindis más y la casa invita.':'Dos brindis más y la casa invita.'}</p>`:''}</div>
  </div>
  <div class="foot pad"><button class="btn btn-primary" data-a="open-chat" data-v="${s.match}" data-rec="1" type="button">${I('mic')} Responder con tu voz</button><button class="btn btn-ghost" data-a="salud-later" type="button">Después</button></div>`);},

chat:()=>{const m=S.matches.find(x=>x.id===S.chat);if(!m)return V.actividad();const pid=peerOf(m);const p=S.people[pid]||{};const d=DR[m.drink];const list=S.msgs[m.id]||[];const ph=(S.photos[pid]||[])[0];
  return shell('',d.c,`<div class="chathead pad"><button class="iconbtn" data-a="back" aria-label="Volver" type="button">${I('back')}</button><button type="button" class="avbtn" data-a="sheet" data-v="photo" aria-label="Ver foto">${photoAv(ph,p,40)}</button><div class="grow"><b>${esc(first(p.name))}${p.age?', '+p.age:''}</b><span>${esc(p.district||'')}</span></div>
    <button class="iconbtn glass" data-a="sheet" data-v="chatmenu" type="button" aria-label="Más opciones">${I('dots')}</button></div>
  <div class="scroll pad"><div class="msgs" id="msgs">
    <div class="sys">Brindaron con ${d.n}</div>
    ${list.map(msg).join('')}
    ${m.closed?'<div class="sys">Este brindis terminó</div>':''}
  </div></div>
  ${m.closed?'':`<div class="composer pad" id="composer">${composer()}</div>`}`);},

bar:()=>{const t=S.barTab;let body='';
  if(t==='carta'){const card=k=>{const d=DR[k];const have=(S.me.inv||{})[k];return `<button type="button" class="dcard" style="--c:${d.c}" data-a="want" data-v="${k}"><div class="im"><img src="${img(k)}" alt="" loading="lazy">${tier(d.tier)}${have>1?`<span class="cnt">x${have}</span>`:''}</div><div class="tx"><b>${d.n}</b><div class="tg">${d.t}</div><div class="pr">${have?'En tu barra':money(PRICE[d.tier])}</div></div></button>`;};
    body=Object.keys(STY).map(sk=>{const sy=STY[sk];const ks=Object.keys(DR).filter(k=>DR[k].s===sk).sort((a,b)=>DR[a].tier-DR[b].tier);return `<div class="sec"><div class="stylehead" style="--c:${sy.c}"><img src="${img(sy.img)}" alt=""><div style="flex:1;min-width:0"><b>${sk}</b><span>${sy.d}</span></div></div><div class="hscroll">${ks.map(card).join('')}</div></div>`;}).join('')
    +`<div class="card water" style="margin-top:24px"><img src="${img('water')}" alt=""><div style="flex:1"><b class="h3" style="font-size:var(--t-body)">Cool Water</b><div class="small muted">Gratis, uno al día. Dice “me interesas” sin voz.</div></div>${tier(0)}</div>`;}
  else{const avail=Object.entries(S.me.inv||{}).filter(([,n])=>n>0);
    body=`${avail.length?`<div class="grid2" style="margin-top:18px">${avail.map(([k,n])=>{const d=DR[k];return `<div class="dcard" style="--c:${d.c}"><div class="im"><img src="${img(k)}" alt="">${tier(d.tier)}${n>1?`<span class="cnt">x${n}</span>`:''}</div><div class="tx"><b>${d.n}</b><div class="tg">${d.t}</div></div></div>`;}).join('')}</div>`:`<div class="empty" style="padding:28px 10px"><div class="h2">Tu barra descansa</div>Tus tragos en camino vuelven si no los aceptan en 48 horas.</div>`}
    <div class="card water" style="margin-top:16px"><img src="${img('water')}" alt=""><div style="flex:1"><b class="h3" style="font-size:var(--t-body)">Cool Water</b><div class="small muted">${waterOK()?'Disponible hoy':'Vuelve mañana'}</div></div>${tier(0)}</div>
    <p class="small muted" style="text-align:center;margin-top:18px">Cada 3 brindis, la casa invita uno.</p>`;}
  return shell('','#E6C27A',`<div class="pad" style="padding-top:8px;display:flex;justify-content:space-between;align-items:center"><h1 class="display neonsign" style="font-size:38px">El Bar</h1><span class="barchip" role="img" aria-label="${barAria()}">${cring()}<span class="bn">${invCount()}</span></span></div>
  <div class="pad"><div class="seg">${[['carta','Carta'],['barra','Mi barra']].map(([k,l])=>`<button type="button" class="${t===k?'on':''}" data-a="bartab" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="scroll pad">${body}<div style="height:22px"></div></div>${tabsbar('bar')}`);},

perfil:()=>{const u=S.me;const s=STY[u.style]||STY.Mystery;const ph=S.myPhoto?.url;return shell('',s.c,`<div class="scroll pad" style="padding-top:16px">
    <div class="me-top">
      <button type="button" class="mecard" data-a="edit-foto" aria-label="Cambiar foto">${ph?`<img src="${esc(ph)}" alt="Tu foto">`:''}<span class="chg">${I('camera','s')}</span></button>
      <div class="me-info"><h1 class="display" style="font-size:30px">${esc(u.name)}, ${ageOf(u.birth)}</h1><div class="small muted" style="margin-top:6px">${esc(u.district)} · <button type="button" class="inlink" data-a="edit-style">Estilo ${esc(u.style)}</button></div>
        <p class="small dim" style="margin-top:10px">Solo la ven quienes brindan contigo</p></div>
    </div>
    <button type="button" class="card mebio" data-a="sheet" data-v="bio">${u.bio?`“${esc(u.bio)}”`:'<span class="muted">Escribe tu frase</span>'}${I('edit','s')}</button>
    <div class="sec"><span class="eyebrow">Tu brindis de presentación</span><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${u.intro_voice?vn(u.intro_voice,u.intro_secs,u.intro_peaks,true,'perfil'):''}<button class="chip" type="button" data-a="edit-intro">${u.intro_voice?'Grabar otro':'Grabar mi brindis'}</button></div></div>
    <div class="sec card list">
      ${[['shield','Términos y privacidad','sheet:terms'],['out','Cerrar sesión','logout'],['x','Eliminar mi cuenta','sheet:delete']].filter(Boolean).map(([ic,l,a])=>`<button type="button" class="row" data-a="row" data-v="${a}">${I(ic)}<span class="grow"><b style="font-weight:500">${l}</b></span><svg class="i chev" aria-hidden="true"><use href="#i-chev"/></svg></button>`).join('')}
    </div>
    <p class="small dim" style="text-align:center;margin-top:18px">Martini beta · Lima</p>
    <div style="height:20px"></div>
  </div>${tabsbar('perfil')}`);}
};

function voiceBlock(key,v,c){const max=key==='intro'||key==='inv'?MAXV:MAXC;
  if(v&&v.on)return `${liveBars(c)}<div class="num muted rect" id="rect" style="margin-top:6px">0:00 / 0:${max}</div>
    <button class="recbtn on" data-a="rec" data-v="${key}" type="button" aria-label="Detener"><span class="sq"></span></button><div class="small dim" style="margin-top:10px">Toca para detener</div>`;
  if(v&&(v.blob||v.path))return `<div class="recdone">${vn(v.url||v.path,v.secs,v.peaks,true,'preview')}<button class="chip" type="button" data-a="rec-again" data-v="${key}">Grabar otra vez</button></div>`;
  return `<button class="recbtn" data-a="rec" data-v="${key}" type="button" aria-label="Grabar">${I('mic')}</button><div class="small dim" style="margin-top:10px">Toca para grabar</div>`;}

function msg(m){const me=m.sender===uid();const f=me?'me':'them';const st=m.pending?' sending':m.failed?' failed':'';
  if(m.voice)return `<div class="m ${f}${st}" ${m.failed?`data-a="retry" data-v="${m.id}"`:''}>${vn(m.voice,m.voice_secs,m.voice_peaks,me,'chat')}${m.failed?'<span class="mfail">No se envió. Toca para reintentar.</span>':''}</div>`;
  return `<div class="m ${f}${st}" ${m.failed?`data-a="retry" data-v="${m.id}"`:''}><div class="txt">${esc(m.body)}</div>${m.failed?'<span class="mfail">No se envió. Toca para reintentar.</span>':''}</div>`;}
function composer(){const r=S.cmic;return r?`<div class="recline"><i class="d"></i><span id="cmt" class="num">0:00</span><span class="livemini" id="live">${Array.from({length:28},()=>'<i></i>').join('')}</span></div><button class="iconbtn" data-a="cmic-x" type="button" aria-label="Cancelar">${I('x')}</button><button class="mic on" data-a="cmic" type="button" aria-label="Enviar nota de voz">${I('send','s')}</button>`:
  `<form class="field" data-form="txt" style="padding-right:6px"><input id="ctext" placeholder="Escribe o graba tu voz" autocomplete="off" aria-label="Mensaje" maxlength="500" enterkeyhint="send"><button type="submit" class="iconbtn" style="width:34px;height:34px" aria-label="Enviar">${I('send','s')}</button></form><button class="mic" data-a="cmic" type="button" aria-label="Grabar nota de voz">${I('mic')}</button>`;}

/* ================= HOJAS ================= */
const sheet=(label,inner)=>`<div class="scrim" data-a="close-sheet"></div><div class="sheet pad" role="dialog" aria-label="${label}"><div class="grab"></div>${inner}</div>`;
const cancel=(l='Cancelar')=>`<button class="btn btn-ghost" data-a="close-sheet" type="button">${l}</button>`;
const SHEETS={
  safety:()=>{const p=S.sheet.p||{};return sheet('Opciones',`<div class="foot" style="padding-inline:0"><button class="btn btn-glass" data-a="block" data-v="${p.id}" type="button">${I('lock','s')} Bloquear a ${first(p.name||'esta persona')}</button><button class="btn btn-glass" data-a="report" data-v="${p.id}" type="button">${I('flag','s')} Reportar</button>${cancel()}</div>`);},
  report:()=>sheet('Reportar',`<div class="h2" style="font-size:var(--t-head-l)">¿Qué pasó?</div><p class="small muted" style="margin:6px 0 14px">Nadie se entera de que reportaste.</p>
    <div class="stack">${['Me incomoda','Perfil falso','Pide o ofrece dinero','Otro'].map(r=>`<button type="button" class="btn btn-glass" data-a="report-go" data-v="${r}">${r}</button>`).join('')}</div><div class="foot" style="padding-inline:0">${cancel()}</div>`),
  chatmenu:()=>{const m=S.matches.find(x=>x.id===S.chat);const p=S.people[peerOf(m)]||{};return sheet('Opciones',`<div class="foot" style="padding-inline:0"><button class="btn btn-glass" data-a="bye" type="button">Terminar el brindis</button><button class="btn btn-glass" data-a="block" data-v="${p.id}" type="button">${I('lock','s')} Bloquear a ${first(p.name)}</button><button class="btn btn-glass" data-a="report" data-v="${p.id}" type="button">${I('flag','s')} Reportar</button>${cancel()}</div>`);},
  bye:()=>sheet('Despedida',`<div class="h2" style="font-size:var(--t-head-l)">Despedirte con elegancia</div><p class="small muted" style="margin:8px 0 14px">No pasa nada si no sentiste química. Le llegará este mensaje y el brindis se cierra. Sin penalidad para nadie.</p><div class="card" style="padding:14px 16px">“Gracias por el brindis, me alegró conocerte. Esta vez prefiero no seguir. ¡Salud!”</div><div class="foot" style="padding-inline:0"><button class="btn btn-primary" data-a="bye-go" type="button">Enviar y despedirme</button>${cancel('Mejor sigo la conversación')}</div>`),
  photo:()=>{const m=S.matches.find(x=>x.id===S.chat);const pid=peerOf(m);const ph=(S.photos[pid]||[])[0];return `<div class="scrim dark" data-a="close-sheet"></div><button type="button" class="bigphoto" data-a="close-sheet" aria-label="Cerrar">${ph?`<img src="${esc(ph)}" alt="">`:''}</button>`;},
  want:()=>{const k=S.sheet.v,d=DR[k];return sheet('Llega pronto',`<div style="display:flex;gap:14px;align-items:center"><img src="${img(k)}" alt="" style="width:64px;height:80px;object-fit:cover;border-radius:var(--r-md)"><div><div class="h2" style="font-size:var(--t-head-l)">${d.n}</div><div class="small muted">${money(PRICE[d.tier])}</div></div></div>
    <p class="small muted" style="margin:16px 0 0">Llega pronto a la barra. Estamos afinando la carta.</p><div class="foot" style="padding-inline:0">${cancel('Entendido')}</div>`);},
  terms:()=>sheet('Términos y privacidad',`<div class="h2" style="font-size:var(--t-head-l)">Términos y privacidad</div><p class="small muted" style="margin:10px 0 0;line-height:1.6">${esc(TXT.terms)}</p><div class="foot" style="padding-inline:0">${cancel('Entendido')}</div>`),
  bio:()=>sheet('Tu frase',`<div class="h2" style="font-size:var(--t-head-l)">Tu frase</div><div class="field area" style="margin-top:14px"><textarea id="biof" maxlength="120" rows="3" placeholder="Algo que dirías en la barra…">${esc(S.me.bio||'')}</textarea></div><div class="foot" style="padding-inline:0"><button class="btn btn-primary" data-a="save-bio" type="button">Guardar</button>${cancel()}</div>`),
  delete:()=>sheet('Eliminar cuenta',`<div class="h2" style="font-size:var(--t-head-l)">¿Eliminar tu cuenta?</div><p class="small muted" style="margin:8px 0 0">Se borran tu perfil, tus tragos y tus chats. No se puede deshacer.</p><div class="foot" style="padding-inline:0"><button class="btn btn-glass danger" data-a="delete-go" type="button">Eliminar</button>${cancel('Me quedo')}</div>`),
  install:()=>sheet('Instalar',`<div class="h2" style="font-size:var(--t-head-l)">Ten la barra a un toque</div>
    <div class="card howto" style="margin-top:14px">${isIOS?`<div>${I('share')}<span>En Safari, toca <b>Compartir</b>.</span></div><div>${I('plus')}<span>Elige <b>Agregar a inicio</b>.</span></div>`:`<div>${I('dots')}<span>Abre el menú del navegador.</span></div><div>${I('plus')}<span>Toca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</span></div>`}</div>
    <div class="foot" style="padding-inline:0">${S.installEvt?`<button class="btn btn-primary" data-a="install-go" type="button">Instalar</button>`:''}${cancel('Entendido')}</div>`)
};

/* ================= DATOS ================= */
async function loadMe(){const {data,error}=await sb.from('profiles').select('*').eq('id',uid()).maybeSingle();if(error)throw error;S.me=data;return data;}
async function loadMyPhoto(){const {data}=await sb.from('photos').select('path').eq('owner',uid()).order('pos').limit(1);const p=data&&data[0]&&data[0].path;S.myPhoto=p?{path:p,url:(await signed('photos',[p]))[0]}:null;}
async function loadPeople(ids,force){ids=[...new Set(ids)].filter(i=>i&&(force||!S.people[i]));if(!ids.length)return;const {data}=await sb.rpc('people',{p_ids:ids});(data||[]).forEach(p=>{S.people[p.id]=p;});}
async function loadPhotosOf(ids){ids=[...new Set(ids)].filter(Boolean);if(!ids.length)return;const {data}=await sb.from('photos').select('owner,path,pos').in('owner',ids).order('pos');const by={};(data||[]).forEach(r=>(by[r.owner]=by[r.owner]||[]).push(r.path));
  await Promise.all(ids.map(async id=>{S.photos[id]=await signed('photos',by[id]||[]);}));}
async function loadDeck(){const {data,error}=await sb.rpc('discover');if(error)throw error;const seen=LS.get('seen',[]);
  S.deck=(data||[]).map((p,i)=>({p,i,s:seen.indexOf(p.id)})).sort((a,b)=>(a.s-b.s)||(a.i-b.i)).map(x=>x.p);S.di=0;S.looped=false;signed('voice',S.deck.map(p=>p.intro_voice));}
async function loadInvites(){const [r,s]=await Promise.all([
  sb.from('invites').select('*').eq('to_id',uid()).eq('status','pending').order('created_at',{ascending:false}),
  sb.from('invites').select('*').eq('from_id',uid()).order('created_at',{ascending:false}).limit(60)]);
  S.recv=(r.data||[]).filter(x=>hoursLeft(x.created_at)>0);S.sent=s.data||[];
  await loadPeople([...S.recv.map(x=>x.from_id),...S.sent.map(x=>x.to_id)]);signed('voice',S.recv.map(x=>x.voice));
  const back=LS.get('back',[]);const ret=S.sent.filter(x=>x.status==='expired'&&x.drink!=='water'&&!back.includes(x.id));
  if(ret.length){LS.set('back',[...back,...ret.map(x=>x.id)].slice(-200));if(back.length||LS.get('backInit',false))setTimeout(()=>toast(`Tu ${DR[ret[0].drink].n} volvió a tu barra.`,'return'),900);}LS.set('backInit',true);}
async function loadMatches(){const {data}=await sb.from('matches').select('*').or(`a.eq.${uid()},b.eq.${uid()}`).order('created_at',{ascending:false});S.matches=data||[];
  const ids=S.matches.map(peerOf);await Promise.all([loadPeople(ids),loadPhotosOf(S.matches.filter(m=>!m.closed).map(peerOf))]);
  if(S.matches.length){const {data:ls}=await sb.from('messages').select('match_id,sender,body,voice,voice_secs,created_at').in('match_id',S.matches.map(m=>m.id)).order('created_at',{ascending:false}).limit(300);
    (ls||[]).forEach(l=>{const m=S.matches.find(x=>x.id===l.match_id);if(m&&!m.last)m.last=l;});
    S.matches.sort((a,b)=>((b.last||b).created_at).localeCompare((a.last||a).created_at));}
  // ¡Salud! pendientes para quien invitó (al abrir la app, uno tras otro)
  const seen=LS.get('salud',[]);S.saludQ=S.matches.filter(m=>m.a===uid()&&!m.closed&&!seen.includes(m.id)&&(Date.now()-new Date(m.created_at))<3*864e5).map(m=>m.id);}
async function loadAll(){await sb.rpc('expire_invites');await Promise.all([loadMe(),loadDeck(),loadInvites(),loadMatches(),loadMyPhoto()]);
  sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',uid()).then(()=>{});}
async function loadChat(id){const {data}=await sb.from('messages').select('*').eq('match_id',id).order('created_at').limit(500);S.msgs[id]=data||[];await signed('voice',S.msgs[id].map(m=>m.voice));}

function showSalud(mid,extra={}){const m=S.matches.find(x=>x.id===mid);if(!m)return;const role=m.a===uid()?'sender':'receiver';
  S.salud={drink:m.drink,peer:peerOf(m),match:m.id,role,crossed:m.crossed&&role==='receiver',gift:role==='sender'?m.gift:null,...extra};
  LS.set('salud',[...LS.get('salud',[]),m.id].slice(-300));S.saludQ=S.saludQ.filter(x=>x!==m.id);
  const ph=(S.photos[S.salud.peer]||[])[0];preload([ph]).then(()=>{});track('salud_seen',{role});
  S.stack=S.screen==='salud'?S.stack:[...S.stack,S.screen].filter(x=>!['sent','record','pick','person','salud'].includes(x));S.screen='salud';S.sheet=null;render('fade');clink();}
function nextSalud(){if(S.saludQ.length){showSalud(S.saludQ[0]);return true;}return false;}

let channel=null;
function subscribe(){if(channel)sb.removeChannel(channel);
  channel=sb.channel('me-'+uid())
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'invites',filter:`to_id=eq.${uid()}`},async({new:r})=>{await loadPeople([r.from_id]);if(r.voice)signed('voice',[r.voice]);S.recv=[r,...S.recv.filter(x=>x.id!==r.id)];banner('Martini','Alguien quiere brindar contigo','go-act','recibidas');if(live.includes(S.screen))rerender();})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'matches',filter:`a=eq.${uid()}`},async({new:m})=>{if(S.matches.some(x=>x.id===m.id))return;S.matches.unshift(m);const pid=peerOf(m);await Promise.all([loadPeople([pid]),loadPhotosOf([pid]),loadMe()]);const s=S.sent.find(x=>x.id===m.invite_id);if(s)s.status='accepted';
    if(['record','pick','sent','salud'].includes(S.screen)||S.busy){S.saludQ.push(m.id);const p=S.people[pid]||{};banner('¡Salud!',`${first(p.name)} aceptó tu ${DR[m.drink].n}`,'open-salud',m.id);}else showSalud(m.id);})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},async({new:x})=>{const m=S.matches.find(y=>y.id===x.match_id);if(!m)return;
    if(x.voice)await signed('voice',[x.voice]);
    const l=S.msgs[x.match_id];if(l){if(l.some(y=>y.id===x.id))return;const tmp=l.findIndex(y=>y.pending&&y.sender===x.sender&&(y.body||null)===(x.body||null)&&!!y.voice===!!x.voice);if(tmp>=0&&x.sender===uid())return;l.push(x);}m.last=x;
    if(S.screen==='chat'&&S.chat===x.match_id){markRead(x.match_id);appendMsgs();if(x.sender!==uid())hap(8);}
    else if(x.sender!==uid()){const p=S.people[x.sender]||{};banner(first(p.name)||'Martini',x.voice?'Te envió una nota de voz':x.body,'open-chat',x.match_id);if(live.includes(S.screen))rerender();}})
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'matches'},({new:m})=>{const o=S.matches.find(y=>y.id===m.id);if(o){o.closed=m.closed;if(S.screen==='chat'&&S.chat===m.id)rerender();}})
  .subscribe();}
const scrollChat=()=>{const s=$app.querySelector('.screen:not(.ghost) .scroll');if(s)s.scrollTop=s.scrollHeight;};
function appendMsgs(){const box=document.getElementById('msgs');if(!box){rerender();return;}const had=box.querySelectorAll('.m').length;const m=S.matches.find(x=>x.id===S.chat);box.innerHTML=`<div class="sys">Brindaron con ${DR[m.drink].n}</div>${(S.msgs[S.chat]||[]).map(msg).join('')}${m.closed?'<div class="sys">Este brindis terminó</div>':''}`;const ms=box.querySelectorAll('.m');if(ms.length>had&&!calm())ms[ms.length-1].classList.add('new');scrollChat();}

/* ================= ACCIONES ================= */
const draft=()=>({name:'',birth:'',district:'',gender:'',interest:'',style:'Mystery',bio:'',photo:null,intro:null});
async function startRec(key){const c=key==='inv'?DR[S.pick].c:'#86E3AE';
  const set=v=>{if(key==='inv')S.voice=v;else S.D.intro=v;};set({on:true});rerender();
  const ok=await recStart(MAXV,(t,s)=>paintLive(t,s,MAXV),()=>A.rec(key));
  if(!ok){set(null);rerender();}}
async function finishRec(key){const r=await recStop();if(key==='inv')S.voice=r;else S.D.intro=r;rerender();}
const removeFromDeck=id=>{const i=S.deck.findIndex(x=>x.id===id);if(i<0)return;S.deck.splice(i,1);if(S.di>i)S.di--;if(S.deck.length)S.di=S.di%S.deck.length;else S.di=0;};

const A={
  back:()=>back(),
  tab:v=>tab(v),
  'to-onb':()=>{S.ob=0;go('onboarding',false);},
  'ob-next':()=>{if(S.ob<OB.length-1){S.ob++;rerender();}else{S.auth='signup';S.authStep=S.code?'account':'code';go('auth');}},
  'ob-go':v=>{S.ob=+v;rerender();},
  auth:v=>{S.auth=v;if(v==='signup')S.authStep=S.code?'account':'code';if(S.screen==='auth')rerender();else go('auth');},
  eye:(v,el)=>{const i=el.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password';},
  setd:(v,el)=>{S.D[el.dataset.k]=v;rerender();},
  'about-next':()=>{const D=S.D;if(!D.name.trim())return toast('Escribe tu nombre','user');if(!D.birth)return toast('Elige tu fecha de nacimiento','cal');if(ageOf(D.birth)<18)return toast('Martini es solo para mayores de 18. Te esperamos más adelante.','lock');if(!D.district)return toast('Elige tu distrito','pin');go('conocer');},
  'conocer-next':()=>go('style'),
  next:v=>go(v),
  'foto-next':()=>{if(moneyTalk(S.D.bio))return toast(TXT.money,'shield');go('brindis');},
  rec:async v=>{const cur=v==='inv'?S.voice:S.D.intro;if(cur&&cur.on)await finishRec(v);else await startRec(v);},
  'rec-again':v=>{if(player)player.pause();if(v==='inv')S.voice=null;else S.D.intro=null;rerender();},
  tpl:v=>{S.tpl=S.tpl===+v?null:+v;rerender();},
  finish:async v=>{const D=S.D;if(S.busy)return;if(v==='skip')D.intro=null;S.busy=true;rerender();
    try{const {error}=await sb.from('profiles').insert({id:uid(),name:D.name.trim(),birth:D.birth,gender:D.gender,interest:D.interest,district:D.district,style:D.style,bio:D.bio.trim(),veil:D.photo.veil,code_used:S.code});
      if(error)throw error;track('signup_done');
      const path=await upload('photos',D.photo.blob,'jpg');const {error:pe}=await sb.from('photos').insert({owner:uid(),path,pos:0});if(pe)throw pe;URLS.set('photos'+path,D.photo.url);
      if(D.intro&&D.intro.blob){const vp=await upload('voice',D.intro.blob,D.intro.ext);URLS.set('voice'+vp,D.intro.url);await sb.from('profiles').update({intro_voice:vp,intro_secs:D.intro.secs,intro_peaks:D.intro.peaks}).eq('id',uid());}
      track('profile_done',{has_voice:!!(D.intro&&D.intro.blob)});sessionStorage.removeItem('martini-code');
      await loadAll();subscribe();S.busy=false;S.stack=[];S.D=null;go('gift',false);
    }catch(e){S.busy=false;rerender();err(e);}},
  'edit-foto':()=>{S.editing='foto';S.D={...draft(),bio:S.me.bio||'',photo:S.myPhoto?{...S.myPhoto}:null};go('foto');},
  'edit-style':()=>{S.editing='style';S.D={...draft(),style:S.me.style};go('style');},
  'edit-intro':()=>{S.editing='intro';S.D={...draft(),intro:null};go('brindis');},
  'save-foto':async()=>{const D=S.D;if(S.busy||!D.photo)return;if(moneyTalk(D.bio))return toast(TXT.money,'shield');S.busy=true;rerender();
    try{const upd={bio:D.bio.trim()};if(D.photo.blob){const path=await upload('photos',D.photo.blob,'jpg');URLS.set('photos'+path,D.photo.url);const old=S.myPhoto&&S.myPhoto.path;
        await sb.from('photos').insert({owner:uid(),path,pos:0});if(old){await sb.from('photos').delete().eq('path',old);sb.storage.from('photos').remove([old]);}upd.veil=D.photo.veil;S.myPhoto={path,url:D.photo.url};}
      const {error}=await sb.from('profiles').update(upd).eq('id',uid());if(error)throw error;Object.assign(S.me,upd);S.busy=false;S.editing=null;toast('Listo, quedó guardado');back();
    }catch(e){S.busy=false;rerender();err(e);}},
  'save-style':async()=>{try{const {error}=await sb.from('profiles').update({style:S.D.style}).eq('id',uid());if(error)throw error;S.me.style=S.D.style;S.editing=null;toast('Listo, quedó guardado');back();}catch(e){err(e);}},
  'save-intro':async()=>{const v=S.D.intro;if(S.busy||!v||!v.blob)return;S.busy=true;rerender();
    try{const vp=await upload('voice',v.blob,v.ext);URLS.set('voice'+vp,v.url);const upd={intro_voice:vp,intro_secs:v.secs,intro_peaks:v.peaks};const {error}=await sb.from('profiles').update(upd).eq('id',uid());if(error)throw error;Object.assign(S.me,upd);S.busy=false;S.editing=null;toast('Tu brindis quedó guardado');back();}catch(e){S.busy=false;rerender();err(e);}},
  'save-bio':async()=>{const t=document.getElementById('biof').value.trim();if(moneyTalk(t))return toast(TXT.money,'shield');try{const {error}=await sb.from('profiles').update({bio:t}).eq('id',uid());if(error)throw error;S.me.bio=t;S.sheet=null;rerender();toast('Listo, quedó guardado');}catch(e){err(e);}},
  'open-person':()=>{S.target=curPerson();if(!S.target)return;track('person_open');go('person');},
  pass:()=>{const p=curPerson();if(!p)return;track('pass');const c=document.getElementById('pcard');if(c&&!calm())c.classList.add('out');const seen=LS.get('seen',[]).filter(x=>x!==p.id);seen.push(p.id);LS.set('seen',seen.slice(-400));
    setTimeout(()=>{S.di++;if(S.deck.length>1&&S.di%S.deck.length===0&&!S.looped){S.looped=true;toast('Ya conociste a todos por ahora. Te volvemos a presentar.','users');}rerender();const nc=document.getElementById('pcard');if(nc&&!calm())nc.classList.add('nextin');},c?240:0);},
  invite:()=>{if(S.screen!=='person')S.target=curPerson();if(!S.target)return;S.pick=null;S.voice=null;S.tpl=null;go('pick');},
  water:async()=>{const p=curPerson();if(!p)return;if(!waterOK())return toast('Ya usaste tu Cool Water de hoy. Vuelve mañana.','clock');
    const c=document.getElementById('pcard');if(c&&!calm())c.classList.add('out');const prevDay=S.me.water_day;S.me.water_day=limaDay();
    try{const {data,error}=await sb.rpc('send_invite',{p_to:p.id,p_drink:'water'});if(error)throw error;removeFromDeck(p.id);
      if(data&&data.crossed){S.me.water_day=prevDay;await loadMatches();showSalud(data.match);return;}
      track('water_sent');toast(`Le dejaste un Cool Water a ${first(p.name)}`,'glass');setTimeout(()=>{rerender();loadInvites();},c?240:0);}catch(e){S.me.water_day=prevDay;rerender();err(e);}},
  pick:v=>{S.pick=S.pick===v?null:v;rerender();},
  'pick-next':()=>{if(!S.pick)return;if(S.pick==='water'){A.send('novoice');return;}S.voice=null;go('record');},
  send:async v=>{if(S.busy)return;const p=S.target;const withVoice=v==='voice'&&S.voice&&S.voice.blob&&S.pick!=='water';
    S.busy=true;if(S.screen==='record')rerender();hap(10);
    try{let vp=null;if(withVoice){vp=await upload('voice',S.voice.blob,S.voice.ext);URLS.set('voice'+vp,S.voice.url);}
      const {data,error}=await sb.rpc('send_invite',{p_to:p.id,p_drink:S.pick,p_voice:vp,p_secs:withVoice?S.voice.secs:null,p_peaks:withVoice?S.voice.peaks:null});if(error)throw error;
      removeFromDeck(p.id);S.busy=false;
      if(data&&data.crossed){await Promise.all([loadMe(),loadMatches(),loadInvites()]);showSalud(data.match);return;}
      const d=DR[S.pick];track(S.pick==='water'?'water_sent':'drink_sent',{drink:S.pick,tier:d.tier,has_voice:!!vp,secs:withVoice?S.voice.secs:0});
      S.sentDrink=S.pick;S.stack=[];await Promise.all([loadMe(),loadInvites()]);go('sent');
      if(!standalone&&!LS.get('install',false)){LS.set('install',true);setTimeout(()=>{if(S.screen==='sent'||S.screen==='personas'){S.sheet={k:'install'};rerender();}},2600);}
    }catch(e){S.busy=false;rerender();err(e,'No se pudo enviar. Tu trago sigue en tu barra.');}},
  'go-act':v=>{S.act=v;if(v==='recibidas')S.recv.forEach(r=>track('invite_seen'));tab('actividad');},
  act:v=>{if(S.act===v)return;S.act=v;rerender();swapIn();},
  accept:async(v,el)=>{const r=S.recv.find(x=>x.id===v);if(!r||S.busy)return;S.busy=true;el.disabled=true;el.innerHTML=`${I('glass','s')} Brindando…`;
    loadPhotosOf([r.from_id]).catch(()=>{});
    try{const {data:mid,error}=await sb.rpc('answer_invite',{p_id:v,p_accept:true});if(error)throw error;
      track('invite_accepted',{hours:Math.round(48-hoursLeft(r.created_at))});S.recv=S.recv.filter(x=>x.id!==v);
      await Promise.all([loadMatches(),loadPhotosOf([r.from_id])]);S.busy=false;showSalud(mid);
    }catch(e){S.busy=false;err(e);await loadInvites();rerender();}},
  decline:async v=>{const r=S.recv.find(x=>x.id===v);const card=$app.querySelector(`.rcard[data-inv="${v}"]`);if(card&&!calm()){card.style.height=card.offsetHeight+'px';card.offsetHeight;card.classList.add('leaving');await new Promise(z=>setTimeout(z,300));}S.recv=S.recv.filter(x=>x.id!==v);rerender();
    try{const {error}=await sb.rpc('answer_invite',{p_id:v,p_accept:false});if(error)throw error;track('invite_passed');}catch(e){if(r)S.recv.unshift(r);rerender();err(e);}},
  'open-salud':v=>{if(v)showSalud(v);},
  'salud-later':()=>{if(nextSalud())return;S.stack=[];tab(S.salud&&S.salud.role==='receiver'?'actividad':'personas');},
  'open-chat':async(v,el)=>{const rec=el&&el.dataset.rec;S.chat=v;S.cmic=null;markRead(v);
    try{if(!S.msgs[v])await loadChat(v);}catch(e){err(e);return;}
    S.stack=S.stack.filter(x=>x!=='salud'&&x!=='chat');if(S.screen==='salud'){S.screen='actividad';S.act='chats';}go('chat');setTimeout(scrollChat,30);if(rec)setTimeout(()=>A.cmic(),450);},
  cmic:async()=>{if(S.cmic){const r=await recStop();S.cmic=null;rerender();if(r)sendMsg({voice:r});}
    else{S.cmic={t:0};rerender();const ok=await recStart(MAXC,(t,s)=>{const el=document.getElementById('cmt');if(el){el.textContent='0:'+String(Math.floor(t)).padStart(2,'0');el.classList.toggle('late',t>=MAXC-5);}const bs=document.querySelectorAll('#live i');const last=s.slice(-28);bs.forEach((b,i)=>{const x=last[i-(28-last.length)];b.style.height=(x==null?3:Math.round(3+17*x))+'px';});},()=>A.cmic());if(!ok){S.cmic=null;rerender();}}},
  'cmic-x':()=>{recCancel();S.cmic=null;rerender();},
  retry:v=>{const l=S.msgs[S.chat]||[];const m=l.find(x=>x.id===v);if(!m)return;S.msgs[S.chat]=l.filter(x=>x!==m);sendMsg(m.raw);},
  bartab:v=>{if(S.barTab===v)return;S.barTab=v;rerender();swapIn();},
  want:v=>{if((S.me.inv||{})[v])return toast('Ya está en tu barra, lista para invitar','glass');S.sheet={k:'want',v};rerender();},
  'want-go':()=>{const k=S.sheet.v;track('drink_wanted',{drink:k,tier:DR[k].tier});S.sheet=null;rerender();toast('Anotado. Te avisamos.','bell');},
  sheet:(v,el)=>{let p=S.target;if(S.screen==='chat'){const m=S.matches.find(x=>x.id===S.chat);p={id:peerOf(m),...S.people[peerOf(m)]};}if(v==='safety-inv'){p={id:el.dataset.id,...S.people[el.dataset.id],name:'esta persona'};v='safety';}S.sheet={k:v,p};rerender();},
  'close-sheet':()=>{const els=$app.querySelectorAll('.sheet,.scrim,.bigphoto');if(!els.length||calm()){S.sheet=null;rerender();return;}els.forEach(e=>e.classList.add('closing'));setTimeout(()=>{S.sheet=null;rerender();},200);},
  block:async v=>{try{const {error}=await sb.rpc('block_user',{p_id:v});if(error)throw error;track('block');removeFromDeck(v);S.recv=S.recv.filter(x=>x.from_id!==v);S.sheet=null;
      toast('Listo. Ya no se verán en Martini.','lock');await loadMatches();S.stack=[];tab(S.screen==='chat'||S.screen==='actividad'?'actividad':'personas');}catch(e){err(e);}},
  report:v=>{S.sheet={k:'report',p:S.sheet?.p,v};rerender();},
  'report-go':async reason=>{const v=S.sheet.v;const ctx=S.screen==='chat'?'chat':S.screen==='actividad'?'invitation':'person';
    try{const {error}=await sb.from('reports').insert({reporter:uid(),reported:v,reason,context:ctx});if(error)throw error;track('report',{reason});await A.block(v);toast('Gracias. Lo revisamos hoy.','shield');}catch(e){err(e);}},
  bye:()=>{S.sheet={k:'bye'};rerender();},
  'bye-go':async()=>{try{await sb.from('messages').insert({match_id:S.chat,sender:uid(),body:'Gracias por el brindis, me alegró conocerte. Esta vez prefiero no seguir. ¡Salud!'});const {error}=await sb.rpc('close_match',{p_id:S.chat});if(error)throw error;S.sheet=null;await loadMatches();toast('Te despediste con elegancia');S.act='chats';tab('actividad');}catch(e){err(e);}},
  row:v=>{const [a,b]=v.split(':');if(a==='sheet'){S.sheet={k:b};rerender();}else A[a]&&A[a]();},
  share:async()=>{const code=S.me?.code_used||S.code||'';const url=location.origin+'/?c='+encodeURIComponent(code);const text=`Te guardé un sitio en Martini, el bar donde no das like: invitas un trago con tu voz. Entra con mi código ${code}:`;track('share_tap');
    try{if(navigator.share){await navigator.share({title:'Martini',text,url});return;}}catch(e){return;}
    window.open('https://wa.me/?text='+encodeURIComponent(text+' '+url),'_blank');},
  feedback:()=>{track('feedback_tap');window.open(CFG.feedback,'_blank');},
  logout:async()=>{await sb.auth.signOut();location.replace('/');},
  'delete-go':async()=>{try{for(const b of ['photos','voice']){const {data:fs}=await sb.storage.from(b).list(uid(),{limit:1000});if(fs&&fs.length)await sb.storage.from(b).remove(fs.map(f=>uid()+'/'+f.name));}const {error}=await sb.rpc('delete_me');if(error)throw error;await sb.auth.signOut();localStorage.clear();location.replace('/');}catch(e){err(e);}},
  'install-go':async()=>{const e=S.installEvt;S.sheet=null;rerender();if(e){e.prompt();S.installEvt=null;}},
  play:(v,el)=>play(el)
};

async function sendMsg(raw){const id=S.chat;const {body,voice}=raw;
  const tmp={id:'tmp'+Date.now(),match_id:id,sender:uid(),body:body||null,voice:voice?voice.url:null,voice_secs:voice?.secs,voice_peaks:voice?.peaks,created_at:new Date().toISOString(),pending:true,raw};
  (S.msgs[id]=S.msgs[id]||[]).push(tmp);appendMsgs();
  try{let vp=null;if(voice){vp=await upload('voice',voice.blob,voice.ext);URLS.set('voice'+vp,voice.url);}
    const {data,error}=await sb.from('messages').insert({match_id:id,sender:uid(),body:body||null,voice:vp,voice_secs:voice?.secs||null,voice_peaks:voice?.peaks||null}).select().single();if(error)throw error;
    const l=S.msgs[id];const i=l.indexOf(tmp);if(l.some(x=>x.id===data.id))l.splice(i,1);else l[i]=data;const m=S.matches.find(x=>x.id===id);if(m)m.last=data;markRead(id);track('msg_sent',{kind:voice?'voice':'text'});
    if(S.screen==='chat'&&S.chat===id)appendMsgs();
  }catch(e){if(/row-level/.test(e.message||'')&&body){S.msgs[id]=S.msgs[id].filter(x=>x!==tmp);appendMsgs();toast(TXT.money,'shield');return;}tmp.pending=false;tmp.failed=true;if(S.screen==='chat')appendMsgs();}}

const AFTER={
  personas:()=>{const p=curPerson();const nx=S.deck[(S.di+1)%Math.max(1,S.deck.length)];preload([nx&&img(sig(nx.style))]);if(p){const seen=S._cv||(S._cv=new Set());if(!seen.has(p.id)){seen.add(p.id);track('card_view');}}},
  salud:()=>{const rp=document.getElementById('rp');const box=document.querySelector('.revealph:not(.done)');if(!box)return;const go2=()=>setTimeout(()=>box.classList.add('focus'),calm()?0:900);
    if(rp){if(rp.complete&&rp.naturalWidth)go2();else{rp.onload=go2;box.classList.add('wait');}}}
};

/* ================= EVENTOS ================= */
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el||el.disabled)return;if(el.closest('.ghost'))return;
  hap(8);if(el.classList.contains('banner'))el.remove();const a=A[el.dataset.a];if(a){e.preventDefault();e.stopPropagation();a(el.dataset.v,el);}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-a]')){e.preventDefault();e.target.click();}});
document.addEventListener('input',e=>{const k=e.target.dataset.in;if(!k||!S.D)return;S.D[k]=e.target.value;if(k==='bio'){const c=document.getElementById('bioc');if(c)c.textContent=e.target.value.length+'/120';}if(k==='district'||k==='birth')rerender();});
document.addEventListener('change',async e=>{if(!e.target.dataset.file||!e.target.files[0])return;try{S.D.photo=await prepPhoto(e.target.files[0]);rerender();}catch(x){toast('No pudimos abrir esa foto. Prueba con otra.','camera');}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  if(f.dataset.form==='txt'){const inp=f.querySelector('input');const t=inp.value.trim();if(!t)return;const m=S.matches.find(x=>x.id===S.chat);const early=m&&(Date.now()-new Date(m.created_at))<864e5;
    if(moneyTalk(t,early))return toast(TXT.money,'shield');inp.value='';sendMsg({body:t});return;}
  if(f.dataset.form==='auth'){const fd=new FormData(f);const up=S.auth==='signup';if(S.busy)return;
    if(up&&S.authStep==='code'){const code=String(fd.get('code')||'').trim().toUpperCase();if(!code)return toast('Escribe tu código de invitación','gift');S.busy=true;rerender();
      try{const {data:ok,error}=await sb.rpc('check_code',{p_code:code});if(error)throw error;S.busy=false;if(!ok){rerender();return toast('Ese código no abre la barra. Revísalo o pídele uno a quien te invitó.','x');}
        S.code=code;sessionStorage.setItem('martini-code',code);S.authStep='account';rerender();}catch(x){S.busy=false;rerender();err(x);}return;}
    const email=String(fd.get('email')||'').trim(),pass=String(fd.get('pass')||'');
    if(!email||!pass)return toast('Completa tu correo y tu contraseña','user');if(up&&pass.length<8)return toast('La contraseña necesita al menos 8 caracteres.','lock');if(up&&!fd.get('ok'))return toast('Para continuar, confirma que eres mayor de 18 y aceptas los Términos','shield');
    S.busy=true;rerender();
    try{if(up){const {data,error}=await sb.auth.signUp({email,password:pass});if(error)throw error;if(data.user&&data.user.identities&&!data.user.identities.length)throw {message:'Ese correo ya tiene cuenta. Entra con tu contraseña.'};let ses=data.session;if(!ses){const r2=await sb.auth.signInWithPassword({email,password:pass});ses=r2.data&&r2.data.session;}if(!ses)throw {message:'Falta un ajuste en el servidor: hay que apagar la confirmación de correo.'};S.session=ses;track('code_ok');}
      else{const {data,error}=await sb.auth.signInWithPassword({email,password:pass});if(error)throw /Invalid login/i.test(error.message)?{message:'Correo o contraseña no coinciden.'}:error;S.session=data.session;}
      S.busy=false;await enter();
    }catch(x){S.busy=false;rerender();err(/registered|already/i.test(x.message||'')?{message:'Ese correo ya tiene cuenta. Entra con tu contraseña.'}:x);}}});

/* Gestos: volver desde el borde y deslizar la tarjeta */
let sx=0,sy=0,edge=false,drag=null,swallow=false;
$ph.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;edge=sx<24&&S.stack.length>0&&S.screen!=='salud';const c=e.target.closest('#pcard');drag=c&&!e.target.closest('.vn')?{c,x:0}:null;},{passive:true});
$ph.addEventListener('touchmove',e=>{if(!drag)return;const t=e.touches[0];const dx=t.clientX-sx,dy=t.clientY-sy;if(!drag.x&&Math.abs(dy)>Math.abs(dx))return;drag.x=dx;drag.c.style.transition='none';drag.c.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;},{passive:true});
$ph.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx;
  if(edge&&dx>70&&Math.abs(t.clientY-sy)<60){edge=false;back();return;}
  if(drag&&Math.abs(drag.x)>8){const c=drag.c;swallow=true;setTimeout(()=>swallow=false,400);c.style.transition='transform .24s var(--ease-out)';
    if(dx<-90){c.style.transform='translateX(-120%) rotate(-6deg)';A.pass();}else if(dx>90){c.style.transform='';A.invite();}else c.style.transform='';}
  drag=null;},{passive:true});
document.addEventListener('click',e=>{if(swallow&&e.target.closest('#pcard')){e.stopPropagation();e.preventDefault();swallow=false;}},true);

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();S.installEvt=e;});
const offBand=()=>{let b=document.getElementById('offline');if(!navigator.onLine){if(!b){b=document.createElement('div');b.id='offline';b.className='offline';b.textContent=TXT.offline;$ph.appendChild(b);}}else if(b)b.remove();};
window.addEventListener('online',()=>{offBand();if(S.me)refresh();});window.addEventListener('offline',offBand);
async function refresh(){try{await Promise.all([loadInvites(),loadMatches(),loadMe()]);if(live.includes(S.screen))rerender();if(S.screen==='personas'||S.screen==='actividad')nextSalud();}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&S.me)refresh();});

/* ================= ARRANQUE ================= */
async function enter(){const me=await loadMe();
  if(!me){S.code=S.code||sessionStorage.getItem('martini-code');if(!S.code){S.auth='signup';S.authStep='code';go('auth',false);toast('Escribe tu código para terminar tu perfil','gift');return;}
    S.D=draft();S.stack=[];go('about',false);return;}
  await loadAll();subscribe();S.stack=[];if(S.recv.length){S.act='recibidas';}tab('personas');setTimeout(nextSalud,600);}
async function boot(){offBand();
  if(!CFG.url||/PEGAR/.test(CFG.url)){S.screen='splash';render('fade');toast('Falta conectar el backend (config.js)','x');return;}
  const qc=new URLSearchParams(location.search).get('c');if(qc){S.code=null;}
  const {data:{session}}=await sb.auth.getSession();S.session=session;
  sb.auth.onAuthStateChange((ev,s)=>{S.session=s;});
  if(!session){S.screen='splash';render('fade');setTimeout(()=>{if(S.screen==='splash'){S.ob=0;go('onboarding',false);}},1600);return;}
  try{await enter();}catch(e){err(e);S.screen='splash';render('fade');}
}
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
boot();
