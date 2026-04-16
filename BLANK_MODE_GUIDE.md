# Blank Canvas Mode Implementation Guide

## Overview

This implementation provides a **blank canvas workflow** that bypasses template selection and allows users to:
1. Start immediately with a blank canvas after entering their name
2. Optionally import assets from URL or file
3. Create freely without template constraints
4. Export and upload their design normally

## Files Added

### Utilities
- **`src/utils/blankModeUtils.js`** - Core blank canvas utilities:
  - `openBlankCanvas()` - Launch blank editor with optional initial asset
  - `fetchImageAsDataUrl()` - Convert image URLs to base64
  - `blobToDataUrl()` - Convert File/Blob to data URL
  - `setupAssetDropZone()` - Enable drag-and-drop asset import
  - `prepareAssetForInjection()` - Prepare assets for injection

### Hooks
- **`src/hooks/useBlankModeWorkflow.js`** - React hook managing:
  - Adobe SDK initialization
  - Blank canvas launch
  - Session timer
  - Asset import handlers
  - Export/upload flow
  - State management (phase, error, banner, etc.)

### Components
- **`src/components/microsite/BlankModeLanding.jsx`** - UI for blank mode:
  - Start button
  - Asset import section (URL + file upload)
  - Status messaging
  
- **`src/components/microsite/BlankModeNameModal.jsx`** - Pickup name collection:
  - Simple modal for name input
  - Keyboard shortcuts (Enter to confirm, Esc to cancel)

- **`src/components/microsite/styles/BlankModeLanding.css`** - Styling

## Usage Examples

### Example 1: Replace Existing Gallery Setup with Blank Mode

```jsx
// In App.jsx or your main page component
import { useBlankModeWorkflow } from './hooks/useBlankModeWorkflow.js'
import { BlankModeLanding } from './components/microsite/BlankModeLanding.jsx'
import { BlankModeNameModal } from './components/microsite/BlankModeNameModal.jsx'
import { ExpressEditorHost } from './components/microsite/ExpressEditorHost.jsx'
import { SubmissionThanksModal } from './components/microsite/SubmissionThanksModal.jsx'

export function BlankModeApp() {
  const m = useBlankModeWorkflow()
  const isEditing = m.phase === 'editing'

  return (
    <div className="appRoot">
      {!isEditing ? (
        <BlankModeLanding
          onStart={m.startBlankMode}
          canStart={m.canStart}
          loading={m.status === 'loading'}
          error={m.error}
          status={m.status}
        />
      ) : (
        <div className="shell shell--editing">
          <SessionHeader
            remainingSeconds={m.remaining}
            showTimer={m.showSessionTimer}
            onLeave={m.openLeaveConfirm}
          />
          <ExpressEditorHost isActive />
        </div>
      )}

      <BlankModeNameModal
        isOpen={m.showNameModal}
        name={m.nameInput}
        onNameChange={m.setNameInput}
        onConfirm={m.confirmFileName}
        onCancel={m.cancelNameModal}
        error={m.error}
      />

      {m.showLeaveConfirm && (
        <LeaveConfirmModal
          onConfirm={m.confirmLeaveSession}
          onCancel={m.cancelLeaveConfirm}
        />
      )}

      {m.showSubmissionThanks && (
        <SubmissionThanksModal onDismiss={m.dismissSubmissionThanks} />
      )}
    </div>
  )
}
```

### Example 2: Gallery + Blank Mode Hybrid

Keep existing gallery but add "Blank Canvas" option as a gallery item:

```jsx
// In LandingGallery.jsx or as a gallery item config
const BLANK_CANVAS_ITEM = {
  id: 'blank-canvas',
  originalName: 'Blank Canvas',
  templateType: 'blankCanvas',
  canvasWidth: 1080,
  canvasHeight: 1920,
}

// Update gallery items to include blank canvas
const galleryItems = [...galleryFromServer, BLANK_CANVAS_ITEM]
```

Then existing workflow automatically handles it via `useMicrositeWorkflow.js`.

### Example 3: Direct Asset Injection on Startup

```jsx
// In useBlankModeWorkflow.js, update launchBlankEditor:
const launchBlankEditor = useCallback(
  (initialAssetUrl = null) => {
    // ... existing code ...
    launchBlankEditor(initialAssetUrl)
  },
  [/* deps */]
)

// Usage:
m.launchBlankEditor('https://brand.example.com/template.jpg')
```

## Environment Variables

Add these to your `.env` for blank mode customization:

```bash
# Blank canvas dimensions (default: 1080x1920)
VITE_BLANK_CANVAS_WIDTH=1080
VITE_BLANK_CANVAS_HEIGHT=1920

# Initial asset URL (optional)
VITE_BLANK_INITIAL_ASSET_URL=

# Asset import timeout (ms)
VITE_ASSET_IMPORT_TIMEOUT=5000
```

## API Integration

### Blank Mode Workflow State

The hook returns all necessary state for React components:

```js
const workflow = useBlankModeWorkflow()

{
  brandName: string,           // Brand name from config
  phase: 'landing' | 'editing',
  status: 'loading' | 'ready' | 'error',
  error: string,               // Error message
  remaining: number,           // Seconds left in session
  banner: string,              // Session messages
  uploadBusy: boolean,         // Upload in progress
  showLeaveConfirm: boolean,   // Show leave warning
  showNameModal: boolean,      // Show name input
  nameInput: string,           // Current name input
  showSubmissionThanks: boolean,
  canStart: boolean,
  
  // Methods
  startBlankMode(): void,
  launchBlankEditor(initialAssetUrl?: string): void,
  confirmFileName(): void,
  setNameInput(name: string): void,
  openLeaveConfirm(): void,
  confirmLeaveSession(): void,
  importAssetFromFile(file: File): void,
  importAssetFromUrl(url: string): void,
  // ...
}
```

### Blank Mode Utilities API

```js
import {
  openBlankCanvas,        // Launch blank canvas with optional asset
  fetchImageAsDataUrl,    // Convert URL → data URL
  blobToDataUrl,          // Convert Blob/File → data URL
  setupAssetDropZone,     // Enable drag-drop import
  prepareAssetForInjection,
  extractMimeType,
} from '../utils/blankModeUtils.js'

// Example: Launch with initial asset
await openBlankCanvas(editor, appConfig, {
  width: 1080,
  height: 1920,
  initialAssetUrl: 'https://example.com/template.jpg'
})
```

## Asset Import Flow

### File Upload
1. User clicks "Browse"
2. Selects image file
3. File converted to data URL
4. Message appears: "Asset ready. You can insert it into your design."
5. User manually inserts via Express menu or drag-drop

### URL Import
1. User enters image URL
2. URL fetched and converted to data URL
3. Same as file flow

### Drag & Drop (Optional Enhancement)
```jsx
// In ExpressEditorHost.jsx
useEffect(() => {
  const editor = document.getElementById('express-editor')
  const cleanup = setupAssetDropZone(editor, (files) => {
    files.forEach(f => importAssetFromFile(f))
  })
  return cleanup
}, [])
```

## Limitations & Workarounds

| Issue | Workaround |
|-------|-----------|
| Can't programmatically inject layers | Use `createWithAsset()` on editor creation, or user manually inserts |
| Asset injection only at creation | Pass `initialAssetUrl` to `openBlankCanvas()` |
| No direct layer manipulation | Users can lock/organize layers manually in editor |
| No canvas background setting | Pass as initial asset or user adds background |

## Migration from Gallery Mode

### Before (Gallery + Template Selection)
```jsx
<LandingGallery />
→ User picks template
→ User picks name
→ Opens editor with template
```

### After (Blank Mode Only)
```jsx
<BlankModeLanding />
→ User enters name
→ Opens blank canvas
→ User optionally imports assets
```

### Hybrid (Gallery + Blank Option)
Keep existing flow, add blank canvas as gallery item with `templateType: 'blankCanvas'`

## Testing Checklist

- [ ] Blank canvas opens with correct dimensions (1080x1920)
- [ ] Session timer starts and counts down
- [ ] Initial asset injection displays (if provided)
- [ ] Export button works in blank canvas
- [ ] Upload to server succeeds
- [ ] Submission thank you modal appears
- [ ] Leave confirmation stops accidental exits
- [ ] Asset import from URL works
- [ ] Asset import from file works
- [ ] Drag-drop import works (if enabled)
- [ ] Error recovery works (retry, refresh)
- [ ] Mobile/touch friendly (iOS Express notice shows if needed)

## Performance Notes

- Asset conversion to data URL is async (5-15ms typically)
- Large images (>10MB) may take longer
- Consider adding progress indication for slow networks
- Data URLs in memory until editor closes (~5-10MB typical)

## Troubleshooting

### Blank canvas won't open
- Check Adobe SDK initialization: `status` should be `'ready'`
- Verify `editor.create` is callable
- Check browser console for errors

### Asset injection fails
- Asset must be image file (JPEG, PNG, WebP)
- Data URL must start with `data:image/`
- Some CORS-protected URLs may fail

### Export/Upload fails
- Verify `onPublish` callback is wired correctly
- Check server endpoint `POST /api/upload` responds
- Verify file size limits on server

## Next Steps

1. Choose deployment approach (gallery replacement vs. hybrid)
2. Update `App.jsx` or routing to use `BlankModeApp`
3. Test blank canvas creation
4. Test export/upload flow
5. Test asset import
6. Deploy and monitor errors
