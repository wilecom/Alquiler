-- ============================================================
-- 2026-05-14 (part 3) — Tracking de fila en Google Sheets
-- ============================================================
-- `sheet_row` guarda el número de fila en la que vive este registro
-- dentro del Sheet de solicitudes, para poder hacer updates y reconciliar
-- cambios manuales (patrón sync downstream tipo MisCuentas).

alter table solicitudes
  add column if not exists sheet_row integer,
  add column if not exists sheet_synced_at timestamptz;

create index if not exists solicitudes_sheet_row_idx on solicitudes(sheet_row);
