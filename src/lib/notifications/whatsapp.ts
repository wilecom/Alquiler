import 'server-only'

const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://primary-production-7a21b.up.railway.app'

type ComprobanteSubido = {
  event: 'comprobante.subido'
  conductor_id: string
  contrato_id: string
  nombre_conductor: string
  telefono_conductor: string
  semana: number
  monto: number
  fecha_pago: string
  comprobante_url: string
}

type ComprobanteResuelto = {
  event: 'comprobante.resuelto'
  conductor_id: string
  contrato_id: string
  nombre_conductor: string
  telefono_conductor: string
  semana: number
  monto: number
  tipo: 'canon' | 'aplazatoria' | 'abono_extra'
  decision: 'verificado' | 'rechazado'
  motivo?: string
  abonado_compra?: number
  valor_vehiculo?: number
  porcentaje?: number
  usar_template_abono?: boolean
}

type AplazatoriaPendiente = {
  event: 'aplazatoria.pendiente'
  conductor_id: string
  contrato_id: string
  nombre_conductor: string
  telefono_conductor: string
  semana: number
  motivo: string
}

type AplazatoriaResuelta = {
  event: 'aplazatoria.resuelta'
  conductor_id: string
  contrato_id: string
  nombre_conductor: string
  telefono_conductor: string
  semana: number
  decision: 'aprobada' | 'rechazada'
  motivo?: string
}

type SolicitudRecibida = {
  event: 'solicitud.recibida'
  telefono: string
  nombre: string
}

type SolicitudAVerificacion = {
  event: 'solicitud.a_verificacion'
  telefono: string
  nombre: string
}

type EquipoAlertaSolicitudNueva = {
  event: 'equipo.solicitud_nueva'
  nombre: string
  cedula: string
  telefono: string
  link: string
}

export type NotificationPayload =
  | ComprobanteSubido
  | ComprobanteResuelto
  | AplazatoriaPendiente
  | AplazatoriaResuelta
  | SolicitudRecibida
  | SolicitudAVerificacion
  | EquipoAlertaSolicitudNueva

const ROUTES: Record<NotificationPayload['event'], string> = {
  'comprobante.subido': '/webhook/comprobante-pago',
  'comprobante.resuelto': '/webhook/comprobante-resuelto',
  'aplazatoria.pendiente': '/webhook/aplazatoria-pendiente',
  'aplazatoria.resuelta': '/webhook/aplazatoria-resuelta',
  'solicitud.recibida': '/webhook/solicitud-recibida',
  'solicitud.a_verificacion': '/webhook/solicitud-a-verificacion',
  'equipo.solicitud_nueva': '/webhook/equipo-alerta-solicitud-nueva',
}

export async function notify(payload: NotificationPayload): Promise<void> {
  const url = `${N8N_BASE}${ROUTES[payload.event]}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error(`[notify] ${payload.event} → ${res.status}`, await res.text())
    }
  } catch (err) {
    console.error(`[notify] ${payload.event} failed`, err)
  }
}
