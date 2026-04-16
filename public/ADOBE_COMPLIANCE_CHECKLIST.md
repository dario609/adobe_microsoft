# Adobe Review Compliance — Action Checklist

**Objective:** Address 4 clarification queries for Adobe Developer Program review

**Status:** Ready to submit (3 queries answered; 1 action item)

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

### 🔴 Query 4: Brand Name Compliance — ACTION REQUIRED
- [ ] **PRIMARY ACTION:** Rename "Adobe Express Kiosk" → "Kiosk for Adobe Express"

---

## Branding Update Checklist

### Files to Update (Find & Replace)

**Frontend Files:**

- [ ] `src/App.jsx` — Check for product name references in title/branding
- [ ] `src/components/microsite/AdminPanel.jsx` — Admin panel header/title
- [ ] `src/components/microsite/MicrositeHeader.jsx` — Landing page header
- [ ] `src/components/microsite/LandingHero.jsx` — Hero section branding
- [ ] `public/index.html` — `<title>` tag, meta description
- [ ] `public/favicon.ico` — If branded with product name

**Configuration & Docs:**

- [ ] `README.md` — Product description (Line 1+)
- [ ] `package.json` — "name" field (adjust as needed)
- [ ] `docs/ADOBE_INTEGRATION_SUBMISSION.md` — Product name references

**Project Root:**

- [ ] `BLANK_MODE_GUIDE.md` — If references product name
- [ ] `BLANK_MODE_QUICK_REF.md` — If references product name
- [ ] Any other `.md` files referencing "Adobe Express Kiosk"

**Backend (if needed):**

- [ ] `server/routes/index.js` — If brand name in routes/responses
- [ ] `server/config.js` — If brand constants defined

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

- [ ] Landing page displays new product name correctly
- [ ] Admin panel shows new product name
- [ ] Browser tab title shows new product name
- [ ] Search engine shows new product name in page description
- [ ] All error messages use new product name
- [ ] README and docs reflect new product name
- [ ] No "Adobe Express Kiosk" remains in user-visible text

---

## Submission to Adobe

**Documents to Include:**

1. [ ] `ADOBE_REVIEW_CLARIFICATION.md` (main clarification document)
2. [ ] `ADOBE_REVIEW_CLARIFICATION_SUMMARY.md` (quick reference)
3. [ ] Updated `docs/ADOBE_INTEGRATION_SUBMISSION.md` (with new product name)
4. [ ] Updated `README.md` (with new product name)
5. [ ] Screenshot of updated landing page (showing new name)
6. [ ] Screenshot of updated admin panel (showing new name)

**Submission Steps:**

1. [ ] Complete all branding updates above
2. [ ] Test all pages with new branding
3. [ ] Commit changes to git with message: "feat: rename to 'Kiosk for Adobe Express' for brand compliance"
4. [ ] Deploy to staging environment
5. [ ] Validate branding on staging
6. [ ] Prepare submission package with clarification documents
7. [ ] Submit to Adobe through Developer Program portal

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
