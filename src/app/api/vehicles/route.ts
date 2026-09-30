import { NextRequest, NextResponse } from "next/server";
import { ApiAuthError, requireUser } from "@/lib/auth/server";
import { demoVehicles } from "@/lib/demo-data";
import { adminDatabase } from "@/lib/firebase/admin";
import { vehicleSchema } from "@/lib/validations";
import type { Vehicle } from "@/types/domain";

export async function GET() {
  if (!adminDatabase) {
    return NextResponse.json({ data: demoVehicles, demo: true });
  }
  const snapshot = await adminDatabase.ref("vehicles").get();
  const data = snapshot.val() as Record<string, Vehicle> | null;
  const vehicles = data ? Object.values(data) : [];
  return NextResponse.json({
    data: vehicles.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!adminDatabase)
      throw new ApiAuthError("Firebase no está configurado", 503);
    const parsed = vehicleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de publicación inválidos",
          issues: parsed.error.flatten(),
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
