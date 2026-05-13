import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatFecha } from '@/lib/date/colombia'
import Link from 'next/link'
import { Users, ChevronRight, CheckCircle2, XCircle, Clock, Pencil } from 'lucide-react'
import { avanzarPipeline, rechazarConductor } from './actions'

const ESTADOS: Record<string, { label: string; cls: string }> = {
  formulario:          { label: 'Formulario',       cls: 'bg-gray-100 text-gray-600' },
  visita_local:        { label: 'Visita local',     cls: 'bg-yellow-100 text-yellow-700' },
  visita_domiciliaria: { label: 'Visita domicilio', cls: 'bg-orange-100 text-orange-600' },
  aprobado:            { label: 'Aprobado',         cls: 'bg-green-100 text-green-700' },
  rechazado:           { label: 'Rechazado',        cls: 'bg-red-100 text-red-600' },
}

const SIGUIENTE: Record<string, string> = {
  formulario:          'Pasar a visita local',
  visita_local:        'Pasar a visita domiciliaria',
  visita_domiciliaria: 'Aprobar conductor',
}

export default async function ConductoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductores } = await supabase
    .from('conductores')
    .select('id, nombre_completo, cedula, telefono, email, estado_solicitud, tiene_licencia, created_at')
    .order('created_at', { ascending: false })

  const activos = conductores?.filter((c) => c.estado_solicitud !== 'rechazado') ?? []
  const rechazados = conductores?.filter((c) => c.estado_solicitud === 'rechazado') ?? []

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Conductores</h1>
          <p className="text-gray-400 text-sm">{activos.length} en pipeline</p>
        </div>
        <Link
          href="/registro"
          className="text-xs bg-gray-900 text-white px-3 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          + Registro público
        </Link>
      </div>

      {activos.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <Users className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Sin conductores en pipeline</p>
        </div>
      )}

      <div className="space-y-2">
        {activos.map((c) => {
          const estado = ESTADOS[c.estado_solicitud]
          const labelSiguiente = SIGUIENTE[c.estado_solicitud]

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Link
                href={`/equipo/conductores/${c.id}`}
                className="block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      {c.nombre_completo}
                      <Pencil size={11} className="text-gray-300" />
                    </p>
                    <p className="text-xs text-gray-400">CC {c.cedula} · {c.telefono}</p>
                  </div>
                  {estado && (
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>{estado.label}</span>
                  )}
                </div>
              </Link>

              <div className="px-4 py-2 text-xs text-gray-500 flex gap-4">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatFecha(c.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span>{c.tiene_licencia ? '✓ Licencia' : '✗ Sin licencia'}</span>
              </div>

              {c.estado_solicitud !== 'aprobado' && (
                <div className="px-4 pb-3 flex gap-2">
                  {labelSiguiente && (
                    <form action={avanzarPipeline.bind(null, c.id) as unknown as () => Promise<void>} className="flex-1">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-xl py-2 transition-colors"
                      >
                        <ChevronRight size={13} /> {labelSiguiente}
                      </button>
                    </form>
                  )}
                  <form action={rechazarConductor.bind(null, c.id) as unknown as () => Promise<void>}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs px-2 py-2 transition-colors"
                    >
                      <XCircle size={13} /> Rechazar
                    </button>
                  </form>
                </div>
              )}

              {c.estado_solicitud === 'aprobado' && (
                <div className="px-4 pb-3">
                  <Link
                    href={`/equipo/contratos/nuevo?conductor_id=${c.id}`}
                    className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl py-2 transition-colors"
                  >
                    <CheckCircle2 size={13} /> Crear contrato
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {rechazados.length > 0 && (
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer select-none">
            {rechazados.length} rechazado{rechazados.length !== 1 ? 's' : ''}
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {rechazados.map((c) => (
              <div key={c.id} className="text-sm text-gray-400 py-1 border-t border-gray-50">
                {c.nombre_completo} — CC {c.cedula}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
