/* eslint-disable */
import { createClient } from '@supabase/supabase-js'

// Try to grab environment variables dynamically (works in both Vite and Node.js)
const getEnvVar = (name: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string
  }
  if (typeof window !== 'undefined' && (window as any).importMetaEnv) {
    return (window as any).importMetaEnv[name] || ''
  }
  try {
    // @ts-ignore
    return import.meta.env[name] || ''
  } catch {
    return ''
  }
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || ''
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || ''

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase Migration] No VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY found. Falling back to local offline storage persistence client."
  )
}

// ─── LOCAL STORAGE FALLBACK ENGINE ────────────────────────────
const LOCAL_STORAGE_PREFIX = 'lynksy_compat_'

export const localDb = {
  get: (table: string, id: string): any => {
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${table}_${id}`
      const val = localStorage.getItem(key)
      if (!val) return null
      const parsed = JSON.parse(val)
      if (parsed && typeof parsed === 'object') {
        return { ...parsed, id }
      }
      return parsed
    } catch {
      return null
    }
  },
  set: (table: string, id: string, data: any): void => {
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${table}_${id}`
      localStorage.setItem(key, JSON.stringify(data))
      // Maintain table lists as well for easy querying
      const listKey = `${LOCAL_STORAGE_PREFIX}list_${table}`
      const listVal = localStorage.getItem(listKey)
      const list = listVal ? JSON.parse(listVal) : []
      if (!list.includes(id)) {
        list.push(id)
        localStorage.setItem(listKey, JSON.stringify(list))
      }
    } catch {}
  },
  delete: (table: string, id: string): void => {
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${table}_${id}`
      localStorage.removeItem(key)
      const listKey = `${LOCAL_STORAGE_PREFIX}list_${table}`
      const listVal = localStorage.getItem(listKey)
      if (listVal) {
        let list = JSON.parse(listVal)
        list = list.filter((item: string) => item !== id)
        localStorage.setItem(listKey, JSON.stringify(list))
      }
    } catch {}
  },
  list: (table: string): any[] => {
    try {
      const listKey = `${LOCAL_STORAGE_PREFIX}list_${table}`
      const listVal = localStorage.getItem(listKey)
      if (!listVal) return []
      const ids = JSON.parse(listVal)
      return ids.map((id: string) => {
        const item = localDb.get(table, id)
        if (!item) return null
        if (typeof item === 'object') {
          return { ...item, id }
        }
        return item
      }).filter(Boolean)
    } catch {
      return []
    }
  }
}
