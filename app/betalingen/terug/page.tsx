import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terug van testbetaling | Thijskooptuauto", robots: { index: false, follow: false } };

export default function PaymentReturnPage() {
  return <main className="portal-page"><section className="portal-panel max-w-2xl">
    <p className="eyebrow">Lokale testsimulator</p>
    <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Terugkeer is geen betaalbewijs</h1>
    <p className="mt-4 leading-7 text-slate-700">Deze pagina verandert geen betaalstatus. Alleen een geldig, ondertekend providerbericht dat server-side op bedrag, valuta, ontvanger en volgorde is gecontroleerd kan dat doen.</p>
    <p className="mt-4 rounded-xl bg-amber-50 p-4 font-semibold text-amber-950">Er is geen echt geld verwerkt. Controleer de actuele teststatus in het dealer- of verkopersdossier.</p>
    <div className="mt-6 flex gap-3"><Link href="/dealer/betalingen" className="font-bold text-[#a64b00] underline">Naar dealerbetalingen</Link><Link href="/mijn-aanvraag" className="font-bold text-[#a64b00] underline">Naar mijn aanvraag</Link></div>
  </section></main>;
}
