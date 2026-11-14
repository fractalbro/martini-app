\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','a@x'),('00000000-0000-0000-0000-00000000000b','b@x'),('00000000-0000-0000-0000-00000000000c','c@x');
set role authenticated;
set request.uid = '00000000-0000-0000-0000-00000000000a';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Ana','1995-01-01','Hombre','Mujeres','Barranco','BARRA-01');
insert into photos(owner,path) values (auth.uid(),auth.uid()||'/p.jpg');
set request.uid = '00000000-0000-0000-0000-00000000000b';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Bea','1996-05-05','Mujer','Hombres','Miraflores','BARRA-01');
set request.uid = '00000000-0000-0000-0000-00000000000c';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Cata','1993-05-05','Mujer','Todos','Lince','BARRA-01');
-- A abre ronda
set request.uid = '00000000-0000-0000-0000-00000000000a';
select open_ronda('corto','heaven');                          -- falla: muy corto
select open_ronda('Te yapeo 20 soles por venir','heaven');    -- falla: pagos
select open_ronda('Viernes de jazz en Barranco','apple');     -- falla: no lo tengo
select open_ronda('Viernes de jazz en Barranco','heaven','a/r.m4a',6,'[1]') is not null as abierta;
select open_ronda('Otra ronda más para hoy','vendetta');      -- falla: ya tengo una
select inv from profiles where id = auth.uid();               -- sin heaven
select count(*) as feed_propio from rondas_feed();            -- 0
-- B la ve y se apunta
set request.uid = '00000000-0000-0000-0000-00000000000b';
select name, plan, drink, joined from rondas_feed();
select count(*) as rondas_directas from rondas;               -- 0 por RLS
select join_ronda((select id from rondas_feed() limit 1)) as manos;
select join_ronda((select id from rondas_feed() limit 1)) as manos_repetido;
select joined from rondas_feed();
select count(*) as apuntes_que_ve_b from apuntes;             -- 1 (el suyo)
set request.uid = '00000000-0000-0000-0000-00000000000c';
select join_ronda((select id from rondas_feed() limit 1)) as manos_c;
select count(*) as apuntes_que_ve_c from apuntes;             -- 1
select choose_ronda((select id from rondas_feed() limit 1), auth.uid()); -- falla: no es su ronda
-- A elige a B
set request.uid = '00000000-0000-0000-0000-00000000000a';
select count(*) as apuntes_que_ve_a from apuntes;             -- 2
select choose_ronda((select id from rondas where status='open'), '00000000-0000-0000-0000-00000000000b') is not null as brindis;
select a = auth.uid() as soy_a, drink, ronda_id is not null as de_ronda from matches;
select body, voice from messages order by created_at;
select cheers from profiles where id = auth.uid();
select status from rondas;
-- B ya no la ve; C tampoco
set request.uid = '00000000-0000-0000-0000-00000000000c';
select count(*) as feed_c from rondas_feed();
select count(*) as fotos_de_a_para_c from photos where owner <> auth.uid();
set request.uid = '00000000-0000-0000-0000-00000000000b';
select count(*) as fotos_de_a_para_b from photos where owner <> auth.uid();
-- C abre y cierra: el trago vuelve
set request.uid = '00000000-0000-0000-0000-00000000000c';
select open_ronda('Café el domingo por la tarde','sunshine') is not null as abierta_c;
select inv from profiles where id = auth.uid();
select close_ronda((select id from rondas where owner = auth.uid() and status='open'));
select inv from profiles where id = auth.uid();
-- vencimiento: vuelve el trago
select open_ronda('Atardecer en el malecón de Miraflores','vendetta') is not null as abierta_c2;
reset role;
update rondas set created_at = now() - interval '25 hours' where status = 'open';
set role authenticated;
set request.uid = '00000000-0000-0000-0000-00000000000b';
select count(*) as feed_vencida from rondas_feed();
select expire_invites();
set request.uid = '00000000-0000-0000-0000-00000000000c';
select inv from profiles where id = auth.uid();
select status, count(*) from rondas group by 1 order by 1;
