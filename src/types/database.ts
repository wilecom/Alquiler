export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          user_id: string
          rol: 'equipo' | 'conductor'
          nombre_completo: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rol: 'equipo' | 'conductor'
          nombre_completo: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rol?: 'equipo' | 'conductor'
          nombre_completo?: string
          created_at?: string
        }
      }
      vehiculos: {
        Row: {
          id: string
          marca: string
          modelo: number
          color: string
          placa: string
          numero_chasis: string
          numero_motor: string
          valor_comercial: number
          estado: 'disponible' | 'arrendado' | 'inactivo'
          created_at: string
        }
        Insert: {
          id?: string
          marca: string
          modelo: number
          color: string
          placa: string
          numero_chasis: string
          numero_motor: string
          valor_comercial: number
          estado?: 'disponible' | 'arrendado' | 'inactivo'
          created_at?: string
        }
        Update: {
          id?: string
          marca?: string
          modelo?: number
          color?: string
          placa?: string
          numero_chasis?: string
          numero_motor?: string
          valor_comercial?: number
          estado?: 'disponible' | 'arrendado' | 'inactivo'
          created_at?: string
        }
      }
      conductores: {
        Row: {
          id: string
          user_id: string | null
          nombre_completo: string
          cedula: string
          edad: number
          barrio: string
          direccion: string
          telefono: string
          email: string
          estado_solicitud: 'formulario' | 'visita_local' | 'visita_domiciliaria' | 'aprobado' | 'rechazado'
          tiene_licencia: boolean
          tiene_multas: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nombre_completo: string
          cedula: string
          edad: number
          barrio: string
          direccion: string
          telefono: string
          email: string
          estado_solicitud?: 'formulario' | 'visita_local' | 'visita_domiciliaria' | 'aprobado' | 'rechazado'
          tiene_licencia: boolean
          tiene_multas: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nombre_completo?: string
          cedula?: string
          edad?: number
          barrio?: string
          direccion?: string
          telefono?: string
          email?: string
          estado_solicitud?: 'formulario' | 'visita_local' | 'visita_domiciliaria' | 'aprobado' | 'rechazado'
          tiene_licencia?: boolean
          tiene_multas?: boolean
          created_at?: string
        }
      }
      entrevistas: {
        Row: {
          id: string
          conductor_id: string
          entrevistador: string
          fecha_entrevista: string
          vive_con: string | null
          es_casado: boolean | null
          tiene_hijos: boolean | null
          num_hijos: number | null
          tipo_vivienda: 'propia' | 'familiar' | 'arrendada' | null
          formacion: 'bachiller' | 'tecnico' | 'profesional' | 'posgrado' | null
          ocupacion_actual: string | null
          antecedentes: string | null
          trabajos_anteriores: string | null
          aspiraciones: string | null
          experiencia_plataformas: boolean | null
          tiempo_experiencia: string | null
          cuales_plataformas: string | null
          perfiles_activos: boolean | null
          produccion_mensual: number | null
          tiene_comparendos: boolean | null
          detalle_comparendos: string | null
          razon_entrega_anterior: string | null
          razon_no_compra: string | null
          ingresos: string | null
          tiene_deudas: boolean | null
          detalle_deudas: string | null
          responsabilidades: string | null
          personas_a_cargo: boolean | null
          reporte_datacredito: boolean | null
          ha_tenido_vehiculo: boolean | null
          tipo_tenencia: 'propio' | 'prestado' | 'arriendo' | null
          fuente_ingreso_adicional: string | null
          opcion_codeudor: 'finca_raiz' | 'dos_codeudores' | null
          observaciones: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['entrevistas']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['entrevistas']['Insert']>
      }
      contratos: {
        Row: {
          id: string
          conductor_id: string
          vehiculo_id: string
          fecha_inicio: string
          dia_pago: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
          primer_pago_fecha: string
          deposito_inicial: number
          valor_comercial_acordado: number
          semanas_para_compra: number
          semanas_pagadas: number
          semanas_aplazatorias: number
          ahorro_acumulado: number
          bonos_acumulados: number
          estado: 'activo' | 'terminado' | 'comprado'
          fecha_terminacion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conductor_id: string
          vehiculo_id: string
          fecha_inicio: string
          dia_pago: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
          primer_pago_fecha: string
          deposito_inicial?: number
          valor_comercial_acordado: number
          semanas_para_compra?: number
          semanas_pagadas?: number
          semanas_aplazatorias?: number
          ahorro_acumulado?: number
          bonos_acumulados?: number
          estado?: 'activo' | 'terminado' | 'comprado'
          fecha_terminacion?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contratos']['Insert']>
      }
      pagos: {
        Row: {
          id: string
          contrato_id: string
          tipo: 'canon' | 'aplazatoria'
          fecha_pago: string
          fecha_vencimiento: string
          monto: number
          dias_mora: number
          multa_mora: number
          comprobante_url: string | null
          estado: 'pendiente' | 'comprobante_subido' | 'verificado' | 'rechazado'
          aprobado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contrato_id: string
          tipo: 'canon' | 'aplazatoria'
          fecha_pago: string
          fecha_vencimiento: string
          monto: number
          dias_mora?: number
          multa_mora?: number
          comprobante_url?: string | null
          estado?: 'pendiente' | 'comprobante_subido' | 'verificado' | 'rechazado'
          aprobado_por?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['pagos']['Insert']>
      }
      aplazatorias_solicitudes: {
        Row: {
          id: string
          contrato_id: string
          semana_solicitada: string
          estado: 'pendiente' | 'aprobada' | 'rechazada'
          revisado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contrato_id: string
          semana_solicitada: string
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          revisado_por?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['aplazatorias_solicitudes']['Insert']>
      }
      comparendos: {
        Row: {
          id: string
          contrato_id: string
          fecha_notificacion: string
          fecha_limite_pago: string
          descripcion: string
          monto: number | null
          estado: 'pendiente' | 'pagado' | 'causal_terminacion'
          created_at: string
        }
        Insert: {
          id?: string
          contrato_id: string
          fecha_notificacion: string
          fecha_limite_pago: string
          descripcion: string
          monto?: number | null
          estado?: 'pendiente' | 'pagado' | 'causal_terminacion'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['comparendos']['Insert']>
      }
      liquidaciones: {
        Row: {
          id: string
          contrato_id: string
          ahorro_total: number
          deposito: number
          descuento_multas: number
          descuento_daños: number
          descuento_comparendos: number
          total_a_devolver: number
          razon_terminacion: 'voluntaria' | 'incumplimiento' | 'opcion_compra'
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contrato_id: string
          ahorro_total: number
          deposito: number
          descuento_multas?: number
          descuento_daños?: number
          descuento_comparendos?: number
          total_a_devolver: number
          razon_terminacion: 'voluntaria' | 'incumplimiento' | 'opcion_compra'
          notas?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['liquidaciones']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Tipos convenientes
export type Perfil = Database['public']['Tables']['perfiles']['Row']
export type Vehiculo = Database['public']['Tables']['vehiculos']['Row']
export type Conductor = Database['public']['Tables']['conductores']['Row']
export type Entrevista = Database['public']['Tables']['entrevistas']['Row']
export type Contrato = Database['public']['Tables']['contratos']['Row']
export type Pago = Database['public']['Tables']['pagos']['Row']
export type AplazatoriaSolicitud = Database['public']['Tables']['aplazatorias_solicitudes']['Row']
export type Comparendo = Database['public']['Tables']['comparendos']['Row']
export type Liquidacion = Database['public']['Tables']['liquidaciones']['Row']
