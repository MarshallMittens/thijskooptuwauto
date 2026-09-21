# Herstelprocedure — voorbereiding

Deze procedure is voorbereid maar nog niet als productiehersteltest uitgevoerd. Een aantoonbaar geslaagde proef in een geïsoleerde acceptatieomgeving blijft een blokkade voor livegang.

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
6. Voer de volledige testset uit en controleer dat dealers nog steeds geen verkopersgegevens, interne notities of biedingen van anderen kunnen lezen.
7. Noteer datum, uitvoerder, back-uptijdstip, hersteltijd, gegevensverliesvenster, afwijkingen en bewijs van de test.
8. Vernietig de geïsoleerde herstelomgeving en tijdelijke exports volgens de afgesproken procedure.

## Open keuzes

- Back-upfrequentie, retentie en versleutelde opslaglocatie.
- Gewenste maximale hersteltijd en maximaal gegevensverlies.
- Wie een herstel mag starten en wie onafhankelijk controleert.
- Procedure voor sleutelverlies en beheeraccount-/MFA-herstel.
