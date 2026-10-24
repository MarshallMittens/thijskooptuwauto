import type { Metadata } from "next";

import { PublicPage } from "@/components/public/public-page";

export const metadata: Metadata = { title: "Veelgestelde vragen | Thijs koopt uw auto", description: "Antwoorden over auto aanmelden, voertuiggegevens, foto’s en biedingen." };

const questions = [
  ["Moet ik een account maken of mijn e-mailadres bevestigen?", "Nee. Als particulier meld je je auto zonder account aan. Je hoeft je e-mailadres niet te bevestigen. Je krijgt een ontvangstbevestiging op het ingevulde e-mailadres. Controleer daarom of het adres klopt."],
  ["Hoe meld ik mijn auto aan?", "Vul je kenteken in, controleer de voertuiggegevens en vertel over de staat van je auto. Voeg duidelijke foto’s en je contactgegevens toe. Controleer alles nog één keer voordat je de aanvraag verstuurt."],
  ["Wat gebeurt er na mijn aanvraag?", "Je ziet een bedankmelding en ontvangt een bevestigingsmail met je kenteken en aanvraaggegevens. Thijs controleert je aanmelding voordat de auto aan goedgekeurde garages wordt aangeboden. Als er informatie ontbreekt, nemen we contact met je op."],
  ["Ik heb geen bevestigingsmail ontvangen. Wat nu?", "Controleer je spammap. Een e-mailstoring betekent niet dat je aanvraag verloren is. Neem bij twijfel contact op met Thijs en vermeld je kenteken. Meld je auto niet meteen opnieuw aan."],
  ["Is mijn auto aanmelden gratis?", "Ja, je auto aanmelden is gratis en vrijblijvend. Eventuele kosten bij een latere afhandeling moeten vooraf duidelijk worden afgesproken."],
  ["Wordt mijn auto gegarandeerd verkocht?", "Nee. Een aanmelding, publicatie of ontvangen bod garandeert geen verkoop."],
  ["Welke gegevens haalt RDW op?", "Alleen beschikbare openbare voertuiggegevens, zoals merk, handelsbenaming, eerste toelating en kleur. Geen eigenaar-, schade-, onderhouds- of marktwaardegegevens."],
  ["Zien autobedrijven mijn contactgegevens?", "Nee, niet standaard. Naam, e-mail, telefoonnummer en postcode worden apart opgeslagen en zijn alleen toegankelijk voor bevoegd beheer."],
  ["Waarom zijn foto’s nodig?", "Foto’s helpen om de staat van de auto te beoordelen. Verwijder of bedek documenten, gezichten, huisnummers en andere persoonsgegevens voordat je uploadt."],
  ["Is het hoogste bod automatisch bindend?", "Nee. De hoogste bieder wordt niet automatisch koper en een biedronde is niet automatisch een verkoop."],
  ["Welke foto’s kan ik het beste toevoegen?", "Maak foto’s schuin van linksvoor en rechtsachter met een leesbaar kenteken, van het interieur door een geopende deur, het dashboard en de kilometerstand. Voeg aparte detailfoto’s toe van schade. Tik op de bijbehorende tegel om een foto te maken of te kiezen."],
  ["Werkt foto’s maken ook op mijn telefoon of tablet?", "Ja. Kies ‘Maak foto’ voor de camera of ‘Kies foto’ voor je fotobibliotheek. Opent de camera niet rechtstreeks? Maak de foto dan eerst met de camera-app en selecteer hem daarna in het formulier."],
  ["Welke bijzonderheden moet ik vermelden?", "Beschrijf bekende schade, technische gebreken, rook- of dierenlucht en ontbrekende onderhoudsgegevens. Vul alles zo zorgvuldig mogelijk in. Een volledig beeld helpt garages bij hun beoordeling en voorkomt misverstanden tijdens de inspectie."],
  ["Kan ik een fout in mijn aanvraag corrigeren?", "Voor het versturen kun je teruggaan en gegevens wijzigen. Heb je de aanvraag al verstuurd? Neem contact op met Thijs en vermeld je kenteken en de juiste informatie."],
  ["Hoe lang duurt de biedronde?", "Na controle en publicatie kunnen goedgekeurde garages 24 uur bieden. De periode begint bij publicatie, niet bij het versturen van je aanvraag."],
  ["Zie ik als verkoper de tussentijdse biedingen?", "Nee. Thijs begeleidt je persoonlijk bij de uitkomst. Goedgekeurde garages zien de biedbedragen en kunnen elkaar overbieden, zonder dat zij zien welke andere garage het bod heeft geplaatst."],
  ["Wat als ik het hoogste bod te laag vind?", "Bespreek dit met Thijs. Je hoeft je auto niet automatisch te verkopen. Thijs kan beoordelen of een nieuwe biedronde zinvol is. Een nieuwe ronde garandeert geen hoger bod."],
  ["Wie inspecteert mijn auto?", "De mogelijke koper inspecteert de auto. Eventuele afwijkingen en een aangepast voorstel worden besproken voordat er een koop wordt gesloten. Zorg daarom dat de omschrijving en foto’s de huidige staat goed weergeven."],
  ["Kan ik mijn auto laten ophalen of zelf brengen?", "Geef je voorkeur aan bij ‘Ophalen of brengen?’. Je kunt kiezen voor laten ophalen, zelf brengen of in overleg. De koper verzorgt het ophalen wanneer dat is afgesproken. Stem de afspraak en eventuele kosten vooraf af."],
  ["Kan ik transport laten regelen?", "Ja. Kies ‘Transport regelen (kosten in overleg)’ in het formulier. We bespreken vooraf de mogelijkheden, de prijs en wie de kosten betaalt. Deze keuze boekt nog geen transport."],
  ["Wie regelt de overschrijving?", "De garage en jij regelen samen de overschrijving bij de overdracht. Maak vooraf duidelijke afspraken en zorg dat je een vrijwaringsbewijs ontvangt."],
  ["Hoe kan een garage zich aansluiten?", "Vraag via ‘Voor bedrijven’ een account aan en vul de bedrijfsgegevens in. Thijs beoordeelt de aanvraag. Na goedkeuring krijgt de garage toegang tot het dealerportaal. Er geldt geen maximum van vijf aangesloten garages."],
  ["Bij wie kan ik terecht met een vraag of klacht?", "Neem contact op met Thijs via de contactpagina. Vermeld je kenteken en beschrijf kort je vraag of klacht. Thijs behandelt klachten over het proces persoonlijk."],
];

export default function FaqPage() {
  return <PublicPage eyebrow="Vragen en antwoorden" title="Goed om te weten vóór je begint." intro="Hier vind je de belangrijkste uitleg over de huidige werkwijze."><div className="grid gap-4">{questions.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 bg-white p-6"><summary className="cursor-pointer font-bold">{question}</summary><p className="mt-4 leading-7 text-slate-600">{answer}</p></details>)}</div></PublicPage>;
}
