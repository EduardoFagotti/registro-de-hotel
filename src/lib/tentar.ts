import { toast } from "sonner"

/** Executa uma ação do store, mostrando o erro em um toast. Retorna true se deu certo. */
export function tentar(acao: () => void, sucesso?: string) {
  try {
    acao()
    if (sucesso) toast.success(sucesso)
    return true
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Algo deu errado.")
    return false
  }
}
