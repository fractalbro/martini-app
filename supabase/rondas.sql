-- Martini · Tanda 1: Rondas abiertas. Se puede ejecutar más de una vez.

create table if not exists public.rondas (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (char_length(plan) between 8 and 120),
  drink text not null,
  voice text,
  voice_secs int,
  voice_peaks jsonb,
  status text not null default 'open' check (status in ('open','chosen','closed','expired')),
  created_at timestamptz not null default now()
);
create unique index if not exists rondas_una_abierta on public.rondas(owner) where status = 'open';
alter table public.rondas enable row level security;
drop policy if exists "ver mis rondas" on public.rondas;
create policy "ver mis rondas" on public.rondas for select to authenticated using (owner = auth.uid());

create table if not exists public.apuntes (
  ronda_id uuid not null references public.rondas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ronda_id, user_id)
);
create index if not exists apuntes_user on public.apuntes(user_id, created_at);
alter table public.apuntes enable row level security;

-- Dueño de una ronda (definer para que la política de apuntes no dependa de la de rondas).
create or replace function public.ronda_mia(p_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from rondas r where r.id = p_id and r.owner = auth.uid());
$$;
drop policy if exists "ver apuntes míos o de mi ronda" on public.apuntes;
create policy "ver apuntes míos o de mi ronda" on public.apuntes for select to authenticated
  using (user_id = auth.uid() or public.ronda_mia(ronda_id));

alter table public.matches add column if not exists ronda_id uuid references public.rondas(id) on delete set null;

-- Vencimiento perezoso: una ronda dura 24 h; si nadie fue elegido, el trago vuelve.
create or replace function public.expire_rondas() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in update rondas set status = 'expired' where status = 'open' and created_at < now() - interval '24 hours' returning owner, drink loop
    perform give(r.owner, r.drink);
  end loop;
end $$;
revoke execute on function public.expire_rondas() from public, anon, authenticated;

create or replace function public.expire_invites() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in update invites set status = 'expired', answered_at = now()
           where status = 'pending' and created_at < now() - interval '48 hours'
           returning from_id, drink loop
    if r.drink <> 'water' then perform give(r.from_id, r.drink); end if;
  end loop;
  perform expire_rondas();
end $$;

create or replace function public.open_ronda(p_plan text, p_drink text, p_voice text default null, p_secs int default null, p_peaks jsonb default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int; rid uuid;
begin
  if me is null or not exists (select 1 from profiles where id = me) then raise exception 'Completa tu perfil primero'; end if;
  p_plan := btrim(coalesce(p_plan, ''));
  if char_length(p_plan) < 8 or char_length(p_plan) > 120 then raise exception 'Tu plan necesita una frase un poco más larga.'; end if;
  if money_talk(p_plan) then raise exception 'En Martini no se habla de pagos. Edita tu plan.'; end if;
  perform expire_invites();
  if exists (select 1 from rondas where owner = me and status = 'open') then raise exception 'Ya tienes una ronda abierta'; end if;
  select coalesce((inv->>p_drink)::int, 0) into n from profiles where id = me for update;
  if p_drink = 'water' or n < 1 then raise exception 'Ese trago ya no está en tu barra'; end if;
  update profiles set inv = case when n = 1 then inv - p_drink else jsonb_set(inv, array[p_drink], to_jsonb(n-1)) end where id = me;
  insert into rondas(owner, plan, drink, voice, voice_secs, voice_peaks) values (me, p_plan, p_drink, p_voice, p_secs, p_peaks) returning id into rid;
  return rid;
end $$;

-- Rondas abiertas de otras personas (mismos filtros que Descubrir).
create or replace function public.rondas_feed()
returns table (id uuid, owner uuid, plan text, drink text, voice text, voice_secs int, voice_peaks jsonb, created_at timestamptz, joined boolean,
               name text, age int, district text, style text, veil text)
language sql stable security definer set search_path = public as $$
  with me as (select * from profiles where profiles.id = auth.uid())
  select r.id, r.owner, r.plan, r.drink, r.voice, r.voice_secs, r.voice_peaks, r.created_at,
         exists (select 1 from apuntes a where a.ronda_id = r.id and a.user_id = me.id),
         p.name, date_part('year', age(p.birth))::int, p.district, p.style, p.veil
  from rondas r join profiles p on p.id = r.owner, me
  where r.status = 'open' and r.created_at > now() - interval '24 hours' and r.owner <> me.id
    and (me.interest = 'Todos' or (me.interest = 'Mujeres' and p.gender = 'Mujer') or (me.interest = 'Hombres' and p.gender = 'Hombre'))
    and (p.interest = 'Todos' or (p.interest = 'Mujeres' and me.gender = 'Mujer') or (p.interest = 'Hombres' and me.gender = 'Hombre'))
    and not exists (select 1 from blocks b where (b.blocker = me.id and b.blocked = p.id) or (b.blocker = p.id and b.blocked = me.id))
    and not matched(me.id, p.id)
  order by (p.district = me.district) desc, r.created_at desc
  limit 50;
$$;

-- "Me apunto" que me quedan hoy (3 por día, hora de Lima).
create or replace function public.ronda_hands() returns int language sql stable security definer set search_path = public as $$
  select greatest(0, 3 - (select count(*)::int from apuntes a where a.user_id = auth.uid() and (a.created_at at time zone 'America/Lima')::date = lima_today()));
$$;

create or replace function public.join_ronda(p_id uuid) returns int language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r rondas;
begin
  if me is null or not exists (select 1 from profiles where id = me) then raise exception 'Completa tu perfil primero'; end if;
  select * into r from rondas where id = p_id and status = 'open' and created_at > now() - interval '24 hours';
  if not found or r.owner = me then raise exception 'Esta ronda ya se cerró'; end if;
  if exists (select 1 from blocks where (blocker = r.owner and blocked = me) or (blocker = me and blocked = r.owner)) then raise exception 'Esta ronda ya se cerró'; end if;
  if exists (select 1 from apuntes where ronda_id = p_id and user_id = me) then return ronda_hands(); end if;
  if ronda_hands() < 1 then raise exception 'Ya usaste tus 3 “Me apunto” de hoy. Mañana tienes más.'; end if;
  insert into apuntes(ronda_id, user_id) values (p_id, me);
  return ronda_hands();
end $$;

-- Elegir: nace el brindis, el plan queda como primer mensaje y la cortesía cuenta igual que una invitación aceptada.
create or replace function public.choose_ronda(p_id uuid, p_user uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r rondas; mid uuid; cnt int; g text;
begin
  select * into r from rondas where id = p_id and owner = me and status = 'open' for update;
  if not found then raise exception 'Esta ronda ya se cerró'; end if;
  if not exists (select 1 from apuntes where ronda_id = p_id and user_id = p_user)
     or exists (select 1 from blocks where (blocker = p_user and blocked = me) or (blocker = me and blocked = p_user)) then
    raise exception 'Esta persona ya no está disponible';
  end if;
  if matched(me, p_user) then raise exception 'Ya brindan juntos'; end if;
  update rondas set status = 'chosen' where id = p_id;
  update profiles set cheers = cheers + 1 where id = me returning cheers into cnt;
  if cnt % 3 = 0 then
    g := (array['heaven','minimal','citrus','onenight','sunshine'])[1 + floor(random()*5)::int];
    perform give(me, g);
  end if;
  insert into matches(a, b, drink, gift, ronda_id) values (me, p_user, r.drink, g, p_id) returning id into mid;
  insert into messages(match_id, sender, body, created_at) values (mid, me, r.plan, r.created_at);
  if r.voice is not null then
    insert into messages(match_id, sender, voice, voice_secs, voice_peaks, created_at) values (mid, me, r.voice, r.voice_secs, r.voice_peaks, r.created_at + interval '1 second');
  end if;
  return mid;
end $$;

create or replace function public.close_ronda(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare r rondas;
begin
  update rondas set status = 'closed' where id = p_id and owner = auth.uid() and status = 'open' returning * into r;
  if found then perform give(r.owner, r.drink); end if;
end $$;

revoke execute on function public.open_ronda(text,text,text,int,jsonb), public.rondas_feed(), public.ronda_hands(), public.join_ronda(uuid),
  public.choose_ronda(uuid,uuid), public.close_ronda(uuid), public.ronda_mia(uuid) from public, anon;
grant execute on function public.open_ronda(text,text,text,int,jsonb), public.rondas_feed(), public.ronda_hands(), public.join_ronda(uuid),
  public.choose_ronda(uuid,uuid), public.close_ronda(uuid), public.ronda_mia(uuid) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.apuntes;
exception when duplicate_object then null; end $$;
