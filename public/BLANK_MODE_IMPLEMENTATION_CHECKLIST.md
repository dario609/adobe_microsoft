# Blank Canvas Mode - Implementation Checklist

## 📋 Pre-Implementation

- [ ] Read [BLANK_MODE_QUICK_REF.md](BLANK_MODE_QUICK_REF.md) (5 min)
- [ ] Read [BLANK_MODE_GUIDE.md](BLANK_MODE_GUIDE.md) (10 min)
- [ ] Review [BLANK_MODE_EXAMPLES.jsx](BLANK_MODE_EXAMPLES.jsx) (10 min)
- [ ] Choose integration pattern (Hybrid, Blank Only, etc.)
- [ ] Have Adobe client ID and app name ready
- [ ] Decide on canvas dimensions (e.g., 1080x1920 for mobile)

---

## 🔧 Setup & Installation

### Step 1: Copy Files
- [ ] Copy `src/utils/blankModeUtils.js` to your project
- [ ] Copy `src/hooks/useBlankModeWorkflow.js` to your project
- [ ] Copy `src/components/microsite/BlankModeLanding.jsx` to your project
- [ ] Copy `src/components/microsite/BlankModeNameModal.jsx` to your project
- [ ] Copy `src/components/microsite/styles/BlankModeLanding.css` to your project

### Step 2: Update Dependencies
- [ ] Verify React is installed (`npm list react`)
- [ ] Install any missing dependencies:
  ```bash
  npm install react react-dom
  ```

### Step 3: Configuration
- [ ] Copy `.env.blank-mode-template` to reference
- [ ] Add to your `.env`:
  ```bash
  VITE_BLANK_CANVAS_WIDTH=1080
  VITE_BLANK_CANVAS_HEIGHT=1920
  VITE_ADOBE_CLIENT_ID=your-id
  VITE_ADOBE_APP_NAME=your-app
  VITE_SESSION_SECONDS=300
  VITE_SHOW_SESSION_TIMER=true
  ```
- [ ] Verify all required env vars are set

---

## 🎯 Implementation (Choose One Pattern)

### PATTERN A: Blank Mode Only (Recommended for Kiosk)

**Steps:**

1. [ ] Delete or hide `LandingGallery.jsx` import
2. [ ] Update `App.jsx`:
   ```jsx
   import { useBlankModeWorkflow } from './hooks/useBlankModeWorkflow.js'
   import { BlankModeLanding } from './components/microsite/BlankModeLanding.jsx'
   import { BlankModeNameModal } from './components/microsite/BlankModeNameModal.jsx'

   export function App() {
     const m = useBlankModeWorkflow()
     const isEditing = m.phase === 'editing'
     
     return (
       <div className="appRoot">
         {!isEditing && (
           <BlankModeLanding
             onStart={m.startBlankMode}
             canStart={m.canStart}
             status={m.status}
           />
         )}
         {isEditing && <ExpressEditorHost isActive />}
         <BlankModeNameModal isOpen={m.showNameModal} {...m} />
         <SubmissionThanksModal isOpen={m.showSubmissionThanks} />
       </div>
     )
   }
   ```
3. [ ] Test blank canvas opens
4. [ ] Test export/upload flow
5. [ ] Test mobile responsive behavior

---

### PATTERN B: Hybrid (Gallery + Blank Option)

**Steps:**

1. [ ] Keep existing `LandingGallery.jsx`
2. [ ] Find your gallery config file (where gallery items are defined)
3. [ ] Add blank canvas option:
   ```js
   const BLANK_CANVAS_ITEM = {
     id: 'blank-canvas',
     originalName: 'Blank Canvas',
     templateType: 'blankCanvas',
     canvasWidth: 1080,
     canvasHeight: 1920,
   }
   
   const galleryItems = [
     ...existingItems,
     BLANK_CANVAS_ITEM
   ]
   ```
4. [ ] No changes to existing workflow (existing code handles it)
5. [ ] Test gallery loads with blank option
6. [ ] Test clicking blank canvas works
7. [ ] Test existing templates still work

---

### PATTERN C: Conditional by Route

**Steps:**

1. [ ] Create `BlankModeApp.jsx` using component from BLANK_MODE_EXAMPLES.jsx
2. [ ] Keep existing `App.jsx` with gallery
3. [ ] Update your router:
   ```jsx
   import { BlankModeAppOnly } from './BlankModeApp.jsx'
   import { GalleryApp } from './App.jsx'
   
   export function Root() {
     const isKiosk = window.location.pathname.includes('/kiosk')
     return isKiosk ? <BlankModeAppOnly /> : <GalleryApp />
   }
   ```
4. [ ] Test `/kiosk` route shows blank mode
5. [ ] Test `/` route shows gallery mode
6. [ ] Both flows work independently

---

### PATTERN D: Existing Gallery + Asset Import Enhancement

**Steps:**

1. [ ] Keep all existing code
2. [ ] Import in `ExpressEditorHost.jsx`:
   ```jsx
   import { setupAssetDropZone } from '../utils/blankModeUtils.js'
   ```
3. [ ] Add drag-drop setup:
   ```jsx
   useEffect(() => {
     const container = document.getElementById('express-editor')
     const cleanup = setupAssetDropZone(container, (files) => {
       // Handle dropped files
       console.log('Files dropped:', files)
     })
     return cleanup
   }, [])
   ```
4. [ ] Test drag-drop when blank canvas is selected
5. [ ] Verify file detection works

---

## ✅ Testing

### Basic Functionality Tests

- [ ] **Blank Canvas Opens**
  - [ ] Click Start
  - [ ] Enter name
  - [ ] Verify canvas visible
  - [ ] Verify canvas dimensions correct (check inspector)

- [ ] **Asset Import (if enabled)**
  - [ ] Enter image URL → verify acceptance message
  - [ ] Upload image file → verify acceptance message
  - [ ] Invalid URL → verify error message

- [ ] **Session Timer (if enabled)**
  - [ ] Verify timer appears
  - [ ] Verify countdown works (set VITE_SESSION_SECONDS=10 for quick test)
  - [ ] Verify timer resets on minute boundary

- [ ] **Export & Upload**
  - [ ] Create something in editor
  - [ ] Click Export & upload
  - [ ] Verify upload success
  - [ ] Check server for uploaded file

- [ ] **Leave Confirmation**
  - [ ] Click leave/close
  - [ ] Confirm modal appears
  - [ ] Cancel → return to editor
  - [ ] Confirm → return to landing

- [ ] **Error Handling**
  - [ ] Invalid Adobe config → see error message
  - [ ] Network down during upload → see error
  - [ ] Corrupt file upload → see error

### Mobile & Responsive

- [ ] Test on mobile device (iPhone/Android)
- [ ] Test on tablet
- [ ] Test on desktop
- [ ] Verify buttons are touch-friendly (44px+)
- [ ] Verify modals responsive
- [ ] Verify no horizontal scroll

### Accessibility

- [ ] Test keyboard navigation (Tab, Enter, Esc)
- [ ] Test screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Verify color contrast (use WebAIM tool)
- [ ] Test focus indicators visible

### Performance

- [ ] Measure blank canvas load time < 5s
- [ ] Test asset import with large image (> 5MB)
- [ ] Test session timer over 5+ minutes
- [ ] Check browser DevTools memory usage

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Safari on iOS
- [ ] Chrome on Android

---

## 📦 Deployment

### Pre-Deployment Checklist

- [ ] All files copied to project
- [ ] All imports resolve (no red squiggles)
- [ ] Environment variables configured
- [ ] No console errors
- [ ] Tests pass
- [ ] Code reviewed

### Build & Deploy

- [ ] `npm run build` succeeds
- [ ] Check bundle size (~200KB max)
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor errors for first 24h

### Post-Deployment

- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Check upload success rate
- [ ] Verify session timer works
- [ ] Spot-check uploaded files
- [ ] Gather user feedback

---

## 🐛 Troubleshooting During Implementation

### Issue: Files won't import
**Solution:**
- Check file paths are correct
- Verify all files copied
- Check import statement spelling
- Clear node_modules and reinstall

### Issue: Blank canvas won't open
**Solution:**
- Check Adobe SDK initialized (status === 'ready')
- Check VITE_ADOBE_CLIENT_ID is set
- Check browser console for errors
- Try refreshing page

### Issue: Module not found errors
**Solution:**
- Verify all dependent files copied
- Check relative import paths
- Ensure React hooks available

### Issue: Styles not showing
**Solution:**
- Check CSS file imported in component
- Verify CSS file path correct
- Check for CSS conflicts
- Use DevTools Inspector to verify CSS applies

### Issue: Export button missing
**Solution:**
- Verify original express editor loaded
- Check EXPORT_OPTIONS defined in editorConfig
- Verify Adobe SDK proper version

---

## 🚀 Post-Implementation

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor upload success rate
- [ ] Track user session duration
- [ ] Monitor assets uploaded per day
- [ ] Track error messages frequency

### Maintenance

- [ ] Monthly: Review error logs
- [ ] Monthly: Check Adobe SDK updates
- [ ] Quarterly: Review user feedback
- [ ] Yearly: Audit browser compatibility

### Enhancement Ideas

- [ ] Add more asset import sources (Google Drive, OneDrive)
- [ ] Add template customization in blank mode
- [ ] Add layer presets/starters
- [ ] Add social media export formats
- [ ] Add batch upload capability

---

## 📞 Support Resources

If you get stuck:

1. Check **BLANK_MODE_QUICK_REF.md** for API reference
2. Review **BLANK_MODE_GUIDE.md** for detailed explanation
3. Look at **BLANK_MODE_EXAMPLES.jsx** for code patterns
4. Compare with **BLANK_MODE_VS_GALLERY.md** for workflow
5. Check browser console for JavaScript errors
6. Verify all env vars are set
7. Try example apps in `BLANK_MODE_EXAMPLES.jsx`

---

## ✨ Completion Checklist

When everything is working:

- [ ] Blank canvas launches correctly
- [ ] All modals appear on cue
- [ ] Export button works
- [ ] Upload succeeds to server
- [ ] Thank you modal appears
- [ ] Session resets properly
- [ ] Error messages show appropriately
- [ ] Mobile/touch works
- [ ] Keyboard navigation works
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Tests passing
- [ ] Deployed to production
- [ ] Users can complete full flow
- [ ] Uploaded files on server

---

## 📊 Success Metrics

Track these after launch:

- **Adoption Rate:** % of users choosing blank mode
- **Completion Rate:** % of sessions that result in upload
- **Session Duration:** Average time from start to upload
- **Error Rate:** % of sessions with errors
- **User Feedback:** Qualitative feedback on UX
- **Performance:** Page load time, editor launch time
- **Uploads/Day:** Volume of assets created

Set targets and monitor weekly.

---

## 🎉 You're Done!

Once all checkboxes are checked, you have successfully implemented blank canvas mode with dynamic asset import!

**Next Steps:**
1. Celebrate! 🎊
2. Gather user feedback
3. Monitor metrics
4. Plan enhancements
5. Scale/maintain

---

**Last Updated:** April 14, 2026  
**Status:** Ready for Implementation
