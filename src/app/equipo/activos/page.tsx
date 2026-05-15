import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Car, ChevronRight, User } from 'lucide-react'
import { fmtDiaMesCorto } from '@/lib/date/colombia'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(v)
}

const ESTADO: Record<string, { label: string; cls: string }> = {
  activo:    { label: 'Activo',    cls: 'bg-green-100 text-green-700' },
  terminado: { label: 'Terminado', cls: 'bg-gray-200 text-gray-700' },
  comprado:  { label: 'Comprado',  cls: 'bg-blue-100 text-blue-700' },
}

type Vehiculo = {
  placa: string
  marca: string
  modelo: number
  color: string
}

type Conductor = {
  nombre_completo: string
  cedula: string
}

type Contrato = {
  id: string
  estado: 'activo' | 'terminado' | 'comprado'
  semanas_pagadas: number
  semanas_para_compra: number
  fecha_inicio: string
  conductor_id: string
  vehiculos: Vehiculo | null
  conductores: Conductor | null
}

export default async function ActivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contratos } = await supabase
    .from('contratos')
    .select(`
      id, estado, semanas_pagadas, semanas_para_compra, fecha_inicio, conductor_id,
      vehiculos ( placa, marca, modelo, color ),
      conductores ( nombre_completo, cedula )
    `)
    .order('created_at', { ascending: false })

  const lista = (contratos ?? []) as unknown as Contrato[]
  const activos = lista.filter((c) => c.estado === 'activo')

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Activos</h1>
        <p className="text-gray-400 text-sm">
          {activos.length} {activos.length === 1 ? 'vehículo activo' : 'vehículos activos'}
        </p>
      </div>

      {activos.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100">
          No hay vehículos activos.
        </div>
      )}

      <div className="space-y-3">
        {activos.map((c) => {
          const v = c.vehiculos
          const cond = c.conductores
          const estado = ESTADO[c.estado]
          const progreso = c.semanas_para_compra > 0
            ? Math.min(100, Math.round((c.semanas_pagadas / c.semanas_para_compra) * 100))
            : 0

          return (
            <Link
              key={c.id}
              href={`/equipo/activos/${c.id}`}
              className="block bg-white rounded-xl border border-gray-100 hover:border-orange-500 hover:shadow-sm transition-all"
            >
              <div className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
                  <Car size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-lg tracking-wide">
                      {v?.placa ?? '—'}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estado?.cls ?? ''}`}>
                      {estado?.label ?? c.estado}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 truncate">
                    {v ? `${v.marca} ${v.modelo} · ${v.color}` : 'Sin vehículo'}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                    <User size={14} className="text-gray-400" />
                    <span className="truncate">{cond?.nombre_completo ?? 'Sin conductor'}</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                      <span>
                        Semana {c.semanas_pagadas} / {c.semanas_para_compra}
                      </span>
                      <span className="font-medium text-gray-700">{progreso}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-gray-400">
                    Desde {fmtDiaMesCorto(c.fecha_inicio)}
                  </p>
                </div>

                <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
