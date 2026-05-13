import Link from 'next/link'
import { LayoutDashboard, CreditCard, CalendarOff, Users, Car, AlertTriangle, Gift } from 'lucide-react'
import { logoutAction } from '@/app/auth/actions'

const navItems = [
  { href: '/equipo/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/equipo/pagos', icon: CreditCard, label: 'Pagos' },
  { href: '/equipo/aplazatorias', icon: CalendarOff, label: 'Aplazar' },
  { href: '/equipo/conductores', icon: Users, label: 'Conductores' },
  { href: '/equipo/vehiculos', icon: Car, label: 'Vehículos' },
  { href: '/equipo/comparendos', icon: AlertTriangle, label: 'Comparendos' },
  { href: '/equipo/beneficios', icon: Gift, label: 'Beneficios' },
]

export default function EquipoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <span className="font-bold text-lg">
          Auto Leasing <span className="text-orange-500">Medellín</span>{' '}
          <span className="text-gray-400 font-normal text-sm">· Equipo</span>
        </span>
        <form action={logoutAction}>
          <button type="submit" className="text-gray-400 hover:text-white text-sm transition-colors">
            Salir
          </button>
        </form>
      </header>

      <main className="flex-1 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex overflow-x-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 min-w-0 flex flex-col items-center py-2 gap-0.5 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Icon size={20} />
            <span className="text-[10px] truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
