'use client'

import { useActionState, useState } from 'react'
import { Plus } from 'lucide-react'
import { crearBeneficio, type AccionState } from './actions'

type Props = { conductorId: string }

export function CrearBeneficioForm({ conductorId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<AccionState, FormData>(
    crearBeneficio,
    null,
  )

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 py-2 border border-dashed border-blue-200 rounded-xl"
      >
        <Plus size={14} /> Activar beneficio
      </button>
    )
  }

  return (
    <form action={action} className="space-y-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
      <input type="hidden" name="conductor_id" value={conductorId} />
      <input
        name="titulo"
        placeholder="Título (ej. Lavada gratis)"
        required
        maxLength={120}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        name="descripcion"
        placeholder="Descripción (opcional)"
        maxLength={500}
        rows={2}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Vence (opcional)</label>
        <input
          type="date"
          name="fecha_expiracion"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {state && 'error' in state && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="text-xs text-green-600">{state.success}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg py-2"
        >
          {pending ? 'Creando…' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
