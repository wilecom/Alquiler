import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addWeeks, format, parseISO, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  Upload,
  CalendarOff,
  Sparkles,
} from 'lucide-react'

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const ESTADOS_PAGO: Record<string, { label: string; color: string; icon: React.FC<{ size?: number }> }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  comprobante_subido: { label: 'En revisión', color: 'text-blue-600 bg-blue-50', icon: Clock },
  verificado: { label: 'Verificado', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', color: 'text-red-600 bg-red-50', icon: AlertCircle },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id, nombre_completo')
    .eq('user_id', user.id)
    .single()

  if (!conductor) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Perfil de conductor no encontrado. Contacta al equipo.</p>
      </div>
    )
  }

  const { data: contrato } = await supabase
    .from('contratos')
    .select(`
      id, semanas_pagadas, semanas_aplazatorias, semanas_para_compra,
      ahorro_acumulado, bonos_acumulados, abonos_extras_acumulados,
      primer_pago_fecha, estado, valor_comercial_acordado,
      vehiculos(marca, modelo, color, placa)
    `)
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()

  const nombre = conductor.nombre_completo.split(' ')[0]

  if (!contrato) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Hola, {nombre}</h2>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
          <AlertCircle className="mx-auto text-yellow-500 mb-3" size={40} />
          <p className="text-gray-600 font-medium">No tienes un contrato activo</p>
          <p className="text-gray-400 text-sm mt-1">Contacta al equipo para más información.</p>
        </div>
      </div>
    )
  }

  const primerPago = parseISO(contrato.primer_pago_fecha)
  const semanasProcesadas = contrato.semanas_pagadas + contrato.semanas_aplazatorias
  const proximaFecha = addWeeks(primerPago, semanasProcesadas)
  const enMora = isPast(proximaFecha)
  const abonosExtras = contrato.abonos_extras_acumulados ?? 0
  const abonadoCompra =
    contrato.ahorro_acumulado + contrato.bonos_acumulados + abonosExtras
  const valorCompra = contrato.valor_comercial_acordado
  const restanteCompra = Math.max(valorCompra - abonadoCompra, 0)
  const progreso = Math.min(
    Math.round((abonadoCompra / valorCompra) * 100),
    100,
  )

  // Latest payment status
  const { data: ultimoPago } = await supabase
    .from('pagos')
    .select('estado, tipo')
    .eq('contrato_id', contrato.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const vehiculo = contrato.vehiculos as { marca: string; modelo: number; color: string; placa: string } | null

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm">Bienvenido,</p>
        <h1 className="text-2xl font-bold text-gray-900">{nombre}</h1>
        {vehiculo && (
          <p className="text-gray-400 text-sm mt-0.5">
            {vehiculo.marca} {vehiculo.modelo} · {vehiculo.placa}
          </p>
        )}
      </div>

      {/* Progress bar — primera métrica que ve el conductor */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={18} />
            <span className="text-sm font-medium text-gray-700">Progreso hacia la compra</span>
          </div>
          <span className="text-sm font-bold text-blue-600">{progreso}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-gray-900">{formatCOP(abonadoCompra)}</span>
          <span className="text-xs text-gray-400">de {formatCOP(valorCompra)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Te faltan {formatCOP(restanteCompra)} (incluye ahorro + bono)
        </p>
      </div>

      {/* Mora alert */}
      {enMora && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-700 text-sm">Pago vencido</p>
            <p className="text-red-600 text-xs mt-0.5">
              Tenías que pagar el{' '}
              {format(proximaFecha, "d 'de' MMMM", { locale: es })}.
              Súbelo hoy para evitar multas.
            </p>
          </div>
        </div>
      )}

      {/* Próxima fecha */}
      <div className={`rounded-2xl p-4 flex gap-3 items-center ${enMora ? 'bg-red-50' : 'bg-blue-50'}`}>
        <Calendar className={enMora ? 'text-red-500' : 'text-blue-500'} size={20} />
        <div>
          <p className="text-xs text-gray-500">Próxima fecha de pago</p>
          <p className={`font-semibold capitalize ${enMora ? 'text-red-700' : 'text-blue-700'}`}>
            {format(proximaFecha, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Ahorro acumulado</p>
          <p className="text-lg font-bold text-green-600">{formatCOP(contrato.ahorro_acumulado)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Bonos acumulados</p>
          <p className="text-lg font-bold text-purple-600">{formatCOP(contrato.bonos_acumulados)}</p>
        </div>
      </div>

      {/* Último pago status */}
      {ultimoPago && ESTADOS_PAGO[ultimoPago.estado] && (
        <div className={`rounded-2xl p-4 flex gap-3 items-center ${ESTADOS_PAGO[ultimoPago.estado].color}`}>
          {(() => {
            const { icon: Icon } = ESTADOS_PAGO[ultimoPago.estado]
            return <Icon size={18} />
          })()}
          <div>
            <p className="text-xs opacity-75">Último comprobante</p>
            <p className="font-semibold text-sm">{ESTADOS_PAGO[ultimoPago.estado].label}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Link
          href="/conductor/pagos"
          className="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 transition-colors"
        >
          <Upload size={24} />
          <span className="text-sm font-medium text-center">Subir comprobante</span>
        </Link>
        <Link
          href="/conductor/aplazatoria"
          className="flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl p-4 transition-colors"
        >
          <CalendarOff size={24} />
          <span className="text-sm font-medium text-center">Solicitar aplazatoria</span>
        </Link>
      </div>

      <Link
        href="/conductor/abono-extra"
        className="flex items-center gap-3 bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-100 rounded-2xl p-4 transition-colors"
      >
        <div className="bg-white rounded-xl p-2 shrink-0">
          <Sparkles className="text-purple-500" size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Abono extraordinario</p>
          <p className="text-xs text-gray-500">
            Adelanta pagos y reduce semanas
          </p>
        </div>
      </Link>
    </div>
  )
}
