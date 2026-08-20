// Maestro's JS engine has no sleep/async primitive, so polling uses a real-time
// busy-wait between Mailinator API calls instead of setTimeout.
function busyWait(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

const inbox = INBOX_EMAIL.split('@')[0];
const deadline = Date.now() + 90000;
let link = null;

while (!link && Date.now() < deadline) {
  try {
    const listResp = http.get(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`);
    const messages = json(listResp.body).msgs || [];
    const latest = messages.sort((a, b) => b.time - a.time)[0];

    if (latest) {
      const msgResp = http.get(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}/messages/${latest.id}`);
      const message = json(msgResp.body);
      const textPart = (message.parts || []).find((p) => (p.headers['content-type'] || '').indexOf('text/plain') === 0);

      if (textPart) {
        const match = textPart.body.match(/https:\/\/\S+type=CONFRIM_EMAIL/);
        if (match) link = match[0];
      }
    }
  } catch (e) {
    // Transient Mailinator API hiccup (empty/truncated response) - retry.
  }

  if (!link) busyWait(5000);
}

if (!link) {
  throw new Error(`No confirmation link found in ${INBOX_EMAIL} inbox within 90s`);
}

output.link = link;
