# Thijskooptuauto

Eén Next.js-applicatie voor de publieke website, het besloten dealerportaal en de beheeromgeving. De applicatie gebruikt Supabase voor PostgreSQL, authenticatie en private foto-opslag. Vercel is de beoogde hostingomgeving, maar dit project is nog niet gepubliceerd.

## Huidige status

Fase 1 tot en met fase 4 zijn lokaal ingericht:

- standaard Next.js 16 App Router-basis;
- Supabase SSR-sessieadapter;
- dealeraccounts en handmatige bedrijfsgoedkeuring;
- gescheiden dealer- en beheerroute;
- verplichte TOTP/MFA voor beheer;
- SQL-schema, default-deny RLS en auditlog;
- unit- en databasebeveiligingstests.
- publieke informatiepagina’s en SEO-basis;
- zesstaps autoaanmelding met RDW-terugval en idempotentie;
- private foto-upload met servercontrole en metadatareductie;
- duurzame aanvraag- en e-mailoutboxopslag;
- beheeroverzicht voor aanvragen, interne notities, statussen en fotoreview.
- gecontroleerde publicatie van een onveranderlijke voertuigversie en biedronde;
- besloten dealer-aanbod met filters, gecontroleerde foto’s en eigen biedhistorie;
- transactionele, append-only biedingen met deadline-, rechten- en idempotentiecontrole;
- beheerweergave van alle biedingen zonder automatische gunning.
- gescheiden registratie van contactmomenten, akkoord en afhandeling;
- gecontroleerde materiële voertuigwijzigingen met intrekking van de oude ronde;
- onveranderlijke versie- en biedhistorie met auditregistratie.

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
npm run test:db
npm run build
```

`npm run test:db` gebruikt een echte lokale Supabase/PostgreSQL-database en vereist Docker. Mocks vervangen deze controle niet.

## Lokale beheerder maken

Er bestaat bewust geen scherm waarmee iemand zichzelf beheerder kan maken.

1. Maak lokaal een normale gebruiker aan en bevestig het lokale testbericht via Supabase Inbucket.
2. Zoek uitsluitend lokaal het gebruikers-ID op.
3. Voeg via Supabase Studio één regel aan `staff_memberships` toe met rol `admin`.
4. Log opnieuw in en stel via `/auth/mfa` TOTP in.

Voor productie wordt deze bootstrap-procedure apart gecontroleerd en nooit met een seedbestand uitgevoerd.

## Documentatie

- `docs/PLAN.md` — fasen en voortgang
- `docs/DECISIONS.md` — technische keuzes en open beslissingen
- `docs/SECURITY.md` — dreigingen, rechten en controles
- `docs/DATA_MODEL.md` — tabellen en statusmodellen
- `docs/ACCEPTANCE_TESTS.md` — vereiste scenario’s
- `docs/DEPLOYMENT.md` — toekomstige publicatie, migraties en herstel
- `docs/PILOT.md` — draaiboek en bewijs voor de besloten proef
- `docs/GO_LIVE_CHECKLIST.md` — verplichte beslis- en controlepunten voor publicatie

Het slagen van een build maakt deze applicatie niet productieklaar. Juridische teksten, hersteltests, externe accounts en een onafhankelijke beveiligingscontrole ontbreken nog.
