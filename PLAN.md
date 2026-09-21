# Projectplan — Thijs koopt uw auto

## Fase 1 — lokale basis (nu)

- Responsieve Nederlandse startpagina met een herkenbare automotive uitstraling.
- Toegankelijke kentekeninvoer met lokale validatie en duidelijke feedback.
- Heldere uitleg van de toekomstige verkoopflow.
- Projectfundament, metadata en favicon.
- Geen database, accounts, uploads, e-mail of publicatie.

## Fase 2 — voertuig en gegevens

- RDW Open Data voor het opzoeken van openbare voertuiggegevens.
- Supabase Postgres voor aanvragen en workflowgegevens.
- Supabase Auth voor beveiligde medewerkerstoegang.
- Supabase Storage voor voertuigfoto's.

## Fase 3 — taxatie en communicatie

- Beveiligd medewerkerdashboard voor aanvragen en biedingen.
- Statusverloop van nieuw naar beoordeeld, bod verstuurd en afgerond.
- Transactionele e-mail via Resend met eigen geverifieerd domein.
- Klantbevestiging en interne notificaties.

## Fase 4 — productie

- Privacytekst, bewaartermijnen, AVG-controle en toegangsbeleid.
- Integratie- en end-to-endtests, foutregistratie en monitoring.
- Productieconfiguratie en deployment na expliciete toestemming.

## Externe accounts (pas nodig vanaf fase 2)

Maak nog geen sleutels aan en deel nooit geheime waarden in chat. Vanaf fase 2 zijn accounts nodig bij Supabase en Resend. RDW Open Data kan via de publieke API worden gebruikt. Hosting wordt pas ingericht wanneer publicatie is goedgekeurd.
