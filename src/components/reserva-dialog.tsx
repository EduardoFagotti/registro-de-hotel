"use client"

import { useState } from "react"
import { BedDouble, CalendarDays, UserRound } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { FormSection } from "@/components/form-steps/form-section"
import { FormStepper } from "@/components/form-steps/form-stepper"
import { StepDialog, StepFooter } from "@/components/form-steps/step-dialog"
import { useFormSteps } from "@/components/form-steps/use-form-steps"
import { HospedePicker } from "@/components/hospede-picker"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { dataCurta, diasEntre, lerValor, moeda, somarDias } from "@/lib/format"
import { conflito, validarReserva } from "@/lib/hotel"
import { useHotel } from "@/lib/hotel-store"
import type { Reserva } from "@/lib/types"

const ETAPAS = [
  { titulo: "Hóspede", icone: UserRound },
  { titulo: "Estadia", icone: CalendarDays },
  { titulo: "Quarto", icone: BedDouble },
] as const

type Modo = "reserva" | "checkin"

export type ReservaDialogProps = {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  modo?: Modo
  /** Reserva existente para editar. */
  reserva?: Reserva
  quartoId?: string
  entrada?: string
}

export function ReservaDialog({ aberto, onAbertoChange, ...props }: ReservaDialogProps) {
  return (
    <StepDialog
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={
        props.reserva
          ? `Editar reserva #${props.reserva.codigo}`
          : props.modo === "checkin"
            ? "Check-in"
            : "Nova reserva"
      }
      descricao={
        props.modo === "checkin"
          ? "Hóspede entrando agora, sem reserva prévia."
          : "Escolha o hóspede, as datas e o quarto."
      }
    >
      <ReservaForm {...props} onConcluir={() => onAbertoChange(false)} />
    </StepDialog>
  )
}

function ReservaForm({
  modo = "reserva",
  reserva,
  quartoId: quartoInicial,
  entrada: entradaInicial,
  onConcluir,
}: Omit<ReservaDialogProps, "aberto" | "onAbertoChange"> & { onConcluir: () => void }) {
  const { dados, hoje, salvarHospede, salvarReserva } = useHotel()
  const checkin = modo === "checkin"
  const inicio = checkin ? hoje : (entradaInicial ?? hoje)

  const [hospedeId, setHospedeId] = useState(reserva?.hospedeId ?? "")
  const [novo, setNovo] = useState<{ nome: string; documento: string; telefone: string } | null>(
    null
  )
  const [entrada, setEntrada] = useState(reserva?.entrada ?? inicio)
  const [saida, setSaida] = useState(reserva?.saida ?? somarDias(inicio, 1))
  const [pessoas, setPessoas] = useState(String(reserva?.pessoas ?? 1))
  const [quartoId, setQuartoId] = useState(reserva?.quartoId ?? quartoInicial ?? "")
  const quartoInicialObj = dados.quartos.find((q) => q.id === (reserva?.quartoId ?? quartoInicial))
  const [diaria, setDiaria] = useState(String(reserva?.diaria ?? quartoInicialObj?.diaria ?? ""))
  const [obs, setObs] = useState(reserva?.obs ?? "")

  const entradaTravada = checkin || reserva?.status === "hospedado"
  const noites = entrada && saida ? diasEntre(entrada, saida) : 0
  const valorDiaria = lerValor(diaria)
  const datasOk = !!entrada && !!saida && saida > entrada

  const dadosReserva = {
    id: reserva?.id,
    hospedeId: novo ? "novo" : hospedeId,
    quartoId,
    entrada,
    saida,
    pessoas: Number(pessoas),
    diaria: valorDiaria,
    obs: obs.trim(),
    status: checkin ? ("hospedado" as const) : undefined,
  }

  const quartos = dados.quartos.map((q) => {
    const ocupado = datasOk && !!conflito(dados.reservas, q.id, entrada, saida, reserva?.id)
    const pequeno = q.capacidade < Number(pessoas)
    const motivo = ocupado
      ? "Ocupado"
      : pequeno
        ? `Até ${q.capacidade}`
        : q.limpeza === "manutencao"
          ? "Manutenção"
          : checkin && q.limpeza === "sujo"
            ? "Limpeza pendente"
            : null
    return { q, disponivel: !ocupado && !pequeno, motivo }
  })

  const {
    etapa,
    ultima,
    concluidas,
    rolagemRef,
    irPara,
    avancar,
    voltar,
    podeIrPara,
    enviarPorEtapas,
    propsDaEtapa,
  } = useFormSteps({
    totalEtapas: ETAPAS.length,
    editando: !!reserva,
    etapaCompleta: (i) =>
      i === 0
        ? novo
          ? !!novo.nome.trim()
          : !!hospedeId
        : i === 1
          ? datasOk && Number(pessoas) >= 1
          : !!quartoId && valorDiaria >= 0,
    validarEtapa: (i) => {
      if (i === 0) return novo || hospedeId ? null : "Selecione ou cadastre o hóspede."
      if (i === 1) return datasOk ? null : "A saída precisa ser depois da entrada."
      return validarReserva(dados, dadosReserva)
    },
  })

  function trocarEntrada(valor: string) {
    setEntrada(valor)
    if (valor && saida <= valor) setSaida(somarDias(valor, 1))
  }

  function escolherQuarto(id: string) {
    setQuartoId(id)
    const quarto = dados.quartos.find((q) => q.id === id)
    if (quarto) setDiaria(String(quarto.diaria))
  }

  function salvar() {
    try {
      const final = { ...dadosReserva }
      // O hóspede novo só é cadastrado aqui, com a reserva já validada.
      if (novo) final.hospedeId = salvarHospede({ ...novo, email: "", cidade: "" }).id
      const r = salvarReserva(final)
      const quarto = dados.quartos.find((q) => q.id === r.quartoId)
      toast.success(
        checkin
          ? `Check-in feito no quarto ${quarto?.numero}.`
          : reserva
            ? "Reserva atualizada."
            : `Reserva #${r.codigo} criada.`
      )
      onConcluir()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.")
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => enviarPorEtapas(e, salvar)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="px-4 py-3 sm:px-6">
        <FormStepper
          etapas={ETAPAS}
          etapa={etapa}
          concluidas={concluidas}
          podeIrPara={podeIrPara}
          onSelecionar={irPara}
        />
      </div>

      <div
        ref={rolagemRef}
        className="grid flex-1 content-start gap-6 overflow-y-auto px-4 py-4 sm:gap-4 sm:px-6"
      >
        <FormSection titulo="Hóspede" {...propsDaEtapa(0)}>
          {novo ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="novo-nome">Nome completo</FieldLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="h-auto p-0 text-primary-strong"
                    onClick={() => setNovo(null)}
                  >
                    Escolher existente
                  </Button>
                </div>
                <Input
                  id="novo-nome"
                  required
                  autoFocus
                  value={novo.nome}
                  onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="novo-doc">CPF ou documento</FieldLabel>
                <Input
                  id="novo-doc"
                  value={novo.documento}
                  onChange={(e) => setNovo({ ...novo, documento: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="novo-tel">Telefone</FieldLabel>
                <Input
                  id="novo-tel"
                  type="tel"
                  value={novo.telefone}
                  onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
                />
              </Field>
            </div>
          ) : (
            <Field>
              <FieldLabel htmlFor="hospede">Hóspede</FieldLabel>
              <HospedePicker
                id="hospede"
                valor={hospedeId}
                onSelecionar={setHospedeId}
                onNovo={(nome) => setNovo({ nome, documento: "", telefone: "" })}
              />
              <p className="text-xs text-muted-foreground">
                Não achou? Digite o nome e escolha “Cadastrar”.
              </p>
            </Field>
          )}
        </FormSection>

        <FormSection titulo="Estadia" {...propsDaEtapa(1)}>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="entrada">Entrada</FieldLabel>
              <Input
                id="entrada"
                type="date"
                required
                value={entrada}
                disabled={entradaTravada}
                onChange={(e) => trocarEntrada(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="saida">Saída</FieldLabel>
              <Input
                id="saida"
                type="date"
                required
                value={saida}
                min={somarDias(entrada || hoje, 1)}
                onChange={(e) => setSaida(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pessoas">Pessoas</FieldLabel>
              <Input
                id="pessoas"
                type="number"
                required
                min={1}
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
              />
            </Field>
            <div className="flex items-end">
              <p className="pb-2 text-sm text-muted-foreground">
                {noites > 0 ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {noites} {noites === 1 ? "noite" : "noites"}
                    </span>{" "}
                    · {dataCurta(entrada)} a {dataCurta(saida)}
                  </>
                ) : (
                  "Confira as datas"
                )}
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection titulo="Quarto" {...propsDaEtapa(2)}>
          <div
            role="radiogroup"
            aria-label="Quarto"
            className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2"
          >
            {quartos.map(({ q, disponivel, motivo }) => {
              const escolhido = q.id === quartoId
              return (
                <button
                  key={q.id}
                  type="button"
                  role="radio"
                  aria-checked={escolhido}
                  disabled={!disponivel}
                  onClick={() => escolherQuarto(q.id)}
                  className={cn(
                    "flex flex-col rounded-lg border bg-background p-2.5 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border",
                    escolhido && "border-primary bg-primary/10 ring-2 ring-primary/30"
                  )}
                >
                  <span className="text-lg leading-none font-semibold tabular-nums">{q.numero}</span>
                  <span className="mt-1 truncate text-xs text-muted-foreground">
                    {q.tipo} · {moeda(q.diaria)}
                  </span>
                  {motivo && (
                    <span className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      {motivo}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <Field>
              <FieldLabel htmlFor="diaria">Diária (R$)</FieldLabel>
              <Input
                id="diaria"
                inputMode="decimal"
                value={diaria}
                onChange={(e) => setDiaria(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="obs">Observações</FieldLabel>
              <Input id="obs" value={obs} onChange={(e) => setObs(e.target.value)} />
            </Field>
          </div>
        </FormSection>
      </div>

      <StepFooter
        etapa={etapa}
        ultima={ultima}
        onVoltar={voltar}
        onAvancar={avancar}
        rotuloSalvar={checkin ? "Fazer check-in" : reserva ? "Salvar alterações" : "Salvar reserva"}
        resumo={
          noites > 0 && valorDiaria >= 0 ? (
            <>
              {noites} {noites === 1 ? "noite" : "noites"} ·{" "}
              <span className="font-semibold text-foreground">{moeda(noites * valorDiaria)}</span>
            </>
          ) : null
        }
      />
    </form>
  )
}
