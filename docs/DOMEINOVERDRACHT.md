# Thijskooptuwauto — voorbereiding domeinovergang

## Actuele stand — 26 november 2026

**Publicatie op het eigen domein is door de eigenaar uitdrukkelijk toegestaan. De nieuwe website werkt daar nog niet.** Alleen de keuze voor betaalde hosting staat nog open; er is geen abonnement aangepast. De eerdere voorbereiding hieronder verlangt geen nieuwe publicatietoestemming.

- Vercel CLI-login is geslaagd. Het bestaande project `thijskooptuwauto` (`prj_GP6uLZmzi6epfLjNtn66QAghXCsR`) is gekoppeld aan `MarshallMittens/thijskooptuwauto`, branch `main`. De projectinstelling Node.js is via de API van 24.x naar 22.x gezet.
- Het team gebruikt nog **Hobby**. De actuele [Vercel-voorwaarden](https://vercel.com/legal/terms#hobby-plan) beperken Hobby tot persoonlijk/niet-commercieel gebruik. Voor deze zakelijke site is passende hosting nodig. De keuze voor Pro is aan de gebruiker voorgelegd en nog niet beantwoord: [Vercel Pricing](https://vercel.com/pricing) vermeldt $20 per maand exclusief btw, met mogelijk aanvullende verbruikskosten. Er wordt niet stilzwijgend een betaald plan gestart.
- De laatste productie-deployment heeft status `ERROR`, met melding `npm run build exited 1`. Alle tien aangetroffen omgevingsvariabelen zijn uitsluitend aan Preview gekoppeld; Production heeft nog geen eigen configuratie. Er is geen `RESEND_API_KEY`-variabelenaam in Vercel aangetroffen; er zijn geen sleutelwaarden in dit document opgenomen.
- DNS wijst al naar Vercel: apex-A-records `64.29.17.1` en `216.198.79.1`, en `www`-CNAME `7f9993a3a650ace3.vercel-dns-017.com.`. HTTP bereikt Vercel maar retourneert `404 DEPLOYMENT_NOT_FOUND`; de HTTPS-handshake mislukt.
- Aan het project is alleen `thijskooptuwauto.vercel.app` gekoppeld. Een poging het hoofddomein toe te voegen werd met HTTP 400 geweigerd omdat de laatste productie-deployment is mislukt. Het hoofddomein is dus nog niet aan dit project toegewezen; ook de `www`-koppeling en HTTPS moeten nog worden afgerond.
- De [acceptatiealias](https://thijskooptuwauto-acceptatie.vercel.app/) retourneert HTTP 200 maar toont nog de oude applicatieversie `b90be6c`. De nieuwe code staat lokaal op commit `d49a6d9`; GitHub staat nog op `773f743`. De password-only migratie `202611200001_password_only_portal_access.sql` is nog niet remote toegepast.

**Vervolg binnen de gegeven publicatieopdracht:** de betaalde hostingkeuze afhandelen, de actuele release naar de gekoppelde repository brengen, productie-Supabase/configuratie/mail en exacte Auth-callbacks inrichten, de migraties vóór de applicatie toepassen en een geslaagde productie-deployment maken. Koppel daarna apex en `www` aan het project en controleer HTTPS, redirects, aanvragen, foto’s, rollen en mailbezorging. Behoud bestaande mailboxrecords. Vervallen testbetalingen en simulatoronderdelen blijven uit.

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
