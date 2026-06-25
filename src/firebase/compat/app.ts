/* eslint-disable */
import { supabase, isSupabaseConfigured } from './supabaseClient'

export interface FirebaseApp {
  name: string
  options: any
}

const mockApp: FirebaseApp = {
  name: '[Supabase Bridge App]',
  options: {}
}

export function initializeApp(config: any): FirebaseApp {
  console.log('[Supabase Compat] bridge initializeApp called with config:', config)
  return mockApp
}

export const app = mockApp
