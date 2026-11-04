"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useHotel } from "@/lib/hotel-store"

export function HospedePicker({
  id,
  valor,
  onSelecionar,
  onNovo,
}: {
  id?: string
  valor: string
  onSelecionar: (hospedeId: string) => void
  onNovo: (nome: string) => void
}) {
  const { dados } = useHotel()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState("")
  const selecionado = dados.hospedes.find((h) => h.id === valor)
  const hospedes = [...dados.hospedes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

  return (
    <Popover open={aberto} onOpenChange={setAberto} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selecionado && "text-muted-foreground")}>
            {selecionado?.nome ?? "Buscar hóspede…"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Nome, CPF ou telefone" value={busca} onValueChange={setBusca} />
          <CommandList>
            <CommandEmpty>Nenhum hóspede encontrado.</CommandEmpty>
            <CommandGroup>
              {hospedes.map((h) => (
                <CommandItem
                  key={h.id}
                  value={`${h.nome} ${h.documento} ${h.telefone} ${h.id}`}
                  onSelect={() => {
                    onSelecionar(h.id)
                    setAberto(false)
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{h.nome}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {h.documento || h.telefone}
                    </span>
                  </div>
                  <Check className={cn("ml-auto", h.id === valor ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup forceMount>
              <CommandItem
                forceMount
                value="__novo"
                onSelect={() => {
                  onNovo(busca)
                  setAberto(false)
                }}
              >
                <UserPlus />
                {busca ? `Cadastrar “${busca}”` : "Cadastrar novo hóspede"}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
