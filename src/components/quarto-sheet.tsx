"use client"

import { useState } from "react"
import { CalendarPlus, LogIn } from "lucide-react"

import { ReservaDetalhes } from "@/components/reserva-detalhes"
import { ReservaDialog } from "@/components/reserva-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { dataCurta } from "@/lib/format"
import { reservaAtual } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import type { Limpeza } from "@/lib/types"

const opcoesLimpeza: { valor: Limpeza; label: string }[] = [
  { valor: "limpo", label: "Limpo" },
  { valor: "sujo", label: "Sujo" },
  { valor: "manutencao", label: "Manutenção" },
]

export function QuartoSheet({
  quartoId,
  onFechar,
}: {
  quartoId: string | null
  onFechar: () => void
}) {
  const { dados, hoje, definirLimpeza } = useHotel()
  const [ultimoId, setUltimoId] = useState(quartoId)
  if (quartoId && quartoId !== ultimoId) setUltimoId(quartoId)
  const [dialogo, setDialogo] = useState<"reserva" | "checkin" | null>(null)

  const quarto = dados.quartos.find((q) => q.id === (quartoId ?? ultimoId))
  const atual = quarto && reservaAtual(dados.reservas, quarto.id, hoje)
  const proximas = quarto
    ? dados.reservas
        .filter((r) => r.quartoId === quarto.id && r.status === "reservada" && r.id !== atual?.id)
        .filter((r) => r.saida > hoje)
        .sort((a, b) => a.entrada.localeCompare(b.entrada))
        .slice(0, 4)
    : []

  return (
    <Sheet open={!!quartoId} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
        {quarto && (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg">Quarto {quarto.numero}</SheetTitle>
              <SheetDescription>
                {quarto.tipo} · até {quarto.capacidade} pessoas
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-4">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                className="w-full"
                value={quarto.limpeza}
                onValueChange={(v) => v && definirLimpeza(quarto.id, v as Limpeza)}
              >
                {opcoesLimpeza.map((o) => (
                  <ToggleGroupItem key={o.valor} value={o.valor} className="flex-1">
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {atual ? (
                <ReservaDetalhes reserva={atual} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="lg"
                    disabled={quarto.limpeza === "manutencao"}
                    onClick={() => setDialogo("checkin")}
                  >
                    <LogIn /> Check-in agora
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setDialogo("reserva")}>
                    <CalendarPlus /> Reservar
                  </Button>
                </div>
              )}

              {proximas.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Próximas reservas
                  </p>
                  <ul className="divide-y rounded-lg border text-sm">
                    {proximas.map((r) => (
                      <li key={r.id} className="flex justify-between gap-2 px-3 py-2">
                        <span className="truncate">
                          {dados.hospedes.find((h) => h.id === r.hospedeId)?.nome}
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {dataCurta(r.entrada)} → {dataCurta(r.saida)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <ReservaDialog
              aberto={dialogo !== null}
              onAbertoChange={(aberto) => !aberto && setDialogo(null)}
              modo={dialogo ?? "reserva"}
              quartoId={quarto.id}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
