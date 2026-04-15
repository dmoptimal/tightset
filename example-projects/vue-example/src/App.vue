<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Tightset from 'tightset/vue'

const text = ref('Every Line Fills The Width')
const fontsReady = ref(false)

onMounted(() => {
  document.fonts.ready.then(() => { fontsReady.value = true })
})
</script>

<template>
  <div style="min-height: 100vh; background: #0a0a0a; color: #fff; font-family: Inter, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 2rem; gap: 2rem;">
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <svg viewBox="0 0 400 400" width="40" height="40"><rect x="16" y="16" width="368" height="368" rx="32" fill="#0a0a0a" stroke="#333" stroke-width="2"/><text x="200" y="168" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="107" font-weight="700" fill="#ffffff" letter-spacing="-0.03em">TIGHT</text><text x="200" y="308" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="172" font-weight="900" fill="#ffffff" letter-spacing="-0.03em">SET</text></svg>
      <span style="font-size: 1.5rem; font-weight: 300; color: #555;">×</span>
      <svg viewBox="0 0 24 24" width="36" height="36" fill="#4FC08D"><path d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z"/></svg>
      <h1 style="font-weight: 300; color: #666; margin: 0;">Vue</h1>
    </div>
    <input
      v-model="text"
      style="width: 400px; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #333; background: #111; color: #fff; font-size: 1rem; font-family: inherit;"
    />
    <Tightset
      v-if="fontsReady"
      :text="text"
      :width="800"
      :height="400"
      fontFamily="Inter"
      color="#ffffff"
      background="#0d0d0d"
      :maxWeight="900"
      :spread="150"
      @fit="(r: any) => console.log('Vue fit:', r.lines)"
    />
  </div>
</template>
