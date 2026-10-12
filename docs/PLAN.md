# Bouwplan en voortgang

Legenda: `[x]` gebouwd en lokaal geverifieerd, `[~]` gebouwd maar nog niet volledig end-to-end of extern gekoppeld, `[ ]` nog niet gebouwd.

## Verwerking praktijktestfeedback — 12 oktober 2026

- [x] Bedankpagina toont het kenteken als herkenbare dossiernaam; de onvoorspelbare referentie blijft alleen als technische beveiligingscode beschikbaar.
- [x] Een al ingelogde verkoper kan een nieuwe aanvraag expliciet koppelen; de database blijft het geverifieerde e-mailadres vergelijken en weigert dealer-/staffaccounts.
- [x] Contactgegevens worden vóór fotoverwerking met hetzelfde Zod-schema als de server gecontroleerd, inclusief dubbele punten in een e-maildomein.
- [x] Beheer kan materiële voertuiggegevens gecontroleerd aanpassen; een bestaande veiling wordt daarbij ingetrokken in plaats van stilzwijgend gewijzigd.
- [x] Fotogids, mobiele cameraknop, aparte schadefoto-instructie en de tekst dat foto’s niet met AI worden aangevuld zijn toegevoegd.
- [x] Btw-/margestatus, particulier/zakelijk gebruik, rook-/dierenlucht en fysieke/digitale onderhoudsregistratie worden als voertuigcontext opgeslagen.
- [x] Lopende veilingen hebben een apart staff-overzicht met biedaantal, hoogste bod en biedende bedrijven.
- [x] Veilingen kunnen gecontroleerd opnieuw worden gestart; biedstappen zijn €100 onder €5.000 en €150 vanaf €5.000 zonder bovengrenswijziging.
- [x] Er is geen limiet van vijf garages. Nieuwe publicaties en overbiedingen schrijven per betrokken garage een duurzame outboxmelding.
- [x] Dealerinlog en de beknopte gebruiksregels zijn duidelijker benoemd; platformrelatie en toegangsblokkade zijn in beheer zichtbaar gescheiden.
- [~] Lokale Supabase Auth-mails hebben Thijskooptuauto-opmaak. Dezelfde HTML en een geverifieerde eigen SMTP-afzender moeten nog in het gekoppelde Supabase-project worden ingesteld.
- [ ] Sms-berichten vereisen providerkeuze, verwerkersafspraken, toestemming, afzender en kostenbeleid; er wordt niet stilzwijgend een betaalde sms-dienst geactiveerd.
- [ ] Een commerciële KvK-validatie-API of andere betrouwbare externe bron moet nog worden gekozen. Tot die tijd controleert beheer handmatig; alleen formaat en uniciteit zijn technisch afgedwongen.
- [ ] Automatisch/proxy bieden vereist een afzonderlijk transactieontwerp, limietprivacy, gelijktijdigheidstests en dealeruitleg; dit wordt niet als eenvoudige formulieroptie toegevoegd.
- [ ] Registreren wie een veiling heeft bekeken vereist doelbinding, bewaartermijn en privacytekst voordat persoonsgebonden kijklogs worden opgeslagen.
- [ ] De €250 transportservice is besloten voor gekozen transport, maar betaler, btw, factuurmoment, annulering en restitutie blokkeren inning en facturatie.
- [ ] Klant- en garagekosten gaan ieder rechtstreeks naar Thijskooptuauto, maar exacte bedragen, btw, verschuldigdheidsmoment en restitutie ontbreken nog. Testfacturen blijven daarom €0 en `draft_blocked`.
- [ ] Gedragsbadges voor garages blijven een latere productfase en vereisen objectieve criteria, bezwaarroute en anti-manipulatieregels.

## Herijking na fase-0-inventarisatie — bouwplan 22 september 2026

- [x] Fase 0: bestaande repository, UI, koppelingen, infrastructuur en testcommando's vastgelegd in `docs/INVENTARISATIE.md`.
- [x] Fase 1: nieuwe staff/dealer-rolvermenging wordt door databasetriggers geweigerd; bestaande gecombineerde identiteit krijgt geen dealer-RPC- of biedrechten.
- [x] Fase 1: goedgekeurde dealers vereisen TOTP/`aal2` in zowel DAL, RLS als dealer-RPC's.
- [x] Fase 1: wachtwoordherstel en globale sessie-intrekking na wachtwoordwijziging toegevoegd.
- [x] Fase 1: versieerbare veilingpolicy toegevoegd met exact 86400 seconden, uitsluitend een testminimumstap en een harde blokkade op onvolledig goedgekeurde kosteninstellingen.
- [x] Fase 1: negatieve unit- en database-tests voor MFA, identiteitsscheiding en testbeleid toegevoegd.
- [x] Fase 1: gecontroleerde admin-/dealeruitzondering voor expliciet aangewezen platformadmins toegevoegd; per account standaard uit, admin-only, MFA-verplicht, bedrijfsgescheiden en negatief getest.
- [x] Nieuwe fase 2: wachtwoordloze verkoperverificatie en beveiligd eigen dossier boven op de bestaande aanmeldwizard.
- [x] Nieuwe fase 2: verkoper ziet uitsluitend eigen aanvraag en private foto’s via vijf minuten geldige links; andere verkopers, dealers en staff-identiteiten kunnen niet koppelen.
- [x] Nieuwe fase 2: aanvullen is alleen mogelijk bij `needs_information`; daarna gaat het dossier gecontroleerd terug naar `in_review`.
- [x] Nieuwe fase 2: PostgreSQL weigert iedere publicatie zolang geen geverifieerde verkoper aan de aanvraag is gekoppeld.
- [x] Nieuwe fase 3: zichtbare biedbedragen, globale minimumstap, winnaarreservering en herstelbare sluitfunctie.
- [~] Nieuwe fase 4: afspraakvoorstellen, inspectie, apart prijsvoorstel en dubbele koopconceptbevestiging zijn lokaal gebouwd en database-side getest; browser-E2E volgt nog.
- [~] Nieuwe fase 5: provideradapter, lokaal uitgeschakelde simulator, ondertekende webhooks, overdracht, vrijgave, uitbetaling, refunds en reconciliatie zijn gebouwd en database-side getest. Een echte providersandbox en browser-E2E ontbreken nog.
- [~] Nieuwe fase 6: klachten, geblokkeerde testfactuurgegevens, operationeel dashboard, outbox-retries en een lokale geïsoleerde herstelproef zijn gebouwd; externe monitoring en productieback-ups ontbreken nog.
- [~] Nieuwe fase 7: lokaal vrijgavedossier, interne technische controle, negatieve klachttests, vijf Chrome-rookproeven, één volledige lokale Chrome-route met vier fictieve identiteiten en tijdswisselings-/policy-snapshottests. Herhaling in een afzonderlijke acceptatieomgeving, externe juridische/providergoedkeuring, onafhankelijke review en vijf tot tien echte proefdeelnemers ontbreken nog; er is geen livegangbesluit.
- [~] Nieuwe fase 8: draaiboek en harde toegangspoort in `docs/PHASE8_LIVE_PILOT.md` voorbereid. De livepilot zelf is **niet gestart**: fase-7-bewijzen, echte betaalprovider, productie-inrichting en expliciet vrijgavebesluit ontbreken.

De onderstaande oorspronkelijke voortgang blijft als technische historie behouden. Waar deze nog spreekt over besloten biedingen, geldt het nieuwe bouwplan als opvolgende productrichting.

## Fase 1 — ontwerp en fundament

- [x] Git-nulpunt en aparte fase-1-branch.
- [x] Standaard Next.js/Vercel-basis zonder Cloudflare, D1, R2 of ChatGPT-auth.
- [x] Gegevensmodel en gescheiden statusmodellen.
- [x] Supabase SSR-adapter en sessieverversing.
- [x] Dealeraccount, bedrijfsregistratie met status `pending` en wachtroute.
- [x] Beheerrol, TOTP/MFA-poort en bedrijfsgoedkeuring/blokkering.
- [x] Default-deny grants, RLS en gecontroleerde databasefuncties.
- [x] Unit-tests voor toegangsregels.
- [x] PostgreSQL/RLS-tests draaien tegen de lokale Supabase/PostgreSQL-runtime.

## Fase 2 — publieke website en aanvragen

- [x] Publieke pagina’s, metadata, sitemap en navigatie met herkenbare conceptteksten.
- [~] Zesstaps aanvraagformulier met tijdelijk concepttoken en idempotentie; databasepad is geverifieerd, browser-E2E volgt nog.
- [x] Formulier vraagt btw-/margestatus, particulier/zakelijk gebruik, onderhoudsregistratie en rook-/dierenlucht als duidelijke keuzes en valideert contactgegevens vóór upload.
- [x] RDW-opvraag via de officiële openbare kentekendataset met handmatige terugval.
- [~] Private signed upload, serverinspectie, hercodering zonder metadata en fotoreview; geautomatiseerde browser-E2E volgt nog.
- [~] De fotostap geeft vaste hoekvoorbeelden, schade-instructies en een mobiele cameraknop; HEIC-decodering blijft afhankelijk van browserondersteuning en krijgt een duidelijke terugvalmelding.
- [~] Onvoorspelbare referentie en duurzame notificatie-outbox zijn lokaal geverifieerd; Resend is optioneel en nog niet ingesteld.
- [~] Beheeroverzicht, statusovergangen, interne notities en fotocontrole; databasefuncties zijn geverifieerd, browser-E2E volgt nog.
- [~] Magic-linkverificatie en eigen verkopersdossier zijn lokaal gebouwd en database-side getest; volledige browser-E2E van de e-mailklik volgt nog.

## Fase 3 — dealerportaal en biedingen

- [~] Gepubliceerd aanbod, filters, private gecontroleerde foto’s en detailpagina werken lokaal; geautomatiseerde browser-E2E volgt nog.
- [x] Nieuwe publicaties starten op database-transactietijd en duren exact 86400 seconden.
- [x] Alle goedgekeurde garages zien dezelfde bedragen en tijdstippen, zonder bedrijfsidentiteit van concurrenten of verkopersgegevens.
- [x] De testminimumstap komt uit een onveranderlijke policy-snapshot per ronde: €100 onder €5.000 en €150 vanaf €5.000, ook boven €10.000.
- [x] Transactionele append-only biedfunctie gebruikt een biedrondelock, `clock_timestamp()`, globale hoogste bieding en idempotentie.
- [x] Negatieve rechten-, deadline-, minimumstap-, append-only- en idempotentietests slagen tegen lokale PostgreSQL.
- [x] Twee echte gelijktijdige databaseverbindingen bewijzen dat gelijke biedingen exact één winnaar opleveren.
- [x] Sluiten is idempotent, maakt maximaal één winnaarreservering en maakt geen koop of verkoopdossier.
- [x] Beheer kan een definitief afgesloten ronde gemotiveerd opnieuw starten; oude biedingen blijven historie, de nieuwe ronde is leeg en vervolgafhandeling blokkeert herstart.
- [x] Beheer heeft een apart overzicht van lopende veilingen met eindtijd, hoogste bod, biedaantal en uitsluitend voor staff zichtbare bedrijfsnamen.
- [~] `close_due_bid_rounds` kan verlopen rondes herstelbaar in batches sluiten; het externe schema dat deze functie periodiek aanroept wordt pas bij hosting ingericht.
- [~] Ieder opgeslagen bod, iedere nieuwe publicatie, iedere overbieding en iedere uitslag krijgt transactioneel een outboxnotificatie; Resend-verzending is afhankelijk van de apart ingestelde worker.
- [x] Er is geen productlimiet van vijf garages; alle goedgekeurde garages krijgen hetzelfde aanbod en de beheerpagina toont alle aanmeldingen met aantallen.
- [x] Reviewfix: tijdelijke uploadpaden zijn gescheiden van definitieve, alleen server-schrijfbare fotopaden.
- [x] Reviewfix: rate limiting gebruikt geen wijzigbare User-Agent en concepttokens blijven geldig bij een netwerkovergang.

## Fase 4 — afhandeling en kwaliteitscontrole

- [x] Alleen de gereserveerde hoogste bieder kan één tot drie afspraakmomenten voorstellen; de verkoper kiest actief of vraagt een alternatief.
- [x] Verkoperscontact wordt pas aan de winnaar vrijgegeven nadat de verkoper exact één moment heeft bevestigd.
- [x] Inspectie, kilometerstand, bevindingen, afwijkingen en maximaal acht private inspectiefoto’s worden apart geregistreerd.
- [x] Een lager voorstel verandert nooit het oorspronkelijke bod en vereist een afzonderlijke actieve verkopersacceptatie.
- [x] Dealer en verkoper bevestigen vervolgens ieder exact hetzelfde voertuig, bedrag en dezelfde voorwaardenversie; pas beide bevestigingen leveren status `agreed` op.
- [x] Afwijzing schakelt niet automatisch door naar een tweede bieder; beheer krijgt een vervolgtaak.
- [x] Afspraak-, inspectie-, prijs- en koopreacties schrijven transactioneel duurzame outboxmeldingen; een e-mailstoring draait de bedrijfsstatus niet terug.
- [x] Contactmomenten blijven uitsluitend beheerinformatie met auditspoor.
- [x] Materiële wijzigingen trekken de publicatie in, annuleren de ronde en bewaren versie- en biedhistorie; herpublicatie maakt een nieuwe versie.
- [~] Voorwaarden zijn bewust `test`; contractreview, browser-E2E, externe beveiligingsreview en daadwerkelijke herstelproef blijven vóór livegang verplicht.

## Fase 5 — betaaladapter en sandbox

- [x] Providerneutrale adaptergrens met uitsluitend een lokale `simulated/test`-implementatie.
- [x] Simulator staat database-side standaard uit en wordt door de server geweigerd in een productie-runtime.
- [x] Fictieve ontvanger-onboarding bewaart geen echte identiteit, IBAN of bankgegevens.
- [x] Checkout gebruikt het bevestigde voertuigbedrag; onbesliste behandelingskosten blijven expliciet `test_unconfigured` en €0.
- [x] Alleen ondertekende testwebhooks kunnen betaalstatus wijzigen; retourpagina’s veranderen niets.
- [x] Bedrag, EUR-valuta, ontvanger, eventvolgorde en idempotentie worden in PostgreSQL opnieuw gecontroleerd.
- [x] Gedeeltelijk, mislukt, verlopen, ontvangen/vastgehouden, vrijgave, uitbetaling, geschil en refund hebben afzonderlijke statussen.
- [x] Vrijgave vereist bevestiging door verkoper en dealer plus aparte testcontrole van de vrijwaring door beheer.
- [x] Refundverzoeken en providerevents zijn idempotent; dagelijkse reconciliatielogica detecteert afwijkingen.
- [x] Statuswijzigingen schrijven transactioneel audit- en outboxregels.
- [~] Lokale database- en handtekeningtests slagen; geautomatiseerde browser-E2E en een officiële providersandbox volgen na provideracceptatie.
- [ ] Echte provider, echte onboarding, echte checkout, productie-webhook, fee-split en uitbetaling blijven geblokkeerd.

## Fase 6 — klachten en operatie

- [x] Verkopers en betrokken winnende dealers kunnen een afgeschermd klachtendossier openen met categorie, referentie en tijdlijn.
- [x] Bewijsafbeeldingen worden server-side gecontroleerd, opnieuw als JPEG opgeslagen en alleen via vijf minuten geldige links getoond.
- [x] Een klacht over een als platformverbonden gemarkeerde koper kan niet zonder aantoonbare tweede medewerker worden afgerond.
- [x] Klachtberichten, bewijs, tweede beoordeling, status en uitkomst krijgen auditregistratie zonder bewijsinhoud naar technische logs te kopiëren.
- [x] Platformfactuur- en correctierecords staan los van de autokoop en blijven `draft_blocked`, `test`, €0 en fiscaal `unconfigured`.
- [x] De outbox-worker gebruikt leases, `SKIP LOCKED`, provider-idempotentie, maximaal acht pogingen en oplopende retrytermijnen.
- [x] Operationeel beheer toont wachtrijen, klachten, incidenten, betaalreconciliatie, worker-runs en herstelbewijs.
- [x] Een strikt lokaal script heeft een database-export naar een tijdelijke database en een private Storage-checksumherstel aantoonbaar doorlopen.
- [~] Resend-bezorging, periodieke jobs en dagelijkse reconciliatie zijn voorbereid maar default-off tot hosting en afzender zijn goedgekeurd.
- [ ] Productieback-upretentie, versleutelde opslag, externe uptimebewaking, storingscontact en onafhankelijke herstelcontrole blijven livegangblokkades.

## Fase 7 — acceptatie en Vercel Preview

- [x] Volledige lokale browserroute met verkoper, twee dealers en beheerder is geautomatiseerd doorlopen.
- [x] Node.js is voor lokale ontwikkeling, CI en Vercel vastgezet op 22.x.
- [x] Vercel-build weigert ontbrekende/onjuiste Preview-waarden, localhost, hergebruikte geheimen, de betaalsimulator en een niet-goedgekeurde productiedeployment.
- [x] Niet-schrijvende Preview-smoketest, minimale statusroute, repositoryscan en GitHub-controle zijn voorbereid.
- [x] Het draaiboek voor een afzonderlijke acceptatieomgeving staat in `docs/VERCEL_PREVIEW.md`.
- [ ] Bedrijfsaccounts, privérepository, acceptatie-Supabase en afgeschermde Vercel Preview worden pas na afzonderlijke toestemming extern ingericht.
- [ ] Gebruikersproef, onafhankelijke beveiligingsreview, provideracceptatie en juridische/commerciële keuzes blijven livegangblokkades.
