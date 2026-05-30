<template>
  <div class="top-nav">
    <el-button :type="active === '/merge' ? 'primary' : 'text'" @click="navigate('/merge')">合并PDF</el-button>
    <el-button :type="active === '/split' ? 'primary' : 'text'" @click="navigate('/split')">拆分PDF</el-button>
    <el-button :type="active === '/compress' ? 'primary' : 'text'" @click="navigate('/compress')">压缩PDF</el-button>
    <el-button :type="active === '/convert' ? 'primary' : 'text'" @click="navigate('/convert')">PDF转换</el-button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const active = computed(() => route.path)
const navigate = (path: string) => {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  border-radius: 0 0 18px 18px;
}
</style>
