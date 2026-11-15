// Prueba de la llamada de brindis entre dos pestañas (backend falso, WebRTC real).
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=process.argv[2];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';if(p==='/vendor/supabase.js')p='/test/fake-supabase.js';if(p==='/config.js'){r.writeHead(200,{'content-type':'text/javascript'});return r.end("window.MARTINI={url:'https://t.supabase.co',key:'k'}");}
  fs.readFile(root+p,(e,d)=>{if(e){r.writeHead(404);return r.end();}r.writeHead(200,{'content-type':mime[path.extname(p)]||'text/plain'});r.end(d);});}).listen(4598);
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const ctx=await b.newContext({...devices['iPhone 13'],permissions:['microphone'],serviceWorkers:'block'});const errs=[];
 const open=async u=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(u+' PAGE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(u+' CON '+m.text());});await p.goto('http://localhost:4598/?u='+u);await p.waitForTimeout(1500);return p;};
 const A=await open('a'),B=await open('b');const txt=(p,s)=>p.locator(s).first().innerText();
 try{
  await A.click('[data-a=tab][data-v=actividad]');await A.click('[data-a=act][data-v=chats]');await A.click('[data-a=open-chat]');await A.waitForTimeout(700);await A.screenshot({path:out+'/c1-chat.png'});
  await A.click('[data-a=call]');await A.waitForTimeout(900);await A.screenshot({path:out+'/c2-llamando.png'});await B.screenshot({path:out+'/c3-entrante.png'});
  console.log('A:',await txt(A,'#calltime'),'| B:',await txt(B,'#calltime'));
  await B.click('[data-a=call-yes]');await A.waitForTimeout(3500);await A.screenshot({path:out+'/c4-en-llamada.png'});
  console.log('A:',await txt(A,'#calltime'),'| B:',await txt(B,'#calltime'));
  const st=await A.evaluate(()=>new Promise(r=>setTimeout(()=>r(document.querySelector('.call')?'en llamada':'fuera'),100)));console.log('estado A',st);
  await A.click('[data-a=call-mute]');await B.click('[data-a=call-end]');await A.waitForTimeout(900);await A.screenshot({path:out+'/c5-fin.png'});
  console.log('tras colgar: A en llamada =',await A.locator('.call').count(),'B en llamada =',await B.locator('.call').count());
  // rechazo
  await B.click('[data-a=tab][data-v=perfil]').catch(()=>{});await A.click('[data-a=call]');await B.waitForTimeout(900);await B.click('[data-a=call-no]');await A.waitForTimeout(800);
  console.log('tras rechazo: A en llamada =',await A.locator('.call').count(),'toast A:',await txt(A,'.toast').catch(()=>'-'));
 }catch(e){errs.push('STEP '+e.message.split('\n')[0]);await A.screenshot({path:out+'/c-FAIL-a.png'});await B.screenshot({path:out+'/c-FAIL-b.png'});}
 console.log(errs.length?errs.join('\n'):'SIN ERRORES');await b.close();srv.close();})();
