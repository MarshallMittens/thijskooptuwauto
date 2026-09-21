"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS, normalizeRegistration } from "@/lib/applications/schema";
import { createClient } from "@/lib/supabase/browser";

const STORAGE_KEY = "thijskooptuauto.application.v1";
const IDEMPOTENCY_KEY = "thijskooptuauto.application.idempotency.v1";
const stepLabels = ["Kenteken", "Voertuig", "Staat", "Foto’s", "Contact", "Bevestigen"];

type VehicleState = { registration: string; make: string; model: string; variant: string; year: string; fuelType: string; color: string; vehicleType: string };
type ConditionState = { mileageKm: string; damageDescription: string; technicalIssues: string; maintenanceDescription: string; keyCount: string; remarks: string };
type SellerState = { fullName: string; email: string; phone: string; postalCode: string; desiredSaleDate: string };

const emptyCondition: ConditionState = { mileageKm: "", damageDescription: "", technicalIssues: "", maintenanceDescription: "", keyCount: "2", remarks: "" };
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

export function ApplicationWizard({ initialRegistration }: { initialRegistration: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState<VehicleState>({ registration: normalizeRegistration(initialRegistration), make: "", model: "", variant: "", year: "", fuelType: "", color: "", vehicleType: "" });
  const [condition, setCondition] = useState<ConditionState>(emptyCondition);
  const [seller, setSeller] = useState<SellerState>(emptySeller);
  const [photos, setPhotos] = useState<File[]>([]);
  const [rdwMessage, setRdwMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [website, setWebsite] = useState("");
  const [idempotencyKey] = useState(getIdempotencyKey);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as { step?: number; vehicle?: VehicleState; condition?: ConditionState };
        if (parsed.vehicle) setVehicle({ ...parsed.vehicle, registration: initialRegistration || parsed.vehicle.registration });
        if (parsed.condition) setCondition(parsed.condition);
        if (parsed.step && parsed.step >= 1 && parsed.step <= 4) setStep(parsed.step);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [initialRegistration]);

  function persist(nextStep: number) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step: Math.min(nextStep, 4), vehicle, condition }));
  }

  function move(nextStep: number) {
    setError("");
    setStep(nextStep);
    persist(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function lookupRegistration() {
    const registration = normalizeRegistration(vehicle.registration);
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
  }

  function validateStep() {
    if (step === 2 && (!vehicle.make.trim() || !vehicle.model.trim())) return "Vul minimaal merk en model in.";
    if (step === 3 && (!/^\d+$/.test(condition.mileageKm) || Number(condition.mileageKm) > 3_000_000)) return "Vul een geldige kilometerstand in.";
    if (step === 3 && (!/^\d+$/.test(condition.keyCount) || Number(condition.keyCount) > 10)) return "Vul een geldig aantal sleutels tussen 0 en 10 in.";
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
        condition: { ...condition, mileageKm: Number(condition.mileageKm), keyCount: Number(condition.keyCount) },
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
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#1554d1]">Stap {step} van 6</p><h2 className="mt-1 text-2xl font-black">{stepLabels[step - 1]}</h2></div><span className="text-sm text-slate-500">{Math.round((step / 6) * 100)}%</span></div>
      <Progress value={(step / 6) * 100} className="mt-4" aria-label={`Voortgang: stap ${step} van 6`} />
      <ol className="mt-4 hidden grid-cols-6 gap-2 text-center text-xs text-slate-500 sm:grid">{stepLabels.map((label, index) => <li key={label} className={index + 1 === step ? "font-bold text-[#1554d1]" : ""}>{label}</li>)}</ol>

      <div className="mt-8">
        {step === 1 && <section aria-labelledby="step-1"><h3 id="step-1" className="text-xl font-bold">Wat is het kenteken?</h3><p className="mt-2 text-slate-600">We vragen alleen openbare technische voertuiggegevens op.</p><div className="mt-6 max-w-sm"><Label htmlFor="registration">Kenteken</Label><Input id="registration" className="mt-2 h-14 bg-[#ffd400] text-center font-mono text-2xl font-black uppercase" value={vehicle.registration} onChange={(event) => setVehicle({ ...vehicle, registration: normalizeRegistration(event.target.value) })} autoComplete="off" /></div><Button type="button" className="mt-6" onClick={lookupRegistration} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Gegevens ophalen</Button></section>}

        {step === 2 && <section aria-labelledby="step-2"><h3 id="step-2" className="text-xl font-bold">Controleer de voertuiggegevens</h3>{rdwMessage && <p className="mt-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900" role="status">{rdwMessage}</p>}<div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Merk" id="make" value={vehicle.make} required onChange={(value) => setVehicle({ ...vehicle, make: value })} /><Field label="Model/handelsbenaming" id="model" value={vehicle.model} required onChange={(value) => setVehicle({ ...vehicle, model: value })} /><Field label="Uitvoering" id="variant" value={vehicle.variant} onChange={(value) => setVehicle({ ...vehicle, variant: value })} /><Field label="Voertuigtype" id="vehicleType" value={vehicle.vehicleType} onChange={(value) => setVehicle({ ...vehicle, vehicleType: value })} /><Field label="Bouwjaar" id="year" type="number" value={vehicle.year} onChange={(value) => setVehicle({ ...vehicle, year: value })} /><Field label="Brandstof" id="fuel" value={vehicle.fuelType} onChange={(value) => setVehicle({ ...vehicle, fuelType: value })} /><Field label="Kleur" id="color" value={vehicle.color} onChange={(value) => setVehicle({ ...vehicle, color: value })} /></div></section>}

        {step === 3 && <section aria-labelledby="step-3"><h3 id="step-3" className="text-xl font-bold">Wat is de staat van de auto?</h3><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Kilometerstand" id="mileage" type="number" value={condition.mileageKm} required onChange={(value) => setCondition({ ...condition, mileageKm: value })} /><Field label="Aantal sleutels" id="keys" type="number" value={condition.keyCount} required onChange={(value) => setCondition({ ...condition, keyCount: value })} /><TextField label="Schade" id="damage" value={condition.damageDescription} onChange={(value) => setCondition({ ...condition, damageDescription: value })} /><TextField label="Technische gebreken" id="technical" value={condition.technicalIssues} onChange={(value) => setCondition({ ...condition, technicalIssues: value })} /><TextField label="Onderhoud" id="maintenance" value={condition.maintenanceDescription} onChange={(value) => setCondition({ ...condition, maintenanceDescription: value })} /><TextField label="Overige opmerkingen" id="remarks" value={condition.remarks} onChange={(value) => setCondition({ ...condition, remarks: value })} /></div></section>}

        {step === 4 && <section aria-labelledby="step-4"><h3 id="step-4" className="text-xl font-bold">Voeg foto’s toe</h3><p className="mt-2 leading-7 text-slate-600">Gebruik JPEG, PNG of WebP, maximaal 12 foto’s van elk 10 MB. Fotografeer voor-, achter- en zijkanten, interieur en eventuele schade. Zorg dat gezichten, documenten, huisnummers en andere persoonsgegevens niet zichtbaar zijn.</p><label htmlFor="photos" className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center hover:border-[#1554d1]"><Camera className="size-8 text-[#1554d1]" /><span className="mt-3 font-bold">Kies foto’s</span><span className="mt-1 text-sm text-slate-500">HEIC wordt nog niet ondersteund</span></label><Input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectPhotos} /><ul className="mt-4 space-y-2">{photos.map((photo) => <li key={`${photo.name}-${photo.size}`} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm"><span className="truncate">{photo.name}</span><span>{(photo.size / 1024 / 1024).toFixed(1)} MB</span></li>)}</ul><p className="mt-3 text-sm text-slate-500">Geselecteerd: {photos.length} van {MAX_PHOTOS}. Na vernieuwen moet je foto’s opnieuw kiezen.</p></section>}

        {step === 5 && <section aria-labelledby="step-5"><h3 id="step-5" className="text-xl font-bold">Hoe kunnen we je bereiken?</h3><p className="mt-2 text-slate-600">Deze contactgegevens worden niet in de browseropslag bewaard en zijn niet zichtbaar voor dealers.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Naam" id="fullName" value={seller.fullName} required autoComplete="name" onChange={(value) => setSeller({ ...seller, fullName: value })} /><Field label="E-mailadres" id="email" type="email" value={seller.email} required autoComplete="email" onChange={(value) => setSeller({ ...seller, email: value })} /><Field label="Telefoonnummer" id="phone" type="tel" value={seller.phone} required autoComplete="tel" onChange={(value) => setSeller({ ...seller, phone: value })} /><Field label="Postcode" id="postalCode" value={seller.postalCode} required autoComplete="postal-code" onChange={(value) => setSeller({ ...seller, postalCode: value })} /><Field label="Gewenste verkoopdatum (optioneel)" id="desiredDate" type="date" value={seller.desiredSaleDate} onChange={(value) => setSeller({ ...seller, desiredSaleDate: value })} /></div><div className="absolute -left-[10000px]" aria-hidden="true"><Label htmlFor="website">Website</Label><Input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></div></section>}

        {step === 6 && <section aria-labelledby="step-6"><h3 id="step-6" className="text-xl font-bold">Controleer je aanvraag</h3><div className="mt-6 grid gap-4 sm:grid-cols-2"><Summary title="Voertuig" onEdit={() => move(2)} lines={[vehicle.registration, `${vehicle.make} ${vehicle.model}`, [vehicle.year, vehicle.fuelType, vehicle.color].filter(Boolean).join(" · ")]} /><Summary title="Staat" onEdit={() => move(3)} lines={[`${condition.mileageKm} km`, `${condition.keyCount} sleutel(s)`, condition.damageDescription || "Geen schadeomschrijving"]} /><Summary title="Foto’s" onEdit={() => move(4)} lines={[`${photos.length} foto(’s) geselecteerd`, "Foto’s worden privé opgeslagen en eerst gecontroleerd."]} /><Summary title="Contact" onEdit={() => move(5)} lines={[seller.fullName, seller.email, seller.phone, seller.postalCode]} /></div><p className="mt-6 text-sm leading-6 text-slate-600">Door te versturen vraag je ons je autoaanmelding te beoordelen. Dit is geen marketingtoestemming en garandeert geen bod of verkoop. Lees de <Link href="/privacy-en-voorwaarden" className="font-bold text-[#1554d1] underline">concept privacy-informatie en voorwaarden</Link>.</p></section>}
      </div>

      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 font-semibold text-red-800" role="alert">{error}</p>}
      {submitStatus && <p className="mt-6 flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-blue-900" role="status" aria-live="polite"><LoaderCircle className="size-4 animate-spin" />{submitStatus}</p>}
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

function TextField({ label, id, value, onChange }: { label: string; id: string; value: string; onChange: (value: string) => void }) {
  return <div><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} maxLength={2000} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28" /></div>;
}

function Summary({ title, lines, onEdit }: { title: string; lines: string[]; onEdit: () => void }) {
  return <article className="rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between"><h4 className="font-bold">{title}</h4><button type="button" onClick={onEdit} className="text-sm font-bold text-[#1554d1] underline">Wijzigen</button></div>{lines.filter(Boolean).map((line) => <p key={line} className="mt-2 text-sm text-slate-600">{line}</p>)}</article>;
}
