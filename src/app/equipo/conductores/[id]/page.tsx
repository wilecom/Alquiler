import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditarForm } from './EditarForm'

export default async function ConductorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductor } = await supabase
    .from('conductores')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!conductor) notFound()

  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, vehiculos(*)')
    .eq('conductor_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const vehiculo = contrato?.vehiculos as
    | {
        id: string
        marca: string
        modelo: number
        color: string
        placa: string
        numero_chasis: string
        numero_motor: string
        valor_comercial: number
      }
    | null

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Link
        href="/equipo/conductores"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={14} /> Volver a conductores
      </Link>

      <div className="pt-1">
        <h1 className="text-xl font-bold text-gray-900">{conductor.nombre_completo}</h1>
        <p className="text-gray-400 text-sm">Editar datos del conductor, contrato y vehículo</p>
      </div>

      <EditarForm
        conductor={conductor}
        contrato={contrato}
        vehiculo={vehiculo}
      />
    </div>
  )
}
