import 'server-only'
import { google, type sheets_v4 } from 'googleapis'

let cached: sheets_v4.Sheets | null = null

/**
 * Cliente Google Sheets v4 cacheado, autenticado con el Service Account de leasing.
 * El SA debe estar compartido como Editor en el Sheet que se quiere usar.
 *
 * Env vars:
 * - GOOGLE_SHEETS_CLIENT_EMAIL: email del service account
 * - GOOGLE_SHEETS_PRIVATE_KEY: clave privada (con `\n` escapados)
 */
export function sheetsClient(): sheets_v4.Sheets {
  if (cached) return cached

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY

  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      'Faltan GOOGLE_SHEETS_CLIENT_EMAIL o GOOGLE_SHEETS_PRIVATE_KEY en el entorno.',
    )
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  cached = google.sheets({ version: 'v4', auth })
  return cached
}

export function solicitudesSheetId(): string {
  const id = process.env.SOLICITUDES_SHEET_ID
  if (!id) {
    throw new Error('Falta SOLICITUDES_SHEET_ID en el entorno.')
  }
  return id
}
