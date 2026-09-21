# Werkinstructies

## Architectuur

- Gebruik één standaard Next.js App Router-applicatie voor Vercel.
- Gebruik Supabase PostgreSQL, Auth en private Storage; voeg geen tweede ORM of database toe.
- SQL-bestanden in `supabase/migrations` zijn de enige bron van waarheid voor het schema.
- Lees vóór Next.js-wijzigingen de toepasselijke documentatie onder `node_modules/next/dist/docs`.
- Houd publieke website, `/dealer` en `/beheer` logisch gescheiden.
- Centraliseer sessie- en rolcontrole in `lib/auth/dal.ts`; UI-verbergen is nooit beveiliging.

## Beveiligingsregels

- Default deny: trek grants in en voeg alleen noodzakelijke RLS-policies toe.
- Vertrouw geen browserwaarden voor rollen, bedrijven, bedragen, tijdstippen of statussen.
- Beheeracties vereisen staff-lidmaatschap en `aal2`.
- Dealers mogen nooit verkopersgegevens, interne notities of biedingen van andere bedrijven lezen.
- Biedingen worden later uitsluitend append-only via één transactionele databasefunctie geplaatst.
- Gebruik `service_role` alleen in server-only, afgebakende taken; nooit in browsercode.
- Commit nooit `.env*`, sleutels, echte persoonsgegevens of productiedata.
- Log geen wachtwoorden, tokens, volledige formulierinhoud of onnodige persoonsgegevens.

## Verplichte controles

Voer vóór een oplevering uit:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run test:db` wanneer Docker beschikbaar is
5. `npm run build`

Meld elke overgeslagen controle expliciet. Wijzig RLS, rollen of security-definerfuncties nooit zonder een negatieve database-test.

## Werkwijze

- Werk in kleine commits en wijzig geen ongerelateerde bestanden.
- Gebruik alleen fictieve testgegevens.
- Publiceer of maak betaalde resources uitsluitend na expliciete toestemming.
- Houd `docs/PLAN.md`, `docs/DECISIONS.md` en `docs/SECURITY.md` actueel bij relevante wijzigingen.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
