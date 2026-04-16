# Adobe Express Integration — Clarification Documentation

**Document Purpose:** Technical clarification for Adobe Developer Program review  
**Product:** Kiosk Application (Adobe Express Embed SDK Integration)  
**Date:** April 16, 2026  
**Prepared For:** Adobe Developer Relations Team

---

## Executive Summary

This document provides comprehensive clarifications on four key areas identified during the Adobe review process:

1. **Query 1** — Saved Projects Search & Discovery Workflow
2. **Query 2** — MP4 Export Support & Limitations
3. **Query 3** — Session Timer Purpose & Visibility
4. **Query 4** — Brand Naming Compliance & Recommendations

Each section includes technical context, current implementation details, and recommended actions.

---

## Query 1: Searching Saved Projects in the Web App

### Current Implementation

The kiosk application does **not** provide a search or browsing interface for saved projects. Instead, the workflow follows this model:

#### Architecture Overview

- **Frontend User Workflow:** Users create designs in Adobe Express, export them via the "Export & upload" function, and the designs are stored in a configured backend destination (Dropbox or SMB/CIFS file share).
  
- **No In-App Project Listing:** The web application is designed as a **stateless, single-session kiosk** interface. There is no built-in project repository, search engine, or retrieval mechanism within the application itself.

- **Upload Record Keeping:** The backend maintains a simple upload history log (`server/uploads/upload-history.json`) that tracks:
  - Filename
  - Upload timestamp
  - File size
  - Destination path (Dropbox or SMB)
  - Upload ID

#### Current Limitations

| Requirement | Status | Details |
|-------------|--------|---------|
| **Search saved projects by name** | ❌ Not Implemented | Users cannot query or filter previous designs via the web UI |
| **Browse previous uploads** | ❌ Not Implemented | No public-facing upload history or project listing page |
| **Retrieve by ID or identifier** | ❌ Not Implemented | No project ID system or retrieval API for saved designs |
| **Access to uploaded files** | ✅ Backend Storage | Files are stored in Dropbox or SMB; access is via those systems |

### Actual User Journey for "Saved Projects"

When users need to access previously saved designs:

1. **For Dropbox Destination:**
   - Designs are saved to a Dropbox folder (default: `/ExpressExports` or configured path)
   - Users access Dropbox directly to browse, search, and download their designs
   - The kiosk does not provide a search interface

2. **For SMB/CIFS Destination:**
   - Designs are saved to a network file share
   - Users or administrators access the share directly to browse and retrieve designs
   - The kiosk does not provide a search interface

### Recommended Approach for this Integration

**Current Design is Intentional:**

The kiosk is designed as a **stateless, public-facing submission tool** (similar to photo booth or event capture systems). It is not intended to function as a full project management application. This is appropriate for:

- Event-based design capture (trade shows, conferences, retail displays)
- Temporary installations with frequent user rotation
- Kiosk-style experiences where users create once and leave
- Operators who manage uploads externally via Dropbox/SMB

**If Project Search is Required:**

If the deployment requires users to search or retrieve previous designs, the operator would need to:

1. Implement a separate **project management system** outside the kiosk app
2. Store design metadata (user ID, project name, tags, creation date) in a database
3. Build a search/retrieval UI on top of that system
4. This is beyond the current scope of the kiosk application

### Answer to Adobe Review

> **For this integration, saved projects are not accessible via a search or listing workflow within the web application. The application functions as a stateless submission kiosk, not a project management system. Users and operators access uploaded designs directly via the configured backend storage (Dropbox or SMB file share). For deployments requiring project search functionality, a separate project management system would need to be implemented outside the kiosk application.**

---

## Query 2: MP4 Export – Supported Formats & Current Limitations

### Current Implementation

#### Export Configuration

The kiosk application currently supports **single export format:**

```javascript
// src/adobe/editorConfig.js
export const EXPORT_OPTIONS = [
  {
    id: 'publish-dropbox',
    label: 'Export & upload',
    action: { target: 'publish' },
    style: { uiType: 'button' },
  },
]
```

**Supported Export Format:** `PNG` (statically configured)

#### MP4 Export Status

| Aspect | Status | Details |
|--------|--------|---------|
| **MP4 export via Embed SDK** | ⚠️ Supported by SDK | Adobe Express Embed SDK *can* export MP4 for animation/video content |
| **MP4 support in this kiosk** | ❌ Not Enabled | The kiosk is currently configured to export PNG only |
| **Known Issues with MP4** | ⚠️ Potential | MP4 export requires special handling (larger file sizes, longer processing time) |
| **Configuration barrier** | ✅ Identified | Would require changes to export options and backend upload handling |

#### Why MP4 Export is Not Currently Enabled

1. **Design Decision:** The kiosk is optimized for quick, stateless submissions with minimal file sizes. PNG is ideal for this use case.

2. **Backend Compatibility:** The upload middleware and file handling are configured for image formats. MP4 would require:
   - Increased file size limits (current: typically 50MB for images, MP4 could exceed 100–500MB)
   - Different validation logic
   - Extended upload timeouts for network transfers
   - Adjusted storage quotas in Dropbox/SMB

3. **User Experience:** MP4 export from Adobe Express typically requires waiting for video encoding/processing, which could be problematic in a public kiosk environment where session times are limited.

4. **Storage & Operational Overhead:** Video files consume significantly more storage and bandwidth than static images.

### To Enable MP4 Export

If MP4 support is required, the following changes would be necessary:

```javascript
// Step 1: Update EXPORT_OPTIONS to include MP4
export const EXPORT_OPTIONS = [
  {
    id: 'publish-dropbox',
    label: 'Export as PNG',
    action: { target: 'publish' },
    style: { uiType: 'button' },
  },
  {
    id: 'publish-dropbox-mp4',
    label: 'Export as MP4',
    action: { target: 'publish' },
    style: { uiType: 'button' },
  },
]

// Step 2: Increase backend file size limits
// In server/config.js:
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024  // 500MB for video

// Step 3: Extend upload timeout
// In .env or server config:
DROPBOX_UPLOAD_TIMEOUT_MS=300000  // 5 minutes for video uploads
```

### Adobe Embed SDK — MP4 Support Notes

The Adobe Express Embed SDK **does support** MP4 export for animation/video-capable content. However:

- **Animations Only:** MP4 is available only for designs that contain animations or video frames. Static designs export as PNG.
- **Browser Compatibility:** Video export requires modern browser support (Chrome 60+, Firefox 55+, Safari 11+, Edge 79+).
- **Processing Time:** Video encoding can take 10–30 seconds depending on complexity.
- **Size Variability:** Output file size varies widely (2MB–200MB+) depending on animation complexity and duration.

### Answer to Adobe Review

> **MP4 export is not currently enabled in this integration. The kiosk is configured to export PNG format only, which aligns with the quick-submission, stateless design of the application. While the Adobe Embed SDK fully supports MP4 export for animated content, enabling it would require architectural changes to file handling, storage limits, upload timeouts, and operational infrastructure. MP4 export can be enabled upon request with appropriate backend modifications.**

---

## Query 3: Timer Display on the Right Side of the Web Page

### Current Implementation

#### Timer Purpose & Functionality

The timer visible on the right side of the session header serves as a **configurable session countdown** for kiosk operators. Its purpose is:

| Aspect | Details |
|--------|---------|
| **Primary Purpose** | Provide visual session time remaining to users during edit/creation phase |
| **Target Audience** | End-users (guests) editing in Adobe Express |
| **Intended Visibility** | Yes — designed to be visible and informative |
| **Related Feature** | Session management and operator control |

#### Technical Details

**Timer Configuration:**

The timer is controlled via backend environment variables and admin panel settings:

```javascript
// Configuration via environment variables (backend):
SESSION_SECONDS=600              // Session duration in seconds (e.g., 10 min)
SHOW_SESSION_TIMER=true          // Toggle timer visibility (true/false/'0'/empty)
```

**Frontend Display Logic:**

```javascript
// src/components/microsite/SessionHeader.jsx
export function SessionHeader({
  remainingSeconds,
  showTimer,              // Controls visibility
  onLeave,
  uploadBusy,
}) {
  const low = showTimer && remainingSeconds <= 120  // Alert state (last 2 min)
  
  return (
    <header className="sessionHeader">
      {showTimer ? (
        <div className="sessionHeader__timerBox" role="status">
          <span className="sessionHeader__timerPill">
            {formatClock(remainingSeconds)}
          </span>
        </div>
      ) : null}
    </header>
  )
}
```

#### Timer Behavior

| Behavior | Details |
|----------|---------|
| **Display Format** | MM:SS (e.g., "10:30" for 10 minutes 30 seconds) |
| **Update Frequency** | Every 1 second |
| **Visual Alert** | At 2 minutes remaining, timer highlights in amber/warning color |
| **At Zero** | Timer resets to session length (soft nudge); session does not force-close |
| **Auto-Hide** | Disabled when `SHOW_SESSION_TIMER=false` or `SESSION_SECONDS=0` |

#### Administrator Control

**Via Admin Panel:**

Operators can set the timer in the Admin Settings section:

1. Navigate to `/admin`
2. Enter admin password (if configured)
3. Go to **Session Settings** → **Timer (seconds)**
4. Enter session duration (e.g., 600 for 10 minutes)
5. Save

**Via Environment Variable:**

```bash
SESSION_SECONDS=600         # 10 minutes
SHOW_SESSION_TIMER=true     # Visible to users

# To hide timer completely:
SESSION_SECONDS=0           # Timer hidden
# OR
SHOW_SESSION_TIMER=false    # Timer hidden
```

#### What the Timer is NOT Related To

| Item | Status | Details |
|------|--------|---------|
| **Export processing time** | ❌ | Timer is independent of export/upload duration |
| **Licensing usage tracking** | ❌ | Timer is not used for Adobe licensing metrics |
| **Software licensing countdown** | ❌ | No license expiration tied to session timer |
| **Per-click usage tracking** | ❌ | Not used for metering API or feature access |

### Use Cases

**Event & Kiosk Deployments:**

- Trade show booths: Limit each user to 10–15 minutes
- Retail displays: Set 5-minute quick design sessions
- Public installations: 20-minute capture sessions
- Conference kiosks: 3-5-minute microburst sessions

**Behavior with Timer:**

- **With Timer Enabled:** Users see the countdown and can self-manage time allocation
- **Without Timer:** No time pressure; users edit until they're done or click "Leave"

### Answer to Adobe Review

> **The timer displayed on the right side is a **session countdown feature** designed for kiosk operators to manage user session duration during the design editing phase. It is fully configurable (enabled/disabled) and adjustable (duration in seconds) via the admin panel or environment variables. The timer is intended to be visible to end-users and serves as a time-management tool for public deployments. It is NOT related to export processing, licensing, or usage tracking — it is purely a session management feature. To hide the timer, operators set `SHOW_SESSION_TIMER=false` or `SESSION_SECONDS=0`.**

---

## Query 4: Brand Naming Compliance — "Adobe Express Kiosk" Review

### Current Issue

The integration is currently branded as:

**Primary Name:** "Adobe Express Kiosk"

This naming creates a **brand compliance issue** with the Adobe Developer Program Branding Guidelines for Embed SDK integrations.

### Adobe Developer Branding Guidelines — Key Requirements

According to Adobe's official guidelines for third-party integrations:

| Requirement | Status | Details |
|-------------|--------|---------|
| **Primary name must be third-party owned** | ❌ Non-Compliant | "Adobe Express Kiosk" uses Adobe product name first |
| **Cannot use "Adobe" as primary identifier** | ❌ Violation | Adobe trademarks are reserved; third parties must use distinct names |
| **Cannot use "Adobe Express" as primary identifier** | ❌ Violation | Adobe product names cannot be the main product label |
| **"Adobe" can be secondary/descriptive** | ✅ Allowed | References to Adobe products acceptable in supporting text |

### Compliance Problem

**Current:** "Adobe Express Kiosk" → Implies Adobe-owned product  
**Issue:** Violates Adobe Developer Program branding guidelines; creates confusion about product ownership

### Recommended Naming Alternatives

#### **Option A (Recommended)** — Distinctive Brand + Subtitle

```
Primary Name: Kiosk for Adobe Express
```

- ✅ Compliant with Adobe guidelines
- ✅ Clearly indicates it's a third-party kiosk
- ✅ References Adobe Express as the integrated service (secondary/supporting)
- ✅ Distinctive ownership (implied third-party)

**Usage Examples:**
- "Welcome to Kiosk for Adobe Express"
- "Powered by Adobe Express | Kiosk for Adobe Express"
- "Event Kiosk for Adobe Express"

#### **Option B** — Alternative Distinctive Brand

```
Primary Name: Kiosk: An Integration for Adobe Express
```

- ✅ Compliant with Adobe guidelines
- ✅ Explicitly calls out that it's an integration (not a native Adobe product)
- ✅ More formal/enterprise-suitable naming
- ✅ Clear separation between product name and platform reference

**Usage Examples:**
- "Kiosk: An Integration for Adobe Express"
- "Design Kiosk: An Integration for Adobe Express"

#### **Option C** — Branded Third-Party Name (If Applicable)

```
Primary Name: [Your Company/Organization Name] Kiosk
Subtitle/Description: Powered by Adobe Express
```

**Example (Hypothetical):**
```
Primary Name: EventCapture Kiosk
Tagline: Powered by Adobe Express
```

- ✅ Fully compliant
- ✅ Establishes your own brand
- ✅ Adobe Express clearly marked as third-party service

### Implementation Locations

The naming appears in these locations and should be updated:

| Location | Current | Recommended |
|----------|---------|-------------|
| **Product title (landing page)** | "Adobe Express Kiosk" | "Kiosk for Adobe Express" |
| **Admin panel header** | "Adobe Express Kiosk" | "Kiosk for Adobe Express" |
| **Browser title (`<title>`)** | Current: check HTML | Update per above |
| **Meta description** | Current: check HTML | Update per above |
| **Documentation** | "Adobe Express Kiosk" | "Kiosk for Adobe Express" |
| **Adobe submission docs** | "Adobe Express Kiosk" | "Kiosk for Adobe Express" |
| **Support/Help text** | Update references | Update per above |

### Files to Update

Based on the codebase structure, the following files reference the product name:

```
src/App.jsx                           (App title/branding)
src/components/microsite/...          (Header, footer, branding components)
server/routes/index.js                (Brand metadata, if applicable)
docs/ADOBE_INTEGRATION_SUBMISSION.md  (Currently references "Adobe Express Kiosk")
package.json                          (Name field)
public/index.html                     ('<title>' and meta tags)
README.md                             (Product description)
```

### Migration Steps

1. **Update all user-facing text** from "Adobe Express Kiosk" to "Kiosk for Adobe Express"
2. **Update internal documentation** and README
3. **Update Adobe submission materials** with the new name
4. **Update code comments** that reference the old name
5. **Test in admin panel** to confirm branding displays correctly
6. **Re-submit to Adobe** with updated naming and this clarification

### Compliant Branding Pattern

```
[Product Name] — Powered by Adobe Express
```

**Example:**
```
Kiosk for Adobe Express — Design & Export at Your Event
```

This clearly establishes:
- ✅ Distinct product identity ("Kiosk for Adobe Express")
- ✅ Adobe as supporting platform ("Powered by Adobe Express")
- ✅ Feature/benefit clearly stated
- ✅ Compliant with Adobe Developer guidelines

### Answer to Adobe Review

> **The current name "Adobe Express Kiosk" does not comply with Adobe Developer Program Branding Guidelines for third-party integrations. Third-party integrations must not use Adobe product names as the primary identifier. We recommend renaming the integration to one of the following compliant alternatives:**

> **1. "Kiosk for Adobe Express" (Recommended)**  
> **2. "Kiosk: An Integration for Adobe Express"**  
> **3. "[Your Brand] Kiosk — Powered by Adobe Express"**

> **We will immediately update all branding materials, documentation, and code to reflect the new compliant name and re-submit for your verification.**

---

## Summary Table — All Clarifications

| Query | Finding | Status | For Adobe Reviewer |
|-------|---------|--------|------------------|
| **Query 1: Search Saved Projects** | No in-app search; files stored in Dropbox/SMB | Expected Design | Clarification provided; not a limitation |
| **Query 2: MP4 Export Support** | Not currently enabled; PNG only; can be added with backend changes | Feature Status | SDK supports MP4; kiosk currently optimized for PNG |
| **Query 3: Timer Display** | Session countdown for operator control; fully configurable | As Designed | Feature works as intended; can be hidden |
| **Query 4: Brand Name Compliance** | "Adobe Express Kiosk" violates guidelines; recommend "Kiosk for Adobe Express" | Action Required | Name change needed; compliant alternatives provided |

---

## Recommended Next Steps

### Immediate Actions

1. ✅ **Acknowledge Query 1** — Confirm stateless kiosk design is appropriate for integration
2. ✅ **Acknowledge Query 2** — Clarify MP4 support roadmap (if applicable)
3. ✅ **Confirm Query 3** — Validate timer implementation meets requirements
4. 🔴 **Action Query 4** — **Rename product to "Kiosk for Adobe Express"** and re-submit

### For Adobe Submission

- Update [docs/ADOBE_INTEGRATION_SUBMISSION.md](docs/ADOBE_INTEGRATION_SUBMISSION.md) with new product name
- Submit updated materials with this clarification document
- Provide reference to Adobe Developer Branding Guidelines compliance

---

## Appendix: Configuration Reference

### Environment Variables

```bash
# Session Timer
SESSION_SECONDS=600              # Duration in seconds; 0 = hidden
SHOW_SESSION_TIMER=true          # true = visible; false/0 = hidden

# Upload Destination
UPLOAD_DESTINATION=dropbox       # 'dropbox' or 'smb'
DROPBOX_UPLOAD_FOLDER=/ExpressExports

# File Handling
MAX_UPLOAD_BYTES=52428800        # Max file size (currently 50MB for PNG)
UPLOAD_RATE_LIMIT_PER_MINUTE=120

# Session & Auth
SITE_PASSWORD_ENABLED=false
SESSION_HEADER_BACKGROUND=...    # Branding

# For MP4 Support (Future)
# MAX_UPLOAD_BYTES=524288000     # 500MB for video
# DROPBOX_UPLOAD_TIMEOUT_MS=300000  # 5 min for video uploads
```

### Admin Panel Settings

- **Session Timer:** Configurable in `/admin` → Session Settings
- **Branding:** Logo, backgrounds, colors configurable in admin
- **Export Destination:** Dropbox (OAuth) or SMB (credentials required)
- **Passwords:** Site access and admin access gates optional

---

## Contact & Support

**Document Status:** For Adobe Developer Program review  
**Last Updated:** April 16, 2026  
**Document Owner:** [Integration Team]

For questions regarding this clarification, please contact your integration support team or reference ticket [TICKET_ID].

---

**End of Document**
