"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  ChevronsUpDown,
  DoorOpen,
  LayoutGrid,
  RotateCcw,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { RestaurarExemploDialog } from "@/components/restaurar-exemplo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type ItemMenu = { titulo: string; href: string; icone: LucideIcon }
type SecaoMenu = { rotulo?: string; itens: ItemMenu[] }

const secoes: SecaoMenu[] = [
  { itens: [{ titulo: "Mapa de quartos", href: "/", icone: LayoutGrid }] },
  {
    rotulo: "Recepção",
    itens: [
      { titulo: "Reservas", href: "/reservas", icone: CalendarDays },
      { titulo: "Hóspedes", href: "/hospedes", icone: Users },
    ],
  },
  { rotulo: "Financeiro", itens: [{ titulo: "Caixa", href: "/caixa", icone: Wallet }] },
  { rotulo: "Configurações", itens: [{ titulo: "Quartos", href: "/quartos", icone: DoorOpen }] },
]

const ITEM_ATIVO =
  "text-sidebar-foreground/80 data-[active=true]:bg-primary/15 data-[active=true]:font-semibold data-[active=true]:text-primary-strong dark:data-[active=true]:bg-primary/20"

const ativo = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href)

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const [restaurar, setRestaurar] = useState(false)
  // No celular o menu é uma gaveta por cima da tela: fecha ao escolher um destino.
  const fecharNoCelular = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/" onClick={fecharNoCelular}>
                <BrandMark size="2.25rem" className="text-foreground" />
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Registro de Hotel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {secoes.map((secao, i) => (
          <SidebarGroup key={secao.rotulo ?? `secao-${i}`} className={cn(!secao.rotulo && "pb-0")}>
            {secao.rotulo && <SidebarGroupLabel>{secao.rotulo}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {secao.itens.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={ativo(pathname, item.href)}
                      tooltip={item.titulo}
                      className={ITEM_ATIVO}
                    >
                      <Link href={item.href} onClick={fecharNoCelular}>
                        <item.icone />
                        <span>{item.titulo}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium">
                    RC
                  </span>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Recepção</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Dados neste navegador
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">Recepção</div>
                  <div className="text-xs text-muted-foreground">
                    Por enquanto os dados ficam salvos só neste navegador.
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setRestaurar(true)}>
                  <RotateCcw />
                  Restaurar dados de exemplo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <RestaurarExemploDialog aberto={restaurar} onAbertoChange={setRestaurar} />
    </Sidebar>
  )
}
