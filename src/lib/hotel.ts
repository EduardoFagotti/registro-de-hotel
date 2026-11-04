import { diasEntre, somarDias } from "@/lib/format"
import type {
  DadosHotel,
  FormaPagamento,
  Lancamento,
  Quarto,
  Reserva,
  StatusReserva,
} from "@/lib/types"

export const formasPagamento: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
}

export const statusReserva: Record<
  StatusReserva,
  { label: string; badge: string; faixa: string }
> = {
  reservada: {
    label: "Reservada",
    badge: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
    faixa: "bg-sky-500",
  },
  hospedado: {
    label: "Hospedado",
    badge: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
    faixa: "bg-rose-500",
  },
  finalizada: {
    label: "Finalizada",
    badge: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
    faixa: "bg-zinc-400",
  },
  cancelada: {
    label: "Cancelada",
    badge: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
    faixa: "bg-zinc-300 dark:bg-zinc-600",
  },
}

export type EstadoQuarto = "livre" | "ocupado" | "chegada" | "sujo" | "manutencao"

export const estadosQuarto: Record<
  EstadoQuarto,
  { label: string; card: string; ponto: string }
> = {
  livre: {
    label: "Livre",
    card: "border-emerald-200 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/40",
    ponto: "bg-emerald-500",
  },
  chegada: {
    label: "Chegada",
    card: "border-sky-200 bg-sky-50 hover:border-sky-400 dark:border-sky-900 dark:bg-sky-950/40",
    ponto: "bg-sky-500",
  },
  ocupado: {
    label: "Ocupado",
    card: "border-rose-200 bg-rose-50 hover:border-rose-400 dark:border-rose-900 dark:bg-rose-950/40",
    ponto: "bg-rose-500",
  },
  sujo: {
    label: "Limpeza",
    card: "border-orange-200 bg-orange-50 hover:border-orange-400 dark:border-orange-900 dark:bg-orange-950/40",
    ponto: "bg-orange-500",
  },
  manutencao: {
    label: "Manutenção",
    card: "border-zinc-300 bg-zinc-100 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/60",
    ponto: "bg-zinc-400",
  },
}

export const ativa = (r: Reserva) => r.status === "reservada" || r.status === "hospedado"

export function conflito(
  reservas: Reserva[],
  quartoId: string,
  entrada: string,
  saida: string,
  ignorarId?: string
) {
  return reservas.find(
    (r) =>
      r.id !== ignorarId &&
      r.quartoId === quartoId &&
      ativa(r) &&
      entrada < r.saida &&
      r.entrada < saida
  )
}

/** Reserva que ocupa o quarto agora: hóspede no quarto ou chegada prevista para hoje. */
export function reservaAtual(reservas: Reserva[], quartoId: string, hoje: string) {
  return (
    reservas.find((r) => r.quartoId === quartoId && r.status === "hospedado") ??
    reservas.find(
      (r) =>
        r.quartoId === quartoId &&
        r.status === "reservada" &&
        r.entrada <= hoje &&
        r.saida > hoje
    )
  )
}

export function estadoQuarto(quarto: Quarto, atual?: Reserva): EstadoQuarto {
  if (atual?.status === "hospedado") return "ocupado"
  if (quarto.limpeza === "manutencao") return "manutencao"
  if (atual) return "chegada"
  if (quarto.limpeza === "sujo") return "sujo"
  return "livre"
}

/** No check-out a estadia é cobrada até hoje, com no mínimo uma diária. */
export function saidaNoCheckout(reserva: Reserva, hoje: string) {
  const minima = somarDias(reserva.entrada, 1)
  return hoje > minima ? hoje : minima
}

export function conta(reserva: Reserva, lancamentos: Lancamento[], saida = reserva.saida) {
  const noites = Math.max(1, diasEntre(reserva.entrada, saida))
  const diarias = noites * reserva.diaria
  const consumos = reserva.consumos.reduce((s, c) => s + c.quantidade * c.valor, 0)
  const pago = lancamentos
    .filter((l) => l.reservaId === reserva.id)
    .reduce((s, l) => s + (l.tipo === "entrada" ? l.valor : -l.valor), 0)
  const total = diarias + consumos
  return { noites, diarias, consumos, total, pago, saldo: total - pago }
}

export type DadosReserva = {
  id?: string
  hospedeId: string
  quartoId: string
  entrada: string
  saida: string
  pessoas: number
  diaria: number
  obs: string
  status?: StatusReserva
}

export function validarReserva(dados: DadosHotel, r: DadosReserva): string | null {
  if (!r.hospedeId) return "Selecione o hóspede."
  if (!r.quartoId) return "Selecione o quarto."
  if (!r.entrada || !r.saida) return "Informe as datas de entrada e saída."
  if (r.saida <= r.entrada) return "A saída precisa ser depois da entrada."
  if (!(r.diaria >= 0)) return "Valor da diária inválido."
  if (!(r.pessoas >= 1)) return "Informe ao menos 1 pessoa."
  const quarto = dados.quartos.find((q) => q.id === r.quartoId)
  if (!quarto) return "Quarto não encontrado."
  if (r.pessoas > quarto.capacidade)
    return `O quarto ${quarto.numero} comporta no máximo ${quarto.capacidade} pessoas.`
  const outra = conflito(dados.reservas, r.quartoId, r.entrada, r.saida, r.id)
  if (outra) {
    const hospede = dados.hospedes.find((h) => h.id === outra.hospedeId)
    return `O quarto ${quarto.numero} já está reservado nessas datas (${hospede?.nome ?? "outra reserva"}).`
  }
  return null
}
