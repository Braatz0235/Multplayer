import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getAvailableSlots, isPastDate } from "@/lib/availability";
import type { Booking } from "@/lib/types";

const schema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[\d()\-+\s]+$/, "Telefone inválido."),
  notes: z.string().trim().max(300).optional().default(""),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { serviceId, date, time, customerName, customerPhone, notes } =
    parsed.data;

  if (isPastDate(date)) {
    return NextResponse.json(
      { error: "Não é possível agendar em uma data passada." },
      { status: 400 }
    );
  }

  const result = await updateDb((db) => {
    const service = db.services.find((s) => s.id === serviceId && s.active);
    if (!service) {
      return { error: "Serviço não encontrado.", status: 404 } as const;
    }

    const available = getAvailableSlots(db, service, date);
    if (!available.includes(time)) {
      return {
        error: "Esse horário acabou de ficar indisponível. Escolha outro.",
        status: 409,
      } as const;
    }

    const booking: Booking = {
      id: nanoid(10),
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.durationMinutes,
      date,
      time,
      customerName,
      customerPhone,
      notes: notes ?? "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    db.bookings.push(booking);

    return {
      booking,
      whatsapp: db.settings.whatsapp,
      shopName: db.settings.siteName,
    } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { booking, whatsapp, shopName } = result;

  const message = [
    `Olá, ${shopName}! Gostaria de confirmar meu agendamento:`,
    `Serviço: ${booking.serviceName}`,
    `Data: ${formatDatePtBr(booking.date)}`,
    `Horário: ${booking.time}`,
    `Nome: ${booking.customerName}`,
    booking.notes ? `Observações: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    message
  )}`;

  return NextResponse.json({ booking, whatsappUrl }, { status: 201 });
}

function formatDatePtBr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
