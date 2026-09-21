"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CarFront,
  Check,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  {
    number: "01",
    title: "Vertel ons over je auto",
    text: "Start met je kenteken. In de volgende fase halen we de voertuiggegevens automatisch op.",
    icon: CarFront,
  },
  {
    number: "02",
    title: "Voeg een paar foto’s toe",
    text: "Met duidelijke foto’s kunnen we je auto goed beoordelen, zonder verrassingen achteraf.",
    icon: Camera,
  },
  {
    number: "03",
    title: "Ontvang een eerlijk bod",
    text: "Je krijgt persoonlijk contact en een helder bod. Jij beslist, zonder verplichtingen.",
    icon: BadgeCheck,
  },
];

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export default function Home() {
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizePlate(plate);

    if (normalized.length < 6) {
      setReady(false);
      setError("Vul een volledig Nederlands kenteken in.");
      return;
    }

    setPlate(normalized);
    setError("");
    setReady(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="hero-shell relative isolate min-h-[760px] border-b border-white/10 text-white lg:min-h-[820px]">
        <Image
          src="/car-inspection-hero.png"
          alt="Donkergrijze auto klaar voor een professionele inspectie"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,13,28,.98)_0%,rgba(4,13,28,.92)_34%,rgba(4,13,28,.40)_70%,rgba(4,13,28,.1)_100%)]" />

        <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
          <a href="#top" className="group inline-flex items-center gap-3" aria-label="Thijs koopt uw auto — startpagina">
            <span className="grid size-10 place-items-center rounded-full bg-[#ffd400] text-[#071327] shadow-[0_0_0_5px_rgba(255,212,0,.12)] transition-transform group-hover:-rotate-6">
              <CarFront className="size-5" aria-hidden="true" />
            </span>
            <span className="text-[1.05rem] font-extrabold tracking-[-0.03em]">
              thijs<span className="text-[#ffd400]">kooptuwauto</span>
            </span>
          </a>
          <a
            href="#werkwijze"
            className="hidden rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:inline-flex"
          >
            Zo werkt het
          </a>
        </header>

        <div id="top" className="mx-auto grid w-full max-w-[1240px] px-5 pb-20 pt-14 sm:px-8 lg:px-10 lg:pt-24">
          <div className="max-w-[660px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-[#ffd400]" />
              Persoonlijk. Helder. Zonder gedoe.
            </div>
            <h1 className="max-w-[630px] text-[clamp(3rem,7vw,5.8rem)] font-black leading-[.9] tracking-[-0.065em]">
              Je auto verkopen begint met één kenteken.
            </h1>
            <p className="mt-7 max-w-[560px] text-lg leading-8 text-white/72 sm:text-xl">
              Geen eindeloze formulieren of onduidelijke biedingen. Deel de gegevens van je auto en ontvang straks een eerlijk, persoonlijk bod.
            </p>

            <div className="mt-10 max-w-[580px] rounded-[1.5rem] border border-white/15 bg-white p-3 text-[#071327] shadow-[0_24px_80px_rgba(0,0,0,.32)] sm:p-4">
              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="license-plate" className="mb-2.5 block px-1 text-sm font-bold">
                  Vul je kenteken in
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="license-field flex min-h-14 flex-1 items-stretch overflow-hidden rounded-xl border-2 border-[#071327] bg-[#ffd400] focus-within:ring-4 focus-within:ring-blue-600/20">
                    <span className="grid w-10 shrink-0 place-items-center bg-[#1554a1] text-[10px] font-black text-white" aria-hidden="true">
                      NL
                    </span>
                    <Input
                      id="license-plate"
                      name="kenteken"
                      value={plate}
                      onChange={(event) => {
                        setPlate(normalizePlate(event.target.value));
                        setError("");
                        setReady(false);
                      }}
                      placeholder="12AB34"
                      autoComplete="off"
                      aria-describedby={error ? "plate-error" : "plate-help"}
                      aria-invalid={Boolean(error)}
                      className="h-14 rounded-none border-0 bg-transparent px-4 text-center font-mono text-2xl font-black uppercase tracking-[.13em] text-[#071327] shadow-none placeholder:text-[#071327]/38 focus-visible:ring-0 md:text-2xl"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 rounded-xl bg-[#1554d1] px-6 text-base font-bold text-white shadow-none hover:bg-[#0f42aa]">
                    Start je aanvraag
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <p id={error ? "plate-error" : "plate-help"} className={`mt-2.5 px-1 text-sm ${error ? "font-semibold text-red-700" : "text-slate-500"}`}>
                  {error || "In fase 1 blijft je invoer alleen in deze browser."}
                </p>
              </form>

              {ready && (
                <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#edf4ff] p-4" role="status" aria-live="polite">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#1554d1] text-white">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold">Kenteken {plate} staat klaar</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">
                      De echte voertuigcontrole en vervolgvragen koppelen we in fase 2. Er is nu niets verstuurd.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-white/75" aria-label="Voordelen">
              <li className="flex items-center gap-2"><Check className="size-4 text-[#ffd400]" /> Vrijblijvend bod</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-[#ffd400]" /> Vooraf duidelijke afspraken</li>
              <li className="flex items-center gap-2"><Check className="size-4 text-[#ffd400]" /> Persoonlijk contact</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f7fb] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" id="werkwijze">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-8 border-b border-slate-200 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow">Van kenteken naar bod</p>
              <h2 className="mt-3 max-w-[720px] text-[clamp(2.3rem,5vw,4.4rem)] font-black leading-[.98] tracking-[-0.055em] text-[#071327]">
                Snel geregeld, met aandacht voor je auto.
              </h2>
            </div>
            <p className="max-w-[390px] text-base leading-7 text-slate-600 lg:pb-1">
              We combineren slimme voertuiggegevens met een menselijke beoordeling. Zo weet je precies waar je aan toe bent.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map(({ number, title, text, icon: Icon }) => (
              <article key={number} className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,.04)] transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm font-bold text-[#1554d1]">{number}</span>
                  <span className="grid size-11 place-items-center rounded-full bg-[#edf4ff] text-[#1554d1] transition-colors group-hover:bg-[#1554d1] group-hover:text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-14 text-xl font-extrabold tracking-[-0.03em] text-[#071327]">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-4 rounded-[1.5rem] bg-[#071327] p-6 text-white sm:grid-cols-3 sm:p-8">
            <div className="flex items-center gap-3"><Clock3 className="size-5 text-[#ffd400]" /><span className="font-semibold">Persoonlijke reactie</span></div>
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#ffd400]" /><span className="font-semibold">Veilig omgaan met gegevens</span></div>
            <div className="flex items-center gap-3"><BadgeCheck className="size-5 text-[#ffd400]" /><span className="font-semibold">Duidelijke afspraken</span></div>
          </div>
        </div>
      </section>

      <footer className="bg-[#071327] px-5 py-8 text-white/65 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Thijs koopt uw auto</p>
          <p>Fase 1 — lokale demonstratie, nog niet gepubliceerd</p>
        </div>
      </footer>
    </main>
  );
}
