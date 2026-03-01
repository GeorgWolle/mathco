<script setup>
import { computed, ref, onMounted } from 'vue'
import TaskHero from './TaskHero.vue'
import Task from './Task.vue'

const props = defineProps([])

const payload = computed(() => ({
  studentId: 'schueler-demo',
  taskId: props.task.id,
  answers: props.submissionTemplate
}))

const structuredTasks = ref(null)
const activeTaskIndex = ref(0)
const loadError = ref('')
const canAdvance = ref(false)
const debugOverride = ref(false)
const taskResponses = ref({})

const totalTasks = computed(() => structuredTasks.value?.length ?? 0)
const progressPercent = computed(() => {
  if (!totalTasks.value) return 0
  return ((activeTaskIndex.value) / totalTasks.value) * 100
})
const isLastTask = computed(() => totalTasks.value > 0 && activeTaskIndex.value === totalTasks.value - 1)
const finishDisabled = computed(() => {
  if (!isLastTask.value) return true
  if (debugOverride.value) return false
  return !canAdvance.value
})

const fallbackTask = {
  meta: {
    title: 'Lade Aufgabe…',
    subtitle: 'Bitte warten.',
    progressText: '',
    progressPercent: 0,
  },
}

const currentTask = computed(() => {
  if (!structuredTasks.value) return fallbackTask
  return structuredTasks.value[activeTaskIndex.value] ?? fallbackTask
})

const fetchTaskFile = async (path) => {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const isNextDisabled = computed(() => {
  if (!structuredTasks.value) return true
  if (debugOverride.value) return false
  return !canAdvance.value
})
const isPrevDisabled = computed(() => activeTaskIndex.value <= 0)

const handleRequirementChange = (isMet) => {
  canAdvance.value = Boolean(isMet)
}

const toggleDebugOverride = () => {
  debugOverride.value = !debugOverride.value
}

const handleAnswerChange = (payload) => {
  if (!payload) return
  const key = payload.taskKey ?? `task-${activeTaskIndex.value}`
  taskResponses.value = {
    ...taskResponses.value,
    [key]: {
      ...payload,
      order: activeTaskIndex.value
    }
  }
}

const scrollToTopSmooth = () => {
  if (typeof window === 'undefined' || !window.scrollTo) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToPreviousTask = () => {
  if (activeTaskIndex.value <= 0) return
  activeTaskIndex.value -= 1
}

const goToNextTask = () => {
  if (!structuredTasks.value) return
  if (activeTaskIndex.value >= structuredTasks.value.length - 1) return
  activeTaskIndex.value += 1
  scrollToTopSmooth()
}

const downloadResults = () => {
  if (finishDisabled.value) return
  if (typeof window === 'undefined' || !window.document) return

  const answers = Object.values(taskResponses.value).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const exportPayload = {
    generatedAt: new Date().toISOString(),
    totalTasks: totalTasks.value,
    answers
  }

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'mathco-antworten.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  try {
    const data = await fetchTaskFile('/resources/tasks.json')
    structuredTasks.value = data.filter((el) => el.type === 'task')
  } catch (err) {
    console.error('Fehler beim Laden tasks_new.json', err)
    loadError.value = 'Konnte neue Aufgabenstruktur nicht laden.'
  }
})
</script>

<template>
  <section class="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
    <TaskHero
      :title="currentTask.meta.title"
      :progress-percent="progressPercent"
      progress-text=""
    />

    <section class="px-10 py-8 space-y-7">

      <Task
        :task="currentTask"
        @requirement-change="handleRequirementChange"
        @answer-change="handleAnswerChange"
      />

      <div class="flex flex-wrap items-center justify-between gap-3 mt-6">
        <button
          v-if="debugOverride"
          type="button"
          class="px-4 py-2 rounded-md font-medium transition border border-slate-200 text-slate-600 hover:border-slate-300"
          :disabled="isPrevDisabled"
          :aria-disabled="isPrevDisabled"
          :class="{ 'opacity-50 cursor-not-allowed': isPrevDisabled }"
          @click="goToPreviousTask"
        >
          Zurück
        </button>
        <button
          type="button"
          class="px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-md border border-dashed border-slate-300 text-slate-500 hover:text-slate-700"
          @click="toggleDebugOverride"
        >
          {{ debugOverride ? 'Debug deaktivieren' : 'Debug: Sperre aufheben' }}
        </button>
        <button
          v-if="isLastTask"
          type="button"
          class="px-4 py-2 rounded-md font-medium transition bg-emerald-600 text-white hover:bg-emerald-500"
          :class="{ 'cursor-not-allowed opacity-60 hover:bg-emerald-600': finishDisabled }"
          :disabled="finishDisabled"
          :aria-disabled="finishDisabled"
          @click="downloadResults"
        >
          Abschließen & Download
        </button>
        <button
          v-else
          type="button"
          class="px-4 py-2 rounded-md font-medium transition"
          :class="[
            isNextDisabled
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          ]"
          :disabled="isNextDisabled"
          :aria-disabled="isNextDisabled"
          @click="goToNextTask"
        >
          Nächstes Beispiel
        </button>
      </div>
      <!--<div v-if="loadError" class="rounded-md bg-rose-50 border border-rose-100 p-4 text-rose-700">
        {{ loadError }}
      </div>

      <div v-else-if="firstLoaded" class="rounded-lg bg-white p-4 border border-slate-100">
        <h3 class="text-lg font-semibold mb-2">Geladener Eintrag (tasks.json)</h3>
        <p class="text-sm text-slate-600 mb-3">Seite: {{ firstLoaded.page ?? '–' }}</p>
        <pre class="whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 p-4 rounded">{{ firstLoaded.text }}</pre>
      </div>

      <div v-else class="text-slate-500">Lade Aufgaben…</div>-->
    </section>
  </section>
</template>
