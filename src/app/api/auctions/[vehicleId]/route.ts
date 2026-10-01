import { NextRequest, NextResponse } from "next/server";
import { createAuctionRecord } from "@/lib/auctions/engine";
import { AuctionServiceError, getAuction } from "@/lib/auctions/server";
import { demoVehicles } from "@/lib/demo-data";
import { adminDatabase } from "@/lib/firebase/admin";

interface Context {
  params: Promise<{ vehicleId: string }>;
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { vehicleId } = await params;
    if (!adminDatabase) {
      const vehicle = demoVehicles.find((item) => item.id === vehicleId);
      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehículo no encontrado" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        data: createAuctionRecord(vehicle, Date.now()).public,
        serverNow: Date.now(),
        demo: true,
      });
    }
    const result = await getAuction(adminDatabase, vehicleId);
    return NextResponse.json({
      data: result.public,
      serverNow: result.serverNow,
    });
  } catch (error) {
    if (error instanceof AuctionServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "No fue posible consultar la subasta" },
      { status: 503 },
    );
  }
}
