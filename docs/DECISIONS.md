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

## Veilige tijdelijke keuzes

- npm is de enige package manager.
- De eerste uploadversie accepteert JPEG, PNG en WebP, maximaal 12 bestanden van 10 MB.
- KvK-controle is handmatig; er wordt geen extra commerciële API toegevoegd.
- Er is geen realtime veilinginterface; verversen van eigen status is voldoende voor versie 1.
- `@supabase/ssr` blijft achter de adapter in `lib/supabase` zodat een toekomstige API-wijziging lokaal blijft.

## Open vóór livegang

- Juridische rol: inkoper, bemiddelaar of beide.
- Moment van gebondenheid, geldigheidsduur en intrekking van biedingen.
- Eventuele kosten, minimale bieding en minimumverhoging.
- Bewaartermijnen en verwijderprocedure per gegevenscategorie.
- Definitieve bedrijfs-, contact-, privacy- en voorwaardeninhoud.
- Productiebeheerder(s), MFA-herstelprocedure en functiescheiding.
- Bedrijfsdomein, e-mailafzenders en EU-regio’s voor Supabase en Vercel.
