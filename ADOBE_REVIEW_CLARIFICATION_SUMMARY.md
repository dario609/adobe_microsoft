# Adobe Review Clarification — Executive Summary

**For Submission to Adobe Developer Program**

---

## Quick Answer Sheet

### Query 1: Searching Saved Projects ✅

**User Ask:** How do users find previously saved projects in the web app?

**Answer:** The kiosk is a **stateless submission application**, not a project manager. Saved designs go to Dropbox/SMB storage; users access them directly in those systems, not through the web app.

**Status:** Intentional feature gap — appropriate for kiosk use case  
**No Action Needed:** ✅

---

### Query 2: MP4 Export Support ⚠️

**User Ask:** Why doesn't MP4 export work? Is it supported?

**Answer:** MP4 is NOT currently enabled. The kiosk exports PNG only. The Adobe SDK supports MP4 for animations, but it's not configured here due to:
- File size concerns (100-500MB video vs. 1-5MB PNG)
- Upload time implications
- Backend capacity needs
- Kiosk design optimizations

**Current Status:** PNG only  
**Can Be Enabled:** Yes, with backend config changes  
**No Blocker:** ✅

---

### Query 3: Timer on Right Side ✅

**User Ask:** What is the timer for? Is it meant to be visible?

**Answer:** It's a **session countdown timer** for kiosk operators. End-users see it to stay aware of remaining time. Fully configurable:
- Set duration: `SESSION_SECONDS=600` (env variable or admin panel)
- Show/hide: `SHOW_SESSION_TIMER=true|false`

**Purpose:** Session management, not export tracking or licensing  
**Status:** Works as designed  
**No Action Needed:** ✅

---

### Query 4: Brand Name Compliance 🔴

**User Ask:** Is "Adobe Express Kiosk" the right name?

**Answer:** **NO — not compliant** with Adobe Developer Branding Guidelines.

**Current:** "Adobe Express Kiosk" ❌ (Adobe name first)  
**Required:** Third-party name first

**Recommended:** 
- ✅ "Kiosk for Adobe Express" (PREFERRED)
- ✅ "Kiosk: An Integration for Adobe Express" 
- ✅ "[Your Brand] Kiosk — Powered by Adobe Express"

**Action Required:** Update all branding materials and re-submit

---

## Files in Workspace

- **[ADOBE_REVIEW_CLARIFICATION.md](ADOBE_REVIEW_CLARIFICATION.md)** — Full documentation (use for submission)
- **[ADOBE_REVIEW_CLARIFICATION_SUMMARY.md](ADOBE_REVIEW_CLARIFICATION_SUMMARY.md)** — This file (quick reference)
- **[ADOBE_INTEGRATION_SUBMISSION.md](docs/ADOBE_INTEGRATION_SUBMISSION.md)** — Update with new product name

---

## Immediate Action Items

| Item | Priority | Notes |
|------|----------|-------|
| Review Query 1-3 answers | ⏱️ Low | For information; no code changes needed |
| **Rename product** | 🔴 HIGH | "Adobe Express Kiosk" → "Kiosk for Adobe Express" |
| Update documentation | 🔴 HIGH | README.md, admin UI, all branding references |
| Re-submit to Adobe | 🔴 HIGH | Include this clarification with new name |

---

## To Update Product Name

Find and replace in these files:

```
"Adobe Express Kiosk" → "Kiosk for Adobe Express"
```

**Files to Update:**
- `src/App.jsx` (title/branding)
- `src/components/microsite/*.jsx` (header text, footer)
- `public/index.html` (<title>, meta tags)
- `README.md` (product description)
- `package.json` (name field)
- `docs/ADOBE_INTEGRATION_SUBMISSION.md` (product name)
- Any admin panel display text

---

**Next Step:** Share the full [ADOBE_REVIEW_CLARIFICATION.md](ADOBE_REVIEW_CLARIFICATION.md) document with Adobe.
