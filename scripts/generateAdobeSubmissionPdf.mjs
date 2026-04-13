/**
 * Generates docs/ADOBE_INTEGRATION_SUBMISSION.pdf from the Markdown source.
 * Run: node scripts/generateAdobeSubmissionPdf.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const mdPath = path.join(root, 'docs', 'ADOBE_INTEGRATION_SUBMISSION.md')
const outPath = path.join(root, 'docs', 'ADOBE_INTEGRATION_SUBMISSION.pdf')

const md = fs.readFileSync(mdPath, 'utf8')
const lines = md.split(/\r?\n/)

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 54, bottom: 54, left: 50, right: 50 },
})
const stream = fs.createWriteStream(outPath)
doc.pipe(stream)

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
let listDepth = 0

function plain(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1')
}

function writeParagraph(text, opts = {}) {
  const t = plain(text).trim()
  if (!t) {
    doc.moveDown(0.35)
    return
  }
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size ?? 10.5)
  doc.text(t, {
    width: pageWidth,
    align: opts.align ?? 'left',
    lineGap: 2,
  })
  doc.moveDown(opts.after ?? 0.4)
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const trimmed = line.trim()

  if (trimmed === '---') {
    doc.moveDown(0.5)
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke()
    doc.strokeColor('#000000')
    doc.moveDown(0.75)
    continue
  }

  if (trimmed.startsWith('# ')) {
    doc.moveDown(0.6)
    writeParagraph(trimmed.slice(2), { size: 16, bold: true, after: 0.5 })
    continue
  }
  if (trimmed.startsWith('## ')) {
    doc.moveDown(0.45)
    writeParagraph(trimmed.slice(3), { size: 13, bold: true, after: 0.35 })
    continue
  }
  if (trimmed.startsWith('### ')) {
    doc.moveDown(0.3)
    writeParagraph(trimmed.slice(4), { size: 11.5, bold: true, after: 0.3 })
    continue
  }

  if (trimmed.startsWith('|') && trimmed.includes('|')) {
    // Table row: render as monospace-style line (simple)
    if (trimmed.match(/^\|[\s-:|]+\|$/)) continue // separator
    writeParagraph(trimmed.replace(/\|/g, '  ').replace(/\s+/g, ' ').trim(), { size: 9.5, after: 0.2 })
    continue
  }

  if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
    writeParagraph('• ' + trimmed.slice(5).trim(), { after: 0.25 })
    continue
  }

  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    const indent = '  '.repeat(listDepth)
    writeParagraph(indent + '• ' + trimmed.slice(2), { after: 0.22 })
    continue
  }

  if (trimmed.startsWith('1. ') || /^\d+\.\s/.test(trimmed)) {
    writeParagraph(trimmed.replace(/^\d+\.\s/, ''), { after: 0.22 })
    continue
  }

  if (!trimmed) {
    doc.moveDown(0.25)
    continue
  }

  writeParagraph(line, { after: 0.35 })
}

doc.end()

await new Promise((resolve, reject) => {
  stream.on('finish', resolve)
  stream.on('error', reject)
})

console.log('Wrote', outPath)
