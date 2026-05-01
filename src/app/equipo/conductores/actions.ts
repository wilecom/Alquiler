'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PIPELINE_ORDEN = ['formulario', 'visita_local', 'visita_domiciliaria', 'aprobado'] as const
type EstadoSolicitud = typeof PIPELINE_ORDEN[number] | 'rechazado'

export async function avanzarPipeline(conductorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: conductor } = await supabase
    .from('conductores')
    .select('estado_solicitud')
    .eq('id', conductorId)
    .single()

  if (!conductor) return { error: 'Conductor no encontrado' }

  const idx = PIPELINE_ORDEN.indexOf(conductor.estado_solicitud as typeof PIPELINE_ORDEN[number])
  if (idx === -1 || idx === PIPELINE_ORDEN.length - 1) return { error: 'No hay siguiente estado' }

  const nuevoEstado = PIPELINE_ORDEN[idx + 1]

  const { error } = await supabase
    .from('conductores')
    .update({ estado_solicitud: nuevoEstado })
    .eq('id', conductorId)

  if (error) return { error: error.message }

  revalidatePath('/equipo/conductores')
  return { success: true }
}

export async function rechazarConductor(conductorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('conductores')
    .update({ estado_solicitud: 'rechazado' as EstadoSolicitud })
    .eq('id', conductorId)

  if (error) return { error: error.message }

  revalidatePath('/equipo/conductores')
  return { success: true }
}
