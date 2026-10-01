import type {
  AuctionStatus,
  PublicAuctionState,
  Vehicle,
} from "@/types/domain";

export function getAuctionStatus(
  vehicle: Pick<Vehicle, "startAt" | "endAt"> &
    Partial<Pick<PublicAuctionState, "bidCount">> &
    Partial<Pick<Vehicle, "currentBid">>,
  now = Date.now(),
): AuctionStatus {
  if (now < new Date(vehicle.startAt).getTime()) return "UPCOMING";
  if (now < new Date(vehicle.endAt).getTime()) return "LIVE";
  return (vehicle.bidCount ?? (vehicle.currentBid ? 1 : 0)) > 0
    ? "SOLD"
    : "UNSOLD";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCents(value: number) {
  return formatCurrency(value / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAuctionTime(vehicle: Pick<Vehicle, "startAt" | "endAt">) {
  const status = getAuctionStatus(vehicle);
  if (status === "SOLD") return "Vehículo vendido";
  if (status === "UNSOLD") return "Subasta desierta";
  const target = new Date(
    status === "UPCOMING" ? vehicle.startAt : vehicle.endAt,
  ).getTime();
  const minutes = Math.max(1, Math.ceil((target - Date.now()) / 60_000));
  const value =
    minutes >= 1_440
      ? `${Math.ceil(minutes / 1_440)} d`
      : minutes >= 60
        ? `${Math.ceil(minutes / 60)} h`
        : `${minutes} min`;
  return status === "UPCOMING" ? `Inicia en ${value}` : `Cierra en ${value}`;
}
