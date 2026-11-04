import type { Metadata } from "next";
import { Suspense } from "react";

import { Carregando } from "@/components/carregando";
import { CaixaView } from "@/components/views/caixa-view";

export const metadata: Metadata = { title: "Caixa" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando titulo="Caixa" />}>
      <CaixaView />
    </Suspense>
  );
}
