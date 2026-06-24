-- ============================================================
--  Momentum — Admin role + account deactivation
--  Ejecutar DESPUÉS de schema.sql, en el SQL Editor de Supabase.
--  Seguro de re-ejecutar.
-- ============================================================

-- 1) Columnas nuevas en profiles
alter table public.profiles add column if not exists is_admin  boolean not null default false;
alter table public.profiles add column if not exists is_active boolean not null default true;

-- 2) Helper SECURITY DEFINER (evita recursión de RLS al chequear el rol)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- 3) Políticas RLS para el admin
--    El admin puede VER todos los perfiles y datos, y ACTUALIZAR perfiles
--    (para activar/desactivar). No puede borrar cuentas.
drop policy if exists "profiles admin read"   on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin read"   on public.profiles
  for select using (public.is_admin(auth.uid()));
create policy "profiles admin update" on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['habits', 'habit_logs', 'goals', 'calendar_events', 'journal_entries']
  loop
    execute format('drop policy if exists "admin read" on public.%I;', t);
    execute format(
      'create policy "admin read" on public.%I for select using (public.is_admin(auth.uid()));', t);
  end loop;
end $$;

-- 4) El email del admin queda como administrador (ahora y a futuro)
update public.profiles set is_admin = true
  where email = 'tunegocioenlasredes2025@gmail.com';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email, 'Usuario'),
    (new.email = 'tunegocioenlasredes2025@gmail.com')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
