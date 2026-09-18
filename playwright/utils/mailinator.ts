/**
 * Poll Mailinator public API de lay code verification/MFA cua MoniNotes.
 * Chuyen tu script snapshot-inbox/get-mfa-code cua Maestro web (da xoa),
 * giu nguyen logic poll/filter tren cung 1 inbox public bi rate limit.
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
 * Chup lai id cac message dang co trong inbox truoc khi trigger login/signup
 * moi, de lan poll sau bo qua code cu tu lan chay truoc. Mailinator public
 * API khong co endpoint xoa, nen day la cach duy nhat tranh lay nham message cu.
 */
export async function snapshotInboxIds(email: string): Promise<Set<string>> {
  try {
    const inbox = inboxNameFor(email);
    const res = await fetch(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`);
    const body = (await res.json()) as { msgs?: MailinatorMessage[] };
    return new Set((body.msgs ?? []).map((m) => m.id));
  } catch {
    // Fallback: chap nhan bat ky message nao match - filter subject ben duoi
    // da guard san viec lay nham email khac.
    return new Set();
  }
}

export interface WaitForCodeOptions {
  /** Regex ma subject email phai match, vd /verification code/i. */
  subjectPattern: RegExp;
  /** Cac id can bo qua, lay tu snapshotInboxIds() truoc do. */
  knownIds?: Set<string>;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Poll Mailinator cho toi khi co code 6 so trong email match voi
 * `subjectPattern`, hoac throw sau `timeoutMs`.
 */
export async function waitForVerificationCode(
  email: string,
  options: WaitForCodeOptions
): Promise<string> {
  // Mailinator public API se rate-limit neu poll qua nhanh (HTTP 429 /
  // Cloudflare error 1015, confirm 2026-09-15) - 15s la interval da proven
  // qua o script get-mfa-code.js cua Maestro (da xoa) tren cung 1 tier inbox nay.
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
      // Loi mang tam thoi hoac response bi rate-limit/khong phai JSON - cu poll tiep.
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`No verification code found in ${email} inbox within ${timeoutMs}ms`);
}
