import { z } from "zod";

export const vehicleSchema = z
  .object({
    year: z.coerce
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    itemType: z.string().trim().min(2, "Indica el tipo de artículo"),
    brand: z.string().trim().min(2, "Indica la marca"),
    model: z.string().trim().min(1, "Indica el modelo"),
    engine: z.string().trim().min(2, "Indica el motor"),
    transmission: z.string().trim().min(2, "Indica la transmisión"),
    fuelType: z.string().trim().min(2, "Indica el combustible"),
    drivetrain: z.enum(["AWD", "FWD", "RWD", "4WD"]),
    cylinders: z.coerce.number().int().min(1).max(16),
    damageLevel: z.enum(["GREEN", "YELLOW", "RED"]),
    images: z
      .array(
        z.object({
          id: z.string().min(1),
          url: z.url(),
          storagePath: z.string().min(1),
          order: z.number().int().nonnegative(),
        }),
      )
      .min(5, "Debes subir al menos 5 fotografías"),
    basePrice: z.coerce.number().positive("El precio debe ser mayor que cero"),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime(),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "La fecha de cierre debe ser posterior al inicio",
    path: ["endAt"],
  });

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Ingresa tu nombre"),
    lastName: z.string().trim().min(2, "Ingresa tu apellido"),
    email: z.email("Ingresa un correo válido"),
    phone: z.string().trim().min(8, "Ingresa un teléfono válido"),
    password: z.string().min(8, "Usa al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
