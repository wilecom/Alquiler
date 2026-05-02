import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PerfilForm } from './PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductor } = await supabase
    .from('conductores')
    .select('nombre_completo, cedula, email, telefono, barrio, direccion')
    .eq('user_id', user.id)
    .single()

  if (!conductor) {
    return (
      <div className="p-6 text-center text-gray-500">
        Perfil no encontrado. Contacta al equipo.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-400 text-sm">Actualiza tus datos de contacto</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div>
          <p className="text-xs text-gray-400">Nombre</p>
          <p className="text-gray-900 font-medium">{conductor.nombre_completo}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Cédula</p>
          <p className="text-gray-900 font-medium">{conductor.cedula}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Email</p>
          <p className="text-gray-900 font-medium">{conductor.email}</p>
        </div>
      </div>

      <PerfilForm
        defaults={{
          telefono: conductor.telefono,
          barrio: conductor.barrio,
          direccion: conductor.direccion,
        }}
      />
    </div>
  )
}
