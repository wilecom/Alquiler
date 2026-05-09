-- ============================================================
-- 2026-05-08 — Archivado del contrato firmado en Storage
-- ============================================================
-- - Columna contratos.contrato_archivo_path apunta al objeto en bucket privado.
-- - El bucket "contratos" se crea aparte vía Storage API (no SQL).
-- - RLS: el conductor solo puede leer el archivo de su propio contrato;
--   el equipo lee/escribe todos.

alter table contratos
  add column if not exists contrato_archivo_path text;

-- Storage policies para bucket 'contratos'.
-- La convención de path es: <contrato_id>/<filename>
-- (storage.foldername(name))[1] devuelve el primer segmento → contrato_id.

create policy "contratos_storage_select_conductor" on storage.objects for select
  using (
    bucket_id = 'contratos'
    and (storage.foldername(name))[1]::uuid in (
      select c.id from contratos c
      join conductores co on co.id = c.conductor_id
      where co.user_id = auth.uid()
    )
  );

create policy "contratos_storage_all_equipo" on storage.objects for all
  using (bucket_id = 'contratos' and es_equipo())
  with check (bucket_id = 'contratos' and es_equipo());
