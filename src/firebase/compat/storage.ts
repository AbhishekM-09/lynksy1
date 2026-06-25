/* eslint-disable */
import { supabase, isSupabaseConfigured } from './supabaseClient'

export const getStorage = () => ({})
export const storage = getStorage()

export class StorageReference {
  readonly path: string
  constructor(path: string) {
    this.path = path
  }
}

export function ref(storageInstance: any, path: string): StorageReference {
  // Strip any leading firebasestorage domain or gs:// protocol to get raw path
  let cleanPath = path
  if (path.includes('firebasestorage.googleapis.com')) {
    // extract path
    const match = path.match(/\/o\/(.+?)\?/)
    if (match && match[1]) {
      cleanPath = decodeURIComponent(match[1])
    }
  }
  return new StorageReference(cleanPath)
}

const BUCKET_NAME = 'lynksy_bucket'

// Initialize the bucket dynamically in Supabase on demand
let bucketInitialized = false
async function ensureBucketExists() {
  if (bucketInitialized || !isSupabaseConfigured || !supabase) return
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some(b => b.name === BUCKET_NAME)
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 524288000 // 500MB
      })
    }
    bucketInitialized = true
  } catch (err) {
    console.warn('[Supabase Storage] Failed to initialize storage bucket:', err)
  }
}

export async function uploadBytes(storageRef: StorageReference, file: File, metadata?: any) {
  await ensureBucketExists()
  
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storageRef.path, file, {
        upsert: true,
        contentType: file.type
      })
    if (error) {
      throw error
    }
    return { ref: storageRef }
  } else {
    // Offline simulation: read file as Base64/ObjectUrl and cache in memory/localStorage
    const fileUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    try {
      localStorage.setItem(`lynksy_storage_${storageRef.path}`, fileUrl)
    } catch {
      // In case of quota errors, use objectURL
      const objUrl = URL.createObjectURL(file)
      localStorage.setItem(`lynksy_storage_${storageRef.path}`, objUrl)
    }
    return { ref: storageRef }
  }
}

export function uploadBytesResumable(storageRef: StorageReference, file: File, metadata?: any) {
  // Simulate resume task interface
  const listeners = new Set<(snapshot: any) => void>()
  let state = 'running'
  
  const task = {
    on(event: string, progressCb: (snap: any) => void, errorCb?: (err: any) => void, completeCb?: () => void) {
      listeners.add(progressCb)
      
      // Execute upload in next tick
      setTimeout(async () => {
        try {
          progressCb({ bytesTransferred: Math.floor(file.size / 2), totalBytes: file.size })
          await uploadBytes(storageRef, file, metadata)
          progressCb({ bytesTransferred: file.size, totalBytes: file.size })
          state = 'success'
          if (completeCb) completeCb()
        } catch (err) {
          state = 'error'
          if (errorCb) errorCb(err)
        }
      }, 50)
      
      return () => listeners.delete(progressCb)
    },
    snapshot: {
      bytesTransferred: file.size,
      totalBytes: file.size,
      state: 'success'
    }
  }
  
  return task
}

export async function getDownloadURL(storageRef: StorageReference): Promise<string> {
  await ensureBucketExists()

  if (isSupabaseConfigured && supabase) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storageRef.path)
    return data.publicUrl
  } else {
    const cached = localStorage.getItem(`lynksy_storage_${storageRef.path}`)
    if (cached) return cached
    // Fallback placeholder mock URL
    return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`
  }
}

export async function deleteObject(storageRef: StorageReference): Promise<void> {
  await ensureBucketExists()

  localStorage.removeItem(`lynksy_storage_${storageRef.path}`)

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storageRef.path])
    if (error) {
      console.warn(`[Supabase Storage] deleteObject failed for ${storageRef.path}:`, error)
    }
  }
}

export type StorageError = {
  code: string
  message: string
}
