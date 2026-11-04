import { CalendarDays, type LucideIcon } from "lucide-react"

/** Área de cada página: margens e respiro iguais em todas as telas. */
export function Pagina({ children }: { children: React.ReactNode }) {
  return <div className="w-full px-4 pt-4 pb-8 sm:pt-8">{children}</div>
}

/** Título grande da página, com as ações à direita (no celular, abaixo). */
export function PageHeader({
  titulo,
  icone: Icone,
  data,
  children,
}: {
  titulo: string
  /** Ícone mostrado ao lado do título no celular. */
  icone?: LucideIcon
  /** Linha com a data acima do título (ex.: "Segunda-feira, 19 de outubro"). */
  data?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        {data && (
          <p className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <CalendarDays className="size-4" />
            <span className="first-letter:uppercase">{data}</span>
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:mt-1 sm:text-3xl">{titulo}</h1>
          {Icone && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-strong lg:hidden">
              <Icone className="size-5" />
            </span>
          )}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2 *:flex-1 sm:*:flex-none">{children}</div>}
    </div>
  )
}
