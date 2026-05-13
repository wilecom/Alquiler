'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { loginAction } from '@/app/auth/actions'
import { Car, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null)

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 overflow-hidden">
      {/* Hero background */}
      <Image
        src="/brand/hero-registro.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/90" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gray-900/80 rounded-2xl p-4 mb-4 ring-1 ring-orange-500/40 backdrop-blur-sm">
            <Car className="text-orange-500" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Auto Leasing <span className="text-orange-500">Medellín</span>
          </h1>
          <p className="text-gray-300 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Form */}
        <form action={action} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 mt-6">
          ¿Problemas para ingresar? Contacta al equipo.
        </p>
      </div>
    </div>
  )
}
