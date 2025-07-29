<template>
  <el-menu :default-active="activeIndex" class="el-menu-demo" @select="handleSelect">
    <el-menu-item index="1">PDF TOOLS</el-menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style></style>
