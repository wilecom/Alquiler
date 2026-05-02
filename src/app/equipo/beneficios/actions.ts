'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CrearBeneficioSchema = z.object({
  conductor_id: z.string().uuid(),
  titulo: z.string().trim().min(1, { error: 'Título requerido.' }).max(120),
  descripcion: z.string().trim().max(500).optional().or(z.literal('')),
  fecha_expiracion: z.string().optional().or(z.literal('')),
})

export type AccionState = { error: string } | { success: string } | null

export async function crearBeneficio(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const parsed = CrearBeneficioSchema.safeParse({
    conductor_id: formData.get('conductor_id'),
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion') ?? '',
    fecha_expiracion: formData.get('fecha_expiracion') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const { conductor_id, titulo, descripcion, fecha_expiracion } = parsed.data
  const { error } = await supabase.from('beneficios').insert({
    conductor_id,
    titulo,
    descripcion: descripcion || null,
    fecha_expiracion: fecha_expiracion || null,
    activado_por: user.id,
  })
  if (error) return { error: 'No se pudo crear el beneficio.' }

  revalidatePath('/equipo/beneficios')
  return { success: 'Beneficio creado.' }
}

export async function desactivarBeneficio(beneficioId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('beneficios').update({ activo: false }).eq('id', beneficioId)
  revalidatePath('/equipo/beneficios')
}

export async function reactivarBeneficio(beneficioId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('beneficios').update({ activo: true }).eq('id', beneficioId)
  revalidatePath('/equipo/beneficios')
}
