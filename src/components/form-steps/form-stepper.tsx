"use client"

import { Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Uma etapa de formulário: título e ícone mostrados no desenho do progresso. */
export interface EtapaFormulario {
  titulo: string
  icone: LucideIcon
}

/**
 * Desenho do progresso: um ícone por etapa, ligados por uma linha.
 * Concluída = amarelo com ✓ · Atual = contorno amarelo · Falta = cinza.
 */
export function FormStepper({
  etapas,
  etapa,
  concluidas,
  podeIrPara,
  onSelecionar,
}: {
  etapas: readonly EtapaFormulario[]
  etapa: number
  /** Etapas já visitadas e com os campos obrigatórios preenchidos. */
  concluidas: boolean[]
  podeIrPara: (indice: number) => boolean
  onSelecionar: (indice: number) => void
}) {
  return (
    <nav aria-label="Etapas do preenchimento">
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${etapas.length}, 1fr)` }}>
        {etapas.map(({ titulo, icone: Icone }, i) => {
          const atual = i === etapa
          const feita = concluidas[i] && !atual
          return (
            <li key={titulo} className="relative flex flex-col items-center gap-1.5">
              {/* Linha até a próxima etapa: colorida quando esta já foi concluída */}
              {i < etapas.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-4 left-1/2 h-0.5 w-full -translate-y-1/2 transition-colors",
                    concluidas[i] ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onSelecionar(i)}
                disabled={!podeIrPara(i)}
                aria-current={atual ? "step" : undefined}
                aria-label={`Etapa ${i + 1}: ${titulo}${feita ? " (concluída)" : atual ? " (atual)" : ""}`}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed",
                  feita && "bg-primary text-primary-foreground",
                  atual && "border-2 border-primary bg-background text-primary-strong ring-4 ring-primary/20",
                  !feita && !atual && "border bg-muted text-muted-foreground"
                )}
              >
                {feita ? <Check className="size-4" strokeWidth={3} /> : <Icone className="size-4" />}
              </button>
              <span
                className={cn(
                  "text-[11px] leading-tight",
                  atual ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {titulo}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
