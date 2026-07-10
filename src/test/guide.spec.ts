import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import GuideView from '@/views/GuideView.vue'
import { routes } from '@/router'
import { sections } from '@/data/content'

const expectedSections = [
  ['overview', 'Overview'],
  ['how-to-play', 'How to Play'],
  ['multiplayer', 'Multiplayer'],
  ['items', 'Items'],
  ['combinations', 'Combinations'],
  ['characters', 'Characters'],
  ['levels', 'Levels'],
  ['bosses', 'Bosses'],
  ['unlocks', 'Unlocks'],
  ['history', 'History'],
  ['about', 'About Us'],
] as const

function testRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

async function mountAppAt(path: string) {
  const router = testRouter()
  await router.push(path)
  await router.isReady()
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(App, { global: { plugins: [pinia, router] }, attachTo: document.body })
  await wrapper.vm.$nextTick()
  return { wrapper, router }
}

async function mountGuide() {
  const router = testRouter()
  await router.push('/overview')
  await router.isReady()
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(GuideView, { global: { plugins: [pinia, router] }, attachTo: document.body })
  return { wrapper, router }
}

describe('section routing', () => {
  it('keeps navigation, generated routes, and rendered sections in the requested order', async () => {
    expect(sections.map(section => [section.id, section.label])).toEqual(expectedSections)
    expect(routes.slice(0, expectedSections.length).map(route => route.path)).toEqual(expectedSections.map(([id]) => `/${id}`))

    const { wrapper } = await mountAppAt('/overview')
    expect(wrapper.findAll('#primary-navigation a').map(link => link.text())).toEqual(expectedSections.map(([, label]) => label))
    expect(wrapper.findAll('.site-footer__nav a').map(link => link.text())).toEqual(expectedSections.map(([, label]) => label))
    expect(wrapper.findAll('.routed-section').map(section => section.attributes('id'))).toEqual(expectedSections.map(([id]) => id))
    wrapper.unmount()
  })

  it('routes How to Play by its accessible section id and keeps About Us at /about', async () => {
    const { wrapper, router } = await mountAppAt('/how-to-play')
    expect(router.currentRoute.value.meta.section).toBe('how-to-play')
    expect(wrapper.find('#how-to-play').attributes('aria-labelledby')).toBe('how-to-play-title')
    expect(wrapper.find('#how-to-play-title').text()).toBe('Learn the scramble.')
    expect(wrapper.find('#primary-navigation a[aria-current="page"]').text()).toBe('How to Play')
    const aboutLink = wrapper.findAll('#primary-navigation a').find(link => link.text() === 'About Us')
    expect(aboutLink?.attributes('href')).toBe('/about')
    wrapper.unmount()
  })

  it('targets the initial section and updates active feedback after a route change', async () => {
    const { wrapper, router } = await mountAppAt('/levels')
    expect(wrapper.find('a[aria-current="page"]').text()).toBe('Levels')
    expect(router.currentRoute.value.meta.section).toBe('levels')
    await router.push('/items')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('a[aria-current="page"]').text()).toBe('Items')
    expect(router.currentRoute.value.meta.section).toBe('items')
    wrapper.unmount()
  })

  it('recovers an unknown path to the overview route', async () => {
    const { wrapper, router } = await mountAppAt('/not-a-real-section')
    expect(router.currentRoute.value.path).toBe('/overview')
    expect(wrapper.find('#primary-navigation a[aria-current="page"]').text()).toBe('Overview')
    wrapper.unmount()
  })
})

describe('guide interactions', () => {
  it('starts on Falcon and selecting Wang-Tang updates the details', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.find('.fighter-file h3').text()).toBe('Falcon')
    const wangTang = wrapper.findAll('.portrait').find(button => button.text().includes('Wang-Tang'))
    expect(wangTang).toBeTruthy()
    await wangTang!.trigger('click')
    expect(wrapper.find('.fighter-file h3').text()).toBe('Wang-Tang')
    expect(wrapper.find('.fighter-file__tagline').text()).toContain('martial artist')
    wrapper.unmount()
  })

  it('updates item details when another item is selected', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.find('.item-detail h3').text()).toBe('Flame Sword')
    const machineGun = wrapper.findAll('.item-tile').find(button => button.text().includes('Machine Gun'))
    await machineGun!.trigger('click')
    expect(wrapper.find('.item-detail h3').text()).toBe('Machine Gun')
    expect(wrapper.find('.item-detail').text()).toContain('rapid-fire')
    wrapper.unmount()
  })

  it('opens, advances, and closes the level dialog without console errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { wrapper } = await mountGuide()
    await wrapper.find('.level-card').trigger('click')
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Slide 1 of 3')
    const next = dialog!.querySelector<HTMLButtonElement>('[aria-label="Next slide"]')!
    next.click()
    await wrapper.vm.$nextTick()
    expect(dialog!.textContent).toContain('Slide 2 of 3')
    const close = dialog!.querySelector<HTMLButtonElement>('[aria-label="Close level gallery"]')!
    close.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
    wrapper.unmount()
  })
})
