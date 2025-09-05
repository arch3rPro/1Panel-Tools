<script lang="ts" setup>
const value = ref(0.5);
</script>

<template>
  <h2>Default</h2>

  <n-input-number-i18n v-model:value="value" />
  <span>Value: {{ value }}</span>
</template>
