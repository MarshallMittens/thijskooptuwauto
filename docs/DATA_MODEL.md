# Gegevensmodel

## Identiteit en bedrijven

- `auth.users`: door Supabase beheerde loginidentiteit.
- `profiles`: applicatieprofiel, telefoon en blokkeerstatus.
- `staff_memberships`: `admin` of `operator`; nooit door de gebruiker zelf te wijzigen.
- `companies`: KvK- en contactgegevens met `pending`, `approved` of `blocked`.
- `company_memberships`: gebruikers en bedrijven afzonderlijk gemodelleerd voor toekomstige meerdere medewerkers.

## Aanvragen en voertuigen

- `seller_contacts` is fysiek afgescheiden van dealergegevens.
- `applications` bevat een onvoorspelbare publieke referentie en eigen workflowstatus.
- `vehicles` bevat handmatige en beschikbare RDW-gegevens, inclusief bronmoment.
- `condition_reports` bevat kilometerstand, schade, gebreken, onderhoud, sleutels en opmerkingen.
- `vehicle_revisions` bewaart de exacte, onveranderlijke publicatieversie.
- `vehicle_photos` verwijst naar private Storage en bevat review- en metadata-status.

## Bieden en afhandeling

- `listings` publiceert één voertuigversie.
- `bid_rounds` bewaart afzonderlijk status en UTC-deadline.
- `bids` is append-only, in eurocenten en uniek op gebruiker plus idempotentiesleutel.
- `deal_cases` scheidt akkoord en afhandeling van de biedrondestatus.
- `contact_events` en `internal_notes` zijn uitsluitend beheerinformatie.

## Betrouwbaarheid

- `audit_log` registreert gevoelige beheeracties.
- `notification_outbox` ontkoppelt e-mail van bedrijfsopslag.
- `request_idempotency` voorkomt dubbele verwerking van herhaalde verzoeken.

Materiële voertuigwijzigingen maken later een nieuwe `vehicle_revision`. Een bestaande biedronde wordt dan gecontroleerd gesloten of geannuleerd; bestaande biedingen blijven behouden.
