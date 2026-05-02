'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const PerfilSchema = z.object({
  telefono: z.string().trim().min(7, { error: 'Teléfono mínimo 7 dígitos.' }).max(20),
  barrio: z.string().trim().min(1, { error: 'Indica tu barrio.' }).max(120),
  direccion: z.string().trim().min(1, { error: 'Indica tu dirección.' }).max(200),
})

export type PerfilState = { error: string } | { success: string } | null

export async function actualizarPerfil(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const parsed = PerfilSchema.safeParse({
    telefono: formData.get('telefono'),
    barrio: formData.get('barrio'),
    direccion: formData.get('direccion'),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Datos inválidos.' }
  }

  const { error } = await supabase
    .from('conductores')
    .update(parsed.data)
    .eq('user_id', user.id)

  if (error) return { error: 'No se pudo actualizar el perfil.' }

  revalidatePath('/conductor/perfil')
  revalidatePath('/conductor/dashboard')
  return { success: 'Perfil actualizado.' }
}
