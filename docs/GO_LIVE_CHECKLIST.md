# Livegangchecklist

> Fase 7 blijft open. Zie [PHASE7.md](PHASE7.md) voor de actuele 24-uurs veiling, betaalprovider, onafhankelijke review en gebruikersproef. De oude formulering over besloten biedingen hieronder is historisch en mag niet als vrijgavecriterium gelden.

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
- [ ] Dealers kunnen geen verkopersgegevens, interne notities of identiteit van andere biedende bedrijven lezen; geautoriseerde biedbedragen en tijdstippen zijn voor alle goedgekeurde dealers gelijk zichtbaar.
- [ ] Private foto’s zijn alleen tijdelijk en gecontroleerd toegankelijk.
- [ ] Onafhankelijke beveiligingsreview van RLS, RPC’s, uploads en biedlogica is afgerond.
- [ ] Een externe reviewer heeft de betalingstransities, klachtbewijsautorisatie en eigen biedregels van Thijs onafhankelijk gecontroleerd.
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

- [ ] De actuele fase-7-proef uit `docs/PHASE7.md` is met vijf tot tien garages, een verkoper en beheer uitgevoerd en vastgelegd.
- [ ] De provider heeft de specifieke auto-/particulier-/garagegeldstroom schriftelijk aanvaard en de echte sandboxscenario's zijn geslaagd.
- [ ] Tarief, betalende partij, btw en contractvoorwaarden zijn expliciet vastgesteld en de productieconfiguratie bevat geen testwaarden.
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
