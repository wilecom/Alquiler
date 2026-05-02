'use client'

import { useActionState } from 'react'
import { actualizarConductor, type ActualizarState } from './actions'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const ESTADOS_SOLICITUD = ['formulario', 'visita_local', 'visita_domiciliaria', 'aprobado', 'rechazado']
const ESTADOS_CONTRATO = ['activo', 'terminado', 'comprado']

type Conductor = {
  id: string
  nombre_completo: string
  cedula: string
  edad: number
  telefono: string
  email: string
  barrio: string
  direccion: string
  tiene_licencia: boolean
  tiene_multas: boolean
  estado_solicitud: string
}

type Contrato = {
  id: string
  fecha_inicio: string
  primer_pago_fecha: string
  dia_pago: string
  deposito_inicial: number
  valor_comercial_acordado: number
  semanas_pagadas: number
  semanas_aplazatorias: number
  ahorro_acumulado: number
  bonos_acumulados: number
  abonos_extras_acumulados: number
  estado: string
} | null

type Vehiculo = {
  id: string
  marca: string
  modelo: number
  color: string
  placa: string
  numero_chasis: string
  numero_motor: string
  valor_comercial: number
} | null

const baseInput =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
const baseLabel = 'block text-xs font-medium text-gray-600 mb-1'

export function EditarForm({
  conductor,
  contrato,
  vehiculo,
}: {
  conductor: Conductor
  contrato: Contrato
  vehiculo: Vehiculo
}) {
  const action = actualizarConductor.bind(null, conductor.id)
  const [state, formAction, pending] = useActionState<ActualizarState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {state && 'error' in state && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {state.error}
        </div>
      )}
      {state && 'success' in state && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-green-700">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> {state.success}
        </div>
      )}

      {/* CONDUCTOR */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Datos del conductor</h2>

        <div>
          <label className={baseLabel}>Nombre completo</label>
          <input name="c_nombre_completo" defaultValue={conductor.nombre_completo} required className={baseInput} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={baseLabel}>Cédula</label>
            <input name="c_cedula" defaultValue={conductor.cedula} required className={baseInput} />
          </div>
          <div>
            <label className={baseLabel}>Edad</label>
            <input
              type="number"
              name="c_edad"
              defaultValue={conductor.edad}
              min={18}
              required
              className={baseInput}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={baseLabel}>Teléfono</label>
            <input name="c_telefono" defaultValue={conductor.telefono} required className={baseInput} />
          </div>
          <div>
            <label className={baseLabel}>Email</label>
            <input type="email" name="c_email" defaultValue={conductor.email} required className={baseInput} />
          </div>
        </div>

        <div>
          <label className={baseLabel}>Barrio</label>
          <input name="c_barrio" defaultValue={conductor.barrio} required className={baseInput} />
        </div>

        <div>
          <label className={baseLabel}>Dirección</label>
          <input name="c_direccion" defaultValue={conductor.direccion} required className={baseInput} />
        </div>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" name="c_tiene_licencia" defaultChecked={conductor.tiene_licencia} />
            Tiene licencia
          </label>
          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" name="c_tiene_multas" defaultChecked={conductor.tiene_multas} />
            Tiene multas
          </label>
        </div>

        <div>
          <label className={baseLabel}>Estado de la solicitud</label>
          <select
            name="c_estado_solicitud"
            defaultValue={conductor.estado_solicitud}
            className={`${baseInput} bg-white`}
          >
            {ESTADOS_SOLICITUD.map((e) => (
              <option key={e} value={e}>
                {e.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* CONTRATO */}
      {contrato ? (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Contrato</h2>
          <input type="hidden" name="contrato_id" value={contrato.id} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={baseLabel}>Fecha inicio</label>
              <input
                type="date"
                name="ct_fecha_inicio"
                defaultValue={contrato.fecha_inicio}
                required
                className={baseInput}
              />
            </div>
            <div>
              <label className={baseLabel}>Primer pago</label>
              <input
                type="date"
                name="ct_primer_pago_fecha"
                defaultValue={contrato.primer_pago_fecha}
                required
                className={baseInput}
              />
            </div>
          </div>

          <div>
            <label className={baseLabel}>Día de pago semanal</label>
            <select
              name="ct_dia_pago"
              defaultValue={contrato.dia_pago}
              className={`${baseInput} bg-white capitalize`}
            >
              {DIAS.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={baseLabel}>Depósito inicial ($)</label>
              <input
                type="number"
                name="ct_deposito_inicial"
                defaultValue={contrato.deposito_inicial}
                min={0}
                required
                className={baseInput}
              />
            </div>
            <div>
              <label className={baseLabel}>Valor comercial ($)</label>
              <input
                type="number"
                name="ct_valor_comercial_acordado"
                defaultValue={contrato.valor_comercial_acordado}
                min={1}
                required
                className={baseInput}
              />
            </div>
          </div>

          <div>
            <label className={baseLabel}>Estado del contrato</label>
            <select
              name="ct_estado"
              defaultValue={contrato.estado}
              className={`${baseInput} bg-white capitalize`}
            >
              {ESTADOS_CONTRATO.map((e) => (
                <option key={e} value={e} className="capitalize">
                  {e}
                </option>
              ))}
            </select>
          </div>

          <details className="border border-gray-100 rounded-xl">
            <summary className="px-3 py-2 text-xs text-gray-500 cursor-pointer select-none">
              Ajustes manuales (semanas y acumulados) — usar con cuidado
            </summary>
            <div className="px-3 pb-3 pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={baseLabel}>Semanas pagadas</label>
                  <input
                    type="number"
                    name="ct_semanas_pagadas"
                    defaultValue={contrato.semanas_pagadas}
                    min={0}
                    className={baseInput}
                  />
                </div>
                <div>
                  <label className={baseLabel}>Semanas aplazatorias</label>
                  <input
                    type="number"
                    name="ct_semanas_aplazatorias"
                    defaultValue={contrato.semanas_aplazatorias}
                    min={0}
                    className={baseInput}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={baseLabel}>Ahorro ($)</label>
                  <input
                    type="number"
                    name="ct_ahorro_acumulado"
                    defaultValue={contrato.ahorro_acumulado}
                    min={0}
                    className={baseInput}
                  />
                </div>
                <div>
                  <label className={baseLabel}>Bonos ($)</label>
                  <input
                    type="number"
                    name="ct_bonos_acumulados"
                    defaultValue={contrato.bonos_acumulados}
                    min={0}
                    className={baseInput}
                  />
                </div>
                <div>
                  <label className={baseLabel}>Abonos extras ($)</label>
                  <input
                    type="number"
                    name="ct_abonos_extras_acumulados"
                    defaultValue={contrato.abonos_extras_acumulados}
                    min={0}
                    className={baseInput}
                  />
                </div>
              </div>
            </div>
          </details>
        </section>
      ) : (
        <section className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
          Este conductor aún no tiene contrato.
        </section>
      )}

      {/* VEHICULO */}
      {vehiculo && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Vehículo</h2>
          <input type="hidden" name="vehiculo_id" value={vehiculo.id} />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={baseLabel}>Marca</label>
              <input name="v_marca" defaultValue={vehiculo.marca} required className={baseInput} />
            </div>
            <div>
              <label className={baseLabel}>Modelo (año)</label>
              <input
                type="number"
                name="v_modelo"
                defaultValue={vehiculo.modelo}
                min={1980}
                max={2100}
                required
                className={baseInput}
              />
            </div>
            <div>
              <label className={baseLabel}>Color</label>
              <input name="v_color" defaultValue={vehiculo.color} required className={baseInput} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={baseLabel}>Placa</label>
              <input name="v_placa" defaultValue={vehiculo.placa} required className={baseInput} />
            </div>
            <div>
              <label className={baseLabel}>Valor comercial ($)</label>
              <input
                type="number"
                name="v_valor_comercial"
                defaultValue={vehiculo.valor_comercial}
                min={1}
                required
                className={baseInput}
              />
            </div>
          </div>

          <div>
            <label className={baseLabel}>Número de chasis</label>
            <input name="v_numero_chasis" defaultValue={vehiculo.numero_chasis} required className={baseInput} />
          </div>

          <div>
            <label className={baseLabel}>Número de motor</label>
            <input name="v_numero_motor" defaultValue={vehiculo.numero_motor} required className={baseInput} />
          </div>
        </section>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-xl py-3 text-sm transition-colors"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : null}
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
