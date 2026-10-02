"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";
import { getGeo } from "./StageModals";
import { checkInVisit } from "@/lib/actions";

export default function QuickStart({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        className="w-full"
        size="lg"
        icon="play"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await checkInVisit(visitId, await getGeo());
            if (!res.ok) setError(res.error);
            else router.push(`/visitas/${visitId}`);
          })
        }
      >
        Cheguei — iniciar visita
      </Button>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
