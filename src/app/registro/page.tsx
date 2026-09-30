"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  auth,
  database,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import type { UserProfile } from "@/types/domain";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const submit = async (data: RegisterInput) => {
    if (!auth || !database)
      return toast.error(
        "Configura las variables de Firebase para registrarte.",
      );
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      await updateProfile(credential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });
      const profile: UserProfile = {
        uid: credential.user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        createdAt: new Date().toISOString(),
      };
      await set(ref(database, `users/${credential.user.uid}`), profile);
      toast.success("Tu cuenta fue creada");
      router.replace("/");
    } catch {
      toast.error("No fue posible crear la cuenta. Verifica los datos.");
    }
  };
  const fields: {
    name: keyof RegisterInput;
    label: string;
    type: string;
    autoComplete: string;
  }[] = [
    {
      name: "firstName",
      label: "Nombre",
      type: "text",
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      label: "Apellido",
      type: "text",
      autoComplete: "family-name",
    },
    {
      name: "email",
      label: "Correo electrónico",
      type: "email",
      autoComplete: "email",
    },
    { name: "phone", label: "Teléfono", type: "tel", autoComplete: "tel" },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword",
      label: "Confirmar contraseña",
      type: "password",
      autoComplete: "new-password",
    },
  ];
  return (
    <AuthShell
      title="Crea tu cuenta"
      description="Completa tus datos para comenzar."
    >
      {!isFirebaseClientConfigured && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Firebase aún no está configurado. Completa tu archivo{" "}
          <code>.env.local</code>.
        </p>
      )}
      <form
        onSubmit={handleSubmit(submit)}
        className="grid gap-4 sm:grid-cols-2"
      >
        {fields.map((field) => (
          <label
            key={field.name}
            className={`block text-sm font-semibold text-slate-700 ${field.name === "email" ? "sm:col-span-2" : ""}`}
          >
            {field.label}
            <input
              type={field.type}
              autoComplete={field.autoComplete}
              {...register(field.name)}
              className="form-input"
            />
            {errors[field.name]?.message && (
              <span className="mt-1 block text-xs text-red-600">
                {errors[field.name]?.message}
              </span>
            )}
          </label>
        ))}
        <button
          disabled={isSubmitting}
          className="mt-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 sm:col-span-2"
        >
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-blue-600">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
