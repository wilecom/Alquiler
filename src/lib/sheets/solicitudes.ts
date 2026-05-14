import 'server-only'
import { sheetsClient, solicitudesSheetId } from './client'

/**
 * Sync /equipo/solicitudes ↔ Google Sheets siguiendo el patrón de MisCuentas:
 * - BD Supabase es la fuente operativa.
 * - Cada operación de la app (insert, update de estado, aprobar, rechazar) escribe
 *   también al Sheet en best-effort (los errores del Sheet NO bloquean la operación).
 * - El equipo puede editar columnas en el Sheet manualmente. Un botón "Sincronizar
 *   desde Sheet" en el panel jala esos cambios de vuelta a la BD.
 *
 * Layout del Sheet (pestaña por defecto, fila 1 = encabezados):
 *
 *   A: id (UUID, invisible/locked en uso normal — usado para tracking)
 *   B: Fecha recibida (timestamp ISO o legible)
 *   C: Nombre
 *   D: Cédula
 *   E: Edad
 *   F: Teléfono
 *   G: Email
 *   H: Licencia (Sí/No)
 *   I: Categoría licencia
 *   J: Comparendos (Sí/No)
 *   K: Cantidad comparendos
 *   L: Motivos comparendos
 *   M: Estado (formulario|visita_local|visita_domiciliaria|aprobada|rechazada)
 *   N: Motivo rechazo
 *   O: Última actualización
 */

export const SHEET_HEADERS = [
  'id',
  'Fecha recibida',
  'Nombre',
  'Cédula',
  'Edad',
  'Teléfono',
  'Email',
  'Licencia',
  'Categoría',
  'Comparendos',
  'Cantidad comparendos',
  'Motivos comparendos',
  'Estado',
  'Motivo rechazo',
  'Última actualización',
] as const

const COL_COUNT = SHEET_HEADERS.length // 15 → A:O
const DATA_START_ROW = 2 // fila 1 = headers

export type SolicitudSheetRow = {
  id: string
  created_at: string
  nombre_completo: string
  cedula: string
  edad: number
  telefono: string
  email: string
  tiene_licencia: boolean
  categoria_licencia: string | null
  tiene_comparendos_pendientes: boolean
  cantidad_comparendos: number
  motivos_comparendos: string | null
  estado: string
  motivo_rechazo: string | null
}

function buildRow(s: SolicitudSheetRow): (string | number)[] {
  return [
    s.id,
    s.created_at,
    s.nombre_completo,
    s.cedula,
    s.edad,
    s.telefono,
    s.email,
    s.tiene_licencia ? 'Sí' : 'No',
    s.categoria_licencia ?? '',
    s.tiene_comparendos_pendientes ? 'Sí' : 'No',
    s.cantidad_comparendos,
    s.motivos_comparendos ?? '',
    s.estado,
    s.motivo_rechazo ?? '',
    new Date().toISOString(),
  ]
}

function rangeForRow(row: number): string {
  // A1 notation: filas en la primera pestaña por defecto.
  return `A${row}:O${row}`
}

/**
 * Asegura que la fila 1 contenga los encabezados. Idempotente.
 */
export async function ensureHeaders(): Promise<void> {
  const sheets = sheetsClient()
  const id = solicitudesSheetId()
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: 'A1:O1',
  })
  const current = data.values?.[0] ?? []
  const matches =
    current.length === SHEET_HEADERS.length &&
    current.every((v, i) => v === SHEET_HEADERS[i])
  if (matches) return

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'A1:O1',
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADERS as unknown as string[]] },
  })
}

/**
 * Appendea una solicitud nueva al Sheet. Retorna el número de fila asignado, o null si falló.
 */
export async function appendSolicitudToSheet(s: SolicitudSheetRow): Promise<number | null> {
  try {
    await ensureHeaders()
    const sheets = sheetsClient()
    const id = solicitudesSheetId()

    // Cuenta cuántas filas hay para saber la siguiente posición libre.
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: 'A2:A',
    })
    const existingRows = data.values?.length ?? 0
    const nextRow = DATA_START_ROW + existingRows

    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: rangeForRow(nextRow),
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [buildRow(s)] },
    })
    return nextRow
  } catch (err) {
    console.warn('[sheets] append failed:', err)
    return null
  }
}

/**
 * Actualiza una fila existente del Sheet. Retorna true si OK, false si falló.
 */
export async function updateSolicitudInSheet(
  row: number,
  s: SolicitudSheetRow,
): Promise<boolean> {
  try {
    const sheets = sheetsClient()
    const id = solicitudesSheetId()
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: rangeForRow(row),
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [buildRow(s)] },
    })
    return true
  } catch (err) {
    console.warn('[sheets] update failed:', err)
    return false
  }
}

export type SheetRowSnapshot = {
  row: number
  id: string
  estado: string | null
  motivo_rechazo: string | null
}

/**
 * Lee todas las filas con id válido y retorna el subconjunto de columnas que el sync
 * permite modificar desde el Sheet (por ahora: estado + motivo_rechazo).
 */
export async function readSolicitudesFromSheet(): Promise<SheetRowSnapshot[]> {
  const sheets = sheetsClient()
  const id = solicitudesSheetId()
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `A${DATA_START_ROW}:N`,
  })
  const rows = data.values ?? []
  const out: SheetRowSnapshot[] = []
  rows.forEach((r, idx) => {
    const uuid = String(r[0] ?? '').trim()
    if (!uuid) return
    out.push({
      row: DATA_START_ROW + idx,
      id: uuid,
      estado: r[12] ? String(r[12]).trim().toLowerCase() : null,
      motivo_rechazo: r[13] ? String(r[13]).trim() : null,
    })
  })
  return out
}

const ESTADOS_VALIDOS = new Set([
  'formulario',
  'visita_local',
  'visita_domiciliaria',
  'aprobada',
  'rechazada',
])

export function estadoEsValido(e: string | null): e is
  | 'formulario'
  | 'visita_local'
  | 'visita_domiciliaria'
  | 'aprobada'
  | 'rechazada' {
  return !!e && ESTADOS_VALIDOS.has(e)
}

export { COL_COUNT, DATA_START_ROW }
