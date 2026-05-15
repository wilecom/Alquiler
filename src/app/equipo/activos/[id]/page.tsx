import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Car, User, CreditCard, CalendarOff, Gift,
  AlertTriangle, Pencil, ChevronRight,
} from 'lucide-react'
import { fmtDiaMesCorto } from '@/lib/date/colombia'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(v)
}

export default async function ActivoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contrato } = await supabase
    .from('contratos')
    .select(`
      id, estado, semanas_pagadas, semanas_para_compra, semanas_aplazatorias,
      ahorro_acumulado, bonos_acumulados, abonos_extras_acumulados,
      valor_comercial_acordado, deposito_inicial, fecha_inicio, dia_pago, primer_pago_fecha,
      conductor_id,
      vehiculos ( id, placa, marca, modelo, color ),
      conductores ( id, nombre_completo, cedula, telefono, email )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!contrato) notFound()

  const v = contrato.vehiculos as unknown as {
    id: string; placa: string; marca: string; modelo: number; color: string
  } | null
  const cond = contrato.conductores as unknown as {
    id: string; nombre_completo: string; cedula: string; telefono: string; email: string
  } | null

  const [{ count: pagosPend }, { count: aplazPend }, { count: comparPend }] = await Promise.all([
    supabase.from('pagos').select('id', { count: 'exact', head: true })
      .eq('contrato_id', contrato.id).eq('estado', 'comprobante_subido'),
    supabase.from('aplazatorias_solicitudes').select('id', { count: 'exact', head: true })
      .eq('contrato_id', contrato.id).eq('estado', 'pendiente'),
    supabase.from('comparendos').select('id', { count: 'exact', head: true })
      .eq('contrato_id', contrato.id).eq('estado', 'pendiente'),
  ])

  const progreso = contrato.semanas_para_compra > 0
    ? Math.min(100, Math.round((contrato.semanas_pagadas / contrato.semanas_para_compra) * 100))
    : 0
  const acumulado =
    (contrato.ahorro_acumulado ?? 0) +
    (contrato.bonos_acumulados ?? 0) +
    (contrato.abonos_extras_acumulados ?? 0)

  const acciones = [
    { href: `/equipo/pagos?contrato=${contrato.id}`, icon: CreditCard, label: 'Pagos', badge: pagosPend ?? 0, sub: 'Aprobar comprobantes' },
    { href: `/equipo/aplazatorias?contrato=${contrato.id}`, icon: CalendarOff, label: 'Aplazatorias', badge: aplazPend ?? 0, sub: 'Solicitudes' },
    { href: `/equipo/beneficios?contrato=${contrato.id}`, icon: Gift, label: 'Beneficios', badge: 0, sub: 'Bonos especiales' },
    { href: `/equipo/comparendos?contrato=${contrato.id}`, icon: AlertTriangle, label: 'Comparendos', badge: comparPend ?? 0, sub: 'Multas de tránsito' },
    { href: cond ? `/equipo/conductores/${cond.id}` : '#', icon: Pencil, label: 'Editar datos', badge: 0, sub: 'Conductor / vehículo / contrato' },
  ]

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Link
        href="/equipo/activos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={14} /> Volver a activos
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
            <Car size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">{v?.placa ?? '—'}</h1>
            <p className="text-sm text-gray-500">
              {v ? `${v.marca} ${v.modelo} · ${v.color}` : 'Sin vehículo'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <User size={14} className="text-gray-400" />
          <span className="font-medium">{cond?.nombre_completo ?? 'Sin conductor'}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">CC {cond?.cedula ?? '—'}</span>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Semana {contrato.semanas_pagadas} de {contrato.semanas_para_compra}
            </span>
            <span className="font-semibold text-gray-700">{progreso}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Acumulado para compra:{' '}
            <span className="font-semibold text-gray-900">{formatCOP(acumulado)}</span>
            {' / '}
            {formatCOP(contrato.valor_comercial_acordado)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-500">Inicio</p>
            <p className="font-medium text-gray-900">{fmtDiaMesCorto(contrato.fecha_inicio)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-500">Día de pago</p>
            <p className="font-medium text-gray-900 capitalize">{contrato.dia_pago}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {acciones.map(({ href, icon: Icon, label, badge, sub }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 hover:border-orange-500 hover:shadow-sm transition-all p-4"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
            {badge > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-500 text-white">
                {badge}
              </span>
            )}
            <ChevronRight size={18} className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  )
}
