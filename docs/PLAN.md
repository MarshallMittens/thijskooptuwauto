# Bouwplan en voortgang

Legenda: `[x]` gebouwd en lokaal geverifieerd, `[~]` gebouwd maar nog niet volledig end-to-end of extern gekoppeld, `[ ]` nog niet gebouwd.

## Publicatie op eigen domein — 26 november 2026

- [x] De eigenaar heeft publicatie uitdrukkelijk toegestaan. Het password-only besluit voor dealer en beheer blijft gelden; alleen de keuze voor betaalde hosting staat nog open. Er is geen abonnement aangepast.
- [x] Vercel CLI-login geslaagd; project `prj_GP6uLZmzi6epfLjNtn66QAghXCsR` is aan `MarshallMittens/thijskooptuwauto`, branch `main`, gekoppeld. De projectinstelling Node.js is van 24.x naar 22.x gezet.
- [x] Repositorycontrole (312 bestanden), lint, TypeScript, 69 unit-tests en build zijn op 26 november geslaagd. SQL-tests zijn niet herhaald omdat de Docker-engine niet beschikbaar is; de 398 geïsoleerde SQL-controles en gerichte password-only browserproef van 20 november blijven eerder lokaal bewijs voor dezelfde code.
- [~] DNS voor apex (`64.29.17.1`, `216.198.79.1`) en `www` (`7f9993a3a650ace3.vercel-dns-017.com.`) bereikt Vercel. HTTP geeft echter `404 DEPLOYMENT_NOT_FOUND` en de HTTPS-handshake mislukt; de website werkt nog niet op het eigen domein.
- [ ] Commercieel geschikte hosting kiezen. Het team is nog Hobby, dat volgens de [Vercel-voorwaarden](https://vercel.com/legal/terms#hobby-plan) uitsluitend voor persoonlijk/niet-commercieel gebruik is. De keuze voor Pro is nog open; [Pricing](https://vercel.com/pricing) vermeldt $20 per maand exclusief btw met mogelijk aanvullende verbruikskosten.
- [ ] Release `d49a6d9` naar de gekoppelde repository brengen; GitHub staat nog op `773f743`. De acceptatiealias geeft HTTP 200 voor de oude versie `b90be6c`.
- [ ] Productievariabelen, Supabase, mail en exacte Auth-callbacks inrichten. Alle tien aangetroffen Vercel-variabelen hebben alleen scope Preview; Production heeft geen eigen variabelen en `RESEND_API_KEY` ontbreekt als variabelenaam.
- [ ] Password-only migratie `202611200001_password_only_portal_access.sql` remote toepassen vóór uitrol van de nieuwe applicatie. Deze migratie is nog niet remote uitgevoerd.
- [ ] Een geslaagde productie-deployment maken: de laatste staat op `ERROR` met `npm run build exited 1`. Toevoegen van het hoofddomein werd met HTTP 400 geweigerd omdat deze deployment is mislukt. Alleen `thijskooptuwauto.vercel.app` is nu gekoppeld; daarna apex en `www` toevoegen en HTTPS, redirects, aanvragen, foto’s, rollen en mailbezorging controleren.

De oudere planningsregels hieronder zijn historie. Zij vragen geen hernieuwde publicatietoestemming; de actuele technische status en nog open betaalde hostingkeuze hierboven gaan voor. Vervallen betaal- en simulatoronderdelen blijven uit.

## Inlogkeuze eigenaar — 20 november 2026

- [x] De volledige dealer- en beheeromgeving gebruikt alleen e-mail en wachtwoord. Applicatie en de nieuwe SQL-migratie ondersteunen sessies zonder TOTP; de eigenaar accepteert expliciet het verhoogde risico van een ontbrekende tweede factor.
- [x] Rollen, handmatige garagegoedkeuring, account- en bedrijfsblokkades, actieve lidmaatschappen en eigenaarschap blijven vereist. De volledige lokale SQL-suite slaagt met 11 bestanden en 398 controles in een geïsoleerde omgeving.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` (17 bestanden, 69 tests) en `npm run build` zijn lokaal geslaagd op 20 november 2026.
- [x] De gerichte Playwright password-only toegangstest slaagt lokaal: 1 test met admin, operator, goedgekeurde/pending/geblokkeerde dealer, anonieme toegang en veilige legacyredirects. Dit is geen herhaling van de volledige historische koop-/betaalworkflow.
- [x] Het oude `/auth/mfa`-pad verwijst intern naar het rolgebonden portaal. De lokale MFA-configuratie wijzigt hosted Supabase Auth-instellingen niet automatisch en verwijdert geen bestaande factorrecords.
- [ ] Eerst `202611200001_password_only_portal_access.sql` toepassen op de doelomgeving, daarna de applicatie uitrollen en de toegangscontroles controleren. Oude migraties blijven ongewijzigd; de lokale resultaten bevestigen geen online deployment of online toegangscontrole.

Status op 26 november: lokaal getest; de password-only versie en migratie zijn nog niet online. Hostingauthenticatie is geslaagd. De nog open hostingkeuze en technische vervolgstappen staan bovenaan dit document.

De onderstaande historische MFA-/`aal2`-aannames zijn door dit eigenaarbesluit vervangen. Historische betaal- en simulatoronderdelen blijven buiten gebruik en worden door deze inlogwijziging niet opnieuw geactiveerd.

## Verwerking praktijktestfeedback — 12 oktober 2026

- [x] Bedankpagina toont het kenteken als herkenbare dossiernaam; de onvoorspelbare referentie blijft alleen als technische beveiligingscode beschikbaar.
- [x] Een al ingelogde verkoper kan een nieuwe aanvraag expliciet koppelen; de database blijft het geverifieerde e-mailadres vergelijken en weigert dealer-/staffaccounts.
- [x] Contactgegevens worden vóór fotoverwerking met hetzelfde Zod-schema als de server gecontroleerd, inclusief dubbele punten in een e-maildomein.
- [x] Beheer kan materiële voertuiggegevens gecontroleerd aanpassen; een bestaande veiling wordt daarbij ingetrokken in plaats van stilzwijgend gewijzigd.
- [x] Fotogids, mobiele cameraknop, aparte schadefoto-instructie en de tekst dat foto’s niet met AI worden aangevuld zijn toegevoegd.
- [x] Btw-/margestatus, particulier/zakelijk gebruik, rook-/dierenlucht en fysieke/digitale onderhoudsregistratie worden als voertuigcontext opgeslagen.
- [x] Lopende veilingen hebben een apart staff-overzicht met biedaantal, hoogste bod en biedende bedrijven.
- [x] Veilingen kunnen gecontroleerd opnieuw worden gestart; biedstappen zijn €100 onder €10.000 en €150 vanaf €10.000.
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
- [x] Historisch fase 1: TOTP/`aal2` was vereist in DAL, RLS en dealer-RPC's; vervangen door het inlogbesluit van 20 november 2026.
- [x] Fase 1: wachtwoordherstel en globale sessie-intrekking na wachtwoordwijziging toegevoegd.
- [x] Fase 1: versieerbare veilingpolicy toegevoegd met exact 86400 seconden, uitsluitend een testminimumstap en een harde blokkade op onvolledig goedgekeurde kosteninstellingen.
- [x] Historisch fase 1: negatieve unit- en database-tests voor MFA, identiteitsscheiding en testbeleid toegevoegd. De oude verplichte MFA-verwachtingen zijn vervangen door de password-only keuze; identiteitsscheiding en testbeleid blijven vereist.
- [x] Fase 1: gecontroleerde admin-/dealeruitzondering voor expliciet aangewezen platformadmins toegevoegd; per account standaard uit, admin-only, bedrijfsgescheiden en negatief getest. De eerdere MFA-verplichting is vervangen door het inlogbesluit van 20 november 2026.
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
- [x] Beheerrol en bedrijfsgoedkeuring/blokkering. De oorspronkelijke TOTP/MFA-poort is historische functionaliteit, vervangen door het inlogbesluit van 20 november 2026.
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
- [x] De testminimumstap komt uit een onveranderlijke policy-snapshot per ronde: €100 onder €10.000 en €150 vanaf €10.000.
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

Deze voortgang beschrijft de historische sandboxbouw. Vervallen betaal- en simulatorfuncties blijven buiten gebruik; de password-only wijziging activeert ze niet opnieuw.

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
- [x] ‘Meldingen & controles’ toont de e-mailwachtrij, mislukte verzendingen, klachten, open problemen en herstelcontroles in begrijpelijke taal. Oude testbetalingen en testdocumenten staan niet meer in dit overzicht.
- [x] Dealer- en beheerpagina’s delen dezelfde navigatieknoppen: oranje omlijnd, huidige pagina gevuld, met een aparte ingang voor Kosten & facturen en een aanraakvriendelijke mobiele indeling.
- [x] Een strikt lokaal script heeft een database-export naar een tijdelijke database en een private Storage-checksumherstel aantoonbaar doorlopen.
- [~] Resend-bezorging, periodieke jobs en dagelijkse reconciliatie zijn voorbereid maar default-off tot hosting en afzender zijn goedgekeurd.
- [ ] Productieback-upretentie, versleutelde opslag, externe uptimebewaking, storingscontact en onafhankelijke herstelcontrole blijven livegangblokkades.

## Fase 7 — acceptatie en Vercel Preview

- [x] Volledige lokale browserroute met verkoper, twee dealers en beheerder is geautomatiseerd doorlopen.
- [x] Node.js is voor lokale ontwikkeling, CI en Vercel vastgezet op 22.x.
- [x] Vercel-build weigert ontbrekende/onjuiste Preview-waarden, localhost, hergebruikte geheimen, de betaalsimulator en een niet-goedgekeurde productiedeployment.
- [x] Niet-schrijvende Preview-smoketest, minimale statusroute, repositoryscan en GitHub-controle zijn voorbereid.
- [x] Het draaiboek voor een afzonderlijke acceptatieomgeving staat in `docs/VERCEL_PREVIEW.md`.
- [~] Historische voorbereiding: bedrijfsaccounts, privérepository, acceptatie-Supabase en afgeschermde Vercel Preview. De publicatieopdracht is op 26 november expliciet gegeven; de actuele hostingstatus en resterende technische stappen staan bovenaan dit document.
- [ ] Gebruikersproef, onafhankelijke beveiligingsreview, provideracceptatie en juridische/commerciële keuzes blijven livegangblokkades.
