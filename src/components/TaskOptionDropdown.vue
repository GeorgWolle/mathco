<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMathRenderer } from '../composables/useMathRenderer'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: 'Zuordnung wählen' },
  placeholder: { type: String, default: 'Option auswählen' },
  dropdownId: { type: String, required: true }
})

const emit = defineEmits(['update:modelValue'])
const { renderRichText } = useMathRenderer()

const isOpen = ref(false)
const dropdownRoot = ref(null)

const selectedOption = computed(() => props.options.find((opt) => opt.label === props.modelValue) || null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectOption = (label) => {
  emit('update:modelValue', label)
  closeDropdown()
}

const handleOutsideClick = (event) => {
  if (!dropdownRoot.value) return
  if (dropdownRoot.value.contains(event.target)) return
  closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div ref="dropdownRoot" class="space-y-2">
    <label :for="`${dropdownId}-button`" class="block text-sm font-medium text-slate-600">
      {{ label }}
    </label>

    <div class="relative">
      <button
        :id="`${dropdownId}-button`"
        type="button"
        class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-base text-slate-800 shadow-sm transition hover:border-indigo-300"
        :aria-expanded="isOpen"
        :aria-controls="`${dropdownId}-list`"
        @click.stop="toggleDropdown"
        @keydown.esc.stop.prevent="closeDropdown"
      >
        <div class="flex flex-col">
          <span v-if="selectedOption" class="text-xs font-semibold uppercase text-slate-500">
            Auswahl {{ selectedOption.label }}
          </span>
          <span v-else class="text-slate-400">{{ placeholder }}</span>

          <div v-if="selectedOption" class="flex items-center gap-3">
            <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {{ selectedOption.label }}
            </span>
            <div
              class="text-base font-medium text-slate-800"
              v-html="renderRichText(selectedOption.value, { treatAsLatex: selectedOption.isLatex })"
            ></div>
          </div>
        </div>

        <svg
          class="h-5 w-5 text-slate-400 transition-transform"
          :class="{ 'rotate-180': isOpen }"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <ul
        v-if="isOpen"
        :id="`${dropdownId}-list`"
        role="listbox"
        class="absolute left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
      >
        <li
          v-for="option in options"
          :key="`${dropdownId}-${option.label}`"
          role="option"
          class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-indigo-50"
          :aria-selected="modelValue === option.label"
          @click="selectOption(option.label)"
        >
          <div class="flex items-center gap-3">
            <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {{ option.label }}
            </span>
            <div
              class="text-base"
              v-html="renderRichText(option.value, { treatAsLatex: option.isLatex })"
            ></div>
          </div>
          <svg
            v-if="modelValue === option.label"
            class="h-4 w-4 text-indigo-600"
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
        </li>
      </ul>
    </div>

    <p v-if="selectedOption" class="text-sm text-slate-600">Zuordnung gespeichert.</p>
  </div>
</template>
