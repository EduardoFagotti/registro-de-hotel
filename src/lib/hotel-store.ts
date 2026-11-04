"use client"

import { use, useMemo, useSyncExternalStore } from "react"
import { browser } from "react-dom"

import { dadosExemplo } from "@/lib/exemplo"
import { gerarId, hojeISO, somarDias } from "@/lib/format"
import {
  conta,
  saidaNoCheckout,
  validarReserva,
  type DadosReserva,
} from "@/lib/hotel"
import type {
  Consumo,
  DadosHotel,
  FormaPagamento,
  Hospede,
  Lancamento,
  Limpeza,
  Quarto,
  Reserva,
} from "@/lib/types"

const CHAVE = "registro-de-hotel:v1"

function carregar(hoje: string): DadosHotel {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo) as DadosHotel
  } catch {}
  return dadosExemplo(hoje)
}

function criarAcoes(atual: () => DadosHotel, commit: (d: DadosHotel) => void, hoje: string) {
  const alterarReserva = (id: string, fn: (r: Reserva) => Reserva) => {
    const d = atual()
    commit({ ...d, reservas: d.reservas.map((r) => (r.id === id ? fn(r) : r)) })
  }
  const buscarReserva = (id: string) => {
    const r = atual().reservas.find((r) => r.id === id)
    if (!r) throw new Error("Reserva não encontrada.")
    return r
  }
  const nomeHospede = (id: string) => atual().hospedes.find((h) => h.id === id)?.nome ?? ""
  const lancar = (l: Omit<Lancamento, "id" | "data">) => {
    if (!(l.valor > 0)) throw new Error("O valor precisa ser maior que zero.")
    if (!l.descricao.trim()) throw new Error("Informe a descrição.")
    const d = atual()
    const novo = { ...l, id: gerarId(), data: new Date().toISOString() }
    commit({ ...d, lancamentos: [...d.lancamentos, novo] })
  }

  return {
    salvarQuarto(q: Omit<Quarto, "id" | "limpeza"> & { id?: string }) {
      const d = atual()
      const numero = q.numero.trim()
      if (!numero) throw new Error("Informe o número do quarto.")
      if (d.quartos.some((x) => x.numero === numero && x.id !== q.id))
        throw new Error(`Já existe o quarto ${numero}.`)
      const quartos = q.id
        ? d.quartos.map((x) => (x.id === q.id ? { ...x, ...q, numero } : x))
        : [...d.quartos, { ...q, numero, id: gerarId(), limpeza: "limpo" as const }]
      quartos.sort((a, b) => a.numero.localeCompare(b.numero, "pt-BR", { numeric: true }))
      commit({ ...d, quartos })
    },

    removerQuarto(id: string) {
      const d = atual()
      if (d.reservas.some((r) => r.quartoId === id))
        throw new Error("Este quarto tem reservas e não pode ser removido.")
      commit({ ...d, quartos: d.quartos.filter((q) => q.id !== id) })
    },

    definirLimpeza(quartoId: string, limpeza: Limpeza) {
      const d = atual()
      commit({ ...d, quartos: d.quartos.map((q) => (q.id === quartoId ? { ...q, limpeza } : q)) })
    },

    salvarHospede(h: Omit<Hospede, "id"> & { id?: string }): Hospede {
      const d = atual()
      const nome = h.nome.trim()
      if (!nome) throw new Error("Informe o nome do hóspede.")
      const hospede = { ...h, nome, id: h.id ?? gerarId() }
      const hospedes = h.id
        ? d.hospedes.map((x) => (x.id === h.id ? hospede : x))
        : [...d.hospedes, hospede]
      commit({ ...d, hospedes })
      return hospede
    },

    removerHospede(id: string) {
      const d = atual()
      if (d.reservas.some((r) => r.hospedeId === id))
        throw new Error("Este hóspede tem reservas e não pode ser removido.")
      commit({ ...d, hospedes: d.hospedes.filter((h) => h.id !== id) })
    },

    salvarReserva(dados: DadosReserva): Reserva {
      const d = atual()
      const erro = validarReserva(d, dados)
      if (erro) throw new Error(erro)
      const existente = dados.id ? d.reservas.find((r) => r.id === dados.id) : undefined
      const reserva: Reserva = existente
        ? { ...existente, ...dados, id: existente.id, status: dados.status ?? existente.status }
        : {
            ...dados,
            id: gerarId(),
            codigo: d.proximoCodigo,
            status: dados.status ?? "reservada",
            consumos: [],
          }
      commit({
        ...d,
        reservas: existente
          ? d.reservas.map((r) => (r.id === reserva.id ? reserva : r))
          : [...d.reservas, reserva],
        proximoCodigo: existente ? d.proximoCodigo : d.proximoCodigo + 1,
      })
      return reserva
    },

    checkIn(reservaId: string) {
      const d = atual()
      const r = buscarReserva(reservaId)
      const ocupante = d.reservas.find(
        (x) => x.quartoId === r.quartoId && x.status === "hospedado" && x.id !== r.id
      )
      if (ocupante) throw new Error("O quarto ainda está ocupado. Faça o check-out antes.")
      const saida = r.saida > hoje ? r.saida : somarDias(hoje, 1)
      const erro = validarReserva(d, { ...r, entrada: hoje, saida })
      if (erro) throw new Error(erro)
      alterarReserva(reservaId, (x) => ({ ...x, entrada: hoje, saida, status: "hospedado" }))
    },

    cancelarReserva(reservaId: string) {
      alterarReserva(reservaId, (r) => ({ ...r, status: "cancelada" }))
    },

    adicionarConsumo(reservaId: string, c: Omit<Consumo, "id" | "data">) {
      if (!c.descricao.trim()) throw new Error("Informe a descrição.")
      if (!(c.valor > 0) || !(c.quantidade > 0)) throw new Error("Quantidade e valor precisam ser maiores que zero.")
      const consumo = { ...c, id: gerarId(), data: new Date().toISOString() }
      alterarReserva(reservaId, (r) => ({ ...r, consumos: [...r.consumos, consumo] }))
    },

    removerConsumo(reservaId: string, consumoId: string) {
      alterarReserva(reservaId, (r) => ({
        ...r,
        consumos: r.consumos.filter((c) => c.id !== consumoId),
      }))
    },

    lancar,

    receberPagamento(reservaId: string, valor: number, forma: FormaPagamento) {
      const r = buscarReserva(reservaId)
      lancar({
        tipo: "entrada",
        descricao: `Pagamento #${r.codigo} · ${nomeHospede(r.hospedeId)}`,
        valor,
        forma,
        reservaId,
      })
    },

    removerLancamento(id: string) {
      const d = atual()
      commit({ ...d, lancamentos: d.lancamentos.filter((l) => l.id !== id) })
    },

    checkOut(reservaId: string, forma: FormaPagamento) {
      const r = buscarReserva(reservaId)
      const saida = saidaNoCheckout(r, hoje)
      const { saldo } = conta(r, atual().lancamentos, saida)
      if (saldo > 0) {
        lancar({
          tipo: "entrada",
          descricao: `Check-out #${r.codigo} · ${nomeHospede(r.hospedeId)}`,
          valor: saldo,
          forma,
          reservaId,
        })
      }
      const d = atual()
      commit({
        ...d,
        reservas: d.reservas.map((x) =>
          x.id === reservaId ? { ...x, saida, status: "finalizada" } : x
        ),
        quartos: d.quartos.map((q) => (q.id === r.quartoId ? { ...q, limpeza: "sujo" } : q)),
      })
    },

    restaurarExemplo() {
      commit(dadosExemplo(hoje))
    },
  }
}

/** Store fora do React: as ações sempre leem o estado mais recente e cada alteração já é salva. */
function criarStore(hoje: string) {
  let dados = carregar(hoje)
  const ouvintes = new Set<() => void>()
  const commit = (novo: DadosHotel) => {
    dados = novo
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo))
    } catch {}
    ouvintes.forEach((ouvinte) => ouvinte())
  }
  return {
    ler: () => dados,
    assinar: (ouvinte: () => void) => {
      ouvintes.add(ouvinte)
      return () => void ouvintes.delete(ouvinte)
    },
    hoje,
    acoes: criarAcoes(() => dados, commit, hoje),
  }
}

let store: ReturnType<typeof criarStore> | null = null

/**
 * Acesso aos dados e ações do hotel. Os dados vivem no navegador, então o componente
 * só renderiza no cliente: envolva a página em um <Suspense> com o fallback de carregamento.
 */
const obterStore = () => (store ??= criarStore(hojeISO()))

export function useHotel() {
  use(browser("Os dados do hotel ficam salvos no navegador (localStorage)."))
  const atual = obterStore()
  const dados = useSyncExternalStore(atual.assinar, atual.ler, atual.ler)
  return useMemo(() => ({ ...atual.acoes, dados, hoje: atual.hoje }), [atual, dados])
}

/** Para uso fora das páginas (ex.: menu lateral), em resposta a um clique. */
export function restaurarDadosExemplo() {
  obterStore().acoes.restaurarExemplo()
}
