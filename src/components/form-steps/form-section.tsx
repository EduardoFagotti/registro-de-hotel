import { cn } from "@/lib/utils"

/** Grupo de campos: subtítulo no celular; quadro com borda a partir do tablet. */
export function FormSection({
  titulo,
  children,
  hidden = false,
  sectionRef,
}: {
  titulo: string
  children: React.ReactNode
  /** Esconde a seção (etapa que não é a atual). */
  hidden?: boolean
  sectionRef?: (el: HTMLElement | null) => void
}) {
  const id = `secao-${titulo.toLowerCase().replace(/\s+/g, "-")}`
  return (
    <section
      ref={sectionRef}
      aria-labelledby={id}
      className={cn(
        "grid content-start gap-3 sm:rounded-xl sm:border sm:bg-muted/20 sm:p-4",
        hidden && "hidden"
      )}
    >
      <h3 id={id} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {titulo}
      </h3>
      {children}
    </section>
  )
}
