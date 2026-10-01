import type { VehicleInput } from "@/lib/validations";
import type { Vehicle, VehicleImage } from "@/types/domain";

export function makeImages(
  userId = "owner-1",
  bucket = "test-bucket.appspot.com",
): VehicleImage[] {
  return Array.from({ length: 5 }, (_, order) => {
    const storagePath = `vehicles/${userId}/test/image-${order}.jpg`;
    return {
      id: `image-${order}`,
      storagePath,
      order,
      url: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=test`,
    };
  });
}

export function makeVehicleInput(userId = "owner-1"): VehicleInput {
  return {
    year: 2024,
    itemType: "SUV",
    brand: "Marca FIX-02",
    model: "Modelo Integración",
    engine: "2.0L",
    transmission: "Automática",
    fuelType: "Gasolina",
    drivetrain: "AWD",
    cylinders: 4,
    damageLevel: "GREEN",
    images: makeImages(userId),
    basePrice: 75000,
    startAt: "2030-01-01T12:00:00.000Z",
    endAt: "2030-01-02T12:00:00.000Z",
  };
}

export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    ...makeVehicleInput("owner-1"),
    id: "vehicle-1",
    ownerId: "owner-1",
    createdAt: "2029-12-01T12:00:00.000Z",
    updatedAt: "2029-12-01T12:00:00.000Z",
    ...overrides,
  };
}
