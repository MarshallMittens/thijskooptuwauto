# Fase 5 — lokale betalingssandbox

## Wat werkelijk werkt

De applicatie heeft een providerneutraal betaalmodel en een lokale simulator. Hiermee kunnen statusovergangen, ondertekende webhooks, gedeeltelijke/mislukte betalingen, overdracht, vrijgave, uitbetaling, geschillen, refunds en reconciliatie met fictieve bedragen worden getest.

De simulator verplaatst geen geld, controleert geen identiteit of IBAN en is geen goedkeuring door een betaalprovider. Alle schermen en records tonen `simulated/test`. De database zet de simulator standaard uit en de server weigert hem in productie.

## Lokale instelling

Zet alleen in `.env.local`:

```text
PAYMENT_SIMULATOR_ENABLED=true
PAYMENT_SIMULATOR_WEBHOOK_SECRET=<zelf lokaal gegenereerd geheim van minimaal 32 tekens>
```

Plaats het geheim nooit in chat, Git of screenshots. Herstart `npm run dev` na een wijziging van `.env.local`. Open daarna als beheerder met MFA een aanvraagdossier en kies **Lokale simulator activeren**.

## Testvolgorde

1. Dealer en verkoper bevestigen in fase 4 hetzelfde koopconcept.
2. Beheer activeert de lokale simulator.
3. Verkoper start en voltooit de duidelijk fictieve onboarding onder `/mijn-aanvraag`.
4. De winnaar maakt onder `/dealer/betalingen` een testcheckout.
5. De winnaar simuleert volledig ontvangen, gedeeltelijk, mislukt of verlopen.
6. Bij volledig ontvangen bevestigen verkoper en dealer ieder de overdracht.
7. Beheer verifieert testmatig de vrijwaring, vraagt vrijgave aan en simuleert provideracceptatie en uitbetaling.
8. Beheer kan een geschil en volledige testrefund doorlopen.
9. Beheer voert reconciliatie uit; nul verschillen is de normale uitkomst.

Een terugkeer naar `/betalingen/terug` verandert nooit de status. Alleen de gecontroleerde webhookverwerking kan dat.

## Productieblokkades

- Geen provider gekozen of gecontracteerd.
- Geen officiële onboarding, checkout of webhook aangesloten.
- Hoogte en betalende partij van de vergoeding zijn niet vastgesteld; de simulator gebruikt daarom €0 en `test_unconfigured`.
- Voorwaarden en juridisch bindingsmoment zijn niet goedgekeurd.
- Holding, vrijgave, uitbetaling, refunds en geschillen zijn niet schriftelijk door een provider bevestigd.
- Officiële sandbox-, browser-E2E-, beveiligings- en hersteltests ontbreken nog.
