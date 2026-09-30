import type { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
  }
}

export async function requireUser(
  request: NextRequest,
): Promise<DecodedIdToken> {
  if (!adminAuth) {
    throw new ApiAuthError(
      "Firebase Admin no está configurado en el servidor",
      503,
    );
  }
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiAuthError("Debes iniciar sesión para realizar esta acción");
  }
  try {
    return await adminAuth.verifyIdToken(header.slice(7));
  } catch {
    throw new ApiAuthError("La sesión no es válida o ha expirado");
  }
}
