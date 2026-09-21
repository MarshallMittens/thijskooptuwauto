import { CompanyRegistrationForm } from "@/components/dealer/company-registration-form";
import { requireUser } from "@/lib/auth/dal";

export default async function CompanyRegistrationPage() {
  const context = await requireUser("/dealer/registreren");

  return (
    <main className="portal-page">
      <section className="portal-panel max-w-3xl">
        <p className="eyebrow">Dealerregistratie</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Bedrijfsgegevens</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">We controleren de gegevens en het KvK-nummer handmatig. Registratie geeft nog geen toegang tot voertuigen of biedingen.</p>
        {context.companyId ? (
          <p className="mt-8 rounded-xl bg-amber-50 p-4 font-semibold text-amber-950">Aan dit account is al een bedrijf gekoppeld.</p>
        ) : (
          <CompanyRegistrationForm />
        )}
      </section>
    </main>
  );
}
