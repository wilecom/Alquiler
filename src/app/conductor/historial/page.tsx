import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmtDiaMes, fmtDiaMesAño } from '@/lib/date/colombia'
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const ESTADO_CONFIG: Record<string, { label: string; icon: React.FC<{ size?: number; className?: string }>; cls: string }> = {
  pendiente: { label: 'Pendiente', icon: Clock, cls: 'text-yellow-600 bg-yellow-50' },
  comprobante_subido: { label: 'En revisión', icon: Clock, cls: 'text-orange-500 bg-orange-50' },
  verificado: { label: 'Verificado', icon: CheckCircle2, cls: 'text-green-600 bg-green-50' },
  rechazado: { label: 'Rechazado', icon: XCircle, cls: 'text-red-600 bg-red-50' },
}

const TIPO_LABEL: Record<string, string> = {
  canon: 'Canon semanal',
  aplazatoria: 'Aplazatoria',
}

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!conductor) {
    return (
      <div className="p-6 text-center text-gray-500">
        Perfil no encontrado.
      </div>
    )
  }

  const { data: contrato } = await supabase
    .from('contratos')
    .select('id')
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()

  const pagos = contrato
    ? (await supabase
        .from('pagos')
        .select('*')
        .eq('contrato_id', contrato.id)
        .order('fecha_vencimiento', { ascending: false })).data ?? []
    : []

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900">Historial de pagos</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {pagos.length} {pagos.length === 1 ? 'pago registrado' : 'pagos registrados'}
        </p>
      </div>

      {pagos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <AlertCircle className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 text-sm">No hay pagos registrados aún.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagos.map((pago) => {
            const cfg = ESTADO_CONFIG[pago.estado] ?? ESTADO_CONFIG.pendiente
            const Icon = cfg.icon
            const fechaVenc = fmtDiaMesAño(pago.fecha_vencimiento)
            const fechaPago = fmtDiaMes(pago.fecha_pago)

            return (
              <div key={pago.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
                <div className={`rounded-full p-2 self-start ${cfg.cls}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {TIPO_LABEL[pago.tipo] ?? pago.tipo}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Semana del {fechaVenc}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                      {formatCOP(pago.monto)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">Pagado el {fechaPago}</span>
                  </div>

                  {pago.dias_mora > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      {pago.dias_mora} {pago.dias_mora === 1 ? 'día' : 'días'} de mora — multa: {formatCOP(pago.multa_mora)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
