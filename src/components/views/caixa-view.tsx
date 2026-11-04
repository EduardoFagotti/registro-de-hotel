"use client"

import { useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Scale,
  Trash2,
  Wallet,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

import { FormaPagamentoToggle } from "@/components/forma-pagamento"
import { PageHeader, Pagina } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
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
import { dataLonga, hora, lerValor, moeda, somarDias } from "@/lib/format"
import { conta, formasPagamento } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { FormaPagamento, Lancamento } from "@/lib/types"

const diaLocal = (dataHora: string) => format(parseISO(dataHora), "yyyy-MM-dd")

export function CaixaView() {
  const { dados, hoje, removerLancamento } = useHotel()
  const [dia, setDia] = useState(hoje)
  const [novo, setNovo] = useState<Lancamento["tipo"] | null>(null)

  const doDia = dados.lancamentos
    .filter((l) => diaLocal(l.data) === dia)
    .sort((a, b) => b.data.localeCompare(a.data))
  const soma = (tipo: Lancamento["tipo"]) =>
    doDia.filter((l) => l.tipo === tipo).reduce((s, l) => s + l.valor, 0)
  const entradas = soma("entrada")
  const saidas = soma("saida")
  const aReceber = dados.reservas
    .filter((r) => r.status === "hospedado")
    .reduce((s, r) => s + Math.max(0, conta(r, dados.lancamentos).saldo), 0)
  const porForma = (Object.keys(formasPagamento) as FormaPagamento[])
    .map((forma) => ({
      forma,
      valor: doDia
        .filter((l) => l.forma === forma)
        .reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0),
    }))
    .filter((f) => f.valor !== 0)

  return (
    <Pagina>
      <PageHeader titulo="Caixa" icone={Wallet}>
        <Button size="lg" variant="outline" onClick={() => setNovo("saida")}>
          <Minus /> Saída
        </Button>
        <Button size="lg" onClick={() => setNovo("entrada")}>
          <Plus /> Entrada
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Dia anterior" onClick={() => setDia(somarDias(dia, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Próximo dia" disabled={dia >= hoje} onClick={() => setDia(somarDias(dia, 1))}>
            <ChevronRight />
          </Button>
          <span className="ml-1 text-sm font-medium first-letter:uppercase">{dataLonga(dia)}</span>
          {dia !== hoje && (
            <Button variant="link" size="sm" onClick={() => setDia(hoje)}>
              Voltar para hoje
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile titulo="Entradas" valor={moeda(entradas)} icone={ArrowDownLeft} tom="bom" />
          <StatTile titulo="Saídas" valor={moeda(saidas)} icone={ArrowUpRight} tom="ruim" />
          <StatTile
            titulo="Saldo do dia"
            valor={moeda(entradas - saidas)}
            icone={Scale}
            dica={porForma.map((f) => `${formasPagamento[f.forma]} ${moeda(f.valor)}`).join(" · ") || undefined}
          />
          <StatTile
            titulo="A receber dos hospedados"
            valor={moeda(aReceber)}
            icone={BedDouble}
            tom="alerta"
          />
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 pl-4">Hora</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {doDia.map((l) => (
                <TableRow key={l.id} className="group">
                  <TableCell className="pl-4 text-muted-foreground tabular-nums">{hora(l.data)}</TableCell>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell>{formasPagamento[l.forma]}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      l.tipo === "entrada" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                    )}
                  >
                    {l.tipo === "entrada" ? "+" : "−"} {moeda(l.valor)}
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir lançamento"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => tentar(() => removerLancamento(l.id), "Lançamento excluído.")}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {doDia.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum lançamento neste dia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={novo !== null} onOpenChange={(aberto) => !aberto && setNovo(null)}>
        <DialogContent className="sm:max-w-sm">
          {novo && <LancamentoForm tipo={novo} onConcluir={() => setNovo(null)} />}
        </DialogContent>
      </Dialog>
    </Pagina>
  )
}

function LancamentoForm({ tipo, onConcluir }: { tipo: Lancamento["tipo"]; onConcluir: () => void }) {
  const { lancar } = useHotel()
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [forma, setForma] = useState<FormaPagamento>("dinheiro")

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const ok = tentar(
      () => lancar({ tipo, descricao, valor: lerValor(valor), forma }),
      tipo === "entrada" ? "Entrada registrada." : "Saída registrada."
    )
    if (ok) onConcluir()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{tipo === "entrada" ? "Nova entrada" : "Nova saída"}</DialogTitle>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="lanc-desc">Descrição</FieldLabel>
        <Input
          id="lanc-desc"
          autoFocus
          placeholder={tipo === "entrada" ? "Ex.: Venda avulsa" : "Ex.: Compra de material"}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="lanc-valor">Valor (R$)</FieldLabel>
        <Input
          id="lanc-valor"
          inputMode="decimal"
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Forma</FieldLabel>
        <FormaPagamentoToggle valor={forma} onChange={setForma} />
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit">Registrar</Button>
      </DialogFooter>
    </form>
  )
}
