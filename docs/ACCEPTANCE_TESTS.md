# Acceptatietests

## Fase 1

- Anoniem kan geen applicatietabellen lezen.
- Een dealerregistratie maakt altijd een bedrijf met status `pending`.
- Een dealer kan geen rol, lidmaatschap of bedrijfsstatus rechtstreeks wijzigen.
- Pending en blocked accounts krijgen geen dealerportaal.
- Een goedgekeurde dealer krijgt pas na TOTP-verificatie (`aal2`) het dealerportaal en krijgt geen beheeromgeving.
- Nieuwe actieve staff- en dealerlidmaatschappen kunnen niet op dezelfde identiteit worden gecombineerd; een ouder gecombineerd account krijgt geen dealerrechten.
- Een dealer kan een ander bedrijf niet lezen.
- Een staff-account op `aal1` wordt naar MFA geleid.
- Alleen een admin op `aal2` kan goedkeuren of blokkeren.
- Wachtwoordherstel verraadt niet of een e-mailadres bestaat en trekt na wijziging bestaande sessies globaal in.
- De testpolicy duurt exact 24 uur; onbesliste behandelingskosten kunnen niet als goedgekeurde productiepolicy worden opgeslagen.
- Iedere bedrijfsstatuswijziging levert een auditlogregel op.
- Rechtstreekse Data API/databaseverzoeken omzeilen de regels niet.

## Fase 2

- Volledige aanvraag werkt bij RDW-uitval via handmatige invoer.
- Alleen een overeenkomende aanvraagreferentie en e-mailadres kunnen een magic link voorbereiden; het antwoord verraadt niet of de combinatie bestaat.
- De magic link koppelt na e-mailverificatie precies één verkopersidentiteit aan het eigen dossier.
- Een andere verkoper, dealer of beheeridentiteit kan het dossier niet claimen of via een rechtstreekse RPC lezen.
- De verkoper ziet eigen status, voertuiggegevens en foto’s via tijdelijke links, maar nooit interne notities of biedingen.
- Aanvullen kan uitsluitend bij `needs_information` en zet het dossier daarna terug op `in_review` met een auditregel zonder vrije tekst.
- Publiceren wordt in PostgreSQL geweigerd zolang de verkoper niet is geverifieerd.
- Dubbel indienen geeft één aanvraag en dezelfde uitkomst.
- Contactgegevens worden niet in de browsersessie opgeslagen.
- Een fout e-mailadres wordt vóór foto-upload geweigerd; een al ingelogde verkoper kan een nieuwe aanvraag alleen via expliciete koppeling en een exact overeenkomend geverifieerd adres openen.
- Een anonieme gebruiker kan aanvragen, verkopersgegevens, fotometadata en concepten niet uitlezen.
- Foto’s worden alleen met een kort geldige uploadmachtiging naar de private bucket geschreven.
- De server controleert werkelijke foto-inhoud en bestandsgrootte en codeert geaccepteerde foto’s opnieuw als JPEG zonder metadata.
- Een foto blijft `pending` totdat beheer deze na controle op zichtbare persoonsgegevens goedkeurt of afwijst.
- Een e-mailstoring verwijdert de opgeslagen aanvraag niet; de notificatie blijft `pending` of `failed` in de outbox.
- Alleen staff op `aal2` kan aanvragen, verkopersgegevens en interne notities lezen of wijzigen.
- Ongeldige aanvraagstatusovergangen worden in PostgreSQL geweigerd en geldige wijzigingen staan in de auditlog.
- Formulierstarts en afrondingen worden intern geteld zonder kenteken, contactgegevens of vrije tekst in de meetgebeurtenis.

## Fase 3

- Pending en geblokkeerde bedrijven kunnen aanbod noch biedfunctie gebruiken.
- Dealers zien geen verkopersgegevens, interne notities of identiteit van andere biedende bedrijven; alle goedgekeurde dealers zien wel dezelfde bedragen en tijdstippen.
- Alleen gepubliceerde, onveranderlijke voertuigversies en goedgekeurde foto’s zijn zichtbaar.
- Een nieuwe ronde start op databasetijd en eindigt exact 86400 seconden later.
- Een bod wordt als gehele eurocenten opgeslagen en moet bij een bestaande hoogste bieding onder €10.000 minimaal €100 hoger en vanaf €10.000 minimaal €150 hoger zijn.
- Rechtstreekse inserts, updates en deletes op `bids` worden geweigerd.
- Dezelfde idempotentiesleutel met dezelfde inhoud retourneert hetzelfde bod; andere inhoud wordt geweigerd.
- Een bod na de databasetijd van de deadline wordt geweigerd, ongeacht een sluitingstaak.
- Iedere succesvolle bieding schrijft een auditregel en notificatie-outboxregel in dezelfde transactie.
- Iedere publicatie maakt voor alle goedgekeurde garages een gededupliceerde outboxmelding; de vorige hoogste bieder krijgt bij een bod van een ander bedrijf precies één overbodenmelding.
- Alleen staff met `aal2` kan het overzicht van lopende veilingen inclusief de namen van biedende bedrijven lezen; dealers worden database-side geweigerd.
- Beheer ziet alle biedingen. Sluiten maakt maximaal één winnaarreservering, maar geen koop of verkoopdossier.
- Herhaald sluiten geeft dezelfde uitslag en maakt geen tweede winnaarreservering.
- Gelijktijdige verhogingen worden door de biedrondelock in geldige volgorde verwerkt; twee echte databaseverbindingen bewijzen dat van twee gelijke gelijktijdige biedingen exact één wordt opgeslagen.

## Fase 4

- Contactmomenten zijn alleen zichtbaar en schrijfbaar voor staff met `aal2` en krijgen een auditregel zonder de volledige samenvatting te kopiëren.
- Een gewonnen veiling maakt geen koop of verkoopdossier; alleen de gereserveerde winnaar kan afspraakmomenten voorstellen.
- Een andere dealer ziet geen gewonnen dossier, inspectie, koopconcept of verkoperscontact.
- De winnaar krijgt verkoperscontact pas nadat de verkoper exact één aangeboden moment heeft bevestigd.
- Een andere verkoper kan geen afspraak, prijsvoorstel of koopconcept van dit dossier lezen of beantwoorden.
- Inspectie bewaart datum, kilometerstand, bevindingen en afwijkingen; inspectiefoto’s bestaan werkelijk in private Storage en de limiet blijft ook bij gelijktijdige uploads acht.
- Een voorgestelde prijswijziging laat het oorspronkelijke bod onveranderd en maakt vóór actieve verkopersacceptatie geen koopconcept.
- Eén partijbevestiging is onvoldoende; alleen dealer én verkoper op exact hetzelfde bedrag en dezelfde voorwaardenversie leveren `agreed` op.
- De oude beheerfunctie kan dubbele bevestiging niet omzeilen en een afwijzing wijst niet automatisch een tweede bieder aan.
- Prijs- en koopreacties schrijven in dezelfde transactie een gededupliceerde outboxmelding voor de andere partij.
- Testvoorwaarden blijven herkenbaar `test` en starten geen betaling.
- Een materiële wijziging vanaf een verouderde revisie wordt geweigerd.
- Een materiële wijziging trekt gepubliceerd aanbod in, annuleert de ronde en bewaart oude voertuigversies en biedingen onveranderd.
- Herpublicatie na een materiële wijziging maakt een nieuwe revisie en biedronde.
- Dealers kunnen contactmomenten, afhandeling en beheerworkflow-RPC’s niet lezen of aanroepen.

## Fase 5 — uitsluitend simulator/sandbox

- De simulator staat na iedere nieuwe migratieopbouw uit en de server weigert activatie in productie.
- Een verkoper of andere dealer kan geen betalingsdossier van een ander lezen of bedienen.
- Een succes-/retourpagina wijzigt geen betaalstatus.
- Een ontbrekende, verkeerde of meer dan vijf minuten oude testwebhookhandtekening wordt geweigerd.
- Verkeerd bedrag, valuta of ontvanger wordt in PostgreSQL geweigerd, ook als de JSON-vorm geldig is.
- Dubbele provider-events en refundverzoeken maken geen dubbele betaling of terugbetaling.
- Onlogische volgorde, zoals uitbetaling vóór ontvangst en vrijgave, wordt geweigerd.
- Gedeeltelijke, mislukte en verlopen betalingen krijgen afzonderlijke statussen.
- Vrijgave vereist volledig ontvangen geld, bevestiging door verkoper en dealer en aparte staff/MFA-verificatie.
- Een geschil blokkeert de normale route en wist een al vastgelegde uitbetaling niet.
- Refundbedrag kan het ontvangen min eerder terugbetaalde bedrag niet overschrijden.
- Reconciliatie geeft nul verschillen bij gelijke administratie en registreert een gemanipuleerd verschil.
- Alle testbetalingen blijven `simulated/test`; onbesliste kosten blijven €0 en `test_unconfigured`.
- Een echte provider-acceptatietest blijft verplicht: de simulator is geen bewijs voor echte onboarding, betaling, holding, vrijgave of uitbetaling.

## Fase 6 — klachten en operatie

- Een verkoper kan uitsluitend bij een eigen aanvraag een klacht openen; een andere verkoper ziet of bedient deze niet.
- Alleen het betrokken winnende bedrijf kan de gekoppelde dealerklacht en tijdlijn lezen; andere dealers worden via RPC en RLS geweigerd.
- Een dubbele klachtopening met dezelfde idempotentiesleutel maakt geen tweede dossier.
- Klachtbewijs wordt privé opgeslagen, bestaat werkelijk in Storage en kan alleen na objectautorisatie tijdelijk worden getoond.
- Een platformverbonden koper activeert verplicht een tweede beoordeling; dezelfde staff-identiteit kan niet beoordelen én afronden.
- Klachtstatussen en incidenten hebben actor, tijdstip en auditspoor zonder bewijsinhoud in technische logs.
- Een testfactuurrecord is altijd `TEST-*`, `draft_blocked`, €0 en `unconfigured`; een correctie verwijst naar het oorspronkelijke platformdocument, niet naar de autokoop.
- Een browser kan de outbox niet claimen. Twee workers kunnen dezelfde lease niet afronden en een mislukte poging blijft voor retry bewaard.
- Na een geslaagde retry staat één outboxregel op `sent` met de juiste pogingsteller; acht mislukte pogingen worden als handmatig aandachtspunt getoond.
- Het operationele dashboard toont open klachten, tweede beoordelingen, outboxstatus, incidenten, laatste reconciliatie, worker-run en herstelproef.
- De lokale herstelproef herstelt een database-export in een willekeurige tijdelijke database en een private Storage-object in een tijdelijke bucket, controleert de checksum en ruimt alles op.
- Een lokale synthetische herstelproef is geen bewijs voor retentie, encryptie, RTO/RPO of herstel van de uiteindelijke productieomgeving.

## Fase 7 — vrijgavevoorbereiding

- Vijf lokale Chrome-rookproeven voor kenteken, foutmelding, mobiele publieke pagina's, gastenblokkade en RDW-uitval slagen zonder een aanvraag te versturen; zie `e2e/public-and-access.spec.ts`.
- Eén schrijvende lokale Chrome-acceptatieproef gebruikt vier gescheiden fictieve sessies en doorloopt aanvraag, Mailpit-verificatie, twee garageaccounts met MFA, beheergoedkeuring, publicatie, biedingen, winnaar, afspraak, inspectie, dubbele bevestiging en een afgeschermde klacht; zie `e2e/authenticated-workflow.spec.ts`. Dit is nog geen proef met echte deelnemers of een afzonderlijke acceptatieomgeving.
- SQL-controles bewijzen een 86400-secondenronde tijdens zomer-/wintertijd en behouden veilingregels na een latere beleidswijziging.
- Een andere verkoper, vreemde of geblokkeerde garage, anonieme gebruiker en beheerder zonder MFA kunnen geen bewijsupload voorbereiden.
- Gesloten klachten accepteren geen nieuwe berichten of bewijsregistratie en kunnen niet stilzwijgend heropend worden.
- Een onafhankelijke klachtbeoordeling kan niet achteraf of tweemaal worden overschreven.
- De winnende garage kan een afspraak-/no-showklacht op de eigen reservering openen zonder verplichte betaalorder; een andere garage niet.
- De complete F/T/S/P-acceptatiematrix, externe vrijgavebewijzen en gebruikersproef staan in `docs/PHASE7.md`. Lokale SQL-tests vervangen geen externe review of echte provider-sandbox.

## Nog vóór livegang

- E-mailuitval verwijdert of rolt geen aanvraag of bod terug.
- Database- en fotoherstel zijn lokaal synthetisch proefgedraaid; de uiteindelijke productieback-up en geïsoleerde acceptatieherstelproef blijven verplicht vóór livegang.
- Bestaande lokale of acceptatiedata beïnvloeden de uitslag van geautomatiseerde tests niet.
- De actuele besloten gebruikersproef en het bewijsformulier volgen `docs/PHASE7.md`; `docs/PILOT.md` is historische fase-1–4-context.
- Alle verplichte punten in `docs/GO_LIVE_CHECKLIST.md` zijn afgevinkt en gecontroleerd.
