# Beveiligingsmodel

## Gecombineerde herstart — 27 november 2026

`admin_reopen_auction_24h` verifieert geldige sessie en actief staff-lidmaatschap. De bestaande herstartautorisatie blijft behouden. De functie lockt aanvraag en huidige ronde, weigert archief en een nog niet verstreken deadline, en gebruikt vervolgens de bestaande afsluit- en herstartfuncties binnen dezelfde transactie. Hun controles op afspraak, koopdossier, geschil en winnaarreservering blijven leidend. Bij een fout blijven de oude uitslag, reserveringen, audit- en outboxgegevens ongewijzigd door rollback. Dezelfde idempotentiesleutel wordt bij retry hergebruikt. De overzichtsvlag is uitsluitend presentatie; RPC-controles blijven verplicht. Anonieme, dealer-, geblokkeerde en ongeldige JWT-toegang worden negatief getest.

## Archiveren — 27 november 2026

`admin_archive_application` vereist een geldige sessie, actief staff-lidmaatschap én rol admin; de serveractie controleert dezelfde rol. Dealer, operator, geblokkeerde admin en anonieme toegang worden database-side geweigerd. Reden, actor en tijd worden geaudit. Locks op aanvraag, rondes en winnaarreserveringen begrenzen gelijktijdige bied-/afspraakacties. Lopende afhandeling en geschillen blokkeren archiveren. Triggers weigeren herpublicatie, nieuwe actieve rondes en nieuwe verkoopdossiers voor gearchiveerde aanvragen.

Actieve/geplande rondes worden geannuleerd; historische biedingen, gesloten uitslagen, foto's en afgeronde dossiers blijven bestaan. De dealer-aanbodfunctie filtert gearchiveerde aanvragen zonder historische dossierautorisatie te verruimen. Nog niet verzonden aanbodmeldingen krijgen status `cancelled`; reeds verzonden of verwerkte berichten worden niet teruggedraaid. De bestaande worker claimt deze geannuleerde berichten niet. Privéthumbnails worden alleen met de eigen staff-sessie en vijf minuten geldige Storage-links opgehaald. De volledige lokale SQL-suite bevat 31 nieuwe positieve en negatieve archiveringscontroles (429 totaal); de lokale browserproef controleert ook dat een gewone dealer geen archiveerknoppen ziet.

## Grenzen

- Browserinvoer is altijd onbetrouwbaar.
- Server Actions en Route Handlers zijn openbare endpoints en voeren zelf authenticatie en autorisatie uit.
- PostgreSQL-grants en RLS vormen de laatste toegangsgrens.
- De `service_role`-sleutel komt niet in browserbundels, Git, logs of documentatie.

## Inlogbesluit — 20 november 2026

De eigenaar heeft expliciet besloten dat dealers en beheerders voor de volledige portalen alleen met e-mail en wachtwoord inloggen. De eerdere verplichte authenticator-/TOTP-stap en `aal2`-voorwaarde zijn daarmee vervangen. Applicatie en SQL ondersteunen een geldige sessie zonder TOTP; rolcontrole, handmatige garagegoedkeuring, account- en bedrijfsblokkades, actieve lidmaatschappen en eigenaarschap van ieder dossier blijven vereist.

Het verhoogde risico van een ontbrekende tweede factor is door de eigenaar geaccepteerd: wie geldige inloggegevens bemachtigt, kan zonder extra authenticatorcontrole inloggen. Het wijzigen van de inlogkeuze geeft geen aanvullende rollen of objectrechten.

De lokale MFA-instellingen in `supabase/config.toml` wijzigen geen hosted Supabase Auth-instellingen. Bestaande factorrecords worden niet verwijderd. De compatibiliteitsroute `/auth/mfa` vereist nog steeds een ingelogde gebruiker en verwijst uitsluitend naar het rolgebonden interne portaal; een meegegeven externe bestemming wordt niet gebruikt.

## Rechten

De betaal-, vrijgave-, refund- en testdocumentregels hieronder beschrijven historische sandboxonderdelen die buiten gebruik blijven. Het inlogbesluit activeert geen vervallen betaalfunctie of simulator.

| Gegeven/actie | Anoniem | Geverifieerde verkoper | Pending/geblokkeerd | Goedgekeurde dealer | Staff (rolgebonden) |
|---|---:|---:|---:|---:|---:|
| Eigen aanvraagdossier | Nee | Alleen eigen dossier | Nee | Nee | Ja |
| Eigen gevraagde aanvulling | Nee | Alleen bij `needs_information` | Nee | Nee | Ja |
| Bedrijfsregistratie | Nee | Nee | Eenmalig via RPC | Nee | Ja |
| Eigen bedrijf lezen | Nee | Nee | Ja | Ja | Ja |
| Gepubliceerd aanbod | Nee | Nee | Nee | Ja | Ja |
| Verkopersgegevens | Nee | Alleen eigen dossierweergave | Nee | Nee | Ja |
| Interne notities/audit | Nee | Nee | Nee | Nee | Ja |
| Contactmomenten/afhandeling | Nee | Nee | Nee | Nee | Ja |
| Materiële voertuigwijziging | Nee | Nee | Nee | Nee | Ja, gecontroleerde RPC |
| Bedrijfsstatus wijzigen | Nee | Nee | Nee | Nee | Alleen admin |
| Biedbedragen lezen | Nee | Nee | Nee | Alle bedragen/tijdstippen, geen concurrerende identiteit | Alle biedingen met bedrijfsidentiteit |
| Bieden | Nee | Nee | Nee | Via gecontroleerde bied-RPC | Alleen expliciet gemarkeerde platformadmins, ieder namens het eigen gekoppelde goedgekeurde bedrijf |
| Winnaarreservering | Nee | Nee | Nee | Niet rechtstreeks leesbaar | Alleen staff |
| Afspraakvoorstel | Nee | Eigen reactie | Nee | Alleen gereserveerde winnaar | Alleen staff |
| Verkoperscontact na veiling | Nee | Eigen gegevens | Nee | Alleen winnaar na bevestigde afspraak | Ja |
| Inspectie/inspectiefoto’s | Nee | Eigen dossier via tijdelijke URL | Nee | Alleen winnaar via gecontroleerde RPC/URL | Ja |
| Prijsaanpassing | Nee | Alleen actief accepteren/afwijzen | Nee | Alleen apart voorstellen, nooit bod wijzigen | Ja |
| Koopconcept | Nee | Eigen exacte concept bevestigen | Nee | Alleen winnaar bevestigt exact concept | Ja |
| Testbetaalstatus | Nee | Alleen eigen dossier via RPC | Nee | Alleen eigen gewonnen dossier via RPC | Ja |
| Provider-event verwerken | Nee | Nee | Nee | Nee | Alleen server/service-webhook, niet staffbrowser |
| Overdracht bevestigen | Nee | Alleen eigen dossier | Nee | Alleen winnende dealer | Verifieert apart |
| Vrijgave/refund | Nee | Nee | Nee | Nee | Historische sandbox; blijft buiten gebruik |
| Klacht openen/lezen | Nee | Alleen eigen aanvraag | Nee | Alleen betrokken koper | Alleen staff |
| Klachtbewijs | Nee | Alleen eigen klacht, tijdelijke URL | Nee | Alleen betrokken klacht, tijdelijke URL | Ja |
| Klacht afronden | Nee | Nee | Nee | Nee | Alleen staff; platformkoper vereist tweede medewerker |
| Testfactuur-/incidentgegevens | Nee | Nee | Nee | Nee | Alleen staff; testfacturen blijven buiten gebruik |
| Outbox claimen/bezorgen | Nee | Nee | Nee | Nee | Alleen server/service-worker |

## Belangrijkste risico’s en controles

- **Rolverhoging:** geen directe writes op rollen of bedrijfsstatus; security-definerfuncties controleren sessie, actor, rol en objectrechten.
- **Rolvermenging:** nieuwe actieve dealer- en staff-lidmaatschappen op dezelfde identiteit worden door triggers geweigerd. Uitsluitend expliciet aangewezen admins kunnen server-side `can_use_dealer_portal` krijgen en namens hun eigen goedgekeurde bedrijf handelen. Operators, gewone admins zonder vlag en alle verkopersidentiteiten blijven geweigerd; negatieve database-tests bewaken dit.
- **Dubbele bevoegdheid platformadmins:** de database ziet iedere aangewezen identiteit altijd als admin, ook wanneer de dealerinterface wordt gebruikt. Dit is daarom geen functiescheiding binnen hetzelfde account. Aangewezen accounts blijven onderling bedrijfsgescheiden en handelen alleen namens hun eigen bedrijf; hun handelingen moeten via auditlog en de bestaande markering `is_platform_affiliated` herkenbaar blijven.
- **Verkopersidentiteit:** verkoper, dealer en staff kunnen niet op dezelfde nieuwe identiteit worden gecombineerd. De magic-linkcallback koppelt alleen wanneer het door Supabase bevestigde e-mailadres exact overeenkomt met de verkoperscontactregel.
- **Dossierreferentie:** de 24 hextekens zijn onvoorspelbaar maar vormen niet zelfstandig de beveiliging; e-mailbezit, een geldige Supabase-sessie en de server-side dossierkoppeling zijn eveneens vereist.
- **Publicatie zonder verificatie:** een trigger op `listings` weigert status `published` zolang geen geverifieerde verkoper aan de aanvraag is gekoppeld.
- **IDOR:** UUID’s zijn geen beveiliging; RLS beperkt ieder object op rol en bedrijf.
- **Sessie-inbraak:** de eerdere verplichte TOTP-/`aal2`-controle is vervangen door het eigenaarbesluit van 20 november 2026. Dealers en beheer gebruiken e-mail en wachtwoord; het ontbreken van een tweede factor is als verhoogd risico geaccepteerd. DAL, RLS en RPC's blijven sessie, rollen, blokkades en objecttoegang controleren.
- **Gegevenslek tussen dealers:** de gecontroleerde aanbodfunctie geeft alleen bedrag, tijdstip en een markering voor het eigen bedrijf terug. Bedrijfs-ID en naam van concurrerende bieders blijven uitsluitend voor staff zichtbaar; verkopersgegevens hebben staff-onlybeleid.
- **Ingetrokken toegang:** alleen actieve bedrijfslidmaatschappen geven inzage; negatieve RLS-tests dekken verwijderde leden en ongepubliceerde voertuigen af.
- **Rechtstreekse RPC-aanroepen:** kritieke invoerregels staan ook in PostgreSQL-functies en tabelconstraints; browser- of servervalidatie is niet de laatste grens.
- **Open redirects:** authenticatieroutes accepteren alleen geparseerde paden die binnen dezelfde origin blijven; backslashes en gecodeerde netwerkpaden worden geweigerd.
- **Publieke foto-upload:** de browser codeert geselecteerde JPEG/PNG/WebP-bestanden eerst als JPEG en uploadt via kort geldige machtigingen uitsluitend naar `temporary/`. Bij afronding controleert en hercodeert de server ieder bestand en schrijft een hashgebonden versie naar `applications/`. De browsermachtiging kan dat definitieve object niet overschrijven.
- **Foto-inzage:** Storage blijft privé. Bevoegd beheer en de geverifieerde eigenaar krijgen server-side pas na objectautorisatie een signed URL van vijf minuten; dealers krijgen uitsluitend gecontroleerde gepubliceerde foto’s via een afzonderlijke machtiging.
- **Misbruikbeperking:** een honeypot, afzonderlijke uurlimieten voor RDW-opvragen, formulierstarts en nieuwe uploadconcepten, maximaal twaalf foto’s en korte conceptverval beperken geautomatiseerd misbruik. De identifier is een HMAC van het door Vercel vastgestelde adres; de wijzigbare User-Agent telt niet mee en ruwe adressen worden niet opgeslagen.
- **Dubbele verzoeken:** expliciete idempotentiesleutels voor aanvraag, bod en e-mail.
- **Racecondities:** biedcontrole en insert staan in één PostgreSQL-transactie. Een lock op de biedronde serialiseert gelijktijdige biedingen; start en deadline worden na het verkrijgen van die lock met `clock_timestamp()` gecontroleerd. Een afzonderlijke test met twee verbindingen bewijst dat twee gelijke gelijktijdige biedingen niet beide slagen.
- **Append-only biedingen:** browserrollen hebben geen insert/update/delete-grants; alleen de biedfunctie kan invoegen en een trigger weigert updates en deletes, ook bij bevoorrechte rechtstreekse wijzigingen.
- **Materiële wijzigingen:** de database vergrendelt de aanvraag en controleert de verwachte revisie. Een actieve publicatie wordt ingetrokken en de ronde geannuleerd; een stale browser kan geen nieuwere versie overschrijven.
- **Afhandeling:** alleen de database-reservering van het hoogste bod opent de vervolgroute. Contactvrijgave, afspraakreactie, inspectie, prijsvoorstel en koopbevestiging worden telkens opnieuw aan verkoper of winnend bedrijf gekoppeld.
- **Stille prijsverlaging:** inspectiebevindingen en een prijsaanpassingsvoorstel zijn aparte append-only bedrijfsfeiten. Het bod blijft onveranderd en zonder actieve verkopersacceptatie ontstaat geen aangepast koopconcept.
- **Eenzijdig akkoord:** het koopconcept bevat het exacte bedrag en de voorwaardenversie. Alleen afzonderlijke dealer- én verkopersbevestiging zetten het dossier op `agreed`; de oude beheerfunctie kan dit niet omzeilen.
- **Inspectiefoto’s:** de server inspecteert en hercodeert uploads, schrijft alleen hashgebonden JPEG-objecten in private Storage en registreert metadata pas wanneer het object werkelijk bestaat. Een lock bewaakt ook bij gelijktijdige uploads de limiet van acht.
- **Onbeoordeelde voorwaarden:** de ingebouwde voorwaardenversie heeft status `test`. De UI toont dit expliciet en productiebetalingen/livegang blijven geblokkeerd tot contractreview.
- **Testprovider in productie:** historische simulatoronderdelen blijven buiten gebruik en worden door deze wijziging niet opnieuw beschikbaar gemaakt. De eerdere sandboxbeschrijvingen en `simulated/test`-records vormen geen operationele betaalvoorziening.
- **Valse succesretour:** `/betalingen/terug` muteert niets. Alleen de webhookroute verwerkt providerstatus.
- **Webhookvervalsing/herhaling:** HMAC omvat tijdstip en exacte raw body, gebruikt constante-tijdvergelijking en accepteert maximaal vijf minuten klokafwijking. Provider-event-ID’s zijn uniek en dezelfde gebeurtenis is idempotent.
- **Gemanipuleerd bedrag of ontvanger:** de database leest bedrag, EUR-valuta en ontvanger uit het bevroren betaalorder en vergelijkt elk event; browserwaarden zijn nooit leidend.
- **Voortijdige vrijgave (historische sandbox):** het oorspronkelijke ontwerp vereiste `received_held`, bevestiging van beide partijen, een aparte staffcontrole van de vrijwaring en vervolgens een afzonderlijk providerevent. Deze betaalroute blijft buiten gebruik; de oude MFA-aanname is vervangen door het inlogbesluit.
- **Geschil na uitbetaling:** de geschilstatus wist `paid_out_at` niet. Een refund vraagt een aparte staffactie, reden, bedragcontrole, idempotentiesleutel en providerbevestiging.
- **Reconciliatie:** lokale en gesimuleerde provideradministratie worden alleen vergeleken. Afwijkingen worden geregistreerd en niet automatisch weggepoetst.
- **Klacht-IDOR:** verkopers worden via `seller_application_access` aan de aanvraag gekoppeld; dealers via het winnende bedrijf. RLS en RPC’s herhalen deze objectcontrole.
- **Klachtbewijs:** de sessie moet vóór een upload toegang tot een actieve klacht aantonen. Uploads worden inhoudelijk gecontroleerd, gehercodeerd en onder een hashgebonden privépad opgeslagen. Registratie vereist service-role én een echte actor met toegang tot precies die klacht; een rijlock weigert registratie na sluiting. Een technische opslagfout kan kort een privé-weesobject laten bestaan; de server probeert dit direct te verwijderen en de opruimtaak blijft vóór livegang verplicht.
- **Klachtstatus:** gesloten klachten accepteren geen nieuwe berichten of bewijs en kunnen niet stilzwijgend heropenen. Een onafhankelijke beoordeling wordt hoogstens eenmaal op een actief dossier vastgelegd. De winnaar kan al vóór betaling een probleem melden; de database controleert de eigen reservering.
- **Belangenconflict:** een platformverbonden koper zet `requires_independent_review`. De beoordelaar en de medewerker die afrondt moeten twee verschillende staff-identiteiten zijn.
- **Factuurverwarring:** testdocumenten hebben verplicht prefix `TEST-`, status `draft_blocked`, nulbedrag en onbepaalde fiscale behandeling. Zij kunnen niet als betaal- of koopbewijs gelden.
- **Dubbele e-mail/retry:** outboxregels hebben een unieke idempotentiesleutel. Workers gebruiken een lease en `SKIP LOCKED`; verlopen leases worden herstelbaar en providerrequests hergebruiken dezelfde sleutel.
- **Misleidende verkopersmail:** de aanvraagreferentie en het e-mailadres worden server-side gecontroleerd voordat Auth mailt. Providerweigering en rate limiting worden zonder ruwe SMTP-details aan de gebruiker gemeld; zonder eigen SMTP mag acceptatie niet suggereren dat willekeurige externe adressen mail ontvangen.
- **Al ingelogde verkoper:** een nieuwe aanvraag wordt niet automatisch aan een bestaande willekeurige sessie gekoppeld. De verkoper bevestigt de koppeling expliciet; PostgreSQL vergelijkt daarna opnieuw het geverifieerde Auth-e-mailadres en weigert staff- en dealeridentiteiten.
- **Notificatielekkage:** aanbodmeldingen gaan uitsluitend naar het zakelijke adres van goedgekeurde bedrijven en bevatten alleen een beveiligde dealerlink. Een overbodenmelding gaat alleen naar het bedrijf achter het vorige hoogste bod en bevat geen identiteit van de nieuwe bieder.
- **Interne jobroute:** een constante-tijdvergelijking controleert een apart geheim. De worker blijft uit zolang de expliciete delivery-schakelaar of Resend-configuratie ontbreekt.
- **Onveilige Preview-configuratie:** een Vercel-build stopt bij ontbrekende of voorbeeldwaarden, niet-HTTPS-origins, localhost, te korte of hergebruikte private geheimen, een publieke/service-role-sleutelmix of een actieve betaalsimulator. Productie vereist daarnaast een afzonderlijke expliciete vrijgaveschakelaar.
- **Statusroute als informatielek:** de openbare statusroute bevat alleen `status: ok`, wordt niet gecachet en krijgt `noindex`. De optionele databasecontrole vereist het operationele servergeheim en retourneert alleen bereikbaarheid, nooit data, sleutelwaarden of interne foutdetails.
- **Geheim in Git:** de lokale en CI-repositorycontrole weigert bijgehouden `.env`-/sleutelbestanden en herkenbare sleutelpatronen. Deze controle vult platformsecret-scanning en menselijke review aan, maar vervangt die niet.
- **Herstelproef:** het script weigert externe hosts, gebruikt willekeurig benoemde tijdelijke databases/buckets, vergelijkt SHA-256 en ruimt in `finally` op. Een bewijsrecord bevat geen dump, sleutel of objectinhoud.
- **Onbesliste commerciële regels:** de eerste veilingpolicy heeft status `test`; kosten blijven leeg. De database weigert status `approved` zolang kosten, betaler, voorwaardenversie, goedkeuringsactor en goedkeuringstijd ontbreken.
- **Vertraagde sluittaak:** een te laat bod wordt onafhankelijk van de taak geweigerd. De idempotente batchfunctie kan een verlopen ronde later sluiten en maakt door een unieke databaseconstraint maximaal één winnaarreservering.
- **Onveilige veilingherstart:** alleen bevoegde staff kan een afgesloten ronde herstarten, met verplichte reden en idempotentiesleutel. Een databaselock en unieke index voorkomen twee gelijktijdige actieve rondes; bestaande biedingen worden nooit aangepast. Zodra afspraak, verkoopdossier of geschil bestaat, weigert de database de herstart.
- **Logging:** technische logs bevatten geen wachtwoorden, tokens, volledige formulierinhoud of onnodige persoonsgegevens. Zakelijke contactnotities en wijzigingsredenen zijn afgeschermde dossiergegevens, geen technische logs.
- **Biedernamen in het dealerportaal:** uitsluitend een staff-account met rol `admin` krijgt op de voertuigpagina de bedrijfsnaam per bod. De server vraagt deze namen met de eigen Supabase-sessie op onder de bestaande RLS-policies; er wordt geen service-role gebruikt. Gewone dealers krijgen geen namenmap of extra identiteitsvelden in hun antwoord. Handelsnaam heeft voorrang, met juridische bedrijfsnaam als terugval. Geheime automatische maximumbiedingen blijven buiten deze weergave.

## Herstel beheeraccount

Wachtwoordherstel gebruikt de beveiligde e-mailroute; een wachtwoordwijziging trekt bestaande sessies globaal in. Herstel van beheerbevoegdheid vereist schriftelijke, handmatige identiteit- en eigendomscontrole door minimaal één andere bevoegde beheerder of via een gecontroleerde noodprocedure. Deze procedure moet vóór livegang worden vastgesteld en getest. De eerdere verplichting om een MFA-herstelprocedure voor de applicatie vast te stellen is vervangen door het inlogbesluit; bestaande Auth-factorrecords worden hierbij niet verwijderd.

## Resterend vóór livegang

- Verlopen, niet-afgeronde uploadobjecten moeten periodiek uit Storage worden verwijderd; de onderhoudstaak wordt bij de hostinginrichting geactiveerd en getest.
- Rate limits moeten tijdens de besloten proef met realistische belasting worden geëvalueerd.
- Juridische bewaartermijnen bepalen de uiteindelijke automatische verwijderregels.
