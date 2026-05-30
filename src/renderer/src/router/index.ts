import { createMemoryHistory, createRouter } from 'vue-router'

import SplitView from '@renderer/views/index.vue'
import MergeView from '@renderer/views/MergeView.vue'
import CompressView from '@renderer/views/CompressView.vue'
import ConvertView from '@renderer/views/ConvertView.vue'

const routes = [
  { path: '/', redirect: '/split' },
  { path: '/merge', component: MergeView },
  { path: '/split', component: SplitView },
  { path: '/compress', component: CompressView },
  { path: '/convert', component: ConvertView },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
export default router