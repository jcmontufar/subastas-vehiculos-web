import type { AuctionStatus, Vehicle } from "@/types/domain";

export function getAuctionStatus(
  vehicle: Pick<Vehicle, "startAt" | "endAt">,
): AuctionStatus {
  const now = Date.now();
  if (now < new Date(vehicle.startAt).getTime()) return "PENDING";
  if (now >= new Date(vehicle.endAt).getTime()) return "ENDED";
  return "ACTIVE";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAuctionTime(vehicle: Pick<Vehicle, "startAt" | "endAt">) {
  const status = getAuctionStatus(vehicle);
  if (status === "ENDED") return "Subasta finalizada";
  const target = new Date(
    status === "PENDING" ? vehicle.startAt : vehicle.endAt,
  ).getTime();
  const minutes = Math.max(1, Math.ceil((target - Date.now()) / 60_000));
  const value =
    minutes >= 1_440
      ? `${Math.ceil(minutes / 1_440)} d`
      : minutes >= 60
        ? `${Math.ceil(minutes / 60)} h`
        : `${minutes} min`;
  return status === "PENDING" ? `Inicia en ${value}` : `Cierra en ${value}`;
}
