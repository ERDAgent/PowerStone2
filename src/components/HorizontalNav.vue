<script setup lang="ts">
import { nextTick, ref } from 'vue'

const props = defineProps<{
  items: readonly { id: string; label: string; image?: string | null }[]
  modelValue: string
  navLabel: string
}>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
const tabElements = ref<HTMLButtonElement[]>([])

function activate(id: string, index: number) {
  emit('update:modelValue', id)
  nextTick(() => tabElements.value[index]?.focus())
}
function onKeydown(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % props.items.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + props.items.length) % props.items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = props.items.length - 1
  else return
  event.preventDefault()
  activate(props.items[next].id, next)
}
</script>

<template>
  <div class="horizontal-nav" role="tablist" :aria-label="navLabel">
    <button
      v-for="(item, index) in items"
      :key="item.id"
      :ref="element => { if (element) tabElements[index] = element as HTMLButtonElement }"
      type="button"
      role="tab"
      class="horizontal-nav__tab gradient-border"
      :aria-selected="modelValue === item.id"
      :tabindex="modelValue === item.id ? 0 : -1"
      @click="activate(item.id, index)"
      @keydown="onKeydown($event, index)"
    >
      <img
        v-if="item.image"
        class="horizontal-nav__icon"
        :style="{
          width: item.label === 'Dreamcast' ? '80px' :
                 item.label === 'Arcade' ? '64px' :
                 item.label === 'PSP' ? '124px' :
                 item.label === 'PC' ? '101px' :
                 ['Team Battle', '3 Team Battle', 'Battle Royal'].includes(item.label) ? '130px' :
                 item.label === 'Capcom Fighting Collection 2' ? '150px' :
                 item.label === 'Flycast Dojo' ? '50px' : '',
          margin: item.label === 'Team Battle' ? '0.75rem 0.25rem 0 0.5rem' :
                  item.label === 'Flycast Dojo' ? '0 0.5rem 0 0.25rem' :
                  item.label === 'Capcom Fighting Collection 2' ? '1rem 0.25rem 0 0.5rem' : ''
        }"
        :src="item.image"
        alt=""
      />
      <span>{{ item.label }}</span>
    </button>
  </div>
</template>
