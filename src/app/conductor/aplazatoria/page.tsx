'use client'

import { useActionState } from 'react'
import { solicitarAplazatoria } from './actions'
import { CalendarOff, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'

export default function AplazatoriaPage() {
  const [state, action, pending] = useActionState(solicitarAplazatoria, null)

  const success = state && 'success' in state
  const error = state && 'error' in state

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900">Solicitar aplazatoria</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Solicita aplazar el pago de la semana actual
        </p>
      </div>

      {/* Rules */}
      <div className="bg-yellow-50 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="text-yellow-600 shrink-0" size={16} />
          <p className="text-sm font-medium text-yellow-800">Condiciones de la aplazatoria</p>
        </div>
        <ul className="text-xs text-yellow-700 space-y-1 ml-6">
          <li>• Costo: <strong>$200.000</strong></li>
          <li>• Máximo <strong>1 por mes</strong> por conductor</li>
          <li>• No genera ahorro ni bono esa semana</li>
          <li>• Debe ser aprobada por el equipo</li>
          <li>• No se acumula como semana pagada</li>
        </ul>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="text-green-500" size={48} />
          <p className="font-semibold text-green-700">{'success' in state ? state.success : ''}</p>
        </div>
      ) : (
        <form action={action} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {'error' in state! && state!.error}
            </div>
          )}

          <div className="text-center py-4">
            <CalendarOff className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-600 text-sm">
              Se solicitará aplazar el pago de la <strong>semana actual</strong>.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              El equipo recibirá tu solicitud y te notificará.
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <CalendarOff size={16} />
                Solicitar aplazatoria
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
