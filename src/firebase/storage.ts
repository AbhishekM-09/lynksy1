import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error('File must be under 2MB')

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  const fileExt = file.name ? file.name.split('.').pop()?.toLowerCase() : ''
  let fileType = file.type
  if (!allowed.includes(fileType)) {
    if (fileExt === 'jpg' || fileExt === 'jpeg') fileType = 'image/jpeg'
    else if (fileExt === 'png') fileType = 'image/png'
    else if (fileExt === 'webp') fileType = 'image/webp'
  }

  if (!allowed.includes(fileType))
    throw new Error('Only JPEG, PNG, WebP allowed')

  const ext = fileType === 'image/png' ? 'png' : fileType === 'image/webp' ? 'webp' : 'jpg'
  const storageRef = ref(storage, `avatars/${uid}.${ext}`)
  await uploadBytes(storageRef, file, { contentType: fileType })
  return getDownloadURL(storageRef)
}

export async function deleteAvatar(uid: string) {
  try {
    for (const ext of ['jpg','png','webp']) {
      await deleteObject(ref(storage, `avatars/${uid}.${ext}`)).catch(() => {})
    }
  } catch { /* ignore */ }
}
