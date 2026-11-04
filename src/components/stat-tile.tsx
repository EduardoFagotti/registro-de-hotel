import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const tons = {
  padrao: "bg-primary/15 text-primary-strong",
  bom: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  alerta: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  ruim: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
}

/** Card de indicador: título, número em destaque e ícone no canto. */
export function StatTile({
  titulo,
  valor,
  icone: Icone,
  dica,
  tom = "padrao",
}: {
  titulo: string
  valor: string
  icone: LucideIcon
  /** Linha de apoio abaixo do número. */
  dica?: React.ReactNode
  tom?: keyof typeof tons
}) {
  return (
    <div className="relative min-w-0 rounded-xl border bg-card p-3.5 lg:p-5">
      {/*
        Celular e tablet: título em cima com a largura toda; embaixo, ícone e número.
        Telas a partir de 1024 px: título no topo, número abaixo, ícone fixo no canto.
      */}
      <p className="text-xs leading-snug font-medium text-muted-foreground lg:pr-14 lg:text-sm">
        {titulo}
      </p>
      <div className="mt-2.5 flex items-center gap-2.5 lg:mt-0 lg:block">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg lg:absolute lg:top-4 lg:right-4 lg:size-11 lg:rounded-xl",
            tons[tom]
          )}
        >
          <Icone className="size-5 lg:size-6" />
        </span>
        <p className="truncate text-xl leading-none font-semibold tracking-tight tabular-nums lg:hidden">
          {valor}
        </p>
      </div>
      <p className="mt-2 hidden truncate text-2xl leading-none font-semibold tracking-tight tabular-nums lg:block">
        {valor}
      </p>
      {dica && <p className="mt-2 hidden text-xs text-muted-foreground xl:block">{dica}</p>}
    </div>
  )
}
