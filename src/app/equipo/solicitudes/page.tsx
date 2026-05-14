import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatFecha, fmtDiaMesCorto } from '@/lib/date/colombia'
import {
  ClipboardList,
  ChevronRight,
  Eye,
  CheckCircle2,
  ArrowRight,
  LayoutGrid,
  List,
} from 'lucide-react'
import { avanzarPipeline } from './actions'
import { SyncDesdeSheetButton } from './SyncDesdeSheetButton'

const ESTADOS: Record<string, { label: string; cls: string }> = {
  formulario: { label: 'Formulario', cls: 'bg-gray-100 text-gray-600' },
  verificacion_documentos: { label: 'Verif. SIMIT/policía', cls: 'bg-blue-100 text-blue-700' },
  visita_local: { label: 'Visita local', cls: 'bg-yellow-100 text-yellow-700' },
  visita_domiciliaria: { label: 'Visita domicilio', cls: 'bg-orange-100 text-orange-600' },
  aprobada: { label: 'Aprobada', cls: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', cls: 'bg-red-100 text-red-600' },
}

const SIGUIENTE: Record<string, string> = {
  formulario: 'Pasar a verificación SIMIT/policía',
  verificacion_documentos: 'Pasar a visita local',
  visita_local: 'Pasar a visita domiciliaria',
}

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'formulario', label: 'Formulario' },
  { key: 'verificacion_documentos', label: 'Verif. SIMIT' },
  { key: 'visita_local', label: 'Visita local' },
  { key: 'visita_domiciliaria', label: 'Visita domicilio' },
] as const

type Solicitud = {
  id: string
  nombre_completo: string
  cedula: string
  telefono: string
  estado: string
  tiene_licencia: boolean
  created_at: string
  conductor_id: string | null
}

function buildQs(view: string, estado?: string) {
  const p = new URLSearchParams()
  p.set('view', view)
  if (estado && estado !== 'todas') p.set('estado', estado)
  return p.toString()
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; estado?: string }>
}) {
  const { view: viewRaw, estado: estadoRaw } = await searchParams
  const view: 'tarjetas' | 'lista' = viewRaw === 'lista' ? 'lista' : 'tarjetas'
  const filtroEstado = estadoRaw ?? 'todas'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: solicitudes } = await supabase
    .from('solicitudes')
    .select(
      'id, nombre_completo, cedula, telefono, estado, tiene_licencia, created_at, conductor_id',
    )
    .order('created_at', { ascending: false })

  const all: Solicitud[] = solicitudes ?? []
  const activasAll = all.filter((s) => s.estado !== 'rechazada' && s.estado !== 'aprobada')
  const aprobadas = all.filter((s) => s.estado === 'aprobada')
  const rechazadas = all.filter((s) => s.estado === 'rechazada')

  const activas =
    filtroEstado === 'todas'
      ? activasAll
      : activasAll.filter((s) => s.estado === filtroEstado)

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-400 text-sm">
            {activasAll.length} en revisión · {aprobadas.length} aprobadas · {rechazadas.length} rechazadas
          </p>
        </div>
        <Link
          href="/solicitud"
          className="text-xs bg-gray-900 text-white px-3 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          + Formulario público
        </Link>
      </div>

      <SyncDesdeSheetButton
        sheetUrl={
          process.env.SOLICITUDES_SHEET_ID
            ? `https://docs.google.com/spreadsheets/d/${process.env.SOLICITUDES_SHEET_ID}/edit`
            : undefined
        }
      />

      {/* Toolbar: filtros por estado + toggle vista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500">Filtrar:</span>
          <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5">
            <Link
              href={`?${buildQs('tarjetas', filtroEstado)}`}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                view === 'tarjetas'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Vista tarjetas"
            >
              <LayoutGrid size={12} /> Tarjetas
            </Link>
            <Link
              href={`?${buildQs('lista', filtroEstado)}`}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                view === 'lista'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Vista lista"
            >
              <List size={12} /> Lista
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => {
            const count =
              f.key === 'todas'
                ? activasAll.length
                : activasAll.filter((s) => s.estado === f.key).length
            const activo = filtroEstado === f.key
            return (
              <Link
                key={f.key}
                href={`?${buildQs(view, f.key)}`}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  activo
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label} <span className="opacity-60">({count})</span>
              </Link>
            )
          })}
        </div>
      </div>

      {activas.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <ClipboardList className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">
            {filtroEstado === 'todas' ? 'Sin solicitudes en revisión' : 'Sin solicitudes en este filtro'}
          </p>
        </div>
      )}

      {view === 'tarjetas'
        ? activas.length > 0 && <VistaTarjetas solicitudes={activas} />
        : activas.length > 0 && <VistaLista solicitudes={activas} />}

      {aprobadas.length > 0 && (
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer select-none">
            {aprobadas.length} aprobada{aprobadas.length !== 1 ? 's' : ''}
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {aprobadas.map((s) => (
              <div
                key={s.id}
                className="text-sm text-gray-600 py-1 border-t border-gray-50 flex items-center justify-between"
              >
                <span>
                  {s.nombre_completo} — CC {s.cedula}
                </span>
                {s.conductor_id && (
                  <Link
                    href={`/equipo/conductores/${s.conductor_id}`}
                    className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    Ver conductor <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {rechazadas.length > 0 && (
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer select-none">
            {rechazadas.length} rechazada{rechazadas.length !== 1 ? 's' : ''}
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {rechazadas.map((s) => (
              <div key={s.id} className="text-sm text-gray-400 py-1 border-t border-gray-50">
                {s.nombre_completo} — CC {s.cedula}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function VistaTarjetas({ solicitudes }: { solicitudes: Solicitud[] }) {
  return (
    <div className="space-y-2">
      {solicitudes.map((s) => {
        const estado = ESTADOS[s.estado]
        const labelSiguiente = SIGUIENTE[s.estado]
        const enUltimaEtapa = s.estado === 'visita_domiciliaria'

        return (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Link
              href={`/equipo/solicitudes/${s.id}`}
              className="block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{s.nombre_completo}</p>
                  <p className="text-xs text-gray-400">CC {s.cedula} · {s.telefono}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>
                  {estado.label}
                </span>
              </div>
            </Link>

            <div className="px-4 py-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
              <span>{s.tiene_licencia ? '✓ Licencia' : '✗ Sin licencia'}</span>
              <span>·</span>
              <span>{formatFecha(s.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="px-4 pb-3 flex gap-2">
              {enUltimaEtapa ? (
                <Link
                  href={`/equipo/solicitudes/${s.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl py-2 transition-colors"
                >
                  <CheckCircle2 size={13} /> Revisar y aprobar
                </Link>
              ) : (
                labelSiguiente && (
                  <form
                    action={avanzarPipeline.bind(null, s.id) as unknown as () => Promise<void>}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-xl py-2 transition-colors"
                    >
                      <ChevronRight size={13} /> {labelSiguiente}
                    </button>
                  </form>
                )
              )}
              <Link
                href={`/equipo/solicitudes/${s.id}`}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs px-2 py-2 transition-colors"
              >
                <Eye size={13} /> Ver
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VistaLista({ solicitudes }: { solicitudes: Solicitud[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header solo visible en md+ */}
      <div className="hidden md:grid md:grid-cols-[1fr_110px_120px_140px_60px] gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50 text-[11px] font-medium text-gray-500 uppercase">
        <span>Solicitante</span>
        <span>Cédula</span>
        <span>Teléfono</span>
        <span>Estado</span>
        <span className="text-right">Acción</span>
      </div>
      <ul className="divide-y divide-gray-50">
        {solicitudes.map((s) => {
          const estado = ESTADOS[s.estado]
          return (
            <li
              key={s.id}
              className="px-4 py-2.5 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_110px_120px_140px_60px] gap-x-2 gap-y-1 items-center hover:bg-gray-50 transition-colors"
            >
              <Link
                href={`/equipo/solicitudes/${s.id}`}
                className="min-w-0 col-span-2 md:col-span-1"
              >
                <p className="font-medium text-sm text-gray-900 truncate">{s.nombre_completo}</p>
                <p className="text-[11px] text-gray-400 md:hidden">
                  CC {s.cedula} · {s.telefono} · {fmtDiaMesCorto(s.created_at)}
                </p>
              </Link>
              <span className="hidden md:block text-xs text-gray-600">{s.cedula}</span>
              <span className="hidden md:block text-xs text-gray-600">{s.telefono}</span>
              <span className="md:justify-self-start">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${estado.cls}`}>
                  {estado.label}
                </span>
              </span>
              <Link
                href={`/equipo/solicitudes/${s.id}`}
                className="justify-self-end text-orange-500 hover:text-orange-700"
                aria-label="Ver detalle"
              >
                <Eye size={14} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
