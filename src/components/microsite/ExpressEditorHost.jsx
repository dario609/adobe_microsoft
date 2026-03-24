import { EXPRESS_PARENT_ELEMENT_ID } from '../../adobe/editorConfig.js'

export function ExpressEditorHost({ isActive }) {
  return (
    <div
      id={EXPRESS_PARENT_ELEMENT_ID}
      className={
        isActive ? 'microsite__editor microsite__editor--visible' : 'microsite__editor microsite__editor--idle'
      }
      aria-hidden={!isActive}
    />
  )
}
