# Bouwplan en voortgang

## Eén handeling voor accepteren en fotokruisjes — 27 november 2026

- [x] In het aanvraagdossier staat `Auto goedkeuren en aanbieden`: statusstappen, beoordeling van overgebleven pending foto's en publicatie gebeuren samen. De veiling begint direct voor 24 uur. Afgewezen of verwijderde foto's worden overgeslagen.
- [x] De expliciete eerdere keuze dat de particulier geen extra bevestiging hoeft te doen, is verwerkt: beheeracceptatie autoriseert publicatie. Het e-mailadres wordt niet als geverifieerd gemarkeerd en er ontstaat geen automatische toegang tot een verkopersdossier.
- [x] Elke foto heeft een aanraakvriendelijk kruisje. De foto verdwijnt uit de aanvraagweergaven en dealer-aanbod; een afgeschermd historisch record blijft bewaard. De laatste goedgekeurde foto van een aangeboden, niet-gearchiveerde auto kan niet zomaar weg.
- [x] Lint, TypeScript, 69 unit-tests en build slagen. De volledige lokale SQL-suite slaagt met 508 controles in 14 bestanden, waaronder 47 nieuwe controles op toegang, complete gegevens, publicatie, rollback, fotofilters, Storage en audit.
- [x] De gerichte lokale browserproef slaagt: foto met één klik weghalen, aanvraag met één klik publiceren zonder verkopersverificatie, dealer ziet auto en alleen de bedoelde foto, laatste gepubliceerde foto blijft beschermd. Online publicatiebewijs volgt in `docs/DEPLOYMENT.md`. Tests wijzigen uitsluitend fictieve lokale aanvragen; mailbezorging wordt hiermee niet geactiveerd.

## Eenvoudige veilingherstart — 27 november 2026

- [x] Na afloop verschijnt `Opnieuw starten voor 24 uur` direct in het aanvragenoverzicht en bij de biedronde in het dossier. De bevestiging bevat een aanpasbare voorgestelde reden.
- [x] De nieuwe RPC `admin_reopen_auction_24h` rondt een verlopen ronde zo nodig af en roept de bestaande herstartfunctie aan in één transactie. Een fout draait beide stappen terug. Exact 86.400 seconden, lege nieuwe biedlijst, historische biedingen en bestaande blokkades blijven behouden.
- [x] De lokale SQL-suite slaagt met 461 controles in 13 bestanden, waaronder 32 nieuwe controles voor toegang, tijdgrens, rollback, idempotentie, oude winnaar, archief en overzicht. Lint, TypeScript, 69 unit-tests en build slagen.
- [x] De lokale browserproef slaagt: verlopen ronde vanuit het dossier, afgeronde ronde vanuit het overzicht, annuleren, voorgestelde reden, exacte nieuwe looptijd en nieuw actief dealeraanbod. Acceptatiemigratie is toegepast en Preview `dpl_HbF7yfTrRvKVgw3g7uWbx57xzcMx` is `READY` met codecommit `3c80101`; alle drie aliases zijn bijgewerkt. HTTPS-health en gastredirects slagen op elk adres. Details staan in `docs/DEPLOYMENT.md`. Er is geen echte veiling door de tests herstart.

## Archiveren van autoaanvragen — 27 november 2026

- [x] Alleen admin krijgt een kruisje in het aanvragenoverzicht, op de thumbnail, bij lopende veilingen en op aanbodkaarten wanneer die admin ook dealer is.
- [x] Een bevestiging en reden zijn verplicht. Archiveren stopt actieve/geplande rondes, haalt de auto uit dealer-aanbod en bewaart foto's, biedingen, dossiers en auditgegevens.
- [x] Het archief is bereikbaar via `Bekijk archief`. Een lopende afspraak, koopafhandeling of geschil blokkeert archiveren; herpublicatie en nieuwe afhandeling van een gearchiveerde aanvraag worden database-side geweigerd.
- [x] Lint, TypeScript, 69 unit-tests en build slagen. De volledige geïsoleerde SQL-suite slaagt met 429 controles in 12 bestanden; de gerichte lokale Playwright-proef slaagt voor thumbnail, rij, annuleren, archief en weigering voor gewone dealers.
- [x] Acceptatiemigratie toegepast; Preview `dpl_7ov2sAAgv4NvrmUUgHugc1sbAFU2` is `READY` met codecommit `3d96b35`. Alle drie aliases zijn bijgewerkt en zeven publieke online proeven slagen. De releasegegevens staan in `docs/DEPLOYMENT.md`. Er is geen echte auto door deze tests gearchiveerd; mailbezorging is hiermee niet ingericht of getest.

Update 27 november: de knop 'Klachten' is op verzoek uit de dealernavigatie verwijderd en staat online op alle drie de testadressen. Codeversie `bb6f1fd`; het actuele deploymentdoel staat bovenaan `DEPLOYMENT.md`. Lint, TypeScript, 69 unit-tests, build en repositorycontrole slagen. Health en loginredirect zijn op alle drie de adressen gecontroleerd; de ingelogde omgeving is niet met een echt account getest. SQL-tests zijn overgeslagen omdat Docker niet beschikbaar is; er is geen databasewijziging.

Laatste testrelease op 26 november: `ea4a128`, met het herstelde taalmenu. Alle vier de talen zijn zichtbaar vóór de vaste header; gecontroleerd op vier schermbreedtes en op alle drie de webadressen. De zeven publieke browserproeven op `www` slagen opnieuw in 23,0 seconden. De echte Home-flow voor `05-pk-rb` haalt RDW-gegevens op met HTTP 200 en vult TOYOTA / TOYOTA RAV4 in. Er is geen aanvraag ingediend of e-mail verstuurd.

Legenda: `[x]` gebouwd en lokaal geverifieerd, `[~]` gebouwd maar nog niet volledig end-to-end of extern gekoppeld, `[ ]` nog niet gebouwd.

## Gratis prototype en latere publicatie — 26 november 2026

- [x] Taalmenu-overlap hersteld: alleen bij een geopende taalkeuze komt de voordelenbalk met `has-[details[open]]:z-[60]` vóór de sticky header. Acht lokale controles op 390, 768, 850 en 1440 pixels, telkens home en contact, bevestigen alle vier zichtbare taalregels en behoud van het vaste hoofdmenu. Online raakpunttests van alle taalregels slagen op acceptatie, apex en `www`. Lint, TypeScript, 69 unit-tests en build geslaagd. Geen databasewijziging of nieuwe SQL-test; Docker was niet beschikbaar.
- [x] De eigenaar heeft publicatie toegestaan en vervolgens om gratis testen gevraagd. De huidige versie blijft uitsluitend een niet-commercieel prototype met fictieve aanvragen en biedingen op bestaande acceptatie/Preview, nu ook via hoofddomein en `www` als directe deploymentaliases. Het password-only besluit blijft gelden; er is geen abonnement of nieuwe Production-build geactiveerd.
- [x] Vercel CLI-login geslaagd; project `prj_GP6uLZmzi6epfLjNtn66QAghXCsR` is aan `MarshallMittens/thijskooptuwauto`, branch `main`, gekoppeld. De projectinstelling Node.js is van 24.x naar 22.x gezet.
- [x] Repositorycontrole (312 bestanden), lint, TypeScript, 69 unit-tests en build zijn op 26 november geslaagd. SQL-tests zijn niet herhaald omdat de Docker-engine niet beschikbaar is; de 398 geïsoleerde SQL-controles en gerichte password-only browserproef van 20 november blijven eerder lokaal bewijs voor dezelfde code.
- [x] [Hoofddomein](https://thijskooptuwauto.nl/) en [www](https://www.thijskooptuwauto.nl/) zijn direct aan dezelfde `READY`-Preview gekoppeld. Onafhankelijke controles om 18:41 CET geven voor beide HTTPS HTTP 200, normale TLS-validatie en dezelfde inhoud/ETag als de acceptatiealias. Het automatisch aangemaakte gratis `www`-certificaat bevat SAN `DNS:www.thijskooptuwauto.nl`; de gemelde www-404/certificaatfout is opgelost. DNS en mailboxrecords zijn niet gewijzigd.
- [x] Gratis prototypepad bevestigd: [Vercel-medewerker Anshuman Bhardwaj](https://community.vercel.com/t/is-hobby-plan-suitable-for-a-saas-prototype/7205) staat ideeën en prototypes op Hobby toe. Een Pro-keuze blokkeert dit niet-commerciële testen niet. Voor echte commerciële livegang blijft passende hosting afzonderlijk nodig volgens de [Vercel-voorwaarden](https://vercel.com/legal/terms#hobby-plan).
- [x] Nieuwste taalmenu-Preview is `READY` als `dpl_DKVACbTsqULG2AyUw6hgs5n9CkpX`, deploycommit `ea4a1283f83ad00a0f2be04aa9d8650a856d8ba8`: [deployment-URL](https://thijskooptuwauto-nuqzt14ye-jeroenderaef-6403.vercel.app), Node.js 22.x, functieregio `fra1`. Acceptatiealias, hoofddomein en `www` zijn naar deze nieuwe versie omgezet.
- [x] Alle zeven publieke Playwright-proeven op de nieuwe versie via `www` slagen in 23,0 seconden, inclusief health, formulier tot bevestiging, mobiel/layout en beschermde redirects. Geen aanvraag ingediend of e-mail verstuurd. De aliases zijn publiek bereikbaar; er is geen private Vercel-toegangslaag aangetoond. Authenticatie en RLS blijven dealer-/beheerdata afschermen.
- [x] Echte RDW-opvraag via het www-homeformulier gaf HTTP 200 met `found: true`; `TOYOTA` en `TOYOTA RAV4` werden automatisch ingevuld met een succesmelding. Hiervoor is geen RDW-code gewijzigd.
- [ ] Bij volgende Preview-releases alle drie directe aliases na controle handmatig naar de nieuwe geslaagde deployment zetten: acceptatiealias, hoofddomein en `www`. Ze verwijzen nu vast naar `dpl_DKVACbTsqULG2AyUw6hgs5n9CkpX`.
- [ ] Ingelogde online E2E en mailbezorging afzonderlijk testen; deze zijn niet uitgevoerd. `RESEND_API_KEY` ontbreekt nog. De 398 SQL-controles van 20 november zijn door de ontbrekende Docker-engine niet opnieuw uitgevoerd.
- [ ] Voor latere commerciële livegang een geschikt plan of andere geschikte hosting kiezen; [Pricing](https://vercel.com/pricing) vermeldt Pro vanaf $20 per maand exclusief btw met mogelijk aanvullende verbruikskosten. Deze betaalde keuze is geen voorwaarde voor de huidige prototypeproef.
- [ ] Productievariabelen, Supabase, mail en exacte Auth-callbacks inrichten. Alle tien aangetroffen Vercel-variabelen hebben alleen scope Preview; Production heeft geen eigen variabelen en `RESEND_API_KEY` ontbreekt als variabelenaam.
- [x] Password-only migratie `202611200001_password_only_portal_access.sql` succesvol toegepast op het bestaande acceptatie-Supabase-project vóór de nieuwe Preview; de gelezen migratielijst bevestigt deze versie lokaal en remote. Rollen, blokkades, objectrechten en bestaande factorrecords blijven behouden. Productie is hiermee niet gemigreerd.
- [ ] Voor latere commerciële productie een geslaagde Production-deployment en formele projectdomeinen inrichten: de laatste Production-build blijft `ERROR` met `npm run build exited 1`, en de Project Domains-API vermeldt alleen `thijskooptuwauto.vercel.app`. De nu werkende directe prototypealiases vervangen deze latere productie-inrichting niet.

De oudere planningsregels hieronder zijn historie. Zij vragen geen hernieuwde publicatietoestemming; de actuele prototypevoortgang hierboven gaat voor. De latere commerciële hostingkeuze blokkeert gratis niet-commercieel testen niet. Vervallen betaal- en simulatoronderdelen blijven uit.

## Inlogkeuze eigenaar — 20 november 2026

- [x] De volledige dealer- en beheeromgeving gebruikt alleen e-mail en wachtwoord. Applicatie en de nieuwe SQL-migratie ondersteunen sessies zonder TOTP; de eigenaar accepteert expliciet het verhoogde risico van een ontbrekende tweede factor.
- [x] Rollen, handmatige garagegoedkeuring, account- en bedrijfsblokkades, actieve lidmaatschappen en eigenaarschap blijven vereist. De volledige lokale SQL-suite slaagt met 11 bestanden en 398 controles in een geïsoleerde omgeving.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` (17 bestanden, 69 tests) en `npm run build` zijn lokaal geslaagd op 20 november 2026.
- [x] De gerichte Playwright password-only toegangstest slaagt lokaal: 1 test met admin, operator, goedgekeurde/pending/geblokkeerde dealer, anonieme toegang en veilige legacyredirects. Dit is geen herhaling van de volledige historische koop-/betaalworkflow.
- [x] Het oude `/auth/mfa`-pad verwijst intern naar het rolgebonden portaal. De lokale MFA-configuratie wijzigt hosted Supabase Auth-instellingen niet automatisch en verwijdert geen bestaande factorrecords.
- [x] `202611200001_password_only_portal_access.sql` is op 26 november remote op acceptatie toegepast en de bijbehorende Preview is `READY`. Health en zeven publieke online proeven slagen; ingelogde online toegangscontrole is niet uitgevoerd. Oude migraties blijven ongewijzigd en productie is niet gemigreerd.

Status op 26 november: acceptatiemigratie toegepast en nieuwste taalmenu-Preview `READY` via alle drie aliases met geldig HTTPS. Zeven publieke proeven via `www`, taalmenucontroles op alle drie domeinen en echte RDW-formulierinvulling slagen; het hoofdmenu blijft sticky. Ingelogde online E2E en mail zijn niet getest. Geen abonnement of nieuwe Production-build geactiveerd; commerciële productie blijft een aparte vervolgstap.

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
