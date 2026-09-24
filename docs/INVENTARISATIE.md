# Fase 0 — inventarisatie Thijskooptuauto

Datum nulmeting: 22 september 2026  
Repository: `Q:\Games\Thijskooptuauto`  
Bron voor de nieuwe opdracht: aangeleverde `AGENTS.md`, `LEESMIJ.md` en `docs/BOUWPLAN.md` versie 1.0.

## 1. Conclusie

Deze projectmap bevat **wel degelijk een werkende applicatiebasis**. Het is geen lege map en ook geen WordPress- of Cloudflare-project meer. De repository gebruikt al de passende voorkeursstack uit het bouwplan:

- Next.js 16 App Router met TypeScript en React;
- Tailwind CSS en herbruikbare React-componenten voor de bestaande huisstijl;
- Supabase PostgreSQL, Auth en private Storage;
- SQL-migraties, Row Level Security en databasefuncties;
- een publieke website, zesstaps autoaanmelding, RDW-koppeling, dealerportaal en beheeromgeving;
- lokale unit- en databasebeveiligingstests.

De aanbevolen aanpak is daarom **de bestaande repository gericht uitbreiden**. Een frameworkmigratie of herbouw van de openbare website is technisch niet gerechtvaardigd en zou onnodig risico geven voor huisstijl, formulieren, beveiliging en bestaande tests.

De nieuwe productspecificatie wijkt op één belangrijk punt af van de aanwezige implementatie: de huidige bieding is besloten en toont een dealer alleen biedingen van het eigen bedrijf. De vastgelegde nieuwe werking vereist zichtbare bedragen voor alle goedgekeurde garages, zodat zij elkaar gedurende exact 24 uur kunnen overbieden. Ook afspraak, inspectie, wederzijds koopakkoord, betaling via een provider, uitbetaling, overdracht en klachten zijn nog niet als volledige procesketen aanwezig.

Fase 0 heeft geen applicatiecode, database of styling gewijzigd. Er is niets gepubliceerd en er zijn geen externe of betaalde resources aangemaakt.

## 2. Repository en ontwikkelomgeving

### 2.1 Versiebeheer

- Git is aanwezig: versie `2.49.0.windows.1`.
- Huidige branch: `phase-1-foundation`.
- De branchnaam is inmiddels verouderd: de code bevat lokaal onderdelen die in de bestaande documentatie fase 1 tot en met 4 heten.
- Er is geen Git-remote geconfigureerd. De broncode staat dus nog niet aantoonbaar in een bedrijfsrepository of off-device back-up.
- Bij aanvang van fase 0 stond één bestaande wijziging open in `components/public/license-plate-start.tsx`. Deze inventarisatie heeft die wijziging niet aangepast of teruggedraaid.

### 2.2 Werkelijke software en versies

| Onderdeel | Aanwezig | Werkelijke versie/opmerking |
|---|---:|---|
| Node.js | Ja | `22.16.0` |
| npm | Ja | `11.4.1`; enige package manager voor deze repository |
| Next.js | Ja | `16.3.4` |
| React | Ja | `19.2.6` |
| TypeScript | Ja | `5.9.3`, strict mode |
| Tailwind CSS | Ja | `4.2.1` |
| Supabase CLI | Ja, projectafhankelijkheid | geïnstalleerd als `2.117.0` |
| Docker | Ja | client `29.8.0`; lokale Supabase en databasetests werkten tijdens de nulmeting |
| Git | Ja | `2.49.0.windows.1` |
| Playwright/E2E | Nee | nog niet ingericht |

Versies en scripts staan in [`package.json`](../package.json) en zijn reproduceerbaar vastgelegd in [`package-lock.json`](../package-lock.json).

### 2.3 Werkelijk uitgevoerde nulmeting

| Controle | Uitkomst op 22-09-2026 |
|---|---|
| `npm run lint` | Geslaagd, nul waarschuwingen toegestaan |
| `npm run typecheck` | Geslaagd |
| `npm run test` | Geslaagd: 9 testbestanden, 37 tests |
| `npm run test:db` | Geslaagd: 4 pgTAP-bestanden, 94 tests tegen lokale PostgreSQL/Supabase |
| `npm run build` | Geslaagd: Next.js-productiebuild met 29 routes |

Deze uitslagen gelden voor de **huidige besloten biedlogica**. Ze bewijzen nog niet de acceptatiecriteria voor zichtbare biedingen, exact 24 uur, één winnaarreservering, afspraken of betalingen uit het nieuwe bouwplan.

## 3. Wat daadwerkelijk aanwezig is en werkt

### 3.1 Applicatiebasis

De applicatie is één Next.js App Router-project. Dat past bij de gewenste eenvoudige modulaire architectuur en voorkomt een extra backend of microservices.

- Rootlayout en algemene metadata: [`app/layout.tsx`](../app/layout.tsx).
- Globale kleur-, typografie- en portaalstijlen: [`app/globals.css`](../app/globals.css).
- Next.js-configuratie voor lokale en gehoste private Supabase-afbeeldingen: [`next.config.ts`](../next.config.ts).
- Sessieverversing via Next.js Proxy: [`proxy.ts`](../proxy.ts) en [`lib/supabase/proxy.ts`](../lib/supabase/proxy.ts).
- Supabase-clients zijn gescheiden voor browser, server en afgebakende server-only beheertaken: [`lib/supabase/browser.ts`](../lib/supabase/browser.ts), [`lib/supabase/server.ts`](../lib/supabase/server.ts) en [`lib/supabase/admin.ts`](../lib/supabase/admin.ts).
- Centrale toegangscontrole voor routes staat in [`lib/auth/dal.ts`](../lib/auth/dal.ts).

### 3.2 Openbare website

De volgende openbare pagina's zijn daadwerkelijk aanwezig:

| Route | Implementatie | Huidige toestand |
|---|---|---|
| `/` | [`app/page.tsx`](../app/page.tsx) | Homepage met hero, kentekenstart en procesblokken |
| `/auto-aanmelden` | [`app/auto-aanmelden/page.tsx`](../app/auto-aanmelden/page.tsx) | Zesstaps formulier |
| `/auto-aanmelden/bedankt` | [`app/auto-aanmelden/bedankt/page.tsx`](../app/auto-aanmelden/bedankt/page.tsx) | Bevestiging met onvoorspelbare referentie |
| `/hoe-werkt-het` | [`app/hoe-werkt-het/page.tsx`](../app/hoe-werkt-het/page.tsx) | Procesuitleg, nog gebaseerd op besloten biedingen |
| `/over-ons` | [`app/over-ons/page.tsx`](../app/over-ons/page.tsx) | Persoonlijke uitleg en dezelfde bestaande huisstijl |
| `/veelgestelde-vragen` | [`app/veelgestelde-vragen/page.tsx`](../app/veelgestelde-vragen/page.tsx) | FAQ |
| `/contact` | [`app/contact/page.tsx`](../app/contact/page.tsx) | Adres, telefoon, e-mail en contactformulier |
| `/privacy-en-voorwaarden` | [`app/privacy-en-voorwaarden/page.tsx`](../app/privacy-en-voorwaarden/page.tsx) | Herkenbaar concept; juridische controle staat expliciet open |

De contactpagina verzendt nog niet server-side. [`components/public/contact-form.tsx`](../components/public/contact-form.tsx) opent een vooraf ingevuld bericht in het lokale e-mailprogramma via `mailto:`. Dit werkt als gebruikershulpmiddel, maar is geen betrouwbare opgeslagen contactaanvraag.

SEO-basis is aanwezig via paginametadata, [`app/sitemap.ts`](../app/sitemap.ts) en [`app/robots.ts`](../app/robots.ts). Besloten pagina's hebben daarnaast `noindex`, maar hun beveiliging berust terecht op Auth/RLS en niet op robots-instellingen.

### 3.3 Werkelijke visuele referenties

De lokale applicatie is tijdens fase 0 visueel bekeken op:

- `http://127.0.0.1:3000/` — homepage;
- `http://127.0.0.1:3000/auto-aanmelden` — formulierstap 1;
- `http://127.0.0.1:3000/inloggen` — stijl van de besloten omgeving.

De volgende repositorybestanden zijn de blijvende visuele bron van waarheid:

| Referentie | Bestand/waarde |
|---|---|
| Logo | [`public/tkua-logo.png`](../public/tkua-logo.png), 220 × 222 pixels |
| Hero-afbeelding | [`public/car-inspection-hero.png`](../public/car-inspection-hero.png), 1536 × 1024 pixels |
| Header | [`components/public/site-header.tsx`](../components/public/site-header.tsx) |
| Footer | [`components/public/site-footer.tsx`](../components/public/site-footer.tsx) |
| Algemene openbare paginaopbouw | [`components/public/public-page.tsx`](../components/public/public-page.tsx) |
| Hoofdkleuren | zwart `#090909`/`#111111`, oranje `#f7941e`, warm wit `#f8f6f2`, wit |
| Typografie | Arial/Helvetica met zware koppen, zoals vastgelegd in [`app/globals.css`](../app/globals.css) |
| Vormen | afgeronde witte panelen, oranje primaire knoppen, donkere hero en portaalachtergrond |

De homepage toont de bestaande donkere automotive hero, het witte logo, de oranje actieknoppen en het Nederlandse kentekenveld. De formulierpagina gebruikt dezelfde header/footer en warme lichte achtergrond. De login gebruikt dezelfde kleuren, afgeronde panelen en zware koppen. Er is daarom voldoende concrete ontwerpbron in de repository; een nieuw thema is niet nodig.

### 3.4 Particuliere autoaanmelding

[`components/applications/application-wizard.tsx`](../components/applications/application-wizard.tsx) bevat daadwerkelijk zes stappen:

1. kenteken;
2. voertuiggegevens;
3. kilometerstand en staat;
4. foto's;
5. contactgegevens;
6. controle en verzenden.

Aanwezige werking:

- kenteken wordt genormaliseerd en gevalideerd;
- voertuig- en conditiegegevens blijven tijdelijk in `sessionStorage`; contactgegevens worden daar niet opgeslagen;
- handmatige invoer blijft mogelijk bij een onbekend kenteken of RDW-storing;
- een sessiegebonden idempotentiesleutel voorkomt dubbele aanvragen;
- honeypot, gehashte request-identificatie en databasegestuurde rate limiting zijn aanwezig;
- maximaal 12 JPEG-, PNG- of WebP-foto's van maximaal 10 MB per bronbestand;
- de browser hercodeert naar JPEG, waarna de server bestandstype en echte inhoud opnieuw controleert en via Sharp metadata verwijdert;
- upload gaat naar een tijdelijk privépad via een kort geldige signed-uploadmachtiging;
- definitieve opslag gebeurt onder een hashgebonden pad;
- een aanvraag wordt eerst opgeslagen; een e-mailstoring verwijdert de aanvraag niet.

De serverroutes staan in [`app/api/applications/draft/route.ts`](../app/api/applications/draft/route.ts) en [`app/api/applications/finalize/route.ts`](../app/api/applications/finalize/route.ts). Validatie staat in [`lib/applications/schema.ts`](../lib/applications/schema.ts) en beeldcontrole in [`lib/uploads/image.ts`](../lib/uploads/image.ts).

Nog niet aanwezig voor de nieuwe productspecificatie: contactverificatie en een beveiligd verkopersdossier waarin de particulier later uitslag, afspraak, koopakkoord, betaling, overdracht en klacht kan beheren.

### 3.5 RDW-koppeling

Een echte server-side RDW Open Data-koppeling is aanwezig:

- API-route: [`app/api/rdw/route.ts`](../app/api/rdw/route.ts);
- client en mapping: [`lib/rdw/client.ts`](../lib/rdw/client.ts);
- basisdataset `m9d7-ebf2` en brandstofdataset `8ys7-d773`;
- optioneel `RDW_APP_TOKEN`, zonder dat handmatige invoer daarvan afhankelijk is;
- unit-tests voor gevonden, onbekende, ongeldige en gedeeltelijk uitgevallen RDW-responses in [`lib/rdw/client.test.ts`](../lib/rdw/client.test.ts).

Merk, handelsbenaming, variant/uitvoering, eerste toelating, kleur, voertuigsoort en beschikbare brandstofinformatie worden gemapt. Er worden terecht geen eigenaar-, schade-, onderhouds- of taxatiegegevens verondersteld.

### 3.6 Authenticatie, bedrijven en beheer

Supabase Auth is daadwerkelijk gekoppeld. Aanwezige functies:

- registreren met e-mailbevestiging en inloggen: [`app/auth/actions.ts`](../app/auth/actions.ts), [`app/registreren/page.tsx`](../app/registreren/page.tsx) en [`app/inloggen/page.tsx`](../app/inloggen/page.tsx);
- callback en sessiecookies: [`app/auth/callback/route.ts`](../app/auth/callback/route.ts);
- dealerbedrijf registreren als `pending`: [`app/dealer/registreren`](../app/dealer/registreren);
- bedrijf goedkeuren of blokkeren door beheer: [`app/beheer/actions.ts`](../app/beheer/actions.ts);
- beheer vereist staff-lidmaatschap én MFA-niveau `aal2`: [`app/beheer/layout.tsx`](../app/beheer/layout.tsx), [`app/auth/mfa`](../app/auth/mfa) en [`lib/auth/dal.ts`](../lib/auth/dal.ts);
- pending en blocked dealers krijgen geen dealer-aanbod.

Gebruikers, bedrijven en lidmaatschappen zijn afzonderlijk gemodelleerd. Er is bewust geen self-service adminpromotie. Een uitgewerkte wachtwoordherstelroute en verplicht TOTP voor biedende dealers zijn nog niet aanwezig.

### 3.7 Database, rechten en opslag

De SQL-migraties zijn de feitelijke bron van waarheid:

- [`202609210001_phase_1_foundation.sql`](../supabase/migrations/202609210001_phase_1_foundation.sql): gebruikersprofielen, staff, bedrijven, lidmaatschappen, verkopers, voertuigen, aanvragen, revisies, foto's, listings, biedrondes, biedingen, afhandeling, notities, auditlog, outbox en idempotentie;
- [`202609210002_phase_2_public_applications.sql`](../supabase/migrations/202609210002_phase_2_public_applications.sql): publieke concepten, rate limiting, formuliergebeurtenissen en aanvraag-RPC's;
- [`202609210003_phase_3_dealer_bidding.sql`](../supabase/migrations/202609210003_phase_3_dealer_bidding.sql): publicatie, dealeraanbod en transactioneel bieden;
- [`202609210004_fix_company_membership_policy.sql`](../supabase/migrations/202609210004_fix_company_membership_policy.sql): gerichte policycorrectie;
- [`202609210005_phase_4_deal_workflow.sql`](../supabase/migrations/202609210005_phase_4_deal_workflow.sql): contactmomenten, eenvoudige afhandelstatussen en materiële voertuigwijzigingen.

Default-deny grants, RLS en gecontroleerde `security definer`-functies zijn aanwezig. De private bucket `vehicle-photos` gebruikt tijdelijke signed URLs. Verkopersgegevens, interne notities en auditgegevens zijn alleen voor beheer op `aal2` leesbaar. Biedingen zijn append-only door een databasetrigger.

De bestaande kernentiteiten zijn bruikbaar, maar de volgende nieuwe entiteiten/toestanden uit het bouwplan ontbreken nog: verkoperssessies of seller memberships, regelsnapshots, feesnapshots, winnaarreserveringen, afspraken, inspecties, wederzijdse koopbevestigingen, betalingen en payment events, overdracht/vrijwaring, uitbetalingen, platformfacturen, klachten en versieerbare productie-instellingen.

### 3.8 Huidig dealerportaal en bieden

Het dealerportaal is aanwezig onder `/dealer`:

- aanbod en filters: [`app/dealer/page.tsx`](../app/dealer/page.tsx);
- voertuigdetail, gecontroleerde foto's en biedformulier: [`app/dealer/aanbod/[id]/page.tsx`](../app/dealer/aanbod/[id]/page.tsx);
- eigen biedhistorie: [`app/dealer/biedingen/page.tsx`](../app/dealer/biedingen/page.tsx);
- serveractie: [`app/dealer/actions.ts`](../app/dealer/actions.ts);
- atomaire databasefunctie `public.place_bid`: [`202609210003_phase_3_dealer_bidding.sql`](../supabase/migrations/202609210003_phase_3_dealer_bidding.sql).

Wat de huidige biedfunctie al goed doet:

- gebruiker en goedgekeurd bedrijf worden server-side uit de sessie bepaald;
- biedronderij wordt vergrendeld;
- listing, status, begin/eindtijd en positief bedrag worden gecontroleerd;
- bedragen zijn gehele eurocenten;
- idempotentiesleutel voorkomt dubbele verwerking;
- eigen bod kan alleen omhoog;
- biedingen zijn append-only en krijgen audit- en outboxregels.

Wat **niet** overeenkomt met het nieuwe vastgelegde kernproces:

- dealers zien alleen de biedingen van hun eigen bedrijf;
- een nieuw bod hoeft alleen hoger te zijn dan het eigen vorige bod, niet hoger dan het actuele hoogste bod van alle bedrijven;
- twee bedrijven kunnen hetzelfde bedrag accepteren zolang het voor ieder een verhoging is;
- de biedstap/minimumverhoging en feesnapshot ontbreken;
- begin- en eindtijd worden door beheer ingevoerd en zijn niet aantoonbaar afgedwongen als exact `86400` seconden vanaf publicatie;
- `now()` wordt in de bestaande functie vóór de rijlock aan een variabele toegekend; voor test T05 moet het beslismoment expliciet na verkrijging van de lock worden bepaald;
- er is geen dealerbrede geautoriseerde biedhistorie of veilig realtime-/refreshmodel;
- sluiten is handmatig en maakt geen unieke winnaarreservering;
- de hoogste bieder start nog geen afspraakroute;
- de bestaande documentatie en publieke teksten spreken nog over “besloten bieden”.

De huidige biedfunctie moet daarom in een nieuwe migratie worden **aangepast en uitgebreid**, niet weggegooid of omzeild. Rechtstreekse brede `SELECT`-rechten op de biedtabel zijn niet geschikt; zichtbaarheid hoort via een minimale geautoriseerde view/RPC of zorgvuldig RLS-model zonder bedrijfs-, gebruikers- of contactlekken.

### 3.9 Huidig beheer en afhandeling

Beheer kan al:

- bedrijven goedkeuren en blokkeren;
- aanvragen bekijken en statussen wijzigen;
- verkopersgegevens en interne notities zien;
- foto's controleren;
- een onveranderlijke voertuigversie publiceren;
- een biedronde openen en sluiten;
- alle biedingen vergelijken;
- contactmomenten vastleggen;
- een bod selecteren en eenvoudige afhandelstatussen bijhouden;
- een materiële wijziging registreren, waarna oud aanbod en de ronde worden ingetrokken/geannuleerd terwijl historie bewaard blijft.

Belangrijkste bestanden zijn [`app/beheer/page.tsx`](../app/beheer/page.tsx), [`app/beheer/aanvragen/page.tsx`](../app/beheer/aanvragen/page.tsx), [`app/beheer/aanvragen/[id]/page.tsx`](../app/beheer/aanvragen/[id]/page.tsx), [`app/beheer/aanvragen/market-actions.ts`](../app/beheer/aanvragen/market-actions.ts) en [`app/beheer/aanvragen/workflow-actions.ts`](../app/beheer/aanvragen/workflow-actions.ts).

De huidige `deal_cases`-workflow is nog geen afspraak-, inspectie-, koop-, betaal-, overdrachts- of klachtenmodule. “Agreed” is nu een door beheer gezette dossierstatus en niet aantoonbaar het afzonderlijke akkoord van koper en verkoper.

### 3.10 E-mail, analytics en hosting

- Aanvraag- en bodmeldingen worden eerst duurzaam in `notification_outbox` opgeslagen.
- [`lib/email/application-confirmation.ts`](../lib/email/application-confirmation.ts) en [`lib/email/bid-confirmation.ts`](../lib/email/bid-confirmation.ts) kunnen Resend server-side aanroepen wanneer de variabelen zijn ingesteld.
- Zonder Resend-configuratie blijven aanvragen en biedingen bestaan. Er is nog geen geplande, gegarandeerde outbox-worker/retrydienst.
- Formulierstarts worden intern en zonder kenteken/contacttekst geregistreerd; er is geen externe advertentie- of analysetracker.
- Vercel is alleen de gedocumenteerde beoogde host. Er is geen `.vercel`-koppeling, geen platformconfiguratie in Git, geen Git-remote en geen bewijs van een uitgevoerde deployment.
- Er zijn geen betaalprovider, betaaladapter, sandboxcredentials of payment webhooks aanwezig.

De aanwezige omgevingsvariabelenamen staan zonder waarden in [`.env.example`](../.env.example): Supabase URL/publishable key, server-only service role, applicatie-URL, secrets voor concepttokens/rate limiting, optioneel RDW-token en Resend-configuratie. Een lokale `.env.local` bestaat en is door `.gitignore` uitgesloten; waarden zijn tijdens deze inventarisatie niet gekopieerd of gerapporteerd.

## 4. Behouden, aanpassen en toevoegen

### 4.1 Ongewijzigd behouden als basis

- Next.js/TypeScript/Supabase-architectuur en npm-lockfile.
- Alle bestaande openbare routes en URL's.
- Logo, hero-afbeelding, kleuren, typografie, header, footer, panelen en knoppen.
- Zesstaps aanmeldwizard, servervalidatie en handmatige RDW-terugval.
- RDW-datasets en server-side koppeling.
- Private foto-opslag, signed uploads, server-side inhoudscontrole en metadatareductie.
- Scheiding tussen verkopersgegevens en dealerdata.
- Profielen, bedrijven en company memberships.
- Handmatige dealergoedkeuring en blokkering.
- Centrale DAL, beheer-MFA, default-deny RLS en negatieve database-tests.
- Voertuigrevisies, append-only biedingen, auditlog, idempotentie en outboxpatroon.
- Gecontroleerde procedure voor materiële voertuigwijzigingen.

### 4.2 Gericht aanpassen

- Publieke teksten van “besloten bieden” naar het vastgelegde zichtbare 24-uursproces, zonder visueel herontwerp en pas tegelijk met werkende functionaliteit.
- Dealer-RPC's en dealerweergave: geautoriseerde actuele hoogste prijs en biedhistorie zichtbaar maken zonder contactgegevens of onbevoegde organisatiegegevens.
- Biedfunctie: globaal hoogste bod, testconfigureerbare minimumstap, tijdcontrole na lock, regelsnapshot en feesnapshot.
- Publicatiefunctie: `ends_at = starts_at + 86400 seconden` server-side afdwingen.
- Sluitfunctie/job: maximaal één winnaarreservering, idempotente uitkomst en geen automatische koop.
- Rollenmodel: Thijs biedt via een gewone dealeridentiteit; een beheerderssessie mag niet bieden. Hiervoor zijn technisch én organisatorisch gescheiden accounts/sessies nodig.
- Bestaande eenvoudige `deal_cases` uitbreiden of migreren naar afzonderlijke afspraak-, inspectie-, koop- en afhandeltoestanden zonder historische gegevens te overschrijven.

### 4.3 Nog toevoegen

- verkoperverificatie en beveiligd eigen dossier;
- dealerbrede zichtbare biedhistorie met veilig refresh/realtime-herstel;
- regels- en feesnapshots per gepubliceerde veiling;
- automatische, herstelbare sluitjob naast de harde database-deadline;
- unieke winnaarreservering;
- afspraakvoorstellen en bevestiging door beide partijen;
- inspectieverslag en afzonderlijk prijsafwijkingsvoorstel;
- expliciet koopakkoord van koper én verkoper;
- betaalprovideradapter, eerst mock en daarna officiële sandbox;
- geverifieerde webhooks, betaling, vrijgave, uitbetaling, refunds en reconciliatie;
- overdracht/vrijwaring en afzonderlijke statussen;
- klachtenmodule en tweede beoordeling wanneer Thijs zelf koper is;
- platformfactuur-/correctiegegevens;
- productieve outbox-worker, monitoring en incidentroute;
- database- én Storage-back-up plus aantoonbare hersteltest;
- browser-E2E en visuele regressietests;
- productieaccounts, hostingkoppeling en onafhankelijke beveiligingsreview.

## 5. Visueel behoud bij nieuwe portalen en processen

De openbare website blijft visueel gelijk door de volgende werkwijze:

1. [`app/globals.css`](../app/globals.css), het logo, de hero, `SiteHeader`, `SiteFooter` en `PublicPage` blijven de visuele basis; geen nieuw thema of los designsysteem.
2. Publieke URLs en paginaopbouw blijven staan. Alleen procesinhoud die aantoonbaar onjuist wordt door de nieuwe werking wordt inhoudelijk aangepast.
3. Nieuwe verkopersschermen gebruiken dezelfde warme lichte achtergrond, zware koppen, oranje primaire acties en afgeronde witte panelen.
4. Dealer- en beheerschermen blijven functioneel compacter, maar gebruiken dezelfde tokens en componenten. Financiële of risicovolle statussen krijgen duidelijke semantische waarschuwingen zonder een andere merkstijl te introduceren.
5. Voor iedere toekomstige UI-fase worden desktop- en mobiele referenties gemaakt van minimaal homepage, formulier, dealerlisting, dealerdetail en beheer. Een visuele wijziging wordt apart beoordeeld van functionele migraties.
6. Nieuwe betalingspagina's gebruiken waar mogelijk door de provider gehoste checkout; de terugkeer- en statuspagina's volgen de eigen huisstijl maar presenteren nooit een retour-URL als betaalbewijs.

## 6. Aanbevolen technische aanpak voor deze repository

### 6.1 Keuze

Blijf bij één Next.js 16 App Router-applicatie met TypeScript, Supabase PostgreSQL/Auth/private Storage en Vercel als beoogde host. Gebruik genummerde SQL-migraties als enige schemasource. Voeg geen ORM, tweede database of losse microservice toe.

### 6.2 Reden

- De gekozen stack is al volledig ingericht en de nulmeting slaagt.
- Het openbare ontwerp en de kernformulieren zijn al in deze applicatie geïntegreerd.
- De bestaande RLS-, Auth-, Storage-, audit- en idempotentiepatronen zijn een goede basis voor uitbreiding.
- Een migratie zou bestaande beveiliging en testdekking opnieuw moeten bewijzen zonder functioneel voordeel.
- De nieuwe eisen zijn vooral domein- en transactielogica; die passen in nieuwe PostgreSQL-migraties, serveracties/RPC's en aanvullende Next.js-routes.

### 6.3 Modulegrenzen

- **Publiek/verkoper:** huidige openbare pagina's en aanmelding; later verkopersdossier.
- **Dealer:** goedgekeurde bedrijven, zichtbaar bieden, winstdossiers en afspraken.
- **Beheer:** controle, publicatie, uitzonderingen, klachten en operatie.
- **Veilingkern:** één atomaire biedfunctie en één idempotente sluitfunctie in PostgreSQL.
- **Transactiekern:** afzonderlijke afspraak-, inspectie-, koop-, betaal-, overdrachts- en klachttoestanden.
- **Betaling:** provider-onafhankelijke server-only adapter; mock en officiële sandbox vóór enige productieconfiguratie.
- **Notificaties:** transactionele outbox als bron; losse retry-worker verwerkt verzending na succesvolle domeintransactie.

Realtime mag alleen geautoriseerde weergave versnellen. De databasefunctie en databasetijd blijven de autoriteit voor bedrag, volgorde, deadline en winnaar.

## 7. Echte commando's

### 7.1 Eerste lokale installatie

```powershell
cd Q:\Games\Thijskooptuauto
npm ci
Copy-Item .env.example .env.local
npm run db:start
```

Neem uitsluitend lokaal de door Supabase getoonde URL en sleutels over in `.env.local`. Maak eigen willekeurige waarden van minimaal 32 tekens voor `REQUEST_FINGERPRINT_SECRET` en `DRAFT_TOKEN_SECRET`. Plaats geheimen niet in chat, documentatie of Git.

### 7.2 Ontwikkelen

```powershell
npm run dev
```

Open `http://127.0.0.1:3000`. Lokale Supabase Studio gebruikt volgens de projectconfiguratie poort `54323`. Auth-e-mails worden lokaal door de Supabase-mailinterface opgevangen; er wordt lokaal geen echte e-mail verzonden.

### 7.3 Testen en bouwen

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:db
npm run build
```

`npm run test:db` vereist een draaiende Docker-runtime en lokale Supabase. `npm run check` combineert lint, typecontrole, unit-tests en build, maar voert **niet** `test:db` uit.

Een productieachtige lokale start na een geslaagde build:

```powershell
npm run build
npm run start
```

Database opnieuw opbouwen uit migraties en fictieve seed:

```powershell
npm run db:reset
```

Dit verwijdert lokale Supabase-testdata en mag alleen bewust in de lokale ontwikkelomgeving worden gebruikt.

## 8. Gefaseerde backlog volgens het nieuwe bouwplan

De labels hieronder volgen het aangeleverde bouwplan. Bestaande code wordt hergebruikt; “gedeeltelijk” betekent niet dat de acceptatietests uit het nieuwe plan al slagen.

### Fase 0 — inventarisatie

Status: **afgerond met dit document**.

- Repository, stack, pagina's, visuele bronnen, koppelingen, schema, rechten, hostingstatus en tests zijn feitelijk vastgesteld.
- Nulmeting is uitgevoerd.
- Geen applicatie- of productiewijzigingen gedaan.

### Fase 1 — basis, accounts, rollen en opslagrechten

Status: **grotendeels aanwezig, gerichte uitbreiding nodig**.

Werk:

- bestaande Auth, company memberships, MFA, RLS en private Storage behouden;
- verkoperidentiteit/beveiligde dossiersessie ontwerpen;
- Thijs-beheeraccount en Thijs-dealeraccount aantoonbaar scheiden;
- verplicht MFA-beleid voor accounts met bied-/transactierechten toevoegen;
- versieerbare `policy_versions/settings` voorbereiden met expliciete `test_only`- en productieblokkadevelden;
- wachtwoord-/account-herstel gecontroleerd toevoegen.

Relevante acceptatietests: **F03, F12, S01, S04, S07, S08, S09**. Bestaande RLS-tests worden behouden en uitgebreid; geen policywijziging zonder negatieve test.

### Fase 2 — particuliere aanmelding en beheercontrole

Status: **grotendeels aanwezig, verkopersroute ontbreekt**.

Werk:

- bestaande wizard, RDW, upload en beheercontrole behouden;
- contact/e-mail verifiëren;
- particulier alleen het eigen dossier laten zien en aanvullen;
- globale locatie en vereiste fotocategorieën modelleren zonder onnodige persoonsgegevens;
- publieke teksten pas aanpassen wanneer de nieuwe procesroute functioneel klopt;
- server-side contactformulier of duidelijk behoud van de huidige mailto-keuze beslissen.

Relevante acceptatietests: **F01, F02, S01, S04, S06, S07, P10**.

### Fase 3 — zichtbare 24-uursbiedingen en winnaarreservering

Status: **bestaande besloten biedkern is bruikbaar maar functioneel niet conform; dit is de grootste directe wijziging**.

Werk:

- nieuwe migratie voor regelsnapshot, feesnapshot, actuele hoogste prijs en winnaarreservering;
- exact `86400` seconden vanaf gecontroleerde publicatie afdwingen;
- globale hoogste prijs en testconfigureerbare minimumstap in dezelfde gelockte transactie controleren;
- actuele databasetijd na verkrijging van de lock gebruiken;
- biedhistorie en bedrag zichtbaar maken aan alle goedgekeurde garages, zonder persoonlijke of interne gegevens;
- refresh/realtime-herstel veilig ontwerpen;
- idempotente sluitfunctie en herstelbare sluitjob;
- geen bod na deadline, ook niet bij vertraagde job;
- hoogste geldige bod maakt maximaal één winnaarreservering, geen koop;
- behandelingskosten uitsluitend als duidelijk gemarkeerde testconfiguratie snapshotten; productie blijft geblokkeerd zolang hoogte en betaler ontbreken.

Relevante acceptatietests: **F03–F07, F12, T01–T10, S01–S05, S07–S09**.

### Fase 4 — afspraak, inspectie en wederzijds koopakkoord

Status: **niet als volwaardige procesketen aanwezig**.

Werk:

- afspraken met voorstellen en bevestiging door koper én verkoper;
- inspectieverslag door de kopende garage;
- origineel bod onveranderlijk houden;
- afwijkend prijsvoorstel als apart object met expliciet akkoord van verkoper;
- afzonderlijk koopakkoord van beide partijen en voorwaardenversie;
- annulering/no-show/afwijzing zonder automatische doorschuiving naar nummer twee;
- contactgegevens pas gecontroleerd aan de winnaar tonen wanneer de afspraakroute dit toestaat.

Relevante acceptatietests: **F06, F08–F12, S01, S03, S04, S09**.

### Fase 5 — betaaladapter en officiële sandbox

Status: **niet aanwezig; externe providergoedkeuring blijft nodig**.

Veilig vooraf te bouwen:

- provider-onafhankelijke interface en gesimuleerde adapter;
- payment attempts/events, bedrag, valuta, ontvanger, feesnapshot en koopversie;
- webhook-idempotentie en statusmachine met fictieve/sandboxdata;
- productieguard die mock, testtarief en onbevestigde provider blokkeert.

Na provideracceptatie:

- officiële sandbox-onboarding;
- cryptografische webhookverificatie volgens providerdocumentatie;
- gehoste checkout, ontvangst/hold, vrijgave, uitbetaling, refund en reconciliatie;
- afzonderlijke route beoordelen wanneer Thijs zelf koper is.

Relevante acceptatietests: **P01–P09, P12, S01–S04, S08, S09**.

### Fase 6 — klachten, facturen en operatie

Status: **niet aanwezig**.

Werk:

- klachtendossier met bewijs en tijdlijn;
- aantoonbare tweede beoordeling wanneer Thijs zelf koper is;
- platformfactuur-/correctiegegevens gescheiden van de autokoop;
- outbox-worker, retries en deduplicatie;
- monitoring, incidentregistratie en dagelijkse betaalreconciliatie;
- database- en Storage-back-up plus geïsoleerde herstelproef.

Relevante acceptatietests: **F11, P03, P07–P11, S04, S08, S09**.

### Fase 7 — externe goedkeuring en onafhankelijke controle

Status: **open**.

- juridische en fiscale beoordeling;
- schriftelijke acceptatie door betaalprovider voor auto-/particulier-/garagegeldstroom;
- beoordeling van contractvorming, voorwaarden, privacy, DAC7 en bewaartermijnen;
- onafhankelijke review van accountgrenzen, open biedingen, uploads, betalingen en uitbetalingen;
- volledige gebruikersproef met fictieve gegevens en vijf tot tien pilotgarages.

Alle acceptatietests **F01–F12, T01–T10, S01–S09 en P01–P12** moeten op de uiteindelijke acceptatieomgeving aantoonbaar zijn uitgevoerd. Een mock geldt niet als bewijs voor livebetalingen.

### Fase 8 — beperkte livepilot

Status: **geblokkeerd tot expliciete livegangbeslissing**.

- alleen na afgeronde fase 7, providerproductieacceptatie, definitieve kosteninstellingen, hersteltest en expliciete toestemming;
- gecontroleerde groep garages en echte verkopers;
- uitbetaling, overdracht, klachten, facturatie en reconciliatie actief volgen;
- pas daarna besluiten over opschaling.

Relevante acceptatie: opnieuw minimaal de kritieke account-, tijd-, concurrency-, betalings-, herstel- en klachtenroutes uit **F, T, S en P**, nu met productieconfiguratie en zonder testadapters of fictieve tarieven.

## 9. Vastgelegde productkeuzes — niet opnieuw vragen

De volgende punten zijn door de opdrachtgever vastgelegd en worden niet opnieuw als open vraag behandeld:

- een particulier meldt een auto aan;
- Thijs en andere goedgekeurde garages bieden;
- de biedperiode duurt exact 24 uur vanaf publicatie;
- biedbedragen zijn binnen het dealerportaal zichtbaar zodat garages elkaar kunnen overbieden;
- de hoogste geldige bieder start de afspraakroute;
- een gewonnen veiling is geen automatisch gesloten koop;
- koper inspecteert de auto en regelt ophalen;
- betaling moet via het platform en een geschikte betaalprovider lopen, niet via een eigen wallet op de gewone rekening van Thijs;
- garage en particulier regelen de overschrijving onderling;
- Thijs behandelt klachten;
- Thijs biedt via een gewone dealeridentiteit onder dezelfde regels, niet via beheerrechten;
- geen automatische verkoop aan nummer twee en geen automatische prijsverlaging na inspectie;
- de bestaande openbare huisstijl blijft behouden.

## 10. Open beslissingen en externe afhankelijkheden

### 10.1 Beslissingen die productie blokkeren

- hoogte, berekening en betalende partij van de behandelingskosten;
- btw-presentatie, moment waarop de vergoeding is verdiend en afhandeling bij annulering/refund;
- juridische werking van afspraak, inspectievoorstel en wederzijds koopakkoord;
- definitieve bied-, koop-, annulerings-, no-show- en geschilvoorwaarden;
- bewaartermijnen en verwijder-/anonimiseringsregels per gegevenscategorie;
- fiscale behandeling wanneer Thijs zelf koper is;
- DAC7-toepasselijkheid en eventuele identificatie-/rapportagevelden.

De kosten worden tot die tijd alleen als voorstel/testconfiguratie gebouwd. Een expliciete productie-instelling en goedgekeurde policyversie zijn een harde livegangvoorwaarde.

### 10.2 Externe afhankelijkheden

- betaalprovider die deze autotransacties, particuliere ontvangers, bedragen, fee-split en voorwaardelijke vrijgave schriftelijk accepteert;
- officiële provider-sandbox en later afzonderlijke productieacceptatie;
- juridische/fiscale beoordeling en definitieve voorwaarden;
- Supabase-, Vercel-, Resend-, domein/DNS- en Git-organisatie onder bedrijfsbeheer met MFA;
- definitieve bedrijfsidentiteit en rollen voor platform en Thijs als koper;
- onafhankelijke technische beveiligingscontrole;
- pilotgroep en operationele capaciteit voor klachten en betalingsincidenten.

### 10.3 Werkzaamheden die veilig kunnen doorgaan zonder deze externe besluiten

- bestaande testdekking uitbreiden;
- account- en objectscheiding verbeteren;
- verkopersdossier met fictieve data bouwen;
- exacte 24-uursdeadline, open biedhistorie, concurrency en winnaarreservering implementeren;
- regels- en feesnapshots met uitsluitend `test_only`-configuratie modelleren;
- afspraak-, inspectie- en dubbele akkoordworkflow met fictieve gegevens bouwen;
- provideradapter met mock en productieguard bouwen;
- webhook-, refund- en reconciliatietests schrijven voordat een concrete provider wordt aangesloten;
- visuele regressie- en browser-E2E-tests toevoegen;
- outbox-worker, audit, monitoringinterfaces en herstelprocedure voorbereiden.

## 11. Belangrijkste risico's voor de volgende fase

1. **Oude en nieuwe biedregels verwarren.** De huidige code en teksten zeggen besloten bieden. Deze mogen niet als bewijs voor het nieuwe zichtbare veilingmodel worden gepresenteerd.
2. **Te brede zichtbaarheid.** Open bedragen betekenen niet dat dealeridentiteit, verkopersgegevens of interne data openbaar mogen worden. Geef exact de noodzakelijke velden vrij.
3. **Racecondities en tijd.** De globale hoogste prijs, minimumstap, harde deadline en winnaar moeten onder dezelfde lock en met actuele databasetijd worden bepaald.
4. **Schijnzekerheid door bestaande tests.** De 94 database-tests zijn waardevol, maar testen het oude model. Nieuwe T-, S- en P-tests zijn verplicht.
5. **Rolconflict Thijs.** Beheerkennis en biedaccount moeten technisch en organisatorisch gescheiden blijven.
6. **Betalingsregulering.** Zelf geld ontvangen en doorstorten is geen acceptabel tijdelijk alternatief voor een geschikte betaalprovider.
7. **Onvolledige operationele keten.** Een betaalde of gewonnen status mag nooit automatisch koop, overdracht, vrijwaring of uitbetaling betekenen.
8. **Hosting en eigendom.** Zonder remote, bedrijfsaccounts, back-up en hersteltest is de lokale werkende app nog geen beheerste productieomgeving.

## 12. Aanbevolen eerste stap na fase 0

Begin met de gerichte uitbreiding van fase 1, niet met een herbouw: leg eerst in een nieuwe migratie de toekomstige policy-/regelsnapshots, verkopersdossiertoegang en strikte scheiding tussen beheerder en biedende dealer vast. Voeg daarbij negatieve database-tests toe. Laat de huidige openbare UI ongemoeid. Daarna kan fase 3 veilig de bestaande besloten biedfunctie vervangen door het vastgelegde zichtbare 24-uursmodel, zonder dat de huisstijl of publieke aanmeldroute opnieuw hoeft te worden gebouwd.
