# Privacyregister — technisch concept

Dit document is een technische inventarisatie en geen juridisch advies. Grondslagen, bewaartermijnen, rechtenprocedure en definitieve teksten moeten vóór livegang door Thijskooptuauto en een juridisch deskundige worden vastgesteld.

## Gegevensstromen

| Categorie | Voorlopig doel | Ontvangers/verwerkers | Dealer zichtbaar |
|---|---|---|---:|
| Naam, e-mail, telefoon, postcode en gewenste verkoopdatum | Aanvraag beoordelen, contact en afhandeling | Supabase; Vercel tijdens serververwerking; Resend voor noodzakelijke e-mail | Nee |
| Kenteken en voertuiggegevens | Voertuig identificeren, controleren en aanbieden | Supabase, Vercel en RDW Open Data | Ja, na gecontroleerde publicatie |
| Staat, schade, onderhoud en opmerkingen | Beoordeling en besloten aanbod | Supabase en Vercel | Ja, als onderdeel van de gepubliceerde revisie |
| Voertuigfoto’s | Beoordeling en presentatie | Private Supabase Storage en Vercel | Alleen goedgekeurde foto’s via tijdelijke toegang |
| Bedrijfs- en accountgegevens dealers | Toegang, goedkeuring en communicatie | Supabase Auth/database en Vercel | Alleen het eigen bedrijf |
| Biedingen | Besloten biedproces en herleidbaarheid | Supabase en Vercel | Alleen biedingen van het eigen bedrijf |
| Contactmomenten, akkoord en interne notities | Dossier en gecontroleerde afhandeling | Supabase en Vercel | Nee |
| Auditgegevens | Beveiliging en herleidbaarheid van beheerhandelingen | Supabase | Nee |
| Gehashte technische identifiers | Spam- en misbruikbeperking | Supabase en Vercel | Nee |

## Dataminimalisatie

- Verkopersgegevens staan buiten de voertuigmomentopname voor dealers.
- Productmetingen bevatten geen kenteken, contactgegevens of vrije tekst.
- Auditregels kopiëren geen volledige contactnotities.
- Foto’s blijven privé en vereisen expliciete controle op zichtbare persoonsgegevens.
- Marketingtoestemming maakt geen deel uit van de autoaanmelding en is niet geïmplementeerd.

## Verwijdering en bewaring

Nog vast te stellen termijnen: onafgeronde concepten, afgewezen aanvragen, voertuigfoto’s, dealeraccounts, biedingen, transactiedossiers, contactmomenten en auditlog. Bij het ontwerp van verwijdering moet rekening worden gehouden met wettelijke bewaarplichten en de noodzaak biedingen niet stilzwijgend te wijzigen.

Een verwijderverzoek vereist daarom een gecontroleerde procedure die per categorie bepaalt of gegevens worden verwijderd, geanonimiseerd of vanwege een aantoonbare bewaarplicht tijdelijk worden behouden. Databasegegevens en Storage-objecten moeten afzonderlijk worden behandeld.

## Voor livegang te bevestigen

- Verwerkingsverantwoordelijke, contactgegevens en privacycontact.
- Grondslag per doel en eventuele gerechtvaardigde-belangenafweging.
- Bewaartermijn en verwijderactie per gegevenscategorie.
- Verwerkersovereenkomsten, regio’s en internationale doorgiften.
- Procedure voor inzage, correctie, verwijdering, bezwaar en klachten.
- Datalekprocedure en verantwoordelijke personen.
