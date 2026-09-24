# Fase 7 — vrijgavedossier (22 september 2026)

**Status: in uitvoering, geen livegangbesluit.** Dit dossier onderscheidt geautomatiseerde lokale tests, handmatige gebruikersproef, externe goedkeuring en onafhankelijke review. Een lokale test of deze interne codecontrole geldt niet als externe goedkeuring. Fase 8 en productiebetaling blijven geblokkeerd.

## Wat lokaal aantoonbaar is

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:db` en `npm run build` zijn op 22 september 2026 opnieuw geslaagd. De testset bevat 49 unit- en 272 SQL/RLS-tests; de drie extra SQL-proeven controleren exact 24 uur tijdens beide tijdswisselingen en het behoud van een regelsnapshot na een beleidswijziging. Zie ook het actuele uitvoerlog van de vrijgavecommit; deze aantallen zijn geen blijvende garantie.
- `npm run test:e2e` heeft vijf lokale Chrome-browserproeven doorstaan: kentekenactie, validatiefout, gastenblokkade voor dealer/beheer, mobiele publieke routes en handmatige invoer bij gesimuleerde RDW-uitval. De proef gaat tot het controlescherm, maar verstuurt bewust geen aanvraag en gebruikt geen ingelogde testidentiteiten. Dit is een rookproef, geen volledige F01–F12-acceptatie.
- `npm run test:e2e:acceptance` heeft op 23 september 2026 één volledige lokale fictieve browserroute doorstaan met vier gescheiden sessies: verkoper, beheerder met MFA en twee garages met ieder MFA. De route omvat aanvraag bij RDW-uitval, foto-upload, Mailpit-verificatie, dealerregistratie en beheergoedkeuring, publicatie, twee zichtbare anonieme biedingen, winnaarreservering, afspraak, inspectie, dubbele bevestiging van hetzelfde testkoopconcept en een afgeschermde dealerklacht. Een niet-winnende garage zag het gewonnen dossier en de klacht niet. De 24-uurswachttijd is uitsluitend voor deze unieke lokale testronde databasegestuurd versneld.
- In deze fase is de klachtgrens aangescherpt: autorisatie vóór opslag van bewijs, afwijzing na sluiten, onveranderlijke tweede beoordeling en de mogelijkheid voor een winnaar om vóór een betaling een afspraak-/no-showprobleem te melden. De negatieve tests in `supabase/tests/database/phase6_operations.test.sql` dekken anoniem, ander bedrijf, andere verkoper, staff zonder MFA, geblokkeerd bedrijf en gesloten klacht.
- De lokale simulator verwerkt geen echt geld en bewijst geen geschiktheid van een betaalprovider voor voertuigen of particuliere verkopers.
- `npm run test:concurrency` is geslaagd: twee gelijktijdige gelijke biedingen leverden één opgeslagen bod op. `npm run test:recovery` is geslaagd: 82 tabellen en één privéobject zijn geïsoleerd lokaal hersteld. Herhaal beide op de uiteindelijke vrijgavecommit. De herstelproef is uitsluitend lokaal/synthetisch.

## Interne technische controle — geen onafhankelijke review

| Bevinding | Ernst vóór herstel | Oplossing | Hertest |
|---|---|---|---|
| Klachtbewijs werd met servicebevoegdheid naar private Storage geschreven voordat objecttoegang was vastgesteld. | Hoog | Geauthenticeerde `can_upload_complaint_evidence`-controle vóór upload; databasecontrole bij registratie blijft bestaan. | Negatieve SQL-tests voor vreemde/gesloten dossiers en geblokkeerde gebruikers. |
| Een gesloten klacht accepteerde nog rechtstreekse berichten/statusmutaties. | Middel | Actieve status onder rijvergrendeling afdwingen; geen stilzwijgende heropening. | Negatieve SQL-tests op `add_complaint_message` en `admin_update_complaint`. |
| Een tweede beoordeling kon later opnieuw worden geschreven. | Middel | Eenmalige beoordeling alleen zolang het dossier actief is. | Negatieve SQL-test na sluiting. |
| Een garage kon een no-show of afspraakprobleem niet melden vóór een betaalorder. | Middel | Klachtopening koppelen aan eigen winnaarreservering in plaats van verplicht aan betaling. | SQL-tests voor eigenaar, vreemde garage en idempotentie. |
| De magic-linkcallback bouwde de eindredirect uit een intern `localhost`-origin terwijl de sessiecookie op `127.0.0.1` stond. | Hoog lokaal reproduceerbaar | Alle callbackredirects gebruiken de gevalideerde `APP_URL`; verkoperspagina verifieert zo nodig aanvullend via Supabase Auth. | Volledige Mailpit-link en herladen dossier in Chrome. |
| Een PostgreSQL-afspraakmoment met `+00:00` werd door de servervalidatie geweigerd. | Middel | Geldige ISO-tijdzone-offsets expliciet toegestaan. | Verkoper bevestigt in Chrome een door de garage voorgesteld moment. |
| Een gesloten ronde zonder winnaar gaf `isHighest = null`, terwijl het beheerscherm alleen boolean accepteerde en 404 toonde. | Middel | `null` wordt in de weergaveschema’s veilig als ‘niet hoogste’ behandeld. | Beheerroute en volledige winnaarroute in Chrome; databaseproeven blijven groen. |

Resterende technische bewijsstukken voor fase 7: herhaling van de nu lokaal geslaagde volledige browserroute tegen een afzonderlijke acceptatieomgeving en bevroren commit, onafhankelijke beveiligingsreview, belasting-/misbruiktest, echte provider-sandboxproef, volledige acceptatieherstelproef en toetsing van de uiteindelijke hostingconfiguratie. Het ontbreken hiervan is **geen** geconstateerde kwetsbaarheid, maar wel een vrijgaveblokkade.

## Onafhankelijke reviewer: opdracht en bewijs

Laat een externe beoordelaar die deze implementatie niet heeft geschreven minimaal beoordelen: grants/RLS/RPC's; staff/dealer/verkoper-rolscheiding en MFA; directe Data API-toegang; veilinglocks, deadline, idempotentie, tie-break en sluittaak; foto-/bewijsuploads en signed URLs; betaaladapter/webhook-validatie, geldstroom, vrijgave, refund en reconciliatie; privacy/logging; secrets, back-up en herstel. Gebruik uitsluitend een afgeschermde testomgeving met fictieve data. Lever geen productiegeheimen via chat aan.

Bewijs per bevinding: codecommit, scenario, ernst, reproduceerstappen zonder geheimen, eigenaar, fixcommit, hertestresultaat en expliciete reviewerbevestiging. Kritieke of hoge open bevindingen blokkeren de vrijgave. Een door Codex uitgevoerde controle telt niet als onafhankelijk.

## Juridische en providerbesluiten

De volgende zaken vereisen schriftelijke bevestiging door de ondernemer en betrokken deskundige/provider; vul geen fictief akkoord in:

1. Juridische rol van Thijs als platform en eventuele zelf inkopende garage, bindingsmoment, biedgeldigheid, annulering/no-show, inspectie en prijsafwijking, klachten en belangenconflict.
2. Behandelingskosten: exact bedrag/formule, wie betaalt, btw-/factuurbehandeling, moment van verschuldigdheid en restitutie. Zolang onbekend blijft `test_unconfigured`/€0 uitsluitend testconfiguratie.
3. Privacy-/verwerkersdocumenten: bewaartermijnen, verwijdering inclusief foto's en bewijs, identificatie, bankgegevens, rechten van betrokkenen, eventuele DAC7-beoordeling en verwerkers-/doorgifteafspraken.
4. Betaalprovider: schriftelijke acceptatie van auto-/particulier-/garagetransacties, bedragen, gesplitste geldstromen, identiteit/IBAN-verificatie, betaalmethoden, vasthouden/vrijgeven/uitbetalen, geschillen/refunds, risicoverdeling en webhook-/reconciliatiemogelijkheden. Een simulator of algemene providerdocumentatie volstaat niet.
5. Productiebedrijfseigendom: accounts, domein, afzender, monitoring, incidentcontact, back-upretentie, RTO/RPO en noodtoegang met MFA.

Bewaar besluiten en goedkeuringen in het bedrijfsdossier; leg hier alleen een niet-gevoelige verwijzing, datum, versie, verantwoordelijke en status vast. Koppel productie pas na een afzonderlijk expliciet livegangbesluit.

## Gebruikersproef: vijf tot tien garages

De proef is nog **niet uitgevoerd**. Laat vijf tot tien geselecteerde garages met fictieve auto's in een afgeschermde acceptatieomgeving elk dezelfde taken uitvoeren: registreren en wachten op goedkeuring; aanbod en zichtbare biedbedragen begrijpen; bieden en overbieden; verlies/winst en 24-uursdeadline begrijpen; als winnaar afspraak plannen, inspectie en prijsafwijking registreren, concept wel/niet bevestigen; een no-show/klacht melden; zien dat betaling alleen als `simulated/test` wordt aangeduid. Laat minimaal één verkoper en één beheerder de corresponderende stappen uitvoeren. Vraag gericht naar helderheid van bedragen, identiteit, termijnen, contactvrijgave, verplichtingen en foutmeldingen. Gebruik geen echte persoonsgegevens of voertuigfoto's.

Leg per deelnemer alleen een pseudonieme proefcode, datum, commit, apparaat/browser, geslaagde/mislukte taken, begripvragen, ernst van problemen en hertest vast. Leg geen e-mail, kenteken, telefoon of volledige schermopname met persoonlijke gegevens in Git vast. Laat de ondernemer expliciet beoordelen of de informatie voldoende is voor een serieus bod.

## Acceptatiebewijs per bouwplan

De scenario-ID's komen uit het aangeleverde bouwplan, §14. "Lokaal" betekent code-/databasebewijs, niet volledige acceptatie.

| Reeks | Lokaal bewijs | Nog vereist voor fase 7 |
|---|---|---|
| F01–F04 | Aanvraag, RDW-uitval, Mailpit-link, twee garages, beheergoedkeuring, publicatie en biedingen lokaal in Chrome; negatieve RLS-tests | Herhaling in gescheiden acceptatie en echte e-mailconfiguratie |
| F05–F07 | Deadline-, overbied-, sluit- en idempotentietests; lokale Chrome-route tot één winnaar | Herstel van browserverbinding, geen-bodcopy en begripstoets met proefgebruikers |
| F08–F10 | Afspraak, inspectie en dubbele bevestiging lokaal in Chrome en SQL | Afwijkend-prijspad in browser; goedgekeurde contracttekst en acceptatieomgeving |
| F11–F12 | Dealerklacht en afscherming voor niet-winnaar lokaal in Chrome; no-show en rolafscherming in SQL | Handmatige no-showproef en onafhankelijke toets van zelf meebieden |
| T01–T08 | Database-/concurrencytests voor lock, deadline, herhaling en sluiten | Vrijgavecommit opnieuw testen; browser- en jobherstelproef |
| T09–T10 | SQL-proeven voor exacte 86400 seconden bij zomer-/wintertijd en regelsnapshot na beleidswijziging | Herhaling en gebruikersweergave in geïsoleerde acceptatieomgeving |
| S01–S09 | Negatieve RLS/RPC-tests, private Storage en lokale codecontrole | Externe pentest/review, directe API-, browser-, upload- en secretcontrole |
| P01–P10 | Alleen simulatie van webhook, status, vrijgave, refund en outbox | Echte provider-sandbox met gedocumenteerde testgevallen |
| P11–P12 | Lokale synthetische herstelproef en productieverbod op simulator | Geïsoleerde acceptatieherstelproef en formele go-live-configuratiecheck |

**Vrijgavebesluit:** pas wanneer alle externe bewijsstukken beschikbaar zijn, er geen kritieke/hoge open bevindingen zijn, de proefafwijkingen zijn geaccepteerd/opgelost en de ondernemer expliciet toestemming geeft. Zonder dat besluit blijven hostingpublicatie, echte accounts, echte betalingen en fase 8 uit.
