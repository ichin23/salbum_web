import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | null = null
let analytics: Analytics | null = null

export async function initFirebase(): Promise<void> {
  if (app) return

  const supported = await isSupported()
  if (!supported) return

  app = initializeApp(firebaseConfig)
  analytics = getAnalytics(app)
}

export function getFirebaseApp(): FirebaseApp | null {
  return app
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics
}
