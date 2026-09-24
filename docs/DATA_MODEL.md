# Gegevensmodel

## Identiteit en bedrijven

- `auth.users`: door Supabase beheerde loginidentiteit.
- `profiles`: applicatieprofiel, telefoon en blokkeerstatus.
- `staff_memberships`: `admin` of `operator`; nooit door de gebruiker zelf te wijzigen.
- `companies`: KvK- en contactgegevens met `pending`, `approved` of `blocked`.
- `company_memberships`: gebruikers en bedrijven afzonderlijk gemodelleerd voor toekomstige meerdere medewerkers.

## Aanvragen en voertuigen

- `seller_contacts` is fysiek afgescheiden van dealergegevens.
- `seller_application_access` koppelt exact één via een magic link geverifieerde Auth-identiteit aan een eigen aanvraag; de tabel heeft geen browsergrants.
- `applications` bevat een onvoorspelbare publieke referentie en eigen workflowstatus.
- `vehicles` bevat handmatige en beschikbare RDW-gegevens, inclusief bronmoment.
- `condition_reports` bevat kilometerstand, schade, gebreken, onderhoud, sleutels en opmerkingen.
- `vehicle_revisions` bewaart de exacte, onveranderlijke publicatieversie.
- `vehicle_photos` verwijst naar private Storage en bevat review- en metadata-status.
- `application_drafts` bevat uitsluitend een gehashte tijdelijke uploadmachtiging, een gehashte misbruikidentifier, vervaltijd en idempotentiesleutel; geen contact- of voertuiggegevens.
- `private.public_submission_limits` begrenst nieuwe uploadconcepten en verzoeken om dossierlinks per gehashte technische identifier en uur.
- `private.product_events` telt alleen formulierstart en afronding, zonder kenteken, contactgegevens of vrije tekst.

## Bieden en afhandeling

- `vehicle_revisions` bevat de onveranderlijke momentopname die dealers zien; verkopersgegevens maken daar nooit deel van uit.
- `listings` koppelt één gepubliceerde voertuigversie aan het afgeschermde dealeraanbod.
- `bid_rounds` bewaart exact 24 uur start/einde, policy- en kostensnapshots, de actuele hoogste-bodverwijzing en een afzonderlijke uitslagstatus; de geldigheid van een bod wordt altijd opnieuw tegen de databasetijd gecontroleerd.
- `bids` is append-only, bevat gehele eurocenten, het bedrijf, de plaatser, een vorige-bodverwijzing en een idempotentiesleutel.
- `winner_reservations` bevat na idempotente sluiting maximaal één hoogste geldig bod per ronde. Dit record is geen koop en wijzigt `deal_cases` niet.
- Een `bid.placed`-regel in `notification_outbox` ontstaat in dezelfde transactie als het bod.
- `appointments` en append-only `appointment_proposals` bewaren de door de winnaar aangeboden momenten en de afzonderlijke reactie van de verkoper.
- `inspections` bevat inspectiestatus, kilometerstand, bevindingen en gedocumenteerde afwijkingen; `inspection_photos` verwijst naar maximaal acht private, gecontroleerde JPEG-objecten.
- `price_adjustment_proposals` bevat een apart voorstel na inspectie met zowel oorspronkelijk bod als voorgesteld bedrag. De rij wijzigt `bids` nooit.
- `agreement_terms_versions` versieert het exacte voorwaardenconcept en de goedkeuringsstatus; de ingebouwde versie is uitsluitend `test`.
- `sale_agreements` bevriest voertuig, oorspronkelijk en overeengekomen bedrag, voorwaardenversie en beide afzonderlijke bevestigingen.
- `workflow_tasks` maakt uitzonderingen zoals afwijzing en no-show zichtbaar voor beheer zonder automatisch naar een andere bieder door te schakelen.
- `deal_cases` scheidt akkoord en verdere afhandeling van biedronde, afspraak en inspectie; `agreed` volgt pas uit beide bevestigingen.
- `contact_events` en `internal_notes` zijn uitsluitend beheerinformatie.

## Betrouwbaarheid

- `audit_log` registreert gevoelige beheeracties.
- `notification_outbox` ontkoppelt e-mail van bedrijfsopslag.
- `request_idempotency` voorkomt dubbele verwerking van herhaalde verzoeken.

Materiële voertuigwijzigingen maken later een nieuwe `vehicle_revision`. Een bestaande biedronde wordt dan gecontroleerd gesloten of geannuleerd; bestaande biedingen blijven behouden.

## Betalingen en overdracht — uitsluitend testsandbox

- `payment_runtime_config` houdt provider, omgeving, aan/uit-status en feeconfiguratie vast. De simulator start uit en kosten blijven `test_unconfigured`.
- `seller_payment_onboarding` bevat alleen een fictieve providerreferentie en teststatus; geen echte IBAN, identiteit of bankgegevens.
- `payment_orders` bevriest koopconcept, bedrijf, ontvanger, voertuigbedrag, vergoeding, koperstotaal, verkopersbedrag, valuta en providerreferentie.
- `payment_events` is append-only en dedupliceert op provider-event-ID; alleen de service-webhookfunctie kan schrijven.
- `handovers` bewaart afzonderlijk de bevestiging van verkoper, dealer en de testmatige vrijwaringscontrole door beheer.
- `payment_refunds` bewaart bedrag, reden, aanvrager, providerreferentie en idempotentiesleutel los van de oorspronkelijke betaling.
- `payment_reconciliation_runs` en `payment_reconciliation_items` bewaren welke lokale/providerrecords zijn vergeleken en welke afwijkingen zijn gevonden.
- `private.simulated_provider_payments` stelt uitsluitend lokaal de tweede provideradministratie voor en is nooit browserleesbaar.

## Klachten, administratie en operatie

- `complaints` koppelt een klacht aan aanvraag, eventuele betaling en betrokken koper zonder de transactiehistorie te wijzigen.
- `complaint_messages` vormt de append-only tijdlijn; `complaint_evidence` verwijst naar maximaal acht gecontroleerde private JPEG-objecten.
- `companies.is_platform_affiliated` activeert voor nieuwe klachten de verplichte onafhankelijke tweede beoordeling.
- `platform_invoice_records` bewaart alleen geblokkeerde testfactuur-/correctiereferenties. Autokoopbedrag en platformvergoeding blijven afzonderlijke gegevens.
- `operational_incidents` registreert ernst, impact, status en oplossing met actor en auditspoor.
- `operation_runs` bewaart uitvoer van serverworkers; `recovery_test_runs` bewaart alleen bewijsmetadata van een herstelproef, nooit geheimen of back-upinhoud.
- `notification_outbox.locked_at/locked_by` geeft een worker een tijdelijke lease. Mislukte pogingen blijven met teller en volgend tijdstip bewaard.
