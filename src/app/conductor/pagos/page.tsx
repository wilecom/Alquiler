'use client'

import { useActionState, useRef } from 'react'
import { subirComprobante } from './actions'
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'

export default function PagosPage() {
  const [state, action, pending] = useActionState(subirComprobante, null)
  const inputRef = useRef<HTMLInputElement>(null)

  const success = state && 'success' in state
  const error = state && 'error' in state

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900">Subir comprobante</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Sube la foto o PDF de tu pago semanal ($480.000)
        </p>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium">¿Qué incluye el canon semanal?</p>
        <ul className="text-blue-600 space-y-0.5 text-xs mt-1">
          <li>• $280.000 — Renta del vehículo</li>
          <li>• $80.000 — Ahorro (te lo devolvemos)</li>
          <li>• $120.000 — Bono hacia la compra</li>
        </ul>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="text-green-500" size={48} />
          <p className="font-semibold text-green-700">{'success' in state ? state.success : ''}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-green-600 underline"
          >
            Subir otro comprobante
          </button>
        </div>
      ) : (
        <form action={action} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {'error' in state! && state!.error}
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <FileText className="text-gray-300" size={40} />
            <div className="text-center">
              <p className="font-medium text-gray-600 text-sm">Toca para seleccionar</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP o PDF — máx. 10 MB</p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            name="comprobante"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            required
            onChange={(e) => {
              const fileName = e.target.files?.[0]?.name
              if (fileName) {
                const label = document.getElementById('file-label')
                if (label) label.textContent = fileName
              }
            }}
          />

          <p id="file-label" className="text-xs text-center text-gray-400 -mt-2">
            Ningún archivo seleccionado
          </p>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Upload size={16} />
                Enviar comprobante
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
