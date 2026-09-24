# Eerste Vercel Preview

Dit draaiboek richt uitsluitend een afgeschermde acceptatieomgeving met fictieve gegevens in. Het is geen productievrijgave. Maak of koppel geen externe resource zonder toestemming van de eigenaar.

## Veiligheidsgrenzen

- Gebruik een afzonderlijk Supabase-project voor acceptatie; verbind nooit de lokale of latere productiedatabase.
- Gebruik alleen fictieve personen, bedrijven, kentekens en foto's.
- Laat `PAYMENT_SIMULATOR_ENABLED=false`, `OUTBOX_DELIVERY_ENABLED=false` en `PRODUCTION_DEPLOYMENT_APPROVED=false`.
- Plaats sleutels uitsluitend rechtstreeks in Supabase/Vercel en in een eigen wachtwoordmanager; nooit in Git, documentatie of chat.
- De eerste deployment is een Vercel **Preview**, niet Production.
- Scherm de Preview via Vercel Deployment Protection of een gelijkwaardige toegangslaag af voordat externe testers worden uitgenodigd.

## 1. Lokale vrijgavecontrole

Voer vanaf een schone checkout uit:

```powershell
npm ci
npm run check
npm run test:db
```

Met draaiende lokale Supabase en website:

```powershell
npm run test:e2e
npm run test:e2e:acceptance
```

Leg commit-ID en uitkomsten vast. Een groene build alleen is onvoldoende.

## 2. Acceptatie-Supabase

1. Maak onder het bedrijfsaccount één nieuw testproject in een passende Europese regio.
2. Koppel de lokale Supabase CLI pas na expliciete toestemming.
3. Pas alle migraties uit `supabase/migrations` in volgorde toe.
4. Gebruik geen lokale seed met echte of hergebruikte accounts.
5. Maak één fictieve beheeridentiteit, voeg gecontroleerd het staff-lidmaatschap toe en activeer TOTP.
6. Stel bij Supabase Auth de vaste Vercel-branch-URL als Site URL in en voeg exact `https://<vaste-preview-origin>/auth/callback` toe als toegestane redirect.
7. Controleer dat de fotobucket privé is en dat directe object-URL's worden geweigerd.

## 3. Vercel Preview-variabelen

Voer deze waarden rechtstreeks in bij de **Preview** environment. Gebruik voor elk geheim een afzonderlijke willekeurige waarde.

```text
APP_URL=https://<vaste-preview-origin>
NEXT_PUBLIC_SUPABASE_URL=https://<acceptatieproject>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<acceptatie-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<acceptatie-service-role-key>
DRAFT_TOKEN_SECRET=<minimaal-32-willekeurige-tekens>
REQUEST_FINGERPRINT_SECRET=<andere-minimaal-32-willekeurige-tekens>
OPERATIONS_JOB_SECRET=<weer-andere-minimaal-32-willekeurige-tekens>
PAYMENT_SIMULATOR_ENABLED=false
OUTBOX_DELIVERY_ENABLED=false
PRODUCTION_DEPLOYMENT_APPROVED=false
```

`RDW_APP_TOKEN`, `RESEND_API_KEY` en `RESEND_FROM_EMAIL` blijven voor de eerste technische rookproef leeg. De openbare RDW-terugval en duurzame outbox kunnen wel worden getest, maar er wordt nog geen echte e-mail bezorgd.

De build stopt bewust bij ontbrekende waarden, voorbeeldwaarden, localhost, hergebruikte geheimen, een actieve betaalsimulator of een ongeautoriseerde productiedeployment.

## 4. Preview maken

1. Maak een privérepository onder bedrijfsbeheer en push uitsluitend de gecontroleerde releasecommit.
2. Importeer die privérepository in Vercel.
3. Selecteer Node.js 22.x en het standaard Next.js buildcommando.
4. Stel alle variabelen uitsluitend voor Preview in.
5. Maak vanaf een niet-productiebranch één Preview Deployment.
6. Noteer de vaste branch-URL en pas `APP_URL` plus de Supabase Auth-URL's aan wanneer die nog niet exact overeenkomen; redeploy daarna.

Publiceer niet met `vercel --prod` en koppel nog geen publiek bedrijfsdomein.

## 5. Controle na deployment

Open zonder geheim:

```text
https://<preview-origin>/api/health
```

De enige inhoud hoort `{"status":"ok"}` te zijn. De diepere databasecontrole vereist bewust `OPERATIONS_JOB_SECRET` in de Authorization-header en hoort nooit via een browserlink of screenshot gedeeld te worden.

Voer daarna lokaal de niet-schrijvende browserproef uit:

```powershell
$env:E2E_BASE_URL = "https://<preview-origin>"
npm run test:e2e:preview
Remove-Item Env:E2E_BASE_URL
```

Controleer vervolgens handmatig:

- publieke pagina's op desktop en mobiel;
- registratie en e-mailverificatie met uitsluitend fictieve adressen;
- pending dealer krijgt geen aanbod;
- beheer zonder TOTP kan geen gevoelige actie uitvoeren;
- goedgekeurde dealer ziet geen verkopersgegevens;
- directe Storage-object-URL wordt geweigerd;
- `robots.txt` en pagina's onder `/dealer`, `/beheer` en verkopersroutes worden niet als beveiligingsmiddel gebruikt: toegang blijft server- en databasegestuurd.

## Stopcriteria

Stop de proef en trek de Preview-toegang in bij persoonsgegevens in logs, een RLS-lek, een werkende betaalsimulator, een onverwachte echte e-mail, ontbrekende MFA-controle of toegang van een pending/geblokkeerde dealer. Bewaar het deployment-ID en de foutmelding, maar geen tokens of volledige formulierinhoud.
