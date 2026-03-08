<script setup>
import { computed, ref, watch } from 'vue'
import TaskOptionDropdown from './TaskOptionDropdown.vue'


const props = defineProps({
  task: { type: Object, required: true }
})
console.log(props.task);
const emit = defineEmits(['requirement-change', 'answer-change'])


// Reaktive Ableitungen aus props.task
const title = computed(() => props.task.title || 'Aufgabe')
const page = computed(() => props.task.page)
const category = computed(() => props.task.category || '')
const intro = computed(() => props.task.intro || '')
const instruction = computed(() => props.task.interaction?.instruction || '')
const selectCount = computed(() => props.task.interaction?.select_count || null)
const interactionType = computed(() => props.task.interaction?.type || null)
const pairs = computed(() => props.task.interaction?.pairs || [])
const choices = computed(() => (props.task.interaction?.choices || []).map(opt => ({
  key: opt.key,
  display: opt.value
})))
const punkte = computed(() => props.task.meta?.punkte || '')
const bewertung = computed(() => props.task.meta?.bewertung || '')



const setSelections = ref([])
const choiceSelections = ref([])

// Reset States bei Taskwechsel
watch(
  () => props.task,
  () => {
    setSelections.value = pairs.value.map(() => '')
    choiceSelections.value = []
  },
  { immediate: true, deep: true }
)


watch(
  () => interactionType,
  () => {
    choiceSelections.value = []
  },
  { immediate: true }
)


watch(
  () => choices,
  () => {
    choiceSelections.value = []
  }
)


const isMatchingTask = computed(() => interactionType.value === 'matching')
const isMultiChoiceTask = computed(() => interactionType.value === 'multi_choice')



const toggleChoiceSelection = (label) => {
  if (!label) return
  const limit = selectCount.value
  const current = [...choiceSelections.value]
  const existingIndex = current.indexOf(label)
  if (existingIndex >= 0) {
    current.splice(existingIndex, 1)
  } else {
    if (limit && current.length >= limit) {
      return
    }
    current.push(label)
  }
  choiceSelections.value = current
}



const isChoiceSelected = (label) => choiceSelections.value.includes(label)





const filledSetSelections = () => setSelections.value.filter(Boolean).length
const requiredMatchingSelections = () => {
  if (!isMatchingTask.value) return 0
  const configured = Number(selectCount.value)
  if (Number.isFinite(configured) && configured > 0) return configured
  return pairs.value.length
}

const matchingRequirementMet = () => {
  if (!isMatchingTask.value) return true
  const required = requiredMatchingSelections()
  if (!required) return true
  return filledSetSelections() >= required
}

const requiredChoiceSelections = () => {
  if (!isMultiChoiceTask.value) return 0
  const configured = Number(selectCount.value)
  if (Number.isFinite(configured) && configured > 0) return configured
  return choices.value.length ? 1 : 0
}

const multiChoiceRequirementMet = () => {
  if (!isMultiChoiceTask.value) return true
  const required = requiredChoiceSelections()
  if (!required) return choices.value.length === 0
  return choiceSelections.value.length >= required
}

const hasMetSelectionRequirement = () => {
  if (isMatchingTask.value) return matchingRequirementMet()
  if (isMultiChoiceTask.value) return multiChoiceRequirementMet()
  return true
}



watch(
  hasMetSelectionRequirement,
  (isMet) => {
    emit('requirement-change', isMet)
  },
  { immediate: true }
)



const taskKey = computed(() => {
  if (props.task?.id !== undefined && props.task?.id !== null) {
    return String(props.task.id)
  }
  if (page.value !== undefined && page.value !== null) {
    return `page-${page.value}`
  }
  if (props.task?.meta?.task_id) {
    return String(props.task.meta.task_id)
  }
  if (title.value) {
    return title.value
  }
  return `task-${props.task?.page ?? 0}`
})



const optionLookup = computed(() => {
  const map = {}
  choices.value.forEach((option) => {
    map[option.key] = option
  })
  return map
})



const buildAnswerPayload = () => {
  const base = {
    taskKey: taskKey.value,
    taskId: props.task?.id ?? null,
    page: page.value ?? null,
    title: title.value ?? '',
    interactionType: interactionType.value ?? null,
    selectCount: selectCount.value ?? null
  }

  if (isMatchingTask.value) {
    return {
      ...base,
      selections: pairs.value.map((pair, idx) => {
        const selectedKey = setSelections.value[idx] || null
        const option = selectedKey ? optionLookup.value[selectedKey] : null
        return {
          category: pair.left,
          selectedKey,
          selectedDisplay: option?.display ?? null
        }
      })
    }
  }

  if (isMultiChoiceTask.value) {
    return {
      ...base,
      selections: choiceSelections.value.map((label) => {
        const option = optionLookup.value[label] ?? null
        return {
          key: label,
          display: option?.display ?? null
        }
      })
    }
  }

  return base
}

const emitAnswerChange = () => {
  emit('answer-change', buildAnswerPayload())
}

watch(
  [() => setSelections.value, () => choiceSelections.value],
  () => {
    emitAnswerChange()
  },
  { deep: true, immediate: true }
)
</script>


<template>
  <!-- Question Card -->
  <div class="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-8 py-7 mb-5">
    <!-- Linker Akzent-Balken -->
    <div class="absolute inset-y-0 left-0 w-1 rounded-l bg-[var(--accent)]"></div>

    <!-- q-header -->
    <div class="flex items-start gap-[14px] mb-5">
      <!-- q-number Badge -->
      <div
        class="flex shrink-0 items-center justify-center h-9 min-w-[36px] rounded-[10px] font-syne font-bold text-[0.9rem] text-[var(--text)]"
        style="background: linear-gradient(135deg, var(--accent), #5a53d4); box-shadow: 0 4px 12px rgba(124,111,247,0.3);"
      >
        {{ props.task.id ?? '–' }}
      </div>
      <!-- Titel / Kategorie -->
      <div>
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1">
          {{ category || 'Aufgabe' }}<span v-if="page"> · Seite {{ page }}</span>
        </p>
        <p class="text-[1.02rem] leading-[1.65] font-semibold text-[var(--text)]">
          {{ title }}
        </p>
      </div>
    </div>

    <!-- Intro / Kontext -->
    <section v-if="intro" class="mb-4">
      <p class="text-[0.93rem] leading-[1.7] text-[var(--text-muted)]" v-html="intro" v-math-render></p>
    </section>

    <!-- Aufgabenstellung -->
    <section v-if="props.task.aufgabenstellung" class="mb-5">
      <p class="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[var(--accent3)] mb-2">Aufgabenstellung</p>
      <p class="text-[1.02rem] leading-[1.65] text-[var(--text)]" v-html="props.task.aufgabenstellung" v-math-render></p>
    </section>

    <!-- Zuordnungsaufgabe -->
    <section v-if="isMatchingTask && pairs.length" class="space-y-4 mt-4">
      <p class="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">Zuordnungsaufgabe</p>
      <p v-if="instruction" class="text-[0.93rem] text-[var(--text-muted)]" v-html="instruction" v-math-render></p>
      <div class="grid gap-5 md:grid-cols-2">
        <div v-for="(pair, idx) in pairs" :key="pair.left + '-' + idx">
          <p class="text-[0.7rem] uppercase tracking-wide text-[var(--text-muted)] mb-1">Menge {{ idx + 1 }}</p>
          <p class="text-2xl font-semibold text-[var(--text)] mb-2" v-html="pair.left" v-math-render></p>
          <TaskOptionDropdown
            v-model="setSelections[idx]"
            :options="choices"
            :dropdown-id="`set-select-${idx}`"
            label="Zuordnung wählen"
            placeholder="Option auswählen"
          />
        </div>
      </div>
    </section>

    <!-- Multi-Choice -->
    <section v-if="isMultiChoiceTask && choices.length" class="space-y-4 mt-4">
      <div>
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--accent)] mb-1">Antwortoptionen</p>
        <p v-if="instruction" class="text-[0.93rem] text-[var(--text-muted)]" v-html="instruction" v-math-render></p>
        <p v-if="selectCount" class="text-[0.75rem] font-semibold uppercase text-[var(--text-muted)] mt-1">
          Wähle {{ selectCount }} Optionen.
        </p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="option in choices"
          :key="`choice-${option.key}`"
          type="button"
          class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition"
          :class="[
            isChoiceSelected(option.key)
              ? 'border-[var(--accent)] bg-[var(--surface2)]'
              : 'border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)]'
          ]"
          :aria-pressed="isChoiceSelected(option.key)"
          @click="toggleChoiceSelection(option.key)"
        >
          <div class="flex items-center gap-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-semibold border"
              :class="isChoiceSelected(option.key)
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]'"
            >
              {{ option.key }}
            </span>
            <div class="text-[0.93rem] text-[var(--text)]" v-html="option.display" v-math-render></div>
          </div>
          <svg
            v-if="isChoiceSelected(option.key)"
            class="h-5 w-5 shrink-0 text-[var(--accent)]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.563a1 1 0 0 1-1.434-.01l-3.5-3.563a1 1 0 1 1 1.44-1.39l2.787 2.837 6.787-6.84a1 1 0 0 1 1.414-.01z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <p class="text-[0.82rem] text-[var(--text-muted)]">
        Ausgewählt: {{ choiceSelections.length }}<span v-if="selectCount"> / {{ selectCount }}</span>
      </p>
    </section>

    <!-- Punkte / Bewertung -->
    <section v-if="punkte || bewertung" class="rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-5 py-4 text-sm mt-6">
      <p v-if="punkte" class="font-semibold font-syne text-[var(--accent3)]">Punkte: {{ punkte }}</p>
      <p v-if="bewertung" class="text-[var(--text-muted)]" :class="{ 'mt-2': punkte }">{{ bewertung }}</p>
    </section>
  </div>
</template>
