export type Limpeza = "limpo" | "sujo" | "manutencao"

export type Quarto = {
  id: string
  numero: string
  tipo: string
  capacidade: number
  diaria: number
  limpeza: Limpeza
}

export type Hospede = {
  id: string
  nome: string
  documento: string
  telefone: string
  email: string
  cidade: string
}

export type StatusReserva = "reservada" | "hospedado" | "finalizada" | "cancelada"

export type Consumo = {
  id: string
  descricao: string
  quantidade: number
  valor: number
  data: string
}

export type Reserva = {
  id: string
  codigo: number
  quartoId: string
  hospedeId: string
  /** Datas no formato yyyy-MM-dd. A saída é o dia em que o hóspede deixa o quarto. */
  entrada: string
  saida: string
  pessoas: number
  diaria: number
  status: StatusReserva
  obs: string
  consumos: Consumo[]
}

export type FormaPagamento = "pix" | "dinheiro" | "credito" | "debito"

export type Lancamento = {
  id: string
  tipo: "entrada" | "saida"
  descricao: string
  valor: number
  forma: FormaPagamento
  /** Data e hora em ISO. */
  data: string
  reservaId?: string
}

export type DadosHotel = {
  quartos: Quarto[]
  hospedes: Hospede[]
  reservas: Reserva[]
  lancamentos: Lancamento[]
  proximoCodigo: number
}
