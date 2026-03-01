<script setup>
import { ref } from 'vue'

const jsonInput = ref('{\n  "taskId": "…",\n  "answers": {\n    "1": "A",\n    "2": "B"\n  }\n}')

const handleSubmit = () => {
  // Placeholder for upcoming submission logic
}
</script>

<template>
  <section class="w-full rounded-3xl bg-white/95 p-8 shadow-2xl">
    <header class="mb-8 space-y-2 text-slate-800">
      <p class="text-sm uppercase tracking-[0.35em] text-slate-500">Admin Review</p>
      <h2 class="text-3xl font-semibold text-slate-900">Hallo, liebe Tutor:innen 👋</h2>
      <p class="text-base text-slate-600">
        Füge hier die JSON-Antwort deiner Schüler:innen ein, um sie später zu prüfen.
      </p>
    </header>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <label class="block text-sm font-semibold text-slate-700">Antwort als JSON</label>
      <textarea
        v-model="jsonInput"
        class="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-sm text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
        placeholder='{"taskId":"abc","answers":{"1":"A"}}'
      ></textarea>
      <button
        type="submit"
        class="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/40 transition hover:-translate-y-0.5 hover:bg-indigo-500"
      >
        JSON einreichen
      </button>
    </form>
  </section>
</template>
