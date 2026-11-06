import { describe, it, expect, vi, afterEach } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useInfiniteScroll } from './useInfiniteScroll'

class FakeObserver {
  static all: FakeObserver[] = []
  observed: Element[] = []
  disconnected = false
  callback: (entries: Array<{ isIntersecting: boolean }>) => void
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    this.callback = callback
    FakeObserver.all.push(this)
  }
  observe(element: Element) {
    this.observed.push(element)
  }
  disconnect() {
    this.disconnected = true
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  FakeObserver.all = []
})

function setup() {
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  const target = ref<HTMLElement | null>(document.createElement('div'))
  const disabled = ref(false)
  const onLoadMore = vi.fn()
  const scope = effectScope()
  scope.run(() => useInfiniteScroll({ target, onLoadMore, disabled }))
  return { target, disabled, onLoadMore }
}

describe('useInfiniteScroll', () => {
  it('appelle onLoadMore quand la sentinelle devient visible', async () => {
    const { onLoadMore, target } = setup()
    await nextTick()

    const [observer] = FakeObserver.all
    expect(observer.observed).toEqual([target.value])
    observer.callback([{ isIntersecting: false }])
    expect(onLoadMore).not.toHaveBeenCalled()
    observer.callback([{ isIntersecting: true }])
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('n’observe rien tant qu’il est désactivé, et réobserve à la réactivation', async () => {
    const { disabled } = setup()
    await nextTick()

    disabled.value = true
    await nextTick()
    expect(FakeObserver.all[0].disconnected).toBe(true)
    expect(FakeObserver.all).toHaveLength(1)

    disabled.value = false
    await nextTick()
    expect(FakeObserver.all).toHaveLength(2)
    expect(FakeObserver.all[1].disconnected).toBe(false)
  })

  it('indique l’absence d’IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const scope = effectScope()
    const result = scope.run(() =>
      useInfiniteScroll({ target: ref(null), onLoadMore: vi.fn(), disabled: ref(false) })
    )!

    expect(result.supported).toBe(false)
  })
})
