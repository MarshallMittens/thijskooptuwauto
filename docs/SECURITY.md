# Beveiligingsmodel

## Grenzen

- Browserinvoer is altijd onbetrouwbaar.
- Server Actions en Route Handlers zijn openbare endpoints en voeren zelf authenticatie en autorisatie uit.
- PostgreSQL-grants en RLS vormen de laatste toegangsgrens.
- De `service_role`-sleutel komt niet in browserbundels, Git, logs of documentatie.

## Rechten

| Gegeven/actie | Anoniem | Pending/geblokkeerd | Goedgekeurde dealer | Staff met AAL2 |
|---|---:|---:|---:|---:|
| Bedrijfsregistratie | Nee | Eenmalig via RPC | Nee | Ja |
| Eigen bedrijf lezen | Nee | Ja | Ja | Ja |
| Gepubliceerd aanbod | Nee | Nee | Ja | Ja |
| Verkopersgegevens | Nee | Nee | Nee | Ja |
| Interne notities/audit | Nee | Nee | Nee | Ja |
| Bedrijfsstatus wijzigen | Nee | Nee | Nee | Alleen admin |
| Bieden | Nee | Nee | Later via bied-RPC | Inzien |

## Belangrijkste risico’s en controles

- **Rolverhoging:** geen directe writes op rollen of bedrijfsstatus; security-definerfuncties controleren actor en MFA.
- **IDOR:** UUID’s zijn geen beveiliging; RLS beperkt ieder object op rol en bedrijf.
- **Sessie-inbraak:** beheer vereist TOTP en databasebeleid controleert de `aal2`-claim.
- **Gegevenslek tussen dealers:** biedingen worden op bedrijf gefilterd; verkopersgegevens hebben staff-onlybeleid.
- **Uploadmisbruik:** private bucket, korte uploadmachtiging, inhoudsinspectie, formaat-/grootte-/aantallimieten en throttling vóór fase 2.
- **Dubbele verzoeken:** expliciete idempotentiesleutels voor aanvraag, bod en e-mail.
- **Racecondities:** biedcontrole en insert komen later in één PostgreSQL-transactie met rijvergrendeling en `now()` van de database.
- **Logging:** geen wachtwoorden, tokens, volledige vrije tekst of onnodige persoonsgegevens.

## Herstel beheeraccount

Supabase MFA heeft geen ingebouwde herstelcodes. Productieherstel vereist daarom een schriftelijke, handmatige identiteit- en eigendomscontrole door minimaal één andere bevoegde beheerder of via een gecontroleerde noodprocedure. Deze procedure moet vóór livegang worden vastgesteld en getest.
