'use client'

import { useState } from 'react'
import { subirComprobante } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'

const MAX_SIZE_MB = 10
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export default function PagosPage() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const fileInput = form.elements.namedItem('comprobante') as HTMLInputElement | null
    const file = fileInput?.files?.[0]
    if (!file) {
      setError('Selecciona una imagen o PDF del comprobante.')
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
      if (!user) {
        setError('Sesión expirada, vuelve a iniciar sesión.')
        setPending(false)
        return
      }
      const { data: cond } = await supabase
        .from('conductores')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!cond) {
        setError('Perfil no encontrado.')
        setPending(false)
        return
      }
      const { data: contrato } = await supabase
        .from('contratos')
        .select('id')
        .eq('conductor_id', cond.id)
        .eq('estado', 'activo')
        .maybeSingle()
      if (!contrato) {
        setError('No tienes un contrato activo.')
        setPending(false)
        return
      }

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${contrato.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('comprobantes')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) {
        setError('No se pudo subir el archivo. Intenta de nuevo.')
        setPending(false)
        return
      }

      const result = await subirComprobante({ path })
      if (result && 'error' in result) {
        setError(result.error)
      } else if (result && 'success' in result) {
        setSuccess(result.success)
      }
    } catch (err) {
      console.error(err)
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900">Subir comprobante</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Sube la foto o PDF de tu pago semanal ($480.000)
        </p>
      </div>

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
          <p className="font-semibold text-green-700">{success}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-green-600 underline"
          >
            Subir otro comprobante
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <label
            htmlFor="comprobante"
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <FileText className="text-gray-300" size={40} />
            <div className="text-center">
              <p className="font-medium text-gray-600 text-sm">Toca para seleccionar</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP o PDF — máx. {MAX_SIZE_MB} MB</p>
            </div>
          </label>

          <input
            id="comprobante"
            type="file"
            name="comprobante"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />

          <p className="text-xs text-center text-gray-400 -mt-2">
            {fileName ?? 'Ningún archivo seleccionado'}
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
