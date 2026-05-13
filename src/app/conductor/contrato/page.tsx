import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Download, ArrowLeft, Users, Car } from 'lucide-react'
import { fmtDiaMesAño } from '@/lib/date/colombia'

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
}

export default async function ContratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id, nombre_completo, cedula')
    .eq('user_id', user.id)
    .single()
  if (!conductor) redirect('/auth/login')

  const { data: contrato } = await supabase
    .from('contratos')
    .select(
      'id, fecha_inicio, primer_pago_fecha, dia_pago, deposito_inicial, valor_comercial_acordado, semanas_para_compra, contrato_archivo_path, vehiculos(placa, marca, modelo, color)',
    )
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()

  if (!contrato) {
    return (
      <div className="p-6 text-center text-gray-500">No tienes un contrato activo.</div>
    )
  }

  const vehiculo = Array.isArray(contrato.vehiculos) ? contrato.vehiculos[0] : contrato.vehiculos

  let signedUrl: string | null = null
  if (contrato.contrato_archivo_path) {
    const { data: signed } = await supabase.storage
      .from('contratos')
      .createSignedUrl(contrato.contrato_archivo_path, 60 * 10) // 10 min
    signedUrl = signed?.signedUrl ?? null
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-2 flex items-center gap-2">
        <Link href="/conductor/perfil" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mi contrato</h1>
          <p className="text-gray-400 text-sm">Documento firmado y términos del leasing</p>
        </div>
      </div>

      {/* Descargar contrato firmado */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-blue-50 p-2 rounded-xl">
            <FileText className="text-blue-600" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Contrato firmado</p>
            <p className="text-xs text-gray-400">Documento legal de arrendamiento con opción de compra</p>
          </div>
        </div>
        {signedUrl ? (
          <a
            href={signedUrl}
            download
            className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
          >
            <Download size={15} /> Descargar contrato
          </a>
        ) : (
          <p className="mt-3 text-xs text-gray-400 text-center">
            Aún no se ha cargado el contrato. Contacta al equipo.
          </p>
        )}
      </div>

      {/* Datos del contrato */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 text-sm">
        <p className="font-semibold text-gray-900">Términos económicos</p>
        <div className="flex justify-between">
          <span className="text-gray-400">Valor comercial</span>
          <span className="font-semibold text-gray-900">{formatCOP(contrato.valor_comercial_acordado)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Depósito de garantía</span>
          <span className="text-gray-900">{formatCOP(contrato.deposito_inicial)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Canon semanal</span>
          <span className="text-gray-900">{formatCOP(480000)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Aplazatoria</span>
          <span className="text-gray-900">{formatCOP(200000)} / 1 por mes</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Plazo</span>
          <span className="text-gray-900">{contrato.semanas_para_compra} semanas</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Día de pago</span>
          <span className="text-gray-900 capitalize">{contrato.dia_pago}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Primer pago</span>
          <span className="text-gray-900">{fmtDiaMesAño(contrato.primer_pago_fecha)}</span>
        </div>
      </div>

      {/* Composición del canon */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2 text-sm">
        <p className="font-semibold text-gray-900">Composición del canon ($480.000)</p>
        <div className="flex justify-between"><span className="text-gray-400">Renta pura (no reembolsable)</span><span className="text-gray-900">$280.000</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Ahorro voluntario</span><span className="text-gray-900">$80.000</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Bono opción de compra</span><span className="text-gray-900">$120.000</span></div>
      </div>

      {/* Vehículo */}
      {vehiculo && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Car size={16} className="text-gray-400" />
            <p className="font-semibold text-gray-900 text-sm">Vehículo</p>
          </div>
          <p className="text-sm text-gray-700">{vehiculo.marca} {vehiculo.modelo} · {vehiculo.color}</p>
          <p className="text-xs text-gray-400 mt-1">Placa: {vehiculo.placa}</p>
        </div>
      )}

      {/* Codeudores */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-gray-400" />
          <p className="font-semibold text-gray-900 text-sm">Codeudores solidarios</p>
        </div>
        <p className="text-xs text-gray-400">
          Los codeudores responden solidaria, indivisible y no subsidiariamente por todas las obligaciones del contrato. Sus datos completos están en el documento firmado.
        </p>
      </div>

      <p className="text-[11px] text-gray-400 text-center pt-2 pb-1">
        Este resumen es informativo. El documento legal vinculante es el contrato firmado disponible para descarga.
      </p>
    </div>
  )
}
