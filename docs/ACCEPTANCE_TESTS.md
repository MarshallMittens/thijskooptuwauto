# Acceptatietests

## Fase 1

- Anoniem kan geen applicatietabellen lezen.
- Een dealerregistratie maakt altijd een bedrijf met status `pending`.
- Een dealer kan geen rol, lidmaatschap of bedrijfsstatus rechtstreeks wijzigen.
- Pending en blocked accounts krijgen geen dealerportaal.
- Een goedgekeurde dealer krijgt wel dealerportaal, maar geen beheeromgeving.
- Een dealer kan een ander bedrijf niet lezen.
- Een staff-account op `aal1` wordt naar MFA geleid.
- Alleen een admin op `aal2` kan goedkeuren of blokkeren.
- Iedere bedrijfsstatuswijziging levert een auditlogregel op.
- Rechtstreekse Data API/databaseverzoeken omzeilen de regels niet.

## Fase 2

- Volledige aanvraag werkt bij RDW-uitval via handmatige invoer.
- Dubbel indienen geeft één aanvraag en dezelfde uitkomst.
- Contactgegevens worden niet in de browsersessie opgeslagen.
- Een anonieme gebruiker kan aanvragen, verkopersgegevens, fotometadata en concepten niet uitlezen.
- Foto’s worden alleen met een kort geldige uploadmachtiging naar de private bucket geschreven.
- De server controleert werkelijke foto-inhoud en bestandsgrootte en codeert geaccepteerde foto’s opnieuw als JPEG zonder metadata.
- Een foto blijft `pending` totdat beheer deze na controle op zichtbare persoonsgegevens goedkeurt of afwijst.
- Een e-mailstoring verwijdert de opgeslagen aanvraag niet; de notificatie blijft `pending` of `failed` in de outbox.
- Alleen staff op `aal2` kan aanvragen, verkopersgegevens en interne notities lezen of wijzigen.
- Ongeldige aanvraagstatusovergangen worden in PostgreSQL geweigerd en geldige wijzigingen staan in de auditlog.
- Formulierstarts en afrondingen worden intern geteld zonder kenteken, contactgegevens of vrije tekst in de meetgebeurtenis.

## Fase 3

- Pending en geblokkeerde bedrijven kunnen aanbod noch biedfunctie gebruiken.
- Dealers zien geen verkopersgegevens, interne notities of biedingen van andere bedrijven.
- Alleen gepubliceerde, onveranderlijke voertuigversies en goedgekeurde foto’s zijn zichtbaar.
- Een bod wordt als gehele eurocenten opgeslagen en kan alleen worden verhoogd.
- Rechtstreekse inserts, updates en deletes op `bids` worden geweigerd.
- Dezelfde idempotentiesleutel met dezelfde inhoud retourneert hetzelfde bod; andere inhoud wordt geweigerd.
- Een bod na de databasetijd van de deadline wordt geweigerd, ongeacht een sluitingstaak.
- Iedere succesvolle bieding schrijft een auditregel en notificatie-outboxregel in dezelfde transactie.
- Beheer ziet alle biedingen zonder dat de hoogste bieder automatisch koper wordt.
- Gelijktijdige verhogingen worden door de biedrondelock in geldige volgorde verwerkt; dit wordt met twee databaseverbindingen getest zodra de lokale runtime beschikbaar is.

## Fase 4

- Contactmomenten zijn alleen zichtbaar en schrijfbaar voor staff met `aal2` en krijgen een auditregel zonder de volledige samenvatting te kopiëren.
- Afhandelingsstatus kan niet buiten de toegestane volgorde worden gewijzigd.
- `agreement_pending`, `agreed` en `completed` vereisen een bewust gekozen bod dat bij dezelfde aanvraag hoort.
- De hoogste bieder wordt niet automatisch geselecteerd en het sluiten van de biedronde wijzigt de afhandeling niet.
- Een materiële wijziging vanaf een verouderde revisie wordt geweigerd.
- Een materiële wijziging trekt gepubliceerd aanbod in, annuleert de ronde en bewaart oude voertuigversies en biedingen onveranderd.
- Herpublicatie na een materiële wijziging maakt een nieuwe revisie en biedronde.
- Dealers kunnen contactmomenten, afhandeling en beheerworkflow-RPC’s niet lezen of aanroepen.

## Nog vóór livegang

- E-mailuitval verwijdert of rolt geen aanvraag of bod terug.
- Database- en fotoherstel worden daadwerkelijk proefgedraaid vóór livegang.
