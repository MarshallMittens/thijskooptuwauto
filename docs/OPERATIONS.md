# Fase 6 — operatie en klachten

## Lokale functies

- `/mijn-aanvraag`: verkoper opent en volgt klachten bij het eigen dossier.
- `/dealer/klachten`: alleen de betrokken winnende dealer opent en volgt klachten.
- `/beheer/aanvragen/[id]`: tijdlijn, privébewijs, tweede beoordeling en uitkomst.
- `/beheer/operatie`: outboxstatus, open klachten, incidenten, reconciliatie, testdocumenten en herstelbewijs.

Klachtbewijs accepteert JPEG, PNG en WebP, wordt opnieuw als JPEG opgeslagen en verliest bronmetadata. Upload geen identiteitsdocumenten, kentekenbewijzen of bankgegevens.

## Outbox-worker

De interne `POST /api/internal/operations/outbox`-route vereist `Authorization: Bearer <OPERATIONS_JOB_SECRET>`. De route werkt pas wanneer `OUTBOX_DELIVERY_ENABLED=true` én Resend volledig is ingesteld. Activeer of plan deze route niet zonder expliciete toestemming voor de betreffende omgeving.

De worker claimt maximaal 25 berichten met een lease, gebruikt de opgeslagen idempotentiesleutel richting Resend en plant mislukte pogingen opnieuw. Na acht pogingen blijft het bericht voor handmatige beoordeling staan.

## Factuurgegevens

Fase 6 maakt uitsluitend geblokkeerde testrecords. Er is geen factuur-PDF, boekhoudkoppeling of fiscale aanname. Een echt document vereist eerst een besluit over vergoeding, betalende partij, btw, nummerreeks, juridische entiteit en correctieregels.

## Nog extern nodig

- productiemonitoring en storingsmeldingen;
- verantwoordelijke personen en bereikbaarheidsafspraken;
- geverifieerde e-mailafzender en geplande worker;
- productieback-upfrequentie, retentie, encryptie, RTO en RPO;
- onafhankelijke herstelproef en beveiligingscontrole;
- juridische klachtenprocedure en gepubliceerde reactietermijnen.
