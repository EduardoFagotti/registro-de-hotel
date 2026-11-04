import { Suspense } from "react";

import { Carregando } from "@/components/carregando";
import { MapaView } from "@/components/views/mapa-view";

export default function Page() {
  return (
    <Suspense fallback={<Carregando titulo="Mapa de quartos" />}>
      <MapaView />
    </Suspense>
  );
}
