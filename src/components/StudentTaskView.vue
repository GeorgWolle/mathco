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

const dotStates = computed(() => {
  return tasks.value.map((_, i) => {
    if (i === activeTaskIndex.value) return 'active'
    if (i < activeTaskIndex.value) return 'done'
    return ''
  })
})

const heroTitle = computed(() => {
  const cat = currentTask.value?.category
  return cat || 'Algebra & Gleichungen'
})
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
  <section>
    <template v-if="tasks.length">
      <section class="px-10 py-8 space-y-7">
        <TaskHero
          :title="heroTitle"
          :progress-percent="progressPercent"
          :active-index="activeTaskIndex"
          :total="totalTasks"
          :dot-states="dotStates"
        />
        <Task
          :task="currentTask"
          @requirement-change="handleRequirementChange"
          @answer-change="handleAnswerChange"
        />
        <div class="flex flex-wrap items-center justify-between gap-3 mt-6">
        <button
          v-if="debugOverride"
          type="button"
          class="font-syne font-semibold text-[0.88rem] flex items-center gap-2 rounded-xl px-5 py-3 transition hover:-translate-y-px border border-[var(--border)] bg-[var(--surface2)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
          :disabled="isPrevDisabled"
          :aria-disabled="isPrevDisabled"
          :class="{ 'opacity-40 cursor-not-allowed pointer-events-none': isPrevDisabled }"
          @click="goToPreviousTask"
        >
          ← Zurück
        </button>
        <button
          type="button"
          class="font-syne text-[0.78rem] font-semibold uppercase tracking-wide rounded-xl px-4 py-2 border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition"
          @click="toggleDebugOverride"
        >
          {{ debugOverride ? 'Debug deaktivieren' : 'Debug: Sperre aufheben' }}
        </button>
        <button
          v-if="isLastTask"
          type="button"
          class="font-syne font-semibold text-[0.88rem] flex items-center gap-2 rounded-xl px-6 py-3 text-white transition hover:-translate-y-px"
          :style="finishDisabled ? 'opacity:0.4;cursor:default' : 'background:linear-gradient(135deg,var(--accent),#5a53d4);box-shadow:0 4px 16px rgba(0,0,0,0.3)'"
          :disabled="finishDisabled"
          :aria-disabled="finishDisabled"
          @click="() => { downloadResults(); $emit('show-confetti'); }"
        >
          <span aria-hidden="true">🎉</span>
          <span>Super, alles geschafft! Download</span>
        </button>
        <button
          v-else
          type="button"
          class="font-syne font-semibold text-[0.88rem] flex items-center gap-2 rounded-xl px-6 py-3 text-white transition hover:-translate-y-px"
          :style="isNextDisabled ? 'background:var(--surface2);color:var(--text-muted);cursor:default;border:1.5px solid var(--border)' : 'background:linear-gradient(135deg,var(--accent),#5a53d4);box-shadow:0 4px 16px rgba(0,0,0,0.3)'"
          :disabled="isNextDisabled"
          :aria-disabled="isNextDisabled"
          @click="goToNextTask"
        >
          <span>Nächstes Beispiel</span>
        </button>
        </div>
      </section>
    </template>
    <template v-else>
      <div class="p-10 text-center text-slate-500 text-lg">Lade Aufgaben…</div>
    </template>
  </section>
</template>
