<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

export interface GalleryItem {
  readonly kind: 'image' | 'video'
  readonly src: string
  readonly poster?: string
  readonly label: string
}

const props = defineProps<{
  title: string
  items: readonly GalleryItem[]
  activeIndex: number | null
}>()
const emit = defineEmits<{ close: []; next: []; previous: [] }>()

const closeButton = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

function close() { emit('close') }
function onKeydown(event: KeyboardEvent) {
  if (props.activeIndex === null) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') emit('next')
  if (event.key === 'ArrowLeft') emit('previous')
  if (event.key === 'Tab' && dialog.value) {
    const focusable = [...dialog.value.querySelectorAll<HTMLElement>('button')].filter(el => !el.hasAttribute('disabled'))
    const first = focusable[0]; const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
}
watch(() => props.activeIndex, async index => {
  if (index !== null) { returnFocus = document.activeElement as HTMLElement; document.body.classList.add('is-dialog-open'); await nextTick(); closeButton.value?.focus() }
  else { document.body.classList.remove('is-dialog-open'); returnFocus?.focus() }
})
onBeforeUnmount(() => document.body.classList.remove('is-dialog-open'))
</script>

<template>
  <Teleport to="body">
    <div v-if="activeIndex !== null" class="level-dialog" @keydown="onKeydown">
      <div class="level-dialog__backdrop" aria-hidden="true" @click="close" />
      <section ref="dialog" class="level-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="media-gallery-title">
        <div class="level-dialog__header">
          <div><p class="eyebrow">{{ title }}</p><h2 id="media-gallery-title">{{ items[activeIndex]?.label }}</h2></div>
          <button ref="closeButton" class="icon-button" type="button" aria-label="Close gallery" @click="close">×</button>
        </div>
        <div class="level-dialog__stage">
          <video v-if="items[activeIndex]?.kind === 'video'" :key="items[activeIndex]!.src" controls autoplay muted loop playsinline :poster="items[activeIndex]!.poster">
            <source :src="items[activeIndex]!.src" type="video/mp4" />
          </video>
          <img v-else :src="items[activeIndex]?.src" :alt="items[activeIndex]?.label" />
          <template v-if="items.length > 1">
            <button class="level-dialog__arrow level-dialog__arrow--previous" type="button" aria-label="Previous" @click="emit('previous')">←</button>
            <button class="level-dialog__arrow level-dialog__arrow--next" type="button" aria-label="Next" @click="emit('next')">→</button>
          </template>
        </div>
        <div class="level-dialog__footer">
          <p v-if="items.length > 1" aria-live="polite">{{ activeIndex + 1 }} of {{ items.length }}</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>
