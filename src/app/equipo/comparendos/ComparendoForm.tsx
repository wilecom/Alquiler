'use client'

import { useActionState } from 'react'
import { registrarComparendo } from './actions'
import { AlertCircle, CheckCircle2, Loader2, PlusCircle } from 'lucide-react'

interface Contrato {
  id: string
  conductores: { nombre_completo: string } | null
  vehiculos: { placa: string } | null
}

export default function ComparendoForm({ contratos }: { contratos: Contrato[] }) {
  const [state, action, pending] = useActionState(registrarComparendo, null)
  const success = state && 'success' in state
  const error = state && 'error' in state

  return (
    <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none flex items-center gap-2">
        <PlusCircle size={15} className="text-gray-500" /> Registrar nuevo comparendo
      </summary>
      <form action={action} className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex gap-2 text-xs text-red-700">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            {'error' in state! && state!.error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex gap-2 text-xs text-green-700">
            <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
            {'success' in state! && state!.success}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Contrato</label>
          <select
            name="contrato_id"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Selecciona contrato…</option>
            {contratos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.conductores?.nombre_completo ?? '—'} · {c.vehiculos?.placa ?? '—'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Fecha notificación</label>
            <input type="date" name="fecha_notificacion" required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Fecha límite pago</label>
            <input type="date" name="fecha_limite_pago" required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Descripción</label>
          <input
            name="descripcion"
            placeholder="Ej: Exceso de velocidad, Cra 7 con 45"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Monto ($) — opcional</label>
          <input
            type="number"
            name="monto"
            min={0}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
        >
          {pending ? <><Loader2 size={13} className="animate-spin" /> Registrando…</> : 'Registrar comparendo'}
        </button>
      </form>
    </details>
  )
}
