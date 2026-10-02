"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ClientForm from "./ClientForm";
import { Button } from "./ui";
import { deleteClient } from "@/lib/actions";
import type { Client, PublicUser } from "@/lib/types";

export function NewClientButton({ users }: { users: PublicUser[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        Novo cliente
      </Button>
      {open && <ClientForm open users={users} onClose={() => setOpen(false)} onSaved={(id) => router.push(`/clientes/${id}`)} />}
    </>
  );
}

export function EditClientButtons({ client, users, canDelete }: { client: Client; users: PublicUser[]; canDelete: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="secondary" icon="edit" onClick={() => setOpen(true)}>
        Editar
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          icon="trash"
          loading={pending}
          className="text-rose-600 hover:bg-rose-50"
          onClick={() => {
            if (!confirm(`Excluir o cliente ${client.name}?`)) return;
            start(async () => {
              const res = await deleteClient(client.id);
              if (!res.ok) alert(res.error);
              else router.push("/clientes");
            });
          }}
        >
          Excluir
        </Button>
      )}
      {open && <ClientForm open client={client} users={users} onClose={() => setOpen(false)} />}
    </>
  );
}
