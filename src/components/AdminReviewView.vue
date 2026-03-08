
<script setup>
import { computed, ref, onMounted } from 'vue'

import Task from './Task.vue'
const tasks = ref([])
const TASKS_PATH = '/resources/tasks.json'

const loadTasks = async () => {
  try {
    const res = await fetch(TASKS_PATH)
    if (!res.ok) throw new Error(`tasks.json nicht gefunden (${res.status}).`)
    const data = await res.json()
    tasks.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Konnte tasks.json nicht laden', err)
  }
}

// Hole die Aufgabenstellung zur aktuellen Antwort
const currentTaskOriginal = computed(() => {
  if (!currentAnswer.value) return null
  // Versuche, die Aufgabe per id zu finden (taskId, id, task_id)
  const taskId = currentAnswer.value.taskId || currentAnswer.value.task_id || currentAnswer.value.id
  if (!taskId) return null
  // tasks.json: id ist meist Zahl, taskId kann String sein
  return tasks.value.find(t => String(t.id) === String(taskId) || String(t.aufgaben_id) === String(taskId)) || null
})

const jsonInput = ref('')
const reviewItems = ref([])
const activeIndex = ref(0)
const parseError = ref('')
const statusMessage = ref('')

const reviewSectionRef = ref(null)
const DEFAULT_SAMPLE_PATH = '/resources/mathco-antworten.json'
const SOLUTIONS_PATH = '/resources/solutions.json'
const solutions = ref([])
// Lösung für aktuelle Antwort finden
const currentSolution = computed(() => {
  if (!currentAnswer.value) return null
  const taskId = currentAnswer.value.taskId || currentAnswer.value.task_id || currentAnswer.value.id
  return solutions.value.find(sol => String(sol.task_id) === String(taskId)) || null
})

// Hilfsfunktion: Prüfe ob Auswahl korrekt ist (Matching oder Multi-Choice)
function isSelectionCorrect(selection, solution) {
  if (!solution) return null
  // Matching-Aufgabe
  if (Array.isArray(solution.correct_pairs) && selection.category) {
    const correct = solution.correct_pairs.find(p => p.left === selection.category)
    if (!correct) return null
    return correct.right_key === selection.selectedKey
  }
  // Multi-Choice-Aufgabe
  if (Array.isArray(solution.correct_keys) && selection.key) {
    return solution.correct_keys.includes(selection.key)
  }
  return null
}

const hasReviewSession = computed(() => reviewItems.value.length > 0)
const currentAnswer = computed(() => (hasReviewSession.value ? reviewItems.value[activeIndex.value] ?? null : null))
const progressLabel = computed(() => {
  if (!hasReviewSession.value) return '0 / 0'
  return `${activeIndex.value + 1} / ${reviewItems.value.length}`
})
const progressPercent = computed(() => {
  if (!hasReviewSession.value) return 0
  return ((activeIndex.value + 1) / reviewItems.value.length) * 100
})
const canGoPrev = computed(() => activeIndex.value > 0)
const canGoNext = computed(() => hasReviewSession.value && activeIndex.value < reviewItems.value.length - 1)
const isOnLastAnswer = computed(() => hasReviewSession.value && activeIndex.value === reviewItems.value.length - 1)

const selectionRows = computed(() => {
  if (!currentAnswer.value || !Array.isArray(currentAnswer.value.selections)) return []
  return currentAnswer.value.selections.map((selection, idx) => {
    const label = selection.category ?? selection.key ?? `Auswahl ${idx + 1}`
    const detail = selection.selectedDisplay ?? selection.display ?? selection.selectedKey ?? selection.key ?? 'Keine Auswahl'
    const badgeKey = selection.selectedKey && selection.selectedKey !== detail ? selection.selectedKey : selection.key ?? null
    // Prüfe Korrektheit
    const correct = isSelectionCorrect(selection, currentSolution.value)
    return {
      id: `${label}-${idx}`,
      label,
      detail,
      badge: badgeKey,
      correct
    }
  })
})


// Metadaten-Header: src, category, maturatermin, id, typ aus Lösung, Rest aus Antwort
const summaryFields = [
  { key: 'source', label: 'Quelle' },
  { key: 'category', label: 'Kategorie' },
  { key: 'maturatermin', label: 'Termin' },
  { key: 'id', label: 'Lösungs-ID' },
  { key: 'typ', label: 'Typ' },
]

const currentSummary = computed(() => {
  if (!currentAnswer.value && !currentSolution.value) return []
  return summaryFields
    .map((field) => {
      // src, category, maturatermin, id, typ aus Lösung, Rest aus Antwort
      let value = undefined
      if (['source', 'category', 'maturatermin', 'id', 'typ'].includes(field.key)) {
        value = currentSolution.value?.[field.key] ?? '–'
      } else {
        value = currentAnswer.value?.[field.key] ?? '–'
      }
      return {
        label: field.label,
        value
      }
    })
    .filter((entry) => entry.value !== undefined && entry.value !== null && entry.value !== '')
})

const prettyCurrentAnswer = computed(() => {
  if (!currentAnswer.value) return ''
  return JSON.stringify(currentAnswer.value, null, 2)
})

const extractAnswers = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.answers)) return payload.answers
  if (Array.isArray(payload.data?.answers)) return payload.data.answers
  if (Array.isArray(payload.payload?.answers)) return payload.payload.answers
  if (Array.isArray(payload.response?.answers)) return payload.response.answers
  return []
}

const startReview = (answers) => {
  reviewItems.value = answers
  activeIndex.value = 0
  statusMessage.value = `${answers.length} Antworten geladen.`
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      reviewSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

const handleSubmit = () => {
  parseError.value = ''
  statusMessage.value = ''
  const raw = jsonInput.value?.trim()
  if (!raw) {
    parseError.value = 'Bitte füge ein JSON ein.'
    reviewItems.value = []
    return
  }

  try {
    const parsed = JSON.parse(raw)
    const answers = extractAnswers(parsed)
    if (!answers.length) {
      throw new Error('Keine Antworten im JSON gefunden.')
    }
    startReview(answers)
  } catch (err) {
    parseError.value = err?.message ?? 'Ungültiges JSON. Bitte prüfen.'
    reviewItems.value = []
  }
}

const goPrev = () => {
  if (!canGoPrev.value) return
  activeIndex.value -= 1
}

const goNext = () => {
  if (!canGoNext.value) return
  activeIndex.value += 1
}

const loadDefaultSubmission = async () => {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch(DEFAULT_SAMPLE_PATH)
    if (!res.ok) throw new Error(`Beispiel nicht gefunden (${res.status}).`)
    const payload = await res.json()
    jsonInput.value = JSON.stringify(payload, null, 2)
    const answers = extractAnswers(payload)
    if (answers.length) {
      startReview(answers)
      statusMessage.value = `Beispielantwort geladen (${answers.length} Einträge).`
    } else {
      statusMessage.value = 'Beispieldatei geladen, aber keine Antworten gefunden.'
    }
  } catch (err) {
    console.warn('Konnte mathco-antworten.json nicht laden', err)
  }
}


// Lösungen laden
const loadSolutions = async () => {
  try {
    const res = await fetch(SOLUTIONS_PATH)
    if (!res.ok) throw new Error(`Lösungen nicht gefunden (${res.status}).`)
    const data = await res.json()
    solutions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Konnte solutions.json nicht laden', err)
  }
}

onMounted(() => {
  loadDefaultSubmission()
  loadSolutions()
  loadTasks()
})
</script>

<template>
  <section class="w-full rounded-3xl bg-surface p-8 shadow-accent my-8">
    <header class="mb-8 space-y-2 text-slate-800">
      <p class="text-sm uppercase tracking-[0.35em] text-slate-500">Admin Review</p>
      <h2 class="text-3xl font-semibold text-slate-900">Hallo, liebe Tutor:innen 👋</h2>
      <p class="text-base text-slate-600">
        Füge hier die JSON-Antwort deiner Schüler:innen ein, um sie später zu prüfen.
      </p>
    </header>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <label class="block text-sm font-semibold text-slate-700">Antwort als JSON</label>
      <textarea
        v-model="jsonInput"
        class="min-h-[220px] w-full rounded-xl border border-[var(--border)] bg-surface2 p-4 font-mono text-sm text-[var(--text)] focus:border-accent2 focus:bg-surface focus:outline-none"
        placeholder='{"taskId":"abc","answers":{"1":"A"}}'
      ></textarea>
      <button
        type="submit"
        class="inline-flex w-full items-center justify-center rounded-xl bg-accent2 px-5 py-3 text-sm font-semibold tracking-wide text-surface shadow-accent2 transition hover:-translate-y-0.5 hover:bg-accent2/80"
      >
        JSON einreichen
      </button>
      <p v-if="parseError" class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-600">
        {{ parseError }}
      </p>
      <p v-else-if="statusMessage" class="rounded-xl border border-accent2 bg-surface2 px-4 py-2 text-sm text-accent2 flex items-center gap-2">
        <span aria-hidden="true">🥳</span>
        <span>{{ statusMessage }}</span>
      </p>
    </form>
  </section>

  <section
    v-if="hasReviewSession"
    ref="reviewSectionRef"
    class="mt-8 w-full rounded-3xl bg-surface p-8 shadow-accent"
  >
    <header class="mb-6 space-y-2">
      <p class="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-500">Auswertung</p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-2xl font-semibold text-slate-900">Antwort {{ activeIndex + 1 }} prüfen</h3>
        <span class="text-sm font-medium text-slate-500">{{ progressLabel }}</span>
      </div>
      <div class="h-3 w-full rounded-full bg-yellow-100/80 border border-yellow-200 overflow-hidden relative mt-2 mb-2">
        <div
          class="h-full rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-inner transition-[width] duration-300"
          :style="{ width: `${progressPercent}%` }"
        ></div>
        <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-yellow-900/80 select-none">
          {{ Math.round(progressPercent) }}% 🎯
        </span>
      </div>
    </header>

    <section class="space-y-6">
      <div class="grid gap-4 rounded-xl border border-[var(--border)] bg-surface2 p-5 sm:grid-cols-3">
        <div v-for="summary in currentSummary" :key="summary.label" class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-slate-400">{{ summary.label }}</p>
          <p class="text-base font-medium text-slate-900">
            <template v-if="summary.label === 'Quelle' && summary.value && summary.value !== '–'">
              <a :href="summary.value" target="_blank" rel="noopener" class="underline text-emerald-700 hover:text-emerald-500">
                {{ summary.value.split('/').pop() }}
              </a>
            </template>
            <template v-else>
              {{ summary.value }}
            </template>
          </p>
        </div>
      </div>


        <details class="rounded-xl border border-accent2 bg-surface2 p-4 text-sm text-accent2 mb-4" :open="false">
          <summary class="cursor-pointer text-sm font-semibold text-accent2">Original Aufgabenstellung anzeigen</summary>
          <div v-if="currentTaskOriginal" class="mt-4">
            <Task :task="currentTaskOriginal" />
          </div>
          <div v-else class="italic text-slate-400">Keine Aufgabenstellung gefunden.</div>
        </details>

      <div class="space-y-3 rounded-xl border border-[var(--border)] bg-surface2 p-5">
        <div class="flex items-center justify-between">
          <h4 class="text-base font-semibold text-slate-900">Auswahlen & Zuordnungen</h4>
          <span class="text-sm text-slate-500">{{ selectionRows.length }} Einträge</span>
        </div>
        <div v-if="selectionRows.length" class="space-y-3">
          <article
            v-for="row in selectionRows"
            :key="row.id"
            class="rounded-xl border border-[var(--border)] bg-surface p-4 shadow-accent2 flex flex-col gap-2"
          >
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-slate-500 flex-1" v-html="row.label" v-math-render></p>
              <span v-if="row.correct === true" class="inline-flex items-center rounded-full bg-surface2 px-2 py-0.5 text-xs font-semibold text-accent3 border border-accent3">✔️ korrekt! 🎉</span>
              <span v-else-if="row.correct === false" class="inline-flex items-center rounded-full bg-surface2 px-2 py-0.5 text-xs font-semibold text-accent4 border border-accent4">✗ leider falsch 😅</span>
            </div>
            <p class="text-xl font-medium text-slate-900 text-center" v-html="row.detail" v-math-render></p>
            <span
              v-if="row.badge"
              class="mt-2 inline-flex items-center rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-accent2 border border-accent2"
            >
              {{ row.badge }}
            </span>
          </article>
        </div>
              <div v-if="currentSolution && currentSolution.loesungsweg && currentSolution.loesungsweg.length" class="mt-6 rounded-xl border border-accent2 bg-surface2 p-5">
                <h4 class="text-base font-semibold text-accent2 mb-2">Lösungsweg</h4>
                <ol class="list-decimal list-inside space-y-1">
                  <li v-for="step in currentSolution.loesungsweg" :key="step.step" class="text-slate-800" v-html="step.text" v-math-render></li>
                </ol>
              </div>
        <p v-else class="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-muted flex items-center gap-2">
          <span aria-hidden="true">💡</span>
          <span>Keine Auswahl-Daten für diese Antwort gefunden. Weiter so!</span>
        </p>
      </div>

      <details class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
        <summary class="cursor-pointer text-sm font-semibold text-slate-700">Rohdaten anzeigen</summary>
        <pre class="mt-3 overflow-auto rounded-xl bg-white p-4 text-xs text-slate-800">{{ prettyCurrentAnswer }}</pre>
      </details>
    </section>

    <footer class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition"
        :class="[
          canGoPrev ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400 cursor-not-allowed'
        ]"
        :disabled="!canGoPrev"
        @click="goPrev"
      >
        Zurück
      </button>
      <span class="text-sm font-medium text-slate-500">{{ progressLabel }}</span>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition"
        :class="[
          canGoNext ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' : 'bg-yellow-100 text-yellow-300 cursor-not-allowed'
        ]"
        :disabled="!canGoNext"
        @click="goNext"
      >
        <span v-if="isOnLastAnswer">Ende erreicht 🎊</span>
        <span v-else>Weiter ➡️</span>
      </button>
    </footer>
  </section>
</template>
