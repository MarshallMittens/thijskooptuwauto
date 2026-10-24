"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, CarFront, Car, Armchair, Gauge, CircleGauge, TriangleAlert, Check, Plus } from "lucide-react";
import { PhotoAngleIllustration } from "@/components/applications/photo-angle-illustration";

const angles = [
  { name: "Schuin van voren (linksvoor)", hint: "Hele auto en leesbaar kenteken", Icon: CarFront },
  { name: "Schuin van achteren (rechtsachter)", hint: "Hele auto en leesbaar kenteken", Icon: Car },
  { name: "Interieur door open deur", hint: "Stoelen en binnenkant duidelijk zichtbaar", Icon: Armchair },
  { name: "Dashboard", hint: "Overzicht van stuur en dashboard", Icon: Gauge },
  { name: "Kilometerstand en tellers", hint: "Maak de kilometerstand goed leesbaar", Icon: CircleGauge },
  { name: "Schade van dichtbij", hint: "Optioneel · voeg ook extra schadefoto’s toe", Icon: TriangleAlert },
];

function PhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const preview = new window.Image();
    preview.onload = () => setUrl(objectUrl);
    preview.src = objectUrl;
    return () => { preview.onload = null; URL.revokeObjectURL(objectUrl); };
  }, [file]);
  return url ? <Image src={url} alt="Geselecteerde autofoto" width={480} height={320} unoptimized className="h-36 w-full rounded-xl object-cover" /> : null;
}

export function PhotoAnglePicker({ photos, onSelect, onRemove }: { photos: File[]; onSelect: (file: File, prefix: string) => void; onRemove: (file: File) => void }) {
  const [active, setActive] = useState<number | null>(null);
  return <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Foto’s per autohoek">
    {angles.map(({ name, hint }, index) => {
      const prefix = `hoek-${index + 1}-`;
      const selected = photos.find((photo) => photo.name.startsWith(prefix));
      return <div key={name} className={`overflow-hidden rounded-2xl border-2 ${selected ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white"}`}>
        <button type="button" aria-expanded={active === index} onClick={() => setActive(active === index ? null : index)} className="group flex min-h-44 w-full flex-col items-center justify-center gap-2 p-5 text-center transition-colors hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500 active:bg-orange-100">
          {selected ? <PhotoPreview file={selected} /> : <span className="relative grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white"><PhotoAngleIllustration angle={index} /><span className="absolute grid size-10 place-items-center rounded-full bg-[#003f8f] text-white shadow-sm transition-colors group-hover:bg-[#f7941e] group-focus-visible:bg-[#f7941e] group-active:bg-[#c55f00]"><Plus className="size-6" aria-hidden="true" /></span></span>}
          <span className="font-bold">{name}</span><span className="text-xs text-slate-600">{hint}</span>
          {selected ? <span className="flex max-w-full items-center gap-1 text-xs font-bold text-[#a64b00]"><Check className="size-4 shrink-0" /><span className="truncate">Foto toegevoegd · wijzigen</span></span> : <span className="text-sm font-bold text-[#a64b00]">Foto toevoegen</span>}
        </button>
        {selected && <div className="flex gap-2 px-3 pb-3"><button type="button" className="flex-1 rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white hover:bg-[#a64b00]" onClick={() => setActive(index)}>Vervangen</button><button type="button" className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50" onClick={() => { onRemove(selected); setActive(null); }}>Verwijderen</button></div>}
        {active === index && <div className="grid grid-cols-2 gap-2 border-t border-orange-200 p-3">
          {[true, false].map((camera) => <label key={String(camera)} className="relative flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#111] px-2 py-3 text-center text-xs font-bold text-white focus-within:ring-2 focus-within:ring-orange-500 hover:bg-[#a64b00]">
            <Camera className="size-4 shrink-0" />{camera ? "Maak foto" : "Kies foto"}
            <input aria-label={`${camera ? "Maak" : "Kies"} foto: ${name}`} type="file" accept="image/*" capture={camera ? "environment" : undefined} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(event) => { const file = event.target.files?.[0]; if (file) onSelect(new File([file], `${prefix}${file.name}`, { type: file.type }), prefix); event.target.value = ""; }} />
          </label>)}
        </div>}
      </div>;
    })}
  </div>;
}
