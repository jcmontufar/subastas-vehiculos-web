import { ProtectedPage } from "@/components/auth/protected-page";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export default function PublishPage() {
  return (
    <ProtectedPage>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-bold tracking-widest text-blue-600 uppercase">
          Nueva publicación
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
          Publica tu vehículo
        </h1>
        <p className="mt-3 mb-8 max-w-2xl text-slate-500">
          Completa la ficha técnica y agrega fotografías claras. Todos los
          campos son obligatorios.
        </p>
        <VehicleForm />
      </div>
    </ProtectedPage>
  );
}
