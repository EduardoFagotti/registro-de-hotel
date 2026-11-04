"use client"

import { useState } from "react"

import { ContaResumo } from "@/components/conta-resumo"
import { FormaPagamentoToggle } from "@/components/forma-pagamento"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { lerValor, moeda } from "@/lib/format"
import { conta, saidaNoCheckout } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { FormaPagamento, Reserva } from "@/lib/types"

export function PagamentoDialog({
  reserva,
  checkout = false,
  aberto,
  onAbertoChange,
}: {
  reserva: Reserva
  /** No check-out o saldo é recebido e a hospedagem é encerrada. */
  checkout?: boolean
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
}) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-sm">
        <PagamentoForm reserva={reserva} checkout={checkout} onConcluir={() => onAbertoChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PagamentoForm({
  reserva,
  checkout,
  onConcluir,
}: {
  reserva: Reserva
  checkout: boolean
  onConcluir: () => void
}) {
  const { dados, hoje, receberPagamento, checkOut } = useHotel()
  const saida = checkout ? saidaNoCheckout(reserva, hoje) : reserva.saida
  const c = conta(reserva, dados.lancamentos, saida)
  const [forma, setForma] = useState<FormaPagamento>("pix")
  const [valor, setValor] = useState(c.saldo > 0 ? c.saldo.toFixed(2).replace(".", ",") : "")
  const quarto = dados.quartos.find((q) => q.id === reserva.quartoId)

  function confirmar(e: React.FormEvent) {
    e.preventDefault()
    const ok = checkout
      ? tentar(() => checkOut(reserva.id, forma), `Check-out do quarto ${quarto?.numero} concluído.`)
      : tentar(() => receberPagamento(reserva.id, lerValor(valor), forma), "Pagamento registrado.")
    if (ok) onConcluir()
  }

  return (
    <form onSubmit={confirmar} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{checkout ? `Check-out · Quarto ${quarto?.numero}` : "Receber pagamento"}</DialogTitle>
        <DialogDescription>
          {checkout && saida !== reserva.saida
            ? "A estadia foi recalculada até hoje."
            : `Reserva #${reserva.codigo}`}
        </DialogDescription>
      </DialogHeader>

      <ContaResumo reserva={reserva} saida={saida} />

      {(!checkout || c.saldo > 0) && (
        <>
          {!checkout && (
            <Field>
              <FieldLabel htmlFor="pag-valor">Valor (R$)</FieldLabel>
              <Input
                id="pag-valor"
                autoFocus
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>Forma de pagamento</FieldLabel>
            <FormaPagamentoToggle valor={forma} onChange={setForma} />
          </Field>
        </>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Voltar
          </Button>
        </DialogClose>
        <Button type="submit">
          {checkout
            ? c.saldo > 0
              ? `Receber ${moeda(c.saldo)} e encerrar`
              : "Encerrar hospedagem"
            : "Registrar pagamento"}
        </Button>
      </DialogFooter>
    </form>
  )
}
