import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import RecipeLookup from '@/components/RecipeLookup.vue'
import { getRecipesForResult, items } from '@/data'
import { routes } from '@/router'

function mountLookup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  return mount(RecipeLookup, { attachTo: document.body, global: { plugins: [pinia, router] } })
}

async function searchAndSelect(wrapper: ReturnType<typeof mountLookup>, query: string) {
  const input = wrapper.find<HTMLInputElement>('#recipe-search')
  await input.setValue(query)
  await input.trigger('keydown', { key: 'Enter' })
  return input
}

describe('recipe lookup', () => {
  it('searches case-insensitively and selects by keyboard without moving input focus', async () => {
    const wrapper = mountLookup()
    const input = wrapper.find<HTMLInputElement>('#recipe-search')
    input.element.focus()
    await input.setValue('mAcHiNe GuN')
    expect(wrapper.findAll('.recipe-option')).toHaveLength(1)
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('.recipe-result-heading h3').text()).toBe('Machine Gun')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.findAll('.resolved-recipe')).toHaveLength(getRecipesForResult('item-machinegun').length)
    wrapper.unmount()
  })

  it('uses arrow keys to change the active result while focus remains in search', async () => {
    const wrapper = mountLookup()
    const input = wrapper.find<HTMLInputElement>('#recipe-search')
    input.element.focus()
    await input.setValue('gun')
    const firstActive = input.attributes('aria-activedescendant')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).not.toBe(firstActive)
    expect(document.activeElement).toBe(input.element)
    await input.trigger('keydown', { key: 'Enter' })
    expect(document.activeElement).toBe(input.element)
    wrapper.unmount()
  })

  it('shows every resolved alternative in canonical order with media and no provenance', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Gun')
    const expected = getRecipesForResult('item-gun')
    const cards = wrapper.findAll('.resolved-recipe')
    expect(cards).toHaveLength(expected.length)
    expect(cards.map(card => card.find('h4').text())).toEqual(expected.map((_, index) => `Recipe ${index + 1}`))
    expect(cards[0].text()).toContain('Iron')
    expect(cards[0].text()).toContain('Flame Element')
    expect(cards[0].text()).not.toContain('Iron + Flame Element')
    expect(cards[0].text()).not.toContain('item-1|1|Iron + Flame Element')
    expect(cards[0].text()).not.toContain('Source:')
    expect(cards[0].find('.recipe-provenance').exists()).toBe(false)
    expect(cards[0].findAll('img').length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('discloses ambiguous manifest rows without rendering them as recipes', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, '5-Way Shotgun')
    expect(wrapper.find('.recipe-warning').text()).toContain('1 additional formula is ambiguous')
    expect(wrapper.findAll('.resolved-recipe')).toHaveLength(getRecipesForResult('item-5wayshotgun').length)
    expect(wrapper.text()).not.toContain('Beam Gun Gun')
    wrapper.unmount()
  })

  it('hides the recipe note when none is recorded and always hides resolved source provenance', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Homing Missile')
    expect(wrapper.find('.recipe-result-note').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Source:')
    expect(wrapper.text()).not.toContain('item-8|')
    expect(wrapper.find('.recipe-provenance').exists()).toBe(false)
    wrapper.unmount()
  })

  it('provides clear no-recipe and no-match states', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Beam Gun')
    expect(wrapper.find('.recipe-empty--detail').text()).toContain('No resolved recipe documented')
    await wrapper.find('#recipe-search').setValue('not in this catalog')
    expect(wrapper.find('.recipe-options [role="status"]').text()).toContain('No Items Found')
    wrapper.unmount()
  })

  it('exposes the complete selectable result catalog synchronously', () => {
    const wrapper = mountLookup()
    expect(wrapper.findAll('.recipe-option')).toHaveLength(items.length)
    expect(wrapper.findAll('.recipe-option').every(option => option.attributes('role') === 'option')).toBe(true)
    wrapper.unmount()
  })

  it('uses human-readable item numbers and canonical selected type context', async () => {
    const wrapper = mountLookup()
    expect(wrapper.find('.recipe-option small').text()).toBe('Item 1 · Shooting')
    await searchAndSelect(wrapper, '001')
    expect(wrapper.find('.recipe-result-heading .eyebrow').text()).toBe('Shooting · #001')
    wrapper.unmount()
  })

  it('clears query, selection, and active option while restoring input focus', async () => {
    const wrapper = mountLookup()
    const input = await searchAndSelect(wrapper, 'Gun')
    await wrapper.find('.search-field__clear').trigger('click')
    expect(input.element.value).toBe('')
    expect(wrapper.find('.recipe-result-heading').exists()).toBe(false)
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    expect(document.activeElement).toBe(input.element)
    wrapper.unmount()
  })

  it('selects an option by click without rewriting the query or narrowing the option list', async () => {
    const wrapper = mountLookup()
    const input = wrapper.find<HTMLInputElement>('#recipe-search')
    input.element.focus()
    await input.setValue('gun')
    const optionsBefore = wrapper.findAll('.recipe-option')
    expect(optionsBefore.length).toBeGreaterThan(1)
    const rayGunOption = optionsBefore.find(option => option.text().includes('Ray Gun'))
    await rayGunOption!.trigger('click')
    expect(input.element.value).toBe('gun')
    expect(wrapper.findAll('.recipe-option')).toHaveLength(optionsBefore.length)
    expect(wrapper.find('.recipe-result-heading h3').text()).toBe('Ray Gun')
    expect(document.activeElement).toBe(rayGunOption!.element)
    wrapper.unmount()
  })

  it('renders material and essence PNG imagery in formulas', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Gun')
    expect(wrapper.findAll('.recipe-entity img').some(image => image.attributes('src').startsWith('/media/materials/'))).toBe(true)
    await wrapper.find('#recipe-search').setValue('Powerful Buster')
    await wrapper.find('#recipe-search').trigger('keydown', { key: 'Enter' })
    expect(wrapper.findAll('.recipe-entity img').some(image => image.attributes('src').startsWith('/media/essences/'))).toBe(true)
    wrapper.unmount()
  })
})
