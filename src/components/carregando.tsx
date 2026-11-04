import { Pagina } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"

/** Fallback das páginas enquanto os dados do navegador são carregados. */
export function Carregando({ titulo }: { titulo: string }) {
  return (
    <Pagina>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight sm:mt-6 sm:text-3xl">{titulo}</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </Pagina>
  )
}
