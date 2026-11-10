# Thijskooptuwauto — voorbereiding domeinovergang

**Status op 10 november 2026: acceptatie gecontroleerd, geen productievrijgave.** De website die wij hebben gebouwd komt na vrijgave op `https://thijskooptuwauto.nl`. Het domein blijft bij de huidige provider. De bestaande website, DNS, mailboxen en Vercel-instellingen zijn bij deze voorbereiding niet gewijzigd.

## Voor de DNS-beheerder — nog niet uitvoeren

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

## Voor de projectbeheerder — vóór toestemming voor livegang

- De [acceptatieomgeving](https://thijskooptuwauto-acceptatie.vercel.app/) draait de nieuwste gecontroleerde applicatieversie `b90be6c4ccc588f822aa91914f143be47cab5635` (Vercel-status `Ready`). Leg deze code vast in de privérepository onder bedrijfsbeheer; de lokaal bekende GitHub-stand liep bij voorbereiding achter.
- Het huidige Vercel-team gebruikt Hobby, voor persoonlijk niet-commercieel gebruik. Regel voor commerciële livegang een geschikt bedrijfsplan of andere geschikte Next.js-hosting. Er is geen abonnement gewijzigd. [Vercel Hobby-voorwaarden](https://vercel.com/docs/plans/hobby#hobby-billing-cycle)
- Richt afzonderlijke productieconfiguratie en Supabase in; Preview gebruikt eigen instellingen. Pas de migraties toe, houd foto's privé, stel de live `APP_URL` en de exacte [Supabase Auth-redirect](https://supabase.com/docs/guides/auth/redirect-urls) in en test toegang en herstel. Neem geen testdossiers of testaccounts automatisch mee. Zet de productievrijgave niet aan voordat Thijs expliciet akkoord is.
- Maak mailverzending af: verifieer het afzenderdomein en stel de verzendsleutel veilig in, of spreek een geautoriseerde mailboxkoppeling af. Er is nu geen `RESEND_API_KEY` in Vercel gevonden. Test aanvraagbevestiging én relevante accountmails met een gecontroleerd testadres.
- Test vóór de omschakeling minimaal het volledig indienen van een fictieve aanvraag met foto, het terugzien daarvan in beheer, dealer-/beheerrechten en mailbezorging. Loop de [livegangchecklist](GO_LIVE_CHECKLIST.md) door en bevestig de actuele scope (facturatie, geen testbetalingen). Inventariseer bestaande veelbezochte webpaden en leg waar nodig redirects vast.

## Uitgevoerde controles

- Repositorycontrole, lint, TypeScript, 66 unit-tests en Next.js-build geslaagd.
- Zeven browserproeven tegen acceptatie geslaagd: healthcheck, kentekenstart, validatie, vast menu, toegangsredirects, mobiel en het formulier tot de bevestigingsstap met fictieve gegevens en een gekozen foto. Er is geen aanvraag ingediend en geen e-mail verzonden.
- Banner voor de bevestigingsmail bereikbaar met HTTP 200 en `image/png`.
- Database- en volledige ingelogde ketentests niet uitgevoerd: de lokale Docker-engine draaide niet. Productie is daarom niet afgetekend.
