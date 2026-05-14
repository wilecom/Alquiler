-- ============================================================
-- 2026-05-14 — Captación de solicitudes
-- Tabla `solicitudes` (form público completo /solicitud) +
-- tabla `solicitud_codeudores` (2 codeudores por solicitud).
-- Conductores solo se crean cuando la solicitud es aprobada.
-- Ejecutar con: node scripts/run-migration.mjs supabase/migrations/2026-05-14_solicitudes_y_codeudores.sql
-- ============================================================

-- Enum del pipeline de solicitudes (separado del de conductores)
create type estado_solicitud_pipeline as enum (
  'formulario',
  'visita_local',
  'visita_domiciliaria',
  'aprobada',
  'rechazada'
);

-- ============================================================
-- TABLA: solicitudes
-- ============================================================
create table solicitudes (
  id uuid primary key default uuid_generate_v4(),

  -- Pipeline
  estado estado_solicitud_pipeline default 'formulario' not null,
  motivo_rechazo text,
  conductor_id uuid references conductores(id) on delete set null,
  revisado_por uuid references auth.users(id),

  -- 1. Datos personales
  -- direccion y tipo_vivienda quedan nullable: se piden en una segunda instancia.
  nombre_completo text not null,
  cedula text not null unique,
  edad integer not null check (edad between 18 and 80),
  telefono text not null,
  email text not null,
  barrio text not null,
  direccion text,
  tipo_vivienda tipo_vivienda,

  -- 2. Licencia de conducción
  tiene_licencia boolean not null,
  categoria_licencia text,
  licencia_suspendida_antes boolean default false not null,
  detalle_suspensiones text,

  -- 3. Comparendos
  tiene_comparendos_pendientes boolean default false not null,
  cantidad_comparendos integer default 0 not null check (cantidad_comparendos >= 0),
  motivos_comparendos text,

  -- 4. Trabajo e ingresos
  ocupacion text not null,
  ingreso_mensual_estimado bigint not null check (ingreso_mensual_estimado >= 0),
  anos_actividad numeric(4,1) check (anos_actividad >= 0),

  -- 5. Uso del vehículo
  -- plataformas_detalle y lugar_parqueo se piden después.
  uso_plataformas boolean default false not null,
  plataformas_detalle text,
  lugar_parqueo text,

  -- 6. Autorización Ley 1581
  acepta_habeas_data boolean not null check (acepta_habeas_data = true),
  firma_timestamp timestamptz not null,
  firma_ip text,
  firma_user_agent text,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index solicitudes_estado_idx on solicitudes(estado, created_at desc);

-- ============================================================
-- TABLA: solicitud_codeudores
-- ============================================================
create table solicitud_codeudores (
  id uuid primary key default uuid_generate_v4(),
  solicitud_id uuid references solicitudes(id) on delete cascade not null,
  orden smallint not null check (orden in (1, 2)),
  nombre_completo text not null,
  cedula text not null,
  telefono text not null,
  relacion text not null,
  ocupacion text not null,
  created_at timestamptz default now() not null,
  unique (solicitud_id, orden)
);

create index solicitud_codeudores_solicitud_idx on solicitud_codeudores(solicitud_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table solicitudes enable row level security;
alter table solicitud_codeudores enable row level security;

-- solicitudes: anon puede crear (form público); equipo lee/edita/borra todo.
create policy "solicitudes_public_insert" on solicitudes for insert
  with check (true);

create policy "solicitudes_equipo_all" on solicitudes for all
  using (es_equipo());

-- codeudores: igual. Validamos en server action que solo se inserten 2 por solicitud
-- (la unique constraint en (solicitud_id, orden) refuerza esto).
create policy "solicitud_codeudores_public_insert" on solicitud_codeudores for insert
  with check (true);

create policy "solicitud_codeudores_equipo_all" on solicitud_codeudores for all
  using (es_equipo());

-- ============================================================
-- TRIGGER: mantener updated_at en sync
-- ============================================================
create or replace function touch_solicitudes_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger trg_solicitudes_updated_at
before update on solicitudes
for each row execute function touch_solicitudes_updated_at();
