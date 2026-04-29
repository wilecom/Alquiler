import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/auth/actions'
import { Wrench } from 'lucide-react'

export default async function EquipoDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">AutoLeasing — Equipo</span>
        <form action={logoutAction}>
          <button type="submit" className="text-gray-300 hover:text-white text-sm">
            Salir
          </button>
        </form>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <Wrench className="text-gray-300 mb-4" size={48} />
        <h1 className="text-xl font-bold text-gray-700">Panel del Equipo</h1>
        <p className="text-gray-400 text-sm mt-2">Próximamente — Fase 3 del proyecto.</p>
      </main>
    </div>
  )
}
