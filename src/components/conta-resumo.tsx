"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { moeda } from "@/lib/format"
import { conta } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import type { Reserva } from "@/lib/types"

export function ContaResumo({
  reserva,
  saida,
  editavel = false,
}: {
  reserva: Reserva
  saida?: string
  /** Permite remover consumos lançados. */
  editavel?: boolean
}) {
  const { dados, removerConsumo } = useHotel()
  const c = conta(reserva, dados.lancamentos, saida)

  return (
    <div className="rounded-lg border text-sm">
      <div className="flex flex-col gap-1.5 p-3">
        <Linha
          label={`Diárias (${c.noites} × ${moeda(reserva.diaria)})`}
          valor={moeda(c.diarias)}
        />
        {reserva.consumos.map((item) => (
          <div key={item.id} className="group flex items-center justify-between gap-2 text-muted-foreground">
            <span className="truncate">
              {item.quantidade}× {item.descricao}
            </span>
            <span className="flex items-center gap-1">
              {moeda(item.quantidade * item.valor)}
              {editavel && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="-my-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Remover ${item.descricao}`}
                  onClick={() => removerConsumo(reserva.id, item.id)}
                >
                  <X />
                </Button>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 border-t bg-muted/40 p-3">
        <Linha label="Total" valor={moeda(c.total)} />
        {c.pago !== 0 && <Linha label="Pago" valor={`− ${moeda(c.pago)}`} />}
        <Linha
          forte
          label={c.saldo < 0 ? "Crédito do hóspede" : "A receber"}
          valor={moeda(Math.abs(c.saldo))}
          className={cn(c.saldo > 0 && "text-rose-700 dark:text-rose-400", c.saldo <= 0 && "text-emerald-700 dark:text-emerald-400")}
        />
      </div>
    </div>
  )
}

function Linha({
  label,
  valor,
  forte,
  className,
}: {
  label: string
  valor: string
  forte?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex justify-between gap-2", forte && "font-semibold", className)}>
      <span>{label}</span>
      <span className="tabular-nums">{valor}</span>
    </div>
  )
}
