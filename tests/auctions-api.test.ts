import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  placeBid: vi.fn(),
  getAuction: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => {
  class ApiAuthError extends Error {
    constructor(
      message: string,
      public status = 401,
    ) {
      super(message);
    }
  }
  return { ApiAuthError, requireUser: mocks.requireUser };
});

vi.mock("@/lib/firebase/admin", () => ({
  adminDatabase: { ref: vi.fn() },
}));

vi.mock("@/lib/auctions/server", () => {
  class AuctionServiceError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string,
      public details?: Record<string, unknown>,
    ) {
      super(message);
    }
  }
  return {
    AuctionServiceError,
    getAuction: mocks.getAuction,
    placeBid: mocks.placeBid,
  };
});

import { GET } from "@/app/api/auctions/[vehicleId]/route";
import { POST } from "@/app/api/auctions/[vehicleId]/bids/route";
import { ApiAuthError } from "@/lib/auth/server";

const context = { params: Promise.resolve({ vehicleId: "vehicle-1" }) };
const bidRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/auctions/vehicle-1/bids", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("API de subastas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite consultar el estado público sin autenticación", async () => {
    mocks.getAuction.mockResolvedValue({
      public: { vehicleId: "vehicle-1", bidCount: 0 },
      serverNow: 1_000,
    });
    const response = await GET(
      new NextRequest("http://localhost/api/auctions/vehicle-1"),
      context,
    );
    expect(response.status).toBe(200);
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rechaza usuarios anónimos", async () => {
    mocks.requireUser.mockRejectedValue(
      new ApiAuthError("Debes iniciar sesión para realizar esta acción", 401),
    );
    const response = await POST(bidRequest({ amount: "75000.01" }), context);
    expect(response.status).toBe(401);
    expect(mocks.placeBid).not.toHaveBeenCalled();
  });

  it("usa exclusivamente el UID verificado por Firebase", async () => {
    mocks.requireUser.mockResolvedValue({ uid: "verified-user" });
    mocks.placeBid.mockResolvedValue({
      bidId: "bid-1",
      auction: { vehicleId: "vehicle-1" },
      userState: { isWinning: true },
      serverNow: 1_000,
    });
    const response = await POST(
      bidRequest({ amount: "75000.01", bidderId: "attacker-selected-id" }),
      context,
    );
    expect(response.status).toBe(201);
    expect(mocks.placeBid).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        vehicleId: "vehicle-1",
        bidderId: "verified-user",
        amountCents: 7_500_001,
      }),
    );
  });

  it("rechaza importes con más de dos decimales", async () => {
    mocks.requireUser.mockResolvedValue({ uid: "verified-user" });
    const response = await POST(bidRequest({ amount: "75000.001" }), context);
    expect(response.status).toBe(400);
    expect(mocks.placeBid).not.toHaveBeenCalled();
  });
});
