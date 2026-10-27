# Security

## Contents
- Mindset
- Input and output
- Secrets and personal data
- Authentication and authorization
- Dependencies
- Data exposure
- Before finishing

## Mindset

Treat everything that crosses a boundary as hostile until proven otherwise: user input, query strings, headers, cookies, uploaded files, webhook payloads, third-party responses, model output, and environment variables set by someone else. Security is not a feature added at the end; it is a property of each boundary you write.

## Input and output

- Validate and parse at the boundary with a schema (see `error-handling.md`). Allow-list what is accepted instead of block-listing what is bad: types, lengths, ranges, formats.
- Never build queries by concatenating strings. Use parameterized queries or the query builder. Same for shell commands (pass an argument array, never a string through a shell), file paths (resolve and check they stay inside the intended directory) and URLs (allow-list hosts before fetching a user-supplied address).
- Encode output for where it lands: HTML escaping by default in templates, no `innerHTML`/`dangerouslySetInnerHTML` with untrusted text, safe serialization for JSON in HTML.
- Webhooks and callbacks: verify the signature, then ask the source for the real state instead of trusting the payload.
- Limit sizes: request bodies, file uploads, page sizes, query depth, and rate limit anything expensive or sensitive (login, code verification, search, anything that costs money).

## Secrets and personal data

- Secrets (keys, tokens, passwords, certificates) live in the environment or a secret manager, never in code, tests, logs, error messages, URLs or the frontend bundle. Do not commit `.env`; commit `.env.example` with fake values.
- Parse env vars once in a config module and fail fast with a message naming the variable (not the value).
- Never log secrets, session tokens, full card numbers, one-time codes or more personal data than needed. Mask when you must show (`****1234`).
- Hash passwords with a slow, salted algorithm (argon2, bcrypt, scrypt), never a fast hash and never reversible encryption. Compare secrets in constant time.
- Anything that is a one-time code or credential never goes through logs, stored conversations or analytics.
- Collect and keep only the personal data you need, and for as short as needed.

## Authentication and authorization

- Authenticate once at the edge (a middleware), authorize at the layer that owns the rule. Checking in the UI is not security.
- Authorize every access to a resource by id: "is this order the caller's?" Never trust an id from the client to imply ownership (the classic IDOR bug).
- Default deny. Least privilege for users, service accounts, database roles and API keys.
- Sessions: httpOnly, secure, sameSite cookies; short lifetimes; rotate on login; invalidate on logout.
- Hide existence where it helps: respond 404 (not 403) for resources the caller must not know about, and give the same response for "no such user" and "wrong password".

## Dependencies

- Add a dependency only with a clear reason; prefer the platform and what is already in the project. Fewer dependencies is less attack surface and less coupling.
- Pin versions through the lockfile, review what a new package does and who maintains it, and prefer well-maintained, widely used ones. Respect the project's release-age or allow-list policy for installs and install scripts.
- Never pipe a downloaded script into a shell, and treat downloaded files as untrusted data.

## Data exposure

- Return explicit response shapes (a DTO built field by field), never a raw database row or full model. A new column must not leak by default.
- Errors to users carry no stack trace, SQL, paths or internals (see `error-handling.md`).
- CORS: allow-list origins, never `*` with credentials. Set security headers (CSP, HSTS, X-Content-Type-Options) at the edge.
- Anything an AI model can read is exposed to the person talking to it: give it only the fields it needs, and treat tool output and user text as data, never as instructions.

## Before finishing

- [ ] Every input validated at the boundary, with limits?
- [ ] No string-built SQL, shell commands, paths or URLs from untrusted values?
- [ ] No secret in code, logs, errors, URLs or the client bundle?
- [ ] Every resource access checked against the caller, not only authenticated?
- [ ] Response shapes explicit, errors free of internals?
- [ ] New dependencies justified and pinned?
