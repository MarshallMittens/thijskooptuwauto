# Publicatie, migraties en herstel

De applicatie is nog niet gepubliceerd. Geen van onderstaande stappen mag zonder expliciete toestemming worden uitgevoerd.

## Omgevingen

- Lokaal: Supabase CLI en fictieve gegevens.
- Acceptatie: afzonderlijk Supabase-project en Vercel Preview/acceptatieconfiguratie.
- Productie: afzonderlijk Supabase-project, Vercel-productieomgeving en Resend-domein.

Gebruik per omgeving afzonderlijke sleutels. Kies bij inrichting nabijgelegen ondersteunde EU-regio’s voor database en serverfuncties.

## Benodigde fase-2-variabelen

- `APP_URL`: publieke origin zonder pad.
- `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publieke projectconfiguratie.
- `SUPABASE_SERVICE_ROLE_KEY`: alleen server-side voor afgebakende concept-, upload- en notificatieroutes.
- `REQUEST_FINGERPRINT_SECRET`: een willekeurige waarde van minimaal 32 tekens per omgeving voor gehashte rate-limitidentifiers.
- `DRAFT_TOKEN_SECRET`: een afzonderlijke willekeurige waarde van minimaal 32 tekens waarmee stabiele, IP-onafhankelijke conceptcapabilities worden afgeleid.
- `RDW_APP_TOKEN`: optioneel; openbare RDW-opvragen werken zonder token binnen de actuele limieten.
- `RESEND_API_KEY` en `RESEND_FROM_EMAIL`: pas instellen na eigen account- en domeinverificatie.

Zet geheimen nooit in Git, browsercode of chat. Gebruik aparte waarden voor development, preview en productie.

## Voor publicatie

1. Bedrijfsaccounts onder eigendom van Thijskooptuauto maken en MFA activeren.
2. Privérepository koppelen; branch protection en review instellen.
3. Alle migraties eerst op acceptatie toepassen en database-tests uitvoeren.
4. Vercel-variabelen per Development, Preview en Production instellen.
5. Productiebeheerder gecontroleerd bootstrappen en TOTP verifiëren.
6. Resend-domein met SPF/DKIM verifiëren; API-key alleen server-side opslaan.
7. Juridische teksten, privacyregister en bewaartermijnen laten beoordelen.
8. Onafhankelijke beveiligingscontrole en volledige besloten proef uitvoeren.

## Migraties

- Migraties zijn voorwaarts, genummerd en worden nooit achteraf aangepast nadat ze gedeeld zijn.
- Iedere RLS- of functieaanpassing bevat een negatieve database-test.
- Maak vóór risicovolle productie-migraties een herstelpunt en leg de terugvalprocedure vast.

## Back-up en herstel

- Database- en Storage-herstel zijn twee afzonderlijke processen.
- Leg retentie, exportlocatie, encryptie en verantwoordelijke persoon vast.
- Herstel minimaal één volledige fictieve aanvraag met foto’s in een geïsoleerde omgeving.
- Noteer hersteltijd, gegevensverliesvenster en afwijkingen.
- Livegang is geblokkeerd totdat deze hersteltest aantoonbaar is geslaagd.

## Onderhoud private uploads

Niet-afgeronde concepten vervallen na dertig minuten. Vóór livegang moet een geplande servertaak objecten onder verlopen conceptpaden verwijderen en pas daarna de conceptregels opruimen. Test dit met fictieve foto’s; een databaseback-up bevat de Storage-objecten niet automatisch.
