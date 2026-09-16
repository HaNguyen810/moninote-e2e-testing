# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notes/upload-attachment.spec.ts >> JPEG image survives paste-upload and a reload (Personal)
- Location: playwright/tests/notes/upload-attachment.spec.ts:33:3

# Error details

```
Error: No verification code found in moninotes-signintest-mfa@mailinator.com inbox within 90000ms
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]: Privacy comes first.
  - generic [ref=e25]:
    - generic [ref=e26]: Two factor authentication
    - generic [ref=e27]: We sent a 6-digit code to mo********************fa@mailinator.com
    - generic [ref=e28]:
      - generic [ref=e29]:
        - text: Enter 6 digit code
        - generic [ref=e30]: It may take a minute to receive your code.
      - generic [ref=e31]:
        - textbox "Enter 6 digit code It may take a minute to receive your code." [active] [ref=e32]
        - button "Resend code" [ref=e34] [cursor=pointer]
    - generic [ref=e36]:
      - button "Back" [ref=e37] [cursor=pointer]
      - button "Submit" [ref=e38] [cursor=pointer]
    - button "Don't have access to your email address?" [ref=e39] [cursor=pointer]
```

# Test source

```ts
  1  | /**
  2  |  * Polls the Mailinator public API for a MoniNotes verification/MFA code.
  3  |  * Ported from ../../maestro/web/scripts/{snapshot-inbox,get-mfa-code}.js so both
  4  |  * automation stacks share the same polling/filtering behavior against the same
  5  |  * rate-limited public inbox.
  6  |  */
  7  | 
  8  | interface MailinatorMessage {
  9  |   id: string;
  10 |   subject?: string;
  11 |   time: number;
  12 | }
  13 | 
  14 | function inboxNameFor(email: string): string {
  15 |   return email.split('@')[0];
  16 | }
  17 | 
  18 | /**
  19 |  * Snapshot the message ids already in the inbox before triggering a new
  20 |  * login/signup, so a later poll can ignore stale codes from earlier runs.
  21 |  * Mailinator's public API has no delete endpoint, so this is the only way
  22 |  * to avoid picking up an old message.
  23 |  */
  24 | export async function snapshotInboxIds(email: string): Promise<Set<string>> {
  25 |   try {
  26 |     const inbox = inboxNameFor(email);
  27 |     const res = await fetch(`https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`);
  28 |     const body = (await res.json()) as { msgs?: MailinatorMessage[] };
  29 |     return new Set((body.msgs ?? []).map((m) => m.id));
  30 |   } catch {
  31 |     // Falls back to accepting any matching message - the subject filter below
  32 |     // already guards against grabbing the wrong email.
  33 |     return new Set();
  34 |   }
  35 | }
  36 | 
  37 | export interface WaitForCodeOptions {
  38 |   /** Regex the email subject must match, e.g. /verification code/i. */
  39 |   subjectPattern: RegExp;
  40 |   /** Ids to ignore, from a prior snapshotInboxIds() call. */
  41 |   knownIds?: Set<string>;
  42 |   timeoutMs?: number;
  43 |   pollIntervalMs?: number;
  44 | }
  45 | 
  46 | /**
  47 |  * Polls Mailinator until a 6-digit code arrives in an email matching
  48 |  * `subjectPattern`, or throws after `timeoutMs`.
  49 |  */
  50 | export async function waitForVerificationCode(
  51 |   email: string,
  52 |   options: WaitForCodeOptions
  53 | ): Promise<string> {
  54 |   // Mailinator's public API rate-limits aggressive polling (HTTP 429 /
  55 |   // Cloudflare error 1015, confirmed 2026-09-15) - 15s matches the interval
  56 |   // already proven out by ../../maestro/web/scripts/get-mfa-code.js against
  57 |   // this same shared inbox tier.
  58 |   const { subjectPattern, knownIds = new Set(), timeoutMs = 90_000, pollIntervalMs = 15_000 } =
  59 |     options;
  60 |   const inbox = inboxNameFor(email);
  61 |   const deadline = Date.now() + timeoutMs;
  62 | 
  63 |   while (Date.now() < deadline) {
  64 |     try {
  65 |       const listRes = await fetch(
  66 |         `https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}`
  67 |       );
  68 |       const listBody = (await listRes.json()) as { msgs?: MailinatorMessage[] };
  69 |       const candidates = (listBody.msgs ?? [])
  70 |         .filter((m) => subjectPattern.test(m.subject ?? '') && !knownIds.has(m.id))
  71 |         .sort((a, b) => b.time - a.time);
  72 | 
  73 |       const latest = candidates[0];
  74 |       if (latest) {
  75 |         const msgRes = await fetch(
  76 |           `https://api.mailinator.com/api/v2/domains/public/inboxes/${inbox}/messages/${latest.id}`
  77 |         );
  78 |         const msgBody = (await msgRes.json()) as { parts?: { body?: string }[] };
  79 |         const text = msgBody.parts?.[0]?.body ?? '';
  80 |         const match = text.match(/\b\d{6}\b/);
  81 |         if (match) return match[0];
  82 |       }
  83 |     } catch {
  84 |       // Transient network hiccup or a rate-limited/non-JSON response - keep polling.
  85 |     }
  86 | 
  87 |     await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  88 |   }
  89 | 
> 90 |   throw new Error(`No verification code found in ${email} inbox within ${timeoutMs}ms`);
     |         ^ Error: No verification code found in moninotes-signintest-mfa@mailinator.com inbox within 90000ms
  91 | }
  92 | 
```