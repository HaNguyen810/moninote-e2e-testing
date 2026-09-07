// Mailinator's public API has no delete endpoint (DELETE on a public inbox
// returns 401 - that needs a paid API key we don't have), so there's no way to
// actually clear old messages. Instead, snapshot the IDs of whatever's already
// in the inbox before triggering a new login, so get-mfa-code.js can ignore
// them afterward and only ever act on a genuinely new message.
const inbox = INBOX_EMAIL.split('@')[0];
let ids = [];

try {
  const listResp = http.get(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`);
  const messages = json(listResp.body).msgs || [];
  ids = messages.map((m) => m.id);
} catch (e) {
  // If this fails, get-mfa-code.js just falls back to accepting any matching
  // message - the subject filter already guards against grabbing the wrong email.
}

output.knownMessageIds = ids.join(',');
