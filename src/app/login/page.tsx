"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { auth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center text-slate-500">
          Cargando…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = async (data: LoginInput) => {
    if (!auth)
      return toast.error(
        "Configura las variables de Firebase para iniciar sesión.",
      );
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Sesión iniciada");
      router.replace(params.get("next") ?? "/");
    } catch {
      toast.error("Correo o contraseña incorrectos.");
    }
  };
  return (
    <AuthShell
      title="Bienvenido de nuevo"
      description="Ingresa para publicar y administrar tus vehículos."
    >
      {!isFirebaseClientConfigured && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Firebase aún no está configurado. Completa tu archivo{" "}
          <code>.env.local</code>.
        </p>
      )}
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <Field label="Correo electrónico" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="form-input"
          />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="form-input"
          />
        </Field>
        <button
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-bold text-blue-600">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
