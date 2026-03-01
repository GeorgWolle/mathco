<script setup>
import { computed, ref, onMounted } from 'vue'
import TaskHero from './TaskHero.vue'
import Task from './Task.vue'

const props = defineProps({
  task: { type: Object, required: true },
  submissionTemplate: { type: Object, required: true }
})

const payload = computed(() => ({
  studentId: 'schueler-demo',
  taskId: props.task.id,
  answers: props.submissionTemplate
}))

const structuredTasks = ref(null)
const activeTaskIndex = ref(0)
const loadError = ref('')

const fallbackTask = {
  headline: 'Lade Aufgabe…',
  description: 'Bitte warten.'
}

const fetchTaskFile = async (path) => {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
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
  <section class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
    <TaskHero
      :title="props.task.title"
      :subtitle="props.task.subtitle"
      :progress-percent="props.task.progressPercent"
      :progress-text="props.task.progressText"
    />

    <section class="px-10 py-8 space-y-7">

      <Task :task="structuredTasks ? structuredTasks[activeTaskIndex] : fallbackTask" />

      <div class="flex justify-end mt-6">
        <button
          type="button"
          class="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
          aria-disabled="true"
          @click="activeTaskIndex++"
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
