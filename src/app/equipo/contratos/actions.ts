'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const Schema = z.object({
  conductor_id: z.string().uuid(),
  vehiculo_id: z.string().uuid(),
  fecha_inicio: z.string().min(1),
  dia_pago: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']),
  primer_pago_fecha: z.string().min(1),
  deposito_inicial: z.string().transform(Number),
  valor_comercial_acordado: z.string().transform(Number),
  semanas_para_compra: z.string().transform(Number),
})

export async function crearContrato(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Marcar vehículo como arrendado
  await supabase.from('vehiculos').update({ estado: 'arrendado' }).eq('id', parsed.data.vehiculo_id)

  const { error } = await supabase.from('contratos').insert({
    ...parsed.data,
    estado: 'activo',
    semanas_pagadas: 0,
    semanas_aplazatorias: 0,
    ahorro_acumulado: 0,
    bonos_acumulados: 0,
  })

  if (error) return { error: error.message }

  revalidatePath('/equipo/dashboard')
  revalidatePath('/equipo/contratos/nuevo')
  redirect('/equipo/dashboard')
}
