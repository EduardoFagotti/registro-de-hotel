"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

/**
 * Passo a passo de formulário. Cada etapa só avança com os campos
 * obrigatórios válidos. O form deve usar `noValidate`: a validação é feita
 * aqui, etapa por etapa, porque campos de etapas escondidas não podem
 * receber o aviso do navegador.
 */
export function useFormSteps({
  totalEtapas,
  etapaCompleta,
  validarEtapa,
  editando = false,
}: {
  totalEtapas: number
  /** A etapa tem todos os campos obrigatórios preenchidos? */
  etapaCompleta: (indice: number) => boolean
  /** Regras que o navegador não confere (ex.: seletor de hóspede, datas). Retorna o aviso. */
  validarEtapa?: (indice: number) => string | null
  /** Na edição tudo já foi preenchido antes: todas as etapas começam liberadas. */
  editando?: boolean
}) {
  const ultima = totalEtapas - 1
  const [etapa, setEtapa] = useState(0)
  // Etapa mais adiante já visitada.
  const [alcancada, setAlcancada] = useState(editando ? ultima : 0)
  const etapaRefs = useRef<(HTMLElement | null)[]>([])
  const rolagemRef = useRef<HTMLDivElement>(null)

  // Concluída = já visitada e com os obrigatórios preenchidos (um campo
  // pré-preenchido numa etapa ainda não vista não conta como concluído).
  const concluidas = Array.from({ length: totalEtapas }, (_, i) => i <= alcancada && etapaCompleta(i))

  /** Valida a etapa; se mostrar = true, destaca o primeiro campo inválido ou mostra o aviso. */
  const validar = (indice: number, mostrar: boolean) => {
    const container = etapaRefs.current[indice]
    if (container) {
      const campos = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
      for (const campo of campos) {
        if (!campo.checkValidity()) {
          if (mostrar) campo.reportValidity()
          return false
        }
      }
    }
    const aviso = validarEtapa?.(indice)
    if (aviso) {
      if (mostrar) toast.error(aviso)
      return false
    }
    return true
  }

  const irPara = (indice: number) => {
    setEtapa(indice)
    setAlcancada((a) => Math.max(a, indice))
    rolagemRef.current?.scrollTo({ top: 0 })
  }

  const avancar = () => {
    if (validar(etapa, true)) irPara(Math.min(etapa + 1, ultima))
  }

  const voltar = () => irPara(Math.max(etapa - 1, 0))

  /** Pode ir direto para uma etapa já visitada ou com todas as anteriores completas. */
  const podeIrPara = (indice: number) =>
    indice <= alcancada || Array.from({ length: indice }, (_, i) => etapaCompleta(i)).every(Boolean)

  /**
   * Envio do formulário. Fora da última etapa, o Enter avança de etapa. Antes
   * de enviar, confere todas as etapas e leva até a primeira com problema.
   */
  const enviarPorEtapas = (evento: React.FormEvent, enviar: () => void) => {
    evento.preventDefault()
    if (etapa < ultima) {
      avancar()
      return
    }
    for (let i = 0; i < totalEtapas; i++) {
      if (!validar(i, false)) {
        irPara(i)
        // espera a etapa aparecer na tela para mostrar o aviso no campo
        setTimeout(() => validar(i, true), 50)
        return
      }
    }
    enviar()
  }

  /** Liga a seção à etapa: guarda o elemento (para validar) e esconde fora dela. */
  const propsDaEtapa = (indice: number) => ({
    hidden: etapa !== indice,
    sectionRef: (el: HTMLElement | null) => {
      etapaRefs.current[indice] = el
    },
  })

  return {
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
  }
}
