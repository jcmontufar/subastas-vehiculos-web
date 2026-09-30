"use client";

import {
  Camera,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { storage } from "@/lib/firebase/client";
import { vehicleSchema } from "@/lib/validations";
import type { Vehicle, VehicleImage } from "@/types/domain";

type FormValues = {
  year: string;
  itemType: string;
  brand: string;
  model: string;
  engine: string;
  transmission: string;
  fuelType: string;
  drivetrain: "AWD" | "FWD" | "RWD" | "4WD";
  cylinders: string;
  damageLevel: "GREEN" | "YELLOW" | "RED";
  basePrice: string;
  startAt: string;
  endAt: string;
};

const toLocalDate = (value?: string) =>
  value
    ? new Date(
        new Date(value).getTime() -
          new Date(value).getTimezoneOffset() * 60_000,
      )
        .toISOString()
        .slice(0, 16)
    : "";

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<VehicleImage[]>(
    vehicle?.images ?? [],
  );
  const [removed, setRemoved] = useState<VehicleImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: vehicle
      ? {
          year: String(vehicle.year),
          itemType: vehicle.itemType,
          brand: vehicle.brand,
          model: vehicle.model,
          engine: vehicle.engine,
          transmission: vehicle.transmission,
          fuelType: vehicle.fuelType,
          drivetrain: vehicle.drivetrain,
          cylinders: String(vehicle.cylinders),
          damageLevel: vehicle.damageLevel,
          basePrice: String(vehicle.basePrice),
          startAt: toLocalDate(vehicle.startAt),
          endAt: toLocalDate(vehicle.endAt),
        }
      : { drivetrain: "FWD", damageLevel: "GREEN" },
  });

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const addFiles = (selected: FileList | null) => {
    if (!selected) return;
    const valid = Array.from(selected).filter(
      (file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024,
    );
    if (valid.length !== selected.length)
      toast.error("Solo se aceptan imágenes de hasta 8 MB.");
    setFiles((current) =>
      [...current, ...valid].slice(0, 12 - existing.length),
    );
  };

  const uploadFile = (file: File, index: number): Promise<VehicleImage> =>
    new Promise((resolve, reject) => {
      if (!storage || !user)
        return reject(new Error("Firebase Storage no está configurado"));
      const storageInstance = storage;
      const id = crypto.randomUUID();
      const storagePath = `vehicles/${user.uid}/${vehicle?.id ?? "new"}/${id}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
      const task = uploadBytesResumable(
        ref(storageInstance, storagePath),
        file,
        {
          contentType: file.type,
        },
      );
      task.on(
        "state_changed",
        (snapshot) =>
          setUploadProgress(
            Math.round(
              ((index + snapshot.bytesTransferred / snapshot.totalBytes) /
                files.length) *
                100,
            ),
          ),
        reject,
        async () =>
          resolve({
            id,
            url: await getDownloadURL(task.snapshot.ref),
            storagePath,
            order: existing.length + index,
          }),
      );
    });

  const submit = async (values: FormValues) => {
    if (!user) return toast.error("Debes iniciar sesión.");
    if (existing.length + files.length < 5)
      return toast.error("Debes incluir al menos 5 fotografías.");
    try {
      setUploadProgress(files.length ? 1 : 100);
      const uploaded: VehicleImage[] = [];
      for (let index = 0; index < files.length; index += 1)
        uploaded.push(await uploadFile(files[index], index));
      const images = [...existing, ...uploaded].map((image, order) => ({
        ...image,
        order,
      }));
      const payload = {
        ...values,
        year: Number(values.year),
        cylinders: Number(values.cylinders),
        basePrice: Number(values.basePrice),
        startAt: new Date(values.startAt).toISOString(),
        endAt: new Date(values.endAt).toISOString(),
        images,
      };
      const parsed = vehicleSchema.safeParse(payload);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues[0]?.message ?? "Verifica los datos",
        );
      const token = await user.getIdToken();
      const response = await fetch(
        vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles",
        {
          method: vehicle ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(parsed.data),
        },
      );
      const result = (await response.json()) as {
        data?: Vehicle;
        error?: string;
      };
      if (!response.ok || !result.data)
        throw new Error(result.error ?? "No fue posible guardar");
      if (storage) {
        const storageInstance = storage;
        await Promise.allSettled(
          removed
            .filter((image) => image.storagePath !== "demo")
            .map((image) =>
              deleteObject(ref(storageInstance, image.storagePath)),
            ),
        );
      }
      toast.success(vehicle ? "Publicación actualizada" : "Vehículo publicado");
      router.push(`/vehiculos/${result.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la publicación",
      );
      setUploadProgress(0);
    }
  };

  const removeExisting = (image: VehicleImage) => {
    setExisting((items) => items.filter((item) => item.id !== image.id));
    setRemoved((items) => [...items, image]);
  };
  const textFields: {
    name: keyof FormValues;
    label: string;
    type?: string;
    placeholder?: string;
  }[] = [
    { name: "year", label: "Año", type: "number", placeholder: "2023" },
    {
      name: "itemType",
      label: "Tipo de artículo",
      placeholder: "SUV, sedán, pickup…",
    },
    { name: "brand", label: "Marca", placeholder: "Toyota" },
    { name: "model", label: "Modelo", placeholder: "RAV4" },
    { name: "engine", label: "Motor", placeholder: "2.5L I4" },
    {
      name: "cylinders",
      label: "Número de cilindros",
      type: "number",
      placeholder: "4",
    },
    {
      name: "basePrice",
      label: "Precio base (GTQ)",
      type: "number",
      placeholder: "50000",
    },
    { name: "startAt", label: "Inicio de subasta", type: "datetime-local" },
    { name: "endAt", label: "Cierre de subasta", type: "datetime-local" },
  ];
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-sm font-bold tracking-widest text-blue-600 uppercase">
            Paso 1
          </p>
          <h2 className="mt-1 text-xl font-black">Ficha técnica</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {textFields.map((field) => (
            <label
              key={field.name}
              className="text-sm font-semibold text-slate-700"
            >
              {field.label}
              <input
                required
                min={field.type === "number" ? 1 : undefined}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                {...register(field.name)}
                className="form-input"
              />
            </label>
          ))}
          <Select
            label="Transmisión"
            registration={register("transmission")}
            options={["Automática", "Manual", "CVT", "Doble embrague"]}
          />
          <Select
            label="Tipo de combustible"
            registration={register("fuelType")}
            options={["Gasolina", "Diésel", "Híbrido", "Eléctrico"]}
          />
          <Select
            label="Tren de manejo"
            registration={register("drivetrain")}
            options={["AWD", "FWD", "RWD", "4WD"]}
          />
          <Select
            label="Nivel de daño"
            registration={register("damageLevel")}
            options={["GREEN", "YELLOW", "RED"]}
            labels={{
              GREEN: "Verde — menor / limpio",
              YELLOW: "Amarillo — medio / reparable",
              RED: "Rojo — severo / salvamento",
            }}
          />
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-600 uppercase">
              Paso 2
            </p>
            <h2 className="mt-1 text-xl font-black">Fotografías</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mínimo 5, máximo 12. JPG, PNG o WebP de hasta 8 MB.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${existing.length + files.length >= 5 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {existing.length + files.length} / 5 mínimo
          </span>
        </div>
        <label className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-6 py-10 text-center hover:border-blue-400">
          <ImagePlus className="mb-3 size-9 text-blue-600" />
          <span className="font-bold text-slate-800">
            Seleccionar fotografías
          </span>
          <span className="mt-1 text-sm text-slate-500">
            Puedes elegir varias a la vez
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => addFiles(event.target.files)}
          />
        </label>
        {(existing.length > 0 || previews.length > 0) && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {existing.map((image) => (
              <Preview
                key={image.id}
                src={image.url}
                onRemove={() => removeExisting(image)}
              />
            ))}
            {previews.map((src, index) => (
              <Preview
                key={src}
                src={src}
                onRemove={() =>
                  setFiles((items) =>
                    items.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex justify-between text-sm font-bold text-blue-800">
            <span>Subiendo imágenes…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button
          disabled={isSubmitting}
          className="inline-flex min-w-52 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : vehicle ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <Camera className="size-5" />
          )}
          {isSubmitting
            ? "Guardando…"
            : vehicle
              ? "Guardar cambios"
              : "Publicar vehículo"}
        </button>
      </div>
    </form>
  );
}

function Select({
  label,
  registration,
  options,
  labels = {},
}: {
  label: string;
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select required {...registration} className="form-input">
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
function Preview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
      <Image
        src={src}
        alt="Vista previa"
        fill
        sizes="20vw"
        className="object-cover"
        unoptimized={src.startsWith("blob:")}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Eliminar fotografía"
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white text-red-600 opacity-90 shadow hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
