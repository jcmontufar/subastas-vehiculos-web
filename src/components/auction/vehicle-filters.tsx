"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Vehicle, VehicleFiltersValue } from "@/types/domain";

export const emptyFilters: VehicleFiltersValue = {
  year: "",
  brand: "",
  model: "",
  fuelType: "",
  transmission: "",
  drivetrain: "",
  damageLevel: "",
};

export function VehicleFilters({
  vehicles,
  value,
  onChange,
}: {
  vehicles: Vehicle[];
  value: VehicleFiltersValue;
  onChange: (value: VehicleFiltersValue) => void;
}) {
  const options = (
    field: keyof Pick<
      Vehicle,
      "year" | "brand" | "model" | "fuelType" | "transmission" | "drivetrain"
    >,
  ) =>
    Array.from(
      new Set(vehicles.map((vehicle) => String(vehicle[field]))),
    ).sort();
  const fields: {
    key: keyof VehicleFiltersValue;
    label: string;
    values: string[];
  }[] = [
    { key: "year", label: "Año", values: options("year").reverse() },
    { key: "brand", label: "Marca", values: options("brand") },
    { key: "model", label: "Modelo", values: options("model") },
    { key: "fuelType", label: "Combustible", values: options("fuelType") },
    {
      key: "transmission",
      label: "Transmisión",
      values: options("transmission"),
    },
    {
      key: "drivetrain",
      label: "Tren de manejo",
      values: options("drivetrain"),
    },
    {
      key: "damageLevel",
      label: "Nivel de daño",
      values: ["GREEN", "YELLOW", "RED"],
    },
  ];
  const damageLabels: Record<string, string> = {
    GREEN: "Menor / limpio",
    YELLOW: "Medio / reparable",
    RED: "Severo / salvamento",
  };
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <SlidersHorizontal className="size-5 text-blue-600" /> Filtrar
          inventario
        </h2>
        <button
          onClick={() => onChange(emptyFilters)}
          className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <RotateCcw className="size-4" /> Limpiar
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {fields.map((field) => (
          <label
            key={field.key}
            className="text-xs font-semibold text-slate-500"
          >
            {field.label}
            <select
              value={value[field.key]}
              onChange={(event) =>
                onChange({ ...value, [field.key]: event.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              {field.values.map((option) => (
                <option key={option} value={option}>
                  {damageLabels[option] ?? option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
