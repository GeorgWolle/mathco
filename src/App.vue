<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <main class="min-h-screen bg-[var(--bg)] py-10 px-4 sm:px-8 text-[var(--text)]">
    <header class="relative z-10 flex items-center gap-4 max-w-5xl mx-auto px-6 pt-7 pb-0">
      <!-- Logo Badge -->
      <div
        class="flex items-center justify-center w-11 h-11 rounded-xl text-[22px] shrink-0"
        style="background: linear-gradient(135deg, var(--accent), #5a53d4); box-shadow: 0 4px 20px rgba(124,111,247,0.4);"
      >∑</div>

      <!-- Titel -->
      <h1 class="font-syne font-extrabold text-[1.2rem] tracking-[-0.01em] text-[var(--text)]">
        Mathe<span style="color: var(--accent)">Trainer</span>
        &ndash;
        <span style="color: var(--accent)">8. Klasse AHS</span>
      </h1>

      <!-- Badge rechts -->
      <div
        class="ml-auto text-[0.78rem] px-[14px] py-[6px] rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text-muted)] whitespace-nowrap"
      >Aufgabenpool · Zentralmatura</div>
    </header>

    <div class="mx-auto flex max-w-5xl flex-col gap-6">
      <RouterView />
    </div>
  </main>
</template>
