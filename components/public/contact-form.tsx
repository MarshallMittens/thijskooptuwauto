"use client";

import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CONTACT_EMAIL = "info@thijskooptuwauto.nl";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function openEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Contact via website — ${name.trim()}`);
    const body = encodeURIComponent(
      `Naam: ${name.trim()}\nE-mailadres: ${email.trim()}\n\nBericht:\n${message.trim()}`,
    );
    window.location.assign(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
  }

  return (
    <form onSubmit={openEmail} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="eyebrow">Laat een bericht achter</p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Waar kunnen we je mee helpen?</h2>
      <p id="contact-form-help" className="mt-3 leading-7 text-slate-600">
        Vul je gegevens in. Met de knop onderaan open je een vooraf ingevuld bericht in je eigen e-mailprogramma; je verstuurt het bericht daar zelf.
      </p>
      <div className="mt-7 grid gap-5">
        <div>
          <Label htmlFor="contact-name">Naam</Label>
          <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="contact-email">E-mailadres</Label>
          <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="contact-message">Bericht</Label>
          <Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={2000} rows={8} aria-describedby="contact-form-help" className="mt-2 resize-y" />
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
        <Mail aria-hidden="true" /> Open bericht in e-mail
      </Button>
    </form>
  );
}
