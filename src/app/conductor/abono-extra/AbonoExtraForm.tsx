'use client'

import { useActionState, useState } from 'react'
import { Upload } from 'lucide-react'
import { subirAbonoExtra, type AbonoState } from './actions'

type Props = { restante: number }

export function AbonoExtraForm({ restante }: Props) {
  const [state, action, pending] = useActionState<AbonoState, FormData>(
    subirAbonoExtra,
    null,
  )
  const [monto, setMonto] = useState('')
  const m = parseInt(monto || '0', 10)
  const semanasReducidas = m > 0 ? Math.floor(m / 200_000) : 0

  return (
    <form
      action={action}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4"
    >
      <div>
        <label htmlFor="monto" className="block text-xs text-gray-500 mb-1">
          Monto del abono (COP)
        </label>
        <input
          id="monto"
          name="monto"
          type="number"
          min={1}
          max={restante}
          step={1000}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          inputMode="numeric"
          placeholder="200000"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {semanasReducidas > 0 && (
          <p className="text-xs text-purple-600 mt-1">
            ≈ {semanasReducidas} semana{semanasReducidas !== 1 ? 's' : ''} menos
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comprobante" className="block text-xs text-gray-500 mb-1">
          Comprobante (imagen o PDF)
        </label>
        <input
          id="comprobante"
          name="comprobante"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
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
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-xl py-2.5 transition-colors"
      >
        <Upload size={16} />
        {pending ? 'Enviando…' : 'Enviar abono extra'}
      </button>
    </form>
  )
}
