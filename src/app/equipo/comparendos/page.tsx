import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'
import ComparendoForm from './ComparendoForm'
import { marcarPagado } from './actions'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
}

export default async function ComparendosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: comparendos }, { data: contratos }] = await Promise.all([
    supabase
      .from('comparendos')
      .select(`
        id, fecha_notificacion, fecha_limite_pago, descripcion, monto, estado, created_at,
        contratos(conductores(nombre_completo), vehiculos(placa))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('contratos')
      .select('id, conductores(nombre_completo), vehiculos(placa)')
      .eq('estado', 'activo'),
  ])

  const hoy = new Date()
  const pendientes = comparendos?.filter((c) => c.estado === 'pendiente') ?? []
  const resueltos = comparendos?.filter((c) => c.estado !== 'pendiente') ?? []

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Comparendos</h1>
        <p className="text-gray-400 text-sm">{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Formulario nuevo comparendo */}
      <ComparendoForm contratos={(contratos ?? []) as { id: string; conductores: { nombre_completo: string } | null; vehiculos: { placa: string } | null }[]} />

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendientes</h2>
          {pendientes.map((c) => {
            const contrato = c.contratos as { conductores: { nombre_completo: string } | null; vehiculos: { placa: string } | null } | null
            const diasRestantes = differenceInDays(parseISO(c.fecha_limite_pago), hoy)
            const urgente = diasRestantes <= 10

            return (
              <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${urgente ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="px-4 py-3 border-b border-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{contrato?.conductores?.nombre_completo ?? '—'}</p>
                      <p className="text-xs text-gray-400">{contrato?.vehiculos?.placa}</p>
                    </div>
                    {urgente && (
                      <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle size={10} /> {diasRestantes}d
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1 text-sm">
                  <p className="text-gray-700">{c.descripcion}</p>
                  {c.monto && (
                    <p className="text-gray-500">Monto: <span className="font-medium text-gray-900">{formatCOP(c.monto)}</span></p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Notificado: {format(parseISO(c.fecha_notificacion), "d MMM", { locale: es })}</span>
                    <span>Límite: {format(parseISO(c.fecha_limite_pago), "d MMM", { locale: es })}</span>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <form action={marcarPagado.bind(null, c.id) as unknown as () => Promise<void>}>
                    <button
                      type="submit"
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Marcar pagado
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resueltos */}
      {resueltos.length > 0 && (
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <summary className="px-4 py-3 text-sm text-gray-500 cursor-pointer select-none">
            {resueltos.length} resuelto{resueltos.length !== 1 ? 's' : ''}
          </summary>
          <div className="px-4 pb-3 space-y-1">
            {resueltos.map((c) => {
              const contrato = c.contratos as { conductores: { nombre_completo: string } | null } | null
              return (
                <div key={c.id} className="text-sm text-gray-400 py-1.5 border-t border-gray-50 flex justify-between">
                  <span>{contrato?.conductores?.nombre_completo ?? '—'} — {c.descripcion}</span>
                  <span className="text-xs">{c.estado}</span>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}
