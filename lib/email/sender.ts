export const DEFAULT_EMAIL_SENDER = "Thijskooptuwauto <info@thijskooptuwauto.nl>";

export function getEmailSender() {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_EMAIL_SENDER;
}
