'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({
  nombre_completo: z.string().min(3),
  cedula: z.string().min(5),
  edad: z.string().transform(Number),
  barrio: z.string().min(2),
  direccion: z.string().min(5),
  telefono: z.string().min(7),
  email: z.email(),
  tiene_licencia: z.string().optional().transform((v) => v === 'true'),
  tiene_multas: z.string().optional().transform((v) => v === 'true'),
})

export async function registrarConductor(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Verificar cédula duplicada
  const { data: existe } = await supabase
    .from('conductores')
    .select('id')
    .eq('cedula', parsed.data.cedula)
    .maybeSingle()

  if (existe) return { error: 'Ya existe una solicitud con esa cédula.' }

  const { error } = await supabase.from('conductores').insert({
    ...parsed.data,
    estado_solicitud: 'formulario',
  })

  if (error) return { error: error.message }
  return { success: '¡Solicitud enviada! El equipo se comunicará contigo pronto.' }
}
