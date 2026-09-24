# Fase 8 — draaiboek beperkte livepilot

**Status: niet gestart.** Dit draaiboek is voorbereiding, geen toestemming voor publicatie of echte betalingen. Het fase-7-vrijgavedossier (`PHASE7.md`) staat nog open. De huidige code heeft uitsluitend een lokale betaalsimulator en is daarom niet geschikt voor echte geldstromen.

## Poortaudit — 22 september 2026

Op verzoek om fase 8 uit te voeren is de toegangspoort opnieuw beoordeeld. **Uitkomst: niet vrijgegeven; de livepilot is niet gestart.** Een verzoek om de fase uit te voeren vervangt de hieronder vereiste, afzonderlijk onderbouwde besluiten niet.

- In `lib/payments/simulator.ts` is alleen de adapter `simulated`/`test` aanwezig. `lib/env.ts` weigert deze in productie. Er is geen aangetoonde echte provideradapter, provideracceptatie of sandboxuitslag voor de beoogde geldstroom.
- `docs/PHASE7.md` registreert geslaagde lokale tests, waaronder vijf beperkte browser-rookproeven. De volledige ingelogde gebruikersroute, de proef met vijf tot tien garages en een onafhankelijke beveiligingsreview zijn niet aangetoond.
- De werkboom bevat nog niet vastgelegde wijzigingen. Het laatste Git-commit (`1e1d572`) is daarom niet de geteste, bevroren vrijgaveversie. Er is geen vrijgavecommit om als pilotbasis te accepteren.
- Voor juridische teksten, behandelingskosten, productieaccounts, herstel van de uiteindelijke omgeving en expliciete pilotomvang is in dit project geen afgetekend bewijs vastgelegd. Dat betekent **niet aangetoond**, niet dat zulke externe documenten onmogelijk bestaan.
- Er zijn bij deze audit geen productie-instellingen veranderd, geen echte deelnemers uitgenodigd, geen betaalacties gestart en geen publicatie uitgevoerd.

De eerstvolgende toegestane route is fase 7 afronden in een gescheiden acceptatieomgeving, de juridische/commerciële en providerbesluiten met niet-gevoelige dossierverwijzingen vastleggen, daarna de volledige regressie op één bevroren commit uitvoeren en de ondernemer om een apart, begrensd pilotbesluit vragen. Geheimen, contracten en persoonsgegevens blijven buiten Git en chat.

## Harde toegangspoort

Start geen livepilot voordat de ondernemer deze punten met datum en bewijs heeft afgetekend:

| Voorwaarde | Huidige status | Vereist bewijs |
|---|---|---|
| Juridische rol, bied-/koopvoorwaarden, klachten, privacy en bewaartermijnen goedgekeurd | Open | Beoordeelde versies en schriftelijk akkoord |
| Behandelingskosten, betaler, btw en facturatie vastgesteld | Open | Bedrijfsbesluit plus fiscale/juridische controle; geen `test_unconfigured` |
| Betaalprovider accepteert de specifieke autohandel/geldstroom | Open | Schriftelijke product- en sectoracceptatie, contract en productieactivatie |
| Echte provideradapter en sandboxscenario's P01–P12 geslaagd | Open | Testlog met webhook-, holding-, uitbetalings-, geschil- en refundbewijs |
| Onafhankelijke beveiligingsreview zonder kritieke/hoge open punten | Open | Rapport, herstel- en hertestverwijzingen |
| Fase-7-gebruikersproef met vijf tot tien garages en verkoper/beheer | Open | Anonieme taakresultaten en besluit over afwijkingen |
| Productieaccounts, monitoring, e-mail, database- en Storage-back-up plus geïsoleerde herstelproef | Open | Configuratiecontrole, incidentcontact, RTO/RPO en herstelverslag |
| Browser-E2E en volledige regressie op een bevroren vrijgavecommit | Open | Uitvoerlog, commit-ID en expliciete acceptatie |
| Expliciete toestemming van de ondernemer voor **deze** afgebakende pilot | Open | Datum, cohort, startmoment, maximale omvang, stopverantwoordelijke |

Een groen vakje in een checklist zonder bewijs telt niet als voltooiing. Productie- en betaalinstellingen blijven uit tot alle voorwaarden zijn vervuld. Bewaar contracten, persoonsgegevens en sleutels buiten Git en chat; verwijs hier hoogstens naar een interne dossiercode.

## Afbakening van de pilot (nog te besluiten)

- Alleen vooraf door de ondernemer geselecteerde en handmatig goedgekeurde garages. Leg de namen en contracten op een beveiligde bedrijfslocatie vast, niet in deze repository.
- Alleen verkopers die bewust deelnemen en de definitieve voorwaarden/privacyinformatie hebben ontvangen. Geen automatische uitnodiging van bestaande testaccounts.
- De ondernemer kiest vóór start een maximaal aantal gelijktijdige aanvragen en rondes, een einddatum, een contactpersoon overdag en buiten kantooruren en wie de pilot mag stilzetten. Vul geen willekeurige aantallen of beloofde termijnen in.
- Houd ontwikkeling, acceptatie en productie strikt gescheiden. Geen fictieve testdata, simulatorrecords of testtarieven in productie.
- Iedere deelnemende auto doorloopt foto- en gegevenscontrole vóór publicatie. Eigen biedingen van Thijs blijven zichtbaar onder dezelfde biedregels, met expliciete functiescheiding tussen zijn beheer- en dealeridentiteit.

## Proefvolgorde na vrijgave

1. **Startcontrole:** leg codecommit, migratieversies, omgevings- en providerstatus, herstelpunt, bereikbaarheidsrooster en stopcriteria vast. Controleer dat testprovider en conceptvoorwaarden uitgeschakeld zijn.
2. **Eerste aanvraag:** laat één deelnemende verkoper het volledige formulier, e-mailverificatie, fotocontrole en eigen dossier doorlopen. Controleer zonder persoonsgegevens in technische logs dat precies één aanvraag en notificatie zijn opgeslagen.
3. **Eerste veiling:** publiceer pas na beheercontrole. Laat ten minste twee goedgekeurde garages de geautoriseerde bedragen en tijdstippen zien en biedingen plaatsen. Verifieer 24 uur, minimumstap, deadline en één winnaarreservering; geen automatische koop.
4. **Afspraak en inspectie:** winnaar en verkoper bevestigen de afspraak; alleen de winnaar krijgt na bevestiging contactgegevens. Documenteer inspectie en eventuele prijsafwijking apart van het oorspronkelijke bod. Beide partijen bevestigen exact hetzelfde koopconcept.
5. **Echte betaling en overdracht:** uitsluitend via de goedgekeurde provider. Vergelijk provider- en platformstatus, bedrag, valuta en ontvanger. Controleer de afgesproken vrijgavevoorwaarde en verifieer uitbetaling in beide administraties voordat het dossier als afgehandeld geldt.
6. **Probleemroute:** oefen een no-show/klacht met een afgesproken, veilig scenario zonder een echte betaling kunstmatig terug te draaien. Test geschil/refund alleen waar de provider dit voor de pilot schriftelijk ondersteunt.
7. **Dagafsluiting:** controleer per pilotdag open aanvragen, verlopen rondes, winnaarreserveringen, afspraken, onopgeloste klachten, outbox, providertransacties, uitbetalingen en reconciliatieverschillen. Een verschil krijgt een incidenthouder en wordt niet stilzwijgend weggeboekt.

## Stop- en terugvalregels

De aangewezen pilotverantwoordelijke pauzeert nieuwe aanvragen/publicaties/betalingen bij een onbevoegd gegevenslek, bied- of winnaarafwijking, onverklaard geldverschil, ongeverifieerde providerstatus, ontbrekende back-up, niet-bezorgde cruciale notificaties zonder handmatige opvolging of een kritieke/hoge beveiligingsbevinding. Bestaande biedingen, klachten en betaal-/auditgeschiedenis worden niet verwijderd om een fout te verhullen. Leg tijdstip, getroffen dossiers, genomen maatregelen en communicatie vast. Hervat pas na oorzaakanalyse, hersteltest en schriftelijke toestemming van de ondernemer.

Een webdeploy terugdraaien is niet hetzelfde als een databasemigratie of betaling terugdraaien. Behandel financiële correcties uitsluitend via de goedgekeurde provider en de gedocumenteerde boekhoud-/refundroute. Gebruik het vooraf geteste database- en Storage-herstelplan alleen met de bevoegde eigenaar en volgens het overeengekomen RTO/RPO.

## Dagelijks bewijs en afsluitcriterium

Noteer per dag: datum, commit, aantal aanvragen/ronde-uitkomsten/koopakkoorden, providerorders/uitbetalingen/refunds, reconciliatieverschillen, klachten/no-shows, incidenten, outboxfouten, back-upstatus en verantwoordelijke. Gebruik totalen en interne dossiercodes; geen namen, kentekens, bankgegevens of tokens in Git.

De beperkte pilot is pas afgerond als alle deelnemende dossiers een verklaarde status hebben, uitbetalingen en provideradministratie aansluiten, overdrachten en klachten herleidbaar zijn, geen kritieke/hoge bevinding openstaat en de ondernemer expliciet beslist of het volume mag groeien. Een lokaal geslaagde test of een foutloze eerste transactie is daarvoor onvoldoende.

## Wat nu veilig kan

Het draaiboek en de bewijsformulieren beoordelen; fase-7-bewijzen verzamelen; een externe reviewer en provider benaderen; definitieve juridische/commerciële besluiten vastleggen; daarna pas een echte provideradapter in **sandbox** bouwen en toetsen. Dit document activeert geen van die externe systemen.
