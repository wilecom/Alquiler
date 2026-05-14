import { z } from 'zod'

const CATEGORIA_LICENCIA = ['B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'A1', 'A2', 'otra'] as const

const trimmed = (min: number, max: number) =>
  z.string().trim().min(min).max(max)

const bool = z
  .union([z.literal('on'), z.literal('true'), z.literal('1'), z.literal('')])
  .optional()
  .transform((v) => v === 'on' || v === 'true' || v === '1')

export const solicitudSchema = z.object({
  // 1. Datos personales (sin dirección ni tipo de vivienda — eso se pide después)
  nombre_completo: trimmed(3, 120),
  cedula: trimmed(5, 20),
  edad: z.coerce.number().int().min(18).max(80),
  telefono: trimmed(7, 20),
  email: z.email(),
  barrio: trimmed(1, 120),

  // 2. Licencia (solo vigencia + categoría — suspensiones se preguntan después)
  tiene_licencia: bool,
  categoria_licencia: z.enum(CATEGORIA_LICENCIA).optional(),

  // 3. Comparendos
  tiene_comparendos_pendientes: bool,
  cantidad_comparendos: z.coerce.number().int().min(0).max(50).default(0),
  motivos_comparendos: trimmed(0, 500).optional(),

  // 4. Trabajo, ingresos y uso
  ocupacion: trimmed(2, 120),
  ingreso_mensual_estimado: z.coerce.number().int().min(0).max(100_000_000),
  anos_actividad: z.coerce.number().min(0).max(70).optional(),
  uso_plataformas: bool,

  // 5. Ley 1581
  acepta_habeas_data: bool.refine((v) => v === true, {
    message: 'Debes aceptar la autorización de tratamiento de datos.',
  }),
})

export type SolicitudInput = z.infer<typeof solicitudSchema>

export const CATEGORIA_LICENCIA_OPCIONES: Array<{ value: typeof CATEGORIA_LICENCIA[number]; label: string }> = [
  { value: 'B1', label: 'B1 (automóvil particular)' },
  { value: 'B2', label: 'B2 (camioneta/microbús particular)' },
  { value: 'B3', label: 'B3 (camión/bus particular)' },
  { value: 'C1', label: 'C1 (servicio público auto)' },
  { value: 'C2', label: 'C2 (servicio público camioneta)' },
  { value: 'C3', label: 'C3 (servicio público camión/bus)' },
  { value: 'A1', label: 'A1 (motocicleta hasta 125cc)' },
  { value: 'A2', label: 'A2 (motocicleta sin restricción)' },
  { value: 'otra', label: 'Otra' },
]
