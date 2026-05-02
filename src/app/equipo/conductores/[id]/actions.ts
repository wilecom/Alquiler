'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const ConductorSchema = z.object({
  nombre_completo: z.string().trim().min(2).max(120),
  cedula: z.string().trim().min(5).max(20),
  edad: z.coerce.number().int().min(18).max(100),
  telefono: z.string().trim().min(7).max(20),
  email: z.string().trim().email(),
  barrio: z.string().trim().min(1).max(120),
  direccion: z.string().trim().min(1).max(200),
  tiene_licencia: z.literal('on').optional(),
  tiene_multas: z.literal('on').optional(),
  estado_solicitud: z.enum(['formulario', 'visita_local', 'visita_domiciliaria', 'aprobado', 'rechazado']),
})

const ContratoSchema = z.object({
  dia_pago: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']),
  fecha_inicio: z.string().min(8),
  primer_pago_fecha: z.string().min(8),
  deposito_inicial: z.coerce.number().int().min(0),
  valor_comercial_acordado: z.coerce.number().int().min(1),
  semanas_pagadas: z.coerce.number().int().min(0),
  semanas_aplazatorias: z.coerce.number().int().min(0),
  ahorro_acumulado: z.coerce.number().int().min(0),
  bonos_acumulados: z.coerce.number().int().min(0),
  abonos_extras_acumulados: z.coerce.number().int().min(0),
  estado: z.enum(['activo', 'terminado', 'comprado']),
})

const VehiculoSchema = z.object({
  marca: z.string().trim().min(1).max(60),
  modelo: z.coerce.number().int().min(1980).max(2100),
  color: z.string().trim().min(1).max(60),
  placa: z.string().trim().min(3).max(15),
  numero_chasis: z.string().trim().min(1).max(50),
  numero_motor: z.string().trim().min(1).max(50),
  valor_comercial: z.coerce.number().int().min(1),
})

export type ActualizarState = { error: string } | { success: string } | null

function obj(formData: FormData, prefix: string) {
  const out: Record<string, FormDataEntryValue> = {}
  for (const [k, v] of formData.entries()) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v
  }
  return out
}

export async function actualizarConductor(
  conductorId: string,
  _prev: ActualizarState,
  formData: FormData,
): Promise<ActualizarState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const cParsed = ConductorSchema.safeParse(obj(formData, 'c_'))
  if (!cParsed.success) {
    return { error: 'Datos del conductor inválidos: ' + cParsed.error.issues[0]?.message }
  }
  const cd = cParsed.data
  const conductorUpdate = {
    nombre_completo: cd.nombre_completo,
    cedula: cd.cedula,
    edad: cd.edad,
    telefono: cd.telefono,
    email: cd.email,
    barrio: cd.barrio,
    direccion: cd.direccion,
    tiene_licencia: cd.tiene_licencia === 'on',
    tiene_multas: cd.tiene_multas === 'on',
    estado_solicitud: cd.estado_solicitud,
  }

  const { error: e1 } = await supabase
    .from('conductores')
    .update(conductorUpdate)
    .eq('id', conductorId)
  if (e1) return { error: 'Error guardando conductor: ' + e1.message }

  const contratoId = (formData.get('contrato_id') as string | null) ?? ''
  if (contratoId) {
    const ctParsed = ContratoSchema.safeParse(obj(formData, 'ct_'))
    if (!ctParsed.success) {
      return { error: 'Datos del contrato inválidos: ' + ctParsed.error.issues[0]?.message }
    }
    const { error: e2 } = await supabase
      .from('contratos')
      .update(ctParsed.data)
      .eq('id', contratoId)
    if (e2) return { error: 'Error guardando contrato: ' + e2.message }
  }

  const vehiculoId = (formData.get('vehiculo_id') as string | null) ?? ''
  if (vehiculoId) {
    const vParsed = VehiculoSchema.safeParse(obj(formData, 'v_'))
    if (!vParsed.success) {
      return { error: 'Datos del vehículo inválidos: ' + vParsed.error.issues[0]?.message }
    }
    const { error: e3 } = await supabase
      .from('vehiculos')
      .update(vParsed.data)
      .eq('id', vehiculoId)
    if (e3) return { error: 'Error guardando vehículo: ' + e3.message }
  }

  revalidatePath(`/equipo/conductores/${conductorId}`)
  revalidatePath('/equipo/conductores')
  revalidatePath('/equipo/dashboard')
  return { success: 'Cambios guardados.' }
}
