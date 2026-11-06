import { describe, it, expect, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useFocusTrap } from './useFocusTrap'

function buildContainer() {
  const container = document.createElement('div')
  const first = document.createElement('button')
  first.textContent = 'first'
  const middle = document.createElement('input')
  const last = document.createElement('button')
  last.textContent = 'last'
  container.append(first, middle, last)
  document.body.appendChild(container)
  return { container, first, middle, last }
}

function tab(target: HTMLElement, shiftKey = false) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
  )
}

describe('useFocusTrap', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('boucle de Tab sur le dernier élément vers le premier', async () => {
    const { container, last, first } = buildContainer()
    const containerRef = ref<HTMLElement | null>(container)
    const isActive = ref(false)
    useFocusTrap(containerRef, isActive)

    isActive.value = true
    await nextTick()

    last.focus()
    tab(last)

    expect(document.activeElement).toBe(first)
  })

  it('boucle de Shift+Tab sur le premier élément vers le dernier', async () => {
    const { container, last, first } = buildContainer()
    const containerRef = ref<HTMLElement | null>(container)
    const isActive = ref(false)
    useFocusTrap(containerRef, isActive)

    isActive.value = true
    await nextTick()

    first.focus()
    tab(first, true)

    expect(document.activeElement).toBe(last)
  })

  it("restitue le focus à l'élément déclencheur à la désactivation", async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()

    const { container } = buildContainer()
    const containerRef = ref<HTMLElement | null>(container)
    const isActive = ref(false)
    useFocusTrap(containerRef, isActive)

    isActive.value = true
    await nextTick()

    isActive.value = false
    await nextTick()

    expect(document.activeElement).toBe(trigger)
  })
})
