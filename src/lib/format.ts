import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export const moeda = (valor: number) => brl.format(valor)

export const hojeISO = () => format(new Date(), "yyyy-MM-dd")

export const somarDias = (data: string, dias: number) =>
  format(addDays(parseISO(data), dias), "yyyy-MM-dd")

export const diasEntre = (inicio: string, fim: string) =>
  differenceInCalendarDays(parseISO(fim), parseISO(inicio))

export const dataCurta = (data: string) => format(parseISO(data), "dd/MM")

export const dataLonga = (data: string) =>
  format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })

export const diaSemana = (data: string) =>
  format(parseISO(data), "EEEEEE", { locale: ptBR })

export const fimDeSemana = (data: string) => isWeekend(parseISO(data))

export const hora = (dataHora: string) => format(parseISO(dataHora), "HH:mm")

/** Converte "1.234,56" ou "1234.56" em número. */
export function lerValor(texto: string) {
  const limpo = texto.trim().replace(/\s|R\$/g, "")
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo
  const valor = Number(normalizado)
  return Number.isFinite(valor) ? valor : NaN
}

export function gerarId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
