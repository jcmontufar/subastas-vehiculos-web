import { NextRequest, NextResponse } from "next/server";
import { ApiAuthError, requireUser } from "@/lib/auth/server";
import { demoVehicles } from "@/lib/demo-data";
import { adminDatabase } from "@/lib/firebase/admin";
import { vehicleSchema } from "@/lib/validations";
import { vehicleImagesBelongToUser } from "@/lib/vehicles/security";
import type { Vehicle } from "@/types/domain";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!adminDatabase) {
    const vehicle = demoVehicles.find((item) => item.id === id);
    return vehicle
      ? NextResponse.json({ data: vehicle, demo: true })
      : NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }
  try {
    const snapshot = await adminDatabase.ref(`vehicles/${id}`).get();
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: snapshot.val() as Vehicle });
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar el vehículo" },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await requireUser(request);
    if (!adminDatabase)
      throw new ApiAuthError("Firebase no está configurado", 503);
    const { id } = await params;
    const vehicleRef = adminDatabase.ref(`vehicles/${id}`);
    const snapshot = await vehicleRef.get();
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 },
      );
    }
    const current = snapshot.val() as Vehicle;
    if (current.ownerId !== user.uid) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta publicación" },
        { status: 403 },
      );
    }
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
    const updated: Vehicle = {
      ...current,
      ...parsed.data,
      id,
      ownerId: current.ownerId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await vehicleRef.set(updated);
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "No fue posible actualizar la publicación" },
      { status: 500 },
    );
  }
}
