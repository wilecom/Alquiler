'use client'

import { useActionState, useState } from 'react'
import { crearContrato } from '../actions'
import { AlertCircle, Loader2 } from 'lucide-react'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

type Conductor = { id: string; nombre_completo: string; cedula: string }
type Vehiculo = { id: string; marca: string; modelo: number; placa: string; valor_comercial: number }

export function ContratoForm({
  conductores,
  vehiculos,
  preselectConductor,
}: {
  conductores: Conductor[]
  vehiculos: Vehiculo[]
  preselectConductor?: string
}) {
  const [state, action, pending] = useActionState(crearContrato, null)
  const [vehiculoId, setVehiculoId] = useState('')
  const error = state && 'error' in state
  const vehiculoSel = vehiculos.find((v) => v.id === vehiculoId)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Nuevo contrato</h1>
        <p className="text-gray-400 text-sm">
          Selecciona el conductor y el vehículo, y completa los datos del arrendamiento.
        </p>
      </div>

      <form action={action} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {'error' in state! && state!.error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Conductor</label>
          <select
            name="conductor_id"
            defaultValue={preselectConductor ?? ''}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="" disabled>
              {conductores.length === 0
                ? 'No hay conductores aprobados disponibles'
                : 'Selecciona un conductor'}
            </option>
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo} — CC {c.cedula}
              </option>
            ))}
          </select>
          {conductores.length === 0 && (
            <p className="text-xs text-gray-400">
              Ve a Conductores → aprueba uno → vuelve aquí.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Vehículo</label>
          <select
            name="vehiculo_id"
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="" disabled>
              {vehiculos.length === 0
                ? 'No hay vehículos disponibles'
                : 'Selecciona un vehículo'}
            </option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
          {vehiculos.length === 0 && (
            <p className="text-xs text-gray-400">
              Ve a Vehículos → registra uno → vuelve aquí.
            </p>
          )}
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
            defaultValue="viernes"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white capitalize"
          >
            {DIAS.map((d) => (
              <option key={d} value={d} className="capitalize">
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Depósito inicial ($)</label>
            <input
              type="number"
              name="deposito_inicial"
              defaultValue={350000}
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
              defaultValue={vehiculoSel?.valor_comercial ?? ''}
              key={vehiculoSel?.valor_comercial ?? 'empty'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Semanas para opción de compra</label>
          <input
            type="number"
            name="semanas_para_compra"
            defaultValue={110}
            min={1}
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400">
            Estándar Auto Leasing Medellín: 110 semanas ($22M ÷ $200K semanales).
          </p>
        </div>

        <button
          type="submit"
          disabled={pending || conductores.length === 0 || vehiculos.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {pending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Creando…
            </>
          ) : (
            'Crear contrato'
          )}
        </button>
      </form>
    </div>
  )
}
