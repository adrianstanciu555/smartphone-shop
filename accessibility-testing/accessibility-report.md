# Accessibility Compliance Report – GlobalSQA Demo Site

- **URL:** https://www.globalsqa.com/demo-site/
- **Date:** 2026-10-27
- **Tool:** Playwright MCP Server (DOM scripts + keyboard simulation)
- **Standard:** WCAG 2.1 Level A / AA
- **Scope:** Basic automated and keyboard checks on the homepage only. No real screen reader (NVDA/JAWS/VoiceOver) was used, so screen-reader results are inferred from the DOM and ARIA markup. Manual expert review is still required.

## Summary

| Area | Result |
|------|--------|
| Image alt text | Pass (2 images, all have `alt`; 1 is decorative with `alt=""`) |
| Color contrast | **Fail** (4 distinct failures plus 1 false positive) |
| Form labels | **Fail** (search input and button unlabeled) |
| Heading hierarchy | Partial (no skipped levels, but `h1` is a consent dialog heading and the page title is an `h2`) |
| Keyboard focus visibility | **Fail** (13 of 14 tab stops showed no visible focus indicator) |
| Focus management with modal open | **Fail** (focus moved behind the consent dialog) |
| Modal closes with keyboard | Pass (Esc closes the consent dialog) |
| Skip navigation link | **Fail** (none found) |
| Landmarks | **Fail** (only `<header>`; no `main`, `nav`, `footer`) |
| Form error announcement | **Fail** (empty search submits with no error or message) |

## Findings

### Critical / high

1. **No visible focus indicator (WCAG 2.4.7 AA).** Tabbing through the first 14 stops, 13 had `outline: none` and no `box-shadow`. These include the social links, the logo link and the step links (Tabs, Slider, ToolTip, AlertBox). The first tab stop was the cookie-dialog "Back" button, and the search input also had no outline (see `02-focus-in-consent-dialog.png`, `04-search-focus.png`).
2. **Focus not contained by the open consent modal (WCAG 2.4.3 Focus Order, 2.1.2).** While the "Manage data and privacy preferences" dialog was open, Tab moved to the search box, social links and page content behind it. The dialog has no `aria-modal="true"`, so screen-reader users can also reach the background content.
3. **Search field has no label (WCAG 1.3.1, 3.3.2, 4.1.2).** `<input id="s" name="s" placeholder="Search...">` has no `<label>`, `aria-label` or `aria-labelledby`. The placeholder is not a substitute. The submit `<button class="button_search">` is empty, with no text, `aria-label` or `title`, so it has no accessible name.
4. **No landmark regions (WCAG 1.3.1, 2.4.1).** The page has `<header>` only. There is no `<main>`, `<nav>` or `<footer>`, and no ARIA landmark roles. Screen-reader users cannot jump to the main content.
5. **No skip link (WCAG 2.4.1 Bypass Blocks).** No "Skip to content" link exists. The user must tab through the social icons, search and menu on every page.

### Medium

6. **Insufficient color contrast (WCAG 1.4.3 AA).**
   | Text | Foreground / background | Ratio | Required |
   |------|-------------------------|-------|----------|
   | "Last Step" heading | #FFFFFF on #07BEE5 | 2.21:1 | 3:1 (large text) |
   | "AngularJs Site" | #FFFFFF on #07BEE5 | 2.21:1 | 4.5:1 |
   | "Build" / "a Website" links | #1A73E8 on #FAFAFA | 4.32:1 | 4.5:1 |

   The "Consent" result (1:1) is a false positive from a hidden-style text node, so I did not count it. The cyan "PRACTICE WEBSITE & ITS COMPONENTS" heading (#07BEE5-style cyan on white) should be checked manually.
7. **Heading structure (WCAG 1.3.1, 2.4.6).** Visible headings in order: `h2` "Automate Selenium/Protractor Automation Scripts", `h2` "Practice Website & Its Components", `h2` "Practice / Demo Site", `h3` ×4 "Footer Widget Area 1–4", then an `h1` from the consent dialog. The page has no `h1` of its own, and the footer headings are generic and non-descriptive. No levels are skipped.
8. **Form error announcement (WCAG 3.3.1, 3.3.3, 4.1.3).** Submitting the empty search with Enter navigated to `/?s=` with no validation message, `aria-invalid` or live-region feedback. No error text is shown or announced.

### Low / informational

9. **Many images are CSS or icon based.** Social icons are anchors whose accessible name comes from the link text ("pinterest", "twitter"), which is acceptable. The decorative image has `alt=""`, which is correct.
10. **Third-party consent dialog markup.** The consent dialog (Google Funding Choices) has `role="dialog"` with `aria-label="Manage your data"` and labelled buttons, which is good. However, 78 `role="tooltip"` buttons repeat the same `aria-label`, and it has no `aria-modal`.
11. **Console errors.** 2–3 JavaScript errors were logged on load, which can hurt assistive-technology behavior.
12. **Page language.** `<html lang="en-US">` is set (pass, WCAG 3.1.1).

## ARIA and landmark inspection

- ARIA in use is almost entirely from the third-party consent dialog: `role=dialog`, `role=button`, `role=link`, `role=heading`, `role=tooltip` and `aria-label`.
- Site-owned content has no ARIA landmarks or live regions.
- `IFRAME[aria-label=Advertisement]` ×2 are labelled correctly.
- No positive `tabindex` values (pass).

## WCAG 2.1 criteria coverage

| Criterion | Level | Result |
|-----------|-------|--------|
| 1.1.1 Non-text Content | A | Pass |
| 1.3.1 Info and Relationships | A | Fail (labels, landmarks) |
| 1.4.3 Contrast (Minimum) | AA | Fail |
| 2.1.1 Keyboard | A | Pass (all tested controls reachable) |
| 2.1.2 No Keyboard Trap | A | Pass (Esc closes the dialog) |
| 2.4.1 Bypass Blocks | A | Fail |
| 2.4.3 Focus Order | A | Fail (focus behind modal) |
| 2.4.6 Headings and Labels | AA | Partial |
| 2.4.7 Focus Visible | AA | Fail |
| 3.1.1 Language of Page | A | Pass |
| 3.3.1 Error Identification | A | Fail |
| 3.3.2 Labels or Instructions | A | Fail |
| 4.1.2 Name, Role, Value | A | Fail (search input and button) |
| 4.1.3 Status Messages | AA | Fail / not demonstrated |

Not covered: 1.4.4 (resize), 1.4.10 (reflow), 1.4.11 (non-text contrast), 2.5.x (pointer), time-based media and the sub-pages of the demo site.

## Recommendations

1. Add a visible focus style, for example `:focus-visible { outline: 2px solid #005fcc; outline-offset: 2px; }`, and remove the global `outline: none`.
2. Trap focus inside the consent dialog while it is open, set `aria-modal="true"`, and make the background `inert`. Return focus to the trigger when the dialog closes.
3. Add `<label for="s">Search</label>` (visually hidden if needed) or `aria-label="Search"` to the input, and `aria-label="Submit search"` to the button.
4. Wrap content in `<main>`, the menu in `<nav aria-label="Primary">` and the footer in `<footer>`.
5. Add a "Skip to main content" link as the first focusable element.
6. Darken the cyan (#07BEE5) used behind white text, or use dark text, to reach 4.5:1 (3:1 for large text). Darken the #1A73E8 link color slightly (for example #1558B0).
7. Give the page one descriptive `h1` and meaningful footer headings.
8. Validate the search form and announce errors using `role="alert"` or `aria-live="polite"` with `aria-invalid="true"` on the field.
9. Run a full audit with axe-core or Lighthouse and test with NVDA/JAWS and VoiceOver before sign-off.

## Evidence

- [01-homepage.png](./01-homepage.png)
- [02-focus-in-consent-dialog.png](./02-focus-in-consent-dialog.png)
- [03-after-escape.png](./03-after-escape.png)
- [04-search-focus.png](./04-search-focus.png)
