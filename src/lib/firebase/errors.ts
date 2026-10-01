import { FirebaseError } from "firebase/app";

export interface FirebaseErrorDetails {
  code: string;
  message: string;
}

const firebaseErrorMessages: Record<string, string> = {
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "La clave API de Firebase no es válida. Copia nuevamente la configuración de la aplicación web desde Firebase Console.",
  "auth/invalid-api-key":
    "La clave API de Firebase no es válida. Copia nuevamente la configuración de la aplicación web desde Firebase Console.",
  "auth/app-not-authorized":
    "Esta aplicación no está autorizada para usar Firebase Authentication. Revisa las restricciones de la clave API y los dominios autorizados.",
  "auth/configuration-not-found":
    "Firebase Authentication no está configurado para este proyecto. Habilita el proveedor Correo electrónico/contraseña.",
  "auth/operation-not-allowed":
    "El registro con correo y contraseña no está habilitado en Firebase Authentication.",
  "auth/unauthorized-domain":
    "Este dominio no está autorizado en Firebase Authentication. Agrega el dominio actual en la configuración de Authentication.",
  "auth/email-already-in-use":
    "Ya existe una cuenta con este correo electrónico. Inicia sesión o utiliza otro correo.",
  "auth/invalid-email": "El correo electrónico no tiene un formato válido.",
  "auth/weak-password":
    "La contraseña no cumple la política de seguridad configurada en Firebase.",
  "auth/password-does-not-meet-requirements":
    "La contraseña no cumple los requisitos configurados en Firebase Authentication.",
  "auth/network-request-failed":
    "No fue posible comunicarse con Firebase. Verifica tu conexión e inténtalo de nuevo.",
  "auth/too-many-requests":
    "Firebase bloqueó temporalmente los intentos por exceso de solicitudes. Espera unos minutos e inténtalo nuevamente.",
  "auth/internal-error":
    "Firebase Authentication encontró un error interno. Inténtalo nuevamente.",
  "database/permission-denied":
    "La cuenta se creó, pero las reglas de Realtime Database rechazaron el perfil.",
  "database/network-error":
    "La cuenta se creó, pero no fue posible guardar el perfil por un problema de red.",
};

export function getFirebaseErrorDetails(
  error: unknown,
  fallback = "No fue posible completar la operación con Firebase.",
): FirebaseErrorDetails {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      message: firebaseErrorMessages[error.code] ?? fallback,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return {
      code: error.code,
      message: firebaseErrorMessages[error.code] ?? fallback,
    };
  }

  return { code: "firebase/unknown", message: fallback };
}
