import { NextRequest, NextResponse } from "next/server";
import { parseMoneyToCents } from "@/lib/auctions/money";
import { AuctionServiceError, placeBid } from "@/lib/auctions/server";
import { ApiAuthError, requireUser } from "@/lib/auth/server";
import { adminDatabase } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ vehicleId: string }>;
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await requireUser(request);
    if (!adminDatabase) {
      throw new AuctionServiceError(
        "Firebase no está configurado",
        503,
        "FIREBASE_NOT_CONFIGURED",
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
    const amountCents = parseMoneyToCents(
      typeof body === "object" && body !== null && "amount" in body
        ? body.amount
        : null,
    );
    if (amountCents === null) {
      return NextResponse.json(
        {
          error: "Ingresa un importe positivo con un máximo de dos decimales",
          code: "INVALID_BID_AMOUNT",
        },
        { status: 400 },
      );
    }

    const { vehicleId } = await params;
    const result = await placeBid(adminDatabase, {
      vehicleId,
      bidderId: user.uid,
      amountCents,
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof AuctionServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...error.details,
        },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "No fue posible registrar la oferta" },
      { status: 500 },
    );
  }
}
