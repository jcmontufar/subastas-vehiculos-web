import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { placeBid } from "@/lib/auctions/server";
import type { AuctionRecord } from "@/types/domain";
import { makeVehicle } from "./fixtures";

const emulatorAvailable = Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST);

describe.skipIf(!emulatorAvailable)("concurrencia atómica de ofertas", () => {
  let app: App;
  let database: Database;
  const now = Date.parse("2030-01-01T13:00:00.000Z");

  beforeAll(() => {
    app = initializeApp(
      {
        projectId: "demo-autopujo",
        databaseURL: "https://demo-autopujo-default-rtdb.firebaseio.com",
      },
      "auction-concurrency-tests",
    );
    database = getDatabase(app);
  });

  beforeEach(async () => {
    await database.ref().set(null);
    await database.ref("vehicles/vehicle-1").set(
      makeVehicle({
        startAt: "2030-01-01T12:00:00.000Z",
        endAt: "2030-01-02T12:00:00.000Z",
      }),
    );
  });

  afterAll(async () => {
    await deleteApp(app);
  });

  it("acepta una sola ganadora entre dos primeras ofertas idénticas", async () => {
    const attempts = await Promise.allSettled([
      placeBid(database, {
        vehicleId: "vehicle-1",
        bidderId: "user-a",
        amountCents: 7_500_001,
        now,
      }),
      placeBid(database, {
        vehicleId: "vehicle-1",
        bidderId: "user-b",
        amountCents: 7_500_001,
        now,
      }),
    ]);
    expect(
      attempts.filter((attempt) => attempt.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      attempts.filter((attempt) => attempt.status === "rejected"),
    ).toHaveLength(1);

    const record = (
      await database.ref("auctions/vehicle-1").get()
    ).val() as AuctionRecord;
    expect(record.public.bidCount).toBe(1);
    expect(Object.keys(record.private?.bids ?? {})).toHaveLength(1);
    expect(
      Object.values(record.userStates ?? {}).filter((state) => state.isWinning),
    ).toHaveLength(1);
  });
});
