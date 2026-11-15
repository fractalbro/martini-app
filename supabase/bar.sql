-- Martini · Tanda 3: Bar con compra de prueba (sin pago) y Socio del bar. Se puede ejecutar más de una vez.
alter table public.profiles add column if not exists socio boolean not null default false;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,      -- drink | pack | socio
  item text not null,
  qty int not null default 1,
  price numeric(8,2) not null default 0, -- precio de lista; en la beta no se cobra
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;
drop policy if exists "ver mis compras" on public.purchases;
create policy "ver mis compras" on public.purchases for select to authenticated using (user_id = auth.uid());

create or replace function public.drink_tier(p text) returns int language sql immutable as $$
  select case when p in ('heaven','minimal','citrus','onenight','sunshine') then 1
              when p in ('ice','crimson','caribe','vendetta','forest','royal','aurora') then 2
              when p in ('apple','nature','shake','mars','cosmic','eclipse') then 3 end;
$$;
create or replace function public.bar_count(p_uid uuid) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select sum(value::int) from profiles, jsonb_each_text(inv) where id = p_uid), 0)::int;
$$;
revoke execute on function public.bar_count(uuid) from public, anon, authenticated;

create or replace function public.beta_buy(p_drink text) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t int := drink_tier(p_drink);
begin
  if me is null or not exists (select 1 from profiles where id = me) then raise exception 'Completa tu perfil primero'; end if;
  if t is null then raise exception 'Ese trago no existe'; end if;
  if bar_count(me) >= 30 then raise exception 'Tu barra está llena. Invita un trago y vuelve por más.'; end if;
  perform give(me, p_drink);
  insert into purchases(user_id, kind, item, price) values (me, 'drink', p_drink, (array[2.9,5.9,11.9])[t]);
end $$;

create or replace function public.beta_pack(p_qty int) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t1 text[] := array['heaven','minimal','citrus','onenight','sunshine']; i int; pr numeric;
begin
  if me is null or not exists (select 1 from profiles where id = me) then raise exception 'Completa tu perfil primero'; end if;
  pr := case p_qty when 3 then 7.9 when 11 then 24.9 when 29 then 54.9 end;
  if pr is null then raise exception 'Ese pack no existe'; end if;
  if bar_count(me) + p_qty > 40 then raise exception 'Tu barra está llena. Invita unos tragos y vuelve por más.'; end if;
  for i in 0..p_qty-1 loop perform give(me, t1[1 + i % 5]); end loop;
  insert into purchases(user_id, kind, item, qty, price) values (me, 'pack', 'pack-'||p_qty, p_qty, pr);
end $$;

create or replace function public.beta_socio() returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); k text;
begin
  if me is null or not exists (select 1 from profiles where id = me) then raise exception 'Completa tu perfil primero'; end if;
  if (select socio from profiles where id = me) then return; end if;
  update profiles set socio = true where id = me;
  if not exists (select 1 from purchases where user_id = me and kind = 'socio') then
    foreach k in array array['heaven','minimal','citrus','onenight'] loop perform give(me, k); end loop;
  end if;
  insert into purchases(user_id, kind, item, price) values (me, 'socio', 'mensual', 19.9);
end $$;

-- Socio: ve la foto de quien le invitó antes de aceptar.
create or replace function public.socio_sees(p_owner uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.socio)
     and exists (select 1 from invites i where i.from_id = p_owner and i.to_id = auth.uid() and i.status = 'pending' and not i.hidden);
$$;
drop policy if exists "socio ve a quien le invita" on public.photos;
create policy "socio ve a quien le invita" on public.photos for select to authenticated using (public.socio_sees(owner));
drop policy if exists "martini fotos: socio" on storage.objects;
create policy "martini fotos: socio" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.socio_sees(((storage.foldername(name))[1])::uuid));

-- Descubrir: los Socios aparecen primero.
create or replace function public.discover()
returns table (id uuid, name text, age int, gender text, district text, style text, bio text, veil text, intro_voice text, intro_secs int, intro_peaks jsonb)
language sql stable security definer set search_path = public as $$
  with me as (select * from profiles where profiles.id = auth.uid())
  select p.id, p.name, date_part('year', age(p.birth))::int, p.gender, p.district, p.style, p.bio, p.veil, p.intro_voice, p.intro_secs, p.intro_peaks
  from profiles p, me
  where p.id <> me.id
    and exists (select 1 from photos f where f.owner = p.id)
    and (me.interest = 'Todos' or (me.interest = 'Mujeres' and p.gender = 'Mujer') or (me.interest = 'Hombres' and p.gender = 'Hombre'))
    and (p.interest = 'Todos' or (p.interest = 'Mujeres' and me.gender = 'Mujer') or (p.interest = 'Hombres' and me.gender = 'Hombre'))
    and not exists (select 1 from blocks b where (b.blocker = me.id and b.blocked = p.id) or (b.blocker = p.id and b.blocked = me.id))
    and not exists (select 1 from invites i where i.from_id = me.id and i.to_id = p.id and i.status = 'pending')
    and not matched(me.id, p.id)
  order by p.socio desc, (select count(*) from invites i where i.to_id = p.id and i.status = 'pending') asc,
           (p.district = me.district) desc, p.last_seen desc
  limit 100;
$$;

revoke execute on function public.beta_buy(text), public.beta_pack(int), public.beta_socio(), public.socio_sees(uuid) from public, anon;
grant execute on function public.beta_buy(text), public.beta_pack(int), public.beta_socio(), public.socio_sees(uuid) to authenticated;

select 'bar listo' as estado, (select count(*) from public.purchases) as compras;
