'use client'

import { useActionState } from 'react'
import { registrarConductor } from './actions'
import { AlertCircle, CheckCircle2, Loader2, Car } from 'lucide-react'

export default function RegistroPage() {
  const [state, action, pending] = useActionState(registrarConductor, null)
  const success = state && 'success' in state
  const error = state && 'error' in state

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto text-green-500" size={48} />
          <h2 className="text-xl font-bold text-gray-900">¡Solicitud enviada!</h2>
          <p className="text-gray-500 text-sm">{'success' in state! && state!.success}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Car size={20} />
          <span className="font-bold text-lg">AutoLeasing</span>
        </div>
        <p className="text-gray-400 text-sm">Formulario de postulación</p>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-4 text-sm text-gray-600 space-y-1 mt-4">
          <p className="font-medium text-gray-700">¿Cómo funciona el arrendamiento?</p>
          <ul className="text-xs space-y-0.5 text-gray-500">
            <li>• Canon semanal de $480.000 (renta + ahorro + bono)</li>
            <li>• Después de 2 años puedes ejercer la opción de compra</li>
            <li>• Tu ahorro acumulado va al valor del vehículo</li>
          </ul>
        </div>

        <form action={action} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Datos personales</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {'error' in state! && state!.error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Nombre completo *</label>
            <input name="nombre_completo" required placeholder="Juan Carlos Pérez García" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Cédula *</label>
              <input name="cedula" required placeholder="1234567890" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Edad *</label>
              <input type="number" name="edad" required min={18} max={70} placeholder="30" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Barrio *</label>
            <input name="barrio" required placeholder="Kennedy" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Dirección *</label>
            <input name="direccion" required placeholder="Cra 50 #23-10" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Teléfono *</label>
              <input name="telefono" required placeholder="3001234567" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Email *</label>
              <input type="email" name="email" required placeholder="juan@email.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <h3 className="font-medium text-gray-900 text-sm">Requisitos</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="tiene_licencia" value="true" className="mt-0.5 w-4 h-4 accent-gray-900" />
              <span className="text-sm text-gray-700">Tengo licencia de conducción vigente</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="tiene_multas" value="true" className="mt-0.5 w-4 h-4 accent-gray-900" />
              <span className="text-sm text-gray-700">Tengo multas de tránsito pendientes</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {pending ? <><Loader2 size={15} className="animate-spin" /> Enviando…</> : 'Enviar solicitud'}
          </button>
        </form>
      </main>
    </div>
  )
}
