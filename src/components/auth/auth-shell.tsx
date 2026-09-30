import { CarFront, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2">
      <section className="hidden rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-10 text-white lg:block">
        <CarFront className="size-14" />
        <h1 className="mt-20 text-4xl font-black">
          Tu próxima oportunidad comienza aquí.
        </h1>
        <p className="mt-4 text-lg leading-8 text-blue-50">
          Publica vehículos y accede a subastas con una cuenta segura.
        </p>
        <div className="mt-16 flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <ShieldCheck />
          <span className="font-semibold">
            Autenticación protegida con Firebase
          </span>
        </div>
      </section>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-bold text-blue-600"
        >
          <CarFront /> AutoPujo
        </Link>
        <h2 className="text-3xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-slate-500">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </div>
  );
}
