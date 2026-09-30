import type { DamageLevel } from "@/types/domain";

const styles: Record<DamageLevel, string> = {
  GREEN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  YELLOW: "bg-amber-50 text-amber-700 ring-amber-200",
  RED: "bg-red-50 text-red-700 ring-red-200",
};

const labels: Record<DamageLevel, string> = {
  GREEN: "Daño menor",
  YELLOW: "Daño reparable",
  RED: "Daño severo",
};

export function DamageBadge({ level }: { level: DamageLevel }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
}
