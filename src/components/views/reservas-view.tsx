"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { MonthCalendar, type CalendarMonth } from "@/components/month-calendar"
import { PageHeader, Pagina } from "@/components/page-header"
import { PagamentoDialog } from "@/components/pagamento-dialog"
import { StatusBadge } from "@/components/reserva-detalhes"
import { ReservaDialog } from "@/components/reserva-dialog"
import { ReservaSheet } from "@/components/reserva-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dataCurta, diasEntre, moeda } from "@/lib/format"
import { conta, statusReserva } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { Reserva } from "@/lib/types"

/** Até quantos meses a navegação pode voltar ou avançar. */
const MESES_ATRAS = 12
const MESES_A_FRENTE = 24
const chave = (d: Date) => format(d, "yyyy-MM-dd")
const tituloDia = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})
const quartosOcupados = (n: number) => (n === 1 ? "1 quarto ocupado" : `${n} quartos ocupados`)
/** Reserva ocupa o quarto na noite do dia `d`. */
const ocupaNoite = (r: Reserva, d: string) => r.status !== "cancelada" && r.entrada <= d && d < r.saida

type Aba = "agenda" | "lista"

export function ReservasView() {
  const [aba, setAba] = useState<Aba>("agenda")
  const [reservaAberta, setReservaAberta] = useState<string | null>(null)
  const [nova, setNova] = useState<{ quartoId?: string; entrada?: string } | null>(null)

  return (
    <Pagina>
      <PageHeader titulo="Reservas" icone={CalendarDays}>
        <Button size="lg" onClick={() => setNova({})}>
          <CalendarPlus /> Nova reserva
        </Button>
      </PageHeader>

      <div role="tablist" className="mb-4 flex w-full gap-1 rounded-lg bg-muted p-1 sm:w-fit">
        {(["agenda", "lista"] as const).map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={aba === a}
            onClick={() => setAba(a)}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground sm:flex-none",
              aba === a && "bg-background text-foreground shadow-sm"
            )}
          >
            {a === "agenda" ? "Agenda" : "Lista"}
          </button>
        ))}
      </div>

      {aba === "agenda" ? (
        <Agenda
          onAbrir={setReservaAberta}
          onNova={(quartoId, entrada) => setNova({ quartoId, entrada })}
        />
      ) : (
        <Lista onAbrir={setReservaAberta} />
      )}

      <ReservaSheet reservaId={reservaAberta} onFechar={() => setReservaAberta(null)} />
      <ReservaDialog
        aberto={nova !== null}
        onAbertoChange={(aberto) => !aberto && setNova(null)}
        quartoId={nova?.quartoId}
        entrada={nova?.entrada}
      />
    </Pagina>
  )
}

/**
 * Agenda no calendário de meses: cada dia mostra quantos quartos estão ocupados
 * naquela noite; clicar abre as reservas do dia e os quartos livres para reservar.
 */
function Agenda({
  onAbrir,
  onNova,
}: {
  onAbrir: (id: string) => void
  onNova: (quartoId: string, entrada: string) => void
}) {
  const { dados, hoje, checkIn } = useHotel()
  const [deslocamento, setDeslocamento] = useState(0)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<string | null>(null)

  const buildMonths = useCallback(
    (quantos: number): CalendarMonth[] => {
      const agora = new Date()
      return Array.from({ length: quantos }, (_, m) => {
        const first = new Date(agora.getFullYear(), agora.getMonth() + deslocamento + m, 1)
        const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
        const days = Array.from({ length: total }, (_, d) => {
          const date = new Date(first.getFullYear(), first.getMonth(), d + 1)
          const k = chave(date)
          const count = dados.reservas.filter((r) => ocupaNoite(r, k)).length
          return { date, count, future: false, isToday: k === hoje }
        })
        return { first, days, total: days.reduce((s, d) => s + d.count, 0) }
      })
    },
    [dados.reservas, deslocamento, hoje]
  )

  const numero = useMemo(
    () => (id: string) => dados.quartos.find((q) => q.id === id)?.numero ?? "",
    [dados.quartos]
  )
  const doDia = selecionado
    ? dados.reservas
        .filter((r) => r.status !== "cancelada" && r.entrada <= selecionado && selecionado <= r.saida)
        .sort((a, b) => numero(a.quartoId).localeCompare(numero(b.quartoId), "pt-BR", { numeric: true }))
    : []
  const ocupadas = selecionado ? doDia.filter((r) => ocupaNoite(r, selecionado)).length : 0
  const livres =
    selecionado && selecionado >= hoje
      ? dados.quartos.filter(
          (q) =>
            q.limpeza !== "manutencao" &&
            !dados.reservas.some((r) => r.quartoId === q.id && ocupaNoite(r, selecionado))
        )
      : []
  const reservaCheckout = dados.reservas.find((r) => r.id === checkout)

  // Ações que abrem outra janela fecham antes a lista do dia.
  const abrir = (id: string) => {
    setSelecionado(null)
    onAbrir(id)
  }

  return (
    <>
      <Card className="max-sm:gap-1.5">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Ocupação por dia</CardTitle>
            <CardDescription className="mt-1 hidden sm:block">
              Quartos ocupados em cada noite · clique em um dia para ver as reservas e os quartos livres
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Mês anterior"
              disabled={deslocamento <= -MESES_ATRAS}
              onClick={() => setDeslocamento((n) => Math.max(-MESES_ATRAS, n - 1))}
            >
              <ChevronLeft />
            </Button>
            {deslocamento !== 0 && (
              <Button variant="outline" size="sm" onClick={() => setDeslocamento(0)}>
                Hoje
              </Button>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Próximo mês"
              disabled={deslocamento >= MESES_A_FRENTE}
              onClick={() => setDeslocamento((n) => Math.min(MESES_A_FRENTE, n + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-sm:px-2">
          <MonthCalendar
            buildMonths={buildMonths}
            onSelect={(date) => setSelecionado(chave(date))}
            unit={quartosOcupados}
            selectHint="Ver reservas do dia"
            caption="Quartos ocupados por dia"
            summary={(total, meses) =>
              `${total} ${total === 1 ? "diária" : "diárias"} ${meses === 1 ? "no mês" : `nos ${meses} meses exibidos`}`
            }
          />
        </CardContent>
      </Card>

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && setSelecionado(null)}>
        <DialogContent className="max-h-[85vh] gap-3 overflow-y-auto p-4 sm:max-w-lg sm:gap-4 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="first-letter:uppercase">
              {selecionado ? tituloDia.format(new Date(`${selecionado}T12:00:00`)) : ""}
            </DialogTitle>
            <DialogDescription>
              {ocupadas} de {dados.quartos.length} quartos ocupados
              {selecionado === hoje && " · hoje"}
            </DialogDescription>
          </DialogHeader>

          {doDia.length > 0 && (
            <ul className="grid gap-2">
              {doDia.map((r) => (
                <ReservaCard
                  key={r.id}
                  reserva={r}
                  dia={selecionado!}
                  onDetalhes={() => abrir(r.id)}
                  onCheckIn={() =>
                    tentar(() => checkIn(r.id), `Check-in feito no quarto ${numero(r.quartoId)}.`)
                  }
                  onCheckOut={() => {
                    setSelecionado(null)
                    setCheckout(r.id)
                  }}
                />
              ))}
            </ul>
          )}

          {livres.length > 0 && (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Quartos livres · toque para reservar
              </h3>
              <div className="flex flex-wrap gap-2">
                {livres.map((q) => (
                  <Button
                    key={q.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const dia = selecionado!
                      setSelecionado(null)
                      onNova(q.id, dia)
                    }}
                  >
                    <span className="font-semibold tabular-nums">{q.numero}</span>
                    <span className="text-muted-foreground">{q.tipo}</span>
                  </Button>
                ))}
              </div>
            </section>
          )}

          {doDia.length === 0 && livres.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma reserva neste dia.</p>
          )}
        </DialogContent>
      </Dialog>

      {reservaCheckout && (
        <PagamentoDialog
          checkout
          reserva={reservaCheckout}
          aberto
          onAbertoChange={(aberto) => !aberto && setCheckout(null)}
        />
      )}
    </>
  )
}

/** Cartão da reserva no dia: faixa lateral com a cor da situação e ação no rodapé. */
function ReservaCard({
  reserva: r,
  dia,
  onDetalhes,
  onCheckIn,
  onCheckOut,
}: {
  reserva: Reserva
  dia: string
  onDetalhes: () => void
  onCheckIn: () => void
  onCheckOut: () => void
}) {
  const { dados, hoje } = useHotel()
  const hospede = dados.hospedes.find((h) => h.id === r.hospedeId)
  const quarto = dados.quartos.find((q) => q.id === r.quartoId)
  const noites = diasEntre(r.entrada, r.saida)
  const momento = r.entrada === dia ? "Entrada" : r.saida === dia ? "Saída" : "Hospedado"
  const podeCheckIn = r.status === "reservada" && r.entrada <= hoje && dia === r.entrada
  const podeCheckOut = r.status === "hospedado" && r.saida <= hoje && (dia === r.saida || dia === hoje)

  return (
    <li className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", statusReserva[r.status].faixa)} />

      <div className="flex min-w-0 gap-3 p-3 pl-4">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/60 py-2">
          <span className="text-base leading-none font-semibold tabular-nums">{quarto?.numero}</span>
          <span className="mt-1 text-[11px] leading-none text-muted-foreground">quarto</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{hospede?.nome ?? "—"}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="tabular-nums">
              {dataCurta(r.entrada)} → {dataCurta(r.saida)} · {noites} {noites === 1 ? "noite" : "noites"}
            </span>
          </p>
          <p className="mt-0.5 text-xs font-medium text-primary-strong">{momento} neste dia</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t bg-muted/20 px-3 py-2 pl-4">
        {podeCheckIn && (
          <Button size="sm" onClick={onCheckIn}>
            <LogIn /> Fazer check-in
          </Button>
        )}
        {podeCheckOut && (
          <Button size="sm" onClick={onCheckOut}>
            <LogOut /> Check-out
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onDetalhes}>
          Detalhes
        </Button>
      </div>
    </li>
  )
}

type FiltroStatus = "ativas" | "todas" | "finalizada" | "cancelada"

function Lista({ onAbrir }: { onAbrir: (id: string) => void }) {
  const { dados } = useHotel()
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState<FiltroStatus>("ativas")
  const termo = busca.trim().toLowerCase()

  const linhas = dados.reservas
    .filter((r) =>
      status === "todas"
        ? true
        : status === "ativas"
          ? r.status === "reservada" || r.status === "hospedado"
          : r.status === status
    )
    .map((r) => ({
      r,
      hospede: dados.hospedes.find((h) => h.id === r.hospedeId),
      quarto: dados.quartos.find((q) => q.id === r.quartoId),
    }))
    .filter(
      ({ r, hospede, quarto }) =>
        !termo ||
        hospede?.nome.toLowerCase().includes(termo) ||
        quarto?.numero.includes(termo) ||
        String(r.codigo).includes(termo)
    )
    .sort((a, b) => a.r.entrada.localeCompare(b.r.entrada))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hóspede, quarto ou código"
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as FiltroStatus)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por situação">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativas">Ativas</SelectItem>
            <SelectItem value="finalizada">Finalizadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 pl-4">Código</TableHead>
              <TableHead>Hóspede</TableHead>
              <TableHead>Quarto</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-4 text-right">Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map(({ r, hospede, quarto }) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => onAbrir(r.id)}>
                <TableCell className="pl-4 text-muted-foreground tabular-nums">#{r.codigo}</TableCell>
                <TableCell className="font-medium">{hospede?.nome ?? "—"}</TableCell>
                <TableCell>{quarto?.numero ?? "—"}</TableCell>
                <TableCell className="tabular-nums">
                  {dataCurta(r.entrada)} → {dataCurta(r.saida)}
                  <span className="text-muted-foreground"> · {diasEntre(r.entrada, r.saida)}n</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {moeda(conta(r, dados.lancamentos).total)}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma reserva encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
