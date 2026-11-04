"use client"

import { useState } from "react"
import { IdCard, Phone, Search, UserPlus, Users } from "lucide-react"

import { FormSection } from "@/components/form-steps/form-section"
import { FormStepper } from "@/components/form-steps/form-stepper"
import { StepDialog, StepFooter } from "@/components/form-steps/step-dialog"
import { useFormSteps } from "@/components/form-steps/use-form-steps"
import { PageHeader, Pagina } from "@/components/page-header"
import { Button } from "@/components/ui/button"
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
import { dataCurta } from "@/lib/format"
import { useHotel } from "@/lib/hotel-store"
import { tentar } from "@/lib/tentar"
import type { Hospede } from "@/lib/types"

const ETAPAS = [
  { titulo: "Identificação", icone: IdCard },
  { titulo: "Contato", icone: Phone },
] as const

export function HospedesView() {
  const { dados } = useHotel()
  const [busca, setBusca] = useState("")
  const [editando, setEditando] = useState<Hospede | "novo" | null>(null)
  const termo = busca.trim().toLowerCase()
  const digitos = termo.replace(/\D/g, "")

  const linhas = dados.hospedes
    .filter(
      (h) =>
        !termo ||
        h.nome.toLowerCase().includes(termo) ||
        (digitos && (h.documento + h.telefone).replace(/\D/g, "").includes(digitos))
    )
    .map((h) => {
      const estadias = dados.reservas
        .filter((r) => r.hospedeId === h.id && r.status !== "cancelada")
        .sort((a, b) => b.entrada.localeCompare(a.entrada))
      return { h, estadias: estadias.length, ultima: estadias[0]?.entrada }
    })
    .sort((a, b) => a.h.nome.localeCompare(b.h.nome, "pt-BR"))

  return (
    <Pagina>
      <PageHeader titulo="Hóspedes" icone={Users}>
        <Button size="lg" onClick={() => setEditando("novo")}>
          <UserPlus /> Novo hóspede
        </Button>
      </PageHeader>

      <div className="mb-4 relative w-full sm:max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou telefone"
          className="pl-8"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Cidade</TableHead>
              <TableHead className="text-right">Estadias</TableHead>
              <TableHead className="pr-4 text-right">Última</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map(({ h, estadias, ultima }) => (
              <TableRow key={h.id} className="cursor-pointer" onClick={() => setEditando(h)}>
                <TableCell className="pl-4 font-medium">{h.nome}</TableCell>
                <TableCell className="tabular-nums">{h.documento || "—"}</TableCell>
                <TableCell className="tabular-nums">{h.telefone || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{h.cidade || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{estadias}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {ultima ? dataCurta(ultima) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum hóspede encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <StepDialog
        aberto={editando !== null}
        onAbertoChange={(aberto) => !aberto && setEditando(null)}
        titulo={editando && editando !== "novo" ? "Editar hóspede" : "Novo hóspede"}
        descricao="Só o nome é obrigatório; o resto ajuda a encontrar o hóspede depois."
      >
        {editando !== null && (
          <HospedeForm
            hospede={editando === "novo" ? undefined : editando}
            onConcluir={() => setEditando(null)}
          />
        )}
      </StepDialog>
    </Pagina>
  )
}

function HospedeForm({ hospede, onConcluir }: { hospede?: Hospede; onConcluir: () => void }) {
  const { dados, salvarHospede, removerHospede } = useHotel()
  const [form, setForm] = useState({
    nome: hospede?.nome ?? "",
    documento: hospede?.documento ?? "",
    telefone: hospede?.telefone ?? "",
    email: hospede?.email ?? "",
    cidade: hospede?.cidade ?? "",
  })
  const temReservas = !!hospede && dados.reservas.some((r) => r.hospedeId === hospede.id)
  const campo = (chave: keyof typeof form) => ({
    id: `hospede-${chave}`,
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [chave]: e.target.value }),
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
    editando: !!hospede,
    etapaCompleta: (i) => (i === 0 ? !!form.nome.trim() : true),
  })

  function salvar() {
    const ok = tentar(
      () => salvarHospede({ ...form, id: hospede?.id }),
      hospede ? "Cadastro atualizado." : "Hóspede cadastrado."
    )
    if (ok) onConcluir()
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
        <FormSection titulo="Identificação" {...propsDaEtapa(0)}>
          <Field>
            <FieldLabel htmlFor="hospede-nome">Nome completo</FieldLabel>
            <Input required autoFocus {...campo("nome")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="hospede-documento">CPF ou documento</FieldLabel>
            <Input {...campo("documento")} />
          </Field>
        </FormSection>

        <FormSection titulo="Contato" {...propsDaEtapa(1)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="hospede-telefone">Telefone</FieldLabel>
              <Input type="tel" {...campo("telefone")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="hospede-email">E-mail</FieldLabel>
              <Input type="email" {...campo("email")} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="hospede-cidade">Cidade</FieldLabel>
              <Input {...campo("cidade")} />
            </Field>
          </div>
          {hospede && !temReservas && (
            <Button
              type="button"
              variant="ghost"
              className="justify-self-start text-destructive hover:text-destructive"
              onClick={() => tentar(() => removerHospede(hospede.id), "Hóspede removido.") && onConcluir()}
            >
              Excluir hóspede
            </Button>
          )}
        </FormSection>
      </div>

      <StepFooter
        etapa={etapa}
        ultima={ultima}
        onVoltar={voltar}
        onAvancar={avancar}
        rotuloSalvar={hospede ? "Salvar alterações" : "Cadastrar hóspede"}
      />
    </form>
  )
}
