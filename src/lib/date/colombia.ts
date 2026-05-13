/**
 * Helpers de fecha en zona horaria America/Bogota (UTC-5 sin DST).
 *
 * Convención del proyecto:
 * - Las columnas DATE de Postgres (primer_pago_fecha, fecha_pago, fecha_vencimiento,
 *   fecha_limite_pago, etc.) guardan strings 'YYYY-MM-DD' que representan un día
 *   calendario en hora Colombia. NUNCA mezclar con `new Date()` directo porque
 *   esto da UTC y entre 7pm-12am Colombia ya cae al día siguiente UTC.
 * - Las columnas TIMESTAMPTZ (created_at, etc.) son instantes y se guardan en UTC.
 *
 * Toda comparación de "¿está vencido?", "¿es hoy?", "¿qué día estamos?" debe pasar
 * por estos helpers — nunca por `isPast()` de date-fns ni `new Date()` crudo.
 */

export const TIMEZONE = 'America/Bogota'

/** 'YYYY-MM-DD' del día actual en zona Colombia. */
export function hoyColombia(): string {
  // 'en-CA' usa formato ISO YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/** Extrae 'YYYY-MM-DD' de una entrada (string o Date interpretado como UTC). */
function toYmd(fecha: string | Date): string {
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  // Date que representa medianoche UTC (vienen de parseISO('YYYY-MM-DD') o addWeeks de eso)
  const y = fecha.getUTCFullYear()
  const m = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const d = String(fecha.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** True si la fecha (YYYY-MM-DD) es estrictamente anterior a hoy en Colombia. */
export function esPasadoColombia(fecha: string | Date): boolean {
  return toYmd(fecha) < hoyColombia()
}

/** True si la fecha (YYYY-MM-DD) es exactamente hoy en Colombia. */
export function esHoyColombia(fecha: string | Date): boolean {
  return toYmd(fecha) === hoyColombia()
}

/** Diferencia en días calendario: fecha - hoy. Positivo = futuro, negativo = pasado. */
export function diasDesdeHoyColombia(fecha: string | Date): number {
  const [fy, fm, fd] = toYmd(fecha).split('-').map(Number)
  const [hy, hm, hd] = hoyColombia().split('-').map(Number)
  const fechaUtc = Date.UTC(fy, fm - 1, fd)
  const hoyUtc = Date.UTC(hy, hm - 1, hd)
  return Math.round((fechaUtc - hoyUtc) / 86400000)
}

/** Primer y último día (YYYY-MM-DD) del mes actual en zona Colombia. */
export function rangoMesColombia(): { inicio: string; fin: string } {
  const hoy = hoyColombia()
  const [y, m] = hoy.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const mes = String(m).padStart(2, '0')
  return {
    inicio: `${y}-${mes}-01`,
    fin: `${y}-${mes}-${String(ultimoDia).padStart(2, '0')}`,
  }
}

/**
 * Formatea una fecha (string 'YYYY-MM-DD', timestamp ISO, o Date) en zona Colombia.
 * Usa Intl con timeZone: 'America/Bogota' para evitar drift por TZ del runtime.
 */
export function formatFecha(
  fecha: string | Date,
  opciones: Intl.DateTimeFormatOptions,
): string {
  let date: Date
  if (typeof fecha === 'string') {
    // Si es solo fecha 'YYYY-MM-DD', forzar mediodía UTC para que en cualquier TZ
    // del hemisferio occidental quede en el mismo día calendario.
    date = new Date(fecha.length === 10 ? `${fecha}T12:00:00.000Z` : fecha)
  } else {
    date = fecha
  }
  return new Intl.DateTimeFormat('es-CO', { timeZone: TIMEZONE, ...opciones }).format(date)
}

// Atajos comunes para los patrones que ya usábamos en la app
export const fmtDiaMes = (f: string | Date) =>
  formatFecha(f, { day: 'numeric', month: 'long' }) // "5 de mayo"

export const fmtDiaMesAño = (f: string | Date) =>
  formatFecha(f, { day: 'numeric', month: 'long', year: 'numeric' }) // "5 de mayo de 2026"

export const fmtDiaSemanaDiaMes = (f: string | Date) =>
  formatFecha(f, { weekday: 'long', day: 'numeric', month: 'long' }) // "viernes, 5 de mayo"

export const fmtDiaSemanaDiaMesAño = (f: string | Date) =>
  formatFecha(f, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const fmtDiaMesCorto = (f: string | Date) =>
  formatFecha(f, { day: 'numeric', month: 'short' }) // "5 may"

export const fmtFechaHoraCorta = (f: string | Date) =>
  formatFecha(f, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

/** Mes en español capitalizado: "Mayo", "Junio". Útil para columnas tipo "mes_pago". */
export function mesEnEspañol(fecha: string | Date): string {
  const m = formatFecha(fecha, { month: 'long' })
  return m.charAt(0).toUpperCase() + m.slice(1)
}
