<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 py-10 px-4 sm:px-8 text-white">
    <div class="mx-auto flex max-w-5xl flex-col gap-6">
      <header class="rounded-3xl border border-white/20 bg-white/10 px-6 py-4 shadow-lg backdrop-blur">
        <p class="text-sm uppercase tracking-[0.3em] text-white/80">MathCo</p>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 class="text-2xl font-semibold">Mathe macht viel Spaß!</h1>
        </div>
      </header>

      <section class="rounded-3xl bg-white/10 p-4 shadow-lg backdrop-blur">
        <RouterView />
      </section>
    </div>
  </main>
</template>
