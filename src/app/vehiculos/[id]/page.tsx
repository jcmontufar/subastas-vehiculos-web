"use client";

import { CalendarClock, Gavel, Settings2, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuctionStatusBadge } from "@/components/auction/auction-status-badge";
import { DamageBadge } from "@/components/auction/damage-badge";
import { ImageCarousel } from "@/components/auction/image-carousel";
import { ErrorState, LoadingState } from "@/components/states";
import { formatCurrency, formatDate, getAuctionStatus } from "@/lib/auction";
import type { Vehicle } from "@/types/domain";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then(async (response) => {
        const body = (await response.json()) as {
          data?: Vehicle;
          error?: string;
        };
        if (!response.ok || !body.data)
          throw new Error(body.error ?? "Vehículo no encontrado");
        return body.data;
      })
      .then(setVehicle)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Error inesperado"),
      );
  }, [id]);
  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <ErrorState message={error} />
      </div>
    );
  if (!vehicle) return <LoadingState message="Cargando vehículo…" />;
  const status = getAuctionStatus(vehicle);
  const specs = [
    { label: "Tipo", value: vehicle.itemType },
    { label: "Motor", value: vehicle.engine },
    { label: "Transmisión", value: vehicle.transmission },
    { label: "Combustible", value: vehicle.fuelType },
    { label: "Tren de manejo", value: vehicle.drivetrain },
    { label: "Cilindros", value: String(vehicle.cylinders) },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-600">
            Lote #{vehicle.id.slice(-6).toUpperCase()}
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl">
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </h1>
          <div className="mt-3 flex gap-2">
            <AuctionStatusBadge status={status} />
            <DamageBadge level={vehicle.damageLevel} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-right shadow-sm">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            {vehicle.currentBid ? "Oferta actual" : "Precio base"}
          </p>
          <p className="text-3xl font-black text-blue-600">
            {formatCurrency(vehicle.currentBid ?? vehicle.basePrice)}
          </p>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.45fr_.75fr]">
        <ImageCarousel
          images={vehicle.images}
          title={`${vehicle.brand} ${vehicle.model}`}
        />
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Settings2 className="text-blue-600" /> Ficha técnica
            </h2>
            <dl className="mt-5 divide-y divide-slate-100">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <dt className="text-slate-500">{spec.label}</dt>
                  <dd className="font-bold text-slate-800">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <CalendarClock className="text-blue-600" /> Calendario
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Inicio</p>
                <p className="font-bold">{formatDate(vehicle.startAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Cierre</p>
                <p className="font-bold">{formatDate(vehicle.endAt)}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
      <section className="mt-8 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
        <div className="flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Gavel className="text-blue-600" /> Área de subasta
            </h2>
            <p className="mt-2 text-slate-500">
              El motor de pujas en tiempo real estará disponible en la siguiente
              fase.
            </p>
          </div>
          <button
            disabled
            className="rounded-xl bg-slate-200 px-6 py-3 font-bold text-slate-500"
          >
            Ofertar próximamente
          </button>
        </div>
        <div className="flex items-center gap-2 border-t border-blue-100 bg-blue-50 px-6 py-3 text-sm text-blue-700">
          <ShieldAlert className="size-4" /> Las validaciones de puja se
          implementarán en el servidor en la fase siguiente.
        </div>
      </section>
    </div>
  );
}
