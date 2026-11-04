import { somarDias } from "@/lib/format"
import type { DadosHotel, Quarto } from "@/lib/types"

export const itensRapidos = [
  { descricao: "Água", valor: 5 },
  { descricao: "Refrigerante", valor: 7 },
  { descricao: "Cerveja", valor: 10 },
  { descricao: "Chocolate", valor: 6 },
  { descricao: "Café da manhã extra", valor: 35 },
  { descricao: "Lavanderia", valor: 30 },
]

const quarto = (
  numero: string,
  tipo: string,
  capacidade: number,
  diaria: number,
  limpeza: Quarto["limpeza"] = "limpo"
): Quarto => ({ id: `q${numero}`, numero, tipo, capacidade, diaria, limpeza })

/** Dados de demonstração com datas relativas ao dia atual. */
export function dadosExemplo(hoje: string): DadosHotel {
  const d = (dias: number) => somarDias(hoje, dias)
  const agora = new Date()
  const ontem = new Date(agora.getTime() - 86_400_000)

  return {
    quartos: [
      quarto("101", "Standard", 2, 180),
      quarto("102", "Standard", 2, 180),
      quarto("103", "Standard", 3, 210),
      quarto("104", "Standard", 2, 180, "sujo"),
      quarto("201", "Luxo", 2, 260),
      quarto("202", "Luxo", 3, 290),
      quarto("203", "Luxo", 2, 260, "sujo"),
      quarto("204", "Luxo", 4, 320),
      quarto("301", "Suíte", 2, 420),
      quarto("302", "Suíte", 4, 480, "manutencao"),
    ],
    hospedes: [
      { id: "h1", nome: "Mariana Costa", documento: "123.456.789-00", telefone: "(11) 98765-4321", email: "mariana@email.com", cidade: "São Paulo" },
      { id: "h2", nome: "Ricardo Almeida", documento: "234.567.890-11", telefone: "(21) 99876-5432", email: "", cidade: "Rio de Janeiro" },
      { id: "h3", nome: "Fernanda Lima", documento: "345.678.901-22", telefone: "(31) 97654-3210", email: "fernanda@email.com", cidade: "Belo Horizonte" },
      { id: "h4", nome: "João Pereira", documento: "456.789.012-33", telefone: "(41) 96543-2109", email: "", cidade: "Curitiba" },
      { id: "h5", nome: "Ana Souza", documento: "567.890.123-44", telefone: "(51) 95432-1098", email: "ana@email.com", cidade: "Porto Alegre" },
      { id: "h6", nome: "Carlos Mendes", documento: "678.901.234-55", telefone: "(61) 94321-0987", email: "", cidade: "Brasília" },
      { id: "h7", nome: "Patrícia Rocha", documento: "789.012.345-66", telefone: "(71) 93210-9876", email: "", cidade: "Salvador" },
      { id: "h8", nome: "Lucas Martins", documento: "890.123.456-77", telefone: "(81) 92109-8765", email: "lucas@email.com", cidade: "Recife" },
    ],
    reservas: [
      { id: "r1", codigo: 1001, quartoId: "q104", hospedeId: "h6", entrada: d(-4), saida: d(-1), pessoas: 2, diaria: 180, status: "finalizada", obs: "", consumos: [] },
      { id: "r2", codigo: 1002, quartoId: "q101", hospedeId: "h1", entrada: d(-2), saida: d(1), pessoas: 2, diaria: 180, status: "hospedado", obs: "", consumos: [
        { id: "c1", descricao: "Água", quantidade: 2, valor: 5, data: ontem.toISOString() },
      ] },
      { id: "r3", codigo: 1003, quartoId: "q201", hospedeId: "h2", entrada: d(-1), saida: d(3), pessoas: 2, diaria: 260, status: "hospedado", obs: "Aniversário de casamento", consumos: [] },
      { id: "r4", codigo: 1004, quartoId: "q204", hospedeId: "h3", entrada: d(-3), saida: d(0), pessoas: 4, diaria: 320, status: "hospedado", obs: "", consumos: [
        { id: "c2", descricao: "Cerveja", quantidade: 4, valor: 10, data: ontem.toISOString() },
        { id: "c3", descricao: "Lavanderia", quantidade: 1, valor: 30, data: ontem.toISOString() },
      ] },
      { id: "r5", codigo: 1005, quartoId: "q301", hospedeId: "h4", entrada: d(0), saida: d(2), pessoas: 2, diaria: 420, status: "hospedado", obs: "", consumos: [] },
      { id: "r6", codigo: 1006, quartoId: "q102", hospedeId: "h5", entrada: d(0), saida: d(2), pessoas: 1, diaria: 180, status: "reservada", obs: "Chega após as 22h", consumos: [] },
      { id: "r7", codigo: 1007, quartoId: "q202", hospedeId: "h7", entrada: d(0), saida: d(1), pessoas: 3, diaria: 290, status: "reservada", obs: "", consumos: [] },
      { id: "r8", codigo: 1008, quartoId: "q203", hospedeId: "h8", entrada: d(1), saida: d(3), pessoas: 2, diaria: 260, status: "reservada", obs: "", consumos: [] },
      { id: "r9", codigo: 1009, quartoId: "q103", hospedeId: "h1", entrada: d(2), saida: d(5), pessoas: 3, diaria: 210, status: "reservada", obs: "", consumos: [] },
      { id: "r10", codigo: 1010, quartoId: "q204", hospedeId: "h5", entrada: d(4), saida: d(7), pessoas: 4, diaria: 320, status: "reservada", obs: "", consumos: [] },
    ],
    lancamentos: [
      { id: "l1", tipo: "entrada", descricao: "Check-out #1001 · Carlos Mendes", valor: 540, forma: "credito", data: ontem.toISOString(), reservaId: "r1" },
      { id: "l2", tipo: "entrada", descricao: "Adiantamento #1003 · Ricardo Almeida", valor: 260, forma: "pix", data: agora.toISOString(), reservaId: "r3" },
      { id: "l3", tipo: "saida", descricao: "Produtos de limpeza", valor: 85, forma: "dinheiro", data: agora.toISOString() },
    ],
    proximoCodigo: 1011,
  }
}
