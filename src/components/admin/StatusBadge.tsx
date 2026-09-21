export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400",
    confirmed: "bg-blue-500/15 text-blue-400",
    completed: "bg-green-500/15 text-green-400",
    cancelled: "bg-red-500/15 text-red-400",
  };
  const labels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
