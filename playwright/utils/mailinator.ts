/**
 * Polls the Mailinator public API for a MoniNotes verification/MFA code.
 * Ported from ../../maestro/web/scripts/{snapshot-inbox,get-mfa-code}.js so both
 * automation stacks share the same polling/filtering behavior against the same
 * rate-limited public inbox.
 */

interface MailinatorMessage {
  id: string;
  subject?: string;
  time: number;
}

function inboxNameFor(email: string): string {
  return email.split('@')[0];
}

/**
 * Snapshot the message ids already in the inbox before triggering a new
 * login/signup, so a later poll can ignore stale codes from earlier runs.
 * Mailinator's public API has no delete endpoint, so this is the only way
 * to avoid picking up an old message.
 */
export async function snapshotInboxIds(email: string): Promise<Set<string>> {
  try {
    const inbox = inboxNameFor(email);
    const res = await fetch(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`);
    const body = (await res.json()) as { msgs?: MailinatorMessage[] };
    return new Set((body.msgs ?? []).map((m) => m.id));
  } catch {
    // Falls back to accepting any matching message - the subject filter below
    // already guards against grabbing the wrong email.
    return new Set();
  }
}

export interface WaitForCodeOptions {
  /** Regex the email subject must match, e.g. /verification code/i. */
  subjectPattern: RegExp;
  /** Ids to ignore, from a prior snapshotInboxIds() call. */
  knownIds?: Set<string>;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Polls Mailinator until a 6-digit code arrives in an email matching
 * `subjectPattern`, or throws after `timeoutMs`.
 */
export async function waitForVerificationCode(
  email: string,
  options: WaitForCodeOptions
): Promise<string> {
  // Mailinator's public API rate-limits aggressive polling (HTTP 429 /
  // Cloudflare error 1015, confirmed 2026-09-15) - 15s matches the interval
  // already proven out by ../../maestro/web/scripts/get-mfa-code.js against
  // this same shared inbox tier.
  const { subjectPattern, knownIds = new Set(), timeoutMs = 90_000, pollIntervalMs = 15_000 } =
    options;
  const inbox = inboxNameFor(email);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const listRes = await fetch(
        `https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`
      );
      const listBody = (await listRes.json()) as { msgs?: MailinatorMessage[] };
      const candidates = (listBody.msgs ?? [])
        .filter((m) => subjectPattern.test(m.subject ?? '') && !knownIds.has(m.id))
        .sort((a, b) => b.time - a.time);

      const latest = candidates[0];
      if (latest) {
        const msgRes = await fetch(
          `https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}/messages/${latest.id}`
        );
        const msgBody = (await msgRes.json()) as { parts?: { body?: string }[] };
        const text = msgBody.parts?.[0]?.body ?? '';
        const match = text.match(/\b\d{6}\b/);
        if (match) return match[0];
      }
    } catch {
      // Transient network hiccup or a rate-limited/non-JSON response - keep polling.
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`No verification code found in ${email} inbox within ${timeoutMs}ms`);
}
