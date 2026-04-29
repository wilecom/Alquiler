'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addWeeks, parseISO } from 'date-fns'

export type PagoState = { error: string } | { success: string } | null

export async function subirComprobante(
  prevState: PagoState,
  formData: FormData
): Promise<PagoState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!conductor) {
    return { error: 'Perfil no encontrado.' }
  }

  const { data: contrato } = await supabase
    .from('contratos')
    .select('id, semanas_pagadas, semanas_aplazatorias, primer_pago_fecha')
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()

  if (!contrato) {
    return { error: 'No tienes un contrato activo.' }
  }

  // Check if already has a pending/uploaded payment for this period
  const primerPago = parseISO(contrato.primer_pago_fecha)
  const semanasProcesadas = contrato.semanas_pagadas + contrato.semanas_aplazatorias
  const fechaVencimiento = addWeeks(primerPago, semanasProcesadas)
  const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0]

  const { data: pagoExistente } = await supabase
    .from('pagos')
    .select('id, estado')
    .eq('contrato_id', contrato.id)
    .eq('fecha_vencimiento', fechaVencimientoStr)
    .in('estado', ['pendiente', 'comprobante_subido'])
    .maybeSingle()

  if (pagoExistente) {
    return { error: 'Ya subiste un comprobante para esta semana y está en revisión.' }
  }

  const file = formData.get('comprobante') as File

  if (!file || file.size === 0) {
    return { error: 'Selecciona una imagen o PDF del comprobante.' }
  }

  const MAX_SIZE_MB = 10
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { error: `El archivo no puede superar ${MAX_SIZE_MB} MB.` }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${contrato.id}/${Date.now()}.${ext}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('comprobantes')
    .upload(fileName, fileBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { error: 'Error al subir el archivo. Intenta de nuevo.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('comprobantes')
    .getPublicUrl(fileName)

  const hoy = new Date().toISOString().split('T')[0]

  const { error: pagoError } = await supabase.from('pagos').insert({
    contrato_id: contrato.id,
    tipo: 'canon',
    fecha_pago: hoy,
    fecha_vencimiento: fechaVencimientoStr,
    monto: 480000,
    comprobante_url: publicUrl,
    estado: 'comprobante_subido',
  })

  if (pagoError) {
    return { error: 'Error al registrar el pago. Contacta al equipo.' }
  }

  return { success: '¡Comprobante enviado! El equipo lo revisará pronto.' }
}
