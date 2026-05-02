import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarOff } from 'lucide-react'
import { resolverAplazatoria } from './actions'
import { AccionesAprobarRechazar } from '@/components/AccionesAprobarRechazar'

export default async function AplazatoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: solicitudes } = await supabase
    .from('aplazatorias_solicitudes')
    .select(`
      id, semana_solicitada, estado, created_at, motivo,
      contratos(
        conductores(nombre_completo),
        vehiculos(marca, modelo, placa),
        semanas_aplazatorias
      )
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Aplazatorias</h1>
        <p className="text-gray-400 text-sm">{solicitudes?.length ?? 0} solicitud{(solicitudes?.length ?? 0) !== 1 ? 'es' : ''} pendiente{(solicitudes?.length ?? 0) !== 1 ? 's' : ''}</p>
      </div>

      {solicitudes?.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <CalendarOff className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Sin solicitudes pendientes</p>
        </div>
      )}

      <div className="space-y-3">
        {solicitudes?.map((s) => {
          const contrato = s.contratos as {
            conductores: { nombre_completo: string } | null
            vehiculos: { marca: string; modelo: number; placa: string } | null
            semanas_aplazatorias: number
          } | null

          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="font-semibold text-gray-900 text-sm">{contrato?.conductores?.nombre_completo ?? '—'}</p>
                <p className="text-xs text-gray-400">{contrato?.vehiculos?.marca} {contrato?.vehiculos?.modelo} · {contrato?.vehiculos?.placa}</p>
              </div>
              <div className="px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Semana solicitada</span>
                  <span className="text-gray-700">{format(parseISO(s.semana_solicitada), "d 'de' MMMM yyyy", { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Aplazatorias previas</span>
                  <span className="text-gray-700">{contrato?.semanas_aplazatorias ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Solicitado</span>
                  <span className="text-gray-700">{format(parseISO(s.created_at), "d MMM, HH:mm", { locale: es })}</span>
                </div>
              </div>
              {s.motivo && (
                <div className="px-4 pb-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700">
                    <span className="text-xs text-gray-400 block mb-0.5">Motivo del conductor</span>
                    {s.motivo}
                  </div>
                </div>
              )}
              <div className="px-4 pb-4">
                <AccionesAprobarRechazar
                  aprobar={resolverAplazatoria.bind(null, s.id, 'aprobada')}
                  rechazar={resolverAplazatoria.bind(null, s.id, 'rechazada')}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
