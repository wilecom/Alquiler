'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const Schema = z.object({
  marca: z.string().min(1),
  modelo: z.string().transform(Number),
  color: z.string().min(1),
  placa: z.string().min(4).toUpperCase(),
  numero_chasis: z.string().min(1),
  numero_motor: z.string().min(1),
  valor_comercial: z.string().transform(Number),
})

export async function crearVehiculo(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('vehiculos').insert({
    ...parsed.data,
    estado: 'disponible',
  })

  if (error) return { error: error.message }
  revalidatePath('/equipo/vehiculos')
  return { success: 'Vehículo registrado.' }
}
