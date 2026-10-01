import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const emulatorAvailable = Boolean(
  process.env.FIREBASE_DATABASE_EMULATOR_HOST &&
  process.env.FIREBASE_STORAGE_EMULATOR_HOST,
);

describe.skipIf(!emulatorAvailable)("reglas de Firebase en emuladores", () => {
  let environment: RulesTestEnvironment;

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: "demo-autopujo",
      database: {
        rules: await readFile("database.rules.json", "utf8"),
      },
      storage: {
        rules: await readFile("storage.rules", "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await environment.clearDatabase();
    await environment.clearStorage();
  });

  afterAll(async () => {
    await environment?.cleanup();
  });

  it("permite al usuario crear su perfil y niega escribir el de otro UID", async () => {
    const owner = environment.authenticatedContext("owner-1", {
      email: "owner@example.com",
    });
    const profile = {
      uid: "owner-1",
      firstName: "Usuario",
      lastName: "Prueba",
      email: "owner@example.com",
      phone: "55555555",
      createdAt: "2030-01-01T00:00:00.000Z",
    };
    await assertSucceeds(owner.database().ref("users/owner-1").set(profile));
    await assertFails(
      owner
        .database()
        .ref("users/other-user")
        .set({ ...profile, uid: "other-user" }),
    );
  });

  it("permite leer vehículos públicamente y bloquea escrituras del cliente", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await context
        .database()
        .ref("vehicles/test-vehicle")
        .set({ id: "test-vehicle" });
    });
    await assertSucceeds(
      environment
        .unauthenticatedContext()
        .database()
        .ref("vehicles/test-vehicle")
        .once("value"),
    );
    await assertFails(
      environment
        .authenticatedContext("owner-1")
        .database()
        .ref("vehicles/other-vehicle")
        .set({ id: "other-vehicle" }),
    );
  });

  it("permite subir y eliminar una imagen únicamente al propietario", async () => {
    const ownerStorage = environment.authenticatedContext("owner-1").storage();
    const otherStorage = environment
      .authenticatedContext("other-user")
      .storage();
    const path = "vehicles/owner-1/test/owner-image.jpg";
    await assertSucceeds(
      Promise.resolve(
        ownerStorage.ref(path).put(new Uint8Array([1, 2, 3]), {
          contentType: "image/jpeg",
        }),
      ),
    );
    await assertFails(otherStorage.ref(path).delete());
    await assertSucceeds(ownerStorage.ref(path).delete());
  });

  it("permite lectura pública y niega subidas anónimas", async () => {
    const ownerStorage = environment.authenticatedContext("owner-1").storage();
    const anonymousStorage = environment.unauthenticatedContext().storage();
    const path = "vehicles/owner-1/test/public-image.png";
    await ownerStorage.ref(path).put(new Uint8Array([1, 2, 3]), {
      contentType: "image/png",
    });
    await assertSucceeds(anonymousStorage.ref(path).getDownloadURL());
    await assertFails(
      Promise.resolve(
        anonymousStorage
          .ref("vehicles/anonymous/test.png")
          .put(new Uint8Array([1]), { contentType: "image/png" }),
      ),
    );
  });

  it("impide sobrescribir archivos existentes", async () => {
    const ownerStorage = environment.authenticatedContext("owner-1").storage();
    const imageRef = ownerStorage.ref("vehicles/owner-1/test/unique.jpg");
    await imageRef.put(new Uint8Array([1]), { contentType: "image/jpeg" });
    await assertFails(
      Promise.resolve(
        imageRef.put(new Uint8Array([2]), { contentType: "image/jpeg" }),
      ),
    );
  });

  it("rechaza archivos de 8 MiB o mayores y tipos no permitidos", async () => {
    const ownerStorage = environment.authenticatedContext("owner-1").storage();
    await assertFails(
      Promise.resolve(
        ownerStorage
          .ref("vehicles/owner-1/test/large.jpg")
          .put(new Uint8Array(8 * 1024 * 1024), {
            contentType: "image/jpeg",
          }),
      ),
    );
    await assertFails(
      Promise.resolve(
        ownerStorage
          .ref("vehicles/owner-1/test/not-image.txt")
          .put(new Uint8Array([1]), { contentType: "text/plain" }),
      ),
    );
    await assertFails(
      Promise.resolve(
        ownerStorage
          .ref("vehicles/owner-1/test/vector.svg")
          .put(new Uint8Array([1]), { contentType: "image/svg+xml" }),
      ),
    );
  });

  it("expone solamente el estado público y el estado del usuario autenticado", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await context
        .database()
        .ref("auctions/vehicle-1")
        .set({
          public: {
            vehicleId: "vehicle-1",
            currentBidCents: 2_200_000,
            bidCount: 1,
          },
          private: {
            leaderUid: "owner-1",
            bids: { "bid-1": { bidderId: "owner-1", amountCents: 2_200_000 } },
          },
          userStates: {
            "owner-1": { hasBid: true, isWinning: true },
            "other-user": { hasBid: true, isWinning: false },
          },
        });
    });
    const anonymous = environment.unauthenticatedContext().database();
    const owner = environment.authenticatedContext("owner-1").database();

    await assertSucceeds(
      anonymous.ref("auctions/vehicle-1/public").once("value"),
    );
    await assertFails(
      anonymous.ref("auctions/vehicle-1/private").once("value"),
    );
    await assertSucceeds(
      owner.ref("auctions/vehicle-1/userStates/owner-1").once("value"),
    );
    await assertFails(
      owner.ref("auctions/vehicle-1/userStates/other-user").once("value"),
    );
  });

  it("impide manipular directamente el estado, historial o pujas", async () => {
    const owner = environment.authenticatedContext("owner-1").database();
    await assertFails(
      owner.ref("auctions/vehicle-1/public/currentBidCents").set(9_999_999),
    );
    await assertFails(
      owner.ref("auctions/vehicle-1/private/bids/fake").set({
        bidderId: "owner-1",
        amountCents: 9_999_999,
      }),
    );
    await assertFails(
      owner.ref("auctions/vehicle-1/userStates/owner-1").set({
        hasBid: true,
        isWinning: true,
      }),
    );
  });

  it("entrega actualizaciones públicas mediante listeners en tiempo real", async () => {
    const publicRef = environment
      .unauthenticatedContext()
      .database()
      .ref("auctions/vehicle-1/public");
    const nextBid = new Promise<number>((resolve) => {
      const listener = publicRef.on("value", (snapshot) => {
        const value = snapshot.val() as { currentBidCents?: number } | null;
        if (value?.currentBidCents === 2_420_000) {
          publicRef.off("value", listener);
          resolve(value.currentBidCents);
        }
      });
    });
    await environment.withSecurityRulesDisabled(async (context) => {
      await context.database().ref("auctions/vehicle-1/public").set({
        vehicleId: "vehicle-1",
        currentBidCents: 2_420_000,
        bidCount: 2,
      });
    });
    await expect(nextBid).resolves.toBe(2_420_000);
  });
});
