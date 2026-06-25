import { db } from './config'
import {
  collection, doc, query, where, limit, getDocs, setDoc, updateDoc, serverTimestamp
} from 'firebase/firestore'
import { PaymentConnection } from '@/types/store'
import { handleFirestoreError, OperationType } from './firestore'

export async function getPaymentConnection(uid: string): Promise<PaymentConnection | null> {
  const path = 'payment_connections'
  try {
    const q1 = query(
      collection(db, path),
      where('user_id', '==', uid),
      limit(1)
    )
    const snap1 = await getDocs(q1)
    if (!snap1.empty) {
      const docSnap = snap1.docs[0]
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data
      } as PaymentConnection
    }

    // Attempt userId search fallback
    const q2 = query(
      collection(db, path),
      where('userId', '==', uid),
      limit(1)
    )
    const snap2 = await getDocs(q2)
    if (!snap2.empty) {
      const docSnap = snap2.docs[0]
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data
      } as PaymentConnection
    }

    return null
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return null
  }
}

export async function savePaymentConnection(uid: string, data: Partial<PaymentConnection>): Promise<void> {
  const path = 'payment_connections'
  try {
    const existing = await getPaymentConnection(uid)
    if (existing && existing.id) {
      await updateDoc(doc(db, path, existing.id), {
        ...data,
        updated_at: serverTimestamp()
      })
    } else {
      const newDocRef = doc(collection(db, path))
      await setDoc(newDocRef, {
        ...data,
        id: newDocRef.id,
        user_id: uid,
        userId: uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      })
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path)
  }
}

export async function disconnectPaymentConnection(uid: string): Promise<void> {
  const path = 'payment_connections'
  try {
    const existing = await getPaymentConnection(uid)
    if (existing && existing.id) {
      // Hard delete or set status to disconnected as requested in specs: 
      // "Disconnecting will disable: Product purchases..."
      // Let's set status = 'disconnected' as requested:
      // "Disconnect Gateway Button: Generates a custom modal warning... Requires user to confirm action"
      // Wait, we can completely delete the record so there's no leftover credentials,
      // or we can update status = 'disconnected'.
      // Let's set status = 'disconnected' so they can see historic connection has been disconnected, or let's delete the doc.
      // Let's set status = 'disconnected' so we can preserve the merchant ID mask on reconnect or disable-state.
      await updateDoc(doc(db, path, existing.id), {
        status: 'disconnected',
        updated_at: serverTimestamp()
      })
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path)
  }
}
