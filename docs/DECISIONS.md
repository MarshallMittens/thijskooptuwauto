# Ontwerpkeuzes en open punten

## Vastgelegde keuzes

1. **Eén Next.js-applicatie.** Geen microservices; publieke website, dealerportaal en beheer delen één codebasis.
2. **Vercel-compatibele Next.js-basis.** Cloudflare Workers, Vinext, D1 en R2 zijn uit de actieve code verwijderd.
3. **Supabase als gegevensplatform.** PostgreSQL, Auth en private Storage; SQL-migraties zijn leidend.
4. **Geen extra ORM.** De Supabase-client en gegenereerde databasetypen voorkomen een tweede schemasysteem.
5. **Server én database controleren toegang.** De DAL bewaakt routes; grants, RLS en databasefuncties blijven de definitieve grens.
6. **Handmatige bedrijfsgoedkeuring.** Een registratie is altijd `pending`; alleen een admin met MFA kan goedkeuren of blokkeren.
7. **MFA via TOTP voor gevoelige rollen.** Beheer en goedgekeurde dealers gebruiken `aal2`; geen betaalde sms-afhankelijkheid.
8. **Append-only biedingen en auditlog.** Wijzigen of verwijderen wordt geen normale applicatiefunctie.
9. **UTC in opslag, Europe/Amsterdam in presentatie.** Geldbedragen worden gehele eurocenten.
10. **Foutbestendige e-mail.** Domeinhandelingen worden opgeslagen vóór een e-mailpoging; notificaties krijgen een duurzame outbox.
11. **Directe private foto-upload.** De browser uploadt met kort geldige Supabase-machtigingen zodat grote foto’s niet door één Vercel-request hoeven. De server vertrouwt de browserbewerking niet en inspecteert en hercodeert elk bestand vóór afronding.
12. **RDW aan de serverzijde.** Het kenteken gaat via een POST-route naar de officiële RDW-voertuigdataset `m9d7-ebf2` en brandstofdataset `8ys7-d773`; de server herhaalt de controle bij definitieve opslag. Variant en uitvoering komen alleen mee wanneer RDW ze voor het voertuig publiceert. Uitval van de brandstofdataset blokkeert de overige RDW-gegevens niet en volledige RDW-uitval blokkeert handmatige invoer niet.
13. **Geen externe analysetracker.** Alleen start en afronding worden intern als inhoudsloze gebeurtenis geteld.
14. **Tijdelijke en definitieve fotopaden zijn gescheiden.** Een browsermachtiging kan uitsluitend onder `temporary/` schrijven; na inhoudscontrole schrijft de server een hashgebonden bestand onder `applications/` en verwijdert het tijdelijke object zo mogelijk.
15. **Concepttoken is een capability.** Het token wordt server-side met een geheim afgeleid van de willekeurige idempotentiesleutel, alleen aan de browser getoond en uitsluitend gehasht opgeslagen. Daardoor geven gelijktijdige retries hetzelfde token en verbreekt een IP-wijziging de aanvraag niet; het IP-HMAC dient alleen voor misbruiklimieten.
16. **Biedingen via één PostgreSQL-functie.** De functie vergrendelt eerst de biedronde, leest daarna `clock_timestamp()`, bepaalt het bedrijf uit de sessie, controleert publicatie, deadline en globale minimumstap en schrijft bod, hoogste-bodverwijzing, auditlog en outbox in dezelfde transactie.
17. **Biedbedragen zijn zichtbaar, identiteiten niet.** Alle goedgekeurde dealers zien dezelfde bedragen en tijdstippen en kunnen het hoogste bod verhogen. Zij zien niet welk concurrerend bedrijf achter een bod zit; verkopers- en interne gegevens blijven verborgen.
18. **Afhandeling blijft gescheiden.** Het sluiten van een biedronde wijzigt de verkoopstatus niet. Beheer kiest een bod expliciet en doorloopt gecontroleerde stappen naar akkoord en voltooiing.
19. **Materiële wijzigingen trekken aanbod in.** Een wijziging aan kilometerstand, schade, techniek of onderhoud trekt een gepubliceerde listing in en annuleert de ronde. Oude revisies en biedingen blijven onveranderd; herpublicatie maakt een nieuwe revisie en ronde.
20. **Beheer en inkopen gebruiken gescheiden identiteiten.** Nieuwe staff/dealer-overlap wordt database-side geweigerd. Een eventueel bestaand gecombineerd lokaal account kan blijven beheren maar krijgt geen dealerdata of biedrechten.
21. **Commerciële regels zijn versieerbaar en default-off.** Policyversie 2 is uitsluitend `test`, duurt 86400 seconden en gebruikt €100 minimumverhoging bij een actueel hoogste bod onder €5.000 en €150 vanaf €5.000, dus ook boven €10.000. Kostenbedragen blijven leeg; een policy kan niet `approved` worden zonder expliciete kostenconfiguratie, voorwaardenversie en goedkeuringsactor.
22. **Verkopers gebruiken een wachtwoordloze Supabase-sessie.** De combinatie van onvoorspelbare aanvraagreferentie en overeenkomend e-mailadres mag uitsluitend een magic link voorbereiden. Na de e-mailklik koppelt een databasefunctie de geverifieerde Auth-identiteit aan precies één eigen aanvraag; staff- en dealeridentiteiten worden geweigerd.
23. **Verificatie is een publicatievoorwaarde.** Een database-trigger weigert iedere gepubliceerde listing zonder geverifieerde verkoper, ook wanneer een browser of alternatieve API de beheerinterface probeert te omzeilen.
24. **Een nieuwe ronde duurt exact 24 uur.** De database bepaalt start en einde tijdens dezelfde publicatietransactie; de browser kan geen tijden kiezen of meesturen.
25. **Sluiten reserveert, maar verkoopt niet.** Een idempotente databasefunctie bevriest na de deadline maximaal één hoogste geldig bod in `winner_reservations`. `deal_cases` blijft onaangeraakt totdat een latere, gecontroleerde afspraak- en akkoordroute dit verwerkt.
26. **Verlopen rondes zijn herstelbaar.** Bieden na de deadline wordt altijd door de biedfunctie geweigerd. `close_due_bid_rounds` verwerkt gemiste sluitingen later alsnog in batches; correcte biedgeldigheid hangt dus niet van een scheduler af.
27. **De winnaar stelt de afspraak voor.** De winnaar kan één tot drie toekomstige momenten aanbieden. Alleen de geverifieerde verkoper kan exact een aangeboden moment bevestigen, een alternatief vragen of afwijzen.
28. **Contactvrijgave volgt pas na afspraakbevestiging.** De winnende garage krijgt naam, e-mail, telefoon en postcode pas nadat de verkoper een moment heeft bevestigd; andere dealers krijgen deze gegevens nooit.
29. **Inspectie en prijswijziging zijn aparte feiten.** Een inspectie bewaart kilometerstand, bevindingen, afwijkingen en private foto’s. Een voorgestelde prijswijziging is een nieuw voorstel en past het oorspronkelijke append-only bod niet aan.
30. **Akkoord vereist twee identieke bevestigingen.** Na inspectie en eventuele geaccepteerde prijswijziging bevestigen dealer en verkoper elk hetzelfde voertuig, exacte bedrag en dezelfde voorwaardenversie. Eén bevestiging is onvoldoende.
31. **Fase-4-voorwaarden blijven test-only.** De lokale versie `phase4-concept-v1` mag de workflow aantonen, maar activeert geen betaling en is geen goedgekeurd productiecontract.
32. **Geen automatische tweede winnaar.** Een afwijzing, no-show of vastgelopen vervolgroute maakt een beheertaak; de tweede bieder wordt niet automatisch koper.
33. **Betalingen zitten achter een adapter.** Fase 5 kent alleen de providernaam `simulated` in omgeving `test`. Een toekomstige echte provider krijgt een afzonderlijke adapter en goedkeuringspad; de simulator wordt nooit als operationele provider gepresenteerd.
34. **Simulator is default-off en productieverboden.** De databasemigratie zet hem uit. Alleen beheer met MFA kan hem via servercode activeren wanneer lokale simulatorvariabelen aanwezig zijn; de server weigert dit in een productie-runtime.
35. **Geen verzonnen behandelingskosten.** Zowel de particuliere klant als de garage betaalt de eigen platformkosten rechtstreeks en exclusief aan Thijskooptuauto. De bedragen, btw-behandeling, het verschuldigdheidsmoment en restitutieregels zijn nog niet vastgesteld; daarom gebruikt de testsimulator €0 vergoeding en de blijvende markering `test_unconfigured` en blijven fiscale facturen geblokkeerd.
36. **Providerbericht is de betaalautoriteit.** Een terugkeerpagina of browseractie bewijst geen betaling. Alleen een tijdgebonden HMAC-ondertekend bericht wordt verwerkt, waarna PostgreSQL bedrag, EUR-valuta, ontvanger en toegestane statusvolgorde opnieuw controleert.
37. **Ontvangst, vrijgave en uitbetaling zijn verschillende feiten.** Volledig ontvangen geld krijgt `received_held`; vrijgave vereist dubbele overdrachtsbevestiging en beheercontrole; provideracceptatie en uiteindelijke uitbetaling blijven afzonderlijke events.
38. **Uitbetaling verdwijnt niet bij een geschil.** Een geschil kan een reeds uitbetaalde transactie markeren en een opvolgtaak maken, maar `paid_out_at` blijft als historisch feit staan. Terugbetaling is een afzonderlijk, idempotent proces.
39. **Reconciliatie vergelijkt twee administraties.** Een test-providerbeeld staat in een afgeschermde private tabel en wordt met de lokale administratie vergeleken. Verschillen worden als afzonderlijke reconciliatie-items bewaard; zij worden niet stilzwijgend gecorrigeerd.
40. **Klachten zijn afzonderlijke dossiers.** Een klacht heeft een onvoorspelbare referentie, gekoppelde aanvraag/transactie, tijdlijn, privébewijs en eigen status. De klacht wist of herschrijft geen bod, akkoord, betaling of uitbetaling.
41. **Platformkoper vereist functiescheiding.** Een admin kan een bedrijf expliciet als platformverbonden markeren. Nieuwe klachten over zo’n koper vereisen een geregistreerde beoordeling door één medewerker en afronding door een andere medewerker.
42. **Bewijs blijft private Storage.** Alleen JPEG-afgeleiden zonder bronmetadata worden geregistreerd. De database controleert actor, bestaand object, hashgebonden pad en maximaal acht bewijsstukken.
43. **Geen fictieve fiscale factuur.** Zolang vergoeding, betaler en btw-behandeling niet zijn vastgesteld, zijn documentrecords uitsluitend `test`, `draft_blocked`, €0 en `unconfigured`. Zij staan los van het koopbedrag.
44. **Outboxbezorging is lease-gebaseerd.** Eén service-worker claimt met `FOR UPDATE SKIP LOCKED`; een andere worker kan die lease niet afmaken. Provider-idempotentie voorkomt dubbele verzending bij herstel na een onzekere respons.
45. **Operationele taken zijn default-off.** De interne workerroute vereist een apart servergeheim en `OUTBOX_DELIVERY_ENABLED=true`. Zonder geverifieerde afzender en hostingplanning worden geen achtergrondmails verstuurd.
46. **Lokale herstelproef is synthetisch en geïsoleerd.** Het script weigert niet-lokale Supabase, herstelt naar een tijdelijke database en tijdelijke private buckets, controleert checksums en ruimt die testmiddelen altijd op. Dit vervangt geen productieherstelproef.
47. **Klachten kunnen vanaf de winnaarreservering.** Een winnende garage mag een afspraak- of no-showprobleem melden zonder eerst een betaalorder te maken. De database leidt bedrijf en aanvraag uit de reservering af; een vreemd of geblokkeerd bedrijf wordt geweigerd.
48. **Klachtbewijs vereist autorisatie vóór opslag.** De sessie vraagt eerst via een afgeschermde databasefunctie toegang tot een actief dossier. Registratie onder servicebevoegdheid controleert de actor en actieve status opnieuw onder rijvergrendeling. Een gesloten klacht blijft gesloten en de tweede beoordeling is eenmalig.
49. **Fase 7 is geen automatische vrijgave.** Interne tests en een door Codex uitgevoerde codecontrole vervangen geen externe juridische/providergoedkeuring, onafhankelijke beveiligingsreview of gebruikersproef. Alle blijven expliciete blokkades in `docs/PHASE7.md`.
50. **De eerste hostingstap is uitsluitend Preview.** Node blijft op 22.x; Preview gebruikt een eigen Supabase-project en afzonderlijke geheimen. De build weigert localhost, voorbeeldwaarden, hergebruikte private geheimen, een actieve betaalsimulator en productie zonder de afzonderlijke schakelaar `PRODUCTION_DEPLOYMENT_APPROVED=true`.
51. **Statuscontrole is minimaal en gelaagd.** `/api/health` toont openbaar alleen dat de Next.js-app reageert. Databasecontrole vereist het server-only operationele geheim en geeft geen queryresultaten, foutdetails of configuratie terug.
52. **Cryptografische extensiefuncties zijn expliciet gekwalificeerd.** Hosted Supabase bewaart `gen_random_bytes` in schema `extensions`. De fase-6-migratie gebruikt daarom `extensions.gen_random_bytes`; deze correctie is gemaakt nadat de eerste acceptatiepoging transactioneel was teruggedraaid en voordat migratie 12 ooit remote als toegepast werd geregistreerd.
53. **Uitsluitend expliciet aangewezen platformadmins mogen een gecombineerde admin-/dealeridentiteit gebruiken.** Dit is een per account ingestelde uitzondering via `staff_memberships.can_use_dealer_portal`, uitsluitend mogelijk voor `admin`. De uitzondering vereist nog steeds MFA, een actief bedrijfslidmaatschap en een goedgekeurd, niet-geblokkeerd bedrijf. Iedere aangewezen admin handelt alleen namens het eigen gekoppelde bedrijf. Gewone staff- en dealeridentiteiten blijven door triggers gescheiden. Omdat dezelfde sessie ook adminrechten heeft, is dit geen technische functiescheiding; platformaffiliatie, expliciete aanwijzing en auditregistratie blijven daarom verplicht.
54. **Een slechte uitslag wordt niet overschreven maar krijgt een nieuwe ronde.** Alleen beheer met MFA kan een definitief afgesloten biedronde gemotiveerd opnieuw aanbieden. Oude biedingen en de oude uitslag blijven onveranderlijk bewaard, een nog niet opgevolgde winnaarreservering wordt vrijgegeven en de nieuwe ronde start leeg voor exact 24 uur. Zodra afspraak, koopafhandeling, geschil of een verkoopdossier bestaat, wordt herstart geweigerd.
55. **Er geldt geen maximumaantal aangesloten garages.** Iedere afzonderlijk geregistreerde en goedgekeurde garage kan deelnemen; beveiliging, filters en notificaties mogen geen impliciete limiet van vijf bedrijven introduceren.
56. **Transport is een expliciete keuze in de afhandeling.** Wanneer de transport-/ophaalservice wordt gekozen is het afgesproken tarief €250. Betaler, btw-behandeling, annuleringsregels en het precieze factuurmoment blijven open en daarom wordt dit bedrag nog niet geïnd of gefactureerd.
57. **Toegang en platformrelatie zijn verschillende beheeracties.** Goedkeuren/blokkeren bepaalt dealerportaaltoegang. De markering platformkoper is uitsluitend voor belangenconflicten en functiescheiding en verandert de toegang niet; de beheerinterface benoemt en scheidt deze acties zichtbaar.
58. **Nieuwe aanbod- en overbodenmeldingen worden duurzaam vastgelegd.** Publicatie maakt per goedgekeurde garage één outboxbericht en een nieuw hoogste bod maakt voor de vorige hoogste garage één overbodenbericht. Externe bezorging blijft afhankelijk van de apart geactiveerde mailworker.

## Veilige tijdelijke keuzes

- npm is de enige package manager.
- De eerste uploadversie accepteert JPEG, PNG en WebP, maximaal 12 bestanden van 10 MB.
- KvK-controle is handmatig; er wordt geen extra commerciële API toegevoegd.
- Het dealerportaal ververst actieve biedingen iedere vijftien seconden en bij terugkeer naar het tabblad. Dit is doelbewuste polling; Supabase Realtime is niet nodig voor correcte biedverwerking.
- Policyversie 2 blijft uitsluitend een testconfiguratie. De werkende veilingtechniek en afgesproken biedstappen activeren geen productiebeleid of livegang.
- Een afspraakreactietermijn van 24 uur is voorlopig een operationeel signaal, geen automatische juridische vervaldatum of koopbinding.
- Fictieve ontvanger-onboarding vraagt geen echte identiteits- of bankgegevens en bewijst niets over provideracceptatie.
- `@supabase/ssr` blijft achter de adapter in `lib/supabase` zodat een toekomstige API-wijziging lokaal blijft.
- `APP_URL` is server-only en verplicht buiten development/test; er is in productie geen stille localhost-terugval voor bevestigingslinks.

## Open vóór livegang

- Juridische rol: inkoper, bemiddelaar of beide.
- Moment van gebondenheid, geldigheidsduur en intrekking van biedingen.
- Exacte platformkosten per klant en garage, btw-/factuurbehandeling, betaalmoment, restitutie en een eventuele minimale openingsbieding. De staffel voor minimumverhogingen is wel vastgesteld.
- Bewaartermijnen en verwijderprocedure per gegevenscategorie.
- Definitief KvK-nummer, juridische bedrijfsidentiteit, privacy- en voorwaardeninhoud. Het vestigingsadres, telefoonnummer en algemene e-mailadres zijn door de ondernemer aangeleverd voor de contactpagina.
- Productiebeheerder(s), MFA-herstelprocedure en functiescheiding.
- Bedrijfsdomein, e-mailafzenders en EU-regio’s voor Supabase en Vercel.
