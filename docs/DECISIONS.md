# Ontwerpkeuzes en open punten

## Vastgelegde keuzes

1. **Eén Next.js-applicatie.** Geen microservices; publieke website, dealerportaal en beheer delen één codebasis.
2. **Vercel-compatibele Next.js-basis.** Cloudflare Workers, Vinext, D1 en R2 zijn uit de actieve code verwijderd.
3. **Supabase als gegevensplatform.** PostgreSQL, Auth en private Storage; SQL-migraties zijn leidend.
4. **Geen extra ORM.** De Supabase-client en gegenereerde databasetypen voorkomen een tweede schemasysteem.
5. **Server én database controleren toegang.** De DAL bewaakt routes; grants, RLS en databasefuncties blijven de definitieve grens.
6. **Handmatige bedrijfsgoedkeuring.** Een registratie is altijd `pending`; alleen een admin met MFA kan goedkeuren of blokkeren.
7. **Beheer-MFA via TOTP.** Geen betaalde sms-afhankelijkheid.
8. **Append-only biedingen en auditlog.** Wijzigen of verwijderen wordt geen normale applicatiefunctie.
9. **UTC in opslag, Europe/Amsterdam in presentatie.** Geldbedragen worden gehele eurocenten.
10. **Foutbestendige e-mail.** Domeinhandelingen worden opgeslagen vóór een e-mailpoging; notificaties krijgen een duurzame outbox.
11. **Directe private foto-upload.** De browser uploadt met kort geldige Supabase-machtigingen zodat grote foto’s niet door één Vercel-request hoeven. De server vertrouwt de browserbewerking niet en inspecteert en hercodeert elk bestand vóór afronding.
12. **RDW aan de serverzijde.** Het kenteken gaat via een POST-route naar de officiële RDW-dataset `m9d7-ebf2`; de server herhaalt de controle bij definitieve opslag. Uitval blokkeert handmatige invoer niet.
13. **Geen externe analysetracker.** Alleen start en afronding worden intern als inhoudsloze gebeurtenis geteld.
14. **Tijdelijke en definitieve fotopaden zijn gescheiden.** Een browsermachtiging kan uitsluitend onder `temporary/` schrijven; na inhoudscontrole schrijft de server een hashgebonden bestand onder `applications/` en verwijdert het tijdelijke object zo mogelijk.
15. **Concepttoken is een capability.** Het token wordt server-side met een geheim afgeleid van de willekeurige idempotentiesleutel, alleen aan de browser getoond en uitsluitend gehasht opgeslagen. Daardoor geven gelijktijdige retries hetzelfde token en verbreekt een IP-wijziging de aanvraag niet; het IP-HMAC dient alleen voor misbruiklimieten.
16. **Biedingen via één PostgreSQL-functie.** De functie vergrendelt de biedronde, gebruikt `now()` van de database, bepaalt het bedrijf uit de sessie, controleert publicatie en deadline en schrijft bod, auditlog en outbox in dezelfde transactie.
17. **Geen zichtbaar hoogste bod.** Dealers zien alleen biedingen van het eigen bedrijf. Beheer ziet alle biedingen, maar er vindt geen automatische gunning plaats.

## Veilige tijdelijke keuzes

- npm is de enige package manager.
- De eerste uploadversie accepteert JPEG, PNG en WebP, maximaal 12 bestanden van 10 MB.
- KvK-controle is handmatig; er wordt geen extra commerciële API toegevoegd.
- Er is geen realtime veilinginterface; verversen van eigen status is voldoende voor versie 1.
- Zolang commerciële regels ontbreken geldt technisch alleen: een bod is positief, maximaal €100.000.000 en moet hoger zijn dan het vorige bod van hetzelfde bedrijf. Dit maximum is een veiligheidsgrens, geen commerciële afspraak.
- `@supabase/ssr` blijft achter de adapter in `lib/supabase` zodat een toekomstige API-wijziging lokaal blijft.
- `APP_URL` is server-only en verplicht buiten development/test; er is in productie geen stille localhost-terugval voor bevestigingslinks.

## Open vóór livegang

- Juridische rol: inkoper, bemiddelaar of beide.
- Moment van gebondenheid, geldigheidsduur en intrekking van biedingen.
- Eventuele kosten, minimale bieding en minimumverhoging.
- Bewaartermijnen en verwijderprocedure per gegevenscategorie.
- Definitieve bedrijfs-, contact-, privacy- en voorwaardeninhoud.
- Productiebeheerder(s), MFA-herstelprocedure en functiescheiding.
- Bedrijfsdomein, e-mailafzenders en EU-regio’s voor Supabase en Vercel.
