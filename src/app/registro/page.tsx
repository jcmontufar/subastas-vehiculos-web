"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  setPersistence,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  auth,
  database,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { getFirebaseErrorDetails } from "@/lib/firebase/errors";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import type { UserProfile } from "@/types/domain";

export default function RegisterPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<{
    message: string;
    code: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const submit = async (data: RegisterInput) => {
    setSubmitError(null);
    if (!auth || !database) {
      const configurationError = {
        code: "firebase/missing-configuration",
        message:
          "Faltan variables de Firebase. Revisa la configuración local antes de registrarte.",
      };
      setSubmitError(configurationError);
      return toast.error(
        "Configura las variables de Firebase para registrarte.",
      );
    }

    let credential: UserCredential | null = null;
    let profileStage = false;
    try {
      await setPersistence(auth, browserLocalPersistence);
      credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      profileStage = true;
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
    } catch (error: unknown) {
      const details = getFirebaseErrorDetails(
        error,
        profileStage
          ? "Firebase creó la cuenta, pero no fue posible guardar el perfil. Inténtalo nuevamente."
          : "No fue posible crear la cuenta. Revisa la configuración de Firebase e inténtalo nuevamente.",
      );

      if (credential && profileStage) {
        try {
          await deleteUser(credential.user);
        } catch (rollbackError: unknown) {
          const rollbackDetails = getFirebaseErrorDetails(rollbackError);
          console.error("No fue posible revertir el usuario incompleto", {
            code: rollbackDetails.code,
          });
        }
      }

      console.error("Error de registro en Firebase", { code: details.code });
      setSubmitError(details);
      toast.error(details.message);
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
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:col-span-2"
          >
            <p className="font-semibold">{submitError.message}</p>
            <p className="mt-1 text-xs text-red-600">
              Código de diagnóstico: {submitError.code}
            </p>
          </div>
        )}
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
