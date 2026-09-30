"use client";

import { CarFront, LogOut, Menu, Plus, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-slate-900"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
            <CarFront className="size-6" />
          </span>
          Auto<span className="text-blue-600">Pujo</span>
        </Link>
        <button
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-slate-600 md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          className={`${open ? "flex" : "hidden"} absolute top-18 right-0 left-0 flex-col gap-2 border-b bg-white p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}
        >
          <Link
            href="/"
            onClick={close}
            className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600"
          >
            Inventario
          </Link>
          {!loading && user ? (
            <>
              <Link
                href="/mis-publicaciones"
                onClick={close}
                className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              >
                Mis publicaciones
              </Link>
              <Link
                href="/publicar"
                onClick={close}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="size-4" /> Publicar
              </Link>
              <button
                onClick={() => void logout()}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="size-4" /> Salir
              </button>
            </>
          ) : (
            !loading && (
              <Link
                href="/login"
                onClick={close}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                <UserRound className="size-4" /> Iniciar sesión
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
