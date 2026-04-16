# Adobe Express Blank Canvas & Template Selection Architecture

## Current State Analysis

### ✅ What's Already Implemented
- **Blank canvas support exists** in `editorConfig.js`:
  ```js
  if (templateType === 'blankCanvas' && canvasPx && canvasPx.width > 0 && canvasPx.height > 0) {
    editor.create({ canvasSize: { width: canvasPx.width, height: canvasPx.height, unit: 'px' } }, ...)
  }
  ```
- **Multiple template types** supported: `adobeTemplate`, `userTemplate`, `blankCanvas`
- **Gallery-driven workflow** already selects template type before editor launch

### ❌ Current Limitations
1. **Template selection is mandatory** — users must pick from gallery before starting
2. **No direct blank canvas without gallery** — requires gallery entry point
3. **Template type selection happens in gallery UI** — not programmatically driven
4. **Overlay/branding injected at React level** — not at editor canvas level

---

## Question 1: Blank Canvas Approach

### Feasibility: ✅ YES, Fully Supported

The Adobe SDK **fully supports** opening a blank canvas:

```js
editor.create(
  { canvasSize: { width: 1080, height: 1920, unit: 'px' } },  // Blank canvas with dimensions
  appConfig,
  EXPORT_OPTIONS,
  container
)
```

### Limitations Encountered: None with Basic SDK

| Aspect | Status | Details |
|--------|--------|---------|
| **Blank canvas creation** | ✅ Supported | Any dimensions in px work |
| **Layer manipulation** | ⚠️ Limited | Can't programmatically add/lock layers (See SDK docs) |
| **Locked elements** | ❌ Not directly supported | Layers created by users CAN be locked, but not programmatically pre-locked |
| **Custom fonts** | ✅ Supported | User's Adobe account fonts available |
| **Pre-injected assets** | ⚠️ Workaround | Can't inject on canvas creation, but users can paste/drag |
| **Timer overlay** | ✅ Supported | Rendered outside canvas (React layer, not editor layer) |
| **Background frame** | ⚠️ Limited | Can be template or user-set, not SDK-injected |

### Recommended Approach

**Hybrid Model: Blank + User Template Fallback**

```js
// 1. Start with blank canvas
editor.create({ canvasSize: { width: 1080, height: 1920, unit: 'px' } }, appConfig, EXPORT_OPTIONS, container)

// 2. If user template exists (optional), let them edit it
// 3. If user wants branded template, use Adobe template as starting point
```

---

## Question 2: Skip Template Selection Entirely

### Feasibility: ✅ YES, with 2 Implementation Paths

### Path A: **Always Blank Canvas (Recommended for Kiosk)**

**Change:** Skip gallery, skip template selection, go directly to blank canvas.

```js
// In useMicrositeWorkflow.js, add new callback:
const launchEditorDirect = useCallback(() => {
  setPhase('editing')
  setTimerRunning(true)
  
  const appConfig = {
    selectedCategory: 'yourStuff',  // Hides template suggestions
    callbacks: {
      onPublish: async (_intent, publishParams) => { /* ... */ },
      onCancel: async () => { /* ... */ }
    }
  }
  
  // Open blank canvas directly, no template selection
  editor.create(
    { canvasSize: { width: 1080, height: 1920, unit: 'px' } },
    appConfig,
    EXPORT_OPTIONS,
    container
  )
}, [])
```

### Path B: **Skip to Default Template**

```js
// Skip gallery, use configured template or blank as fallback
const launchEditorDirect = useCallback(() => {
  const templateId = ADOBE_TEMPLATE_ID || FALLBACK_TEMPLATE_ID
  
  if (!templateId) {
    // No template configured, use blank
    editor.create({ canvasSize: { width: 1080, height: 1920, unit: 'px' } }, appConfig, EXPORT_OPTIONS, container)
  } else {
    // Use template
    editor.createWithTemplate({ templateId }, appConfig, EXPORT_OPTIONS, container)
  }
}, [])
```

---

## Question 3: Can We Still Apply Branding + Features?

### ✅ YES — All Features Still Work

| Feature | Location | Implementation | Status |
|---------|----------|---|--------|
| **Timer/Countdown** | React layer (fixed position) | `SessionHeader` component | ✅ Works with blank canvas |
| **Background overlay** | React CSS wrapper | `.editorWorkspaceBg` style | ✅ Works with blank canvas |
| **Branded frame/wrap** | Adobe template (template choice) | Use `createWithTemplate()` | ✅ Template-based |
| **Locked regions** | User-managed in editor | Users lock their own layers | ✅ SDK supports user-locking |
| **User-editable regions** | Entire canvas | Users edit any unprotected layer | ✅ Works with blank or template |
| **Export workflow** | React callback (`onPublish`) | `uploadDesignToServer()` | ✅ Independent of template type |
| **File submission** | Server-side (`/api/upload`) | Node.js file handling | ✅ Template-agnostic |

### Programmatic Approach: Blank Canvas + Pre-loaded Asset

```js
// Inject a branded template as a starting asset (users see it but can edit/replace)
const openBlankWithBrandedAsset = async (editor, appConfig, brandedImageUrl) => {
  // 1. Open blank canvas
  editor.create(
    { canvasSize: { width: 1080, height: 1920, unit: 'px' } },
    appConfig,
    EXPORT_OPTIONS,
    container
  )
  
  // 2. After editor loads, user can paste/insert branded asset
  // Note: SDK v4 doesn't support programmatic layer injection, but users can:
  //   - Drag & drop image onto canvas
  //   - Copy/paste from clipboard
  //   - Use "Insert" menu
}
```

---

## Recommended Architecture for Your Use Case

### Option 1: **Direct Blank Canvas (No Template Selection)**

```
Landing Page
    ↓
Name/Pickup Modal
    ↓
Blank Canvas Editor (1080x1920)
    ↓
Timer + Branding Background (React layer)
    ↓
Export & Upload Flow
```

**Pros:**
- Simplest user flow
- Fewer decision points
- Blank canvas is more flexible (users can design anything)

**Cons:**
- Users must design from scratch (might be harder)
- No pre-branded templates

---

### Option 2: **Template Selection with Blank Option**

```
Landing Gallery (template + blank canvas options)
    ↓
Pick Option A: Adobe Template
    ↓
Editor (template-based)
    ↓
Export & Upload

Pick Option B: Blank Canvas
    ↓
Editor (blank)
    ↓
Export & Upload
```

**Pros:**
- Choice for users
- Branded templates available
- Blank canvas for flexibility

**Cons:**
- Keeps gallery selection

---

### Option 3: **Hybrid: Blank + Optional Template Import**

```
Landing Page
    ↓
Name/Pickup Modal
    ↓
Blank Canvas Editor
    ↓
(User can import template via "Open" menu if desired)
    ↓
Timer + Branding Background (React layer)
    ↓
Export & Upload
```

**Pros:**
- Simple direct flow
- Users who want templates can import them
- Max flexibility

**Cons:**
- Users must know to import templates

---

## Implementation Order

1. **Test blank canvas** with your dimensions
2. **Remove template selection UI** (comment out gallery step)
3. **Modify `launchEditor()` flow** in `useMicrositeWorkflow.js`
4. **Verify export/upload works** independently of template type
5. **Test timer + branding styling** with blank canvas

---

## SDK Limitations & Workarounds

| Issue | Workaround |
|-------|-----------|
| Can't programmatically inject layers | Create template in Adobe, then use `createWithTemplate()` |
| Can't programmatically lock layers | Users must lock them manually, or use a pre-created template |
| Can't programmatically set background | Use React CSS for visual branding, or include in template |
| Limited programmatic canvas customization | Use templates for complex branding, blank canvas for flexibility |

---

## Next Steps

Would you like me to implement:
1. **Option 1** (Direct Blank Canvas) implementation? 
2. **Option 2** (Template + Blank Gallery Option) implementation?
3. **Option 3** (Blank + Optional Import) implementation?

Each requires ~30-45 min to refactor `useMicrositeWorkflow.js` and landing gallery UI.
