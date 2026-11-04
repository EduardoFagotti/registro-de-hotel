"use client"

import { useState } from "react"
import { LogIn, LogOut, Pencil, Plus, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

import { ConsumoDialog } from "@/components/consumo-dialog"
import { ContaResumo } from "@/components/conta-resumo"
import { PagamentoDialog } from "@/components/pagamento-dialog"
import { ReservaDialog } from "@/components/reserva-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dataCurta, diasEntre } from "@/lib/format"
import { statusReserva } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { Reserva } from "@/lib/types"

type Janela = "editar" | "consumo" | "pagamento" | "checkout" | null

export function StatusBadge({ status }: { status: Reserva["status"] }) {
  return <Badge className={statusReserva[status].badge}>{statusReserva[status].label}</Badge>
}

/** Dados de uma reserva com as ações que fazem sentido para o status dela. */
export function ReservaDetalhes({ reserva }: { reserva: Reserva }) {
  const { dados, hoje, checkIn, cancelarReserva } = useHotel()
  const [janela, setJanela] = useState<Janela>(null)
  const hospede = dados.hospedes.find((h) => h.id === reserva.hospedeId)
  const quarto = dados.quartos.find((q) => q.id === reserva.quartoId)
  const noites = diasEntre(reserva.entrada, reserva.saida)
  const fechar = (aberto: boolean) => !aberto && setJanela(null)
  const ativa = reserva.status === "reservada" || reserva.status === "hospedado"
  const saidaVencida = reserva.status === "hospedado" && reserva.saida <= hoje

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{hospede?.nome ?? "Hóspede removido"}</p>
          <p className="text-sm text-muted-foreground">
            {[hospede?.telefone, hospede?.documento].filter(Boolean).join(" · ") || "Sem contato"}
          </p>
        </div>
        <StatusBadge status={reserva.status} />
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-lg border p-3 text-sm">
        <Info rotulo="Quarto" valor={`${quarto?.numero ?? "—"} · ${quarto?.tipo ?? ""}`} />
        <Info rotulo="Entrada" valor={dataCurta(reserva.entrada)} />
        <Info
          rotulo="Saída"
          valor={`${dataCurta(reserva.saida)} (${noites}n)`}
          className={cn(saidaVencida && "text-rose-700 dark:text-rose-400")}
        />
        <Info rotulo="Pessoas" valor={String(reserva.pessoas)} />
        <Info rotulo="Código" valor={`#${reserva.codigo}`} />
        {reserva.obs && <Info rotulo="Obs." valor={reserva.obs} className="col-span-3" />}
      </dl>

      <ContaResumo reserva={reserva} editavel={reserva.status === "hospedado"} />

      {ativa && (
        <div className="grid grid-cols-2 gap-2">
          {reserva.status === "reservada" ? (
            <Button
              className="col-span-2"
              size="lg"
              onClick={() =>
                tentar(() => checkIn(reserva.id), `Check-in feito no quarto ${quarto?.numero}.`)
              }
            >
              <LogIn /> Fazer check-in
            </Button>
          ) : (
            <>
              <Button className="col-span-2" size="lg" onClick={() => setJanela("checkout")}>
                <LogOut /> Check-out
              </Button>
              <Button variant="outline" onClick={() => setJanela("consumo")}>
                <Plus /> Consumo
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setJanela("pagamento")}>
            <Wallet /> Pagamento
          </Button>
          <Button variant="outline" onClick={() => setJanela("editar")}>
            <Pencil /> Editar
          </Button>
          {reserva.status === "reservada" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  Cancelar reserva
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar a reserva #{reserva.codigo}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O quarto {quarto?.numero} fica livre para essas datas. Pagamentos já
                    recebidos continuam no caixa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => tentar(() => cancelarReserva(reserva.id), "Reserva cancelada.")}
                  >
                    Cancelar reserva
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      <ReservaDialog aberto={janela === "editar"} onAbertoChange={fechar} reserva={reserva} />
      <ConsumoDialog aberto={janela === "consumo"} onAbertoChange={fechar} reserva={reserva} />
      <PagamentoDialog aberto={janela === "pagamento"} onAbertoChange={fechar} reserva={reserva} />
      <PagamentoDialog
        checkout
        aberto={janela === "checkout"}
        onAbertoChange={fechar}
        reserva={reserva}
      />
    </div>
  )
}

function Info({ rotulo, valor, className }: { rotulo: string; valor: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="truncate font-medium">{valor}</dd>
    </div>
  )
}
