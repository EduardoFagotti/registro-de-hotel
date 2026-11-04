import type { Metadata } from "next";
import { Suspense } from "react";

import { Carregando } from "@/components/carregando";
import { HospedesView } from "@/components/views/hospedes-view";

export const metadata: Metadata = { title: "Hóspedes" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando titulo="Hóspedes" />}>
      <HospedesView />
    </Suspense>
  );
}
