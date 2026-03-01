<script setup>
import { computed, ref } from 'vue'
import StudentTaskView from './components/StudentTaskView.vue'
import AdminReviewView from './components/AdminReviewView.vue'

const tasks = [
  {
    id: 'task-1',
    title: '🔢 Zahlenmengen',
    subtitle: 'Aufgabe 1',
    progressText: 'Aufgabe 1 von 3',
    progressPercent: 33.33,
    headline: 'Erstes Beispiel vorbereiten',
    description:
      'Hier wird im nächsten Schritt das erste Beispiel aus dem Aufgabenpool erscheinen. Die Schüler:innen bearbeiten die Zuordnungen ohne automatisches Feedback und exportieren anschließend ihre Antworten als JSON.',
    metadata: [
      { label: 'Aufgabe', value: 'Zahlenmengen (1_1567 | Typ 1)' },
      { label: 'Prüfling', value: 'Standardisierte Reife- und Diplomprüfung (SRDP)' },
      { label: 'Bereich', value: 'Zahlenmengen (Algebra)' },
      { label: 'Punkte', value: '0 / ½ / 1 P.' }
    ],
    solutions: {
      'ℕ': 'C',
      'ℤ \ ℕ': 'D',
      'ℚ \ ℤ': 'F',
      'ℂ \ ℝ': 'E'
    }
  }
]

const mode = ref('student')
const currentTaskIndex = ref(0)

const currentTask = computed(() => tasks[currentTaskIndex.value])

const submissionTemplate = computed(() => {
  return Object.keys(currentTask.value.solutions).reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {})
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 py-10 px-4 sm:px-8">
    <div class="mx-auto flex max-w-5xl flex-col gap-6">
      <StudentTaskView v-if="mode === 'student'" :task="currentTask" :submission-template="submissionTemplate" />
      <AdminReviewView v-else :task="currentTask" />
    </div>
  </main>
</template>
