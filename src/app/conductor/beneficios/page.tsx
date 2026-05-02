import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Gift, Sparkles } from 'lucide-react'

export default async function BeneficiosConductorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id, nombre_completo')
    .eq('user_id', user.id)
    .single()

  if (!conductor) {
    return (
      <div className="p-6 text-center text-gray-500">
        Perfil no encontrado.
      </div>
    )
  }

  const { data: beneficios } = await supabase
    .from('beneficios')
    .select('id, titulo, descripcion, fecha_activacion, fecha_expiracion')
    .eq('conductor_id', conductor.id)
    .eq('activo', true)
    .order('fecha_activacion', { ascending: false })

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Mis beneficios</h1>
        <p className="text-gray-400 text-sm">
          Recompensas por pagar cumplido
        </p>
      </div>

      {(!beneficios || beneficios.length === 0) ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <Gift className="mx-auto text-gray-200 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Aún no tienes beneficios activos</p>
          <p className="text-gray-400 text-sm mt-1">
            Sigue pagando puntualmente y el equipo te activará beneficios aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {beneficios.map((b) => (
            <div
              key={b.id}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-xl p-2 shrink-0">
                  <Sparkles className="text-purple-500" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{b.titulo}</p>
                  {b.descripcion && (
                    <p className="text-sm text-gray-600 mt-0.5">{b.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      Activado el{' '}
                      {format(parseISO(b.fecha_activacion), "d 'de' MMMM", { locale: es })}
                    </span>
                    {b.fecha_expiracion && (
                      <span>
                        Vence{' '}
                        {format(parseISO(b.fecha_expiracion), "d 'de' MMMM", { locale: es })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
