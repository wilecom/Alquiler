-- ============================================================
-- SCHEMA LEASING AUTOMOTRIZ
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type rol_usuario as enum ('equipo', 'conductor');
create type estado_vehiculo as enum ('disponible', 'arrendado', 'inactivo');
create type estado_solicitud_conductor as enum ('formulario', 'visita_local', 'visita_domiciliaria', 'aprobado', 'rechazado');
create type dia_semana as enum ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
create type estado_contrato as enum ('activo', 'terminado', 'comprado');
create type tipo_pago as enum ('canon', 'aplazatoria');
create type estado_pago as enum ('pendiente', 'comprobante_subido', 'verificado', 'rechazado');
create type estado_aplazatoria as enum ('pendiente', 'aprobada', 'rechazada');
create type estado_comparendo as enum ('pendiente', 'pagado', 'causal_terminacion');
create type razon_terminacion as enum ('voluntaria', 'incumplimiento', 'opcion_compra');
create type tipo_vivienda as enum ('propia', 'familiar', 'arrendada');
create type nivel_formacion as enum ('bachiller', 'tecnico', 'profesional', 'posgrado');
create type tipo_tenencia as enum ('propio', 'prestado', 'arriendo');
create type opcion_codeudor as enum ('finca_raiz', 'dos_codeudores');

-- ============================================================
-- TABLA: perfiles
-- ============================================================
create table perfiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  rol rol_usuario not null,
  nombre_completo text not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: vehiculos
-- ============================================================
create table vehiculos (
  id uuid primary key default uuid_generate_v4(),
  marca text not null,
  modelo integer not null,
  color text not null,
  placa text not null unique,
  numero_chasis text not null unique,
  numero_motor text not null unique,
  valor_comercial integer not null,
  estado estado_vehiculo default 'disponible' not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: conductores
-- ============================================================
create table conductores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null unique,
  nombre_completo text not null,
  cedula text not null unique,
  edad integer not null,
  barrio text not null,
  direccion text not null,
  telefono text not null,
  email text not null,
  estado_solicitud estado_solicitud_conductor default 'formulario' not null,
  tiene_licencia boolean not null,
  tiene_multas boolean not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: entrevistas
-- ============================================================
create table entrevistas (
  id uuid primary key default uuid_generate_v4(),
  conductor_id uuid references conductores(id) on delete cascade not null,
  entrevistador text not null,
  fecha_entrevista date not null,
  vive_con text,
  es_casado boolean,
  tiene_hijos boolean,
  num_hijos integer,
  tipo_vivienda tipo_vivienda,
  formacion nivel_formacion,
  ocupacion_actual text,
  antecedentes text,
  trabajos_anteriores text,
  aspiraciones text,
  experiencia_plataformas boolean,
  tiempo_experiencia text,
  cuales_plataformas text,
  perfiles_activos boolean,
  produccion_mensual integer,
  tiene_comparendos boolean,
  detalle_comparendos text,
  razon_entrega_anterior text,
  razon_no_compra text,
  ingresos text,
  tiene_deudas boolean,
  detalle_deudas text,
  responsabilidades text,
  personas_a_cargo boolean,
  reporte_datacredito boolean,
  ha_tenido_vehiculo boolean,
  tipo_tenencia tipo_tenencia,
  fuente_ingreso_adicional text,
  opcion_codeudor opcion_codeudor,
  observaciones text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: contratos
-- ============================================================
create table contratos (
  id uuid primary key default uuid_generate_v4(),
  conductor_id uuid references conductores(id) on delete restrict not null,
  vehiculo_id uuid references vehiculos(id) on delete restrict not null,
  fecha_inicio date not null,
  dia_pago dia_semana not null,
  primer_pago_fecha date not null,
  deposito_inicial integer default 300000 not null,
  valor_comercial_acordado integer not null,
  -- CEILING((valor_comercial - deposito) / 200000)
  semanas_para_compra integer generated always as (
    ceil((valor_comercial_acordado - deposito_inicial)::numeric / 200000)::integer
  ) stored,
  semanas_pagadas integer default 0 not null,
  semanas_aplazatorias integer default 0 not null,
  ahorro_acumulado integer default 0 not null,
  bonos_acumulados integer default 0 not null,
  estado estado_contrato default 'activo' not null,
  fecha_terminacion date,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: pagos
-- ============================================================
create table pagos (
  id uuid primary key default uuid_generate_v4(),
  contrato_id uuid references contratos(id) on delete restrict not null,
  tipo tipo_pago not null,
  fecha_pago date not null,
  fecha_vencimiento date not null,
  monto integer not null,
  dias_mora integer default 0 not null,
  multa_mora integer default 0 not null,
  comprobante_url text,
  estado estado_pago default 'pendiente' not null,
  aprobado_por uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: aplazatorias_solicitudes
-- ============================================================
create table aplazatorias_solicitudes (
  id uuid primary key default uuid_generate_v4(),
  contrato_id uuid references contratos(id) on delete restrict not null,
  semana_solicitada date not null,
  estado estado_aplazatoria default 'pendiente' not null,
  revisado_por uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: comparendos
-- ============================================================
create table comparendos (
  id uuid primary key default uuid_generate_v4(),
  contrato_id uuid references contratos(id) on delete restrict not null,
  fecha_notificacion date not null,
  fecha_limite_pago date not null,
  descripcion text not null,
  monto integer,
  estado estado_comparendo default 'pendiente' not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: liquidaciones
-- ============================================================
create table liquidaciones (
  id uuid primary key default uuid_generate_v4(),
  contrato_id uuid references contratos(id) on delete restrict not null unique,
  ahorro_total integer not null,
  deposito integer not null,
  descuento_multas integer default 0 not null,
  descuento_daños integer default 0 not null,
  descuento_comparendos integer default 0 not null,
  total_a_devolver integer generated always as (
    ahorro_total + deposito - descuento_multas - descuento_daños - descuento_comparendos
  ) stored,
  razon_terminacion razon_terminacion not null,
  notas text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table perfiles enable row level security;
alter table vehiculos enable row level security;
alter table conductores enable row level security;
alter table entrevistas enable row level security;
alter table contratos enable row level security;
alter table pagos enable row level security;
alter table aplazatorias_solicitudes enable row level security;
alter table comparendos enable row level security;
alter table liquidaciones enable row level security;

-- Helper: verificar si el usuario es del equipo
create or replace function es_equipo()
returns boolean language sql security definer as $$
  select exists (
    select 1 from perfiles
    where user_id = auth.uid() and rol = 'equipo'
  );
$$;

-- Helper: obtener el contrato_id del conductor autenticado
create or replace function mi_contrato_id()
returns uuid language sql security definer as $$
  select c.id from contratos c
  inner join conductores co on co.id = c.conductor_id
  where co.user_id = auth.uid() and c.estado = 'activo'
  limit 1;
$$;

-- PERFILES: cada usuario ve solo su perfil; equipo ve todos
create policy "perfil_propio" on perfiles for select
  using (user_id = auth.uid() or es_equipo());

create policy "perfil_insert_admin" on perfiles for insert
  with check (es_equipo());

create policy "perfil_update_admin" on perfiles for update
  using (es_equipo());

-- VEHICULOS: equipo tiene acceso completo; conductores solo leen
create policy "vehiculos_equipo" on vehiculos for all
  using (es_equipo());

create policy "vehiculos_conductor_select" on vehiculos for select
  using (true);

-- CONDUCTORES: equipo acceso completo; conductor ve solo su registro
create policy "conductores_equipo" on conductores for all
  using (es_equipo());

create policy "conductor_propio" on conductores for select
  using (user_id = auth.uid());

-- ENTREVISTAS: solo equipo
create policy "entrevistas_equipo" on entrevistas for all
  using (es_equipo());

-- CONTRATOS: equipo acceso completo; conductor ve solo el suyo
create policy "contratos_equipo" on contratos for all
  using (es_equipo());

create policy "contrato_propio" on contratos for select
  using (
    conductor_id in (
      select id from conductores where user_id = auth.uid()
    )
  );

-- PAGOS: equipo acceso completo; conductor ve y crea sus pagos
create policy "pagos_equipo" on pagos for all
  using (es_equipo());

create policy "pagos_conductor_select" on pagos for select
  using (contrato_id = mi_contrato_id());

create policy "pagos_conductor_insert" on pagos for insert
  with check (contrato_id = mi_contrato_id());

create policy "pagos_conductor_update_comprobante" on pagos for update
  using (contrato_id = mi_contrato_id() and estado = 'pendiente')
  with check (contrato_id = mi_contrato_id());

-- APLAZATORIAS: equipo acceso completo; conductor solicita las suyas
create policy "aplazatorias_equipo" on aplazatorias_solicitudes for all
  using (es_equipo());

create policy "aplazatorias_conductor_select" on aplazatorias_solicitudes for select
  using (contrato_id = mi_contrato_id());

create policy "aplazatorias_conductor_insert" on aplazatorias_solicitudes for insert
  with check (contrato_id = mi_contrato_id());

-- COMPARENDOS: solo equipo puede crear; conductor puede ver los suyos
create policy "comparendos_equipo" on comparendos for all
  using (es_equipo());

create policy "comparendos_conductor_select" on comparendos for select
  using (contrato_id = mi_contrato_id());

-- LIQUIDACIONES: solo equipo
create policy "liquidaciones_equipo" on liquidaciones for all
  using (es_equipo());

-- ============================================================
-- TRIGGER: actualizar estado del vehículo al crear/cerrar contrato
-- ============================================================
create or replace function sync_estado_vehiculo()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update vehiculos set estado = 'arrendado' where id = NEW.vehiculo_id;
  elsif TG_OP = 'UPDATE' and NEW.estado in ('terminado', 'comprado') then
    update vehiculos set estado = 'disponible' where id = NEW.vehiculo_id;
  end if;
  return NEW;
end;
$$;

create trigger trg_sync_vehiculo
after insert or update on contratos
for each row execute function sync_estado_vehiculo();

-- ============================================================
-- TRIGGER: recalcular ahorro y bonos al verificar pago
-- ============================================================
create or replace function recalcular_contrato()
returns trigger language plpgsql as $$
begin
  if NEW.estado = 'verificado' and OLD.estado != 'verificado' and NEW.tipo = 'canon' then
    update contratos set
      semanas_pagadas = semanas_pagadas + 1,
      ahorro_acumulado = ahorro_acumulado + 80000,
      bonos_acumulados = bonos_acumulados + 120000
    where id = NEW.contrato_id;
  end if;
  return NEW;
end;
$$;

create trigger trg_recalcular_contrato
after update on pagos
for each row execute function recalcular_contrato();

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrar usuario
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into perfiles (user_id, rol, nombre_completo)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'rol', 'conductor')::rol_usuario,
    coalesce(NEW.raw_user_meta_data->>'nombre_completo', NEW.email)
  );
  return NEW;
end;
$$;

create trigger trg_new_user
after insert on auth.users
for each row execute function handle_new_user();

-- ============================================================
-- STORAGE: bucket para comprobantes de pago
-- ============================================================
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false);

-- Solo el conductor dueño del contrato puede subir comprobantes
create policy "comprobantes_conductor_upload" on storage.objects
  for insert with check (
    bucket_id = 'comprobantes' and
    auth.uid() is not null
  );

-- Conductor y equipo pueden ver comprobantes
create policy "comprobantes_select" on storage.objects
  for select using (bucket_id = 'comprobantes');

-- Equipo puede eliminar comprobantes
create policy "comprobantes_equipo_delete" on storage.objects
  for delete using (
    bucket_id = 'comprobantes' and es_equipo()
  );
