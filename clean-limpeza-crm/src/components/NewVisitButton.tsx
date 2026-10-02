"use client";

import { useState } from "react";
import VisitForm from "./VisitForm";
import { Button } from "./ui";
import type { Client, PublicUser } from "@/lib/types";

export default function NewVisitButton({
  clients,
  users,
  me,
  clientId,
  label = "Agendar visita",
  variant = "primary",
  scheduledAt,
}: {
  clients: Client[];
  users: PublicUser[];
  me: PublicUser;
  clientId?: string;
  label?: string;
  variant?: "primary" | "secondary";
  scheduledAt?: string;
}) {
  const [open, setOpen] = useState(false);
  const client = clients.find((c) => c.id === clientId);
  return (
    <>
      <Button icon="plus" variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <VisitForm
          open
          onClose={() => setOpen(false)}
          clients={clients}
          users={users}
          me={me}
          defaults={{
            ...(client
              ? {
                  clientId: client.id,
                  address: { ...client.address },
                  assignedTo: me.role === "funcionario" ? me.id : (users.find((u) => u.id === client.ownerId && u.active)?.id ?? ""),
                }
              : {}),
            ...(scheduledAt ? { scheduledAt } : {}),
          }}
        />
      )}
    </>
  );
}
