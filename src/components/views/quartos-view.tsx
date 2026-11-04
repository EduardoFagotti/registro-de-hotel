"use client"

import { useState } from "react"
import { DoorOpen, Plus } from "lucide-react"

import { PageHeader, Pagina } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { lerValor, moeda } from "@/lib/format"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { Limpeza, Quarto } from "@/lib/types"

const limpezaLabel: Record<Limpeza, string> = {
  limpo: "Limpo",
  sujo: "Sujo",
  manutencao: "Manutenção",
}

export function QuartosView() {
  const { dados } = useHotel()
  const [editando, setEditando] = useState<Quarto | "novo" | null>(null)

  return (
    <Pagina>
      <PageHeader titulo="Quartos" icone={DoorOpen}>
        <Button size="lg" onClick={() => setEditando("novo")}>
          <Plus /> Novo quarto
        </Button>
      </PageHeader>

      <div>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Capacidade</TableHead>
                <TableHead className="text-right">Diária</TableHead>
                <TableHead className="pr-4 text-right">Limpeza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.quartos.map((q) => (
                <TableRow key={q.id} className="cursor-pointer" onClick={() => setEditando(q)}>
                  <TableCell className="pl-4 font-semibold tabular-nums">{q.numero}</TableCell>
                  <TableCell>{q.tipo}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.capacidade}</TableCell>
                  <TableCell className="text-right tabular-nums">{moeda(q.diaria)}</TableCell>
                  <TableCell className="pr-4 text-right">{limpezaLabel[q.limpeza]}</TableCell>
                </TableRow>
              ))}
              {dados.quartos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum quarto cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editando !== null} onOpenChange={(aberto) => !aberto && setEditando(null)}>
        <DialogContent className="sm:max-w-sm">
          {editando !== null && (
            <QuartoForm
              quarto={editando === "novo" ? undefined : editando}
              onConcluir={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Pagina>
  )
}

function QuartoForm({ quarto, onConcluir }: { quarto?: Quarto; onConcluir: () => void }) {
  const { dados, salvarQuarto, removerQuarto } = useHotel()
  const [numero, setNumero] = useState(quarto?.numero ?? "")
  const [tipo, setTipo] = useState(quarto?.tipo ?? "")
  const [capacidade, setCapacidade] = useState(String(quarto?.capacidade ?? 2))
  const [diaria, setDiaria] = useState(quarto ? String(quarto.diaria) : "")
  const tipos = [...new Set(dados.quartos.map((q) => q.tipo))]
  const temReservas = !!quarto && dados.reservas.some((r) => r.quartoId === quarto.id)

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const valor = lerValor(diaria)
    const ok = tentar(() => {
      if (!tipo.trim()) throw new Error("Informe o tipo do quarto.")
      if (!(Number(capacidade) >= 1)) throw new Error("Capacidade inválida.")
      if (!(valor >= 0)) throw new Error("Valor da diária inválido.")
      salvarQuarto({ id: quarto?.id, numero, tipo: tipo.trim(), capacidade: Number(capacidade), diaria: valor })
    }, quarto ? "Quarto atualizado." : "Quarto cadastrado.")
    if (ok) onConcluir()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{quarto ? `Quarto ${quarto.numero}` : "Novo quarto"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="quarto-numero">Número</FieldLabel>
          <Input id="quarto-numero" autoFocus value={numero} onChange={(e) => setNumero(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="quarto-tipo">Tipo</FieldLabel>
          <Input
            id="quarto-tipo"
            list="tipos-quarto"
            placeholder="Standard"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <datalist id="tipos-quarto">
            {tipos.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="quarto-capacidade">Capacidade</FieldLabel>
          <Input
            id="quarto-capacidade"
            type="number"
            min={1}
            value={capacidade}
            onChange={(e) => setCapacidade(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="quarto-diaria">Diária (R$)</FieldLabel>
          <Input
            id="quarto-diaria"
            inputMode="decimal"
            placeholder="0,00"
            value={diaria}
            onChange={(e) => setDiaria(e.target.value)}
          />
        </Field>
      </div>
      <DialogFooter className="sm:justify-between">
        {quarto && !temReservas ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => tentar(() => removerQuarto(quarto.id), "Quarto removido.") && onConcluir()}
          >
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit">Salvar</Button>
        </div>
      </DialogFooter>
    </form>
  )
}
