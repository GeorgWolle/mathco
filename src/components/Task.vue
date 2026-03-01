<script setup>
import { computed, ref, watch } from 'vue'
import TaskOptionDropdown from './TaskOptionDropdown.vue'
import { useMathRenderer } from '../composables/useMathRenderer'

const props = defineProps({
  task: { type: Object, required: true }
})

const emit = defineEmits(['requirement-change', 'answer-change'])

const splitTitle = (title = '') => {
  const tokens = title
    .split('/')
    .map((token) => token.trim())
    .filter(Boolean)

  return {
    heading: tokens[0] || title || 'Aufgabe',
    badges: tokens.slice(1)
  }
}

const optionLabelPattern = /^[A-ZÄÖÜ]$/u
const isLikelySetLine = (line) => /^[ℕℤℚℂℝ][\s\\ℕℤℚℂℝ]*$/u.test(line)

const sanitizeParagraphs = (text = '') =>
  text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

const { renderMath, renderRichText } = useMathRenderer()

const parseLegacyTaskText = (text = '') => {
  if (!text) {
    return { intro: [], instructions: [], sets: [], options: [], scoring: '' }
  }

  const sanitized = text
    .replace(/\r\n/g, '\n')
    .replace(/-\n/g, '')
    .replace(/\u00A0/g, ' ')

  const rawLines = sanitized
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const sections = { intro: [], instructions: [], sets: [], options: [], scoring: '' }
  let stage = 'intro'
  let currentOption = null

  const flushOption = () => {
    if (!currentOption) return
    sections.options.push({
      label: currentOption.label,
      value: currentOption.valueLines.join(' ').replace(/\s+/g, ' ').trim()
    })
    currentOption = null
  }

  rawLines.forEach((line) => {
    if (line === 'Aufgabenstellung:') {
      stage = 'instructions'
      return
    }

    if (/^\[.+\]$/.test(line)) {
      sections.scoring = line
      return
    }

    if (optionLabelPattern.test(line)) {
      flushOption()
      currentOption = { label: line, valueLines: [] }
      stage = 'options'
      return
    }

    if (currentOption) {
      currentOption.valueLines.push(line)
      return
    }

    if (stage === 'intro') {
      sections.intro.push(line)
      return
    }

    if (stage === 'instructions') {
      if (isLikelySetLine(line)) {
        stage = 'sets'
        sections.sets.push(line)
        return
      }
      sections.instructions.push(line)
      return
    }

    if (stage === 'sets') {
      sections.sets.push(line)
    }
  })

  flushOption()
  return sections
}

const buildStructuredFromNew = () => {
  const meta = props.task?.meta ?? {}
  const interaction = props.task?.interaction ?? {}
  const textValue = props.task?.text ?? ''
  const paragraphs = sanitizeParagraphs(textValue)
  const textIsLatex = Boolean(props.task?.text_latex)

  const intro = paragraphs.length > 1 ? [paragraphs[0]] : []
  const instructions = paragraphs.length > 1 ? paragraphs.slice(1) : paragraphs

  return {
    heading: meta.title ?? props.task.task ?? 'Aufgabe',
    badges: [meta.term, meta.task_id, meta.aufgabentyp, meta.grundkompetenz].filter(Boolean),
    intro,
    instructions,
    textIsLatex,
    interactionInstruction: interaction.instruction ?? '',
    interactionInstructionIsLatex: Boolean(interaction.instruction_latex),
    selectCount: interaction.select_count ?? interaction.selectCount ?? null,
    interactionType: interaction.type ?? null,
    sets: (interaction.categories ?? []).map((category, idx) => ({
      id: `${category.label}-${idx}`,
      label: category.label,
      isLatex: Boolean(category.label_latex)
    })),
    options: (interaction.choices ?? []).map((choice) => ({
      label: choice.key,
      value: choice.display,
      isLatex: Boolean(choice.latex)
    })),
    scoring: meta.punkte ?? '',
    evaluationNote: meta.bewertung ?? '',
    page: props.task?.page ?? null,
    isStructured: true
  }
}

const buildLegacyStructure = () => {
  const baseTitle = props.task?.task ?? props.task?.headline ?? 'Aufgabe'
  const textSource = props.task?.text ?? props.task?.description ?? ''
  const { heading, badges } = splitTitle(baseTitle)
  const sections = parseLegacyTaskText(textSource)

  if (!textSource && props.task?.description) {
    sections.intro = [props.task.description]
  }

  return {
    heading,
    badges,
    intro: sections.intro,
    instructions: sections.instructions,
    textIsLatex: false,
    interactionInstruction: '',
    interactionInstructionIsLatex: false,
    selectCount: null,
    interactionType: sections.sets.length ? 'matching' : null,
    sets: sections.sets.map((label, idx) => ({
      id: `${label}-${idx}`,
      label,
      isLatex: false
    })),
    options: sections.options.map((option) => ({
      label: option.label,
      value: option.value,
      isLatex: false
    })),
    scoring: sections.scoring,
    evaluationNote: '',
    page: props.task?.page ?? null,
    isStructured: false
  }
}

const structuredTask = computed(() =>
  props.task?.meta && props.task?.interaction ? buildStructuredFromNew() : buildLegacyStructure()
)

const setSelections = ref([])

watch(
  () => structuredTask.value.sets,
  (sets = []) => {
    setSelections.value = sets.map((_, idx) => setSelections.value[idx] ?? '')
  },
  { immediate: true }
)

const isMatchingTask = computed(() => structuredTask.value.interactionType === 'matching')
const isMultiChoiceTask = computed(() => structuredTask.value.interactionType === 'multi_choice')

const choiceSelections = ref([])

watch(
  () => structuredTask.value.interactionType,
  () => {
    choiceSelections.value = []
  },
  { immediate: true }
)

watch(
  () => structuredTask.value.options,
  () => {
    choiceSelections.value = []
  }
)

const toggleChoiceSelection = (label) => {
  if (!label) return
  const limit = structuredTask.value.selectCount
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

const filledSetSelections = computed(() => setSelections.value.filter(Boolean).length)
const requiredMatchingSelections = computed(() => {
  if (!isMatchingTask.value) return 0
  const configured = Number(structuredTask.value.selectCount)
  if (Number.isFinite(configured) && configured > 0) return configured
  return structuredTask.value.sets.length
})

const matchingRequirementMet = computed(() => {
  if (!isMatchingTask.value) return true
  const required = requiredMatchingSelections.value
  if (!required) return true
  return filledSetSelections.value >= required
})

const requiredChoiceSelections = computed(() => {
  if (!isMultiChoiceTask.value) return 0
  const configured = Number(structuredTask.value.selectCount)
  if (Number.isFinite(configured) && configured > 0) return configured
  return structuredTask.value.options.length ? 1 : 0
})

const multiChoiceRequirementMet = computed(() => {
  if (!isMultiChoiceTask.value) return true
  const required = requiredChoiceSelections.value
  if (!required) return structuredTask.value.options.length === 0
  return choiceSelections.value.length >= required
})

const hasMetSelectionRequirement = computed(() => {
  if (isMatchingTask.value) return matchingRequirementMet.value
  if (isMultiChoiceTask.value) return multiChoiceRequirementMet.value
  return true
})

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
  if (structuredTask.value.page !== undefined && structuredTask.value.page !== null) {
    return `page-${structuredTask.value.page}`
  }
  if (props.task?.meta?.task_id) {
    return String(props.task.meta.task_id)
  }
  if (structuredTask.value.heading) {
    return structuredTask.value.heading
  }
  return `task-${props.task?.page ?? 0}`
})

const optionLookup = computed(() => {
  const map = {}
  structuredTask.value.options.forEach((option) => {
    map[option.label] = option
  })
  return map
})

const buildAnswerPayload = () => {
  const base = {
    taskKey: taskKey.value,
    taskId: props.task?.id ?? null,
    page: structuredTask.value.page ?? null,
    title: structuredTask.value.heading ?? '',
    interactionType: structuredTask.value.interactionType ?? null,
    selectCount: structuredTask.value.selectCount ?? null,
    isStructured: structuredTask.value.isStructured ?? false
  }

  if (isMatchingTask.value) {
    return {
      ...base,
      selections: structuredTask.value.sets.map((set, idx) => {
        const selectedKey = setSelections.value[idx] || null
        const option = selectedKey ? optionLookup.value[selectedKey] : null
        return {
          category: set.label,
          categoryIsLatex: set.isLatex,
          selectedKey,
          selectedDisplay: option?.value ?? null,
          selectedIsLatex: option?.isLatex ?? false
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
          display: option?.value ?? null,
          isLatex: option?.isLatex ?? false
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
  [() => setSelections.value, () => choiceSelections.value, () => structuredTask.value],
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
        <span v-if="structuredTask.page" class="text-xs font-medium text-slate-500">
          Seite {{ structuredTask.page }}
        </span>
      </div>
      <h2 class="text-3xl font-semibold leading-tight text-indigo-900">
        {{ structuredTask.heading }}
      </h2>
      <div v-if="structuredTask.badges.length" class="flex flex-wrap gap-2">
        <span
          v-for="badge in structuredTask.badges"
          :key="badge"
          class="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600"
        >
          {{ badge }}
        </span>
      </div>
    </header>

    <section v-if="structuredTask.intro.length" class="space-y-3 text-slate-700 leading-relaxed">
      <p
        v-for="(paragraph, idx) in structuredTask.intro"
        :key="`intro-${idx}`"
        v-html="renderRichText(paragraph, { treatAsLatex: structuredTask.textIsLatex })"
      ></p>
    </section>

    <section v-if="structuredTask.instructions.length" class="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-500">Aufgabenstellung</h3>
      <p
        v-for="(sentence, idx) in structuredTask.instructions"
        :key="`instruction-${idx}`"
        class="leading-relaxed text-slate-800"
        v-html="renderRichText(sentence, { treatAsLatex: structuredTask.textIsLatex })"
      ></p>
    </section>

    <section v-if="isMatchingTask && structuredTask.sets.length" class="space-y-3">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-500">Zahlenmengen</h3>
      <p
        v-if="structuredTask.interactionInstruction"
        class="text-sm text-slate-600"
        v-html="renderRichText(structuredTask.interactionInstruction, { treatAsLatex: structuredTask.interactionInstructionIsLatex })"
      ></p>
      <div class="grid gap-5 md:grid-cols-2">
        <div
          v-for="(set, idx) in structuredTask.sets"
          :key="set.id"
          class="rounded-2xl border border-indigo-100 bg-white px-5 py-6 shadow-sm space-y-4"
        >
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Menge {{ idx + 1 }}</p>
            <p
              v-if="set.isLatex"
              class="mt-2 text-2xl font-semibold text-indigo-900"
              v-html="renderMath(set.label, true, true)"
            ></p>
            <p v-else class="mt-2 text-2xl font-semibold text-indigo-900">{{ set.label }}</p>
          </div>

          <TaskOptionDropdown
            v-model="setSelections[idx]"
            :options="structuredTask.options"
            :dropdown-id="`set-select-${idx}`"
            label="Zuordnung wählen"
            placeholder="Option auswählen"
          />
        </div>
      </div>
    </section>

    <section v-if="isMultiChoiceTask && structuredTask.options.length" class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-500">Antwortoptionen</h3>
        <p
          v-if="structuredTask.interactionInstruction"
          class="text-sm text-slate-600"
          v-html="renderRichText(structuredTask.interactionInstruction, { treatAsLatex: structuredTask.interactionInstructionIsLatex })"
        ></p>
        <p v-if="structuredTask.selectCount" class="text-xs font-semibold uppercase text-slate-500">
          Wähle {{ structuredTask.selectCount }} Optionen.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <button
          v-for="option in structuredTask.options"
          :key="`choice-${option.label}`"
          type="button"
          class="flex items-center justify-between rounded-2xl border px-4 py-4 text-left shadow-sm transition"
          :class="[
            isChoiceSelected(option.label)
              ? 'border-indigo-500 bg-indigo-50 shadow-md'
              : 'border-slate-200 bg-white hover:border-indigo-300'
          ]"
          :aria-pressed="isChoiceSelected(option.label)"
          @click="toggleChoiceSelection(option.label)"
        >
          <div class="flex items-center gap-4">
            <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {{ option.label }}
            </span>
            <div
              class="text-base font-medium text-slate-800"
              v-html="renderRichText(option.value, { treatAsLatex: option.isLatex })"
            ></div>
          </div>
          <svg
            v-if="isChoiceSelected(option.label)"
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
        <span v-if="structuredTask.selectCount">
          / {{ structuredTask.selectCount }}
        </span>
      </p>
    </section>

    <section
      v-if="structuredTask.scoring || structuredTask.evaluationNote"
      class="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm"
    >
      <p v-if="structuredTask.scoring" class="font-semibold text-slate-700">
        Punkte: {{ structuredTask.scoring }}
      </p>
      <p
        v-if="structuredTask.evaluationNote"
        class="text-slate-600"
        :class="{ 'mt-2': structuredTask.scoring }"
      >
        {{ structuredTask.evaluationNote }}
      </p>
    </section>
  </article>
</template>
