import { describe, expect, it } from "vitest";
import { applyBid, createAuctionRecord } from "@/lib/auctions/engine";
import {
  getMinimumNextBidCents,
  parseMoneyToCents,
} from "@/lib/auctions/money";
import { makeVehicle } from "./fixtures";

const start = Date.parse("2030-01-01T12:00:00.000Z");
const end = Date.parse("2030-01-02T12:00:00.000Z");
const liveNow = Date.parse("2030-01-01T13:00:00.000Z");
const vehicle = makeVehicle({
  startAt: new Date(start).toISOString(),
  endAt: new Date(end).toISOString(),
});
const baseCents = vehicle.basePrice * 100;

function bid(
  record: ReturnType<typeof createAuctionRecord> | undefined,
  bidderId: string,
  amountCents: number,
  now = liveNow,
) {
  return applyBid(record, vehicle, {
    bidderId,
    amountCents,
    bidId: `bid-${bidderId}-${amountCents}`,
    now,
  });
}

describe("motor atómico de subastas", () => {
  it("acepta una primera oferta estrictamente superior al precio base", () => {
    const result = bid(undefined, "user-a", baseCents + 1);
    expect(result.accepted).toBe(true);
    expect(result.record.public.currentBidCents).toBe(baseCents + 1);
    expect(result.record.public.bidCount).toBe(1);
  });

  it("rechaza una primera oferta igual al precio base", () => {
    const result = bid(undefined, "user-a", baseCents);
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.code).toBe("BID_TOO_LOW");
  });

  it("acepta exactamente el incremento mínimo del 10 %", () => {
    const first = bid(undefined, "user-a", baseCents + 1);
    const minimum = first.record.public.minimumNextBidCents;
    const second = bid(first.record, "user-b", minimum);
    expect(second.accepted).toBe(true);
    expect(second.record.public.currentBidCents).toBe(minimum);
  });

  it("rechaza un incremento inferior al 10 % redondeado a centavos", () => {
    const first = bid(undefined, "user-a", baseCents + 1);
    const minimum = first.record.public.minimumNextBidCents;
    const second = bid(first.record, "user-b", minimum - 1);
    expect(second.accepted).toBe(false);
    if (!second.accepted) expect(second.code).toBe("BID_TOO_LOW");
  });

  it("rechaza ofertas antes del inicio", () => {
    const result = bid(undefined, "user-a", baseCents + 1, start - 1);
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.code).toBe("AUCTION_NOT_STARTED");
  });

  it("declara desierta una subasta terminada sin ofertas", () => {
    const result = bid(undefined, "user-a", baseCents + 1, end);
    expect(result.accepted).toBe(false);
    expect(result.record.public.status).toBe("UNSOLD");
  });

  it("declara vendida una subasta terminada con una oferta válida", () => {
    const first = bid(undefined, "user-a", baseCents + 1);
    const result = bid(
      first.record,
      "user-b",
      first.record.public.minimumNextBidCents,
      end,
    );
    expect(result.accepted).toBe(false);
    expect(result.record.public.status).toBe("SOLD");
  });

  it("marca al líder anterior como superado sin publicar su identidad", () => {
    const first = bid(undefined, "user-a", baseCents + 1);
    const second = bid(
      first.record,
      "user-b",
      first.record.public.minimumNextBidCents,
    );
    expect(second.record.userStates?.["user-a"]?.isWinning).toBe(false);
    expect(second.record.userStates?.["user-b"]?.isWinning).toBe(true);
    expect(second.record.public).not.toHaveProperty("leaderUid");
  });
});

describe("representación monetaria", () => {
  it("acepta como máximo dos decimales", () => {
    expect(parseMoneyToCents("20000")).toBe(2_000_000);
    expect(parseMoneyToCents("20000.01")).toBe(2_000_001);
    expect(parseMoneyToCents("20000.001")).toBeNull();
    expect(parseMoneyToCents(20000.01)).toBeNull();
  });

  it("calcula el incremento sin errores de punto flotante", () => {
    expect(getMinimumNextBidCents(2_000_000, 2_200_000)).toBe(2_420_000);
    expect(getMinimumNextBidCents(100, 101)).toBe(112);
  });
});
