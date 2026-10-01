import { describe, expect, it } from "vitest";
import { vehicleImagesBelongToUser } from "@/lib/vehicles/security";
import { makeImages } from "./fixtures";

describe("seguridad de fotografías", () => {
  it("acepta URLs de Firebase Storage dentro de la carpeta del usuario", () => {
    expect(
      vehicleImagesBelongToUser(
        makeImages("owner-1"),
        "owner-1",
        "test-bucket.appspot.com",
      ),
    ).toBe(true);
  });

  it("rechaza rutas pertenecientes a otro usuario", () => {
    expect(
      vehicleImagesBelongToUser(
        makeImages("other-user"),
        "owner-1",
        "test-bucket.appspot.com",
      ),
    ).toBe(false);
  });

  it("rechaza URLs externas aunque declaren una ruta válida", () => {
    const images = makeImages("owner-1");
    images[0].url = "https://example.com/image.jpg";
    expect(
      vehicleImagesBelongToUser(images, "owner-1", "test-bucket.appspot.com"),
    ).toBe(false);
  });
});
