# Thijskooptuauto

Eén Next.js-applicatie voor de publieke website, het besloten dealerportaal en de beheeromgeving. De applicatie gebruikt Supabase voor PostgreSQL, authenticatie en private foto-opslag. Vercel is de beoogde hostingomgeving, maar dit project is nog niet gepubliceerd.

## Huidige status

Fase 1 tot en met fase 6 zijn lokaal ingericht; fase 5 is uitsluitend een lokale, standaard uitgeschakelde betaalsimulator. Fase 7 is een onvolledig vrijgavedossier met lokale rookproeven, geen livegangbesluit:

- standaard Next.js 16 App Router-basis;
- Supabase SSR-sessieadapter;
- dealeraccounts en handmatige bedrijfsgoedkeuring;
- gescheiden dealer- en beheerroute;
- verplichte TOTP/MFA voor beheer;
- verplichte TOTP/MFA voor goedgekeurde dealers voordat zij aanbod of biedfuncties gebruiken;
- gescheiden beheer- en dealeridentiteiten: een staff-sessie krijgt nooit biedrechten;
- veilig wachtwoordherstel zonder accountenumeratie;
- versieerbaar testbeleid voor 24-uursveilingen en nog onbesliste kosten, zonder productieactivatie;
- SQL-schema, default-deny RLS en auditlog;
- unit- en databasebeveiligingstests.
- publieke informatiepagina’s en SEO-basis;
- zesstaps autoaanmelding met RDW-terugval en idempotentie;
- private foto-upload met servercontrole en metadatareductie;
- duurzame aanvraag- en e-mailoutboxopslag;
- beheeroverzicht voor aanvragen, interne notities, statussen en fotoreview.
- wachtwoordloze e-mailverificatie voor particuliere verkopers;
- beveiligd verkopersdossier met uitsluitend de eigen aanvraag en tijdelijke fotolinks;
- gecontroleerde aanvulling wanneer beheer de status op ‘Informatie nodig’ zet;
- databaseblokkade op publicatie zolang de verkoper niet is geverifieerd;
- gecontroleerde publicatie van een onveranderlijke voertuigversie en biedronde;
- besloten dealer-aanbod met filters, gecontroleerde foto’s en eigen biedhistorie;
- transactionele, append-only biedingen met deadline-, rechten- en idempotentiecontrole;
- beheerweergave van alle biedingen zonder automatische gunning.
- afspraakvoorstellen door de winnaar en actieve keuze door de verkoper;
- inspectieregistratie met private, gecontroleerde foto’s;
- aparte prijsaanpassing zonder het oorspronkelijke bod te wijzigen;
- afzonderlijke dealer- en verkopersbevestiging van exact hetzelfde testkoopconcept;
- gescheiden registratie van contactmomenten, akkoord en afhandeling;
- gecontroleerde materiële voertuigwijzigingen met intrekking van de oude ronde;
- onveranderlijke versie- en biedhistorie met auditregistratie.
- providerneutraal betaalmodel met een herkenbare `simulated/test`-adapter;
- ondertekende testwebhooks met bedrag-, valuta-, ontvanger-, volgorde- en idempotentiecontrole;
- gescheiden statussen voor checkout, ontvangst/hold, overdracht, vrijgave, uitbetaling, geschil en refund;
- testreconciliatie tussen lokale en afgeschermde gesimuleerde provideradministratie.
- afgeschermde klachtendossiers met tijdlijn, privébewijs en verplichte tweede beoordeling bij een platformkoper;
- geblokkeerde testfactuur-/correctierecords zonder verzonnen vergoeding of btw;
- operationeel dashboard voor outbox, klachten, incidenten, reconciliatie en herstelbewijs;
- lease-gebaseerde, default-off outbox-worker met retries en deduplicatie;
- strikt lokale, geïsoleerde database- en Storage-herstelproef.

De publieke pagina’s en RDW-terugval zijn zonder lokale database te bekijken. Definitief versturen, foto-opslag, inloggen en beheer vereisen lokale Supabase. Er is geen gesimuleerde productieopslag of authenticatie.

## Vereisten

- Node.js 22 of nieuwer
- npm
- Git
- Docker Desktop of een compatibele Docker-runtime voor de lokale Supabase-tests

Controleer zelf de actuele licentievoorwaarden voordat je Docker Desktop installeert. Er zijn geen Vercel-, Supabase- of Resend-accounts nodig voor lokale ontwikkeling.

## Lokale installatie

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:start
```

Neem na `npm run db:start` de lokale URL, publishable key en lokale service-role key over in `.env.local`. Vul ook twee verschillende lokale geheimen van minimaal 32 willekeurige tekens in voor `REQUEST_FINGERPRINT_SECRET` en `DRAFT_TOKEN_SECRET`. Deel deze waarden nooit in chat of documentatie.

Vul voor fase 6 ook een afzonderlijk `OPERATIONS_JOB_SECRET` van minimaal 32 willekeurige tekens in. Laat `OUTBOX_DELIVERY_ENABLED=false` zolang Resend en de workerplanning niet bewust zijn ingericht.

Voor fase 5 kun je uitsluitend lokaal `PAYMENT_SIMULATOR_ENABLED=true` zetten en een afzonderlijk `PAYMENT_SIMULATOR_WEBHOOK_SECRET` van minimaal 32 willekeurige tekens instellen. Herstart daarna de ontwikkelserver en activeer de simulator vanuit een beheerder met MFA. Zie `docs/PAYMENTS.md`. De simulator wordt in productie geweigerd en verwerkt geen echt geld.

Start daarna de applicatie:

```powershell
npm run dev
```

Open `http://127.0.0.1:3000`.

## Controles

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:e2e:acceptance
npm run test:db
npm run test:concurrency
npm run test:recovery
npm run build
```

`npm run test:db` gebruikt een echte lokale Supabase/PostgreSQL-database en vereist Docker. Mocks vervangen deze controle niet.

`npm run test:e2e` gebruikt een geïnstalleerde Google Chrome en een draaiende lokale website op `http://127.0.0.1:3000` (start die apart met `npm run dev`). De vijf browserproeven controleren het publieke kentekenveld, handmatige invoer bij gesimuleerde RDW-uitval, mobiel gebruik en de loginpoort van dealer en beheer. Ze versturen bewust geen aanvraag en vervangen geen volledige acceptatieproef met ingelogde rollen. Voor een afwijkende lokale URL kun je `E2E_BASE_URL` instellen.

`npm run test:e2e:acceptance` is de schrijvende lokale acceptatieproef. Start eerst de actuele applicatie en Supabase inclusief Mailpit. De proef maakt unieke `example.test`-accounts en fictieve dossiers, gebruikt echte lokale MFA en de Mailpit-link en doorloopt aanmelding, twee dealerregistraties, goedkeuring, publicatie, twee biedingen, winnaar, afspraak, inspectie, dubbele bevestiging en klacht. Om 24 uur veilig te simuleren wijzigt het script uitsluitend de unieke testronde rechtstreeks in de lokale Docker-container `supabase_db_thijskooptuauto`. Voer dit commando daarom nooit tegen productie uit. De herkenbare testrecords blijven lokaal als proefbewijs staan totdat je bewust `npm run db:reset` uitvoert; die reset wist alle lokale gegevens.

## Lokale beheerder maken

Er bestaat bewust geen scherm waarmee iemand zichzelf beheerder kan maken.

1. Maak lokaal een normale gebruiker aan en bevestig het lokale testbericht via Supabase Inbucket.
2. Zoek uitsluitend lokaal het gebruikers-ID op.
3. Voeg via Supabase Studio één regel aan `staff_memberships` toe met rol `admin`.
4. Log opnieuw in en stel via `/auth/mfa` TOTP in.

Voor productie wordt deze bootstrap-procedure apart gecontroleerd en nooit met een seedbestand uitgevoerd.

Gebruik voor Thijs als inkoper een afzonderlijk dealeraccount. Een beheeraccount kan niet als dealer bieden. Bestaande lokale accounts met beide lidmaatschappen behouden beheerinzage, maar krijgen geen dealerrechten en moeten vóór productie gecontroleerd worden opgeschoond.

Particuliere verkopers gebruiken geen wachtwoord. Zij openen `/mijn-aanvraag`, voeren hun aanvraagreferentie en het e-mailadres uit de aanvraag in en ontvangen lokaal een eenmalige link in Mailpit op `http://127.0.0.1:54324`.

## Documentatie

- `docs/PLAN.md` — fasen en voortgang
- `docs/DECISIONS.md` — technische keuzes en open beslissingen
- `docs/SECURITY.md` — dreigingen, rechten en controles
- `docs/DATA_MODEL.md` — tabellen en statusmodellen
- `docs/ACCEPTANCE_TESTS.md` — vereiste scenario’s
- `docs/DEPLOYMENT.md` — toekomstige publicatie, migraties en herstel
- `docs/PAYMENTS.md` — lokale fase-5-testsimulator, testvolgorde en productieblokkades
- `docs/OPERATIONS.md` — klachten, outbox, monitoring, testdocumenten en herstel
- `docs/PHASE7.md` — actueel vrijgavedossier, gebruikersproef en externe blokkades
- `docs/PHASE8_LIVE_PILOT.md` — voorbereiding, toegangspoort en stopregels voor een latere beperkte livepilot
- `docs/PILOT.md` — historisch proefplan voor de vroegere besloten biedvariant
- `docs/GO_LIVE_CHECKLIST.md` — verplichte beslis- en controlepunten voor publicatie

Het slagen van een build maakt deze applicatie niet productieklaar. De lokale herstelproef vervangt geen productiehersteltest; juridische teksten, externe accounts, echte provideracceptatie en een onafhankelijke beveiligingscontrole ontbreken nog.
