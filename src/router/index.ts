import { createRouter, createWebHistory } from 'vue-router'
import type { RouterScrollBehavior } from 'vue-router'
import GuideView from '@/views/GuideView.vue'
import { sections } from '@/data/content'

export const routes = [
  ...sections.map(section => ({ path: `/${section.id}`, name: section.id, component: GuideView, meta: { section: section.id } })),
  { path: '/', redirect: '/overview' },
  { path: '/:pathMatch(.*)*', redirect: '/overview' },
]

export const scrollBehavior: RouterScrollBehavior = (to) => {
  const section = to.meta.section as string | undefined
  if (!section) return { top: 0 }
  return new Promise(resolve => requestAnimationFrame(() => resolve({ el: `#${section}`, behavior: 'smooth' as const })))
}

const router = createRouter({
  history: createWebHistory(), routes,
  scrollBehavior,
})

export default router
