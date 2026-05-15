import { logoutAction } from '@/app/auth/actions'
import EquipoNav from './EquipoNav'

export default function EquipoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <EquipoNav />
          <span className="font-bold text-base sm:text-lg">
            Auto Leasing <span className="text-orange-500">Medellín</span>
            <span className="text-gray-400 font-normal text-sm hidden sm:inline"> · Equipo</span>
          </span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-gray-400 hover:text-white text-sm transition-colors">
            Salir
          </button>
        </form>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
