# Publicatie, migraties en herstel

De eigenaar heeft op 26 november 2026 expliciet toestemming gegeven voor publicatie op het eigen domein. De productieomgeving werkt daar nog niet; alleen de betaalde hostingkeuze wacht nog op de gebruiker. Er is geen abonnement aangepast. De technische voorbereidingen hieronder vallen binnen de gegeven publicatieopdracht; historische verwijzingen naar een nog te vragen publicatieakkoord zijn daarmee vervangen. De actuele domein- en hostingstatus staat in [DOMEINOVERDRACHT.md](DOMEINOVERDRACHT.md).

## Publicatiestatus — 26 november 2026

- Vercel CLI-login geslaagd. Het bestaande project `prj_GP6uLZmzi6epfLjNtn66QAghXCsR` is verbonden met `MarshallMittens/thijskooptuwauto`, branch `main`. Node.js is via de project-API van 24.x naar 22.x gewijzigd.
- Teamplan is nog Hobby. De [Vercel-voorwaarden](https://vercel.com/legal/terms#hobby-plan) staan Hobby uitsluitend voor persoonlijk/niet-commercieel gebruik toe. De Pro-keuze is nog open; [Pricing](https://vercel.com/pricing) vermeldt $20 per maand exclusief btw en mogelijk aanvullende verbruikskosten. Geen betaald plan starten zonder die keuze.
- De laatste productie-deployment is `ERROR` (`npm run build exited 1`). Alle tien aangetroffen variabelen hebben alleen scope Preview; Production heeft nog geen eigen variabelen. Er is geen `RESEND_API_KEY`-variabelenaam aangetroffen. Productie-Supabase, geheimen, mailbezorging, live `APP_URL` en exacte Auth-callbacks moeten nog worden ingericht en gecontroleerd.
- DNS voor apex en `www` bereikt Vercel, maar HTTP geeft `404 DEPLOYMENT_NOT_FOUND` en de HTTPS-handshake mislukt. Alleen `thijskooptuwauto.vercel.app` is aan het project gekoppeld. Toevoegen van het hoofddomein werd geweigerd met HTTP 400 omdat de laatste productie-deployment is mislukt; apex en `www` zijn nog niet gekoppeld.
- Lokale releasecommit is `d49a6d9`; GitHub staat nog op `773f743`. De acceptatiealias geeft HTTP 200 voor de oudere versie `b90be6c`. De password-only migratie `202611200001_password_only_portal_access.sql` is nog niet remote toegepast.

Werkvolgorde: hostingkeuze afronden, actuele release vastleggen in de gekoppelde repository, productieconfiguratie en database voorbereiden, migraties toepassen, daarna de applicatie deployen. Maak eerst een geslaagde productie-deployment, koppel vervolgens het hoofddomein en `www` en verifieer HTTPS en de volledige aanvraag-/login-/mailroute. Omgevingsvalidatie en rol-/RLS-controles blijven actief; testbetalingen worden niet hersteld.

Lokaal op 26 november geslaagd: repositorycontrole met 312 bestanden, lint, TypeScript, 69 unit-tests en build. SQL-tests zijn niet herhaald omdat de Docker-engine niet beschikbaar was. De 398 SQL-controles en gerichte password-only browserproef van 20 november zijn eerder lokaal bewijs voor dezelfde code, geen nieuwe controle van de hosted omgeving.

## Omgevingen

- Lokaal: Supabase CLI en fictieve gegevens.
- Acceptatie: afzonderlijk Supabase-project en Vercel Preview/acceptatieconfiguratie.
- Productie: afzonderlijk Supabase-project, Vercel-productieomgeving en Resend-domein.

Gebruik per omgeving afzonderlijke sleutels. Kies bij inrichting nabijgelegen ondersteunde EU-regio’s voor database en serverfuncties.

## Benodigde fase-2-variabelen

- `APP_URL`: publieke origin zonder pad.
- `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publieke projectconfiguratie.
- `SUPABASE_SERVICE_ROLE_KEY`: alleen server-side voor afgebakende concept-, upload- en notificatieroutes.
- `REQUEST_FINGERPRINT_SECRET`: een willekeurige waarde van minimaal 32 tekens per omgeving voor gehashte rate-limitidentifiers.
- `DRAFT_TOKEN_SECRET`: een afzonderlijke willekeurige waarde van minimaal 32 tekens waarmee stabiele, IP-onafhankelijke conceptcapabilities worden afgeleid.
- `RDW_APP_TOKEN`: optioneel; openbare RDW-opvragen werken zonder token binnen de actuele limieten.
- `RESEND_API_KEY`: pas instellen na eigen account- en domeinverificatie. De app gebruikt standaard `Thijskooptuwauto <info@thijskooptuwauto.nl>` als afzender; `RESEND_FROM_EMAIL` is alleen een optionele overschrijving.

De particuliere ontvangstbevestiging gebruikt de banner `public/emails/bedankt-autoaanmelding.png`, een persoonlijk bericht, voertuiggegevens, een kentekenweergave en de tekstuele e-mailhandtekening van Thijs. Zowel directe verzending als de outbox-worker gebruiken dezelfde sjabloon en een tekstversie zonder afbeeldingen. `APP_URL` moet naar de publiek bereikbare website wijzen, zodat mailprogramma’s de banner kunnen laden. Antwoorden gaan naar `info@thijskooptuwauto.nl`. De banner bevat geen verkopersgegevens; private voertuigfoto’s worden niet publiek gemaakt of als openbare e-mailafbeelding gebruikt.
- `PAYMENT_SIMULATOR_ENABLED`: blijft leeg of `false`; vervallen betaal- en simulatoronderdelen worden niet opnieuw geactiveerd.
- `PAYMENT_SIMULATOR_WEBHOOK_SECRET`: historische sandboxvariabele; voor deze wijziging niet activeren of hergebruiken voor een echte provider.
- `OPERATIONS_JOB_SECRET`: minimaal 32 willekeurige tekens, alleen server-naar-server voor operationele routes.
- `OUTBOX_DELIVERY_ENABLED`: standaard `false`; pas `true` na afzenderverificatie, sjablooncontrole en planning van de worker.
- `PRODUCTION_DEPLOYMENT_APPROVED`: blijft `false` voor lokaal en Preview. Voor de door de eigenaar op 26 november toegestane productiepublicatie wordt deze in de productieconfiguratie expliciet `true`; de overige validatievoorwaarden blijven vereist.

Zet geheimen nooit in Git, browsercode of chat. Gebruik aparte waarden voor development, preview en productie.

De concrete, niet-productieve eerste Vercel-proef staat in `docs/VERCEL_PREVIEW.md`. De build controleert op Vercel automatisch dat verplichte waarden aanwezig zijn, HTTPS gebruiken, geen localhost bevatten, afzonderlijke geheimen gebruiken en de betaalsimulator niet activeren.

## Voor publicatie

1. Infrastructuuraccounts onder eigendom van Thijskooptuauto maken en afzonderlijk beveiligen. Eventuele MFA op hosting- of leveranciersaccounts staat los van de password-only applicatie-inlog voor dealers en beheer.
2. Privérepository koppelen; branch protection en review instellen.
3. Alle migraties eerst op acceptatie toepassen en database-tests uitvoeren.
4. Vercel-variabelen per Development, Preview en Production instellen. Voeg in Supabase Auth uitsluitend de eigen HTTPS-origin met `/auth/callback` toe aan de toegestane redirect-URL’s; de lokale callback blijft beperkt tot localhost/127.0.0.1.
5. Productiebeheerder gecontroleerd bootstrappen en de staff-/adminrol verifiëren. Dealer en beheer gebruiken sinds het eigenaarbesluit van 20 november 2026 alleen e-mail en wachtwoord; er is geen verplichte TOTP-stap.
6. Resend-domein met SPF/DKIM verifiëren; API-key alleen server-side opslaan.
7. Juridische teksten, privacyregister en bewaartermijnen laten beoordelen.
8. Onafhankelijke beveiligingscontrole en volledige besloten proef uitvoeren.
9. `agreement_terms_versions` bevat voor lokaal testen alleen een concept. Laat het contract juridisch beoordelen, voeg een expliciet goedgekeurde versie toe en controleer dat UI en database exact die versie gebruiken voordat een betaal- of productiestroom wordt toegestaan.

De fase-5-beschrijving betreft historische sandboxfunctionaliteit. Vervallen betaal- en simulatoronderdelen blijven buiten gebruik; een gewijzigde inlogvoorwaarde maakt ze niet opnieuw beschikbaar. De betaalprovider, uitbetalingsroute, kostenbetaler en het juridische bindingsmoment blijven afzonderlijke productiekeuzes.

Vóór een echte providersandbox:

1. Laat de provider schriftelijk bevestigen dat particuliere autoverkopers, garages, bedragen, holding/vrijgave, refunds en geschillen ondersteund worden.
2. Leg vergoeding, betaler, btw-presentatie, annulering en het bindingsmoment vast.
3. Voeg een afzonderlijke echte adapter toe; wijzig de lokale simulator niet in een productieadapter.
4. Gebruik officiële onboarding en gehoste checkout. Sla geen bankgegevens in deze applicatie op wanneer de provider dit kan afhandelen.
5. Stel een afzonderlijk provider-webhookgeheim in en verifieer volgens de actuele officiële providerdocumentatie.
6. Doorloop P01–P12 opnieuw tegen de officiële sandbox. Een lokale mock telt niet als bewijs.

## Migraties

- Migraties zijn voorwaarts, genummerd en worden nooit achteraf aangepast nadat ze gedeeld zijn.
- Iedere RLS- of functieaanpassing bevat een negatieve database-test.
- Maak vóór risicovolle productie-migraties een herstelpunt en leg de terugvalprocedure vast.

### Password-only toegang — 20 november 2026

De eigenaar heeft voor de volledige dealer- en beheeromgeving alleen e-mail en wachtwoord gekozen en het verhoogde risico door het ontbreken van een tweede factor geaccepteerd. De eerdere verplichte TOTP-/`aal2`-aannames zijn vervangen; rollen, garagegoedkeuring, account- en bedrijfsblokkades, actieve lidmaatschappen en eigenaarschap blijven vereist.

1. Voer de vereiste applicatie- en negatieve databasecontroles uit en leg de resultaten vast. De gerichte browserproef `e2e/password-only-access.spec.ts` draait uitsluitend na lokale opt-in met `E2E_PASSWORD_ONLY_ACCESS=true` en weigert niet-lokale bestemmingen.
2. Pas op de doelomgeving eerst de nieuwe voorwaartse migratie `202611200001_password_only_portal_access.sql` toe. Oude migraties worden niet aangepast. De nieuwe migratie laat een geldige sessie zonder TOTP toe en houdt vervallen betaalfuncties ontoegankelijk.
3. Publiceer daarna de bijbehorende applicatieversie. Controleer directe password-only toegang voor bevoegde dealers en staff, weigering voor verkeerde rollen, pending/geblokkeerde garages en vreemde dossiers, en de veilige interne redirect van `/auth/mfa`.
4. Controleer hosted Supabase Auth-instellingen afzonderlijk waar dat voor de doelomgeving nodig is. `supabase/config.toml` configureert de lokale runtime en wijzigt hosted MFA-instellingen niet automatisch. De migratie en applicatiewijziging verwijderen geen bestaande factorrecords; voer daarvoor geen Auth API-verwijderactie uit.

Lokale controle op 20 november 2026: `npm run lint`, `npm run typecheck`, `npm run test` (17 bestanden, 69 tests) en `npm run build` zijn geslaagd. De volledige SQL-suite slaagt geïsoleerd lokaal met 11 bestanden en 398 controles. De gerichte Playwright password-only toegangstest slaagt met 1 test voor admin, operator, goedgekeurde/pending/geblokkeerde dealer, anonieme toegang en veilige legacyredirects. De volledige historische koop-/betaalworkflow is hiermee niet opnieuw getest.

Status op 26 november: lokaal getest; de password-only versie en migratie zijn nog niet online. Vercel-login is inmiddels geslaagd, de commerciële hostingkeuze en productie-inrichting staan nog open. Voer migratie en applicatie-uitrol in de bovenstaande volgorde uit en leg daarna de online toegangscontrole afzonderlijk vast. Heractiveer geen vervallen betaalroute of simulator tijdens deze uitrol.

## Back-up en herstel

- Database- en Storage-herstel zijn twee afzonderlijke processen.
- Leg retentie, exportlocatie, encryptie en verantwoordelijke persoon vast.
- Herstel minimaal één volledige fictieve aanvraag met foto’s in een geïsoleerde omgeving.
- Noteer hersteltijd, gegevensverliesvenster en afwijkingen.
- Livegang is geblokkeerd totdat deze hersteltest aantoonbaar is geslaagd.
- De concrete proefstappen en het vast te leggen bewijs staan in `docs/RECOVERY.md`.

## Onderhoud private uploads

Niet-afgeronde concepten vervallen na dertig minuten. Vóór livegang moet een geplande servertaak objecten onder verlopen conceptpaden verwijderen en pas daarna de conceptregels opruimen. Test dit met fictieve foto’s; een databaseback-up bevat de Storage-objecten niet automatisch.

## Sluiten van biedrondes

De databasefunctie `close_due_bid_rounds` sluit verlopen rondes in herstelbare batches. Richt bij acceptatie/hosting een periodieke servertaak met een server-only service-rolecontext in en controleer mislukte runs. De taak is een hulpmiddel: `place_bid` controleert zelf onder lock de actuele databasetijd en weigert een bod na de deadline, ook wanneer de taak vertraagd is. Activeer geen extern schema zonder aparte toestemming en leg de gekozen frequentie vóór livegang vast.
