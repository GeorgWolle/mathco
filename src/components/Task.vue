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
  <article class="border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50 p-8 space-y-6">

    <header class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span
          class="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700"
        >
          Aufgabe {{ props.task.id ?? '–' }}
        </span>
        <span v-if="page" class="text-xs font-medium text-slate-500">
          Seite {{ page }}
        </span>
      </div>
      <h2 class="text-3xl font-semibold leading-tight text-indigo-900">
        {{ category }}
      </h2>
    </header>



    <section v-if="intro" class="mb-2">
      <p class="text-base text-slate-600" v-html="intro" v-math-render></p>
    </section>

    <section v-if="props.task.aufgabenstellung" class="mb-2">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-500 mb-1">Aufgabenstellung</h3>
      <p class="text-base text-slate-700" v-html="props.task.aufgabenstellung" v-math-render></p>
    </section>

    <section v-if="isMatchingTask && pairs.length" class="space-y-3">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-500">Zuordnungsaufgabe</h3>
      <p v-if="instruction" class="text-sm text-slate-600" v-html="instruction" v-math-render></p>
      <div class="grid gap-5 md:grid-cols-2">
        <div
          v-for="(pair, idx) in pairs"
          :key="pair.left + '-' + idx"
          class="rounded-2xl border border-indigo-100 bg-white px-5 py-6 shadow-sm space-y-4"
        >
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Menge {{ idx + 1 }}</p>
            <p class="mt-2 text-2xl font-semibold text-indigo-900" v-html="pair.left" v-math-render></p>
          </div>
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

    <section v-if="isMultiChoiceTask && choices.length" class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-500">Antwortoptionen</h3>
        <p v-if="instruction" class="text-sm text-slate-600" v-html="instruction" v-math-render></p>
        <p v-if="selectCount" class="text-xs font-semibold uppercase text-slate-500">
          Wähle {{ selectCount }} Optionen.
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <button
          v-for="option in choices"
          :key="`choice-${option.key}`"
          type="button"
          class="flex items-center justify-between rounded-2xl border px-4 py-4 text-left shadow-sm transition"
          :class="[
            isChoiceSelected(option.key)
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-indigo-300'
          ]"
          :aria-pressed="isChoiceSelected(option.key)"
          @click="toggleChoiceSelection(option.key)"
        >
          <div class="flex items-center gap-4">
            <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {{ option.key }}
            </span>
            <div class="text-base font-medium text-slate-800" v-html="option.display" v-math-render></div>
          </div>
          <svg
            v-if="isChoiceSelected(option.key)"
            class="h-5 w-5 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.563a1 1 0 0 1-1.434-.01l-3.5-3.563a1 1 0 1 1 1.44-1.39l2.787 2.837 6.787-6.84a1 1 0 0 1 1.414-.01z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
      <p class="text-sm text-slate-500">
        Ausgewählt: {{ choiceSelections.length }}
        <span v-if="selectCount">
          / {{ selectCount }}
        </span>
      </p>
    </section>

    <section v-if="punkte || bewertung" class="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm">
      <p v-if="punkte" class="font-semibold text-slate-700">
        Punkte: {{ punkte }}
      </p>
      <p v-if="bewertung" class="text-slate-600" :class="{ 'mt-2': punkte }">
        {{ bewertung }}
      </p>
    </section>
  </article>
</template>
