<script setup>
import { ref, computed } from 'vue'
import TaskHero from './TaskHero.vue'

const props = defineProps({
  task: { type: Object, required: true }
})

const uploadError = ref('')
const uploadedResults = ref(null)

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    try {
      uploadedResults.value = JSON.parse(String(reader.result))
      uploadError.value = ''
    } catch (err) {
      uploadError.value = 'Das gewählte JSON konnte nicht gelesen werden.'
      uploadedResults.value = null
    }
  }
  reader.readAsText(file)
}

const comparisons = computed(() => {
  if (!uploadedResults.value) {
    return []
  }

  const answers = uploadedResults.value.answers || {}
  return Object.entries(props.task.solutions).map(([key, correct]) => ({
    key,
    correct,
    received: answers[key] ?? '—',
    isCorrect: answers[key] === correct
  }))
})
</script>

<template>
  <section class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
    <TaskHero
      :title="`${props.task.title} · Tutor:innenansicht`"
      :subtitle="'Auswertung'"
      :progress-percent="props.task.progressPercent"
      :progress-text="props.task.progressText"
    />

    <section class="px-10 py-8 space-y-7">
      <TaskMetadataPanel :metadata="props.task.metadata" />

      <div class="rounded-xl border border-dashed border-slate-300 p-6 bg-slate-50 space-y-4">
        <div>
          <label class="text-sm font-semibold text-slate-700">Schüler:in JSON hochladen</label>
          <input
            type="file"
            accept="application/json"
            class="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
            @change="onFileChange"
          />
          <p class="text-xs text-slate-500 mt-2">Erwartete Struktur: { taskId, answers: { ...Zuordnungen } }</p>
          <p v-if="uploadError" class="text-sm text-red-600 mt-2">{{ uploadError }}</p>
        </div>

        <div v-if="uploadedResults" class="text-sm text-slate-600">
          <p class="font-semibold">Geladene Datei:</p>
          <pre class="mt-2 bg-white rounded-lg p-4 overflow-auto max-h-48">{{ JSON.stringify(uploadedResults, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="comparisons.length" class="overflow-hidden rounded-xl border border-slate-200">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-100 text-slate-600">
            <tr>
              <th class="px-4 py-3 font-semibold">Teilaufgabe</th>
              <th class="px-4 py-3 font-semibold">Erwartet</th>
              <th class="px-4 py-3 font-semibold">Antwort Schüler:in</th>
              <th class="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in comparisons"
              :key="row.key"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-3 font-mono text-xs">{{ row.key }}</td>
              <td class="px-4 py-3">{{ row.correct }}</td>
              <td class="px-4 py-3">{{ row.received }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    row.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  ]"
                >
                  {{ row.isCorrect ? '✓ korrekt' : '✗ prüfen' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
