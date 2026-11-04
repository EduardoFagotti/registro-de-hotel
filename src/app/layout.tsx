import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · Registro de Hotel",
    default: "Registro de Hotel",
  },
  description: "Sistema simples de recepção para hotéis e pousadas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SidebarProvider
              style={
                { "--sidebar-width": "13rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties
              }
            >
              <AppSidebar />
              {/* Fundo na cor do menu: o painel de conteúdo se encaixa nessa moldura. */}
              {/* min-w-0: deixa o conteúdo encolher; tabelas largas rolam dentro do card */}
              <SidebarInset className="min-w-0 bg-sidebar">
                <header className="flex h-14 shrink-0 items-center gap-2 bg-sidebar px-4 text-sidebar-foreground">
                  <SidebarTrigger />
                  <div className="flex flex-1 justify-end">
                    <ThemeToggle />
                  </div>
                </header>
                <div className="flex flex-1 flex-col rounded-tl-2xl bg-background">{children}</div>
              </SidebarInset>
            </SidebarProvider>
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
