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
 * Distribución por pestaña según estado:
 *   "Filtro inicial"         → formulario, verificacion_documentos, visita_local, visita_domiciliaria
 *   "Siguientes conductores" → aprobada
 *   "Rechazados"             → rechazada
 *
 * La pestaña "Visita domiciliaria" del Sheet queda intacta para anotaciones manuales
 * del equipo durante las visitas — no la toca el código.
 *
 * Layout (idéntico en las 3 pestañas, fila 1 = encabezados):
 *   A: id (UUID — tracking, no editar)
 *   B: Fecha recibida
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
 *   M: Estado (uno de los valores del enum)
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

const DATA_START_ROW = 2

const TAB_FILTRO_INICIAL = 'Filtro inicial'
const TAB_SIGUIENTES = 'Siguientes conductores'
const TAB_RECHAZADOS = 'Rechazados'
/** Pestañas que el código administra (lee/escribe). La pestaña "Visita domiciliaria" NO está aquí. */
export const TABS_GESTIONADAS = [TAB_FILTRO_INICIAL, TAB_SIGUIENTES, TAB_RECHAZADOS] as const

export type Estado =
  | 'formulario'
  | 'verificacion_documentos'
  | 'visita_local'
  | 'visita_domiciliaria'
  | 'aprobada'
  | 'rechazada'

/** Decide en qué pestaña debe vivir una solicitud según su estado actual. */
export function tabForEstado(estado: string): string {
  if (estado === 'aprobada') return TAB_SIGUIENTES
  if (estado === 'rechazada') return TAB_RECHAZADOS
  return TAB_FILTRO_INICIAL
}

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

function rangeForRow(tab: string, row: number): string {
  return `'${tab}'!A${row}:O${row}`
}

async function getSheetIdByName(tab: string): Promise<number | null> {
  const sheets = sheetsClient()
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: solicitudesSheetId(),
    fields: 'sheets.properties',
  })
  const found = meta.data.sheets?.find((s) => s.properties?.title === tab)
  return found?.properties?.sheetId ?? null
}

/** Garantiza que cada pestaña gestionada tenga sus encabezados. Idempotente. */
export async function ensureHeaders(): Promise<void> {
  const sheets = sheetsClient()
  const id = solicitudesSheetId()
  for (const tab of TABS_GESTIONADAS) {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `'${tab}'!A1:O1`,
    })
    const current = data.values?.[0] ?? []
    const matches =
      current.length === SHEET_HEADERS.length &&
      current.every((v, i) => v === SHEET_HEADERS[i])
    if (matches) continue
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `'${tab}'!A1:O1`,
      valueInputOption: 'RAW',
      requestBody: { values: [SHEET_HEADERS as unknown as string[]] },
    })
  }
}

async function nextEmptyRow(tab: string): Promise<number> {
  const sheets = sheetsClient()
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: solicitudesSheetId(),
    range: `'${tab}'!A2:A`,
  })
  return DATA_START_ROW + (data.values?.length ?? 0)
}

async function clearRow(tab: string, row: number): Promise<void> {
  const sheets = sheetsClient()
  await sheets.spreadsheets.values.clear({
    spreadsheetId: solicitudesSheetId(),
    range: rangeForRow(tab, row),
  })
}

/**
 * Append a la pestaña que corresponde según el estado de la solicitud.
 * Retorna `{ tab, row }` o null si falló.
 */
export async function appendSolicitudToSheet(
  s: SolicitudSheetRow,
): Promise<{ tab: string; row: number } | null> {
  try {
    await ensureHeaders()
    const tab = tabForEstado(s.estado)
    const row = await nextEmptyRow(tab)
    const sheets = sheetsClient()
    await sheets.spreadsheets.values.update({
      spreadsheetId: solicitudesSheetId(),
      range: rangeForRow(tab, row),
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [buildRow(s)] },
    })
    return { tab, row }
  } catch (err) {
    console.warn('[sheets] append failed:', err)
    return null
  }
}

/**
 * Reconcilia la posición de una solicitud en el Sheet con su estado actual.
 *
 * - Si la solicitud no tenía tab/row → append en la pestaña correcta.
 * - Si ya estaba en la misma pestaña que corresponde → update in-place.
 * - Si cambió de pestaña → borra la fila vieja y appendea en la nueva.
 *
 * Retorna `{ tab, row }` con la posición final, o null si falló.
 */
export async function reflectSolicitudInSheet(
  s: SolicitudSheetRow,
  current: { tab: string | null; row: number | null },
): Promise<{ tab: string; row: number } | null> {
  try {
    const targetTab = tabForEstado(s.estado)

    if (!current.tab || !current.row) {
      return appendSolicitudToSheet(s)
    }

    if (current.tab === targetTab) {
      const sheets = sheetsClient()
      await sheets.spreadsheets.values.update({
        spreadsheetId: solicitudesSheetId(),
        range: rangeForRow(current.tab, current.row),
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [buildRow(s)] },
      })
      return { tab: current.tab, row: current.row }
    }

    // Cambio de pestaña: borrar de la vieja, append a la nueva.
    await clearRow(current.tab, current.row)
    return appendSolicitudToSheet(s)
  } catch (err) {
    console.warn('[sheets] reflect failed:', err)
    return null
  }
}

export type SheetRowSnapshot = {
  tab: string
  row: number
  id: string
  estado: string | null
  motivo_rechazo: string | null
}

/**
 * Lee todas las filas de las pestañas gestionadas. Retorna solo el subconjunto
 * de columnas que el sync permite modificar desde el Sheet (estado, motivo_rechazo).
 */
export async function readSolicitudesFromSheet(): Promise<SheetRowSnapshot[]> {
  const sheets = sheetsClient()
  const id = solicitudesSheetId()
  const out: SheetRowSnapshot[] = []
  for (const tab of TABS_GESTIONADAS) {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `'${tab}'!A${DATA_START_ROW}:N`,
    })
    const rows = data.values ?? []
    rows.forEach((r, idx) => {
      const uuid = String(r[0] ?? '').trim()
      if (!uuid) return
      out.push({
        tab,
        row: DATA_START_ROW + idx,
        id: uuid,
        estado: r[12] ? String(r[12]).trim().toLowerCase() : null,
        motivo_rechazo: r[13] ? String(r[13]).trim() : null,
      })
    })
  }
  return out
}

const ESTADOS_VALIDOS = new Set<Estado>([
  'formulario',
  'verificacion_documentos',
  'visita_local',
  'visita_domiciliaria',
  'aprobada',
  'rechazada',
])

export function estadoEsValido(e: string | null): e is Estado {
  return !!e && ESTADOS_VALIDOS.has(e as Estado)
}

export { DATA_START_ROW, getSheetIdByName }
