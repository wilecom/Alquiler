'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle, Copy } from 'lucide-react'
import {
  aprobarSolicitud,
  avanzarPipeline,
  rechazarSolicitud,
  type AprobarState,
} from '../actions'

type Estado =
  | 'formulario'
  | 'visita_local'
  | 'visita_domiciliaria'
  | 'aprobada'
  | 'rechazada'

const LABEL_SIGUIENTE: Record<Estado, string | null> = {
  formulario: 'Pasar a visita local',
  visita_local: 'Pasar a visita domiciliaria',
  visita_domiciliaria: null,
  aprobada: null,
  rechazada: null,
}

function BotonAvanzar({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {pending ? 'Procesando…' : label}
    </button>
  )
}

function BotonRechazar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-xl py-2 transition-colors flex items-center justify-center gap-2"
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {pending ? 'Procesando…' : 'Confirmar rechazo'}
    </button>
  )
}

function BotonAprobar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
      {pending ? 'Creando conductor…' : 'Aprobar y crear conductor'}
    </button>
  )
}

export function AccionesSolicitud({
  solicitudId,
  estado,
}: {
  solicitudId: string
  estado: Estado
}) {
  const [modoRechazo, setModoRechazo] = useState(false)
  const aprobar = aprobarSolicitud.bind(null, solicitudId)
  const [aprobarState, aprobarAction] = useActionState<AprobarState, FormData>(aprobar, null)

  if (estado === 'aprobada' || estado === 'rechazada') {
    return null
  }

  const labelSiguiente = LABEL_SIGUIENTE[estado]
  const puedeAprobar = estado === 'visita_domiciliaria'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Acciones</h3>

      {/* Resultado de aprobación (password temporal) */}
      {aprobarState && 'success' in aprobarState && (
        <PasswordFlash mensaje={aprobarState.success} password={aprobarState.password} />
      )}
      {aprobarState && 'error' in aprobarState && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {aprobarState.error}
        </div>
      )}

      {modoRechazo ? (
        <form
          action={
            rechazarSolicitud.bind(null, solicitudId) as unknown as (
              fd: FormData,
            ) => Promise<void>
          }
          className="space-y-2"
        >
          <textarea
            name="motivo"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            placeholder="Motivo del rechazo (uso interno del equipo)"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModoRechazo(false)}
              className="flex-1 text-sm text-gray-500 rounded-xl py-2 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <BotonRechazar />
          </div>
        </form>
      ) : puedeAprobar ? (
        <>
          <form action={aprobarAction}>
            <BotonAprobar />
          </form>
          <button
            type="button"
            onClick={() => setModoRechazo(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl py-2.5 border border-red-200 transition-colors"
          >
            <XCircle size={15} /> Rechazar
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          {labelSiguiente && (
            <form
              action={
                avanzarPipeline.bind(null, solicitudId) as unknown as () => Promise<void>
              }
              className="flex-1"
            >
              <BotonAvanzar label={labelSiguiente} />
            </form>
          )}
          <button
            type="button"
            onClick={() => setModoRechazo(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl py-2 border border-red-200 transition-colors"
          >
            <XCircle size={15} /> Rechazar
          </button>
        </div>
      )}
    </div>
  )
}

function PasswordFlash({ mensaje, password }: { mensaje: string; password?: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 space-y-2">
      <div className="flex gap-2">
        <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-600" />
        <span>{mensaje}</span>
      </div>
      {password && (
        <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-3 py-2 font-mono text-sm">
          <span className="flex-1">{password}</span>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(password)
              setCopiado(true)
              setTimeout(() => setCopiado(false), 1500)
            }}
            className="text-green-700 hover:text-green-900 flex items-center gap-1 text-xs"
          >
            <Copy size={12} /> {copiado ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      )}
    </div>
  )
}
