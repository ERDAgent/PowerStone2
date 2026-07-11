<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGuideStore } from '@/stores/guide'

const store = useGuideStore()
const { lightboxImage } = storeToRefs(store)
const closeButton = ref<HTMLButtonElement | null>(null)
let returnFocus: HTMLElement | null = null

function close() { store.closeLightbox() }
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}
watch(lightboxImage, async image => {
  if (image) { returnFocus = document.activeElement as HTMLElement; document.body.classList.add('is-dialog-open'); await nextTick(); closeButton.value?.focus() }
  else { document.body.classList.remove('is-dialog-open'); returnFocus?.focus() }
})
onBeforeUnmount(() => document.body.classList.remove('is-dialog-open'))
</script>

<template>
  <Teleport to="body">
    <div v-if="lightboxImage" class="lightbox" @keydown="onKeydown">
      <div class="lightbox__backdrop" aria-hidden="true" @click="close" />
      <figure class="lightbox__panel" role="dialog" aria-modal="true" :aria-label="lightboxImage.alt">
        <button ref="closeButton" class="icon-button lightbox__close" type="button" aria-label="Close image" @click="close">×</button>
        <img class="lightbox__image" :src="lightboxImage.src" :alt="lightboxImage.alt" />
      </figure>
    </div>
  </Teleport>
</template>
