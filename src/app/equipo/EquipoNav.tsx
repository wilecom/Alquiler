'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Car, ClipboardList, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/equipo/dashboard',  icon: LayoutDashboard, label: 'Inicio',     match: ['/equipo/dashboard'] },
  { href: '/equipo/activos',    icon: Car,             label: 'Activos',    match: ['/equipo/activos', '/equipo/pagos', '/equipo/aplazatorias', '/equipo/beneficios', '/equipo/comparendos', '/equipo/conductores', '/equipo/vehiculos', '/equipo/contratos'] },
  { href: '/equipo/aspirantes', icon: ClipboardList,   label: 'Aspirantes', match: ['/equipo/aspirantes', '/equipo/solicitudes'] },
]

export default function EquipoNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (item: typeof navItems[number]) =>
    item.match.some((m) => pathname?.startsWith(m))
  const current = navItems.find(isActive)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
        {current && (
          <span className="text-sm text-gray-400 hidden sm:inline">
            · {current.label}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />

          <div className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="font-semibold text-white">Menú</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 max-w-3xl mx-auto">
              {navItems.map((item) => {
                const { href, icon: Icon, label } = item
                const active = isActive(item)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={
                      'flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 rounded-lg p-4 border transition-all ' +
                      (active
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                        : 'bg-gray-800/50 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700 hover:text-white')
                    }
                  >
                    <Icon size={26} />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
