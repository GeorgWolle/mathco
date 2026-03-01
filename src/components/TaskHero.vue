<script setup>
const props = defineProps({
  title: { type: String, required: true },
  progressPercent: { type: Number, required: true },
  progressText: { type: String, required: true }
})
</script>

<template>
  <header class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-10 py-8 flex flex-wrap gap-5 justify-between items-end">
    <div>
      <h1 class="text-3xl sm:text-4xl font-semibold">{{ props.title }}</h1>
    </div>
    <div class="w-full sm:w-64">
      <div class="w-full h-2.5 rounded-full bg-white/30 overflow-hidden">
        <span
          class="block h-full rounded-full bg-emerald-400 transition-all duration-300"
          :style="{ width: `${props.progressPercent}%` }"
        />
      </div>
      <p class="mt-2 text-sm text-white/90">{{ props.progressText }}</p>
    </div>
  </header>
</template>
