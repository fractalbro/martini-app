-- Martini MVP · pegar completo en Supabase > SQL Editor > Run (una sola vez).
-- Toda regla de la barra corre aquí, en el servidor.

-- ========== CÓDIGOS DE INVITACIÓN ==========
create table if not exists public.codes (
  code text primary key,
  active boolean not null default true,
  uses int not null default 0
);
alter table public.codes enable row level security; -- la app nunca lee la lista
insert into public.codes(code) values ('BARRA-01') on conflict do nothing;

create or replace function public.check_code(p_code text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from codes where code = upper(trim(p_code)) and active);
$$;
grant execute on function public.check_code(text) to anon, authenticated;

create or replace function public.lima_today() returns date language sql stable as $$ select (now() at time zone 'America/Lima')::date $$;

-- Filtro de pagos (sin tildes ni mayúsculas).
create extension if not exists unaccent with schema extensions;
create or replace function public.money_talk(t text) returns boolean language sql immutable set search_path = public, extensions as $$
  select coalesce(lower(extensions.unaccent(t)) ~ '(yape|plin|te pago|pagame|transferencia|cuenta bancaria|s/ ?[0-9]|[0-9]+ ?(soles|lucas))', false);
$$;

-- ========== PERFILES ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 25),
  birth date not null,
  gender text not null check (gender in ('Hombre','Mujer','No binario')),
  interest text not null check (interest in ('Mujeres','Hombres','Todos')),
  district text not null,
  style text not null default 'Mystery' check (style in ('Romantic','Fresh','Mystery','Golden','Dreamer','Night')),
  bio text not null default '' check (char_length(bio) <= 120),
  veil text check (char_length(veil) <= 2000),
  intro_voice text,
  intro_secs int,
  intro_peaks jsonb,
  code_used text,
  verified boolean not null default false,
  inv jsonb not null default '{}'::jsonb,
  water_day date,
  cheers int not null default 0, -- invitaciones mías aceptadas (cada 3, la casa invita)
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.profiles enable row level security;

revoke update on public.profiles from authenticated;
grant update (name, district, style, bio, veil, intro_voice, intro_secs, intro_peaks, interest, last_seen) on public.profiles to authenticated;

create policy "perfiles visibles para usuarios" on public.profiles for select to authenticated using (true);
create policy "crear mi perfil" on public.profiles for insert to authenticated with check (id = auth.uid() and not public.money_talk(bio));
create policy "editar mi perfil" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and not public.money_talk(bio));

-- Al crear el perfil: +18, código válido y regalo de bienvenida. El cliente no puede fijar barra ni verificación.
create or replace function public.profile_defaults() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.birth > (lima_today() - interval '18 years') then raise exception 'Martini es solo para mayores de 18. Te esperamos más adelante.'; end if;
  new.code_used := upper(trim(coalesce(new.code_used,'')));
  update codes set uses = uses + 1 where code = new.code_used and active;
  if not found then raise exception 'Ese código no abre la barra. Revísalo o pídele uno a quien te invitó.'; end if;
  new.inv := '{"heaven":1,"vendetta":1,"sunshine":1}'::jsonb;
  new.verified := true; new.cheers := 0; new.water_day := null;
  return new;
end $$;
drop trigger if exists profile_defaults on public.profiles;
create trigger profile_defaults before insert on public.profiles for each row execute function public.profile_defaults();

-- ========== FOTOS (solo después del ¡Salud!) ==========
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  pos int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.photos enable row level security;

-- ========== INVITACIONES ==========
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  drink text not null,
  voice text,
  voice_secs int,
  voice_peaks jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','expired')),
  hidden boolean not null default false, -- "Ahora no": desaparece para quien recibe; vence a las 48 h
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists invites_to on public.invites(to_id, status);
create index if not exists invites_from on public.invites(from_id, status);
alter table public.invites enable row level security;
create policy "ver mis invitaciones" on public.invites for select to authenticated
  using (from_id = auth.uid() or (to_id = auth.uid() and not hidden));

-- ========== BRINDIS (match) Y MENSAJES ==========
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references public.profiles(id) on delete cascade, -- invitó
  b uuid not null references public.profiles(id) on delete cascade, -- aceptó
  drink text not null,
  invite_id uuid references public.invites(id) on delete set null,
  gift text,          -- trago de cortesía que ganó quien invitó con este brindis
  crossed boolean not null default false,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.matches enable row level security;
create policy "ver mis brindis" on public.matches for select to authenticated using (a = auth.uid() or b = auth.uid());

create or replace function public.matched(u1 uuid, u2 uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches m where not m.closed and ((m.a = u1 and m.b = u2) or (m.a = u2 and m.b = u1)));
$$;

create policy "ver mis fotos y las de mis brindis" on public.photos for select to authenticated
  using (owner = auth.uid() or public.matched(owner, auth.uid()));
create policy "subir mis fotos" on public.photos for insert to authenticated with check (owner = auth.uid());
create policy "borrar mis fotos" on public.photos for delete to authenticated using (owner = auth.uid());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender uuid not null references public.profiles(id) on delete cascade,
  body text check (char_length(body) <= 500),
  voice text,
  voice_secs int,
  voice_peaks jsonb,
  created_at timestamptz not null default now(),
  check (body is not null or voice is not null)
);
create index if not exists messages_match on public.messages(match_id, created_at);
alter table public.messages enable row level security;
create policy "leer mensajes de mis brindis" on public.messages for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and (m.a = auth.uid() or m.b = auth.uid())));
create policy "escribir en mis brindis" on public.messages for insert to authenticated
  with check (sender = auth.uid() and not public.money_talk(body)
    and exists (select 1 from public.matches m where m.id = match_id and not m.closed and (m.a = auth.uid() or m.b = auth.uid())));

-- ========== SEGURIDAD Y MÉTRICAS ==========
create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
create policy "mis bloqueos" on public.blocks for select to authenticated using (blocker = auth.uid());

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles(id) on delete cascade,
  reported uuid not null references public.profiles(id) on delete cascade,
  context text,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reportar" on public.reports for insert to authenticated with check (reporter = auth.uid());

-- ========== REGLAS DE LA BARRA ==========
create or replace function public.give(p_uid uuid, p_drink text) returns void language sql security definer set search_path = public as $$
  update profiles set inv = jsonb_set(inv, array[p_drink], to_jsonb(coalesce((inv->>p_drink)::int,0)+1)) where id = p_uid;
$$;
revoke execute on function public.give(uuid,text) from public, anon, authenticated;

-- Vencimiento perezoso: los tragos que nadie aceptó en 48 h vuelven a quien invitó (el Cool Water no vuelve).
create or replace function public.expire_invites() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in update invites set status = 'expired', answered_at = now()
           where status = 'pending' and created_at < now() - interval '48 hours'
           returning from_id, drink loop
    if r.drink <> 'water' then perform give(r.from_id, r.drink); end if;
  end loop;
end $$;
revoke execute on function public.expire_invites() from public, anon;
grant execute on function public.expire_invites() to authenticated;

-- Aceptar (uso interno): consume el trago, crea el brindis, pone el brindis de voz como primer mensaje
-- y cada 3 invitaciones aceptadas de quien invitó, la casa le invita un Tier 1.
create or replace function public.accept_core(i public.invites, p_crossed boolean) returns uuid language plpgsql security definer set search_path = public as $$
declare mid uuid; cnt int; g text;
begin
  update invites set status = 'accepted', answered_at = now() where id = i.id;
  update profiles set cheers = cheers + 1 where id = i.from_id returning cheers into cnt;
  if cnt % 3 = 0 then
    g := (array['heaven','minimal','citrus','onenight','sunshine'])[1 + floor(random()*5)::int];
    perform give(i.from_id, g);
  end if;
  insert into matches(a, b, drink, invite_id, gift, crossed) values (i.from_id, i.to_id, i.drink, i.id, g, p_crossed) returning id into mid;
  if i.voice is not null then
    insert into messages(match_id, sender, voice, voice_secs, voice_peaks, created_at) values (mid, i.from_id, i.voice, i.voice_secs, i.voice_peaks, i.created_at);
  end if;
  return mid;
end $$;
revoke execute on function public.accept_core(public.invites, boolean) from public, anon, authenticated;

create or replace function public.send_invite(p_to uuid, p_drink text, p_voice text default null, p_secs int default null, p_peaks jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int; new_id uuid; cross_i invites;
begin
  if me is null or p_to = me then raise exception 'No permitido'; end if;
  if not exists (select 1 from profiles where id = me) then raise exception 'Completa tu perfil primero'; end if;
  if p_drink not in ('heaven','minimal','onenight','sunshine','citrus','ice','crimson','caribe','vendetta','forest','royal','aurora','apple','nature','shake','mars','cosmic','eclipse','water') then raise exception 'Ese trago no existe'; end if;
  if exists (select 1 from blocks where (blocker = p_to and blocked = me) or (blocker = me and blocked = p_to)) then raise exception 'Esta persona ya no está disponible'; end if;
  perform expire_invites();
  if exists (select 1 from invites where from_id = me and to_id = p_to and status = 'pending') then raise exception 'Ya le invitaste un trago. Espera su respuesta.'; end if;
  if matched(me, p_to) then raise exception 'Ya brindan juntos'; end if;
  -- Invitación cruzada: si ya me invitó, se acepta la suya y mi trago no se gasta.
  select * into cross_i from invites where from_id = p_to and to_id = me and status = 'pending' order by created_at limit 1 for update;
  if found then
    return jsonb_build_object('match', accept_core(cross_i, true), 'crossed', true, 'drink', cross_i.drink);
  end if;
  if p_drink = 'water' then
    if (select water_day from profiles where id = me) = lima_today() then raise exception 'Ya usaste tu Cool Water de hoy. Vuelve mañana.'; end if;
    update profiles set water_day = lima_today() where id = me;
    p_voice := null; p_secs := null; p_peaks := null;
  else
    select coalesce((inv->>p_drink)::int,0) into n from profiles where id = me for update;
    if n < 1 then raise exception 'Ese trago ya no está en tu barra'; end if;
    update profiles set inv = case when n = 1 then inv - p_drink else jsonb_set(inv, array[p_drink], to_jsonb(n-1)) end where id = me;
  end if;
  insert into invites(from_id, to_id, drink, voice, voice_secs, voice_peaks) values (me, p_to, p_drink, p_voice, p_secs, p_peaks) returning id into new_id;
  return jsonb_build_object('invite', new_id, 'crossed', false);
end $$;

-- "Brindar" o "Ahora no" (nunca se avisa un rechazo).
create or replace function public.answer_invite(p_id uuid, p_accept boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); i invites;
begin
  select * into i from invites where id = p_id and to_id = me and status = 'pending' and not hidden for update;
  if not found then raise exception 'Esta invitación ya no está disponible'; end if;
  if not p_accept then update invites set hidden = true where id = p_id; return null; end if;
  if i.created_at < now() - interval '48 hours' then perform expire_invites(); raise exception 'Este trago ya se enfrió'; end if;
  if matched(me, i.from_id) then update invites set hidden = true where id = p_id; raise exception 'Ya brindan juntos'; end if;
  return accept_core(i, false);
end $$;

-- Bloquear: desaparecemos el uno para el otro, se cierra el chat y sus invitaciones pendientes hacia mí vencen.
create or replace function public.block_user(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r record;
begin
  insert into blocks(blocker, blocked) values (me, p_id) on conflict do nothing;
  update matches set closed = true where (a = me and b = p_id) or (a = p_id and b = me);
  for r in update invites set status = 'expired', answered_at = now() where from_id = p_id and to_id = me and status = 'pending' returning from_id, drink loop
    if r.drink <> 'water' then perform give(r.from_id, r.drink); end if;
  end loop;
end $$;

create or replace function public.close_match(p_id uuid) returns void language sql security definer set search_path = public as $$
  update matches set closed = true where id = p_id and (a = auth.uid() or b = auth.uid());
$$;

-- Eliminar cuenta: perfil, archivos, invitaciones y mensajes propios.
create or replace function public.delete_me() returns void language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid(); -- los archivos los borra la app antes, por la API de Storage
end $$;

-- ========== DESCUBRIR (sin fotos, sin fecha de nacimiento) ==========
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
  order by (select count(*) from invites i where i.to_id = p.id and i.status = 'pending') asc,
           (p.district = me.district) desc, p.last_seen desc
  limit 100;
$$;

-- Datos públicos de otra persona (sin fecha de nacimiento ni fotos).
create or replace function public.people(p_ids uuid[])
returns table (id uuid, name text, age int, district text, style text, bio text, veil text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, date_part('year', age(p.birth))::int, p.district, p.style, p.bio, p.veil from profiles p where p.id = any(p_ids);
$$;

revoke execute on function public.send_invite(uuid,text,text,int,jsonb) from public, anon;
revoke execute on function public.answer_invite(uuid,boolean) from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;
revoke execute on function public.close_match(uuid) from public, anon;
revoke execute on function public.delete_me() from public, anon;
revoke execute on function public.discover() from public, anon;
revoke execute on function public.people(uuid[]) from public, anon;
grant execute on function public.send_invite(uuid,text,text,int,jsonb), public.answer_invite(uuid,boolean), public.block_user(uuid),
  public.close_match(uuid), public.delete_me(), public.discover(), public.people(uuid[]) to authenticated;

-- Los perfiles completos solo los lee su dueño (los demás usan discover/people).
drop policy if exists "perfiles visibles para usuarios" on public.profiles;
create policy "leer mi perfil" on public.profiles for select to authenticated using (id = auth.uid());

-- ========== TIEMPO REAL ==========
alter publication supabase_realtime add table public.messages, public.invites, public.matches;

-- ========== ARCHIVOS PRIVADOS ==========
insert into storage.buckets (id, name, public, file_size_limit) values
  ('photos','photos', false, 5242880), ('voice','voice', false, 2097152)
on conflict (id) do update set public = false;
create policy "martini subir a mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id in ('photos','voice') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "martini borrar de mi carpeta" on storage.objects for delete to authenticated
  using (bucket_id in ('photos','voice') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "martini fotos: dueño o brindis" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.matched(((storage.foldername(name))[1])::uuid, auth.uid())));
create policy "martini voz: usuarios de la app" on storage.objects for select to authenticated
  using (bucket_id = 'voice');
