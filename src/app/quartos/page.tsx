import type { Metadata } from "next";
import { Suspense } from "react";

import { Carregando } from "@/components/carregando";
import { QuartosView } from "@/components/views/quartos-view";

export const metadata: Metadata = { title: "Quartos" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando titulo="Quartos" />}>
      <QuartosView />
    </Suspense>
  );
}
