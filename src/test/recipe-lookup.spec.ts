import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeLookup from '@/components/RecipeLookup.vue'
import { getRecipesForResult, items } from '@/data'

function mountLookup() { return mount(RecipeLookup, { attachTo: document.body }) }

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

  it('shows every resolved alternative in canonical order with media and provenance', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Gun')
    const expected = getRecipesForResult('item-gun')
    const cards = wrapper.findAll('.resolved-recipe')
    expect(cards).toHaveLength(expected.length)
    expect(cards.map(card => card.find('h4').text())).toEqual(expected.map((_, index) => `Alternative ${index + 1}`))
    expect(cards[0].text()).toContain('Iron')
    expect(cards[0].text()).toContain('Flame Element')
    expect(cards[0].text()).toContain('Iron + Flame Element')
    expect(cards[0].text()).toContain('item-1|1|Iron + Flame Element')
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

  it('surfaces a selected result provenance note alongside resolved source provenance', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Homing Missile')
    expect(wrapper.find('.recipe-result-note').text()).toContain('Marking Missile')
    expect(wrapper.find('.recipe-provenance').text()).toContain('Source:')
    expect(wrapper.find('.recipe-provenance').text()).toContain('item-8|')
    wrapper.unmount()
  })

  it('provides clear no-recipe and no-match states', async () => {
    const wrapper = mountLookup()
    await searchAndSelect(wrapper, 'Beam Gun')
    expect(wrapper.find('.recipe-empty--detail').text()).toContain('No resolved recipe documented')
    await wrapper.find('#recipe-search').setValue('not in this catalog')
    expect(wrapper.find('.recipe-options [role="status"]').text()).toContain('No items match')
    wrapper.unmount()
  })

  it('exposes the complete selectable result catalog synchronously', () => {
    const wrapper = mountLookup()
    expect(wrapper.findAll('.recipe-option')).toHaveLength(items.length)
    expect(wrapper.findAll('.recipe-option').every(option => option.attributes('role') === 'option')).toBe(true)
    wrapper.unmount()
  })
})
