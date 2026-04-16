# Blank Canvas Mode - Quick Reference

## Files Overview

```
src/
├── utils/
│   └── blankModeUtils.js          # Core blank canvas functions
├── hooks/
│   └── useBlankModeWorkflow.js    # React hook for blank mode state
├── components/microsite/
│   ├── BlankModeLanding.jsx       # UI: blank mode start page
│   ├── BlankModeNameModal.jsx     # UI: pickup name input
│   └── styles/
│       └── BlankModeLanding.css   # Styles

Documentation/
├── BLANK_MODE_GUIDE.md            # Full implementation guide
├── BLANK_MODE_EXAMPLES.jsx        # Usage patterns
└── BLANK_MODE_QUICK_REF.md        # This file
```

## Quick Start - 3 Steps

### Step 1: Use the Hook
```jsx
import { useBlankModeWorkflow } from './hooks/useBlankModeWorkflow.js'

export function MyApp() {
  const m = useBlankModeWorkflow()
  
  return (
    <button onClick={() => m.startBlankMode()}>
      Start Blank Canvas
    </button>
  )
}
```

### Step 2: Add Components
```jsx
import { BlankModeLanding } from './components/microsite/BlankModeLanding.jsx'
import { BlankModeNameModal } from './components/microsite/BlankModeNameModal.jsx'

// Landing page
<BlankModeLanding 
  onStart={m.startBlankMode}
  canStart={m.canStart}
  status={m.status}
/>

// Name input
<BlankModeNameModal
  isOpen={m.showNameModal}
  name={m.nameInput}
  onNameChange={m.setNameInput}
  onConfirm={m.confirmFileName}
  onCancel={m.cancelNameModal}
/>
```

### Step 3: Add Editor & Modals
```jsx
<ExpressEditorHost isActive={m.phase === 'editing'} />
<SessionHeader remainingSeconds={m.remaining} showTimer={m.showSessionTimer} />
<SubmissionThanksModal onDismiss={m.dismissSubmissionThanks} />
<LeaveConfirmModal onConfirm={m.confirmLeaveSession} />
```

## Core APIs

### useBlankModeWorkflow()
```js
const {
  // State
  phase: 'landing' | 'editing',
  status: 'loading' | 'ready' | 'error',
  error: string,
  remaining: number,        // seconds left
  banner: string,
  uploadBusy: boolean,
  
  // Booleans
  canStart: boolean,
  showNameModal: boolean,
  showLeaveConfirm: boolean,
  showSubmissionThanks: boolean,
  
  // Input
  nameInput: string,
  setNameInput: (name: string) => void,
  
  // Actions
  startBlankMode: () => void,
  launchBlankEditor: (initialAssetUrl?: string) => void,
  confirmFileName: () => void,
  openLeaveConfirm: () => void,
  confirmLeaveSession: () => void,
  dismissSubmissionThanks: () => void,
  importAssetFromFile: (file: File) => void,
  importAssetFromUrl: (url: string) => void,
} = useBlankModeWorkflow()
```

### openBlankCanvas()
```js
import { openBlankCanvas } from './utils/blankModeUtils.js'

await openBlankCanvas(editor, appConfig, {
  width: 1080,
  height: 1920,
  initialAssetUrl: 'https://...',  // optional
})
```

### fetchImageAsDataUrl()
```js
import { fetchImageAsDataUrl } from './utils/blankModeUtils.js'

const dataUrl = await fetchImageAsDataUrl('https://example.com/image.jpg')
// Returns: 'data:image/jpeg;base64,...'
```

### blobToDataUrl()
```js
import { blobToDataUrl } from './utils/blankModeUtils.js'

const dataUrl = await blobToDataUrl(fileFromInput)
```

### setupAssetDropZone()
```js
import { setupAssetDropZone } from './utils/blankModeUtils.js'

const cleanup = setupAssetDropZone(
  document.getElementById('express-editor'),
  (files) => {
    files.forEach(f => importAssetFromFile(f))
  }
)
// Call cleanup() to remove listeners
```

## Environment Variables

```bash
# Canvas size (pixels)
VITE_BLANK_CANVAS_WIDTH=1080
VITE_BLANK_CANVAS_HEIGHT=1920

# Optional initial asset
VITE_BLANK_INITIAL_ASSET_URL=https://example.com/template.jpg

# Session timeout (seconds)
VITE_SESSION_SECONDS=300

# Show session timer
VITE_SHOW_SESSION_TIMER=true
```

## User Flow Diagram

```
┌──────────────────────────┐
│  Blank Mode Landing      │
│  - Title                 │
│  - Start Button          │
│  - [Asset Import]        │
└────────────┬─────────────┘
             │ Click Start
             ▼
┌──────────────────────────┐
│  Name Modal              │
│  - Text input            │
│  - Confirm button        │
└────────────┬─────────────┘
             │ Enter name
             ▼
┌──────────────────────────┐
│  Express Editor          │
│  - Session Timer         │
│  - Canvas                │
│  - Leave Option          │
└────────────┬─────────────┘
             │ Export & Upload
             ▼
┌──────────────────────────┐
│  Submission Thanks       │
│  - Success message       │
│  - New session button    │
└──────────────────────────┘
```

## Asset Import Flow

```
User Action         Handler              Result
────────────────────────────────────────────────
Upload File    →  handleFileChange  →  dataUrl created
                  → importAssetFromFile
                  → banner message

Paste URL      →  handleImportUrl   →  validate URL
                  → importAssetFromUrl
                  → banner message

Drag & Drop    →  setupAssetDropZone →  files detected
(optional)        → importAssetFromFile
```

## Common Patterns

### Replace Gallery Completely
```jsx
// Before
export function App() {
  const m = useMicrositeWorkflow()
  return m.phase === 'editing' ? <Editor /> : <Gallery />
}

// After
export function App() {
  const m = useBlankModeWorkflow()
  return m.phase === 'editing' ? <Editor /> : <BlankModeLanding />
}
```

### Add Blank Option to Gallery
```jsx
// Update gallery config
const galleryItems = [
  ...existingItems,
  {
    id: 'blank-canvas',
    originalName: 'Blank Canvas',
    templateType: 'blankCanvas',
    canvasWidth: 1080,
    canvasHeight: 1920,
  }
]
// Existing workflow handles it automatically
```

### Conditional by Route
```jsx
if (location.pathname.includes('/admin')) {
  return <BlankModeAppOnly />
} else {
  return <GalleryApp />
}
```

### With Initial Asset
```jsx
const m = useBlankModeWorkflow()

const handleStartWithTemplate = (templateUrl) => {
  m.launchBlankEditor(templateUrl)
}
```

## Error Handling

```jsx
{m.error && (
  <div className="error-banner">
    {m.error}
  </div>
)}

{m.status === 'error' && (
  <p>Adobe Express could not be loaded.</p>
)}
```

## Styling Classes

| Component | Classes |
|-----------|---------|
| Landing | `.blankModeLanding`, `.blankModeLanding__container` |
| Asset Import | `.assetImport__section`, `.assetImport__input` |
| Title | `.blankModeLanding__title` |
| Error | `.blankModeLanding__error` |
| Button | `.btn btn--primary` |
| Modal | `.modal modal--overlay` |

## Performance Tips

1. **Defer asset processing**: Convert images asynchronously
2. **Cache data URLs**: Save converted assets in state if reusing
3. **Lazy load components**: Use React.lazy() for these components
4. **Limit image size**: Warn users if image > 5MB

```jsx
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const importAssetFromFile = useCallback(async (file) => {
  if (file.size > MAX_IMAGE_SIZE) {
    setError('Image too large. Max 5MB.')
    return
  }
  // ... proceed with import
}, [])
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank canvas won't open | Check `status === 'ready'`, check console errors |
| Asset won't load | Verify CORS, check image URL format |
| Timer not showing | Set `VITE_SHOW_SESSION_TIMER=true` |
| Modal won't dismiss | Verify `onCancel` handler is wired |
| Upload fails | Check server endpoint, verify network tab |

## Next: Choose Your Implementation

1. **Blank Only** → Copy `BlankModeAppOnly` from BLANK_MODE_EXAMPLES.jsx
2. **Hybrid** → Add gallery item with `templateType: 'blankCanvas'`
3. **Enhanced** → Add asset import to existing gallery flow
4. **Conditional** → Use `HybridApp` with route-based selection

See full guide in `BLANK_MODE_GUIDE.md`
