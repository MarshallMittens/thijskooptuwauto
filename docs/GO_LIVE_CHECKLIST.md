# Livegangchecklist

Livegang blijft geblokkeerd totdat ieder verplicht punt aantoonbaar is afgerond. Een geslaagde build of lokale demonstratie is onvoldoende.

## Eigendom en accounts

- [ ] Domein en DNS staan onder bedrijfsbeheer met MFA.
- [ ] Privérepository staat onder bedrijfsbeheer met MFA en herstelcontacten.
- [ ] Afzonderlijke Supabase-projecten voor acceptatie en productie zijn ingericht.
- [ ] Vercel-team en project staan onder bedrijfsbeheer.
- [ ] Resend-account en afzenderdomein staan onder bedrijfsbeheer.
- [ ] Productiesleutels staan uitsluitend in platformvariabelen en zijn nooit gedeeld via chat of Git.

## Juridisch en commercieel

- [ ] Rol als inkoper, bemiddelaar of beide is vastgesteld en publiek uitgelegd.
- [ ] Moment van gebondenheid en geldigheidsduur/intrekking van biedingen zijn vastgesteld.
- [ ] Kosten, minimumregels en verkoopvoorwaarden zijn vastgesteld.
- [ ] Privacyverklaring, voorwaarden, bedrijfsgegevens en klachtenprocedure zijn beoordeeld.
- [ ] Bewaartermijn en verwijderactie per gegevenscategorie zijn vastgesteld.
- [ ] Verwerkersafspraken, regio’s en internationale doorgiften zijn beoordeeld.

## Beveiliging en toegang

- [ ] Minimaal twee gecontroleerde beheeraccounts hebben TOTP; herstelprocedure is beproefd.
- [ ] Productiebeheerder kan niet zonder `aal2` handelen.
- [ ] Pending en blocked dealers zijn via UI, API en database geweigerd.
- [ ] Dealers kunnen geen verkopersgegevens, interne notities of biedingen van anderen lezen.
- [ ] Private foto’s zijn alleen tijdelijk en gecontroleerd toegankelijk.
- [ ] Onafhankelijke beveiligingsreview van RLS, RPC’s, uploads en biedlogica is afgerond.
- [ ] Bevindingen met hoge of kritieke ernst zijn opgelost en hertest.
- [ ] Rate limits zijn tijdens de besloten proef met realistische belasting geëvalueerd.

## Gegevens en herstel

- [ ] Migraties zijn eerst op acceptatie toegepast en getest.
- [ ] Database-back-up en Storage-back-up zijn afzonderlijk ingericht.
- [ ] Volledige herstelproef in een geïsoleerde omgeving is geslaagd.
- [ ] Hersteltijd en maximaal gegevensverlies zijn gemeten en geaccepteerd.
- [ ] Verlopen tijdelijke uploads worden aantoonbaar en veilig opgeruimd.
- [ ] Verwijderverzoeken behandelen database- én Storage-objecten.

## Functionele proef

- [ ] Alle vijf proeven uit `docs/PILOT.md` zijn uitgevoerd met fictieve gegevens.
- [ ] Gelijktijdige en dubbele biedverzoeken zijn aantoonbaar getest.
- [ ] RDW-uitval laat handmatige invoer toe.
- [ ] E-mailuitval rolt aanvragen of biedingen niet terug.
- [ ] Materiële wijzigingen trekken oud aanbod en de oude ronde gecontroleerd in.
- [ ] Toegankelijkheid is met toetsenbord, schermlezer en mobiele viewport gecontroleerd.

## Technische vrijgave

- [ ] `npm ci` slaagt in een schone omgeving.
- [ ] Lint, typecontrole, unit-tests, database-tests en build slagen op de vrijgavecommit.
- [ ] Browser-E2E voor publiek, dealer en beheer slaagt tegen acceptatie.
- [ ] Geen echte persoonsgegevens of geheimen staan in Git, testfixtures of logs.
- [ ] Monitoring, incidentcontact en terugvalbesluit zijn vastgelegd.
- [ ] De ondernemer heeft na bovenstaande controles expliciet toestemming voor publicatie gegeven.
