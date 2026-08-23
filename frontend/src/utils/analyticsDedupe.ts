import type {BeforeSend, BeforeSendEvent} from '@vercel/analytics'

// The vue integration sends a first pageview from setup(), then sends it again once the router
// confirms the initial navigation, so the landing page is counted twice on every visit. Two
// consecutive pageviews on the same URL never describe a real second view, so the echo is dropped.
export function createPageviewDedupe(): BeforeSend {
  let lastPageviewUrl: string | null = null

  return (event: BeforeSendEvent) => {
    if (event.type !== 'pageview') {
      return event
    }

    if (event.url === lastPageviewUrl) {
      return null
    }

    lastPageviewUrl = event.url
    return event
  }
}
