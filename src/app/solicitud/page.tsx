import Image from 'next/image'
import Link from 'next/link'
import {
  Car,
  ClipboardList,
  Phone,
  Home,
  Key,
  ChevronRight,
  Clock,
  ShieldCheck,
  IdCard,
  AlertTriangle,
  User,
} from 'lucide-react'

export default function SolicitudWelcomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HERO — imagen del Spark bolita arriba sin overlay agresivo, texto debajo */}
      <header className="relative bg-gray-900 text-white">
        {/* Top bar con marca */}
        <div className="relative z-10 px-4 pt-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Car size={20} className="text-orange-500" />
            <span className="font-bold text-base">
              Auto Leasing <span className="text-orange-500">Medellín</span>
            </span>
          </div>
        </div>

        {/* Imagen full-width — usamos la original que el usuario aprobó (Spark M250 Activo
            real, generación correcta entre el Matiz original y el GT moderno) */}
        <div className="relative aspect-[16/10] sm:aspect-[16/8] w-full overflow-hidden bg-gray-900">
          <Image
            src="/brand/3-sparks-medellin.png"
            alt="Tres Chevrolet Spark al atardecer con el skyline de Medellín"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 768px"
          />
          {/* Gradient sutil solo en el borde inferior para fundir con el texto */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
        </div>

        {/* Bloque de texto SOBRE fondo sólido (no sobre la imagen) */}
        <div className="relative px-4 pt-2 pb-8 max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold leading-[1.1] mb-3">
            Tu carro propio<br />
            <span className="text-orange-500">empieza aquí</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto">
            Arrendamos vehículos con opción de compra. Pagas semanalmente y cada cuota
            te acerca a quedarte con tu carro.
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
        {/* Tarjeta CTA principal — pegada al borde superior del main, sin solapamiento */}
        <Link
          href="/solicitud/empezar"
          className="block bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-4 mt-5 shadow-lg shadow-orange-900/20 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-base">Empezar mi solicitud</p>
              <p className="text-xs text-orange-100 flex items-center gap-1 mt-0.5">
                <Clock size={11} /> Toma menos de 3 minutos
              </p>
            </div>
            <ChevronRight size={22} className="text-white shrink-0" />
          </div>
        </Link>

        {/* Sección: ¿Cómo funciona? */}
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-orange-500 text-xs uppercase tracking-wider">El proceso</span>
          </h2>
          <ol className="space-y-2">
            <Paso n={1} icon={<ClipboardList size={16} className="text-orange-500" />} titulo="Llenas el formulario">
              Datos personales, licencia y comparendos. 3 minutos máximo.
            </Paso>
            <Paso n={2} icon={<ShieldCheck size={16} className="text-orange-500" />} titulo="Verificamos SIMIT y antecedentes">
              Revisamos tu información en SIMIT, RUNT y centrales de riesgo. 1 a 3 días hábiles.
            </Paso>
            <Paso n={3} icon={<Phone size={16} className="text-orange-500" />} titulo="Visita local en nuestras oficinas">
              Nos conocemos en persona y revisamos documentos.
            </Paso>
            <Paso n={4} icon={<Home size={16} className="text-orange-500" />} titulo="Visita domiciliaria">
              Vamos a tu casa para conocer tu entorno y validar referencias con tus codeudores.
            </Paso>
            <Paso n={5} icon={<Key size={16} className="text-orange-500" />} titulo="Recibes tu carro">
              Si todo encaja, te entregamos las llaves y empiezas a pagar tu carro propio.
            </Paso>
          </ol>
        </section>

        {/* Imagen emocional */}
        <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <Image
            src="/brand/welcome-llaves.png"
            alt="Conductor recibiendo las llaves de su Spark"
            width={1024}
            height={576}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Sección: ¿Qué te vamos a pedir? */}
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-orange-500 text-xs uppercase tracking-wider">
              Lo que vamos a pedirte ahora
            </span>
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <Item icon={<User size={16} className="text-gray-400" />} titulo="Datos personales">
              Nombre, cédula, edad, teléfono y email.
            </Item>
            <Item icon={<IdCard size={16} className="text-gray-400" />} titulo="Licencia de conducción">
              Si la tienes vigente y la categoría.
            </Item>
            <Item icon={<AlertTriangle size={16} className="text-gray-400" />} titulo="Comparendos">
              Si tienes pendientes en SIMIT y de qué se trata.
            </Item>
            <Item icon={<ShieldCheck size={16} className="text-gray-400" />} titulo="Autorización de tratamiento de datos">
              Tu permiso para validar tu información en bases públicas.
            </Item>
          </div>
          <p className="text-xs text-gray-500 mt-3 px-1">
            Los datos de dirección, ingresos y codeudores los recogemos más adelante en la
            visita local. Por ahora solo necesitamos lo de arriba.
          </p>
        </section>

        {/* CTA final */}
        <div className="mt-10">
          <Link
            href="/solicitud/empezar"
            className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-4 transition-colors"
          >
            Empezar mi solicitud
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3">
            ¿Tienes preguntas? Escríbenos por WhatsApp al{' '}
            <a
              href="https://wa.me/573044903559"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              +57 304 490 3559
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

function Paso({
  n,
  icon,
  titulo,
  children,
}: {
  n: number
  icon: React.ReactNode
  titulo: string
  children: React.ReactNode
}) {
  return (
    <li className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
          {n}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
          {icon} {titulo}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{children}</p>
      </div>
    </li>
  )
}

function Item({
  icon,
  titulo,
  children,
}: {
  icon: React.ReactNode
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{titulo}</p>
        <p className="text-xs text-gray-500 mt-0.5">{children}</p>
      </div>
    </div>
  )
}
