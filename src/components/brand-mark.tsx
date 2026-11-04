import { cn } from "@/lib/utils"

/** Ícone da marca: chave de hotel com a placa na cor primária. */
export function BrandMark({ className, size = "1.2em" }: { className?: string; size?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      // style também, para vencer regras como `[&>svg]:size-4` do botão da sidebar
      style={{ width: size, height: size }}
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <g transform="rotate(-35 24 24)">
        <circle cx="24" cy="9.5" r="5.5" stroke="currentColor" strokeWidth="3" />
        <path d="M24 15v7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="14" y="22" width="20" height="21" rx="5" className="fill-primary" />
        <path d="M24 28v9" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}
