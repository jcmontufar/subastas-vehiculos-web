"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { VehicleImage } from "@/types/domain";

export function ImageCarousel({
  images,
  title,
}: {
  images: VehicleImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const select = (index: number) =>
    setActive((index + images.length) % images.length);
  if (!images.length)
    return (
      <div className="grid aspect-video place-items-center rounded-2xl bg-slate-100 text-slate-400">
        Sin fotografías
      </div>
    );
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={images[active].url}
          alt={`${title}, fotografía ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        <button
          aria-label="Fotografía anterior"
          onClick={() => select(active - 1)}
          className="absolute top-1/2 left-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow"
        >
          <ChevronLeft />
        </button>
        <button
          aria-label="Fotografía siguiente"
          onClick={() => select(active + 1)}
          className="absolute top-1/2 right-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow"
        >
          <ChevronRight />
        </button>
        <span className="absolute right-4 bottom-4 rounded-full bg-slate-900/70 px-3 py-1 text-sm font-semibold text-white">
          {active + 1} / {images.length}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActive(index)}
            className={`relative aspect-[4/3] overflow-hidden rounded-lg ring-2 ${active === index ? "ring-blue-600" : "ring-transparent"}`}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="15vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
