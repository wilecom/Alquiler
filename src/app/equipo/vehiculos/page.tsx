import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Car } from 'lucide-react'
import VehiculoForm from './VehiculoForm'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
}

const ESTADO_V: Record<string, { label: string; cls: string }> = {
  disponible: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
  arrendado:  { label: 'Arrendado',  cls: 'bg-blue-100 text-blue-700' },
  inactivo:   { label: 'Inactivo',   cls: 'bg-gray-100 text-gray-500' },
}

export default async function VehiculosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('id, marca, modelo, color, placa, numero_chasis, numero_motor, valor_comercial, estado')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Vehículos</h1>
        <p className="text-gray-400 text-sm">{vehiculos?.length ?? 0} registrado{(vehiculos?.length ?? 0) !== 1 ? 's' : ''}</p>
      </div>

      <VehiculoForm />

      {vehiculos?.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <Car className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Sin vehículos registrados</p>
        </div>
      )}

      <div className="space-y-2">
        {vehiculos?.map((v) => {
          const estado = ESTADO_V[v.estado]
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{v.marca} {v.modelo} — {v.color}</p>
                  <p className="text-xs text-gray-400 font-mono">{v.placa}</p>
                </div>
                {estado && (
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>{estado.label}</span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                <p>Chasis: <span className="font-mono">{v.numero_chasis}</span></p>
                <p>Motor: <span className="font-mono">{v.numero_motor}</span></p>
                <p>Valor comercial: <span className="font-medium text-gray-900">{formatCOP(v.valor_comercial)}</span></p>
              </div>
              {v.estado === 'disponible' && (
                <p className="text-xs text-gray-400 mt-1 font-mono select-all bg-gray-50 rounded px-2 py-1">{v.id}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
