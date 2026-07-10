<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGuideStore } from '@/stores/guide'

const store = useGuideStore()
const { openLevel, slideIndex } = storeToRefs(store)
const closeButton = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

function close() { store.closeLevel() }
function onKeydown(event: KeyboardEvent) {
  if (!openLevel.value) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') store.nextSlide()
  if (event.key === 'ArrowLeft') store.previousSlide()
  if (event.key === 'Tab' && dialog.value) {
    const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button')].filter(el => !el.hasAttribute('disabled'))
    const first = focusable[0]; const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
}
watch(openLevel, async level => {
  if (level) { returnFocus = document.activeElement as HTMLElement; document.body.classList.add('is-dialog-open'); await nextTick(); closeButton.value?.focus() }
  else { document.body.classList.remove('is-dialog-open'); returnFocus?.focus() }
})
onBeforeUnmount(() => document.body.classList.remove('is-dialog-open'))
</script>

<template>
  <Teleport to="body">
    <div v-if="openLevel" class="level-dialog" @keydown="onKeydown">
      <div class="level-dialog__backdrop" aria-hidden="true" @click="close" />
      <section ref="dialog" class="level-dialog__panel" role="dialog" aria-modal="true" :aria-labelledby="`level-dialog-${openLevel.id}`">
        <div class="level-dialog__header">
          <div><p class="eyebrow">Arena file</p><h2 :id="`level-dialog-${openLevel.id}`">{{ openLevel.name }}</h2></div>
          <button ref="closeButton" class="icon-button" type="button" aria-label="Close level gallery" @click="close">×</button>
        </div>
        <div class="level-dialog__stage">
          <img :src="openLevel.slides[slideIndex]" :alt="`${openLevel.name} placeholder view ${slideIndex + 1}`" />
          <button class="level-dialog__arrow level-dialog__arrow--previous" type="button" aria-label="Previous slide" @click="store.previousSlide">←</button>
          <button class="level-dialog__arrow level-dialog__arrow--next" type="button" aria-label="Next slide" @click="store.nextSlide">→</button>
        </div>
        <div class="level-dialog__footer">
          <p aria-live="polite">Slide {{ slideIndex + 1 }} of {{ openLevel.slides.length }}</p>
          <p>{{ openLevel.description }}</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>
