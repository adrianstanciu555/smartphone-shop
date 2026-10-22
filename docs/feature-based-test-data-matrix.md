# Feature-Based Test Data Matrix: User Registration

**Feature:** `POST /auth/register`
**Sources:** `database/migrations/schema.sql` (`users` table), `docs/openapi.yaml` (`RegisterRequest`), `docs/customer_data_anonymized.csv` (existing customers)

## Rules under test

- **Email:** required, valid format, unique and case-insensitive (`citext`), at most 254 characters.
- **Password:** required, 8 to 128 characters, with at least one uppercase letter, one lowercase letter, one digit and one special character.
- **Name:** required, at most 100 characters.
- **Success:** 201 Created, role `customer`, status `unverified`, verification email sent.
- **Errors:** 409 for a duplicate email, 422 for validation errors.

## Test data matrix

| ID | Category | Scenario | Test data | Expected behavior | Priority |
|---|---|---|---|---|---|
| TC-01 | Positive | Valid registration, all required fields | email `new.user@gmail.com`, password `Str0ng!Pass1`, name `Ioana Radu` | 201. User created with role `customer` and status `unverified`. Verification email sent. Password stored as an Argon2 hash and not returned. | High |
| TC-02 | Positive | Name with diacritics and non-Latin characters | name `Elena Marković`, email `elena.new@gmail.com`, valid password | 201. Name stored and returned exactly, with UTF-8 intact. | Medium |
| TC-03 | Validation | Duplicate email (existing customer), exact and different case | email `elena.markovic@gmail.com`, then `ELENA.Markovic@Gmail.com`, with valid password `Str0ng!Pass1` and name | 409 Conflict for both. `citext` makes the unique check case-insensitive. No second user created. The message should not reveal account details. | High |
| TC-04 | Validation | Invalid email format | `julia.wagner@`, `julia wagner@web.de`, `julia.web.de`, with valid password `Str0ng!Pass1` | 422 with an email-format error. Nothing saved. | High |
| TC-05 | Validation | Missing required fields | Empty body, or one of `email`, `password` or `name` missing or empty | 422 listing each missing field. | High |
| TC-06 | Validation | Password too short but otherwise complex | `Ab1!xyz` (7 characters, has uppercase, lowercase, digit, special) | 422 with a password-length error. | High |
| TC-07 | Validation | Password missing one required character class | No uppercase `str0ng!pass1`; no lowercase `STR0NG!PASS1`; no digit `Strong!Pass`; no special character `Str0ngPass1`; letters only `StrongPassword` | 422 for each, naming the missing requirement (uppercase, lowercase, digit or special character). Nothing saved. | High |
| TC-08 | Boundary | Password at minimum, 8 characters, all classes | `Ab1!xyz9` | 201. | High |
| TC-09 | Boundary | Password at maximum, 128 characters, all classes | 128-character string containing uppercase, lowercase, digit and special character | 201. A 129-character string returns 422. | Medium |
| TC-10 | Boundary | Name at maximum, 100 characters | 100-character name | 201. A 101-character name returns 422. | Medium |
| TC-11 | Boundary | Email at maximum, 254 characters | 254 characters total (local part up to 64, domain padded) | 201. A 255-character email returns 422. | Medium |
| TC-12 | Special | SQL injection and XSS in name and email | name `Robert'); DROP TABLE users;--`, name `<script>alert(1)</script>`, valid password `Str0ng!Pass1` | Input is parameterized. No SQL executed, and the `users` table is intact. The name is stored or rejected safely and is escaped when displayed. | High |
| TC-13 | Special | Email with leading/trailing spaces and plus-tag | ` andrei.popescu+shop@yahoo.com `, valid password `Str0ng!Pass1` | Spaces trimmed. A plus-tag is a valid address, so the result is 201. It is not treated as a duplicate of `andrei.popescu@yahoo.com`, unless the business rule says otherwise. | Medium |
| TC-14 | Special | Concurrent registration, same email | Two simultaneous requests with `race@test.com`, valid password `Str0ng!Pass1` | Exactly one 201 and one 409. The `UNIQUE` constraint prevents duplicates. | Medium |
| TC-15 | Special | Verification email and unverified login | Register `daria.new@gmail.com` with password `Str0ng!Pass1`, log in before verifying, then verify the token after 24 hours | Status stays `unverified` until verification. An expired token returns 410, and a new token can be requested. | Low |

## Priority summary

| Priority | Test cases |
|---|---|
| High | TC-01, TC-03, TC-04, TC-05, TC-06, TC-07, TC-08, TC-12 |
| Medium | TC-02, TC-09, TC-10, TC-11, TC-13, TC-14 |
| Low | TC-15 |

## Open questions

- The accepted special characters, and whether a space counts as one, still need confirming. The OpenAPI pattern treats any character that isn't a letter or digit as special.
- It's unclear whether registration should return 409 or a generic response to avoid revealing which emails exist.
- The consent record (`terms`/`privacy`) and optional fields (`phone`, `birthdate`, `country`) aren't in `RegisterRequest`. Tests for these would need a spec update.
