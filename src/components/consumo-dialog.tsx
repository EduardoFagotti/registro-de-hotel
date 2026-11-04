"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { itensRapidos } from "@/lib/exemplo"
import { lerValor, moeda } from "@/lib/format"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { Reserva } from "@/lib/types"

export function ConsumoDialog({
  reserva,
  aberto,
  onAbertoChange,
}: {
  reserva: Reserva
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
}) {
  const { adicionarConsumo } = useHotel()
  const [descricao, setDescricao] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [valor, setValor] = useState("")

  function lancarRapido(item: (typeof itensRapidos)[number]) {
    tentar(
      () => adicionarConsumo(reserva.id, { ...item, quantidade: 1 }),
      `${item.descricao} lançado.`
    )
  }

  function lancar(e: React.FormEvent) {
    e.preventDefault()
    const ok = tentar(
      () =>
        adicionarConsumo(reserva.id, {
          descricao,
          quantidade: Number(quantidade),
          valor: lerValor(valor),
        }),
      `${descricao} lançado.`
    )
    if (ok) {
      setDescricao("")
      setQuantidade("1")
      setValor("")
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar consumo</DialogTitle>
          <DialogDescription>
            Um clique nos itens abaixo já lança 1 unidade na conta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {itensRapidos.map((item) => (
            <Button
              key={item.descricao}
              variant="outline"
              className="h-auto flex-col items-start gap-0 px-3 py-2"
              onClick={() => lancarRapido(item)}
            >
              <span className="w-full truncate text-left">{item.descricao}</span>
              <span className="text-xs font-normal text-muted-foreground">{moeda(item.valor)}</span>
            </Button>
          ))}
        </div>

        <form onSubmit={lancar} className="grid grid-cols-[1fr_4rem_6rem_auto] items-end gap-2 border-t pt-4">
          <Field>
            <FieldLabel htmlFor="consumo-desc">Outro item</FieldLabel>
            <Input id="consumo-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="consumo-qtd">Qtd.</FieldLabel>
            <Input
              id="consumo-qtd"
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="consumo-valor">Valor</FieldLabel>
            <Input
              id="consumo-valor"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </Field>
          <Button type="submit" size="icon" aria-label="Lançar item">
            <Plus />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
