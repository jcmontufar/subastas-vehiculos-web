import type { Database } from "firebase-admin/database";
import { applyBid, normalizeAuctionRecord } from "@/lib/auctions/engine";
import type {
  AuctionRecord,
  AuctionUserState,
  PublicAuctionState,
  Vehicle,
} from "@/types/domain";

export class AuctionServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function getFirebaseServerTime(database: Database) {
  try {
    const snapshot = await database.ref(".info/serverTimeOffset").get();
    const offset = Number(snapshot.val() ?? 0);
    return Date.now() + (Number.isFinite(offset) ? offset : 0);
  } catch {
    return Date.now();
  }
}

async function getVehicle(database: Database, vehicleId: string) {
  const snapshot = await database.ref(`vehicles/${vehicleId}`).get();
  if (!snapshot.exists()) {
    throw new AuctionServiceError(
      "Vehículo no encontrado",
      404,
      "VEHICLE_NOT_FOUND",
    );
  }
  return snapshot.val() as Vehicle;
}

export async function getAuction(
  database: Database,
  vehicleId: string,
  now = getFirebaseServerTime(database),
) {
  const [vehicle, serverNow] = await Promise.all([
    getVehicle(database, vehicleId),
    now,
  ]);
  const auctionRef = database.ref(`auctions/${vehicleId}`);
  const result = await auctionRef.transaction(
    (current: AuctionRecord | null) =>
      normalizeAuctionRecord(current, vehicle, serverNow),
    undefined,
    false,
  );
  const record = result.snapshot.val() as AuctionRecord;
  return { public: record.public, serverNow };
}

export async function placeBid(
  database: Database,
  input: {
    vehicleId: string;
    bidderId: string;
    amountCents: number;
    now?: number | Promise<number>;
  },
) {
  const [vehicle, serverNow] = await Promise.all([
    getVehicle(database, input.vehicleId),
    input.now ?? getFirebaseServerTime(database),
  ]);
  const auctionRef = database.ref(`auctions/${input.vehicleId}`);
  const bidId = auctionRef.child("private/bids").push().key;
  if (!bidId) {
    throw new AuctionServiceError(
      "No fue posible generar el identificador de la oferta",
      500,
      "BID_ID_ERROR",
    );
  }

  let decision: ReturnType<typeof applyBid> | undefined;
  const result = await auctionRef.transaction(
    (current: AuctionRecord | null) => {
      decision = applyBid(current, vehicle, {
        bidderId: input.bidderId,
        amountCents: input.amountCents,
        bidId,
        now: serverNow,
      });
      if (decision.accepted || decision.code === "AUCTION_ENDED") {
        return decision.record;
      }
      return;
    },
    undefined,
    false,
  );

  if (!decision) {
    throw new AuctionServiceError(
      "No fue posible procesar la oferta",
      500,
      "BID_TRANSACTION_ERROR",
    );
  }
  if (!decision.accepted) {
    const messages = {
      AUCTION_NOT_STARTED: "La subasta todavía no ha comenzado",
      AUCTION_ENDED: "La subasta ya finalizó",
      BID_TOO_LOW: "La oferta no alcanza el mínimo requerido",
    } as const;
    throw new AuctionServiceError(messages[decision.code], 409, decision.code, {
      auction: decision.record.public,
      minimumNextBidCents: decision.record.public.minimumNextBidCents,
    });
  }
  if (!result.committed) {
    throw new AuctionServiceError(
      "La oferta entró en conflicto con otra oferta. Intenta nuevamente.",
      409,
      "BID_CONFLICT",
    );
  }

  const record = result.snapshot.val() as AuctionRecord;
  return {
    bidId,
    auction: record.public as PublicAuctionState,
    userState: record.userStates?.[input.bidderId] as AuctionUserState,
    serverNow,
  };
}
