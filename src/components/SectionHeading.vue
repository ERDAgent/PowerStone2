<script setup lang="ts">
defineProps<{ kicker: string; title: string; intro: string; titleId?: string }>()
</script>
<template>
  <header class="section-heading">
    <p class="section-heading__kicker">{{ kicker }}</p>
    <h2 :id="titleId" class="section-heading__title">{{ title }}</h2>
    <p class="section-heading__intro"><slot name="intro">{{ intro }}</slot></p>
  </header>
</template>
