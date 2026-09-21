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

## Latere kritieke scenario’s

- Volledige aanvraag werkt bij RDW-uitval via handmatige invoer.
- Dubbel indienen geeft één aanvraag en dezelfde uitkomst.
- Dealers zien geen verkopersgegevens, interne notities of biedingen van andere bedrijven.
- Een bod na de databasetijd van de deadline wordt geweigerd, ongeacht een sluitingstaak.
- Gelijktijdige verhogingen worden in geldige volgorde verwerkt.
- E-mailuitval verwijdert of rolt geen aanvraag of bod terug.
- Materiële wijzigingen starten een controleerbare nieuwe voertuigversie en zo nodig nieuwe ronde.
- Database- en fotoherstel worden daadwerkelijk proefgedraaid vóór livegang.
