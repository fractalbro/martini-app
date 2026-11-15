\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000000a','a@x'),('00000000-0000-0000-0000-00000000000b','b@x');
set role authenticated;
set request.uid = '00000000-0000-0000-0000-00000000000a';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Ana','1995-01-01','Hombre','Mujeres','Barranco','BARRA-01');
insert into photos(owner,path) values (auth.uid(),auth.uid()||'/p.jpg');
set request.uid = '00000000-0000-0000-0000-00000000000b';
insert into profiles(id,name,birth,gender,interest,district,code_used) values (auth.uid(),'Bea','1996-05-05','Mujer','Hombres','Miraflores','BARRA-01');
insert into photos(owner,path) values (auth.uid(),auth.uid()||'/p.jpg');
select beta_buy('water');   -- falla
select beta_buy('mars'); select beta_pack(3); select beta_pack(7); -- el último falla
select inv, socio from profiles where id = auth.uid();
update profiles set socio = true where id = auth.uid(); -- falla: sin permiso
-- A invita a B; B aún no es socio: no ve la foto
set request.uid = '00000000-0000-0000-0000-00000000000a';
select send_invite('00000000-0000-0000-0000-00000000000b','heaven') is not null as enviada;
set request.uid = '00000000-0000-0000-0000-00000000000b';
select count(*) as fotos_ajenas_sin_socio from photos where owner <> auth.uid();
select beta_socio(); select beta_socio();
select inv, socio from profiles where id = auth.uid();
select count(*) as fotos_ajenas_socio from photos where owner <> auth.uid();
select kind, item, qty, price from purchases order by created_at;
set request.uid = '00000000-0000-0000-0000-00000000000a';
select count(*) as compras_ajenas from purchases;
select name from discover();
