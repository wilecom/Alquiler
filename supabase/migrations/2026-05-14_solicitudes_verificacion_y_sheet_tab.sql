-- ============================================================
-- 2026-05-14 (part 4) — Verificación SIMIT/policía + tracking de pestaña
-- ============================================================
-- 1) Agrega 'verificacion_documentos' al pipeline (paso intermedio entre
--    formulario y visita_local). Aquí el equipo valida SIMIT, RUNT,
--    antecedentes policiales antes de mandar a campo.
-- 2) `sheet_tab` guarda en qué pestaña del Sheet de Drive vive la solicitud,
--    para poder mover filas entre pestañas cuando cambia el estado.

-- ALTER TYPE ADD VALUE no se puede correr dentro de un BEGIN/COMMIT explícito.
alter type estado_solicitud_pipeline add value if not exists 'verificacion_documentos';

alter table solicitudes
  add column if not exists sheet_tab text;

notify pgrst, 'reload schema';
