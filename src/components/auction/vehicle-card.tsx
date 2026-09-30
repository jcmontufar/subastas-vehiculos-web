import {
  CalendarClock,
  CalendarDays,
  Fuel,
  Gauge,
  MoveRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatAuctionTime,
  formatCurrency,
  getAuctionStatus,
} from "@/lib/auction";
import type { Vehicle } from "@/types/domain";
import { AuctionStatusBadge } from "./auction-status-badge";
import { DamageBadge } from "./damage-badge";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const status = getAuctionStatus(vehicle);
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/vehiculos/${vehicle.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image
            src={vehicle.images[0]?.url ?? "/vehicle-placeholder.svg"}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <AuctionStatusBadge status={status} />
          </div>
          <div className="absolute top-3 right-3">
            <DamageBadge level={vehicle.damageLevel} />
          </div>
        </div>
        <div className="p-5">
          <p className="mb-1 text-sm font-semibold text-blue-600">
            Lote #{vehicle.id.slice(-6).toUpperCase()}
          </p>
          <h3 className="text-xl font-bold text-slate-900">
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Fuel className="size-4 text-blue-500" />
              {vehicle.fuelType}
            </span>
            <span className="flex items-center gap-2">
              <Gauge className="size-4 text-blue-500" />
              {vehicle.transmission}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-blue-500" />
              {vehicle.drivetrain}
            </span>
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
            <CalendarClock className="size-4 text-blue-500" />{" "}
            {formatAuctionTime(vehicle)}
          </p>
          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                {vehicle.currentBid ? "Oferta actual" : "Precio base"}
              </p>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(vehicle.currentBid ?? vehicle.basePrice)}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
              <MoveRight className="size-5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
