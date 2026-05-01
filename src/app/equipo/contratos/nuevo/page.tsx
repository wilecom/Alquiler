'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { crearContrato } from '../actions'
import { AlertCircle, Loader2 } from 'lucide-react'

function ContratoForm() {
  const [state, action, pending] = useActionState(crearContrato, null)
  const params = useSearchParams()
  const conductorId = params.get('conductor_id') ?? ''

  const error = state && 'error' in state

  const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Nuevo contrato</h1>
        <p className="text-gray-400 text-sm">Completa los datos para crear el contrato de arrendamiento.</p>
      </div>

      <form action={action} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {'error' in state! && state!.error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">ID del Conductor</label>
          <input
            name="conductor_id"
            defaultValue={conductorId}
            placeholder="UUID del conductor aprobado"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400">Ve a Conductores → Aprobado → Crear contrato para pre-llenar este campo.</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">ID del Vehículo</label>
          <input
            name="vehiculo_id"
            placeholder="UUID del vehículo disponible"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Fecha inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Primer pago</label>
            <input
              type="date"
              name="primer_pago_fecha"
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Día de pago semanal</label>
          <select
            name="dia_pago"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white capitalize"
          >
            {DIAS.map((d) => (
              <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Depósito inicial ($)</label>
            <input
              type="number"
              name="deposito_inicial"
              defaultValue={0}
              min={0}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Valor comercial acordado ($)</label>
            <input
              type="number"
              name="valor_comercial_acordado"
              required
              min={1}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Semanas para opción de compra</label>
          <input
            type="number"
            name="semanas_para_compra"
            defaultValue={104}
            min={1}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400">Estándar: 104 semanas (2 años)</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {pending ? <><Loader2 size={15} className="animate-spin" /> Creando…</> : 'Crear contrato'}
        </button>
      </form>
    </div>
  )
}

export default function NuevoContratoPage() {
  return (
    <Suspense>
      <ContratoForm />
    </Suspense>
  )
}
