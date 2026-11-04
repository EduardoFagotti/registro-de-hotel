"use client"

import { useState } from "react"

import { ReservaDetalhes } from "@/components/reserva-detalhes"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useHotel } from "@/lib/hotel-store"

export function ReservaSheet({
  reservaId,
  onFechar,
}: {
  reservaId: string | null
  onFechar: () => void
}) {
  const { dados } = useHotel()
  // Mantém a última reserva na tela durante a animação de fechamento.
  const [ultimoId, setUltimoId] = useState(reservaId)
  if (reservaId && reservaId !== ultimoId) setUltimoId(reservaId)
  const reserva = dados.reservas.find((r) => r.id === (reservaId ?? ultimoId))

  return (
    <Sheet open={!!reservaId} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Reserva #{reserva?.codigo}</SheetTitle>
          <SheetDescription className="sr-only">Detalhes e ações da reserva</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">{reserva && <ReservaDetalhes reserva={reserva} />}</div>
      </SheetContent>
    </Sheet>
  )
}
