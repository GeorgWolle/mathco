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

const tasks = ref([])
const activeTaskIndex = ref(0)
const loadError = ref('')
const canAdvance = ref(false)
const debugOverride = ref(false)
const taskResponses = ref({})


const totalTasks = computed(() => tasks.value.length)
const progressPercent = computed(() => {
  if (!totalTasks.value) return 0
  return ((activeTaskIndex.value + 1) / totalTasks.value) * 100
})
const isLastTask = computed(() => totalTasks.value > 0 && activeTaskIndex.value === totalTasks.value - 1)
const finishDisabled = computed(() => {
  if (!isLastTask.value) return true
  if (debugOverride.value) return false
  return !canAdvance.value
})


const currentTask = computed(() => {
  return tasks.value[activeTaskIndex.value] ?? {}
})

const fetchTaskFile = async (path) => {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const isNextDisabled = computed(() => {
  if (!tasks.value.length) return true
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
  if (!tasks.value.length) return
  if (activeTaskIndex.value >= tasks.value.length - 1) return
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
    tasks.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Fehler beim Laden tasks_new.json', err)
    loadError.value = 'Konnte Aufgaben nicht laden.'
  }
})
</script>

<template>
  <section class="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
    <template v-if="tasks.length">
      <TaskHero
        :title="currentTask.title || 'Aufgabe'"
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
      </section>
    </template>
    <template v-else>
      <div class="p-10 text-center text-slate-500 text-lg">Lade Aufgaben…</div>
    </template>
  </section>
</template>
