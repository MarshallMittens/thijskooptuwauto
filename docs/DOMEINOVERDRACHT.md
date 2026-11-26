# Thijskooptuwauto — voorbereiding domeinovergang

## Actuele stand — 26 november 2026

**De testversie werkt nu via [thijskooptuwauto.nl](https://thijskooptuwauto.nl/) én [www.thijskooptuwauto.nl](https://www.thijskooptuwauto.nl/) met geldig HTTPS.** Beide zijn directe aliases van dezelfde bestaande `READY`-Preview. Dit blijft gratis niet-commercieel prototypetesten met fictieve gegevens; er is geen abonnement of nieuwe Production-build geactiveerd. De eerdere voorbereiding hieronder verlangt geen nieuwe publicatietoestemming.

- Vercel CLI-login is geslaagd. Het bestaande project `thijskooptuwauto` (`prj_GP6uLZmzi6epfLjNtn66QAghXCsR`) is gekoppeld aan `MarshallMittens/thijskooptuwauto`, branch `main`. De projectinstelling Node.js is via de API van 24.x naar 22.x gezet.
- Het team blijft **Hobby**. [Vercel-medewerker Anshuman Bhardwaj bevestigt](https://community.vercel.com/t/is-hobby-plan-suitable-for-a-saas-prototype/7205) dat ideeën en prototypes daarop kunnen worden getest. De huidige proef blijft niet-commercieel en gebruikt fictieve aanvragen en biedingen; Pro is hiervoor geen voorwaarde. Voor echte commerciële livegang gelden afzonderlijk de [Hobby-voorwaarden](https://vercel.com/legal/terms#hobby-plan) en passende hosting. [Vercel Pricing](https://vercel.com/pricing) vermeldt Pro vanaf $20 per maand exclusief btw, met mogelijk aanvullende verbruikskosten; er is geen betaald plan gestart.
- De laatste productie-deployment heeft status `ERROR`, met melding `npm run build exited 1`. Alle tien aangetroffen omgevingsvariabelen zijn uitsluitend aan Preview gekoppeld; Production heeft nog geen eigen configuratie. Er is geen `RESEND_API_KEY`-variabelenaam in Vercel aangetroffen; er zijn geen sleutelwaarden in dit document opgenomen.
- DNS bleef ongewijzigd: apex-A-records `64.29.17.1` en `216.198.79.1`, en `www`-CNAME `7f9993a3a650ace3.vercel-dns-017.com.`. Beide namen zijn met Vercel CLI direct aan deployment `dpl_4R872wv8a8ZaNDF4P3Sc1hkV57qN` toegewezen. Onafhankelijke controles om 18:41 CET bevestigen HTTPS HTTP 200 en normale TLS-validatie op apex en `www`, met dezelfde pagina en ETag als de acceptatiealias.
- De gemelde www-404/certificaatfout is opgelost. Vercel maakte automatisch een gratis geldig certificaat aan met SAN `DNS:www.thijskooptuwauto.nl`; er is geen certificaatwaarschuwing omzeild. Mailboxrecords, abonnement, appcode en Production-deployment zijn niet gewijzigd.
- De Project Domains-API vermeldt nog alleen `thijskooptuwauto.vercel.app`. De eigen namen werken als **directe deploymentaliases**, niet als formeel ingerichte commerciële productiedomeinen. De eerdere fout bij toevoegen als projectdomein en de bestaande Production-build met status `ERROR` zijn hiermee niet als productie opgelost.
- De password-only migratie `202611200001_password_only_portal_access.sql` is succesvol toegepast op het bestaande acceptatie-Supabase-project; de gelezen migratielijst bevestigt deze versie lokaal en remote. Rollen, blokkades en objectrechten blijven behouden en bestaande factorrecords zijn intact. Productie is niet gemigreerd.
- Nieuwe Preview `dpl_4R872wv8a8ZaNDF4P3Sc1hkV57qN` is `READY`: [deployment-URL](https://thijskooptuwauto-nq9nhfohd-jeroenderaef-6403.vercel.app), GitHub-codebasis `3e45e61`, Node.js 22.x en functieregio `fra1`. De [acceptatiealias](https://thijskooptuwauto-acceptatie.vercel.app/) is succesvol aan deze deployment gekoppeld en toont nu de nieuwe versie. GitHub bevat dezelfde code; configuratie en acceptatiemigratie passen bij deze release.

**Prototype bereikbaar en publiek getest:** `/api/health` geeft HTTP 200 met `status: ok`. Alle zeven publieke Playwright-proeven zijn in 23,7 seconden geslaagd, inclusief formulier tot bevestiging, mobiel/layout en beschermde redirects. Een afzonderlijke, niet-gemockte RDW-POST op acceptatie gaf HTTP 200 met `found: true` en `unavailable: false`. Er is geen echte aanvraag ingediend en geen e-mail verstuurd. Ingelogde online E2E en mailbezorging zijn niet getest; `RESEND_API_KEY` ontbreekt nog. De alias is publiek bereikbaar; er is geen private Vercel-toegangslaag aangetoond. Dealer- en beheerrechten blijven begrensd door applicatie-authenticatie en RLS. De Pro-keuze blokkeert deze niet-commerciële prototypeproef niet.

Dezelfde zeven publieke Playwright-proeven zijn vervolgens via `https://www.thijskooptuwauto.nl` herhaald en allemaal geslaagd in 22,2 seconden. Ook daarbij is geen aanvraag ingediend of e-mail verstuurd.

**Volgende Preview-update:** controleer eerst de nieuwe deployment en werk daarna alle drie aliases handmatig bij: `thijskooptuwauto-acceptatie.vercel.app`, `thijskooptuwauto.nl` en `www.thijskooptuwauto.nl`. Ze verwijzen nu vast naar de bestaande deployment-ID en volgen een nieuwe Preview niet automatisch.

**Later voor commerciële productie:** passende hosting kiezen, afzonderlijke productie-Supabase/configuratie/mail en exacte Auth-callbacks inrichten, migraties vóór de applicatie toepassen en een geslaagde Production-deployment maken. Richt apex en `www` dan correct als projectdomeinen in en controleer HTTPS en de werkelijke aanvraag-/login-/mailroute opnieuw. Behoud bestaande mailboxrecords. Vervallen testbetalingen en simulatoronderdelen blijven uit.

Controles op 26 november: repositorycontrole (312 bestanden), lint, TypeScript, 69 unit-tests en Next.js-build geslaagd. De SQL-suite is niet herhaald omdat de Docker-engine niet beschikbaar is; de 398 geïsoleerde lokale SQL-controles en gerichte password-only browserproef van 20 november blijven eerder bewijs voor dezelfde code. Zij bewijzen geen werkende productieomgeving.

## Historische voorbereiding — 10 november 2026

Onderstaande tekst is de toenmalige momentopname. De actuele status en publicatieautorisatie hierboven gaan voor; oude toestemmings- en hostingstatussen zijn geen nieuwe opdrachtbeperking.

**Status op 10 november 2026: acceptatie gecontroleerd, geen productievrijgave.** De website die wij hebben gebouwd komt na vrijgave op `https://thijskooptuwauto.nl`. Het domein blijft bij de huidige provider. De bestaande website, DNS, mailboxen en Vercel-instellingen zijn bij deze voorbereiding niet gewijzigd.

### Toenmalige instructie voor de DNS-beheerder

DNS staat bij de huidige provider (`ns.vservs.eu`, `ns.vservs.com` en `ns.vservs.net`). Verhuis het domein of de nameservers niet. Wijzig pas iets na een afzonderlijk akkoord van Thijs én nadat de nieuwe productieomgeving klaarstaat. Het acceptatieadres wordt niet het doel van de omschakeling.

Voor het bestaande Vercel-project `thijskooptuwauto` zijn dit de voorkeurswaarden die Vercel op 10 november 2026 via de [domeinconfiguratie](https://vercel.com/docs/rest-api/domains/get-a-domain-s-configuration) teruggaf:

| Naam | Type | Waarde |
| --- | --- | --- |
| `@` (`thijskooptuwauto.nl`) | A | `216.198.79.1` |
| `@` (`thijskooptuwauto.nl`) | A | `64.29.17.1` |
| `www` | CNAME | `7f9993a3a650ace3.vercel-dns-017.com.` |

Deze waarden horen bij dit project. Controleer ze opnieuw in **Settings → Domains** zodra beide namen aan het uiteindelijke productieproject zijn toegevoegd. Gebruik bij een ander project de waarden van dat project. Voeg een TXT-record voor eigendomsverificatie uitsluitend toe als Vercel dit met een concrete naam en waarde vraagt. Zie [Vercel: eigen domein instellen](https://vercel.com/docs/domains/set-up-custom-domain).

1. Exporteer of noteer vóór de omschakeling de bestaande DNS-zone en de TTL van de webrecords. Laat de oude hosting actief voor terugval.
2. Vervang na akkoord de oude web-A-records op `@` door de bevestigde Vercel-waarden. Laat geen oud AAAA-record actief dat IPv6-bezoekers nog naar de oude website stuurt. Vervang op `www` de oude web-A/AAAA-records door de bevestigde CNAME. Controleer eerst dat die namen niet voor andere diensten worden gebruikt.
3. Laat mailrecords en mailhosts staan: MX, SPF, DKIM, DMARC en eventuele verificatierecords. Controleer vóór de wijziging of bestaande mailroutes of SPF-regels afhankelijk zijn van de huidige web-IP-adressen. De eventuele Resend-verificatierecords zijn een afzonderlijke wijziging, geen onderdeel van deze websiteomschakeling.
4. Controleer na DNS-propagatie HTTPS op beide adressen, de `www`-doorverwijzing naar het gekozen hoofdadres, de nieuwe website en het ontvangen en verzenden via de bestaande mailbox. Schakel oude hosting pas uit na akkoord.

**Terugval:** herstel bij een mislukte omschakeling de geëxporteerde webrecords en TTL. Ter referentie: op 10 november wezen `@` en `www` beide naar A `149.210.216.66` en AAAA `2a01:7c8:aab9:41e::1`. Het terugzetten van DNS draait geen aanvragen of databasewijzigingen terug.

### Toenmalige voorbereiding voor de projectbeheerder

- De [acceptatieomgeving](https://thijskooptuwauto-acceptatie.vercel.app/) draait de nieuwste gecontroleerde applicatieversie `b90be6c4ccc588f822aa91914f143be47cab5635` (Vercel-status `Ready`). Leg deze code vast in de privérepository onder bedrijfsbeheer; de lokaal bekende GitHub-stand liep bij voorbereiding achter.
- Het huidige Vercel-team gebruikt Hobby, voor persoonlijk niet-commercieel gebruik. Regel voor commerciële livegang een geschikt bedrijfsplan of andere geschikte Next.js-hosting. Er is geen abonnement gewijzigd. [Vercel Hobby-voorwaarden](https://vercel.com/docs/plans/hobby#hobby-billing-cycle)
- Richt afzonderlijke productieconfiguratie en Supabase in; Preview gebruikt eigen instellingen. Pas de migraties toe, houd foto's privé, stel de live `APP_URL` en de exacte [Supabase Auth-redirect](https://supabase.com/docs/guides/auth/redirect-urls) in en test toegang en herstel. Neem geen testdossiers of testaccounts automatisch mee. Zet de productievrijgave niet aan voordat Thijs expliciet akkoord is.
- Maak mailverzending af: verifieer het afzenderdomein en stel de verzendsleutel veilig in, of spreek een geautoriseerde mailboxkoppeling af. Er is nu geen `RESEND_API_KEY` in Vercel gevonden. Test aanvraagbevestiging én relevante accountmails met een gecontroleerd testadres.
- Test vóór de omschakeling minimaal het volledig indienen van een fictieve aanvraag met foto, het terugzien daarvan in beheer, dealer-/beheerrechten en mailbezorging. Loop de [livegangchecklist](GO_LIVE_CHECKLIST.md) door en bevestig de actuele scope (facturatie, geen testbetalingen). Inventariseer bestaande veelbezochte webpaden en leg waar nodig redirects vast.

### Controles uitgevoerd op 10 november

- Repositorycontrole, lint, TypeScript, 66 unit-tests en Next.js-build geslaagd.
- Zeven browserproeven tegen acceptatie geslaagd: healthcheck, kentekenstart, validatie, vast menu, toegangsredirects, mobiel en het formulier tot de bevestigingsstap met fictieve gegevens en een gekozen foto. Er is geen aanvraag ingediend en geen e-mail verzonden.
- Banner voor de bevestigingsmail bereikbaar met HTTP 200 en `image/png`.
- Database- en volledige ingelogde ketentests niet uitgevoerd: de lokale Docker-engine draaide niet. Productie is daarom niet afgetekend.
