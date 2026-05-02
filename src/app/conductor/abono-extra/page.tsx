import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingDown, Sparkles } from 'lucide-react'
import { AbonoExtraForm } from './AbonoExtraForm'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(v)
}

export default async function AbonoExtraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!conductor) {
    return <div className="p-6 text-center text-gray-500">Perfil no encontrado.</div>
  }

  const { data: contrato } = await supabase
    .from('contratos')
    .select(
      'id, valor_comercial_acordado, ahorro_acumulado, bonos_acumulados, abonos_extras_acumulados, semanas_pagadas',
    )
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()
  if (!contrato) {
    return <div className="p-6 text-center text-gray-500">Sin contrato activo.</div>
  }

  const abonado =
    contrato.ahorro_acumulado + contrato.bonos_acumulados + contrato.abonos_extras_acumulados
  const restante = Math.max(contrato.valor_comercial_acordado - abonado, 0)
  const semanasRestantes = Math.ceil(restante / 200_000)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <Link
        href="/conductor/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
      >
        <ArrowLeft size={14} /> Volver
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Abono extraordinario</h1>
        <p className="text-gray-400 text-sm">
          Adelanta el pago del vehículo y reduce semanas
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-purple-500" size={18} />
          <span className="text-sm font-medium text-gray-700">Cómo funciona</span>
        </div>
        <p className="text-xs text-gray-600">
          Cualquier monto que abones se aplica directamente al saldo del vehículo
          (${(200000).toLocaleString('es-CO')} = 1 semana menos). Sigues pagando el canon semanal
          hasta completar el valor total. Los abonos extras{' '}
          <span className="font-semibold">no son reembolsables</span>.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Saldo restante</span>
          <span className="font-bold text-gray-900">{formatCOP(restante)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500">Semanas restantes (sin abono)</span>
          <span className="font-medium text-gray-700">{semanasRestantes}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500">Abonos extras acumulados</span>
          <span className="font-medium text-purple-600">
            {formatCOP(contrato.abonos_extras_acumulados)}
          </span>
        </div>
      </div>

      <AbonoExtraForm restante={restante} />

      <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
        <TrendingDown className="text-yellow-600 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-yellow-800">
          Recuerda: el equipo debe verificar tu comprobante antes de descontar las semanas.
        </p>
      </div>
    </div>
  )
}
