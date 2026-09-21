# Besloten proef — draaiboek en bewijs

Dit draaiboek gebruikt uitsluitend fictieve persoonsgegevens totdat de juridische teksten, bewaartermijnen en verwerkersafspraken zijn goedgekeurd. Een geslaagde lokale proef is geen toestemming om te publiceren.

## Rollen

- Eén beheerder met TOTP en een sessie op `aal2`.
- Twee afzonderlijke goedgekeurde fictieve dealerbedrijven.
- Eén pending en één geblokkeerd fictief dealerbedrijf.
- Eén testbegeleider die de verwachte uitkomst per stap noteert.

Gebruik voor iedere proef unieke adressen onder `example.test`. Gebruik geen echte kentekens, telefoonnummers, namen of foto’s.

## Proef 1 — publieke aanvraag

1. Start lokale Supabase en de Next.js-app.
2. Meld een fictieve auto aan met één kunstmatige JPEG-foto.
3. Simuleer RDW-uitval en controleer dat handmatige invoer mogelijk blijft.
4. Dubbelklik tijdens verzenden en herhaal daarna hetzelfde netwerkverzoek.
5. Controleer dat precies één aanvraag en één publieke referentie bestaan.
6. Controleer dat de foto onder `applications/` staat, privé is en status `pending` heeft.
7. Controleer dat `application.received` in de outbox staat, ook zonder Resend-configuratie.
8. Controleer dat contactgegevens niet in `sessionStorage` of analytics-events staan.

## Proef 2 — beheer en fotocontrole

1. Controleer dat een beheerder op `aal1` naar MFA wordt gestuurd.
2. Open de aanvraag op `aal2` en controleer voertuig- en verkopersgegevens.
3. Voeg een interne notitie toe en controleer dat een dealer deze niet kan lezen.
4. Keur alleen een foto zonder zichtbare persoonsgegevens goed.
5. Zet de aanvraag via toegestane stappen op `ready`.
6. Publiceer een biedronde met een start- en eindtijd in Europe/Amsterdam en controleer de opgeslagen UTC-tijden.
7. Controleer de auditregels voor status, fotoreview en publicatie.

## Proef 3 — dealer en biedingen

1. Controleer dat pending en blocked bedrijven geen aanbod zien, ook niet via een rechtstreeks verzoek.
2. Laat dealer A een bod plaatsen en daarna verhogen.
3. Controleer dat dealer A alleen de eigen historie ziet.
4. Controleer dat dealer B geen bedrag of historie van dealer A ziet en onafhankelijk kan bieden.
5. Herhaal één verzoek met dezelfde idempotentiesleutel; er mag geen tweede bod ontstaan.
6. Probeer een lager bod en een bod na de deadline; beide moeten worden geweigerd.
7. Controleer dat alle geldige biedingen append-only zijn en een outboxregel hebben.

## Proef 4 — afhandeling en materiële wijziging

1. Sluit de biedronde en controleer dat dit geen automatische verkoop veroorzaakt.
2. Selecteer bewust een bod en doorloop `discussing`, `agreement_pending`, `agreed` en `completed`.
3. Leg een fictief contactmoment vast en controleer de auditlog.
4. Herhaal met een nieuwe aanvraag en wijzig na een bod de kilometerstand of schade.
5. Controleer dat de publicatie wordt ingetrokken, de ronde wordt geannuleerd en oude biedingen/revisies intact blijven.
6. Publiceer opnieuw en controleer dat een nieuwe revisie en ronde ontstaan.

## Proef 5 — storing en herstel

1. Laat Resend bewust ongeconfigureerd en controleer dat aanvraag en bod bewaard blijven.
2. Maak een database-export en een afzonderlijke Storage-export volgens `docs/RECOVERY.md`.
3. Herstel beide in een geïsoleerde omgeving.
4. Voer na herstel alle geautomatiseerde controles en minimaal proef 2 en 3 opnieuw uit.
5. Verwijder uitsluitend de geïsoleerde herstelomgeving en tijdelijke exports.

## Bewijsformulier

Leg per proef vast:

- datum en applicatiecommit;
- lokale, acceptatie- of productieachtige omgeving;
- uitvoerder en onafhankelijke controleur;
- gebruikte fictieve scenario-ID’s, nooit geheimen of persoonsgegevens;
- geslaagd/mislukt per stap;
- schermafbeelding of logverwijzing zonder tokens of persoonsgegevens;
- afwijking, eigenaar en hersteltermijn;
- hertestdatum en uitkomst.

## Huidige lokale nulmeting

Op 21 september 2026 is één lokale publieke proef gecontroleerd zonder persoonsgegevens in het bewijs vast te leggen:

- precies één aanvraag met publieke referentie;
- één definitief privéfoto-object onder `applications/`;
- fotoreview start op `pending`;
- `application.received` staat duurzaam op `pending` in de outbox;
- alle 94 database- en RLS-tests slagen terwijl deze proefdata aanwezig blijven.

Dit bewijst alleen het publieke opslagpad en de testisolatie. De volledige dealerproef, herstelproef en onafhankelijke beveiligingscontrole staan nog open.
