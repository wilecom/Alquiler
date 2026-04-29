import Link from 'next/link'
import { Home, Upload, Clock, CalendarOff } from 'lucide-react'
import { logoutAction } from '@/app/auth/actions'

const navItems = [
  { href: '/conductor/dashboard', icon: Home, label: 'Inicio' },
  { href: '/conductor/pagos', icon: Upload, label: 'Pagar' },
  { href: '/conductor/aplazatoria', icon: CalendarOff, label: 'Aplazar' },
  { href: '/conductor/historial', icon: Clock, label: 'Historial' },
]

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">AutoLeasing</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-blue-100 hover:text-white text-sm transition-colors"
          >
            Salir
          </button>
        </form>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
