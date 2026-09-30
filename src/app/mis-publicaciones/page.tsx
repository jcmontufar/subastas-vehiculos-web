"use client";

import { Edit3, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DamageBadge } from "@/components/auction/damage-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/auction";
import type { Vehicle } from "@/types/domain";

export default function MyListingsPage() {
  return (
    <ProtectedPage>
      <MyListings />
    </ProtectedPage>
  );
}

function MyListings() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/vehicles")
      .then(async (response) => {
        if (!response.ok)
          throw new Error("No fue posible cargar tus publicaciones");
        return (await response.json()) as { data: Vehicle[] };
      })
      .then(({ data }) =>
        setVehicles(data.filter((vehicle) => vehicle.ownerId === user?.uid)),
      )
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Error inesperado"),
      )
      .finally(() => setLoading(false));
  }, [user?.uid]);
  const filtered = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        `${vehicle.year} ${vehicle.brand} ${vehicle.model}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search, vehicles],
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-widest text-blue-600 uppercase">
            Panel personal
          </p>
          <h1 className="mt-2 text-3xl font-black">Mis publicaciones</h1>
          <p className="mt-2 text-slate-500">
            Busca y administra los vehículos que has publicado.
          </p>
        </div>
        <Link
          href="/publicar"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
        >
          <Plus className="size-5" /> Nueva publicación
        </Link>
      </div>
      <div className="relative mt-8">
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por año, marca o modelo…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-12 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
        />
      </div>
      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aún no tienes publicaciones"
            description="Publica tu primer vehículo para verlo aquí."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((vehicle) => (
              <article
                key={vehicle.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h2>
                    <DamageBadge level={vehicle.damageLevel} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Precio base:{" "}
                    <strong className="text-slate-700">
                      {formatCurrency(vehicle.basePrice)}
                    </strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/vehiculos/${vehicle.id}`}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/mis-publicaciones/${vehicle.id}/editar`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
                  >
                    <Edit3 className="size-4" /> Editar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
