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
| Contactmomenten/afhandeling | Nee | Nee | Nee | Ja |
| Materiële voertuigwijziging | Nee | Nee | Nee | Ja, gecontroleerde RPC |
| Bedrijfsstatus wijzigen | Nee | Nee | Nee | Alleen admin |
| Bieden | Nee | Nee | Alleen via gecontroleerde bied-RPC | Alle biedingen inzien |

## Belangrijkste risico’s en controles

- **Rolverhoging:** geen directe writes op rollen of bedrijfsstatus; security-definerfuncties controleren actor en MFA.
- **IDOR:** UUID’s zijn geen beveiliging; RLS beperkt ieder object op rol en bedrijf.
- **Sessie-inbraak:** beheer vereist TOTP en databasebeleid controleert de `aal2`-claim.
- **Gegevenslek tussen dealers:** biedingen worden op bedrijf gefilterd; verkopersgegevens hebben staff-onlybeleid.
- **Ingetrokken toegang:** alleen actieve bedrijfslidmaatschappen geven inzage; negatieve RLS-tests dekken verwijderde leden en ongepubliceerde voertuigen af.
- **Rechtstreekse RPC-aanroepen:** kritieke invoerregels staan ook in PostgreSQL-functies en tabelconstraints; browser- of servervalidatie is niet de laatste grens.
- **Open redirects:** authenticatieroutes accepteren alleen geparseerde paden die binnen dezelfde origin blijven; backslashes en gecodeerde netwerkpaden worden geweigerd.
- **Publieke foto-upload:** de browser codeert geselecteerde JPEG/PNG/WebP-bestanden eerst als JPEG en uploadt via kort geldige machtigingen uitsluitend naar `temporary/`. Bij afronding controleert en hercodeert de server ieder bestand en schrijft een hashgebonden versie naar `applications/`. De browsermachtiging kan dat definitieve object niet overschrijven.
- **Foto-inzage:** Storage blijft privé. Beheer met `aal2` krijgt een signed URL van vijf minuten; dealers krijgen in fase 3 uitsluitend gecontroleerde foto’s via een afzonderlijke machtiging.
- **Misbruikbeperking:** een honeypot, afzonderlijke uurlimieten voor RDW-opvragen, formulierstarts en nieuwe uploadconcepten, maximaal twaalf foto’s en korte conceptverval beperken geautomatiseerd misbruik. De identifier is een HMAC van het door Vercel vastgestelde adres; de wijzigbare User-Agent telt niet mee en ruwe adressen worden niet opgeslagen.
- **Dubbele verzoeken:** expliciete idempotentiesleutels voor aanvraag, bod en e-mail.
- **Racecondities:** biedcontrole en insert staan in één PostgreSQL-transactie. Een lock op de biedronde serialiseert gelijktijdige biedingen; deadline en start worden met `now()` van PostgreSQL gecontroleerd.
- **Append-only biedingen:** browserrollen hebben geen insert/update/delete-grants; alleen de biedfunctie kan invoegen en een trigger weigert updates en deletes, ook bij bevoorrechte rechtstreekse wijzigingen.
- **Materiële wijzigingen:** de database vergrendelt de aanvraag en controleert de verwachte revisie. Een actieve publicatie wordt ingetrokken en de ronde geannuleerd; een stale browser kan geen nieuwere versie overschrijven.
- **Afhandeling:** een bod wordt uitsluitend handmatig geselecteerd, moet aantoonbaar bij de aanvraag horen en wordt na akkoord vergrendeld. Terminale verkoopstatussen kunnen niet stilzwijgend worden heropend.
- **Logging:** technische logs bevatten geen wachtwoorden, tokens, volledige formulierinhoud of onnodige persoonsgegevens. Zakelijke contactnotities en wijzigingsredenen zijn afgeschermde dossiergegevens, geen technische logs.

## Herstel beheeraccount

Supabase MFA heeft geen ingebouwde herstelcodes. Productieherstel vereist daarom een schriftelijke, handmatige identiteit- en eigendomscontrole door minimaal één andere bevoegde beheerder of via een gecontroleerde noodprocedure. Deze procedure moet vóór livegang worden vastgesteld en getest.

## Resterend vóór livegang

- Verlopen, niet-afgeronde uploadobjecten moeten periodiek uit Storage worden verwijderd; de onderhoudstaak wordt bij de hostinginrichting geactiveerd en getest.
- Rate limits moeten tijdens de besloten proef met realistische belasting worden geëvalueerd.
- Juridische bewaartermijnen bepalen de uiteindelijke automatische verwijderregels.
