
<script setup>
import { computed, ref, onMounted } from 'vue'

const jsonInput = ref('')
const reviewItems = ref([])
const activeIndex = ref(0)
const parseError = ref('')
const statusMessage = ref('')
const reviewSectionRef = ref(null)
const DEFAULT_SAMPLE_PATH = '/resources/mathco-antworten.json'

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
    return {
      id: `${label}-${idx}`,
      label,
      detail,
      badge: badgeKey
    }
  })
})

const summaryFields = [
  { key: 'taskKey', label: 'Schlüssel' },
  { key: 'title', label: 'Titel' },
  { key: 'interactionType', label: 'Aufgabenformat' },
  { key: 'selectCount', label: 'Erwartete Auswahl' },
  { key: 'page', label: 'Seite' },
  { key: 'taskId', label: 'Original-ID' }
]

const currentSummary = computed(() => {
  if (!currentAnswer.value) return []
  return summaryFields
    .map((field) => ({
      label: field.label,
      value: currentAnswer.value[field.key] ?? '–'
    }))
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

onMounted(() => {
  loadDefaultSubmission()
})
</script>

<template>
  <section class="w-full rounded-3xl bg-white/95 p-8 shadow-2xl">
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
        class="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
        placeholder='{"taskId":"abc","answers":{"1":"A"}}'
      ></textarea>
      <button
        type="submit"
        class="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/40 transition hover:-translate-y-0.5 hover:bg-indigo-500"
      >
        JSON einreichen
      </button>
      <p v-if="parseError" class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-600">
        {{ parseError }}
      </p>
      <p v-else-if="statusMessage" class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
        {{ statusMessage }}
      </p>
    </form>
  </section>

  <section
    v-if="hasReviewSession"
    ref="reviewSectionRef"
    class="mt-6 w-full rounded-3xl bg-white p-8 shadow-2xl"
  >
    <header class="mb-6 space-y-2">
      <p class="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">Auswertung</p>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-2xl font-semibold text-slate-900">Antwort {{ activeIndex + 1 }} prüfen</h3>
        <span class="text-sm font-medium text-slate-500">{{ progressLabel }}</span>
      </div>
      <div class="h-2 w-full rounded-full bg-slate-100">
        <div
          class="h-2 rounded-full bg-indigo-500 transition-[width] duration-300"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
    </header>

    <section class="space-y-6">
      <div class="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-3">
        <div v-for="summary in currentSummary" :key="summary.label" class="space-y-1">
          <p class="text-xs uppercase tracking-wide text-slate-400">{{ summary.label }}</p>
          <p class="text-base font-medium text-slate-900">{{ summary.value }}</p>
        </div>
      </div>

      <div class="space-y-3 rounded-2xl border border-slate-100 p-5">
        <div class="flex items-center justify-between">
          <h4 class="text-base font-semibold text-slate-900">Auswahlen & Zuordnungen</h4>
          <span class="text-sm text-slate-500">{{ selectionRows.length }} Einträge</span>
        </div>
        <div v-if="selectionRows.length" class="space-y-3">
          <article
            v-for="row in selectionRows"
            :key="row.id"
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500" v-html="row.label" v-math-render></p>
            <p class="text-xl font-medium text-slate-900 text-center" v-html="row.detail" v-math-render></p>
            <span
              v-if="row.badge"
              class="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600"
            >
              {{ row.badge }}
            </span>
          </article>
        </div>
        <p v-else class="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          Keine Auswahl-Daten für diese Antwort gefunden.
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
          canGoNext ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-100 text-indigo-300 cursor-not-allowed'
        ]"
        :disabled="!canGoNext"
        @click="goNext"
      >
        {{ isOnLastAnswer ? 'Ende erreicht' : 'Weiter' }}
      </button>
    </footer>
  </section>
</template>
