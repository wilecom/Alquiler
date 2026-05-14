'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { enviarSolicitud } from './actions'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Car,
  User,
  IdCard,
  AlertTriangle,
  Briefcase,
  ShieldCheck,
} from 'lucide-react'
import { CATEGORIA_LICENCIA_OPCIONES } from '@/lib/validators/solicitud'

const cardCls = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4'
const labelCls = 'text-xs font-medium text-gray-600'
const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

export default function SolicitudPage() {
  const [state, action, pending] = useActionState(enviarSolicitud, null)
  const success = state && 'success' in state
  const error = state && 'error' in state

  const [tieneLicencia, setTieneLicencia] = useState(true)
  const [tieneComparendos, setTieneComparendos] = useState(false)

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto text-green-500" size={48} />
          <h2 className="text-xl font-bold text-gray-900">¡Solicitud enviada!</h2>
          <p className="text-gray-500 text-sm">{'success' in state! && state!.success}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="relative bg-gray-900 text-white overflow-hidden">
        <Image
          src="/brand/hero-registro.png"
          alt=""
          aria-hidden
          width={1376}
          height={768}
          priority
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-transparent" />
        <div className="relative px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Car size={20} className="text-orange-500" />
            <span className="font-bold text-lg">
              Auto Leasing <span className="text-orange-500">Medellín</span>
            </span>
          </div>
          <p className="text-gray-300 text-sm">Tu carro propio en 110 semanas</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 my-4 text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-700">Solicitud de ingreso al programa</p>
          <p className="text-xs text-gray-500">
            Completa la información a continuación. El equipo revisará tu solicitud y te
            contactará por WhatsApp en un plazo de 48 horas hábiles. Luego seguimos con visita
            local y visita domiciliaria.
          </p>
        </div>

        <form action={action} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {'error' in state! && state!.error}
            </div>
          )}

          {/* 1. Datos personales */}
          <section className={cardCls}>
            <header className="flex items-center gap-2">
              <User size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">1. Datos personales</h2>
            </header>

            <Field label="Nombre completo *">
              <input name="nombre_completo" required placeholder="Juan Carlos Pérez García" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cédula *">
                <input name="cedula" required placeholder="1234567890" className={inputCls} />
              </Field>
              <Field label="Edad *">
                <input type="number" name="edad" required min={18} max={80} placeholder="30" className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono *">
                <input name="telefono" required placeholder="3001234567" className={inputCls} />
              </Field>
              <Field label="Email *">
                <input type="email" name="email" required placeholder="tu@email.com" className={inputCls} />
              </Field>
            </div>

            <Field label="Barrio *">
              <input name="barrio" required placeholder="Belén las Playas" className={inputCls} />
            </Field>
          </section>

          {/* 2. Licencia de conducción */}
          <section className={cardCls}>
            <header className="flex items-center gap-2">
              <IdCard size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">2. Licencia de conducción</h2>
            </header>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="tiene_licencia"
                checked={tieneLicencia}
                onChange={(e) => setTieneLicencia(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-gray-900"
              />
              <span className="text-sm text-gray-700">Tengo licencia de conducción vigente</span>
            </label>

            {tieneLicencia && (
              <Field label="Categoría *">
                <select name="categoria_licencia" required className={inputCls} defaultValue="">
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {CATEGORIA_LICENCIA_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </section>

          {/* 3. Comparendos */}
          <section className={cardCls}>
            <header className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">3. Comparendos</h2>
            </header>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="tiene_comparendos_pendientes"
                checked={tieneComparendos}
                onChange={(e) => setTieneComparendos(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-gray-900"
              />
              <span className="text-sm text-gray-700">
                Tengo comparendos pendientes en SIMIT
              </span>
            </label>

            {tieneComparendos && (
              <>
                <Field label="¿Cuántos? *">
                  <input
                    type="number"
                    name="cantidad_comparendos"
                    min={0}
                    max={50}
                    defaultValue={1}
                    className={inputCls}
                  />
                </Field>
                <Field label="Motivos / detalle *">
                  <textarea
                    name="motivos_comparendos"
                    required
                    rows={3}
                    className={inputCls}
                    placeholder="Ej: 1 por mal estacionamiento, 1 por SOAT vencido."
                  />
                </Field>
              </>
            )}
          </section>

          {/* 4. Trabajo, ingresos y uso del vehículo */}
          <section className={cardCls}>
            <header className="flex items-center gap-2">
              <Briefcase size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">4. Trabajo, ingresos y uso del vehículo</h2>
            </header>
            <p className="text-xs text-gray-500 -mt-2">
              Solo necesitamos tu declaración. Más adelante te pediremos extractos.
            </p>

            <Field label="Ocupación / actividad principal *">
              <input
                name="ocupacion"
                required
                placeholder="Conductor de plataformas, mensajero, comerciante…"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ingreso mensual estimado (COP) *">
                <input
                  type="number"
                  name="ingreso_mensual_estimado"
                  required
                  min={0}
                  step={50000}
                  placeholder="2500000"
                  className={inputCls}
                />
              </Field>
              <Field label="Años en la actividad">
                <input
                  type="number"
                  name="anos_actividad"
                  step={0.5}
                  min={0}
                  max={70}
                  placeholder="3"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="space-y-2 pt-1">
              <span className={labelCls}>¿Para qué vas a usar el vehículo? *</span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm cursor-pointer has-checked:border-gray-900 has-checked:bg-gray-50">
                  <input type="radio" name="uso_plataformas" value="" required className="accent-gray-900" />
                  Uso propio
                </label>
                <label className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm cursor-pointer has-checked:border-gray-900 has-checked:bg-gray-50">
                  <input type="radio" name="uso_plataformas" value="on" required className="accent-gray-900" />
                  Plataformas
                </label>
              </div>
              <p className="text-[11px] text-gray-400">
                Plataformas = Uber, Didi, InDriver, etc. No te pedimos detalle ahora.
              </p>
            </div>
          </section>

          {/* 5. Declaración Ley 1581 */}
          <section className={cardCls}>
            <header className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">5. Autorización Ley 1581 de 2012</h2>
            </header>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-2 max-h-60 overflow-y-auto">
              <p>
                Como titular de los datos personales, autorizo de manera previa, libre, expresa,
                informada e inequívoca a <strong>Auto Leasing Medellín</strong> para que recolecte,
                almacene, use, transfiera y trate mis datos personales con el fin de evaluar mi
                solicitud de leasing automotriz, ejecutar el contrato y dar cumplimiento a las
                obligaciones legales y comerciales derivadas.
              </p>
              <p>Autorizo expresamente la consulta y reporte ante:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>SIMIT — Sistema Integrado de Información de Multas y Sanciones por Infracciones de Tránsito.</li>
                <li>RUNT — Registro Único Nacional de Tránsito.</li>
                <li>Centrales de información financiera y crediticia (Datacrédito, TransUnion, CIFIN).</li>
                <li>Bases de datos de antecedentes judiciales y disciplinarios públicos.</li>
              </ul>
              <p>
                Declaro que la información suministrada es veraz y completa. Conozco mis derechos
                de acceso, rectificación, actualización y supresión consagrados en la Ley 1581 de
                2012 y el Decreto 1377 de 2013, y entiendo que puedo ejercerlos escribiendo a la
                línea de atención de Auto Leasing Medellín.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="acepta_habeas_data"
                required
                className="mt-0.5 w-4 h-4 accent-gray-900"
              />
              <span className="text-sm text-gray-700">
                Acepto y autorizo el tratamiento de mis datos personales en los términos
                anteriores.
              </span>
            </label>

            <p className="text-[11px] text-gray-400">
              Al enviar la solicitud queda registrada la fecha, hora, dirección IP y dispositivo
              como constancia de tu autorización.
            </p>
          </section>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {pending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Enviando…
              </>
            ) : (
              'Enviar solicitud'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}
