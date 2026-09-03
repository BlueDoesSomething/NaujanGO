// Simple redaction and flagging helpers for chatbot messages
const EMAIL_RE = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})/g;
const PHONE_RE = /(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?|\d{2,4}[\s-])?\d{3,4}[\s-]?\d{3,4}/g;
const PROFANITY = [ 'fuck', 'shit', 'bitch', 'damn', 'asshole' ];

function redactPII(text) {
  if (!text) return text;
  let out = text;
  out = out.replace(EMAIL_RE, '[REDACTED_EMAIL]');
  out = out.replace(PHONE_RE, '[REDACTED_PHONE]');
  return out;
}

function detectFlags(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const flags = [];

  for (const p of PROFANITY) {
    if (lower.includes(p)) flags.push('profanity');
  }

  if (EMAIL_RE.test(text)) flags.push('contains_email');
  // reset lastIndex for global regex reuse
  EMAIL_RE.lastIndex = 0;
  if (PHONE_RE.test(text)) flags.push('contains_phone');
  PHONE_RE.lastIndex = 0;

  if (flags.length === 0) return null;
  return flags.join(',');
}

export { redactPII, detectFlags };
