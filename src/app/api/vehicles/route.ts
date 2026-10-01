import { NextRequest, NextResponse } from "next/server";
import { ApiAuthError, requireUser } from "@/lib/auth/server";
import { demoVehicles } from "@/lib/demo-data";
import { adminDatabase } from "@/lib/firebase/admin";
import { vehicleSchema } from "@/lib/validations";
import { vehicleImagesBelongToUser } from "@/lib/vehicles/security";
import type { Vehicle } from "@/types/domain";

export async function GET() {
  if (!adminDatabase) {
    return NextResponse.json({ data: demoVehicles, demo: true });
  }
  try {
    const snapshot = await adminDatabase.ref("vehicles").get();
    const data = snapshot.val() as Record<string, Vehicle> | null;
    const vehicles = data ? Object.values(data) : [];
    return NextResponse.json({
      data: vehicles.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar el inventario" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!adminDatabase)
      throw new ApiAuthError("Firebase no está configurado", 503);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no contiene JSON válido" },
        { status: 400 },
      );
    }
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de publicación inválidos",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    if (!vehicleImagesBelongToUser(parsed.data.images, user.uid)) {
      return NextResponse.json(
        {
          error:
            "Todas las fotografías deben pertenecer a tu carpeta de Firebase Storage",
        },
        { status: 400 },
      );
    }
    const vehicleRef = adminDatabase.ref("vehicles").push();
    if (!vehicleRef.key)
      throw new Error("No fue posible generar el identificador");
    const now = new Date().toISOString();
    const vehicle: Vehicle = {
      ...parsed.data,
      id: vehicleRef.key,
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now,
    };
    await vehicleRef.set(vehicle);
    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "No fue posible crear la publicación" },
      { status: 500 },
    );
  }
}
