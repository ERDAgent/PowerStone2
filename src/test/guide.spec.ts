import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import GuideView from '@/views/GuideView.vue'
import { routes } from '@/router'
import { sections } from '@/data/content'
import { bosses, characters, levels } from '@/data/world'
import { essences, items, materials } from '@/data'

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

function setSectionPositions(activeIndex: number) {
  document.querySelector<HTMLElement>('.site-header')!.getBoundingClientRect = () => ({ top: 0, bottom: 64 } as DOMRect)
  document.querySelectorAll<HTMLElement>('.routed-section').forEach((section, index) => {
    const top = (index - activeIndex) * 500 + 64
    section.getBoundingClientRect = () => ({ top, bottom: top + 400 } as DOMRect)
  })
}

function currentLinks(wrapper: Awaited<ReturnType<typeof mountAppAt>>['wrapper']) {
  return wrapper.findAll('#primary-navigation a[aria-current="page"]')
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

  it('holds route feedback at the old viewport until the target reaches the header anchor', async () => {
    const { wrapper, router } = await mountAppAt('/overview')
    setSectionPositions(0)
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    await router.push('/levels')
    await wrapper.vm.$nextTick()
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(currentLinks(wrapper)).toHaveLength(1)
    expect(currentLinks(wrapper)[0].text()).toBe('Levels')

    setSectionPositions(6)
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(currentLinks(wrapper)[0].text()).toBe('Levels')

    setSectionPositions(3)
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(currentLinks(wrapper)[0].text()).toBe('Items')
    wrapper.unmount()
  })

  it('tracks manual scrolling across section boundaries without routing or history writes', async () => {
    const { wrapper, router } = await mountAppAt('/overview')
    const push = vi.spyOn(router, 'push')
    const replace = vi.spyOn(router, 'replace')
    const historyPush = vi.spyOn(window.history, 'pushState')
    const historyReplace = vi.spyOn(window.history, 'replaceState')

    for (const index of [0, 3, 6]) {
      setSectionPositions(index)
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(currentLinks(wrapper)).toHaveLength(1)
      expect(currentLinks(wrapper)[0].text()).toBe(expectedSections[index][1])
    }
    expect(push).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(historyPush).not.toHaveBeenCalled()
    expect(historyReplace).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('activates the first and final sections at page boundaries and cleans up listeners', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { wrapper } = await mountAppAt('/overview')
    setSectionPositions(0)
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(currentLinks(wrapper)[0].text()).toBe('Overview')

    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 4000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 3200, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(currentLinks(wrapper)[0].text()).toBe('About Us')
    wrapper.unmount()
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
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

  it('renders and synchronously filters the full canonical item catalog', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.find('.item-detail h3').text()).toBe('Gun')
    expect(wrapper.findAll('.item-tile')).toHaveLength(items.length)
    await wrapper.find('#item-search').setValue('mAcHiNe GuN')
    expect(wrapper.findAll('.item-tile')).toHaveLength(1)
    const machineGun = wrapper.findAll('.item-tile').find(button => button.text().includes('Machine Gun'))
    await machineGun!.trigger('click')
    expect(wrapper.find('.item-detail h3').text()).toBe('Machine Gun')
    expect(wrapper.find('.item-detail').text()).toContain('Item 2')
    wrapper.unmount()
  })

  it('provides ordered catalog tabs with Items selected and exact populations', async () => {
    const { wrapper } = await mountGuide()
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map(tab => tab.text())).toEqual(['All', 'Items', 'Materials', 'Essences'])
    expect(tabs.map(tab => tab.attributes('aria-selected'))).toEqual(['false', 'true', 'false', 'false'])
    expect(tabs.map(tab => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    expect(wrapper.findAll('.item-tile')).toHaveLength(121)
    await tabs[0].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(152)
    await tabs[2].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(22)
    await tabs[3].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(9)
    wrapper.unmount()
  })

  it('supports wrapped arrow and Home/End tab activation with focus', async () => {
    const { wrapper } = await mountGuide()
    let tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[1].element.focus()
    await tabs[1].trigger('keydown', { key: 'ArrowLeft' })
    tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[0].element)
    await tabs[0].trigger('keydown', { key: 'ArrowLeft' })
    tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[3].attributes('aria-selected')).toBe('true')
    await tabs[3].trigger('keydown', { key: 'Home' })
    expect(wrapper.findAll('[role="tab"]')[0].attributes('aria-selected')).toBe('true')
    await wrapper.findAll('[role="tab"]')[0].trigger('keydown', { key: 'End' })
    expect(wrapper.findAll('[role="tab"]')[3].attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('searches padded and numeric numbers within each kind and clears stale selection', async () => {
    const { wrapper } = await mountGuide()
    await wrapper.find('#item-search').setValue('1')
    expect(wrapper.findAll('.item-tile')).toHaveLength(1)
    expect(wrapper.find('.item-tile').text()).toContain('Gun')
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(1)
    expect(wrapper.find('.item-detail h3').text()).toBe('Oil')
    expect(wrapper.find('.item-detail').text()).toContain('Material 1')
    expect(wrapper.find('.filter-bar').exists()).toBe(false)
    await wrapper.find('#item-search').setValue('not present')
    expect(wrapper.findAll('.item-tile')).toHaveLength(0)
    expect(wrapper.find('.item-detail').text()).toContain('No catalog result selected')
    await wrapper.findAll('[role="tab"]')[3].trigger('click')
    await wrapper.find('#item-search').setValue('01')
    expect(wrapper.find('.item-detail h3').text()).toBe('Horror Card')
    expect(wrapper.find('.item-detail img').attributes('alt')).toContain('essence artwork')
    wrapper.unmount()
  })

  it('resets category when leaving Items and renders kind-specific detail fields', async () => {
    const { wrapper } = await mountGuide()
    const category = wrapper.findAll('.chip').find(chip => chip.text() !== 'All')!
    await category.trigger('click')
    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(materials.length)
    expect(wrapper.find('.item-detail').text()).toContain('Material type')
    await wrapper.findAll('[role="tab"]')[3].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(essences.length)
    expect(wrapper.find('.item-detail').text()).toContain('Essence card')
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(items.length)
    expect(wrapper.findAll('.chip')[0].classes()).toContain('chip--active')
    wrapper.unmount()
  })

  it('keeps new controls constrained at a 360px viewport without page-level overflow', () => {
    const styles = readFileSync(`${process.cwd()}/src/assets/styles/main.scss`, 'utf8')
    const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 680px)'))
    expect(mobileStyles).toContain('.catalog-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }')
    expect(mobileStyles).toContain('.catalog-tabs [role="tab"] { min-width: 0; }')
    expect(mobileStyles).toContain('.recipe-search-controls { flex-wrap: wrap; }')
    expect(styles).toContain('.recipe-lookup__search { min-width: 0; }')
  })

  it('renders canonical boss, character, and level records', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.findAll('.portrait').map(node => node.findAll('span').at(-1)!.text())).toEqual(characters.map(record => record.name))
    expect(wrapper.findAll('.level-card').map(node => node.text())).toEqual(levels.map((record, index) => `0${index + 1}${record.name}${record.description}Open arena file →`))
    expect(wrapper.findAll('.boss-card h3').map(node => node.text())).toEqual(bosses.map(record => record.name))
    expect(wrapper.findAll('.boss-card img').map(node => node.attributes('src'))).toEqual(bosses.map(record => record.media))
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
