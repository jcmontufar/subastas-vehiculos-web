import type { Vehicle, VehicleFiltersValue } from "@/types/domain";

export function filterVehicles(
  vehicles: Vehicle[],
  filters: VehicleFiltersValue,
) {
  return vehicles.filter((vehicle) =>
    Object.entries(filters).every(
      ([key, value]) =>
        !value ||
        String(vehicle[key as keyof Vehicle]).toLowerCase() ===
          value.toLowerCase(),
    ),
  );
}
