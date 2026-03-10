<template>
  <section class="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center gap-8">
    <div
      class="flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-accent px-12 py-16 flex-col gap-6 max-w-lg w-full"
    >
      <div
        class="flex items-center justify-center h-20 w-20 rounded-[20px] text-4xl"
        style="background: linear-gradient(135deg, var(--accent), #5a53d4); box-shadow: 0 8px 24px rgba(124,111,247,0.35);"
      >
        🎉
      </div>
      <div class="space-y-2">
        <h1 class="font-syne font-bold text-[2rem] leading-tight text-[var(--text)]">
          Gratuliere!
        </h1>
        <p class="text-[var(--text-muted)] text-[1rem] leading-relaxed">
          Du hast alle Aufgaben abgeschlossen.<br>Deine Antworten wurden gespeichert.
        </p>
      </div>
      <button
        type="button"
        class="font-syne font-semibold text-[0.88rem] flex items-center gap-2 rounded-xl px-6 py-3 text-white transition hover:-translate-y-px mt-2"
        style="background: linear-gradient(135deg, var(--accent), #5a53d4); box-shadow: 0 4px 16px rgba(0,0,0,0.3);"
        @click="$router.push('/')"
      >
        Nochmal von vorne
      </button>
    </div>
  </section>
</template>
