'use client'

import { useActionState } from 'react'
import { actualizarPerfil, type PerfilState } from './actions'

type Props = {
  defaults: { telefono: string; barrio: string; direccion: string }
}

export function PerfilForm({ defaults }: Props) {
  const [state, action, pending] = useActionState<PerfilState, FormData>(
    actualizarPerfil,
    null,
  )

  return (
    <form action={action} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
      <div>
        <label htmlFor="telefono" className="block text-xs text-gray-400 mb-1">
          Teléfono / WhatsApp
        </label>
        <input
          id="telefono"
          name="telefono"
          defaultValue={defaults.telefono}
          required
          inputMode="tel"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="barrio" className="block text-xs text-gray-400 mb-1">
          Barrio
        </label>
        <input
          id="barrio"
          name="barrio"
          defaultValue={defaults.barrio}
          required
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="direccion" className="block text-xs text-gray-400 mb-1">
          Dirección
        </label>
        <input
          id="direccion"
          name="direccion"
          defaultValue={defaults.direccion}
          required
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-xl py-2.5 transition-colors"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
