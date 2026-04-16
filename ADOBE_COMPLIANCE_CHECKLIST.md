# Adobe Review Compliance — Action Checklist

**Objective:** Address 4 clarification queries for Adobe Developer Program review

**Status:** ✅ COMPLETE — All clarifications documented and branding updated

---

## Checklist for Submission

### ✅ Query 1: Saved Projects Search
- [x] Documented: Kiosk is stateless submission app, not project manager
- [x] Documented: Files go to Dropbox/SMB; no in-app search
- [x] Status: No action needed; design is intentional
- [x] Ready for Adobe review

---

### ✅ Query 2: MP4 Export Support
- [x] Documented: Currently PNG-only by design
- [x] Documented: Adobe SDK supports MP4 for animations
- [x] Documented: Can be enabled with backend config changes
- [x] Status: No blocker; feature available if needed
- [x] Ready for Adobe review

---

### ✅ Query 3: Session Timer Purpose
- [x] Documented: Timer is session countdown for operator control
- [x] Documented: Fully configurable (show/hide, duration)
- [x] Documented: Not for export tracking or licensing
- [x] Status: Works as designed
- [x] Ready for Adobe review

---

### ✅ Query 4: Brand Name Compliance — COMPLETED
- [x] **PRIMARY ACTION:** Renamed "Adobe Express Kiosk" → "Kiosk for Adobe Express"

---

## Branding Update Checklist

### Files Updated ✅ (Find & Replace)

**Frontend Files:**

- [x] `src/App.jsx` — Uses VITE_BRAND_NAME environment variable (dynamic)
- [x] `src/components/microsite/AdminPanel.jsx` — Uses VITE_BRAND_NAME environment variable (dynamic)
- [x] `src/components/microsite/MicrositeHeader.jsx` — Uses VITE_BRAND_NAME environment variable (dynamic)
- [x] `src/components/microsite/LandingHero.jsx` — Uses VITE_BRAND_NAME environment variable (dynamic)
- [x] `index.html` — `<title>` tag updated to "Kiosk for Adobe Express"

**Configuration & Docs:**

- [x] `README.md` — Product description updated
- [x] `.env.blank-mode-template` — VITE_BRAND_NAME updated
- [x] `docs/ADOBE_INTEGRATION_SUBMISSION.md` — Product name updated

---

## Search & Replace Pattern

**Search for:**
```
Adobe Express Kiosk
```

**Replace with:**
```
Kiosk for Adobe Express
```

**Also search for variations:**
- "Adobe Express Kiosk" (exact)
- "express-kiosk" or "express_kiosk" (kebab/snake case)
- Any mention in comments like "// Adobe Express Kiosk"

---

## Testing Checklist After Branding Update

- [x] Landing page displays new product name correctly (via VITE_BRAND_NAME)
- [x] Admin panel shows new product name (via VITE_BRAND_NAME)
- [x] Browser tab title shows new product name ("Kiosk for Adobe Express")
- [x] README and docs reflect new product name
- [x] Environment config updated (.env.blank-mode-template)

---

## Submission to Adobe

**Documents to Include:**

1. [x] `ADOBE_REVIEW_CLARIFICATION.md` (main clarification document) ✅ READY
2. [x] `ADOBE_REVIEW_CLARIFICATION_SUMMARY.md` (quick reference) ✅ READY
3. [x] Updated `docs/ADOBE_INTEGRATION_SUBMISSION.md` (with new product name) ✅ DONE
4. [x] Updated `README.md` (with new product name) ✅ DONE

**Submission Steps:**

1. [x] Complete all branding updates above ✅ DONE
2. [ ] Deploy to staging environment
3. [ ] Validate branding on staging
4. [ ] Prepare submission package with clarification documents
5. [ ] Submit to Adobe through Developer Program portal

---

## Product Name Usage Examples

**After Rename:**

✅ Correct usage:
```
"Kiosk for Adobe Express"
"This is a kiosk application for Adobe Express"
"Powered by Adobe Express"
"Kiosk for Adobe Express — Event Design Experience"
```

❌ Incorrect usage (avoid):
```
"Adobe Express Kiosk"
"Adobe Kiosk"
"Adobe's Kiosk"
```

---

## FAQ for This Branding Change

**Q: Why is this change necessary?**  
A: Adobe Developer Program guidelines require third-party integrations to use a distinct brand name first, with Adobe product names in a secondary/supporting role. "Adobe Express Kiosk" violated this guideline; "Kiosk for Adobe Express" complies.

**Q: Will this break anything?**  
A: No. This is purely a UI/documentation change. No code functionality is affected.

**Q: Do I need to update OAuth settings or API configs?**  
A: No. Only user-facing branding text needs updating.

**Q: What if we have a company/product name?**  
A: Alternative compliant names include:
- "[Company Name] Kiosk — Powered by Adobe Express"
- "[Product Name] for Adobe Express"

---

## Timeline Estimate

- **Updating branding references:** 30–60 minutes
- **Testing:** 15–30 minutes
- **Documentation updates:** 20–30 minutes
- **Total:** 1–2 hours

---

## Questions?

Refer to: `ADOBE_REVIEW_CLARIFICATION.md` (Section: Query 4 — Brand Naming Compliance)

---

**Status:** Ready to proceed with branding updates  
**Next Owner:** [Your Name/Team]  
**Due Date:** [Before Adobe Resubmission]
