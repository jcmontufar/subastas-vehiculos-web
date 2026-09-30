import { AlertCircle, CarFront, LoaderCircle } from "lucide-react";

export function LoadingState({ message = "Cargando…" }: { message?: string }) {
  return (
    <div className="grid min-h-56 place-items-center text-center text-slate-500">
      <div>
        <LoaderCircle className="mx-auto mb-3 size-8 animate-spin text-blue-600" />
        <p>{message}</p>
      </div>
    </div>
  );
}
export function EmptyState({
  title = "No hay resultados",
  description = "Prueba con otros filtros.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
      <div>
        <CarFront className="mx-auto mb-3 size-10 text-slate-300" />
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
      <AlertCircle />
      <p>{message}</p>
    </div>
  );
}
