"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { ErrorState, LoadingState } from "@/components/states";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { useAuth } from "@/contexts/auth-context";
import type { Vehicle } from "@/types/domain";

export default function EditVehiclePage() {
  return (
    <ProtectedPage>
      <EditContent />
    </ProtectedPage>
  );
}

function EditContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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
        if (body.data.ownerId !== user?.uid)
          throw new Error("No tienes permiso para editar esta publicación");
        return body.data;
      })
      .then(setVehicle)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Error inesperado"),
      );
  }, [id, user?.uid]);
  if (error)
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState message={error} />
      </div>
    );
  if (!vehicle) return <LoadingState message="Cargando publicación…" />;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold tracking-widest text-blue-600 uppercase">
        Administrar publicación
      </p>
      <h1 className="mt-2 text-3xl font-black">
        Editar {vehicle.brand} {vehicle.model}
      </h1>
      <p className="mt-2 mb-8 text-slate-500">
        Actualiza la información y guarda los cambios.
      </p>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
