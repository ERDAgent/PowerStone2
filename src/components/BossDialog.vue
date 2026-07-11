<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGuideStore } from '@/stores/guide'

const store = useGuideStore()
const { openBoss } = storeToRefs(store)
const closeButton = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

function close() { store.closeBoss() }
function onKeydown(event: KeyboardEvent) {
  if (!openBoss.value) return
  if (event.key === 'Escape') close()
  if (event.key === 'Tab' && dialog.value) {
    const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button')].filter(el => !el.hasAttribute('disabled'))
    const first = focusable[0]; const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
}
watch(openBoss, async boss => {
  if (boss) { returnFocus = document.activeElement as HTMLElement; document.body.classList.add('is-dialog-open'); await nextTick(); closeButton.value?.focus() }
  else { document.body.classList.remove('is-dialog-open'); returnFocus?.focus() }
})
onBeforeUnmount(() => document.body.classList.remove('is-dialog-open'))
</script>

<template>
  <Teleport to="body">
    <div v-if="openBoss" class="level-dialog boss-dialog" @keydown="onKeydown">
      <div class="level-dialog__backdrop" aria-hidden="true" @click="close" />
      <section ref="dialog" class="level-dialog__panel" role="dialog" aria-modal="true" :aria-labelledby="`boss-dialog-${openBoss.id}`">
        <div class="level-dialog__header">
          <div><p class="eyebrow">Encounter file</p><h2 :id="`boss-dialog-${openBoss.id}`">{{ openBoss.name }}</h2></div>
          <button ref="closeButton" class="icon-button" type="button" aria-label="Close boss info" @click="close">×</button>
        </div>
        <div class="level-dialog__stage boss-dialog__stage">
          <img v-if="openBoss.media" :src="openBoss.media" :alt="`${openBoss.name} artwork`" />
        </div>
        <div class="level-dialog__footer boss-dialog__footer">
          <span class="status-tag">{{ openBoss.status }}</span>
          <p>{{ openBoss.description }}</p>
          <p class="boss-dialog__placeholder">More encounter details are on the way.</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>
