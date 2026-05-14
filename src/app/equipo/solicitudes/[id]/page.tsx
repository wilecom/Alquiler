import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { fmtDiaMesAño, fmtFechaHoraCorta } from '@/lib/date/colombia'
import {
  ArrowLeft,
  ArrowRight,
  User,
  IdCard,
  AlertTriangle,
  Briefcase,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { AccionesSolicitud } from './AccionesSolicitud'

const ESTADOS: Record<string, { label: string; cls: string }> = {
  formulario: { label: 'Formulario', cls: 'bg-gray-100 text-gray-600' },
  verificacion_documentos: { label: 'Verif. SIMIT/policía', cls: 'bg-blue-100 text-blue-700' },
  visita_local: { label: 'Visita local', cls: 'bg-yellow-100 text-yellow-700' },
  visita_domiciliaria: { label: 'Visita domicilio', cls: 'bg-orange-100 text-orange-600' },
  aprobada: { label: 'Aprobada', cls: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', cls: 'bg-red-100 text-red-600' },
}

const VIVIENDA_LABEL: Record<string, string> = {
  propia: 'Propia',
  familiar: 'Familiar',
  arrendada: 'Arrendada',
}

const PARQUEO_LABEL: Record<string, string> = {
  parqueadero_propio: 'Parqueadero propio',
  parqueadero_arrendado: 'Parqueadero arrendado',
  garaje_casa: 'Garaje de la casa',
  calle: 'Calle',
  otro: 'Otro',
}

const RELACION_LABEL: Record<string, string> = {
  padre: 'Padre',
  madre: 'Madre',
  hermano: 'Hermano(a)',
  pareja: 'Pareja',
  amigo: 'Amigo(a)',
  familiar: 'Familiar',
  jefe: 'Jefe',
  otro: 'Otro',
}

function fmtCOP(monto: number) {
  return monto.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
}

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('id', id)
    .single()

  if (!solicitud) notFound()

  const { data: codeudores } = await supabase
    .from('solicitud_codeudores')
    .select('*')
    .eq('solicitud_id', id)
    .order('orden', { ascending: true })

  const tieneCodeudores = (codeudores?.length ?? 0) > 0
  const tieneBarrioDireccion =
    !!solicitud.barrio || !!solicitud.direccion || !!solicitud.tipo_vivienda
  const tieneSuspensiones = solicitud.licencia_suspendida_antes
  const tieneTrabajoUso =
    !!solicitud.ocupacion ||
    solicitud.ingreso_mensual_estimado !== null ||
    solicitud.anos_actividad !== null ||
    !!solicitud.plataformas_detalle ||
    !!solicitud.lugar_parqueo

  const estado = ESTADOS[solicitud.estado] ?? { label: solicitud.estado, cls: 'bg-gray-100' }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <Link
        href="/equipo/solicitudes"
        className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 pt-2"
      >
        <ArrowLeft size={13} /> Solicitudes
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{solicitud.nombre_completo}</h1>
          <p className="text-gray-400 text-sm">
            CC {solicitud.cedula} · enviada {fmtFechaHoraCorta(solicitud.created_at)}
          </p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>
          {estado.label}
        </span>
      </div>

      {solicitud.estado === 'aprobada' && solicitud.conductor_id && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center justify-between">
          <span>Solicitud aprobada. Conductor creado.</span>
          <Link
            href={`/equipo/conductores/${solicitud.conductor_id}`}
            className="text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
          >
            Ver conductor <ArrowRight size={13} />
          </Link>
        </div>
      )}
      {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 space-y-1">
          <p className="font-medium">Solicitud rechazada</p>
          <p className="text-red-700">{solicitud.motivo_rechazo}</p>
        </div>
      )}

      <AccionesSolicitud solicitudId={solicitud.id} estado={solicitud.estado} />

      <Section icon={<User size={16} className="text-orange-500" />} title="Datos personales">
        <Row label="Nombre" value={solicitud.nombre_completo} />
        <Row label="Cédula" value={solicitud.cedula} />
        <Row label="Edad" value={`${solicitud.edad} años`} />
        <Row label="Teléfono" value={solicitud.telefono} />
        <Row label="Email" value={solicitud.email} />
        {tieneBarrioDireccion && (
          <>
            {solicitud.barrio && <Row label="Barrio" value={solicitud.barrio} />}
            {solicitud.direccion && <Row label="Dirección" value={solicitud.direccion} />}
            {solicitud.tipo_vivienda && (
              <Row label="Tipo de vivienda" value={VIVIENDA_LABEL[solicitud.tipo_vivienda]} />
            )}
          </>
        )}
      </Section>

      <Section icon={<IdCard size={16} className="text-orange-500" />} title="Licencia de conducción">
        <Row label="Tiene licencia vigente" value={solicitud.tiene_licencia ? 'Sí' : 'No'} />
        {solicitud.tiene_licencia && solicitud.categoria_licencia && (
          <Row label="Categoría" value={solicitud.categoria_licencia} />
        )}
        {tieneSuspensiones && (
          <>
            <Row label="Suspensiones previas" value="Sí" />
            {solicitud.detalle_suspensiones && (
              <Row label="Detalle" value={solicitud.detalle_suspensiones} />
            )}
          </>
        )}
      </Section>

      <Section icon={<AlertTriangle size={16} className="text-orange-500" />} title="Comparendos">
        <Row
          label="Pendientes"
          value={solicitud.tiene_comparendos_pendientes ? 'Sí' : 'No'}
        />
        {solicitud.tiene_comparendos_pendientes && (
          <>
            <Row label="Cantidad" value={solicitud.cantidad_comparendos.toString()} />
            {solicitud.motivos_comparendos && (
              <Row label="Motivos" value={solicitud.motivos_comparendos} />
            )}
          </>
        )}
      </Section>

      {/* 4. Trabajo y uso (solo aparece cuando el equipo registra los datos manualmente más adelante) */}
      {tieneTrabajoUso && (
        <Section icon={<Briefcase size={16} className="text-orange-500" />} title="Trabajo, ingresos y uso">
          {solicitud.ocupacion && <Row label="Ocupación" value={solicitud.ocupacion} />}
          {solicitud.ingreso_mensual_estimado !== null && (
            <Row label="Ingreso mensual estimado" value={fmtCOP(solicitud.ingreso_mensual_estimado)} />
          )}
          {solicitud.anos_actividad !== null && (
            <Row label="Años en la actividad" value={solicitud.anos_actividad.toString()} />
          )}
          <Row label="Uso del vehículo" value={solicitud.uso_plataformas ? 'Plataformas' : 'Uso propio'} />
          {solicitud.plataformas_detalle && (
            <Row label="Plataformas" value={solicitud.plataformas_detalle} />
          )}
          {solicitud.lugar_parqueo && (
            <Row
              label="Dónde parquea"
              value={PARQUEO_LABEL[solicitud.lugar_parqueo] ?? solicitud.lugar_parqueo}
            />
          )}
        </Section>
      )}

      {tieneCodeudores && (
        <Section icon={<Users size={16} className="text-orange-500" />} title="Codeudores">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {codeudores!.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700">Codeudor {c.orden}</p>
                <Row label="Nombre" value={c.nombre_completo} compact />
                <Row label="Cédula" value={c.cedula} compact />
                <Row label="Teléfono" value={c.telefono} compact />
                <Row label="Relación" value={RELACION_LABEL[c.relacion] ?? c.relacion} compact />
                <Row label="Ocupación" value={c.ocupacion} compact />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon={<ShieldCheck size={16} className="text-orange-500" />} title="Autorización de tratamiento de datos">
        <Row label="Aceptación" value={solicitud.acepta_habeas_data ? 'Sí' : 'No'} />
        <Row label="Fecha" value={fmtDiaMesAño(solicitud.firma_timestamp)} />
        <Row label="Hora exacta" value={fmtFechaHoraCorta(solicitud.firma_timestamp)} />
        {solicitud.firma_ip && <Row label="IP" value={solicitud.firma_ip} />}
        {solicitud.firma_user_agent && (
          <Row label="Dispositivo" value={solicitud.firma_user_agent} />
        )}
      </Section>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <header className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </header>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function Row({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="text-xs">
        <span className="text-gray-400">{label}: </span>
        <span className="text-gray-800">{value}</span>
      </div>
    )
  }
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 text-right break-words">{value}</span>
    </div>
  )
}
