"use client";

import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Gavel,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { VehicleCard } from "@/components/auction/vehicle-card";
import {
  emptyFilters,
  VehicleFilters,
} from "@/components/auction/vehicle-filters";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import type { Vehicle, VehicleFiltersValue } from "@/types/domain";

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<VehicleFiltersValue>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/vehicles")
      .then(async (response) => {
        if (!response.ok)
          throw new Error("No fue posible cargar el inventario");
        return (await response.json()) as { data: Vehicle[] };
      })
      .then(({ data }) => setVehicles(data))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Error inesperado"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        Object.entries(filters).every(
          ([key, value]) =>
            !value ||
            String(vehicle[key as keyof Vehicle]).toLowerCase() ===
              value.toLowerCase(),
        ),
      ),
    [vehicles, filters],
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="absolute -top-32 -right-24 size-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700">
              <BadgeCheck className="size-4" /> Vehículos verificados,
              oportunidades reales
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-black tracking-tight text-slate-950 sm:text-6xl">
              Encuentra tu próximo vehículo en{" "}
              <span className="text-blue-600">subasta.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explora el inventario, revisa cada detalle y prepárate para
              ofertar con confianza desde cualquier dispositivo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#inventario"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
              >
                <Search className="size-5" /> Ver inventario
              </a>
              <Link
                href="/publicar"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600"
              >
                Publicar un vehículo <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: CarFront,
                title: "Inventario completo",
                text: "Ficha técnica y galería detallada.",
              },
              {
                icon: ShieldCheck,
                title: "Acceso seguro",
                text: "Identidad protegida por Firebase.",
              },
              {
                icon: Gavel,
                title: "Subastas transparentes",
                text: "Fechas, estados y precios visibles.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-2xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">{title}</h2>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        id="inventario"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mb-7">
          <p className="text-sm font-bold tracking-widest text-blue-600 uppercase">
            Inventario público
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Vehículos disponibles
          </h2>
          <p className="mt-2 text-slate-500">
            Combina filtros para encontrar exactamente lo que buscas.
          </p>
        </div>
        <VehicleFilters
          vehicles={vehicles}
          value={filters}
          onChange={setFilters}
        />
        <div className="mt-8">
          {loading ? (
            <LoadingState message="Cargando inventario…" />
          ) : error ? (
            <ErrorState message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="mb-4 text-sm font-semibold text-slate-500">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "vehículo encontrado"
                  : "vehículos encontrados"}
              </p>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
