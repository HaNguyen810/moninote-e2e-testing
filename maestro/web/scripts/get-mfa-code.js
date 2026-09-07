// Maestro's JS engine has no sleep/async primitive, so polling uses a real-time
// busy-wait between Mailinator API calls instead of setTimeout.
function busyWait(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

const inbox = INBOX_EMAIL.split('@')[0];
const deadline = Date.now() + 90000;
// Set by snapshot-inbox.js beforehand, if the flow runs it - excludes messages
// that already existed before this login attempt, so a stale code from an
// earlier run can never be picked up. Optional: falls back to no exclusions.
const knownIds = new Set((typeof KNOWN_MESSAGE_IDS !== 'undefined' && KNOWN_MESSAGE_IDS ? KNOWN_MESSAGE_IDS.split(',') : []));
let code = null;

while (!code && Date.now() < deadline) {
  try {
    const listResp = http.get(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`);
    const messages = json(listResp.body).msgs || [];
    // A fresh signup account can receive other emails first (account confirmation,
    // failed-login notices) - filter to the actual code email, not just "latest",
    // or a false match against a stray 6-digit sequence elsewhere sends a wrong code.
    const codeEmails = messages.filter(
      (m) => /verification code/i.test(m.subject || '') && !knownIds.has(m.id)
    );
    const latest = codeEmails.sort((a, b) => b.time - a.time)[0];

    if (latest) {
      const msgResp = http.get(
        `https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}/messages/${latest.id}`
      );
      // Match against the plain-text body part specifically, not the raw response
      // (which includes headers/DKIM blobs that can contain stray 6-digit sequences).
      const parts = json(msgResp.body).parts || [];
      const text = (parts[0] && parts[0].body) || '';
      const match = text.match(/\b\d{6}\b/);
      if (match) code = match[0];
    }
  } catch (e) {
    // Transient network hiccup or a non-JSON response from a rate-limited/cold
    // request - keep polling rather than aborting the whole script.
  }

  if (!code) busyWait(15000);
}

if (!code) {
  throw new Error(`No MFA code found in ${INBOX_EMAIL} inbox within 90s`);
}

output.code = code;
