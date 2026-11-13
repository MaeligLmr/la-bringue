-- Task 01 (#143) — Rôle admin et policies RLS
-- Lecture publique sur le contenu du site, écriture réservée aux admins.
-- Reflète la configuration en place sur Supabase ; idempotent, peut être
-- rejoué sans erreur dans le SQL Editor.

-- 1. Rôle admin -------------------------------------------------------------
-- La colonne public."Profil".role existe déjà ('admin' pour l'équipe).

-- security definer : la fonction lit Profil avec les droits de son
-- propriétaire, donc sans dépendre (ni boucler sur) les policies de Profil.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public."Profil"
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Chaque utilisatrice lit son profil ; seuls les admins voient tous les
-- profils et modifient un rôle (pas d'auto-promotion possible).
alter table public."Profil" enable row level security;

drop policy if exists "Voir son profil" on public."Profil";
create policy "Voir son profil" on public."Profil"
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins voient tous les profils" on public."Profil";
create policy "Admins voient tous les profils" on public."Profil"
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins modifient les rôles" on public."Profil";
create policy "Admins modifient les rôles" on public."Profil"
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 2. Écriture réservée aux admins sur les tables de contenu ------------------
-- Une seule policy ALL : insert / update / delete (et select complet pour
-- le back office) passent par is_admin().
do $$
declare
  t text;
  content_tables text[] := array[
    'Artiste', 'Concert', 'ConcertArtiste', 'Scene',
    'Conference', 'Conferenciere', 'Participation', 'Exposant',
    'Actualite', 'Formule', 'Promotion', 'InfoPratique'
  ];
begin
  foreach t in array content_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Gestion admin" on public.%I', t);
    execute format(
      'create policy "Gestion admin" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- 3. Lecture publique ---------------------------------------------------------
do $$
declare
  t text;
  public_tables text[] := array[
    'Artiste', 'Concert', 'Scene',
    'Conference', 'Conferenciere', 'Participation', 'Exposant',
    'Formule', 'InfoPratique'
  ];
begin
  foreach t in array public_tables loop
    execute format('drop policy if exists "Lecture publique" on public.%I', t);
    execute format(
      'create policy "Lecture publique" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end;
$$;

-- Seules les actualités dont la date de publication est atteinte sont visibles du
-- site public (les admins voient tout via « Gestion admin »). Sans date : jamais visible.
-- La policy générique « Lecture publique » doit disparaître, sinon elle l'emporterait.
drop policy if exists "Lecture publique" on public."Actualite";
drop policy if exists "Lecture des actualités publiées" on public."Actualite";
create policy "Lecture des actualités publiées" on public."Actualite"
  for select to anon, authenticated
  using (date_publication <= now());

-- Les artistes pas encore annoncées restent cachées du site public.
drop policy if exists "Lecture des artistes annoncées" on public."ConcertArtiste";
create policy "Lecture des artistes annoncées" on public."ConcertArtiste"
  for select to anon, authenticated
  using (artiste_annonce is true);

-- Seules les promotions en cours sont visibles du site public.
drop policy if exists "Lecture des promos actives" on public."Promotion";
create policy "Lecture des promos actives" on public."Promotion"
  for select to anon, authenticated
  using (
    (date_debut is null or date_debut <= now())
    and (date_fin is null or date_fin >= now())
  );

-- 4. Envoi d'images (Task 02 #150) -------------------------------------------
-- Le champ « image » d'AdminForm envoie les photos dans le bucket « images ».
drop policy if exists "Admins envoient des images" on storage.objects;
create policy "Admins envoient des images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (select public.is_admin()));
