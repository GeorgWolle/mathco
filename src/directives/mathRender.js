// src/directives/mathRender.js
import { renderField } from '../composables/useAutoMathRender'

export default {
  mounted(el) {
    renderField(el)
  },
  updated(el) {
    renderField(el)
  }
}
