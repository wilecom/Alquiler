'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { sincronizarDesdeSheet, type SyncResult } from './sync-actions'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs bg-white text-gray-700 px-3 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors border border-gray-200 flex items-center gap-1.5 disabled:opacity-60"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      {pending ? 'Sincronizando…' : 'Sincronizar desde Sheet'}
    </button>
  )
}

export function SyncDesdeSheetButton({ sheetUrl }: { sheetUrl?: string }) {
  const [state, action] = useActionState<SyncResult, FormData>(sincronizarDesdeSheet, null)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Abrir Sheet
          </a>
        )}
        <form action={action}>
          <Boton />
        </form>
      </div>

      {state && 'error' in state && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex gap-1.5">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      {state && 'success' in state && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 flex gap-1.5">
          <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
          {state.actualizadas} actualizada{state.actualizadas !== 1 ? 's' : ''} ·{' '}
          {state.revisadas} fila{state.revisadas !== 1 ? 's' : ''} en el Sheet
          {state.huérfanas > 0 && ` · ${state.huérfanas} sin match en BD`}
        </div>
      )}
    </div>
  )
}
