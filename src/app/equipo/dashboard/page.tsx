import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addWeeks, parseISO, isPast, format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import {
  Users, CreditCard, CalendarOff, AlertTriangle,
  TrendingUp, Clock, AlertCircle, PlusCircle,
} from 'lucide-react'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
}

const ESTADO_PAGO_LABEL: Record<string, { label: string; cls: string }> = {
  pendiente:          { label: 'Pendiente',     cls: 'bg-yellow-100 text-yellow-700' },
  comprobante_subido: { label: 'Por verificar', cls: 'bg-blue-100 text-blue-700' },
  verificado:         { label: 'Verificado',    cls: 'bg-green-100 text-green-700' },
  rechazado:          { label: 'Rechazado',     cls: 'bg-red-100 text-red-700' },
}

export default async function EquipoDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hoy = new Date()

  const [
    { count: contratosActivos },
    { count: pagosPorVerificar },
    { count: aplazatoriasPendientes },
    { data: contratos },
  ] = await Promise.all([
    supabase.from('contratos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('pagos').select('*', { count: 'exact', head: true }).eq('estado', 'comprobante_subido'),
    supabase.from('aplazatorias_solicitudes').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('contratos').select(`
      id, semanas_pagadas, semanas_aplazatorias, semanas_para_compra, primer_pago_fecha,
      conductores(nombre_completo),
      vehiculos(marca, modelo, placa),
      pagos(id, estado, created_at)
    `).eq('estado', 'activo').order('created_at', { ascending: false }),
  ])

  const filas = (contratos ?? []).map((c) => {
    const semanasProcesadas = c.semanas_pagadas + c.semanas_aplazatorias
    const proximaFecha = addWeeks(parseISO(c.primer_pago_fecha), semanasProcesadas)
    const enMora = isPast(proximaFecha)
    const pagosArr = (c.pagos as { id: string; estado: string; created_at: string }[] | null) ?? []
    const ultimoPago = pagosArr.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    return {
      id: c.id,
      proximaFecha,
      enMora,
      ultimoPago,
      semanas_pagadas: c.semanas_pagadas,
      semanas_para_compra: c.semanas_para_compra,
      conductor: c.conductores as { nombre_completo: string } | null,
      vehiculo: c.vehiculos as { marca: string; modelo: number; placa: string } | null,
    }
  })

  const enMoraCount = filas.filter((f) => f.enMora).length

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Panel de control</h1>
        <p className="text-gray-400 text-sm capitalize">{format(hoy, "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/equipo/pagos" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={15} className="text-purple-500" />
            <p className="text-xs text-gray-400">Por verificar</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pagosPorVerificar ?? 0}</p>
        </Link>

        <div className={`rounded-2xl p-4 border shadow-sm ${enMoraCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={15} className={enMoraCount > 0 ? 'text-red-500' : 'text-gray-400'} />
            <p className="text-xs text-gray-400">En mora</p>
          </div>
          <p className={`text-3xl font-bold ${enMoraCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{enMoraCount}</p>
        </div>

        <Link href="/equipo/aplazatorias" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <CalendarOff size={15} className="text-orange-500" />
            <p className="text-xs text-gray-400">Aplazatorias pend.</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{aplazatoriasPendientes ?? 0}</p>
        </Link>

        <Link href="/equipo/conductores" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <Users size={15} className="text-blue-500" />
            <p className="text-xs text-gray-400">Contratos activos</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{contratosActivos ?? 0}</p>
        </Link>
      </div>

      {/* Contratos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Contratos activos</h2>
          <Link href="/equipo/contratos/nuevo" className="flex items-center gap-1 text-xs text-blue-600 font-medium">
            <PlusCircle size={13} /> Nuevo
          </Link>
        </div>

        <div className="space-y-2">
          {filas.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <TrendingUp className="mx-auto text-gray-200 mb-2" size={32} />
              <p className="text-gray-400 text-sm">No hay contratos activos.</p>
            </div>
          )}
          {filas.map((f) => {
            const estadoPago = f.ultimoPago ? ESTADO_PAGO_LABEL[f.ultimoPago.estado] : null
            return (
              <div
                key={f.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm ${f.enMora ? 'border-red-200' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{f.conductor?.nombre_completo ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {f.vehiculo?.marca} {f.vehiculo?.modelo} · {f.vehiculo?.placa}
                    </p>
                  </div>
                  {f.enMora ? (
                    <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle size={11} /> Mora
                    </span>
                  ) : estadoPago ? (
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${estadoPago.cls}`}>{estadoPago.label}</span>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {f.semanas_pagadas}/{f.semanas_para_compra} sem.
                  </span>
                  <span>
                    Próximo:{' '}
                    <span className={f.enMora ? 'text-red-600 font-medium' : ''}>
                      {format(f.proximaFecha, "d MMM", { locale: es })}
                    </span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
