import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatFecha } from '@/lib/date/colombia'
import {
  ClipboardList,
  ChevronRight,
  Eye,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { avanzarPipeline } from './actions'

const ESTADOS: Record<string, { label: string; cls: string }> = {
  formulario: { label: 'Formulario', cls: 'bg-gray-100 text-gray-600' },
  visita_local: { label: 'Visita local', cls: 'bg-yellow-100 text-yellow-700' },
  visita_domiciliaria: { label: 'Visita domicilio', cls: 'bg-orange-100 text-orange-600' },
  aprobada: { label: 'Aprobada', cls: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', cls: 'bg-red-100 text-red-600' },
}

const SIGUIENTE: Record<string, string> = {
  formulario: 'Pasar a visita local',
  visita_local: 'Pasar a visita domiciliaria',
}

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: solicitudes } = await supabase
    .from('solicitudes')
    .select(
      'id, nombre_completo, cedula, telefono, estado, tiene_licencia, created_at, conductor_id',
    )
    .order('created_at', { ascending: false })

  const activas = solicitudes?.filter((s) => s.estado !== 'rechazada' && s.estado !== 'aprobada') ?? []
  const aprobadas = solicitudes?.filter((s) => s.estado === 'aprobada') ?? []
  const rechazadas = solicitudes?.filter((s) => s.estado === 'rechazada') ?? []

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-400 text-sm">
            {activas.length} en revisión · {aprobadas.length} aprobadas · {rechazadas.length} rechazadas
          </p>
        </div>
        <Link
          href="/solicitud"
          className="text-xs bg-gray-900 text-white px-3 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          + Formulario público
        </Link>
      </div>

      {activas.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <ClipboardList className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Sin solicitudes en revisión</p>
        </div>
      )}

      <div className="space-y-2">
        {activas.map((s) => {
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
                    <p className="text-xs text-gray-400">
                      CC {s.cedula} · {s.telefono}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>
                    {estado.label}
                  </span>
                </div>
              </Link>

              <div className="px-4 py-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                <span>{s.tiene_licencia ? '✓ Licencia' : '✗ Sin licencia'}</span>
                <span>·</span>
                <span>
                  {formatFecha(s.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
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
