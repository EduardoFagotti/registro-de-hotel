"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formasPagamento } from "@/lib/hotel"
import type { FormaPagamento } from "@/lib/types"

export function FormaPagamentoToggle({
  valor,
  onChange,
}: {
  valor: FormaPagamento
  onChange: (forma: FormaPagamento) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={valor}
      onValueChange={(v) => v && onChange(v as FormaPagamento)}
      className="w-full"
    >
      {Object.entries(formasPagamento).map(([forma, label]) => (
        <ToggleGroupItem key={forma} value={forma} className="flex-1">
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
