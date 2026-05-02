import 'server-only'

const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://primary-production-7a21b.up.railway.app'

const FICHA_POR_PLACA: Record<string, string> = {
  'KAO710': 'C1',
  'KAO 710': 'C1',
}

const COMPROBANTES_FOLDER_POR_PLACA: Record<string, string> = {
  'KAO710': '1z7qeplKWKGc0Cm_VQhVr6mUZ2Lo8S1L-',
  'KAO 710': '1z7qeplKWKGc0Cm_VQhVr6mUZ2Lo8S1L-',
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export type PagoArchivadoPayload = {
  contrato_id: string
  nombre_conductor: string
  cedula: string
  placa: string
  apodo?: string
  semana: number
  tipo: 'canon' | 'aplazatoria' | 'abono_extra'
  monto: number
  dias_mora?: number
  multa_mora?: number
  fecha_pago: string
  comprobante_url: string
  aprobado_por: string
  ingreso_acumulado: number
  gastos_acumulado: number
  costo_vehiculo: number
  semanas_pagadas: number
}

export async function archivarPago(payload: PagoArchivadoPayload): Promise<void> {
  const url = `${N8N_BASE}/webhook/pago-archivado`
  const placaNorm = payload.placa.replace(/\s+/g, '').toUpperCase()
  const ficha_sheet = FICHA_POR_PLACA[placaNorm] ?? FICHA_POR_PLACA[payload.placa] ?? null
  const comprobantes_folder_id =
    COMPROBANTES_FOLDER_POR_PLACA[placaNorm] ?? COMPROBANTES_FOLDER_POR_PLACA[payload.placa] ?? null
  const fecha = new Date(payload.fecha_pago)
  const mes_pago = isNaN(fecha.getTime()) ? '' : MESES_ES[fecha.getUTCMonth()]
  const enriched = { ...payload, ficha_sheet, mes_pago, comprobantes_folder_id }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.error(`[archivar-pago] → ${res.status}`, await res.text())
    }
  } catch (err) {
    console.error('[archivar-pago] failed', err)
  }
}
