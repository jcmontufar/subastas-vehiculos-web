import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeVehicle, makeVehicleInput } from "./fixtures";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  databaseRef: vi.fn(),
  imagesBelongToUser: vi.fn(() => true),
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
  adminDatabase: { ref: mocks.databaseRef },
}));

vi.mock("@/lib/vehicles/security", () => ({
  vehicleImagesBelongToUser: mocks.imagesBelongToUser,
}));

import { ApiAuthError } from "@/lib/auth/server";
import { GET as GET_ALL, POST } from "@/app/api/vehicles/route";
import { GET as GET_ONE, PUT } from "@/app/api/vehicles/[id]/route";

const request = (method: "POST" | "PUT", body: unknown) =>
  new NextRequest("http://localhost/api/vehicles", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer token-de-prueba",
    },
    body: JSON.stringify(body),
  });

describe("API REST de vehículos", () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.databaseRef.mockReset();
    mocks.imagesBelongToUser.mockReset();
    mocks.imagesBelongToUser.mockReturnValue(true);
  });

  it("exige autenticación para publicar", async () => {
    mocks.requireUser.mockRejectedValue(
      new ApiAuthError("Debes iniciar sesión para realizar esta acción", 401),
    );
    const response = await POST(request("POST", makeVehicleInput()));
    expect(response.status).toBe(401);
  });

  it("permite consultar la colección y el detalle sin autenticación", async () => {
    const vehicle = makeVehicle();
    mocks.databaseRef.mockImplementation((path: string) => {
      if (path === "vehicles") {
        return {
          get: async () => ({ val: () => ({ [vehicle.id]: vehicle }) }),
        };
      }
      return {
        get: async () => ({
          exists: () => true,
          val: () => vehicle,
        }),
      };
    });

    const collectionResponse = await GET_ALL();
    const detailResponse = await GET_ONE(
      new NextRequest(`http://localhost/api/vehicles/${vehicle.id}`),
      { params: Promise.resolve({ id: vehicle.id }) },
    );

    expect(collectionResponse.status).toBe(200);
    expect(detailResponse.status).toBe(200);
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("devuelve 503 cuando Firebase no puede consultar un detalle", async () => {
    mocks.databaseRef.mockReturnValue({
      get: async () => {
        throw new Error("Firebase no disponible");
      },
    });

    const response = await GET_ONE(
      new NextRequest("http://localhost/api/vehicles/vehicle-1"),
      { params: Promise.resolve({ id: "vehicle-1" }) },
    );

    expect(response.status).toBe(503);
  });

  it("persiste un vehículo con el propietario autenticado", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    mocks.requireUser.mockResolvedValue({ uid: "owner-1" });
    mocks.databaseRef.mockReturnValue({
      push: () => ({ key: "vehicle-created", set }),
    });

    const response = await POST(
      request("POST", {
        ...makeVehicleInput("owner-1"),
        ownerId: "usuario-inyectado",
      }),
    );
    const body = (await response.json()) as { data: { ownerId: string } };

    expect(response.status).toBe(201);
    expect(body.data.ownerId).toBe("owner-1");
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "vehicle-created",
        ownerId: "owner-1",
        brand: "Marca FIX-02",
      }),
    );
  });

  it("rechaza fotografías que no pertenecen al usuario", async () => {
    mocks.requireUser.mockResolvedValue({ uid: "owner-1" });
    mocks.imagesBelongToUser.mockReturnValue(false);
    const response = await POST(request("POST", makeVehicleInput("owner-1")));
    expect(response.status).toBe(400);
    expect(mocks.databaseRef).not.toHaveBeenCalled();
  });

  it("impide que otro usuario edite la publicación", async () => {
    mocks.requireUser.mockResolvedValue({ uid: "other-user" });
    mocks.databaseRef.mockReturnValue({
      get: async () => ({ exists: () => true, val: () => makeVehicle() }),
    });

    const response = await PUT(request("PUT", makeVehicleInput()), {
      params: Promise.resolve({ id: "vehicle-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("conserva ownerId, id y createdAt durante la edición", async () => {
    const original = makeVehicle();
    const set = vi.fn().mockResolvedValue(undefined);
    mocks.requireUser.mockResolvedValue({ uid: "owner-1" });
    mocks.databaseRef.mockReturnValue({
      get: async () => ({ exists: () => true, val: () => original }),
      set,
    });

    const response = await PUT(
      request("PUT", {
        ...makeVehicleInput("owner-1"),
        brand: "Marca editada",
        ownerId: "usuario-inyectado",
        id: "id-inyectado",
        createdAt: "2000-01-01T00:00:00.000Z",
      }),
      { params: Promise.resolve({ id: original.id }) },
    );

    expect(response.status).toBe(200);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        id: original.id,
        ownerId: original.ownerId,
        createdAt: original.createdAt,
        brand: "Marca editada",
      }),
    );
  });

  it("protege precio y fechas después de la primera oferta", async () => {
    const original = makeVehicle();
    mocks.requireUser.mockResolvedValue({ uid: "owner-1" });
    mocks.databaseRef.mockImplementation((path: string) => {
      if (path === `vehicles/${original.id}`) {
        return {
          get: async () => ({ exists: () => true, val: () => original }),
          set: vi.fn(),
        };
      }
      return {
        get: async () => ({
          exists: () => true,
          val: () => ({
            bidCount: 1,
            basePriceCents: original.basePrice * 100,
            startAt: original.startAt,
            endAt: original.endAt,
          }),
        }),
      };
    });

    const response = await PUT(
      request("PUT", {
        ...makeVehicleInput("owner-1"),
        basePrice: original.basePrice + 1,
      }),
      { params: Promise.resolve({ id: original.id }) },
    );

    expect(response.status).toBe(409);
  });

  it("devuelve 400 para datos inválidos", async () => {
    mocks.requireUser.mockResolvedValue({ uid: "owner-1" });
    const response = await POST(
      request("POST", { ...makeVehicleInput(), basePrice: 0 }),
    );
    expect(response.status).toBe(400);
    expect(mocks.databaseRef).not.toHaveBeenCalled();
  });
});
