import { EXPRESS_PARENT_ELEMENT_ID } from '../../adobe/editorConfig.js'

export function ExpressEditorHost({ isActive }) {
  return (
    <div className="editorShell" aria-hidden={!isActive}>
      <div className="editorStage">
        <div className="editorStage__frame">
          <div className="editorStage__frameInner">
            <div
              id={EXPRESS_PARENT_ELEMENT_ID}
              className={
                isActive
                  ? 'microsite__editor microsite__editor--visible'
                  : 'microsite__editor microsite__editor--idle'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
