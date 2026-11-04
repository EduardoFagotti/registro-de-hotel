"use client"

import Link from "next/link"
import { useState } from "react"
import {
  CalendarPlus,
  Check,
  LayoutGrid,
  LogIn,
  LogOut,
  Search,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { PageHeader, Pagina } from "@/components/page-header"
import { PagamentoDialog } from "@/components/pagamento-dialog"
import { QuartoSheet } from "@/components/quarto-sheet"
import { ReservaDialog } from "@/components/reserva-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { dataCurta, dataLonga, diasEntre, moeda } from "@/lib/format"
import {
  conta,
  estadoQuarto,
  estadosQuarto,
  reservaAtual,
  type EstadoQuarto,
} from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { Quarto, Reserva } from "@/lib/types"

const ESTADOS = Object.keys(estadosQuarto) as EstadoQuarto[]
const porNumero = (a: string, b: string) => a.localeCompare(b, "pt-BR", { numeric: true })

/** Andar pelo número do quarto: 101 → 1º andar, 12 → térreo. */
function andar(numero: string) {
  const m = numero.match(/^(\d*)\d{2}$/)
  if (!m) return { ordem: 999, rotulo: "Outros" }
  const n = Number(m[1] || 0)
  return { ordem: n, rotulo: n === 0 ? "Térreo" : `${n}º andar` }
}

type QuartoNoMapa = {
  quarto: Quarto
  atual?: Reserva
  estado: EstadoQuarto
  hospede: string
  proxima?: Reserva
}

export function MapaView() {
  const { dados, hoje, checkIn } = useHotel()
  const [filtro, setFiltro] = useState<EstadoQuarto | "todos">("todos")
  const [busca, setBusca] = useState("")
  const [quartoAberto, setQuartoAberto] = useState<string | null>(null)
  const [novo, setNovo] = useState<"reserva" | "checkin" | null>(null)
  const [checkout, setCheckout] = useState<string | null>(null)

  const nome = (r: Reserva) => dados.hospedes.find((h) => h.id === r.hospedeId)?.nome ?? ""
  const numero = (r: Reserva) => dados.quartos.find((q) => q.id === r.quartoId)?.numero ?? ""

  const quartos: QuartoNoMapa[] = dados.quartos.map((quarto) => {
    const atual = reservaAtual(dados.reservas, quarto.id, hoje)
    const proxima = dados.reservas
      .filter((r) => r.quartoId === quarto.id && r.status === "reservada" && r.entrada > hoje)
      .sort((a, b) => a.entrada.localeCompare(b.entrada))[0]
    return {
      quarto,
      atual,
      estado: estadoQuarto(quarto, atual),
      hospede: atual ? nome(atual) : "",
      proxima,
    }
  })
  const contagem = (estado: EstadoQuarto) => quartos.filter((q) => q.estado === estado).length
  const total = quartos.length
  const ocupados = contagem("ocupado")
  const ocupacao = total ? Math.round((ocupados / total) * 100) : 0
  const previsao = total ? Math.round(((ocupados + contagem("chegada")) / total) * 100) : 0

  const termo = busca.trim().toLowerCase()
  const visiveis = quartos.filter(
    (q) =>
      (filtro === "todos" || q.estado === filtro) &&
      (!termo || q.quarto.numero.toLowerCase().includes(termo) || q.hospede.toLowerCase().includes(termo))
  )
  const andares = Object.values(
    visiveis.reduce<Record<string, { ordem: number; rotulo: string; quartos: QuartoNoMapa[] }>>(
      (grupos, q) => {
        const a = andar(q.quarto.numero)
        ;(grupos[a.rotulo] ??= { ...a, quartos: [] }).quartos.push(q)
        return grupos
      },
      {}
    )
  ).sort((a, b) => a.ordem - b.ordem)

  const chegadas = dados.reservas
    .filter((r) => r.status === "reservada" && r.entrada <= hoje && r.saida > hoje)
    .sort((a, b) => porNumero(numero(a), numero(b)))
  const saidas = dados.reservas
    .filter((r) => r.status === "hospedado" && r.saida <= hoje)
    .sort((a, b) => porNumero(numero(a), numero(b)))
  const reservaCheckout = dados.reservas.find((r) => r.id === checkout)

  return (
    <Pagina>
      <PageHeader titulo="Mapa de quartos" icone={LayoutGrid} data={dataLonga(hoje)}>
        <Button size="lg" variant="outline" onClick={() => setNovo("reserva")}>
          <CalendarPlus /> Nova reserva
        </Button>
        <Button size="lg" onClick={() => setNovo("checkin")}>
          <LogIn /> Check-in
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Resumo: ocupação, distribuição dos quartos e filtros (que servem de legenda) */}
          <div className="grid gap-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Ocupação agora</p>
                <p className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">{ocupacao}%</span>
                  <span className="text-sm text-muted-foreground">
                    {ocupados} de {total} quartos · previsão para a noite{" "}
                    <span className="font-medium text-foreground tabular-nums">{previsao}%</span>
                  </span>
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Quarto ou hóspede"
                  aria-label="Buscar quarto ou hóspede"
                  className="pl-8"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              {ESTADOS.map((estado) => (
                <span
                  key={estado}
                  className={cn("h-full transition-all", estadosQuarto[estado].ponto)}
                  style={{ width: `${total ? (contagem(estado) / total) * 100 : 0}%` }}
                  title={`${estadosQuarto[estado].label}: ${contagem(estado)}`}
                />
              ))}
            </div>

            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={filtro}
              onValueChange={(v) => setFiltro((v as EstadoQuarto) || "todos")}
              className="flex-wrap"
            >
              <ToggleGroupItem value="todos">Todos · {total}</ToggleGroupItem>
              {ESTADOS.map((estado) => (
                <ToggleGroupItem key={estado} value={estado} className="gap-1.5">
                  <span className={cn("size-2 rounded-full", estadosQuarto[estado].ponto)} />
                  {estadosQuarto[estado].label} · {contagem(estado)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {andares.map((grupo) => {
            const livres = grupo.quartos.filter((q) => q.estado === "livre").length
            return (
              <section key={grupo.rotulo} aria-label={grupo.rotulo} className="grid gap-2">
                <h2 className="flex items-baseline gap-2 text-sm font-semibold">
                  {grupo.rotulo}
                  <span className="text-xs font-normal text-muted-foreground">
                    {grupo.quartos.length} {grupo.quartos.length === 1 ? "quarto" : "quartos"}
                    {livres > 0 && ` · ${livres} ${livres === 1 ? "livre" : "livres"}`}
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-3">
                  {grupo.quartos.map((q) => (
                    <CartaoQuarto key={q.quarto.id} {...q} onAbrir={() => setQuartoAberto(q.quarto.id)} />
                  ))}
                </div>
              </section>
            )
          })}

          {visiveis.length === 0 && (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              {total === 0 ? (
                <>
                  Nenhum quarto cadastrado.{" "}
                  <Link href="/quartos" className="font-medium text-primary-strong underline-offset-4 hover:underline">
                    Cadastrar quartos
                  </Link>
                </>
              ) : (
                "Nenhum quarto encontrado."
              )}
            </div>
          )}
        </section>

        {/* No celular as tarefas do dia vêm primeiro */}
        <aside className="flex flex-col gap-4 max-lg:order-first lg:sticky lg:top-4 lg:w-80">
          <ListaDoDia titulo="Chegadas de hoje" vazio="Nenhuma chegada pendente.">
            {chegadas.map((r) => (
              <ItemDoDia
                key={r.id}
                numero={numero(r)}
                nome={nome(r)}
                detalhe={
                  r.entrada < hoje
                    ? `Atrasado desde ${dataCurta(r.entrada)}`
                    : `${diasEntre(r.entrada, r.saida)} ${diasEntre(r.entrada, r.saida) === 1 ? "noite" : "noites"} · até ${dataCurta(r.saida)}`
                }
                alerta={r.entrada < hoje}
                onAbrir={() => setQuartoAberto(r.quartoId)}
                acao={
                  <Button
                    size="sm"
                    onClick={() => tentar(() => checkIn(r.id), `Check-in feito no quarto ${numero(r)}.`)}
                  >
                    <LogIn /> Check-in
                  </Button>
                }
              />
            ))}
          </ListaDoDia>

          <ListaDoDia titulo="Saídas de hoje" vazio="Nenhuma saída pendente.">
            {saidas.map((r) => {
              const { saldo } = conta(r, dados.lancamentos)
              return (
                <ItemDoDia
                  key={r.id}
                  numero={numero(r)}
                  nome={nome(r)}
                  detalhe={
                    (r.saida < hoje ? `Saída era ${dataCurta(r.saida)}` : "Saída hoje") +
                    (saldo > 0 ? ` · a receber ${moeda(saldo)}` : " · conta paga")
                  }
                  alerta={r.saida < hoje}
                  onAbrir={() => setQuartoAberto(r.quartoId)}
                  acao={
                    <Button size="sm" variant="outline" onClick={() => setCheckout(r.id)}>
                      <LogOut /> Check-out
                    </Button>
                  }
                />
              )
            })}
          </ListaDoDia>
        </aside>
      </div>

      <QuartoSheet quartoId={quartoAberto} onFechar={() => setQuartoAberto(null)} />
      <ReservaDialog
        aberto={novo !== null}
        onAbertoChange={(aberto) => !aberto && setNovo(null)}
        modo={novo ?? "reserva"}
      />
      {reservaCheckout && (
        <PagamentoDialog
          checkout
          reserva={reservaCheckout}
          aberto
          onAbertoChange={(aberto) => !aberto && setCheckout(null)}
        />
      )}
    </Pagina>
  )
}

/**
 * Cartão do quarto: o cartão inteiro abre o painel do quarto; o conteúdo fica por
 * cima sem capturar o clique, exceto as ações rápidas de limpeza.
 */
function CartaoQuarto({
  quarto,
  atual,
  estado,
  hospede,
  proxima,
  onAbrir,
}: QuartoNoMapa & { onAbrir: () => void }) {
  const { dados, hoje, definirLimpeza } = useHotel()
  const info = estadosQuarto[estado]

  return (
    <div
      className={cn(
        "relative flex min-h-32 min-w-0 flex-col rounded-xl border-2 p-2.5 transition-colors sm:min-h-36 sm:p-3 has-[>button:focus-visible]:ring-3 has-[>button:focus-visible]:ring-ring/50",
        info.card
      )}
    >
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Quarto ${quarto.numero}: ${info.label}${hospede ? `, ${hospede}` : ""}`}
        className="absolute inset-0 rounded-[inherit] outline-none"
      />
      <div className="pointer-events-none relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl leading-none font-semibold tabular-nums">{quarto.numero}</span>
          <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium">
            <span className={cn("size-2 shrink-0 rounded-full", info.ponto)} />
            <span className="truncate">{info.label}</span>
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {quarto.tipo}
          <span aria-hidden="true">·</span>
          <Users className="size-3" aria-label="Capacidade" />
          {quarto.capacidade}
          {quarto.limpeza === "sujo" && estado !== "sujo" && (
            <Sparkles
              className="ml-auto size-3.5 text-orange-600 dark:text-orange-400"
              aria-label="Limpeza pendente"
            />
          )}
        </p>

        <div className="mt-auto pt-3 text-xs">
          {estado === "ocupado" && atual && <Estadia reserva={atual} hospede={hospede} hoje={hoje} saldo={conta(atual, dados.lancamentos).saldo} />}

          {estado === "chegada" && atual && (
            <>
              <p className="truncate text-sm font-medium">{hospede}</p>
              <p className={cn("text-muted-foreground", atual.entrada < hoje && "text-rose-700 dark:text-rose-400")}>
                {atual.entrada < hoje
                  ? `Atrasado desde ${dataCurta(atual.entrada)}`
                  : `Chega hoje · ${diasEntre(atual.entrada, atual.saida)}n`}
              </p>
              {quarto.limpeza === "sujo" && (
                <p className="mt-1 font-medium text-orange-700 dark:text-orange-400">Arrumar antes da chegada</p>
              )}
            </>
          )}

          {estado === "livre" && (
            <>
              <p className="text-sm font-medium tabular-nums">
                {moeda(quarto.diaria)}
                <span className="text-xs font-normal text-muted-foreground"> /noite</span>
              </p>
              <p className="text-muted-foreground">
                {proxima ? `Próxima reserva ${dataCurta(proxima.entrada)}` : "Sem reservas próximas"}
              </p>
            </>
          )}

          {(estado === "sujo" || estado === "manutencao") && (
            <>
              <p className="text-muted-foreground">
                {proxima
                  ? `Próxima reserva ${dataCurta(proxima.entrada)}`
                  : estado === "sujo"
                    ? "Aguardando limpeza"
                    : "Bloqueado"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="pointer-events-auto relative z-10 mt-2 w-full bg-background"
                onClick={() =>
                  tentar(
                    () => definirLimpeza(quarto.id, "limpo"),
                    `Quarto ${quarto.numero} ${estado === "sujo" ? "limpo" : "liberado"}.`
                  )
                }
              >
                {estado === "sujo" ? <Check /> : <Wrench />}
                {estado === "sujo" ? "Marcar limpo" : "Liberar"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Hóspede no quarto: nome, saída e quanto da estadia já passou. */
function Estadia({
  reserva,
  hospede,
  hoje,
  saldo,
}: {
  reserva: Reserva
  hospede: string
  hoje: string
  saldo: number
}) {
  const noites = Math.max(1, diasEntre(reserva.entrada, reserva.saida))
  const passadas = Math.min(noites, Math.max(0, diasEntre(reserva.entrada, hoje)))
  const saida =
    reserva.saida < hoje
      ? { texto: `Saída atrasada (${dataCurta(reserva.saida)})`, alerta: true }
      : reserva.saida === hoje
        ? { texto: "Sai hoje", alerta: true }
        : { texto: `Até ${dataCurta(reserva.saida)}`, alerta: false }

  return (
    <>
      <p className="truncate text-sm font-medium">{hospede}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-muted-foreground", saida.alerta && "font-medium text-rose-700 dark:text-rose-400")}>
          {saida.texto}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {passadas}/{noites}n
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
        <div className="h-full rounded-full bg-rose-500" style={{ width: `${(passadas / noites) * 100}%` }} />
      </div>
      {saldo > 0 && (
        <p className="mt-1 text-muted-foreground">
          A receber <span className="font-medium text-foreground tabular-nums">{moeda(saldo)}</span>
        </p>
      )}
    </>
  )
}

function ListaDoDia({
  titulo,
  vazio,
  children,
}: {
  titulo: string
  vazio: string
  children: React.ReactNode[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/40 bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h2 className="text-sm font-medium text-primary-strong">{titulo}</h2>
        <span className="rounded-full bg-primary/15 px-2 text-xs font-medium text-primary-strong tabular-nums">
          {children.length}
        </span>
      </div>
      {children.length ? (
        <ul className="divide-y">{children}</ul>
      ) : (
        <p className="px-3 py-4 text-sm text-muted-foreground">{vazio}</p>
      )}
    </div>
  )
}

function ItemDoDia({
  numero,
  nome,
  detalhe,
  alerta,
  acao,
  onAbrir,
}: {
  numero: string
  nome: string
  detalhe: string
  alerta?: boolean
  acao: React.ReactNode
  onAbrir: () => void
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <button onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="w-9 shrink-0 text-base font-semibold tabular-nums">{numero}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{nome}</span>
          <span className={cn("block text-xs text-muted-foreground", alerta && "text-rose-700 dark:text-rose-400")}>
            {detalhe}
          </span>
        </span>
      </button>
      {acao}
    </li>
  )
}
