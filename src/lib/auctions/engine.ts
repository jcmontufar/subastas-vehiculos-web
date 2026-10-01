import { getAuctionStatus } from "@/lib/auction";
import { getMinimumNextBidCents, numberToCents } from "@/lib/auctions/money";
import type {
  AuctionRecord,
  AuctionStatus,
  PublicAuctionState,
  Vehicle,
} from "@/types/domain";

export type BidRejectionCode =
  "AUCTION_NOT_STARTED" | "AUCTION_ENDED" | "BID_TOO_LOW";

export type BidDecision =
  | {
      accepted: true;
      record: AuctionRecord;
    }
  | {
      accepted: false;
      code: BidRejectionCode;
      record: AuctionRecord;
    };

const iso = (now: number) => new Date(now).toISOString();

export function createAuctionRecord(
  vehicle: Vehicle,
  now: number,
): AuctionRecord {
  const basePriceCents = numberToCents(vehicle.basePrice);
  const publicState: PublicAuctionState = {
    vehicleId: vehicle.id,
    basePriceCents,
    currentBidCents: null,
    minimumNextBidCents: getMinimumNextBidCents(basePriceCents, null),
    bidCount: 0,
    startAt: vehicle.startAt,
    endAt: vehicle.endAt,
    status: getAuctionStatus({ ...vehicle, bidCount: 0 }, now),
    updatedAt: iso(now),
  };
  return { public: publicState, private: { bids: {} }, userStates: {} };
}

export function normalizeAuctionRecord(
  record: AuctionRecord | null | undefined,
  vehicle: Vehicle,
  now: number,
) {
  const current = record ?? createAuctionRecord(vehicle, now);
  const hasBids = current.public.bidCount > 0;
  const publicState: PublicAuctionState = {
    ...current.public,
    vehicleId: vehicle.id,
    basePriceCents: hasBids
      ? current.public.basePriceCents
      : numberToCents(vehicle.basePrice),
    startAt: hasBids ? current.public.startAt : vehicle.startAt,
    endAt: hasBids ? current.public.endAt : vehicle.endAt,
  };
  const status = getAuctionStatus(publicState, now);
  const minimumNextBidCents = getMinimumNextBidCents(
    publicState.basePriceCents,
    publicState.currentBidCents,
  );

  if (
    status === current.public.status &&
    minimumNextBidCents === current.public.minimumNextBidCents &&
    publicState.basePriceCents === current.public.basePriceCents &&
    publicState.startAt === current.public.startAt &&
    publicState.endAt === current.public.endAt
  ) {
    return current;
  }

  return {
    ...current,
    public: {
      ...publicState,
      status,
      minimumNextBidCents,
      updatedAt: iso(now),
    },
  };
}

export function applyBid(
  existing: AuctionRecord | null | undefined,
  vehicle: Vehicle,
  input: {
    bidderId: string;
    amountCents: number;
    bidId: string;
    now: number;
  },
): BidDecision {
  const record = normalizeAuctionRecord(existing, vehicle, input.now);
  const status: AuctionStatus = getAuctionStatus(record.public, input.now);

  if (status === "UPCOMING") {
    return { accepted: false, code: "AUCTION_NOT_STARTED", record };
  }
  if (status === "SOLD" || status === "UNSOLD") {
    return { accepted: false, code: "AUCTION_ENDED", record };
  }
  if (input.amountCents < record.public.minimumNextBidCents) {
    return { accepted: false, code: "BID_TOO_LOW", record };
  }

  const updatedAt = iso(input.now);
  const previousLeader = record.private?.leaderUid;
  const userStates = { ...(record.userStates ?? {}) };
  if (previousLeader && previousLeader !== input.bidderId) {
    userStates[previousLeader] = {
      ...userStates[previousLeader],
      hasBid: true,
      isWinning: false,
      lastBidCents:
        userStates[previousLeader]?.lastBidCents ??
        record.public.currentBidCents ??
        0,
      updatedAt,
    };
  }
  userStates[input.bidderId] = {
    hasBid: true,
    isWinning: true,
    lastBidCents: input.amountCents,
    updatedAt,
  };

  const next: AuctionRecord = {
    public: {
      ...record.public,
      currentBidCents: input.amountCents,
      minimumNextBidCents: getMinimumNextBidCents(
        record.public.basePriceCents,
        input.amountCents,
      ),
      bidCount: record.public.bidCount + 1,
      status: "LIVE",
      updatedAt,
    },
    private: {
      ...(record.private ?? {}),
      leaderUid: input.bidderId,
      bids: {
        ...(record.private?.bids ?? {}),
        [input.bidId]: {
          id: input.bidId,
          vehicleId: vehicle.id,
          bidderId: input.bidderId,
          amountCents: input.amountCents,
          createdAt: updatedAt,
        },
      },
    },
    userStates,
  };
  return { accepted: true, record: next };
}
