<script setup lang="ts">
import layOut from '@renderer/layout/index.vue'
import '@renderer/css/index.css'
</script>
<template>
  <div class="main">
    <div class="top">
      <layOut></layOut>
    </div>
    <router-view />
  </div>
</template>
