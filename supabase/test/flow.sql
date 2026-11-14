\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','a@x'),('00000000-0000-0000-0000-00000000000b','b@x'),('00000000-0000-0000-0000-00000000000c','c@x'),('00000000-0000-0000-0000-00000000000d','d@x');
set role authenticated;
-- A
set request.uid = '00000000-0000-0000-0000-00000000000a';
select check_code('barra-01') as code_ok, check_code('nope') as code_bad;
insert into profiles(id,name,birth,gender,interest,district,style,bio,code_used,inv,verified) values (auth.uid(),'Ana','1995-01-01','Hombre','Mujeres','Barranco','Golden','hola','barra-01','{"apple":99}',false);
select name, inv, verified from profiles;
insert into photos(owner,path) values (auth.uid(),auth.uid()||'/p.jpg');
-- menor de edad (debe fallar)
set request.uid = '00000000-0000-0000-0000-00000000000d';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Kid','2012-01-01','Mujer','Hombres','Lince','BARRA-01');
-- código malo (debe fallar)
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'X','1990-01-01','Mujer','Hombres','Lince','MALO');
-- B y C
set request.uid = '00000000-0000-0000-0000-00000000000b';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Bea','1996-05-05','Mujer','Hombres','Miraflores','BARRA-01');
insert into photos(owner,path) values (auth.uid(),auth.uid()||'/p.jpg');
set request.uid = '00000000-0000-0000-0000-00000000000c';
insert into profiles(id,name,birth,gender,interest,district,code_used,bio) values (auth.uid(),'Cata','1993-05-05','Mujer','Todos','Lince','BARRA-01','yapéame 20 soles');
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Cata','1993-05-05','Mujer','Todos','Lince','BARRA-01');
insert into photos(owner,path) values (auth.uid(),auth.uid()||'/p.jpg');
-- A descubre
set request.uid = '00000000-0000-0000-0000-00000000000a';
select name, age from discover();
select count(*) as otros_perfiles_visibles from profiles where id <> auth.uid();
select count(*) as fotos_ajenas_visibles from photos where owner <> auth.uid();
-- A invita a B con heaven
select send_invite('00000000-0000-0000-0000-00000000000b','heaven','a/v.m4a',5,'[1,2]');
select send_invite('00000000-0000-0000-0000-00000000000b','vendetta'); -- duplicada: falla
select inv from profiles where id = auth.uid();
select send_invite('00000000-0000-0000-0000-00000000000c','water');
select send_invite('00000000-0000-0000-0000-00000000000b','water'); -- falla (pendiente) 
select name from discover();
-- B ve y acepta
set request.uid = '00000000-0000-0000-0000-00000000000b';
select drink, status from invites;
select answer_invite((select id from invites where to_id = auth.uid()), true) is not null as aceptada;
select count(*) as fotos_de_A_visibles_para_B from photos where owner = '00000000-0000-0000-0000-00000000000a';
select count(*) as msgs from messages;
insert into messages(match_id,sender,body) values ((select id from matches limit 1), auth.uid(), 'hola!');
insert into messages(match_id,sender,body) values ((select id from matches limit 1), auth.uid(), 'te yapeo 50 soles');
-- C: invitación cruzada (A ya invitó a C con water)
set request.uid = '00000000-0000-0000-0000-00000000000c';
select inv from profiles;
select send_invite('00000000-0000-0000-0000-00000000000a','sunshine');
select inv as inv_c_sin_gastar from profiles;
select crossed from matches;
-- A: cortesía y bloqueo
set request.uid = '00000000-0000-0000-0000-00000000000a';
select cheers, inv from profiles where id = auth.uid();
select block_user('00000000-0000-0000-0000-00000000000c');
select count(*) filter (where closed) as cerrados from matches;
-- Ahora no + vencimiento
set request.uid = '00000000-0000-0000-0000-00000000000b';
reset role;
update profiles set inv='{"royal":1}' where id='00000000-0000-0000-0000-00000000000a';
set role authenticated; set request.uid = '00000000-0000-0000-0000-00000000000a';
insert into photos(owner,path) values (auth.uid(), 'x'); 
reset role; insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000e0','e@x'); set role authenticated;
set request.uid = '00000000-0000-0000-0000-0000000000e0';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Eva','1990-05-05','Mujer','Hombres','Lince','BARRA-01');
set request.uid = '00000000-0000-0000-0000-00000000000a';
select send_invite('00000000-0000-0000-0000-0000000000e0','royal');
set request.uid = '00000000-0000-0000-0000-0000000000e0';
select answer_invite((select id from invites where to_id = auth.uid()), false);
select count(*) as recibidas_visibles_tras_ahora_no from invites;
reset role; update invites set created_at = now() - interval '49 hours' where to_id='00000000-0000-0000-0000-0000000000e0'; set role authenticated;
set request.uid = '00000000-0000-0000-0000-00000000000a';
select expire_invites();
select inv as inv_a_tras_vencer from profiles where id = auth.uid();
update profiles set inv = '{"apple":50}' where id = auth.uid(); -- debe fallar (columna no editable)
set role anon; select discover();
