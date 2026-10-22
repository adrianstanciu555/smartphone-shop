# Test Data for Manual Testing - Registration Form

Form fields: username, email, password, phone, date of birth, country.

## Notes

- `POST /auth/register` in [openapi.yaml](./openapi.yaml) takes `email`, `password` and `name`. `username` is treated as the display name (max 100 characters).
- API limits: email up to 254 characters, password 8-128 characters. Phone, birthdate and country are optional; country must be a 2-letter code.
- Extra email edge cases are in [email-test-data.json](./email-test-data.json). Sample profiles are in [user-profiles.json](./user-profiles.json).

## Test Cases

| # | Scenario | Username | Email | Password | Phone | Date of birth | Country | Expected result |
|---|---|---|---|---|---|---|---|---|
| TC01 | Valid, typical (happy path) | `Anna Petrova` | `anna.petrova@gmail.com` | `Str0ng!Pass#2026` | `+44 7624 123456` | `1992-07-14` | `GB` | 201 Created, verification email sent. |
| TC02 | Valid, localization (non-ASCII, other region) | `Zoë Müller-Łukasik` | `zoe.muller@web.de` | `Pässw0rd!ñ2026` | `+49 151 23456789` | `1999-11-23` | `DE` | 201 Created. Accents and special characters are saved and shown correctly. |
| TC03 | Boundary, minimum values | `Al` | `a@b.io` | `Abcd123!` (8 chars) | `+1 2025550123` | `2008-10-22` (exactly 18 today) | `US` | Accepted. Shortest password and youngest allowed age (if the form has an age rule). |
| TC04 | Boundary, maximum values | 100 x `N` | 64 x `a` + `@example.com` | 128 characters, with upper, lower, digit and symbol | `+40 721 345 678` | `1900-01-01` | `RO` | Accepted. Nothing is cut off and no error appears. |
| TC05 | Over the limits | 101 x `N` | 255-character email (see `email-test-data.json`) | 129 x `A1!a` | `+40 721 345 678` | `1992-07-14` | `RO` | 422. Errors on username, email and password, each naming its own field. |
| TC06 | Invalid email formats | `Test User` | `john..doe@example.com` (also try `john@@example.com`, `@example.com`, `john@example.c`) | `Str0ng!Pass#2026` | `+44 7624 123456` | `1992-07-14` | `GB` | 422 on email only. The message says the email is invalid. |
| TC07 | Weak password | `Test User` | `weak.pass@example.com` | `Ab1!` (7 chars) and `password` | `+44 7624 123456` | `1992-07-14` | `GB` | 422 on password. Names the failed rule: length, or missing complexity if enforced. |
| TC08 | Invalid phone | `Test User` | `bad.phone@example.com` | `Str0ng!Pass#2026` | `07624-ABC` (also `+44 (0) 7624`, or 20 digits) | `1992-07-14` | `GB` | 422 on phone. No account is created. |
| TC09 | Invalid date of birth | `Test User` | `bad.dob@example.com` | `Str0ng!Pass#2026` | `+44 7624 123456` | `2030-02-30` (also `2027-01-01` future, `14/07/1992` wrong format, `29 Feb 2023`) | `GB` | 422 on birthdate. Impossible and future dates are rejected. |
| TC10 | Country and duplicate or injection input | `<script>alert(1)</script>` | `anna.petrova@gmail.com` (already registered) | `Str0ng!Pass#2026` | `+44 7624 123456` | `1992-07-14` | `UK` or `XX` or `Romania` | 409 for the duplicate email. Country rejected unless a valid 2-letter code. Username is escaped, never run as a script. |

## Extra Checks

- **Case:** `ANNA@Gmail.com` counts as the same email as `anna@gmail.com` (the schema stores emails case-insensitively).
- **Account state:** after TC01 and TC02 the account is `unverified`, with a verification link that expires in 24 hours.
- **Responses:** errors never reveal the password, and the form keeps what the user typed in the valid fields.
- **Country:** `UK` fails the 2-letter check only if the form requires ISO codes (`GB`).
