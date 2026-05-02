import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, CreditCard } from 'lucide-react'
import { verificarPago } from './actions'
import { AccionesAprobarRechazar } from '@/components/AccionesAprobarRechazar'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
}

export default async function EquipoPagosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pagos } = await supabase
    .from('pagos')
    .select(`
      id, tipo, fecha_pago, fecha_vencimiento, monto, dias_mora, multa_mora,
      comprobante_url, estado, created_at,
      contratos(
        conductor_id,
        conductores(nombre_completo),
        vehiculos(marca, modelo, placa)
      )
    `)
    .eq('estado', 'comprobante_subido')
    .order('created_at', { ascending: true })

  const comprobanteUrls = new Map<string, string>()
  for (const p of pagos ?? []) {
    if (!p.comprobante_url) continue
    const path = p.comprobante_url.startsWith('http')
      ? p.comprobante_url.split('/comprobantes/')[1]
      : p.comprobante_url
    if (!path) continue
    const { data: signed } = await supabase.storage
      .from('comprobantes')
      .createSignedUrl(path, 60 * 60)
    if (signed?.signedUrl) comprobanteUrls.set(p.id, signed.signedUrl)
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Verificar pagos</h1>
        <p className="text-gray-400 text-sm">{pagos?.length ?? 0} comprobante{(pagos?.length ?? 0) !== 1 ? 's' : ''} por revisar</p>
      </div>

      {pagos?.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <CreditCard className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Sin comprobantes pendientes</p>
          <p className="text-gray-400 text-sm mt-1">Todo al día.</p>
        </div>
      )}

      <div className="space-y-3">
        {pagos?.map((p) => {
          const contrato = p.contratos as {
            conductores: { nombre_completo: string } | null
            vehiculos: { marca: string; modelo: number; placa: string } | null
          } | null

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{contrato?.conductores?.nombre_completo ?? '—'}</p>
                    <p className="text-xs text-gray-400">{contrato?.vehiculos?.marca} {contrato?.vehiculos?.modelo} · {contrato?.vehiculos?.placa}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${p.tipo === 'canon' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.tipo === 'canon' ? 'Canon semanal' : 'Aplazatoria'}
                  </span>
                </div>
              </div>

              {/* Datos */}
              <div className="px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monto</span>
                  <span className="font-semibold text-gray-900">{formatCOP(p.monto)}</span>
                </div>
                {p.multa_mora > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Multa mora ({p.dias_mora}d)</span>
                    <span className="font-medium text-red-600">{formatCOP(p.multa_mora)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Vence</span>
                  <span className="text-gray-700">{format(parseISO(p.fecha_vencimiento), "d 'de' MMMM", { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subido</span>
                  <span className="text-gray-700">{format(parseISO(p.created_at), "d MMM, HH:mm", { locale: es })}</span>
                </div>
              </div>

              {/* Comprobante */}
              {comprobanteUrls.get(p.id) && (
                <div className="px-4 pb-3">
                  <a
                    href={comprobanteUrls.get(p.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 underline"
                  >
                    <FileText size={14} /> Ver comprobante
                  </a>
                </div>
              )}

              {/* Acciones */}
              <div className="px-4 pb-4">
                <AccionesAprobarRechazar
                  aprobar={verificarPago.bind(null, p.id, 'verificado')}
                  rechazar={verificarPago.bind(null, p.id, 'rechazado')}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
