'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const Schema = z.object({
  contrato_id: z.string().uuid(),
  fecha_notificacion: z.string().min(1),
  fecha_limite_pago: z.string().min(1),
  descripcion: z.string().min(3),
  monto: z.string().transform((v) => (v ? Number(v) : null)).nullable(),
})

export async function registrarComparendo(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('comparendos').insert({
    ...parsed.data,
    estado: 'pendiente',
  })

  if (error) return { error: error.message }

  revalidatePath('/equipo/comparendos')
  return { success: 'Comparendo registrado.' }
}

export async function marcarPagado(comparendoId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('comparendos')
    .update({ estado: 'pagado' })
    .eq('id', comparendoId)

  if (error) return { error: error.message }
  revalidatePath('/equipo/comparendos')
  return { success: true }
}
