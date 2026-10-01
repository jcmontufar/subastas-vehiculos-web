import type { AuctionStatus } from "@/types/domain";

const config: Record<AuctionStatus, { label: string; style: string }> = {
  LIVE: { label: "En vivo", style: "bg-blue-600 text-white" },
  UPCOMING: {
    label: "Próximamente",
    style: "bg-violet-100 text-violet-700",
  },
  SOLD: { label: "Vendida", style: "bg-emerald-100 text-emerald-700" },
  UNSOLD: { label: "Desierta", style: "bg-slate-200 text-slate-600" },
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
