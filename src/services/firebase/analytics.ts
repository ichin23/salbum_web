import {
  logEvent,
  setConsent,
  type Analytics,
  type EventParams,
} from 'firebase/analytics'
import { getFirebaseAnalytics } from './index'

const CONSENT_KEY = 'cookie_consent'

export type ConsentStatus = 'granted' | 'denied' | null

export function getSavedConsent(): ConsentStatus {
  return localStorage.getItem(CONSENT_KEY) as ConsentStatus
}

export function saveConsent(status: ConsentStatus): void {
  if (status) {
    localStorage.setItem(CONSENT_KEY, status)
  } else {
    localStorage.removeItem(CONSENT_KEY)
  }
}

export function applyConsent(): void {
  const saved = getSavedConsent()
  if (saved === 'granted') {
    setConsent({ analytics_storage: 'granted' })
  } else if (saved === 'denied') {
    setConsent({ analytics_storage: 'denied' })
  }
}

function getAnalyticsOrNull(): Analytics | null {
  return getFirebaseAnalytics()
}

export function trackEvent(eventName: string, eventParams?: EventParams): void {
  const analytics = getAnalyticsOrNull()
  if (!analytics) return

  logEvent(analytics, eventName, eventParams)
}

export function trackPageView(pageTitle: string, pagePath: string): void {
  trackEvent('page_view', {
    page_title: pageTitle,
    page_path: pagePath,
    page_location: window.location.href,
  })
}

export function trackError(error: Error): void {
  trackEvent('exception', {
    description: error.message,
    fatal: false,
  })
}

export function trackFatalError(error: Error): void {
  trackEvent('exception', {
    description: error.message,
    fatal: true,
  })
}
