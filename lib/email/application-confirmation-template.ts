import { formatRegistration } from "../applications/schema";

export type ApplicationConfirmationDetails = {
  fullName: string;
  reference: string;
  vehicle: {
    registration: string;
    make: string | null;
    model: string | null;
    variant: string | null;
    year: number | null;
    fuelType: string | null;
    color: string | null;
  };
  mileageKm: number | null;
  keyCount: number | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function buildApplicationConfirmationEmail(details: ApplicationConfirmationDetails, appUrl: string) {
  const { vehicle } = details;
  const registration = formatRegistration(vehicle.registration);
  const bannerUrl = new URL("/emails/bedankt-autoaanmelding.png", appUrl).toString();
  const rows: [string, string][] = [
    ["Merk", vehicle.make ?? ""],
    ["Model", vehicle.model ?? ""],
    ["Uitvoering", vehicle.variant ?? ""],
    ["Bouwjaar", vehicle.year === null ? "" : String(vehicle.year)],
    ["Brandstof", vehicle.fuelType ?? ""],
    ["Kleur", vehicle.color ?? ""],
    ["Kilometerstand", details.mileageKm === null ? "" : `${details.mileageKm.toLocaleString("nl-NL")} km`],
    ["Aantal sleutels", details.keyCount === null ? "" : String(details.keyCount)],
  ].filter((row): row is [string, string] => Boolean(row[1].trim()));

  const subject = `Bedankt voor je autoaanmelding – ${registration}`;
  const text = [
    "Bedankt voor je autoaanmelding!",
    `Beste ${details.fullName},`,
    "We hebben je gegevens en foto’s goed ontvangen. Ik bekijk je aanmelding en neem persoonlijk contact met je op zodra er nieuws is over je auto. Je hoeft niets meer te bevestigen.",
    `Kenteken: ${registration}`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "Klopt er iets niet? Reageer op deze e-mail en vermeld je kenteken. Dan kijken we er samen naar.",
    "Je aanmelding is gratis en vrijblijvend. Een aanmelding garandeert geen bod of verkoop.",
    "Met vriendelijke groet,",
    "Thijs Bongers",
    "Thijs koopt uw auto",
    "0314-642419",
    "info@thijskooptuwauto.nl",
    `Aanvraagnummer: ${details.reference}`,
  ].join("\n\n");

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#f8f6f2;font-family:Arial,Helvetica,sans-serif;color:#111111;-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Je gegevens en foto’s zijn ontvangen. Je auto met kenteken ${escapeHtml(registration)} is aangemeld.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <tr><td><img src="${escapeHtml(bannerUrl)}" width="640" alt="Thijs koopt uw auto — Bedankt voor je autoaanmelding! We hebben je gegevens en foto’s ontvangen." style="display:block;width:100%;max-width:640px;height:auto;border:0;border-radius:16px 16px 0 0"></td></tr>
      <tr><td style="padding:24px;font-size:16px;line-height:1.7">
        <p style="margin:0 0 16px">Beste ${escapeHtml(details.fullName)},</p>
        <p style="margin:0 0 16px">We hebben je gegevens en foto’s goed ontvangen. Ik bekijk je aanmelding en neem persoonlijk contact met je op zodra er nieuws is over je auto.</p>
        <p style="margin:0 0 24px">Je hoeft niets meer te bevestigen.</p>
        <h2 style="margin:0 0 12px;font-size:20px;line-height:1.3">Jouw aangemelde auto</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:2px solid #111111;border-radius:8px;background-color:#f9cf00"><tr>
          <td style="padding:8px;background-color:#003f8f;border-radius:5px 0 0 5px;color:#ffffff;font-size:13px;font-weight:bold;text-align:center">NL</td>
          <td style="padding:4px 16px;color:#111111;font-family:'Arial Black',Arial,sans-serif;font-size:28px;font-weight:900;letter-spacing:2px;line-height:1.5;white-space:nowrap">${escapeHtml(registration)}</td>
        </tr></table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.6"><caption style="text-align:left;padding-bottom:8px;font-weight:bold">Overzicht van je autogegevens</caption><tbody>
          ${rows.map(([label, value]) => `<tr><th scope="row" align="left" valign="top" style="width:42%;padding:10px 12px 10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:normal">${escapeHtml(label)}</th><td valign="top" style="padding:10px 0;border-bottom:1px solid #e2e8f0;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}
        </tbody></table>
        <p style="margin:24px 0 16px">Klopt er iets niet? Reageer op deze e-mail en vermeld je kenteken. Dan kijken we er samen naar.</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px">Je aanmelding is gratis en vrijblijvend. Een aanmelding garandeert geen bod of verkoop.</p>
        <p style="margin:0 0 8px">Met vriendelijke groet,</p>
        <p style="margin:0;font-size:22px;font-weight:bold;color:#a64b00">Thijs Bongers</p>
        <p style="margin:0 0 12px;font-weight:bold">Thijs koopt uw auto</p>
        <p style="margin:0;font-size:14px;line-height:1.8"><a href="tel:+31314642419" style="color:#a64b00;text-decoration:none">0314-642419</a><br><a href="mailto:info@thijskooptuwauto.nl" style="color:#a64b00;text-decoration:none">info@thijskooptuwauto.nl</a></p>
        <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;overflow-wrap:anywhere">Aanvraagnummer: ${escapeHtml(details.reference)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  return { subject, html, text };
}
