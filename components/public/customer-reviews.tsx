import { ExternalLink, Quote, Star } from "lucide-react";

import { googleReviewSummary } from "@/lib/public/google-reviews";

const reviews = [
  { quote: "Zeer vriendelijke man! Doet eerlijk zaken.", name: "Patrick", rating: 4 },
  { quote: "Goed geholpen en snel en eerlijk.", name: "Jermain Guhnen", rating: 5 },
  { quote: "Zeer vriendelijk en een goede service.", name: "Sandy Rossel", rating: 5 },
] as const;

export function CustomerReviews({ className = "" }: { className?: string }) {
  return (
    <section id="klantervaringen" className={`scroll-mt-6 ${className}`} aria-labelledby="klantervaringen-titel">
      <div className="grid overflow-hidden rounded-[2rem] bg-[#111111] text-white lg:grid-cols-[.75fr_1.25fr]">
        <div className="flex flex-col justify-center bg-[#f7941e] p-7 text-[#111111] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[.16em]">Google-beoordeling</p>
          <div className="mt-5 flex items-end gap-3"><strong className="text-7xl font-black leading-none tracking-[-0.07em]">{googleReviewSummary.rating.toLocaleString("nl-NL")}</strong><span className="pb-1 text-lg font-bold">uit 5</span></div>
          <Stars rating={googleReviewSummary.rating} className="mt-4 text-[#111111]" label={`Gemiddeld ${googleReviewSummary.rating.toLocaleString("nl-NL")} van 5 sterren`} />
          <p className="mt-4 font-bold">Gebaseerd op {googleReviewSummary.reviewCount} openbare Google-reviews</p>
          <a href={googleReviewSummary.profileUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#111111] px-5 py-3 font-extrabold text-white transition hover:bg-[#2b2b2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]">
            Bekijk alle reviews <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="eyebrow text-[#f7941e]">Echte klantervaringen</p>
          <h2 id="klantervaringen-titel" className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">Klanten over hun ervaring met Thijs.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Korte fragmenten uit openbare Google-reviews. We tonen alleen ervaringen met vier of vijf sterren; via Google kun je alle beoordelingen bekijken.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {reviews.map((review) => <Review key={review.name} {...review} />)}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">Bron: Google Maps. Openbare Google-reviews worden niet door Google geverifieerd. De waardering en het aantal reviews kunnen veranderen.</p>
    </section>
  );
}

function Review({ quote, name, rating }: { quote: string; name: string; rating: number }) {
  return <blockquote className="flex min-h-60 flex-col rounded-[1.5rem] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(7,19,39,.08)]"><div className="flex items-start justify-between gap-4"><Stars rating={rating} label={`${rating} van 5 sterren`} /><Quote className="size-8 text-[#f7941e]/35" aria-hidden="true" /></div><p className="mt-7 text-xl font-extrabold leading-8">“{quote}”</p><footer className="mt-auto pt-8"><strong className="text-slate-950">{name}</strong><span className="ml-2 text-sm text-slate-500">Google-review</span></footer></blockquote>;
}

function Stars({ rating, label, className = "text-[#f7941e]" }: { rating: number; label: string; className?: string }) {
  return <span className={`flex gap-1 ${className}`} role="img" aria-label={label}>{Array.from({ length: 5 }, (_, index) => {
    const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));
    return <span key={index} className="relative block size-5 shrink-0"><Star className="absolute inset-0 size-5 opacity-35" aria-hidden="true" /><span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}><Star className="size-5 max-w-none" fill="currentColor" aria-hidden="true" /></span></span>;
  })}</span>;
}
