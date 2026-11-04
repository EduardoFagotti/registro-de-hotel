"use client"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** Modal dos formulários em etapas: tela cheia no celular, janela a partir do tablet. */
export function StepDialog({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  children,
}: {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  titulo: string
  descricao: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-h-[90vh] sm:max-w-xl">
        <DialogHeader className="px-4 pt-4 pr-12 pb-2 text-left sm:px-6 sm:pt-5">
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

/** Rodapé fixo: Voltar e Próximo; na última etapa, Próximo vira o botão de salvar. */
export function StepFooter({
  etapa,
  ultima,
  onVoltar,
  onAvancar,
  rotuloSalvar,
  resumo,
}: {
  etapa: number
  ultima: number
  onVoltar: () => void
  onAvancar: () => void
  rotuloSalvar: string
  /** Informação à esquerda (ex.: total previsto). */
  resumo?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t bg-popover px-4 py-3 sm:px-6 sm:pb-5">
      {resumo && <div className="mr-auto hidden text-sm text-muted-foreground sm:block">{resumo}</div>}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onVoltar}
        className={cn(etapa === 0 && "hidden")}
      >
        Voltar
      </Button>
      <Button
        type="button"
        size="lg"
        onClick={onAvancar}
        className={cn("flex-1 sm:min-w-36 sm:flex-none", etapa === ultima && "hidden")}
      >
        Próximo
      </Button>
      <Button
        type="submit"
        size="lg"
        className={cn("flex-1 sm:min-w-44 sm:flex-none", etapa !== ultima && "hidden")}
      >
        {rotuloSalvar}
      </Button>
    </div>
  )
}
