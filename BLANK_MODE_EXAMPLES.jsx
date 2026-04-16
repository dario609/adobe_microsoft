/**
 * EXAMPLE: Blank Mode App Component
 *
 * This is a complete example showing how to use the blank mode workflow.
 * Choose one of the usage patterns below based on your needs:
 *
 * Pattern 1: Replace entire gallery workflow with blank mode
 * Pattern 2: Keep gallery but add blank canvas option
 * Pattern 3: Use blank mode for admin/kiosk, gallery for public
 */

import { useOptionalBrandingBackground } from '../hooks/useOptionalBrandingBackground.js'
import { useRuntimeConfig } from '../hooks/useRuntimeConfig.js'
import { useBlankModeWorkflow } from '../hooks/useBlankModeWorkflow.js'
import { BlankModeLanding } from '../components/microsite/BlankModeLanding.jsx'
import { BlankModeNameModal } from '../components/microsite/BlankModeNameModal.jsx'
import { ExpressEditorHost } from '../components/microsite/ExpressEditorHost.jsx'
import { SessionHeader } from '../components/microsite/SessionHeader.jsx'
import { LeaveConfirmModal } from '../components/microsite/LeaveConfirmModal.jsx'
import { SubmissionThanksModal } from '../components/microsite/SubmissionThanksModal.jsx'
import { ErrorBanner } from '../components/microsite/ErrorBanner.jsx'
import { IOSExpressNotice } from '../components/microsite/IOSExpressNotice.jsx'
import { NoticeBanner } from '../components/microsite/NoticeBanner.jsx'
import { UploadOverlay } from '../components/microsite/UploadOverlay.jsx'
import { MicrositeHeader } from '../components/microsite/MicrositeHeader.jsx'

/**
 * PATTERN 1: Blank Mode Only (No Gallery)
 *
 * Use this if you want to completely replace template selection
 * with a direct blank canvas workflow.
 *
 * User flow:
 * 1. Landing page with "Start Blank Canvas" button
 * 2. Enter pickup name
 * 3. Open blank editor
 * 4. Export & upload
 */
export function BlankModeAppOnly() {
  const rt = useRuntimeConfig()
  const m = useBlankModeWorkflow()
  const isEditing = m.phase === 'editing'
  const editorBg = useOptionalBrandingBackground('/api/branding/editor-workspace-background')

  if (!rt.ready) {
    return (
      <div className="appBoot">
        <p className="appBoot__text">Loading…</p>
      </div>
    )
  }

  const appRootStyle = isEditing
    ? editorBg.hasImage
      ? editorBg.style
      : undefined
    : undefined

  return (
    <div
      className={`appRoot${isEditing ? ' appRoot--editing' : ' appRoot--landing'}`}
      style={appRootStyle}
    >
      <div className={`shell${isEditing ? ' shell--editing' : ' shell--landing'}`}>
        {!isEditing ? (
          <>
            <MicrositeHeader />
            <BlankModeLanding
              onStart={m.startBlankMode}
              canStart={m.canStart}
              loading={m.status === 'loading'}
              error={m.error}
              status={m.status}
            />
            <div className="shell__errors">
              <ErrorBanner message={m.error} />
              {m.status === 'error' && !m.error ? (
                <p className="appError appError--standalone">Adobe Express could not be loaded.</p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <SessionHeader
              remainingSeconds={m.remaining}
              showTimer={m.showSessionTimer}
              onLeave={m.openLeaveConfirm}
              uploadBusy={m.uploadBusy}
            />
            <div className="shell__errors shell__errors--session">
              <ErrorBanner message={m.error} />
            </div>
            <IOSExpressNotice />
            {m.banner ? <NoticeBanner>{m.banner}</NoticeBanner> : null}
            <ExpressEditorHost isActive />
          </>
        )}

        {m.uploadBusy ? <UploadOverlay /> : null}

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
    </div>
  )
}

/**
 * PATTERN 2: Hybrid (Gallery + Blank Canvas Option)
 *
 * Use this if you want to keep gallery selection but also offer blank canvas.
 *
 * Implementation:
 * 1. Add blank canvas as gallery item (templateType: 'blankCanvas')
 * 2. Keep existing useMicrositeWorkflow.js
 * 3. Existing logic automatically handles blank canvas
 *
 * No code changes needed - just update gallery config:
 */
export const HYBRID_BLANK_CANVAS_GALLERY_ITEM = {
  id: 'blank-canvas-option',
  originalName: 'Blank Canvas - Create Freely',
  description: 'Start with a blank canvas and design from scratch',
  templateType: 'blankCanvas',
  canvasWidth: Number(import.meta.env.VITE_BLANK_CANVAS_WIDTH) || 1080,
  canvasHeight: Number(import.meta.env.VITE_BLANK_CANVAS_HEIGHT) || 1920,
  // Optional: set thumbnail to a blank canvas icon
  // imageUrl: '/images/blank-canvas-icon.png',
}

/**
 * PATTERN 3: Conditional Based on Route/Admin
 *
 * Use blank mode for kiosk/admin path, gallery for public
 */
export function HybridApp() {
  const rt = useRuntimeConfig()
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  const useBlankMode = isAdminPath // Or any other condition

  if (!rt.ready) {
    return (
      <div className="appBoot">
        <p className="appBoot__text">Loading…</p>
      </div>
    )
  }

  if (useBlankMode) {
    return <BlankModeAppOnly />
  }

  // Default to gallery mode (existing App component)
  return <ExistingGalleryApp />
}

/**
 * PATTERN 4: Enable Dynamic Asset Import in Existing Gallery Flow
 *
 * Keep gallery, but add asset import capability when in blank canvas mode
 *
 * Use in components/microsite/ExpressEditorHost.jsx:
 */
export function setupBlankModeAssetImport() {
  // Setup drag-drop or other asset import in editor
  const editorContainer = document.getElementById('express-editor')
  if (!editorContainer) return

  // Example: Setup file input for asset import
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.style.display = 'none'
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('Asset file selected:', file.name)
      // Handle asset import
    }
  })
  document.body.appendChild(fileInput)
}

/**
 * Summary of Implementation Options:
 *
 * 1. BLANK_ONLY
 *    - Replaces gallery completely
 *    - Simplest flow
 *    - Use BlankModeAppOnly component
 *
 * 2. HYBRID_GALLERY_PLUS_BLANK
 *    - Keeps gallery
 *    - Adds "Blank Canvas" option in gallery
 *    - Add HYBRID_BLANK_CANVAS_GALLERY_ITEM to gallery config
 *    - Existing workflow handles it
 *
 * 3. CONDITIONAL_BY_ROUTE
 *    - Admin/kiosk uses blank mode
 *    - Public uses gallery
 *    - Use HybridApp component with routing logic
 *
 * 4. ASSET_IMPORT_ENHANCEMENT
 *    - Keep existing gallery flow
 *    - Add optional asset import when in blank canvas mode
 *    - Use setupBlankModeAssetImport() in ExpressEditorHost
 *
 * Configuration via environment variables:
 * - VITE_BLANK_CANVAS_WIDTH (default: 1080)
 * - VITE_BLANK_CANVAS_HEIGHT (default: 1920)
 * - BLANK_MODE_ENABLED (true/false)
 * - GALLERY_ENABLE_BLANK_OPTION (true/false)
 */
