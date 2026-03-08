import renderMathInElement from 'katex/contrib/auto-render'
import 'katex/dist/katex.min.css'

/**
 * Rendert alle LaTeX-Ausdrücke im Container-Element mit KaTeX auto-render.
 * @param {HTMLElement} container - Das Ziel-Element (z.B. ein div oder p)
 */
export function renderField(container) {
  if (!container) return
  renderMathInElement(container, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  })
}
