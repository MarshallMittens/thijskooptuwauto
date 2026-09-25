"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, Check, ChevronLeft, ChevronRight, Gauge, KeyRound, LoaderCircle, MessageSquare, ShieldCheck, Star, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPTED_PHOTO_TYPES, formatRegistration, MAX_PHOTO_BYTES, MAX_PHOTOS, normalizeRegistration } from "@/lib/applications/schema";
import { createClient } from "@/lib/supabase/browser";

const STORAGE_KEY = "thijskooptuauto.application.v1";
const IDEMPOTENCY_KEY = "thijskooptuauto.application.idempotency.v1";
const stepLabels = ["Kenteken", "Voertuig", "Staat", "Foto’s", "Contact", "Bevestigen"];

type VehicleState = { registration: string; make: string; model: string; variant: string; year: string; fuelType: string; color: string; vehicleType: string };
type ConditionState = { mileageKm: string; damageDescription: string; technicalIssues: string; maintenanceDescription: string; keyCount: string; exteriorRating: string; interiorRating: string; remarks: string };
type SellerState = { fullName: string; email: string; phone: string; postalCode: string; desiredSaleDate: string };

const emptyCondition: ConditionState = { mileageKm: "", damageDescription: "", technicalIssues: "", maintenanceDescription: "", keyCount: "2", exteriorRating: "", interiorRating: "", remarks: "" };
const emptySeller: SellerState = { fullName: "", email: "", phone: "", postalCode: "", desiredSaleDate: "" };

function getIdempotencyKey() {
  if (typeof window === "undefined") return crypto.randomUUID();
  const existing = sessionStorage.getItem(IDEMPOTENCY_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(IDEMPOTENCY_KEY, created);
  return created;
}

async function normalizePhotoInBrowser(file: File) {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number]) || file.size > MAX_PHOTO_BYTES) {
    throw new Error("Alleen JPEG, PNG of WebP tot 10 MB is toegestaan.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / bitmap.width, 2400 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("De foto kon niet worden verwerkt.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob || blob.size > MAX_PHOTO_BYTES) throw new Error("De verwerkte foto is te groot.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
}

export function ApplicationWizard({ initialRegistration, autoLookup = false }: { initialRegistration: string; autoLookup?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(autoLookup ? 2 : 1);
  const [vehicle, setVehicle] = useState<VehicleState>({ registration: normalizeRegistration(initialRegistration), make: "", model: "", variant: "", year: "", fuelType: "", color: "", vehicleType: "" });
  const [condition, setCondition] = useState<ConditionState>(emptyCondition);
  const [seller, setSeller] = useState<SellerState>(emptySeller);
  const [photos, setPhotos] = useState<File[]>([]);
  const [rdwMessage, setRdwMessage] = useState(autoLookup ? "Voertuiggegevens worden opgehaald…" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(autoLookup);
  const [submitStatus, setSubmitStatus] = useState("");
  const [website, setWebsite] = useState("");
  const [idempotencyKey] = useState(getIdempotencyKey);
  const autoLookupStarted = useRef(false);

  useEffect(() => {
    if (autoLookup) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const timeout = window.setTimeout(() => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as { step?: number; vehicle?: VehicleState; condition?: ConditionState };
        if (parsed.vehicle) setVehicle({ ...parsed.vehicle, registration: initialRegistration || parsed.vehicle.registration });
        if (parsed.condition) setCondition({ ...emptyCondition, ...parsed.condition });
        if (parsed.step && parsed.step >= 1 && parsed.step <= 4) setStep(parsed.step);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [autoLookup, initialRegistration]);

  const persist = useCallback((nextStep: number) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step: Math.min(nextStep, 4), vehicle, condition }));
  }, [condition, vehicle]);

  const move = useCallback((nextStep: number) => {
    setError("");
    setStep(nextStep);
    persist(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [persist]);

  const lookupRegistration = useCallback(async (registrationInput?: string) => {
    const registration = normalizeRegistration(registrationInput ?? vehicle.registration);
    if (!/^[A-Z0-9]{6,8}$/.test(registration)) { setError("Vul een volledig Nederlands kenteken in."); return; }
    setBusy(true); setError(""); setRdwMessage("");
    try {
      void fetch("/api/analytics/form-start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventKey: idempotencyKey, website }) }).catch(() => undefined);
      const response = await fetch("/api/rdw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kenteken: registration }) });
      const result = await response.json() as { found?: boolean; unavailable?: boolean; vehicle?: Partial<VehicleState> };
      if (result.found && result.vehicle) {
        setVehicle((current) => ({ ...current, ...result.vehicle, registration, year: result.vehicle?.year ? String(result.vehicle.year) : current.year }));
        setRdwMessage("Beschikbare RDW-gegevens zijn opgehaald. Controleer ze in de volgende stap.");
      } else {
        setVehicle((current) => ({ ...current, registration }));
        setRdwMessage(result.unavailable ? "RDW is tijdelijk niet bereikbaar. Vul de gegevens handmatig in." : "Dit kenteken is niet gevonden. Vul de gegevens handmatig in.");
      }
      move(2);
    } catch {
      setVehicle((current) => ({ ...current, registration }));
      setRdwMessage("RDW is tijdelijk niet bereikbaar. Vul de gegevens handmatig in.");
      move(2);
    } finally { setBusy(false); }
  }, [idempotencyKey, move, vehicle.registration, website]);

  useEffect(() => {
    if (!autoLookup || autoLookupStarted.current) return;
    autoLookupStarted.current = true;
    void lookupRegistration(initialRegistration);
  }, [autoLookup, initialRegistration, lookupRegistration]);

  function validateStep() {
    if (step === 2 && (!vehicle.make.trim() || !vehicle.model.trim())) return "Vul minimaal merk en model in.";
    if (step === 3 && (!/^\d+$/.test(condition.mileageKm) || Number(condition.mileageKm) > 3_000_000)) return "Vul een geldige kilometerstand in.";
    if (step === 3 && (!/^\d+$/.test(condition.keyCount) || Number(condition.keyCount) > 10)) return "Vul een geldig aantal sleutels tussen 0 en 10 in.";
    if (step === 3 && (!/^[1-5]$/.test(condition.exteriorRating) || !/^[1-5]$/.test(condition.interiorRating))) return "Geef de buitenkant en het interieur allebei een beoordeling van 1 tot 5 sterren.";
    if (step === 4 && photos.length < 1) return "Voeg minimaal één foto toe.";
    if (step === 5 && (!seller.fullName.trim() || !seller.email.includes("@") || seller.phone.trim().length < 8 || !/^\d{4}\s?[A-Za-z]{2}$/.test(seller.postalCode))) return "Controleer je naam, e-mailadres, telefoonnummer en postcode.";
    return "";
  }

  function next() {
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }
    move(Math.min(6, step + 1));
  }

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > MAX_PHOTOS) { setError(`Selecteer maximaal ${MAX_PHOTOS} foto’s.`); return; }
    const invalid = selected.find((file) => !ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number]) || file.size > MAX_PHOTO_BYTES);
    if (invalid) { setError(`${invalid.name} is geen JPEG, PNG of WebP van maximaal 10 MB.`); return; }
    setPhotos(selected); setError(""); persist(4);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 6 || busy) return;
    setBusy(true); setError("");
    try {
      setSubmitStatus("Foto’s veilig voorbereiden…");
      const normalizedPhotos = [];
      for (const photo of photos) normalizedPhotos.push(await normalizePhotoInBrowser(photo));

      setSubmitStatus("Privé-upload voorbereiden…");
      const draftResponse = await fetch("/api/applications/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idempotencyKey, photoCount: normalizedPhotos.length, website }) });
      const draft = await draftResponse.json() as { error?: string; completed?: boolean; reference?: string; draftId?: string; draftToken?: string; uploads?: { path: string; token: string }[] };
      if (!draftResponse.ok) throw new Error(draft.error || "De upload kon niet worden gestart.");
      if (draft.completed && draft.reference) { router.push(`/auto-aanmelden/bedankt?referentie=${encodeURIComponent(draft.reference)}`); return; }
      if (!draft.draftId || !draft.draftToken || draft.uploads?.length !== normalizedPhotos.length) throw new Error("De uploadmachtiging is onvolledig.");

      const supabase = createClient();
      for (let index = 0; index < normalizedPhotos.length; index += 1) {
        setSubmitStatus(`Foto ${index + 1} van ${normalizedPhotos.length} uploaden…`);
        const upload = draft.uploads[index];
        const { error: uploadError } = await supabase.storage.from("vehicle-photos").uploadToSignedUrl(upload.path, upload.token, normalizedPhotos[index], { contentType: "image/jpeg" });
        if (uploadError) throw new Error("Een foto kon niet worden geüpload. Probeer het opnieuw.");
      }

      setSubmitStatus("Aanvraag controleren en opslaan…");
      const payload = {
        vehicle: { ...vehicle, year: vehicle.year ? Number(vehicle.year) : null },
        condition: {
          mileageKm: Number(condition.mileageKm),
          keyCount: Number(condition.keyCount),
          damageDescription: [`Buitenkant: ${condition.exteriorRating}/5 sterren.`, condition.damageDescription].filter(Boolean).join("\n"),
          technicalIssues: condition.technicalIssues,
          maintenanceDescription: condition.maintenanceDescription,
          remarks: [`Interieur: ${condition.interiorRating}/5 sterren.`, condition.remarks].filter(Boolean).join("\n"),
        },
        seller,
      };
      const finalizeResponse = await fetch("/api/applications/finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idempotencyKey, draftId: draft.draftId, draftToken: draft.draftToken, photoPaths: draft.uploads.map((upload) => upload.path), payload, website }) });
      const finalized = await finalizeResponse.json() as { error?: string; reference?: string };
      if (!finalizeResponse.ok || !finalized.reference) throw new Error(finalized.error || "De aanvraag kon niet worden opgeslagen.");

      sessionStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(IDEMPOTENCY_KEY);
      router.push(`/auto-aanmelden/bedankt?referentie=${encodeURIComponent(finalized.reference)}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "De aanvraag kon niet worden verstuurd.");
      setSubmitStatus("");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(7,19,39,.08)] sm:p-8" noValidate>
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#a64b00]">Stap {step} van 6</p><h2 className="mt-1 text-2xl font-black">{stepLabels[step - 1]}</h2></div><span className="text-sm text-slate-500">{Math.round((step / 6) * 100)}%</span></div>
      <Progress value={(step / 6) * 100} className="mt-4" aria-label={`Voortgang: stap ${step} van 6`} />
      <ol className="mt-5 hidden grid-cols-6 gap-2 text-center text-xs sm:grid">{stepLabels.map((label, index) => { const stepNumber = index + 1; const completed = stepNumber < step; const active = stepNumber === step; return <li key={label} className={active ? "font-bold text-[#a64b00]" : completed ? "font-semibold text-slate-700" : "text-slate-400"}><span className={`mx-auto mb-2 grid size-7 place-items-center rounded-full border transition-colors ${active ? "border-[#ff9418] bg-[#ff9418] text-black" : completed ? "border-[#a64b00] bg-[#a64b00] text-white" : "border-slate-200 bg-slate-50"}`}>{completed ? <Check className="size-4" aria-hidden="true" /> : stepNumber}</span>{label}</li>; })}</ol>

      <div className="mt-8">
        {step === 1 && <section aria-labelledby="step-1"><h3 id="step-1" className="text-xl font-bold">Wat is het kenteken?</h3><p className="mt-2 text-slate-600">We vragen alleen openbare technische voertuiggegevens op.</p><div className="mt-6 max-w-sm"><Label htmlFor="registration">Kenteken</Label><Input id="registration" className="mt-2 h-14 border-2 border-[#111111] bg-[#ffd400] text-center text-[1.8rem] font-black uppercase tracking-[.08em] [font-family:Impact,'Arial_Narrow',sans-serif] placeholder:text-black/35" value={formatRegistration(vehicle.registration)} placeholder="12-AB-34" maxLength={10} onChange={(event) => setVehicle({ ...vehicle, registration: normalizeRegistration(event.target.value) })} autoComplete="off" autoCapitalize="characters" spellCheck={false} /></div><Button type="button" className="mt-6" onClick={() => void lookupRegistration()} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Gegevens ophalen</Button></section>}

        {step === 2 && <section aria-labelledby="step-2"><h3 id="step-2" className="text-xl font-bold">Controleer de voertuiggegevens</h3>{rdwMessage && <p className="mt-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-950" role="status">{rdwMessage}</p>}<div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Merk" id="make" value={vehicle.make} required onChange={(value) => setVehicle({ ...vehicle, make: value })} /><Field label="Model/handelsbenaming" id="model" value={vehicle.model} required onChange={(value) => setVehicle({ ...vehicle, model: value })} /><Field label="Uitvoering" id="variant" value={vehicle.variant} onChange={(value) => setVehicle({ ...vehicle, variant: value })} /><Field label="Voertuigtype" id="vehicleType" value={vehicle.vehicleType} onChange={(value) => setVehicle({ ...vehicle, vehicleType: value })} /><Field label="Bouwjaar" id="year" type="number" value={vehicle.year} onChange={(value) => setVehicle({ ...vehicle, year: value })} /><Field label="Brandstof" id="fuel" value={vehicle.fuelType} onChange={(value) => setVehicle({ ...vehicle, fuelType: value })} /><Field label="Kleur" id="color" value={vehicle.color} onChange={(value) => setVehicle({ ...vehicle, color: value })} /></div></section>}

        {step === 3 && <section aria-labelledby="step-3">
          <h3 id="step-3" className="text-xl font-bold">Technische staat van je auto</h3>
          <p className="mt-2 max-w-3xl leading-7 text-slate-600">Met een paar korte vragen krijgen we een goed beeld van je auto en eventuele kleine gebreken. Hoe meer je vertelt, hoe beter we je kunnen helpen met een passend voorstel. Wil je iets extra toelichten? Dat kan gewoon in de tekstvelden.</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Vragen met een * zijn verplicht.</p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <QuestionCard icon={<Gauge />} title="Kilometerstand *" description="De huidige stand op de teller">
              <div className="relative mt-4 max-w-xs"><Input id="mileage" type="number" inputMode="numeric" min={0} max={3000000} value={condition.mileageKm} onChange={(event) => setCondition({ ...condition, mileageKm: event.target.value })} required className="h-14 pr-12 text-lg font-bold" aria-label="Kilometerstand" /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-slate-500">km</span></div>
            </QuestionCard>

            <QuestionCard icon={<KeyRound />} title="Hoeveel sleutels zijn er? *" description="Kies het aantal dat je bij de auto hebt">
              <fieldset className="mt-4"><legend className="sr-only">Aantal sleutels</legend><div className="grid grid-cols-4 gap-2">{["1", "2", "3", "4"].map((count) => <button key={count} type="button" aria-pressed={condition.keyCount === count} onClick={() => setCondition({ ...condition, keyCount: count })} className={`min-h-14 rounded-xl border-2 px-2 py-2 text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${condition.keyCount === count ? "border-[#ff9418] bg-orange-50 text-[#7a3600] shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/50"}`}><span className="block text-xl font-black">{count}{count === "4" ? "+" : ""}</span><span className="block text-[.7rem] font-semibold">{count === "1" ? "sleutel" : "sleutels"}</span></button>)}</div></fieldset>
              {Number(condition.keyCount) >= 4 ? <div className="mt-3"><Label htmlFor="keys">Exact aantal</Label><Input id="keys" type="number" inputMode="numeric" min={4} max={10} value={condition.keyCount} onChange={(event) => setCondition({ ...condition, keyCount: event.target.value })} required className="mt-2 h-11 max-w-28" /></div> : <input id="keys" type="hidden" value={condition.keyCount} readOnly />}
            </QuestionCard>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <QuestionCard icon={<Star />} title="Hoe ziet de buitenkant eruit? *" description="1 ster is veel gebruikssporen, 5 sterren is zeer netjes">
              <StarRating label="Beoordeling buitenkant" value={condition.exteriorRating} onChange={(value) => setCondition({ ...condition, exteriorRating: value })} />
            </QuestionCard>
            <QuestionCard icon={<Star />} title="Hoe ziet het interieur eruit? *" description="Denk aan stoelen, dashboard, bekleding en geurtjes">
              <StarRating label="Beoordeling interieur" value={condition.interiorRating} onChange={(value) => setCondition({ ...condition, interiorRating: value })} />
            </QuestionCard>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <QuestionCard icon={<AlertTriangle />} title="Heeft de auto schade?" description="Wees zo volledig mogelijk, ook bij kleine schade">
              <ChoiceButtons label="Snelle keuze voor schade" value={condition.damageDescription} choices={[{ label: "Geen schade", value: "Geen bekende schade" }, { label: "Lichte schade", value: "Lichte schade aanwezig" }, { label: "Schade aanwezig", value: "Schade aanwezig" }]} onChange={(value) => setCondition({ ...condition, damageDescription: value })} />
              <TextField label="Toelichting (optioneel)" id="damage" value={condition.damageDescription} placeholder="Bijvoorbeeld: kras op de rechterdeur" onChange={(value) => setCondition({ ...condition, damageDescription: value })} />
            </QuestionCard>

            <QuestionCard icon={<Wrench />} title="Zijn er technische gebreken?" description="Denk aan storingslampjes, motor of versnellingsbak">
              <ChoiceButtons label="Snelle keuze voor technische staat" value={condition.technicalIssues} choices={[{ label: "Geen gebreken", value: "Geen bekende technische gebreken" }, { label: "Start en rijdt", value: "Start en rijdt" }, { label: "Gebrek aanwezig", value: "Technisch gebrek aanwezig" }]} onChange={(value) => setCondition({ ...condition, technicalIssues: value })} />
              <TextField label="Toelichting (optioneel)" id="technical" value={condition.technicalIssues} placeholder="Bijvoorbeeld: motorlampje brandt" onChange={(value) => setCondition({ ...condition, technicalIssues: value })} />
            </QuestionCard>

            <QuestionCard icon={<ShieldCheck />} title="Hoe is de auto onderhouden?" description="Kies de optie die het beste past">
              <ChoiceButtons label="Onderhoudshistorie" value={condition.maintenanceDescription} choices={[{ label: "Dealer", value: "Dealeronderhouden" }, { label: "Vakgarage", value: "Onderhouden door vakgarage" }, { label: "Zelf/anders", value: "Zelf of anders onderhouden" }, { label: "Onbekend", value: "Onderhoudshistorie onbekend" }]} onChange={(value) => setCondition({ ...condition, maintenanceDescription: value })} />
              <TextField label="Toelichting (optioneel)" id="maintenance" value={condition.maintenanceDescription} placeholder="Bijvoorbeeld: onderhoudsboekje aanwezig" onChange={(value) => setCondition({ ...condition, maintenanceDescription: value })} />
            </QuestionCard>

            <QuestionCard icon={<MessageSquare />} title="Nog iets dat we moeten weten?" description="Bijzonderheden die hierboven niet zijn genoemd">
              <TextField label="Overige opmerkingen (optioneel)" id="remarks" value={condition.remarks} placeholder="Typ hier je aanvullende informatie" onChange={(value) => setCondition({ ...condition, remarks: value })} />
            </QuestionCard>
          </div>
        </section>}

        {step === 4 && <section aria-labelledby="step-4"><h3 id="step-4" className="text-xl font-bold">Voeg foto’s toe</h3><p className="mt-2 leading-7 text-slate-600">Gebruik JPEG, PNG of WebP, maximaal 12 foto’s van elk 10 MB. Fotografeer voor-, achter- en zijkanten, interieur en eventuele schade. Zorg dat gezichten, documenten, huisnummers en andere persoonsgegevens niet zichtbaar zijn.</p><label htmlFor="photos" className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center hover:border-[#a64b00]"><Camera className="size-8 text-[#a64b00]" /><span className="mt-3 font-bold">Kies foto’s</span><span className="mt-1 text-sm text-slate-500">HEIC wordt nog niet ondersteund</span></label><Input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectPhotos} /><ul className="mt-4 space-y-2">{photos.map((photo) => <li key={`${photo.name}-${photo.size}`} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm"><span className="truncate">{photo.name}</span><span>{(photo.size / 1024 / 1024).toFixed(1)} MB</span></li>)}</ul><p className="mt-3 text-sm text-slate-500">Geselecteerd: {photos.length} van {MAX_PHOTOS}. Na vernieuwen moet je foto’s opnieuw kiezen.</p></section>}

        {step === 5 && <section aria-labelledby="step-5"><h3 id="step-5" className="text-xl font-bold">Contactgegevens</h3><p className="mt-2 max-w-3xl leading-7 text-slate-600">Met deze gegevens kunnen we persoonlijk contact met je opnemen over een mogelijk bod. Je postcode helpt ons om de afstand tot een mogelijke koper te bepalen. Dealers krijgen je naam, e-mailadres, telefoonnummer en adres niet te zien.</p><p className="mt-3 text-sm font-semibold text-slate-700">Velden met een * zijn verplicht. Zonder deze gegevens kunnen we je niet bereiken.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Naam" id="fullName" value={seller.fullName} required autoComplete="name" onChange={(value) => setSeller({ ...seller, fullName: value })} /><Field label="E-mailadres" id="email" type="email" value={seller.email} required autoComplete="email" onChange={(value) => setSeller({ ...seller, email: value })} /><Field label="Telefoonnummer" id="phone" type="tel" value={seller.phone} required autoComplete="tel" onChange={(value) => setSeller({ ...seller, phone: value })} /><Field label="Postcode" id="postalCode" value={seller.postalCode} required autoComplete="postal-code" onChange={(value) => setSeller({ ...seller, postalCode: value })} /><Field label="Gewenste verkoopdatum (optioneel)" id="desiredDate" type="date" value={seller.desiredSaleDate} onChange={(value) => setSeller({ ...seller, desiredSaleDate: value })} /></div><div className="mt-7 rounded-2xl border border-orange-200 bg-orange-50/70 p-5"><h4 className="font-black text-slate-950">Mis ons persoonlijke voorstel niet</h4><ul className="mt-4 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3"><Benefit>Vrijblijvend</Benefit><Benefit>Persoonlijk voorstel</Benefit><Benefit>Helemaal gratis</Benefit></ul></div><div className="absolute -left-[10000px]" aria-hidden="true"><Label htmlFor="website">Website</Label><Input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></div></section>}

        {step === 6 && <section aria-labelledby="step-6"><h3 id="step-6" className="text-xl font-bold">Klaar om je aanvraag te versturen?</h3><p className="mt-2 leading-7 text-slate-600">Bekijk je gegevens nog één keer rustig. Wil je iets aanpassen? Klik dan bij het onderdeel op ‘Wijzigen’.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><Summary title="Voertuig" onEdit={() => move(2)} lines={[vehicle.registration, `${vehicle.make} ${vehicle.model}`, [vehicle.year, vehicle.fuelType, vehicle.color].filter(Boolean).join(" · ")]} /><Summary title="Staat" onEdit={() => move(3)} lines={[`${condition.mileageKm} km`, `${condition.keyCount} sleutel(s)`, `Buitenkant ${condition.exteriorRating}/5 · Interieur ${condition.interiorRating}/5`, condition.damageDescription || "Geen extra schadeomschrijving"]} /><Summary title="Foto’s" onEdit={() => move(4)} lines={[`${photos.length} foto(’s) geselecteerd`, "Foto’s worden privé opgeslagen en eerst gecontroleerd."]} /><Summary title="Contact" onEdit={() => move(5)} lines={[seller.fullName, seller.email, seller.phone, seller.postalCode]} /></div><div className="mt-6 rounded-2xl bg-slate-50 p-5"><p className="font-bold text-slate-950">Tevreden met wat je hebt ingevuld?</p><p className="mt-2 text-sm leading-6 text-slate-600">Klik dan hieronder op ‘Aanvraag versturen’. Je aanvraag is gratis en vrijblijvend. Versturen is geen marketingtoestemming en garandeert geen bod of verkoop. Lees de <Link href="/privacy-en-voorwaarden" className="font-bold text-[#a64b00] underline">concept privacy-informatie en voorwaarden</Link>.</p></div></section>}
      </div>

      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-semibold text-red-800" role="alert">{error}</p>}
      {submitStatus && <p className="mt-6 flex items-center gap-2 rounded-xl bg-orange-50 p-4 text-orange-950" role="status" aria-live="polite"><LoaderCircle className="size-4 animate-spin" />{submitStatus}</p>}
      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => move(Math.max(1, step - 1))} disabled={step === 1 || busy}><ChevronLeft />Vorige</Button>
        {step > 1 && step < 6 ? <Button type="button" onClick={next} disabled={busy}>Volgende<ChevronRight /></Button> : null}
        {step === 6 ? <Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Check />}Aanvraag versturen</Button> : null}
      </div>
    </form>
  );
}

function Field({ label, id, value, onChange, type = "text", required, autoComplete }: { label: string; id: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; autoComplete?: string }) {
  return <div><Label htmlFor={id}>{label}{required ? " *" : ""}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} autoComplete={autoComplete} className="mt-2 h-12" /></div>;
}

function TextField({ label, id, value, onChange, placeholder }: { label: string; id: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="mt-4"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} placeholder={placeholder} maxLength={2000} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 resize-y bg-white" /></div>;
}

function QuestionCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition-shadow hover:shadow-sm"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-[#a64b00] [&_svg]:size-5" aria-hidden="true">{icon}</span><div><h4 className="font-bold text-slate-950">{title}</h4><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p></div></div>{children}</article>;
}

function ChoiceButtons({ label, value, choices, onChange }: { label: string; value: string; choices: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return <fieldset className="mt-4"><legend className="sr-only">{label}</legend><div className="flex flex-wrap gap-2">{choices.map((choice) => { const selected = value === choice.value; return <button key={choice.value} type="button" aria-pressed={selected} onClick={() => onChange(choice.value)} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${selected ? "border-[#ff9418] bg-[#ff9418] text-black shadow-sm" : "border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"}`}>{selected && <Check className="mr-1 inline size-4" aria-hidden="true" />}{choice.label}</button>; })}</div></fieldset>;
}

const ratingLabels = ["", "Veel aandacht nodig", "Duidelijke gebruikssporen", "Normale gebruikssporen", "Netjes", "Zeer netjes"];

function StarRating({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const selected = Number(value);
  return <fieldset className="mt-5"><legend className="sr-only">{label}</legend><div className="flex flex-wrap gap-1.5">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => onChange(String(rating))} aria-label={`${rating} van 5 sterren voor ${label.toLowerCase()}`} aria-pressed={selected === rating} className="group rounded-xl p-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"><Star className={`size-9 transition-all group-hover:scale-110 ${rating <= selected ? "fill-[#ff9418] text-[#d46800]" : "fill-white text-slate-300 group-hover:text-orange-300"}`} aria-hidden="true" /></button>)}</div><p className={`mt-2 text-sm font-semibold ${selected ? "text-[#8b3f00]" : "text-slate-500"}`} aria-live="polite">{selected ? `${selected} van 5 · ${ratingLabels[selected]}` : "Kies 1 tot 5 sterren"}</p></fieldset>;
}

function Benefit({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff9418] text-black"><Check className="size-4" aria-hidden="true" /></span>{children}</li>;
}

function Summary({ title, lines, onEdit }: { title: string; lines: string[]; onEdit: () => void }) {
  return <article className="rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between"><h4 className="font-bold">{title}</h4><button type="button" onClick={onEdit} className="text-sm font-bold text-[#a64b00] underline">Wijzigen</button></div>{lines.filter(Boolean).map((line) => <p key={line} className="mt-2 text-sm text-slate-600">{line}</p>)}</article>;
}
