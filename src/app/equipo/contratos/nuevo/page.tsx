import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContratoForm } from './ContratoForm'

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ conductor_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Conductores aprobados que aún no tienen contrato activo
  const { data: aprobados } = await supabase
    .from('conductores')
    .select('id, nombre_completo, cedula')
    .eq('estado_solicitud', 'aprobado')
    .order('nombre_completo')

  const { data: contratosActivos } = await supabase
    .from('contratos')
    .select('conductor_id')
    .eq('estado', 'activo')

  const ocupados = new Set((contratosActivos ?? []).map((c) => c.conductor_id))
  const conductoresDisponibles = (aprobados ?? []).filter((c) => !ocupados.has(c.id))

  // Vehículos disponibles
  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('id, marca, modelo, placa, valor_comercial')
    .eq('estado', 'disponible')
    .order('placa')

  return (
    <ContratoForm
      conductores={conductoresDisponibles}
      vehiculos={vehiculos ?? []}
      preselectConductor={params.conductor_id}
    />
  )
}
