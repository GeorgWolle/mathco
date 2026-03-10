<script setup>
const props = defineProps({
  title:           { type: String,  required: true },
  progressPercent: { type: Number,  required: true },
  activeIndex:     { type: Number,  required: true },
  total:           { type: Number,  required: true },
  // Array<'active'|'done'|'correct'|'wrong'|''>
  dotStates:       { type: Array,   default: () => [] },
})
</script>

<template>
  <div class="mb-9">
    <!-- Meta-Zeile: Titel + Zähler-Pill -->
    <div class="flex items-center justify-between mb-[10px]">
      <span class="font-syne font-bold text-[2.2rem] leading-tight text-[var(--text)]">{{ props.title }}</span>
      <span class="text-[0.82rem] text-[var(--text-muted)] bg-[var(--surface2)] border border-[var(--border)] px-3 py-1 rounded-full">
        Aufgabe {{ props.activeIndex + 1 }} von {{ props.total }}
      </span>
    </div>

    <!-- Progress-Bar-Track -->
    <div class="h-[6px] bg-[var(--surface2)] border border-[var(--border)] rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-[width] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style="background: linear-gradient(90deg, var(--accent), var(--accent3))"
        :style="{ width: `${props.progressPercent}%` }"
      ></div>
    </div>

    <!-- Dots-Reihe -->
    <div class="flex gap-[6px] mt-[10px]">
      <div
        v-for="(state, i) in props.dotStates"
        :key="i"
        class="h-[6px] w-7 rounded-[3px] border transition-colors duration-300"
        :class="{
          'bg-[var(--accent3)] border-[var(--accent3)]': state === 'done' || state === 'correct',
          'bg-[var(--accent4)] border-[var(--accent4)]': state === 'wrong',
          'bg-[var(--accent)]  border-[var(--accent)]  animate-pulse': state === 'active',
          'bg-[var(--border)]  border-[var(--border)]  opacity-25':  !state,
        }"
      ></div>
    </div>
  </div>
</template>
