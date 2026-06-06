-- =============================================================================
-- Johnny SaaS — Milestone 1 (cont.): Storage bucket for the Creative Asset Hub
-- Private bucket; clients upload raw media into chat (Pillar 4). Access is
-- scoped so a user can only touch files under a folder named after their uid:
--   assets/<auth.uid()>/<filename>
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

-- Path convention: first folder segment === owner uid.
create policy "assets bucket: owner read"
  on storage.objects for select
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets bucket: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets bucket: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
