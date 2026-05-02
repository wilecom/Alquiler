'use client'

import { useTransition } from 'react'
import { desactivarBeneficio, reactivarBeneficio } from './actions'

type Props = { id: string; activo: boolean }

export function ToggleBeneficio({ id, activo }: Props) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      if (activo) await desactivarBeneficio(id)
      else await reactivarBeneficio(id)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
        activo
          ? 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-100'
          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
      }`}
    >
      {pending ? '…' : activo ? 'Desactivar' : 'Reactivar'}
    </button>
  )
}
