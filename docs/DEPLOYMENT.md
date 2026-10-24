# Publicatie, migraties en herstel

De applicatie is nog niet gepubliceerd. Geen van onderstaande stappen mag zonder expliciete toestemming worden uitgevoerd.

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
- `PAYMENT_SIMULATOR_ENABLED`: uitsluitend lokaal `true`; in preview/productie leeg of `false`.
- `PAYMENT_SIMULATOR_WEBHOOK_SECRET`: afzonderlijk lokaal geheim van minimaal 32 tekens; nooit hergebruiken voor een echte provider.
- `OPERATIONS_JOB_SECRET`: minimaal 32 willekeurige tekens, alleen server-naar-server voor operationele routes.
- `OUTBOX_DELIVERY_ENABLED`: standaard `false`; pas `true` na afzenderverificatie, sjablooncontrole en planning van de worker.
- `PRODUCTION_DEPLOYMENT_APPROVED`: blijft `false` voor lokaal en Preview. Een Vercel-productiebouw wordt zonder een later, expliciet livegangbesluit technisch geblokkeerd.

Zet geheimen nooit in Git, browsercode of chat. Gebruik aparte waarden voor development, preview en productie.

De concrete, niet-productieve eerste Vercel-proef staat in `docs/VERCEL_PREVIEW.md`. De build controleert op Vercel automatisch dat verplichte waarden aanwezig zijn, HTTPS gebruiken, geen localhost bevatten, afzonderlijke geheimen gebruiken en de betaalsimulator niet activeren.

## Voor publicatie

1. Bedrijfsaccounts onder eigendom van Thijskooptuauto maken en MFA activeren.
2. Privérepository koppelen; branch protection en review instellen.
3. Alle migraties eerst op acceptatie toepassen en database-tests uitvoeren.
4. Vercel-variabelen per Development, Preview en Production instellen. Voeg in Supabase Auth uitsluitend de eigen HTTPS-origin met `/auth/callback` toe aan de toegestane redirect-URL’s; de lokale callback blijft beperkt tot localhost/127.0.0.1.
5. Productiebeheerder gecontroleerd bootstrappen en TOTP verifiëren.
6. Resend-domein met SPF/DKIM verifiëren; API-key alleen server-side opslaan.
7. Juridische teksten, privacyregister en bewaartermijnen laten beoordelen.
8. Onafhankelijke beveiligingscontrole en volledige besloten proef uitvoeren.
9. `agreement_terms_versions` bevat voor lokaal testen alleen een concept. Laat het contract juridisch beoordelen, voeg een expliciet goedgekeurde versie toe en controleer dat UI en database exact die versie gebruiken voordat een betaal- of productiestroom wordt toegestaan.

Fase 5 bevat uitsluitend een lokale testsimulator. De betaalprovider, uitbetalingsroute, kostenbetaler en het juridische bindingsmoment blokkeren productie, maar niet de lokale fout-, status- en reconciliatietests.

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
