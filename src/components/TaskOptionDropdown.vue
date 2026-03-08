<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: 'Zuordnung wählen' },
  placeholder: { type: String, default: 'Option auswählen' },
  dropdownId: { type: String, required: true }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRoot = ref(null)
const buttonRef = ref(null)
const menuStyle = ref({})

const selectedOption = computed(() => props.options.find((opt) => opt.key === props.modelValue) || null)

const MENU_MAX_HEIGHT = 248 // px – entspricht max-h-60 (240px) + Puffer

const updateMenuPosition = () => {
  if (!buttonRef.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const openUpward = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow

  menuStyle.value = openUpward
    ? {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
        maxHeight: `${Math.min(spaceAbove - 8, MENU_MAX_HEIGHT)}px`,
      }
    : {
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
        maxHeight: `${Math.min(spaceBelow - 8, MENU_MAX_HEIGHT)}px`,
      }
}

const DROPDOWN_OPEN_EVENT = 'mathco:dropdown-open'

const toggleDropdown = async () => {
  if (!isOpen.value) {
    updateMenuPosition()
    // andere Dropdowns schließen
    window.dispatchEvent(new CustomEvent(DROPDOWN_OPEN_EVENT, { detail: { id: props.dropdownId } }))
    await nextTick()
  }
  isOpen.value = !isOpen.value
}

const handleOtherDropdownOpen = (e) => {
  if (e.detail?.id !== props.dropdownId) closeDropdown()
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectOption = (key) => {
  emit('update:modelValue', key)
  closeDropdown()
}

const handleOutsideClick = (event) => {
  if (!dropdownRoot.value) return
  if (dropdownRoot.value.contains(event.target)) return
  closeDropdown()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('scroll', closeDropdown, true)
  window.addEventListener('resize', closeDropdown)
  window.addEventListener('mathco:dropdown-open', handleOtherDropdownOpen)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('scroll', closeDropdown, true)
  window.removeEventListener('resize', closeDropdown)
  window.removeEventListener('mathco:dropdown-open', handleOtherDropdownOpen)
})
</script>

<template>
  <div ref="dropdownRoot" class="space-y-2">
    <label :for="`${dropdownId}-button`" class="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
      {{ label }}
    </label>

    <div class="relative">
      <button
        ref="buttonRef"
        :id="`${dropdownId}-button`"
        type="button"
        class="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-left text-[0.93rem] text-[var(--text)] transition hover:border-[var(--accent)]"
        :class="{ 'border-[var(--accent)]': isOpen }"
        :aria-expanded="isOpen"
        :aria-controls="`${dropdownId}-list`"
        @click.stop="toggleDropdown"
        @keydown.esc.stop.prevent="closeDropdown"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span
            v-if="selectedOption"
            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]"
          >{{ selectedOption.key }}</span>
          <span v-if="selectedOption" class="text-[0.93rem] text-[var(--text)] truncate" v-html="selectedOption.display" v-math-render></span>
          <span v-else class="text-[var(--text-muted)]">{{ placeholder }}</span>
        </div>

        <svg
          class="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform ml-2"
          :class="{ 'rotate-180': isOpen }"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Teleport verhindert Abschneiden durch overflow:hidden im Eltern-Element -->
      <Teleport to="body">
        <ul
          v-if="isOpen"
          :id="`${dropdownId}-list`"
          role="listbox"
          :style="menuStyle"
          class="overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl"
        >
          <li
            v-for="option in options"
            :key="`${dropdownId}-${option.key}`"
            role="option"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.93rem] text-[var(--text)] transition hover:bg-[var(--surface2)]"
            :class="{ 'bg-[var(--surface2)]': modelValue === option.key }"
            :aria-selected="modelValue === option.key"
            @click="selectOption(option.key)"
          >
            <div class="flex items-center gap-3">
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold border"
                :class="modelValue === option.key
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--surface)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'"
              >{{ option.key }}</span>
              <div class="text-[0.93rem]" v-html="option.display" v-math-render></div>
            </div>
            <svg
              v-if="modelValue === option.key"
              class="h-4 w-4 shrink-0 text-[var(--accent)]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.563a1 1 0 0 1-1.434-.01l-3.5-3.563a1 1 0 1 1 1.44-1.39l2.787 2.837 6.787-6.84a1 1 0 0 1 1.414-.01z" clip-rule="evenodd" />
            </svg>
          </li>
        </ul>
      </Teleport>
    </div>

    <p v-if="selectedOption" class="text-xs text-[var(--accent)]">✓ Zuordnung gespeichert</p>
  </div>
</template>
