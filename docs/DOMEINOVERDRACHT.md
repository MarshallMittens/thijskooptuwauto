# Thijskooptuwauto — voorbereiding domeinovergang

Update 27 november: acceptatiealias, hoofddomein en www zijn bijgewerkt naar de nieuwe testrelease zonder klachtenknop in het dealerportaal. Het actuele aliasdoel staat bovenaan `DEPLOYMENT.md`; de onderstaande releasegegevens van 26 november zijn de voorgaande momentopname. DNS, mailboxen en abonnement zijn bij deze update niet gewijzigd.

Laatste testrelease op 26 november: `ea4a128`, met het herstelde taalmenu. Alle vier de talen zijn zichtbaar vóór de vaste header; gecontroleerd op vier schermbreedtes en op alle drie de webadressen. De zeven publieke browserproeven op `www` slagen opnieuw in 23,0 seconden. De echte Home-flow voor `05-pk-rb` haalt RDW-gegevens op met HTTP 200 en vult TOYOTA / TOYOTA RAV4 in. Er is geen aanvraag ingediend of e-mail verstuurd.

## Actuele stand — 26 november 2026

**De testversie werkt nu via [thijskooptuwauto.nl](https://thijskooptuwauto.nl/) én [www.thijskooptuwauto.nl](https://www.thijskooptuwauto.nl/) met geldig HTTPS.** Beide zijn directe aliases van dezelfde bestaande `READY`-Preview. Dit blijft gratis niet-commercieel prototypetesten met fictieve gegevens; er is geen abonnement of nieuwe Production-build geactiveerd. De eerdere voorbereiding hieronder verlangt geen nieuwe publicatietoestemming.

- Vercel CLI-login is geslaagd. Het bestaande project `thijskooptuwauto` (`prj_GP6uLZmzi6epfLjNtn66QAghXCsR`) is gekoppeld aan `MarshallMittens/thijskooptuwauto`, branch `main`. De projectinstelling Node.js is via de API van 24.x naar 22.x gezet.
- Het team blijft **Hobby**. [Vercel-medewerker Anshuman Bhardwaj bevestigt](https://community.vercel.com/t/is-hobby-plan-suitable-for-a-saas-prototype/7205) dat ideeën en prototypes daarop kunnen worden getest. De huidige proef blijft niet-commercieel en gebruikt fictieve aanvragen en biedingen; Pro is hiervoor geen voorwaarde. Voor echte commerciële livegang gelden afzonderlijk de [Hobby-voorwaarden](https://vercel.com/legal/terms#hobby-plan) en passende hosting. [Vercel Pricing](https://vercel.com/pricing) vermeldt Pro vanaf $20 per maand exclusief btw, met mogelijk aanvullende verbruikskosten; er is geen betaald plan gestart.
- De laatste productie-deployment heeft status `ERROR`, met melding `npm run build exited 1`. Alle tien aangetroffen omgevingsvariabelen zijn uitsluitend aan Preview gekoppeld; Production heeft nog geen eigen configuratie. Er is geen `RESEND_API_KEY`-variabelenaam in Vercel aangetroffen; er zijn geen sleutelwaarden in dit document opgenomen.
- DNS bleef ongewijzigd: apex-A-records `64.29.17.1` en `216.198.79.1`, en `www`-CNAME `7f9993a3a650ace3.vercel-dns-017.com.`. Beide namen zijn met Vercel CLI naar de nieuwste deployment `dpl_DKVACbTsqULG2AyUw6hgs5n9CkpX` omgezet, net als de acceptatiealias. De eerder bevestigde normale HTTPS-/certificaatvalidatie blijft behouden; de echte taalmenu-interface is op alle drie domeinen gecontroleerd.
- De gemelde www-404/certificaatfout is opgelost. Vercel maakte automatisch een gratis geldig certificaat aan met SAN `DNS:www.thijskooptuwauto.nl`; er is geen certificaatwaarschuwing omzeild. Mailboxrecords, abonnement, appcode en Production-deployment zijn niet gewijzigd.
- De Project Domains-API vermeldt nog alleen `thijskooptuwauto.vercel.app`. De eigen namen werken als **directe deploymentaliases**, niet als formeel ingerichte commerciële productiedomeinen. De eerdere fout bij toevoegen als projectdomein en de bestaande Production-build met status `ERROR` zijn hiermee niet als productie opgelost.
- De password-only migratie `202611200001_password_only_portal_access.sql` is succesvol toegepast op het bestaande acceptatie-Supabase-project; de gelezen migratielijst bevestigt deze versie lokaal en remote. Rollen, blokkades en objectrechten blijven behouden en bestaande factorrecords zijn intact. Productie is niet gemigreerd.
- Nieuwste taalmenu-Preview `dpl_DKVACbTsqULG2AyUw6hgs5n9CkpX` is `READY`: [deployment-URL](https://thijskooptuwauto-nuqzt14ye-jeroenderaef-6403.vercel.app), deploycommit `ea4a1283f83ad00a0f2be04aa9d8650a856d8ba8`, Node.js 22.x en functieregio `fra1`. Acceptatiealias, hoofddomein en `www` zijn succesvol aan deze deployment gekoppeld; configuratie en acceptatiemigratie passen bij deze release.

**Nieuwste prototype publiek getest:** alle zeven publieke Playwright-proeven via `www` zijn geslaagd in 23,0 seconden, inclusief health, formulier tot bevestiging, mobiel/layout en beschermde redirects. Een echte RDW-opvraag via het www-homeformulier gaf HTTP 200 met `found: true`; `TOYOTA` en `TOYOTA RAV4` zijn automatisch ingevuld met een succesmelding, zonder wijziging aan RDW-code. Er is geen aanvraag ingediend of e-mail verstuurd. Ingelogde online E2E en mailbezorging zijn niet getest; `RESEND_API_KEY` ontbreekt nog. De aliases zijn publiek bereikbaar; er is geen private Vercel-toegangslaag aangetoond. Dealer- en beheerrechten blijven begrensd door applicatie-authenticatie en RLS. De Pro-keuze blokkeert deze niet-commerciële prototypeproef niet.

Het taalmenu is hersteld door de voordelenbalk alleen bij een geopende taalkeuze boven de header te plaatsen (`has-[details[open]]:z-[60]`). Het hoofdmenu blijft sticky; de voordelenbalk scrolt weg. Acht lokale controles (390, 768, 850 en 1440 pixels, telkens home en contact) en online raakpunttests op alle drie domeinen bevestigen dat alle vier taalregels zichtbaar blijven. Lint, TypeScript, 69 unit-tests en build slagen. Geen database-, DNS-, mailbox-, abonnements- of Production-wijziging; SQL-tests zijn voor deze CSS-wijziging niet herhaald en Docker was niet beschikbaar.

**Volgende Preview-update:** controleer eerst de nieuwe deployment en werk daarna alle drie aliases handmatig bij: `thijskooptuwauto-acceptatie.vercel.app`, `thijskooptuwauto.nl` en `www.thijskooptuwauto.nl`. Ze verwijzen nu vast naar `dpl_DKVACbTsqULG2AyUw6hgs5n9CkpX` en volgen een nieuwe Preview niet automatisch.

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
