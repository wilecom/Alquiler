'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type Action = (fd: FormData) => Promise<unknown>

export function AccionesAprobarRechazar({
  aprobar,
  rechazar,
  labelAprobar = 'Aprobar',
  labelRechazar = 'Rechazar',
  placeholderMotivo = 'Motivo del rechazo (lo verá el conductor)',
}: {
  aprobar: Action
  rechazar: Action
  labelAprobar?: string
  labelRechazar?: string
  placeholderMotivo?: string
}) {
  const [modo, setModo] = useState<'normal' | 'rechazo'>('normal')

  if (modo === 'rechazo') {
    return (
      <form action={rechazar} className="w-full space-y-2">
        <textarea
          name="motivo"
          required
          minLength={3}
          maxLength={200}
          rows={2}
          placeholder={placeholderMotivo}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModo('normal')}
            className="flex-1 text-sm text-gray-500 rounded-xl py-2 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl py-2 transition-colors"
          >
            Confirmar rechazo
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-2 w-full">
      <form action={aprobar} className="flex-1">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
        >
          <CheckCircle2 size={15} /> {labelAprobar}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setModo('rechazo')}
        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl py-2.5 border border-red-200 transition-colors"
      >
        <XCircle size={15} /> {labelRechazar}
      </button>
    </div>
  )
}
