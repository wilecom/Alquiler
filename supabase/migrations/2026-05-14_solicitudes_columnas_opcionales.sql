-- ============================================================
-- 2026-05-14 (part 2) — Hacer nullable las columnas que ya no se
-- piden en la captura inicial del form /solicitud.
-- El equipo completa estos campos manualmente desde el panel cuando
-- la solicitud avanza al siguiente filtro.
-- ============================================================

alter table solicitudes
  alter column barrio drop not null,
  alter column ocupacion drop not null,
  alter column ingreso_mensual_estimado drop not null;
