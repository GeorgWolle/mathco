import katex from 'katex'
import 'katex/dist/katex.min.css'

export const useMathRenderer = () => {
  const escapeHtml = (text = '') =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const hasMathDelimiters = (value = '') => /\${1,2}[\s\S]+?\${1,2}/.test(value)

  const renderMath = (value, isLatex, displayMode = false) => {
    if (!value) return ''
    if (!isLatex) return value

    try {
      return katex.renderToString(value, { throwOnError: false, displayMode })
    } catch (error) {
      console.warn('KaTeX rendering failed', error)
      return value
    }
  }

  const renderRichText = (text, { treatAsLatex = false } = {}) => {
    if (!text) return ''

    const trimmed = text.trim()

    if (treatAsLatex && !hasMathDelimiters(trimmed)) {
      return renderMath(trimmed, true, trimmed.startsWith('$$') && trimmed.endsWith('$$'))
    }

    const segments = text.split(/(\${1,2}[\s\S]+?\${1,2})/g)

    return segments
      .filter(Boolean)
      .map((segment) => {
        const match = segment.match(/^(\${1,2})([\s\S]+)\1$/)
        if (match) {
          const [, delimiter, content] = match
          const displayMode = delimiter.length === 2
          return renderMath(content.trim(), true, displayMode)
        }
        return escapeHtml(segment)
      })
      .join('')
  }

  return { renderMath, renderRichText }
}
