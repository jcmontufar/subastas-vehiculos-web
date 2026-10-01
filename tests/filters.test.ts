import { describe, expect, it } from "vitest";
import { emptyFilters } from "@/components/auction/vehicle-filters";
import { filterVehicles } from "@/lib/vehicles/filters";
import { makeVehicle } from "./fixtures";

describe("filtros combinables del inventario", () => {
  const vehicles = [
    makeVehicle(),
    makeVehicle({
      id: "vehicle-2",
      year: 2022,
      brand: "Toyota",
      model: "Corolla",
      fuelType: "Híbrido",
      transmission: "CVT",
      drivetrain: "FWD",
      damageLevel: "YELLOW",
    }),
  ];

  it("devuelve todos los vehículos sin filtros", () => {
    expect(filterVehicles(vehicles, emptyFilters)).toHaveLength(2);
  });

  it("combina año, marca, combustible y nivel de daño", () => {
    const result = filterVehicles(vehicles, {
      ...emptyFilters,
      year: "2022",
      brand: "Toyota",
      fuelType: "Híbrido",
      damageLevel: "YELLOW",
    });
    expect(result.map((vehicle) => vehicle.id)).toEqual(["vehicle-2"]);
  });

  it("combina modelo, transmisión y tren de manejo", () => {
    const result = filterVehicles(vehicles, {
      ...emptyFilters,
      model: "Corolla",
      transmission: "CVT",
      drivetrain: "FWD",
    });
    expect(result).toHaveLength(1);
  });
});
