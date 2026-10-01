import { describe, expect, it } from "vitest";
import { vehicleSchema } from "@/lib/validations";
import { makeVehicleInput } from "./fixtures";

describe("vehicleSchema", () => {
  it("acepta una ficha completa con cinco fotografías", () => {
    expect(vehicleSchema.safeParse(makeVehicleInput()).success).toBe(true);
  });

  it("exige al menos cinco fotografías", () => {
    const input = makeVehicleInput();
    input.images = input.images.slice(0, 4);
    const result = vehicleSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("al menos 5");
  });

  it("rechaza un precio base no positivo", () => {
    const result = vehicleSchema.safeParse({
      ...makeVehicleInput(),
      basePrice: 0,
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path[0] === "basePrice"),
    ).toBe(true);
  });

  it("rechaza un cierre anterior o igual al inicio", () => {
    const result = vehicleSchema.safeParse({
      ...makeVehicleInput(),
      endAt: "2030-01-01T11:00:00.000Z",
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path[0] === "endAt"),
    ).toBe(true);
  });

  it("rechaza fotografías duplicadas", () => {
    const input = makeVehicleInput();
    input.images[4] = { ...input.images[0] };
    expect(vehicleSchema.safeParse(input).success).toBe(false);
  });
});
