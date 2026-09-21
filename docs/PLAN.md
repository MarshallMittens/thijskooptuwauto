# Bouwplan en voortgang

Legenda: `[x]` gebouwd, `[~]` gebouwd maar nog lokaal te verifiëren, `[ ]` nog niet gebouwd.

## Fase 1 — ontwerp en fundament

- [x] Git-nulpunt en aparte fase-1-branch.
- [x] Standaard Next.js/Vercel-basis zonder Cloudflare, D1, R2 of ChatGPT-auth.
- [x] Gegevensmodel en gescheiden statusmodellen.
- [x] Supabase SSR-adapter en sessieverversing.
- [x] Dealeraccount, bedrijfsregistratie met status `pending` en wachtroute.
- [x] Beheerrol, TOTP/MFA-poort en bedrijfsgoedkeuring/blokkering.
- [x] Default-deny grants, RLS en gecontroleerde databasefuncties.
- [x] Unit-tests voor toegangsregels.
- [~] PostgreSQL/RLS-tests geschreven; uitvoeren zodra Docker beschikbaar is.

## Fase 2 — publieke website en aanvragen

- [x] Publieke pagina’s, metadata, sitemap en navigatie met herkenbare conceptteksten.
- [~] Zesstaps aanvraagformulier met tijdelijk concepttoken en idempotentie; databasepad wacht op lokale Supabase-verificatie.
- [x] RDW-opvraag via de officiële openbare kentekendataset met handmatige terugval.
- [~] Private signed upload, serverinspectie, hercodering zonder metadata en fotoreview; end-to-endtest wacht op lokale Supabase.
- [~] Onvoorspelbare referentie en duurzame notificatie-outbox; Resend is optioneel en nog niet ingesteld.
- [~] Beheeroverzicht, statusovergangen, interne notities en fotocontrole; databasepad wacht op lokale Supabase-verificatie.

## Fase 3 — dealerportaal en biedingen

- [ ] Gepubliceerd aanbod, filters en detailpagina.
- [ ] Actieve biedrondes en besloten eigen biedhistorie.
- [ ] Transactionele append-only biedfunctie met locks en idempotentie.
- [ ] Deadline- en gelijktijdigheidstests tegen PostgreSQL.
- [ ] Transactionele notificaties na succesvolle opslag.

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
