# Bouwplan en voortgang

Legenda: `[x]` gebouwd en lokaal geverifieerd, `[~]` gebouwd maar nog niet volledig end-to-end of extern gekoppeld, `[ ]` nog niet gebouwd.

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
- [x] RDW-opvraag via de officiële openbare kentekendataset met handmatige terugval.
- [~] Private signed upload, serverinspectie, hercodering zonder metadata en fotoreview; geautomatiseerde browser-E2E volgt nog.
- [~] Onvoorspelbare referentie en duurzame notificatie-outbox zijn lokaal geverifieerd; Resend is optioneel en nog niet ingesteld.
- [~] Beheeroverzicht, statusovergangen, interne notities en fotocontrole; databasefuncties zijn geverifieerd, browser-E2E volgt nog.

## Fase 3 — dealerportaal en biedingen

- [~] Gepubliceerd aanbod, filters, private gecontroleerde foto’s en detailpagina; databasepad is geverifieerd, browser-E2E volgt nog.
- [~] Actieve biedrondes en besloten eigen biedhistorie; databasepad is geverifieerd, browser-E2E volgt nog.
- [x] Transactionele append-only biedfunctie met rijvergrendeling, databasetijd en idempotentie is lokaal gemigreerd en getest.
- [~] Negatieve rechten-, deadline-, verhogings- en idempotentietests slagen; een afzonderlijke gelijktijdige verzoektest volgt nog.
- [~] Ieder opgeslagen bod krijgt transactioneel een geverifieerde outboxnotificatie; Resend-verzending is optioneel en nog niet ingesteld.
- [x] Reviewfix: tijdelijke uploadpaden zijn gescheiden van definitieve, alleen server-schrijfbare fotopaden.
- [x] Reviewfix: rate limiting gebruikt geen wijzigbare User-Agent en concepttokens blijven geldig bij een netwerkovergang.

## Fase 4 — afhandeling en kwaliteitscontrole

- [ ] Contactmomenten, akkoord, niet-verkocht en voltooid.
- [ ] Gecontroleerde voertuigversies en procedure voor materiële wijzigingen.
- [ ] Privacy-, toegankelijkheids-, logging- en herstelcontrole.

## Fase 5 — besloten proef

- [ ] Fictieve volledige proef, daarna besloten proef met bekende dealers.
- [ ] Onafhankelijke controle van RLS en biedlogica.
- [ ] Hersteltest voor database en Storage.
- [ ] Juridische en commerciële beslissingen afgerond.
- [ ] Livegang alleen na expliciete toestemming.
