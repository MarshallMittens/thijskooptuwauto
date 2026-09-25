import { Quote } from "lucide-react";

const reviews = [
  { quote: "Prima prijs, service en afhandeling. Aanrader!", name: "Freek Hendriksen", location: "Zelhem" },
  { quote: "Top service!", name: "Joop Moorman", location: "Doetinchem" },
  { quote: "Vriendelijk en behulpzaam door Thijs geholpen.", name: "Niek Nijenhuis", location: "Arnhem" },
] as const;

export function CustomerReviews({ className = "" }: { className?: string }) {
  return (
    <section id="klantervaringen" className={`scroll-mt-6 ${className}`} aria-labelledby="klantervaringen-titel">
      <p className="eyebrow">Echte klantervaringen</p>
      <h2 id="klantervaringen-titel" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Wat klanten eerder over Thijs vertelden.</h2>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {reviews.map((review) => <Review key={review.name} {...review} />)}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">Deze reacties stonden al op de bestaande website van Thijskooptuauto. Er worden geen individuele sterren of datums getoond, omdat die bij deze reacties niet werden vermeld.</p>
    </section>
  );
}

function Review({ quote, name, location }: { quote: string; name: string; location: string }) {
  return <blockquote className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(7,19,39,.05)]"><Quote className="size-7 text-[#f7941e]" aria-hidden="true" /><p className="mt-6 text-lg font-bold leading-7">“{quote}”</p><footer className="mt-auto pt-6 text-sm text-slate-600"><strong className="text-slate-950">{name}</strong><span className="ml-1">· {location}</span></footer></blockquote>;
}
