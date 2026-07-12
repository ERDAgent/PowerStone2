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
  ['home', 'Home'],
  ['game-overview', 'About the Game'],
  ['how-to-play', 'How to Play'],
  ['items', 'Items'],
  ['combinations', 'Combinations'],
  ['characters', 'Characters'],
  ['levels', 'Levels'],
  ['enemies', 'Enemies'],
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
  await router.push('/home')
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

    const { wrapper } = await mountAppAt('/home')
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
    const { wrapper, router } = await mountAppAt('/home')
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
    const { wrapper, router } = await mountAppAt('/home')
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
    const { wrapper } = await mountAppAt('/home')
    setSectionPositions(0)
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(currentLinks(wrapper)[0].text()).toBe('Home')

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

  it('recovers an unknown path to the home route', async () => {
    const { wrapper, router } = await mountAppAt('/not-a-real-section')
    expect(router.currentRoute.value.path).toBe('/home')
    expect(wrapper.find('#primary-navigation a[aria-current="page"]').text()).toBe('Home')
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

  it('steps back and forth through characters with the big corner arrows on the fighter file, wrapping at the ends', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.find('.fighter-file h3').text()).toBe(characters[0].name)

    await wrapper.find('[aria-label="Previous character"]').trigger('click')
    expect(wrapper.find('.fighter-file h3').text()).toBe(characters[characters.length - 1].name)

    await wrapper.find('[aria-label="Next character"]').trigger('click')
    expect(wrapper.find('.fighter-file h3').text()).toBe(characters[0].name)

    await wrapper.find('[aria-label="Next character"]').trigger('click')
    expect(wrapper.find('.fighter-file h3').text()).toBe(characters[1].name)
    wrapper.unmount()
  })

  it('renders and synchronously filters the full canonical item catalog', async () => {
    const { wrapper } = await mountGuide()
    await wrapper.findAll('.catalog-tabs [role="tab"]')[1].trigger('click')
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

  it('steps back and forth through the catalog with the big corner arrows on the item detail, wrapping at the ends', async () => {
    const { wrapper } = await mountGuide()
    const firstName = wrapper.find('.item-detail h3').text()

    await wrapper.find('[aria-label="Next catalog entity"]').trigger('click')
    const secondName = wrapper.find('.item-detail h3').text()
    expect(secondName).not.toBe(firstName)

    await wrapper.find('[aria-label="Previous catalog entity"]').trigger('click')
    expect(wrapper.find('.item-detail h3').text()).toBe(firstName)

    await wrapper.find('[aria-label="Previous catalog entity"]').trigger('click')
    expect(wrapper.find('.item-detail h3').text()).not.toBe(firstName)
    await wrapper.find('[aria-label="Next catalog entity"]').trigger('click')
    expect(wrapper.find('.item-detail h3').text()).toBe(firstName)
    wrapper.unmount()
  })

  it('provides ordered catalog tabs with All selected and exact populations', async () => {
    const { wrapper } = await mountGuide()
    const tabs = wrapper.findAll('.catalog-tabs [role="tab"]')
    expect(tabs.map(tab => tab.text())).toEqual(['All', 'Items', 'Materials', 'Essences'])
    expect(tabs.map(tab => tab.attributes('aria-selected'))).toEqual(['true', 'false', 'false', 'false'])
    expect(tabs.map(tab => tab.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    expect(wrapper.findAll('.item-tile')).toHaveLength(152)
    await tabs[1].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(121)
    await tabs[2].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(22)
    await tabs[3].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(9)
    wrapper.unmount()
  })

  it('supports wrapped arrow and Home/End tab activation with focus', async () => {
    const { wrapper } = await mountGuide()
    let tabs = wrapper.findAll<HTMLButtonElement>('.catalog-tabs [role="tab"]')
    tabs[1].element.focus()
    await tabs[1].trigger('keydown', { key: 'ArrowLeft' })
    tabs = wrapper.findAll('.catalog-tabs [role="tab"]')
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[0].element)
    await tabs[0].trigger('keydown', { key: 'ArrowLeft' })
    tabs = wrapper.findAll('.catalog-tabs [role="tab"]')
    expect(tabs[3].attributes('aria-selected')).toBe('true')
    await tabs[3].trigger('keydown', { key: 'Home' })
    expect(wrapper.findAll('.catalog-tabs [role="tab"]')[0].attributes('aria-selected')).toBe('true')
    await wrapper.findAll('.catalog-tabs [role="tab"]')[0].trigger('keydown', { key: 'End' })
    expect(wrapper.findAll('.catalog-tabs [role="tab"]')[3].attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('searches padded and numeric numbers within each kind and clears stale selection', async () => {
    const { wrapper } = await mountGuide()
    await wrapper.findAll('.catalog-tabs [role="tab"]')[1].trigger('click')
    await wrapper.find('#item-search').setValue('1')
    expect(wrapper.findAll('.item-tile')).toHaveLength(1)
    expect(wrapper.find('.item-tile').text()).toContain('Gun')
    await wrapper.findAll('.catalog-tabs [role="tab"]')[2].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(1)
    expect(wrapper.find('.item-detail h3').text()).toBe('Flame Element')
    expect(wrapper.find('.item-detail').text()).toContain('Material 1')
    expect(wrapper.find('.filter-bar').exists()).toBe(false)
    await wrapper.find('#item-search').setValue('not present')
    expect(wrapper.findAll('.item-tile')).toHaveLength(0)
    expect(wrapper.find('.item-detail').text()).toContain('No catalog result selected')
    await wrapper.findAll('.catalog-tabs [role="tab"]')[3].trigger('click')
    await wrapper.find('#item-search').setValue('01')
    expect(wrapper.find('.item-detail h3').text()).toBe('Horror Card')
    expect(wrapper.find('.item-detail img').attributes('alt')).toContain('essence artwork')
    wrapper.unmount()
  })

  it('resets category when leaving Items and renders kind-specific detail fields', async () => {
    const { wrapper } = await mountGuide()
    await wrapper.findAll('.catalog-tabs [role="tab"]')[1].trigger('click')
    const category = wrapper.findAll('.chip').find(chip => chip.text() !== 'All')!
    await category.trigger('click')
    await wrapper.findAll('.catalog-tabs [role="tab"]')[2].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(materials.length)
    expect(wrapper.find('.item-detail').text()).toContain('Material type')
    await wrapper.findAll('.catalog-tabs [role="tab"]')[3].trigger('click')
    expect(wrapper.findAll('.item-tile')).toHaveLength(essences.length)
    expect(wrapper.find('.item-detail').text()).toContain('Essence card')
    await wrapper.findAll('.catalog-tabs [role="tab"]')[1].trigger('click')
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
    expect(wrapper.findAll('.level-chip').map(node => node.text())).toEqual(levels.map((record, index) => `${record.stageCount}-Stage0${index + 1}${record.name}${record.modes.join('')}`))
    expect(wrapper.find('[aria-label="Boss encounters"]').findAll('.entity-chip').map(node => node.text())).toEqual(bosses.map(record => record.name))
    const bossDetailImage = wrapper.find('#enemies').findAll('.entity-file__portrait')[0]
    expect(bossDetailImage.attributes('src')).toBe(bosses[0].media)
    wrapper.unmount()
  })

  it('renders chip art for base-roster characters and an initials fallback for PSP exclusives, badged accordingly', async () => {
    const { wrapper } = await mountGuide()
    const portraitButtons = wrapper.findAll('.portrait')
    expect(portraitButtons).toHaveLength(characters.length)
    characters.forEach((character, index) => {
      const button = portraitButtons[index]
      const img = button.find('img.portrait__avatar')
      const badge = button.find('.status-tag')
      if (character.media) {
        expect(img.exists(), character.name).toBe(true)
        expect(img.attributes('src')).toBe(character.media)
      } else {
        expect(img.exists(), character.name).toBe(false)
        expect(button.find('span.portrait__avatar').text()).toBe(character.name.slice(0, 2).toUpperCase())
      }
      expect(badge.exists(), character.name).toBe(character.availability.length === 1 && character.availability[0] === 'PSP')
    })
    wrapper.unmount()
  })

  it('renders full portrait art and a PSP-exclusive badge in the fighter file for Kraken and Valgas only', async () => {
    const { wrapper } = await mountGuide()
    const kraken = wrapper.findAll('.portrait').find(button => button.text().includes('Kraken'))!
    await kraken.trigger('click')
    expect(wrapper.find('.fighter-file__hero img.fighter-file__portrait').attributes('src')).toBe('/media/characters/full/kraken-full.png')
    expect(wrapper.find('.fighter-file__hero .status-tag').text()).toBe('PSP exclusive')

    const falcon = wrapper.findAll('.portrait').find(button => button.text().includes('Falcon'))!
    await falcon.trigger('click')
    expect(wrapper.find('.fighter-file__hero img.fighter-file__portrait').attributes('src')).toBe('/media/characters/full/falcon-full.png')
    expect(wrapper.find('.fighter-file__hero .status-tag').exists()).toBe(false)
    wrapper.unmount()
  })

  it('selects the first move by default, orders standard before unique, and switches the clip on selection', async () => {
    const { wrapper } = await mountGuide()
    const falcon = characters.find(character => character.name === 'Falcon')!
    const moveButtons = wrapper.findAll('.move-nav__item--standard, .move-nav__item--unique')
    expect(moveButtons.map(button => button.find('.move-nav__name').text())).toEqual(falcon.moveList.map(move => move.name))
    expect(moveButtons.map(button => button.find('.move-nav__type').text())).toEqual(falcon.moveList.map(move => move.type))
    expect(moveButtons[0].classes()).toContain('move-nav__item--active')
    expect(wrapper.find('.detail-panel--moves .move-video__label').text()).toBe(falcon.moveList[0].name)
    expect(wrapper.find('.detail-panel--moves .move-video__player source').attributes('src')).toBe(falcon.moveList[0].video)

    const lastMove = moveButtons.at(-1)!
    await lastMove.trigger('click')
    expect(lastMove.classes()).toContain('move-nav__item--active')
    expect(wrapper.find('.detail-panel--moves .move-video__label').text()).toBe(falcon.moveList.at(-1)!.name)
    wrapper.unmount()
  })

  it('resets the selected move and special to the first entry when switching characters', async () => {
    const { wrapper } = await mountGuide()
    const wangTang = characters.find(character => character.name === 'Wang-Tang')!
    await wrapper.findAll('.move-nav__item--standard, .move-nav__item--unique').at(-1)!.trigger('click')
    await wrapper.findAll('.detail-panel--specials .move-nav__item').at(-1)!.trigger('click')

    await wrapper.findAll('.portrait').find(button => button.text().includes('Wang-Tang'))!.trigger('click')
    expect(wrapper.find('.detail-panel--moves .move-video__label').text()).toBe(wangTang.moveList[0].name)
    expect(wrapper.find('.detail-panel--specials .move-video__label').text()).toBe(wangTang.specials[0].name)
    wrapper.unmount()
  })

  it('renders a special moves list styled apart from the standard moves list and switches its clip independently', async () => {
    const { wrapper } = await mountGuide()
    const falcon = characters.find(character => character.name === 'Falcon')!
    const specialButtons = wrapper.findAll('.detail-panel--specials .move-nav__item')
    expect(specialButtons).toHaveLength(falcon.specials.length)
    specialButtons.forEach(button => expect(button.classes()).toContain('move-nav__item--special'))
    expect(specialButtons[0].classes()).toContain('move-nav__item--active')
    expect(wrapper.find('.detail-panel--specials .move-video__label').text()).toBe(falcon.specials[0].name)

    await specialButtons[1].trigger('click')
    expect(specialButtons[1].classes()).toContain('move-nav__item--active')
    expect(wrapper.find('.detail-panel--specials .move-video__label').text()).toBe(falcon.specials[1].name)
    expect(wrapper.find('.detail-panel--moves .move-video__label').text()).toBe(falcon.moveList[0].name)
    wrapper.unmount()
  })

  it('lists the five editorial characteristics as key-value badges', async () => {
    const { wrapper } = await mountGuide()
    const falcon = characters.find(character => character.name === 'Falcon')!
    const rows = wrapper.findAll('.characteristics-list > div')
    expect(rows.map(row => row.find('dt').text())).toEqual(['Strength', 'Throw Distance', 'Damage', 'Toughness', 'Speed'])
    const badges = rows.map(row => row.find('.badge'))
    expect(badges.map(badge => badge.text())).toEqual([
      falcon.characteristics.strength,
      falcon.characteristics.throwDistance,
      falcon.characteristics.damage,
      falcon.characteristics.toughness,
      falcon.characteristics.speed,
    ])
    badges.forEach(badge => expect(['low', 'medium', 'high']).toContain(badge.text()))
    wrapper.unmount()
  })

  it('selects a level from the nav grid and updates the level file below it', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.find('.level-file h3').text()).toBe(levels[0].name)

    const chips = wrapper.findAll('.level-chip')
    expect(chips).toHaveLength(levels.length)
    const secondLevel = levels[1]
    const chip = chips.find(button => button.text().includes(secondLevel.name))!
    await chip.trigger('click')

    expect(wrapper.find('.level-file h3').text()).toBe(secondLevel.name)
    expect(wrapper.findAll('.level-file__copy p').at(-1)!.text()).toBe(secondLevel.description)
    expect(chip.attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('scrolls the level file into view when a level chip is selected', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { wrapper } = await mountGuide()
    const secondLevel = levels[1]
    const chip = wrapper.findAll('.level-chip').find(button => button.text().includes(secondLevel.name))!
    await chip.trigger('click')
    await wrapper.vm.$nextTick()
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    wrapper.unmount()
  })

  it('steps back and forth through levels with the big corner arrows on the level file, wrapping at the ends', async () => {
    const { wrapper } = await mountGuide()
    expect(wrapper.find('.level-file h3').text()).toBe(levels[0].name)

    await wrapper.find('[aria-label="Previous arena"]').trigger('click')
    expect(wrapper.find('.level-file h3').text()).toBe(levels[levels.length - 1].name)

    await wrapper.find('[aria-label="Next arena"]').trigger('click')
    expect(wrapper.find('.level-file h3').text()).toBe(levels[0].name)

    await wrapper.find('[aria-label="Next arena"]').trigger('click')
    expect(wrapper.find('.level-file h3').text()).toBe(levels[1].name)
    wrapper.unmount()
  })

  it('lays out the level file like the fighter file, with Details, Pictures, and Video panels', async () => {
    const { wrapper } = await mountGuide()
    const panelTitles = wrapper.findAll('.level-file__details .detail-panel h4').map(node => node.text())
    expect(panelTitles).toEqual(['Details', 'Pictures', 'Video'])

    const detailsParagraphs = wrapper.findAll('.detail-panel--details p:not(.eyebrow)')
    expect(detailsParagraphs).toHaveLength(2)
    expect(detailsParagraphs[0].text()).toBe(levels[0].description)

    const pictureThumbs = wrapper.findAll('.detail-panel--pictures .thumb-grid__item')
    expect(pictureThumbs).toHaveLength(levels[0].slides.length)
    const videoThumbs = wrapper.findAll('.detail-panel--video .thumb-grid__item')
    expect(videoThumbs).toHaveLength(3)
    wrapper.unmount()
  })

  it('opens a picture thumbnail in the near-fullscreen gallery dialog and closes it', async () => {
    const { wrapper } = await mountGuide()
    await wrapper.find('.detail-panel--pictures .thumb-grid__item').trigger('click')
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.querySelector('img')).not.toBeNull()
    expect(dialog!.querySelector('video')).toBeNull()

    dialog!.querySelector<HTMLButtonElement>('[aria-label="Close gallery"]')!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('tags each level picture with a "Stage N" badge parsed from its stageN-M filename', async () => {
    const { wrapper } = await mountGuide()
    expect(levels[0].slides).toEqual([
      '/media/levels/levels-gallery/blue-sky-area/stage1-1-compressed.jpg',
      '/media/levels/levels-gallery/blue-sky-area/stage1-2-compressed.jpg',
      '/media/levels/levels-gallery/blue-sky-area/stage2-1-compressed.jpg',
      '/media/levels/levels-gallery/blue-sky-area/stage3-1-compressed.jpg',
    ])

    await wrapper.findAll('.detail-panel--pictures .thumb-grid__item')[0].trigger('click')
    const stageTag = () => document.body.querySelector('[role="dialog"] .status-tag')
    expect(stageTag()?.textContent).toBe('Stage 1')

    document.body.querySelector<HTMLButtonElement>('[aria-label="Next"]')!.click()
    await wrapper.vm.$nextTick()
    expect(stageTag()?.textContent).toBe('Stage 1')

    document.body.querySelector<HTMLButtonElement>('[aria-label="Next"]')!.click()
    await wrapper.vm.$nextTick()
    expect(stageTag()?.textContent).toBe('Stage 2')

    document.body.querySelector<HTMLButtonElement>('[aria-label="Next"]')!.click()
    await wrapper.vm.$nextTick()
    expect(stageTag()?.textContent).toBe('Stage 3')
    wrapper.unmount()
  })

  it('opens a video thumbnail in the gallery dialog and navigates between clips', async () => {
    const { wrapper } = await mountGuide()
    const videoThumbs = wrapper.findAll('.detail-panel--video .thumb-grid__item')
    await videoThumbs[0].trigger('click')
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.querySelector('video')).not.toBeNull()
    expect(dialog!.textContent).toContain('Placeholder clip 1')
    expect(dialog!.textContent).toContain('1 of 3')
    expect(dialog!.querySelector('.status-tag')).toBeNull()

    dialog!.querySelector<HTMLButtonElement>('[aria-label="Next"]')!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')!.textContent).toContain('Placeholder clip 2')

    document.body.querySelector<HTMLButtonElement>('[aria-label="Previous"]')!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')!.textContent).toContain('Placeholder clip 1')
    wrapper.unmount()
  })

  it('selects a boss from the nav grid and updates the details below it, like the characters and levels sections', async () => {
    const { wrapper } = await mountGuide()
    const bossSubsection = wrapper.find('#enemies').findAll('.subsection')[1]
    expect(bossSubsection.find('.subsection__title').text()).toBe('Bosses')
    expect(bossSubsection.find('.entity-file h3').text()).toBe(bosses[0].name)

    const secondBoss = bosses[1]
    const chip = bossSubsection.findAll('.entity-chip').find(button => button.text().includes(secondBoss.name))!
    await chip.trigger('click')
    expect(bossSubsection.find('.entity-file h3').text()).toBe(secondBoss.name)
    expect(bossSubsection.find('.entity-file').text()).toContain(secondBoss.description)
    expect(chip.attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('steps back and forth through bosses with the big corner arrows on the entity file, wrapping at the ends', async () => {
    const { wrapper } = await mountGuide()
    const bossSubsection = wrapper.find('#enemies').findAll('.subsection')[1]
    expect(bossSubsection.find('.entity-file h3').text()).toBe(bosses[0].name)

    await bossSubsection.find('[aria-label="Previous boss"]').trigger('click')
    expect(bossSubsection.find('.entity-file h3').text()).toBe(bosses[bosses.length - 1].name)

    await bossSubsection.find('[aria-label="Next boss"]').trigger('click')
    expect(bossSubsection.find('.entity-file h3').text()).toBe(bosses[0].name)
    wrapper.unmount()
  })

  it('gives every entity-file a Clip/Characteristics details row with a looping video on the left', async () => {
    const { wrapper } = await mountGuide()
    for (const entityFile of wrapper.find('#enemies').findAll('.entity-file')) {
      const panels = entityFile.findAll('.entity-file__details .detail-panel')
      expect(panels).toHaveLength(2)
      expect(panels[0].classes()).toContain('detail-panel--clip')
      expect(panels[1].classes()).toContain('detail-panel--characteristics')

      const video = panels[0].find('video')
      expect(video.exists()).toBe(true)
      expect(video.attributes('loop')).toBeDefined()
      expect(video.attributes('autoplay')).toBeDefined()
      expect(video.find('source').attributes('src')).toBe('/media/videos/gameplay-loop.mp4')

      expect(panels[1].findAll('.attribute-list li').length).toBeGreaterThan(0)
    }
    wrapper.unmount()
  })

  it('gives the Enemies subsection the same nav-plus-details pattern with placeholder entries', async () => {
    const { wrapper } = await mountGuide()
    const enemySubsection = wrapper.find('#enemies').findAll('.subsection')[0]
    expect(enemySubsection.find('.subsection__title').text()).toBe('Enemies')
    const chips = enemySubsection.findAll('.entity-chip')
    expect(chips.length).toBeGreaterThan(1)
    const chipNames = chips.map(chip => chip.findAll('span').at(-1)!.text())
    expect(enemySubsection.find('.entity-file h3').text()).toBe(chipNames[0])
    expect(enemySubsection.find('.entity-file').text()).toContain('Coming soon')

    await chips[1].trigger('click')
    expect(enemySubsection.find('.entity-file h3').text()).toBe(chipNames[1])
    wrapper.unmount()
  })

  it('steps back and forth through placeholder enemies with the big corner arrows on the entity file, wrapping at the ends', async () => {
    const { wrapper } = await mountGuide()
    const enemySubsection = wrapper.find('#enemies').findAll('.subsection')[0]
    const firstName = enemySubsection.find('.entity-file h3').text()

    await enemySubsection.find('[aria-label="Previous enemy"]').trigger('click')
    const lastName = enemySubsection.find('.entity-file h3').text()
    expect(lastName).not.toBe(firstName)

    await enemySubsection.find('[aria-label="Next enemy"]').trigger('click')
    expect(enemySubsection.find('.entity-file h3').text()).toBe(firstName)
    wrapper.unmount()
  })

  it('opens a timeline thumbnail in a near-fullscreen lightbox and closes it', async () => {
    const { wrapper } = await mountGuide()
    await wrapper.find('.timeline__thumb').trigger('click')
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.querySelector('img')?.getAttribute('src')).toBe('/media/placeholders/timeline-milestone-placeholder.svg')
    dialog!.querySelector<HTMLButtonElement>('[aria-label="Close image"]')!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('opens the about accordion on Resources by default and toggles other sections exclusively', async () => {
    const { wrapper } = await mountGuide()
    const triggers = wrapper.findAll('.accordion__trigger')
    expect(triggers.map(trigger => trigger.text().replace(/[+−]$/, ''))).toEqual(['Resources', 'Other', 'Contact'])
    expect(triggers[0].attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#about-resources-panel').isVisible()).toBe(true)
    expect(wrapper.find('.about__reference').exists()).toBe(true)

    await triggers[1].trigger('click')
    expect(triggers[0].attributes('aria-expanded')).toBe('false')
    expect(triggers[1].attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#about-resources-panel').isVisible()).toBe(false)
    expect(wrapper.find('#about-other-panel').isVisible()).toBe(true)

    await triggers[1].trigger('click')
    expect(triggers[1].attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#about-other-panel').isVisible()).toBe(false)
    wrapper.unmount()
  })
})
