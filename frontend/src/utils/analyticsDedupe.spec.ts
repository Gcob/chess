import {describe, it, expect} from 'vitest'
import {createPageviewDedupe} from './analyticsDedupe'

function pageview(url: string) {
  return {type: 'pageview', url} as const
}

describe('createPageviewDedupe', () => {
  it('drops a pageview repeating the previous URL', () => {
    const dedupe = createPageviewDedupe()

    expect(dedupe(pageview('https://chess.test/'))).toEqual(pageview('https://chess.test/'))
    expect(dedupe(pageview('https://chess.test/'))).toBeNull()
  })

  it('keeps a pageview on a different URL', () => {
    const dedupe = createPageviewDedupe()

    dedupe(pageview('https://chess.test/'))
    expect(dedupe(pageview('https://chess.test/new-game'))).toEqual(pageview('https://chess.test/new-game'))
  })

  it('keeps a URL visited again after leaving it', () => {
    const dedupe = createPageviewDedupe()

    dedupe(pageview('https://chess.test/'))
    dedupe(pageview('https://chess.test/new-game'))
    expect(dedupe(pageview('https://chess.test/'))).toEqual(pageview('https://chess.test/'))
  })

  it('never drops custom events, even repeated ones', () => {
    const dedupe = createPageviewDedupe()
    const event = {type: 'event', url: 'https://chess.test/'} as const

    expect(dedupe(event)).toEqual(event)
    expect(dedupe(event)).toEqual(event)
  })

  it('tracks pageviews independently of custom events on the same URL', () => {
    const dedupe = createPageviewDedupe()

    dedupe(pageview('https://chess.test/'))
    dedupe({type: 'event', url: 'https://chess.test/new-game'})
    expect(dedupe(pageview('https://chess.test/'))).toBeNull()
  })
})
