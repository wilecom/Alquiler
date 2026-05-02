import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Gift } from 'lucide-react'
import { CrearBeneficioForm } from './CrearBeneficioForm'
import { ToggleBeneficio } from './ToggleBeneficio'

export default async function EquipoBeneficiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contratos } = await supabase
    .from('contratos')
    .select(`
      id, semanas_pagadas,
      conductor_id,
      conductores(id, nombre_completo, cedula),
      vehiculos(placa)
    `)
    .eq('estado', 'activo')
    .order('created_at', { ascending: true })

  const conductoresIds = (contratos ?? [])
    .map((c) => {
      const cond = Array.isArray(c.conductores) ? c.conductores[0] : c.conductores
      return cond?.id
    })
    .filter((id): id is string => Boolean(id))

  const { data: beneficios } = conductoresIds.length
    ? await supabase
        .from('beneficios')
        .select('id, conductor_id, titulo, descripcion, activo, fecha_activacion, fecha_expiracion')
        .in('conductor_id', conductoresIds)
        .order('fecha_activacion', { ascending: false })
    : { data: [] }

  const benePorConductor = new Map<string, typeof beneficios>()
  for (const b of beneficios ?? []) {
    const list = benePorConductor.get(b.conductor_id) ?? []
    list.push(b)
    benePorConductor.set(b.conductor_id, list)
  }

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Beneficios</h1>
        <p className="text-gray-400 text-sm">
          Activa beneficios para conductores que pagan cumplido
        </p>
      </div>

      {(!contratos || contratos.length === 0) && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <Gift className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500">Sin contratos activos.</p>
        </div>
      )}

      <div className="space-y-4">
        {contratos?.map((contrato) => {
          const conductor = Array.isArray(contrato.conductores)
            ? contrato.conductores[0]
            : contrato.conductores
          const vehiculo = Array.isArray(contrato.vehiculos)
            ? contrato.vehiculos[0]
            : contrato.vehiculos
          if (!conductor) return null
          const lista = benePorConductor.get(conductor.id) ?? []

          return (
            <div
              key={contrato.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {conductor.nombre_completo}
                  </p>
                  <p className="text-xs text-gray-400">
                    CC {conductor.cedula} · {vehiculo?.placa ?? '—'} · Sem {contrato.semanas_pagadas}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 space-y-2">
                {lista.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sin beneficios todavía.</p>
                ) : (
                  lista.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-start justify-between gap-2 rounded-xl p-3 border ${
                        b.activo
                          ? 'bg-purple-50 border-purple-100'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            b.activo ? 'text-gray-900' : 'text-gray-500 line-through'
                          }`}
                        >
                          {b.titulo}
                        </p>
                        {b.descripcion && (
                          <p className="text-xs text-gray-500 mt-0.5">{b.descripcion}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {format(parseISO(b.fecha_activacion), "d MMM yyyy", { locale: es })}
                          {b.fecha_expiracion &&
                            ` · vence ${format(parseISO(b.fecha_expiracion), "d MMM", { locale: es })}`}
                        </p>
                      </div>
                      <ToggleBeneficio id={b.id} activo={b.activo} />
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 pb-3">
                <CrearBeneficioForm conductorId={conductor.id} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
