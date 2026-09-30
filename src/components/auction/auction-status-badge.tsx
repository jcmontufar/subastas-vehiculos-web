import type { AuctionStatus } from "@/types/domain";

const config: Record<AuctionStatus, { label: string; style: string }> = {
  ACTIVE: { label: "En subasta", style: "bg-blue-600 text-white" },
  PENDING: { label: "Próximamente", style: "bg-violet-100 text-violet-700" },
  ENDED: { label: "Finalizada", style: "bg-slate-200 text-slate-600" },
};

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  const item = config[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.style}`}
    >
      {item.label}
    </span>
  );
}
