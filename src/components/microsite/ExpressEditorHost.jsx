import { EXPRESS_PARENT_ELEMENT_ID } from '../../adobe/editorConfig.js'

export function ExpressEditorHost({ isActive }) {
  return (
    <div className="editorShell" aria-hidden={!isActive}>
      <div
        id={EXPRESS_PARENT_ELEMENT_ID}
        className={
          isActive ? 'microsite__editor microsite__editor--visible' : 'microsite__editor microsite__editor--idle'
        }
      />
    </div>
  )
}
