-- ============================================================
-- 2026-05-02 — Permitir conductor editar perfil propio + tabla beneficios
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1) Política UPDATE para que el conductor edite su propio registro.
--    El Server Action restringe qué columnas pueden cambiar.
create policy "conductor_propio_update" on conductores for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2) Tabla de beneficios — el equipo activa, el conductor solo ve los suyos.
create table beneficios (
  id uuid primary key default uuid_generate_v4(),
  conductor_id uuid references conductores(id) on delete cascade not null,
  titulo text not null,
  descripcion text,
  activo boolean default true not null,
  fecha_activacion timestamptz default now() not null,
  fecha_expiracion timestamptz,
  activado_por uuid references auth.users(id),
  created_at timestamptz default now() not null
);

create index beneficios_conductor_idx on beneficios(conductor_id, activo);

alter table beneficios enable row level security;

create policy "beneficios_equipo" on beneficios for all
  using (es_equipo());

create policy "beneficios_conductor_select" on beneficios for select
  using (
    conductor_id in (select id from conductores where user_id = auth.uid())
  );

-- ============================================================
-- 3) Abonos extraordinarios (cláusula 8 del contrato)
-- ============================================================

-- Nuevo valor del enum tipo_pago. NOTA: ALTER TYPE ADD VALUE no puede ir
-- dentro de un BEGIN/COMMIT explícito en algunas versiones; ejecutar suelto.
alter type tipo_pago add value if not exists 'abono_extra';

-- Acumulado de abonos extras del contrato
alter table contratos
  add column if not exists abonos_extras_acumulados int default 0 not null;

