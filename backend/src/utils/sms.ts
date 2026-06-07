// SMS sending utility.
// Uses Twilio when configured; otherwise logs the message to the server console
// so phone-OTP login can be tested locally without a paid SMS account.

const isPlaceholder = (v?: string) =>
  !v || v.startsWith('<<') || v.startsWith('your_');

const twilioConfigured =
  !isPlaceholder(process.env.TWILIO_ACCOUNT_SID) &&
  !isPlaceholder(process.env.TWILIO_AUTH_TOKEN) &&
  !isPlaceholder(process.env.TWILIO_PHONE_NUMBER);

// Lazily created Twilio client (only when configured).
let twilioClient: any = null;
if (twilioConfigured) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[SMS] Twilio configured — real SMS will be sent.');
  } catch (err) {
    console.error('[SMS] Twilio package not available, falling back to console:', err);
  }
} else {
  console.log('[SMS] Not configured — OTPs will be printed to the server console.');
}

/**
 * Send an SMS to a phone number in E.164 format (e.g. +919876543210).
 * Never throws — failures are logged so the auth flow continues.
 */
export const sendSMS = async (to: string, body: string): Promise<void> => {
  if (!twilioClient) {
    console.log(`\n[SMS - NOT SENT] To: ${to}\n${body}\n`);
    return;
  }
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body,
    });
    console.log(`[SMS] Sent to ${to}`);
  } catch (err) {
    console.error(`[SMS] FAILED to send to ${to}:`, err);
  }
};

/**
 * Normalize an Indian phone number to its last 10 digits for matching,
 * ignoring spaces, dashes, +91 / 0 prefixes, etc.
 */
export const normalizePhone = (raw?: string): string =>
  (raw || '').replace(/\D/g, '').slice(-10);

/** Convert a 10-digit Indian number to E.164 (+91...) for sending. */
export const toE164India = (raw?: string): string => {
  const ten = normalizePhone(raw);
  return ten.length === 10 ? `+91${ten}` : (raw || '');
};
