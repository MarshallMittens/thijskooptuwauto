# Herstelprocedure — voorbereiding

De lokale synthetische proef is op 22 september 2026 geslaagd: 82 tabellen zijn naar een willekeurig benoemde tijdelijke PostgreSQL-database hersteld en één private Storage-fixture is via een tijdelijke bron- en doelbucket met SHA-256 gecontroleerd. Tijdelijke middelen zijn daarna verwijderd. Dit is geen productieback-up en geen acceptatieherstel; een aantoonbaar geslaagde proef op de uiteindelijke beheerde omgeving blijft een blokkade voor livegang.

Lokaal opnieuw uitvoeren:

```powershell
npm run test:recovery
```

Het script weigert iedere Supabase-URL die niet `localhost` of `127.0.0.1` gebruikt.

## Te beschermen onderdelen

1. PostgreSQL-schema en gegevens, inclusief Auth-koppelingen, auditlog en biedingen.
2. Private Storage-objecten in `vehicle-photos`.
3. Omgevingsconfiguratie en geheimen via de beheerplatforms; nooit in de back-uprepository.
4. Git-repository en genummerde migraties.

## Herstelproef

1. Maak een versleutelde database-export en een afzonderlijke inventaris/export van alle Storage-objecten.
2. Maak een lege, geïsoleerde herstelomgeving in dezelfde compatibele versies.
3. Pas eerst alle migraties uit Git toe en herstel daarna de gegevens volgens de gekozen Supabase-procedure.
4. Herstel de foto-objecten met exact dezelfde bucketpaden en private toegangsinstellingen.
5. Controleer met fictieve data minimaal één aanvraag, verkopersrecord, foto, voertuigversie, biedronde, bod, contactmoment, afhandeling en auditregel.
6. Voer de volledige testset uit en controleer dat dealers geen verkopersgegevens, interne notities of identiteit van andere biedende bedrijven kunnen lezen. De geautoriseerde biedbedragen en tijdstippen moeten wel gelijk zichtbaar blijven voor goedgekeurde dealers.
7. Noteer datum, uitvoerder, back-uptijdstip, hersteltijd, gegevensverliesvenster, afwijkingen en bewijs van de test.
8. Vernietig de geïsoleerde herstelomgeving en tijdelijke exports volgens de afgesproken procedure.

## Open keuzes

- Back-upfrequentie, retentie en versleutelde opslaglocatie.
- Gewenste maximale hersteltijd en maximaal gegevensverlies.
- Wie een herstel mag starten en wie onafhankelijk controleert.
- Procedure voor sleutelverlies en beheeraccount-/MFA-herstel.
