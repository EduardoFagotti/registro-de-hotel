import type { Metadata } from "next";
import { Suspense } from "react";

import { Carregando } from "@/components/carregando";
import { ReservasView } from "@/components/views/reservas-view";

export const metadata: Metadata = { title: "Reservas" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando titulo="Reservas" />}>
      <ReservasView />
    </Suspense>
  );
}
