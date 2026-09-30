import { CarFront, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <CarFront className="size-5 text-blue-600" /> AutoPujo
        </div>
        <p>Plataforma académica de subastas de vehículos.</p>
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-4" /> Operación protegida con Firebase
        </span>
      </div>
    </footer>
  );
}
