'use client'

import { useState } from 'react'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { subirAbonoExtra } from './actions'
import { createClient } from '@/lib/supabase/client'

const MAX_SIZE_MB = 10
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

type Props = { restante: number }

export function AbonoExtraForm({ restante }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const m = parseInt(monto || '0', 10)
  const semanasReducidas = m > 0 ? Math.floor(m / 200_000) : 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const fileInput = form.elements.namedItem('comprobante') as HTMLInputElement | null
    const file = fileInput?.files?.[0]
    const montoNum = parseInt(monto || '0', 10)

    if (!montoNum || montoNum <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (montoNum > restante) {
      setError(`El monto supera el saldo restante (${restante.toLocaleString('es-CO')} COP).`)
      return
    }
    if (!file) {
      setError('Selecciona el comprobante de pago.')
      return
    }
    if (!ALLOWED.includes(file.type)) {
      setError('Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_SIZE_MB} MB.`)
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sesión expirada.'); setPending(false); return }
      const { data: cond } = await supabase
        .from('conductores').select('id').eq('user_id', user.id).single()
      if (!cond) { setError('Perfil no encontrado.'); setPending(false); return }
      const { data: contrato } = await supabase
        .from('contratos').select('id').eq('conductor_id', cond.id).eq('estado', 'activo').maybeSingle()
      if (!contrato) { setError('Sin contrato activo.'); setPending(false); return }

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${contrato.id}/abono_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('comprobantes').upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) {
        setError('No se pudo subir el archivo.')
        setPending(false)
        return
      }

      const result = await subirAbonoExtra({ path, monto: montoNum })
      if (result && 'error' in result) setError(result.error)
      else if (result && 'success' in result) setSuccess(result.success)
    } catch (err) {
      console.error(err)
      setError('Error inesperado.')
    } finally {
      setPending(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="text-green-500" size={48} />
        <p className="font-semibold text-green-700">{success}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-green-600 underline">
          Volver
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex gap-2 text-sm text-red-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
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
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {semanasReducidas > 0 && (
          <p className="text-xs text-purple-600 mt-1">
            ≈ {semanasReducidas} semana{semanasReducidas !== 1 ? 's' : ''} menos
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comprobante" className="block text-xs text-gray-500 mb-1">
          Comprobante (imagen o PDF, máx. {MAX_SIZE_MB} MB)
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

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-xl py-2.5 transition-colors"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {pending ? 'Enviando…' : 'Enviar abono extra'}
      </button>
    </form>
  )
}
