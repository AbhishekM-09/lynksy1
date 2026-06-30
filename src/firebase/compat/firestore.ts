/* eslint-disable */
import { supabase, isSupabaseConfigured, localDb } from './supabaseClient'

// ─── TIMESTAMP CLASS COMPATIBILITY ────────────────────────────
export class Timestamp {
  readonly seconds: number
  readonly nanoseconds: number

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds
    this.nanoseconds = nanoseconds
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000)
  }

  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1000000)
  }

  static now(): Timestamp {
    return Timestamp.fromDate(new Date())
  }

  static fromDate(date: Date): Timestamp {
    const ms = date.getTime()
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000)
  }

  static fromMillis(ms: number): Timestamp {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000)
  }
}

// ─── FIELDVALUE & PLACEHOLDERS ────────────────────────────────
export const serverTimestamp = () => {
  return { _type: 'serverTimestamp', value: new Date().toISOString() }
}

export const increment = (amount: number) => {
  return { _type: 'increment', value: amount }
}

// Recursively hydrates/de-serializes Firestore data structures
export function hydrateData(data: any): any {
  if (data === null || data === undefined) return data
  if (Array.isArray(data)) {
    return data.map(hydrateData)
  }
  if (typeof data === 'object') {
    // Hydrate Timestamp objects
    if ('seconds' in data && 'nanoseconds' in data && typeof data.seconds === 'number' && typeof data.nanoseconds === 'number') {
      return new Timestamp(data.seconds, data.nanoseconds)
    }
    const hydrated: Record<string, any> = {}
    for (const key of Object.keys(data)) {
      hydrated[key] = hydrateData(data[key])
    }
    return hydrated
  }
  return data
}

// Dehydrates objects for writing
export function dehydrateData(data: any): any {
  if (data === null || data === undefined) return data
  if (data instanceof Timestamp) {
    return { seconds: data.seconds, nanoseconds: data.nanoseconds }
  }
  if (data instanceof Date) {
    const ts = Timestamp.fromDate(data)
    return { seconds: ts.seconds, nanoseconds: ts.nanoseconds }
  }
  if (Array.isArray(data)) {
    return data.map(dehydrateData)
  }
  if (typeof data === 'object') {
    if (data._type === 'serverTimestamp') {
      const ts = Timestamp.fromDate(new Date())
      return { seconds: ts.seconds, nanoseconds: ts.nanoseconds }
    }
    if (data._type === 'increment') {
      return data // Keep as descriptor, handle in upsert
    }
    const custom: Record<string, any> = {}
    for (const key of Object.keys(data)) {
      custom[key] = dehydrateData(data[key])
    }
    return custom
  }
  return data
}

// ─── PATH MAPPING RESOLUTION ──────────────────────────────────
export function getUserIdFromPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean)
  if (segments.length >= 2) {
    if (segments[0] === 'users' || segments[0] === 'analytics') {
      return segments[1]
    }
  }
  return null
}

export function getTableNameForCollection(colPath: string): string {
  const parts = colPath.split('/').filter(Boolean)
  if (parts.length === 1) {
    const name = parts[0]
    if (name === 'customDomains') return 'custom_domains'
    if (name === 'appSettings') return 'app_settings'
    if (name === 'adminLogs') return 'admin_logs'
    if (name === 'emailSubscribers') return 'email_subscribers'
    return name
  }
  if (parts.length === 3) {
    const [p0, , p2] = parts
    if (p0 === 'users') {
      if (p2 === 'links') return 'links'
      if (p2 === 'products') return 'products'
      if (p2 === 'orders') return 'orders'
      if (p2 === 'pageViews') return 'page_views'
      if (p2 === 'clickEvents') return 'click_events'
      if (p2 === 'reviews') return 'reviews'
      if (p2 === 'invoices') return 'invoices'
    }
    if (p0 === 'analytics' && p2 === 'daily') return 'analytics_daily'
    if (p0 === 'short_links' && p2 === 'clicks') return 'short_link_clicks'
  }
  if (parts.length === 5) {
    if (parts[4] === 'records') return 'tip_records'
  }
  return colPath.replace(/\//g, '_')
}

export function getPathTableAndId(path: string) {
  const segments = path.split('/').filter(Boolean)
  if (segments.length % 2 === 0) {
    const id = segments[segments.length - 1]
    const colPath = segments.slice(0, segments.length - 1).join('/')
    const tableName = getTableNameForCollection(colPath)
    return { tableName, id }
  } else {
    const tableName = getTableNameForCollection(path)
    return { tableName, id: null }
  }
}

// ─── CLASS DEFINITIONS ────────────────────────────────────────
export class DocumentReference {
  readonly id: string
  readonly path: string
  readonly collectionPath: string

  constructor(id: string, path: string) {
    this.id = id
    this.path = path
    const segs = path.split('/').filter(Boolean)
    this.collectionPath = segs.slice(0, segs.length - 1).join('/')
  }
}

export class CollectionReference {
  readonly path: string
  constructor(path: string) {
    this.path = path
  }
}

// ─── CREATING REFERENCE BUILDERS ──────────────────────────────
export const getFirestore = () => ({})
export const db = getFirestore()

export function doc(dbOrCol: any, pathOrId?: string, ...additionalSegs: string[]): DocumentReference {
  let fullPath = ''
  if (dbOrCol instanceof CollectionReference) {
    fullPath = dbOrCol.path + '/' + pathOrId
  } else if (dbOrCol instanceof DocumentReference) {
    fullPath = dbOrCol.path + '/' + pathOrId
  } else if (typeof dbOrCol === 'string') {
    fullPath = dbOrCol
    if (pathOrId) fullPath += '/' + pathOrId
  } else {
    // first param is global db object
    fullPath = pathOrId || ''
  }
  
  if (additionalSegs.length > 0) {
    fullPath += '/' + additionalSegs.filter(Boolean).join('/')
  }

  const segments = fullPath.split('/').filter(Boolean)
  const docId = segments[segments.length - 1] || 'generated_' + Math.random().toString(36).substring(2)
  return new DocumentReference(docId, segments.join('/'))
}

export function collection(dbOrDoc: any, pathName?: string, ...additionalSegs: string[]): CollectionReference {
  let fullPath = ''
  if (dbOrDoc instanceof DocumentReference) {
    fullPath = dbOrDoc.path + '/' + pathName
  } else if (typeof dbOrDoc === 'string') {
    fullPath = dbOrDoc
    if (pathName) fullPath += '/' + pathName
  } else {
    fullPath = pathName || ''
  }

  if (additionalSegs.length > 0) {
    fullPath += '/' + additionalSegs.filter(Boolean).join('/')
  }

  const segments = fullPath.split('/').filter(Boolean)
  return new CollectionReference(segments.join('/'))
}

export function collectionGroup(dbInstance: any, collectionId: string): CollectionReference {
  return new CollectionReference(collectionId)
}

// ─── READ & WRITE IMPLEMENTATIONS ─────────────────────────────
export class DocumentSnapshot {
  readonly id: string
  private readonly _exists: boolean
  private readonly _data: any

  constructor(id: string, exists: boolean, data: any) {
    this.id = id
    this._exists = exists
    this._data = hydrateData(data)
  }

  exists(): boolean {
    return this._exists
  }

  data(): any {
    return this._data
  }
}

export async function getDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  const { tableName, id } = getPathTableAndId(docRef.path)
  if (!id) return new DocumentSnapshot(docRef.id, false, null)

  if (isSupabaseConfigured && supabase) {
    let fetchedFromSupabase = false
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('data')
        .eq('id', id)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      fetchedFromSupabase = true
      if (data && data.data) {
        return new DocumentSnapshot(id, true, data.data)
      } else {
        return new DocumentSnapshot(id, false, null)
      }
    } catch (err) {
      console.warn(`[Supabase compat] doc fetch failed for ${tableName}/${id}:`, err)
      if (fetchedFromSupabase) {
        return new DocumentSnapshot(id, false, null)
      }
    }
  }

  // Fallback
  const local = localDb.get(tableName, id)
  if (local) {
    return new DocumentSnapshot(id, true, local)
  }
  return new DocumentSnapshot(docRef.id, false, null)
}

export async function getDocFromCache(docRef: DocumentReference) {
  // Silent fallback to standard getDoc to ensure offline resiliency
  return getDoc(docRef)
}

export async function setDoc(docRef: DocumentReference, data: any, options?: { merge?: boolean; isInsertOnly?: boolean; isUpdateOnly?: boolean }) {
  const { tableName, id } = getPathTableAndId(docRef.path)
  if (!id) return

  const cleanData = dehydrateData(data)
  
  // Inject parent userId mapping from sub-collection path structure
  const pathUserId = getUserIdFromPath(docRef.path)
  if (pathUserId && cleanData && typeof cleanData === 'object') {
    if (!cleanData.userId) {
      cleanData.userId = pathUserId
    }
  }
  
  // Local DB updates
  if (options?.merge) {
    const existing = localDb.get(tableName, id) || {}
    const merged = { ...existing }
    // Deeper merge
    for (const key of Object.keys(cleanData)) {
      if (cleanData[key] && cleanData[key]._type === 'increment') {
        merged[key] = (merged[key] || 0) + cleanData[key].value
      } else {
        merged[key] = cleanData[key]
      }
    }
    localDb.set(tableName, id, merged)
  } else {
    localDb.set(tableName, id, cleanData)
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let finalDataToWrite = cleanData
      let rowExists = false
      let fetchedCheck = false

      if (options?.merge) {
        // Fetch existing first
        const { data: existingRow } = await supabase
          .from(tableName)
          .select('data')
          .eq('id', id)
          .maybeSingle()
        
        if (existingRow) {
          rowExists = true
        }
        fetchedCheck = true
        
        const existingData = existingRow?.data || {}
        const merged = { ...existingData }
        for (const key of Object.keys(cleanData)) {
          if (cleanData[key] && cleanData[key]._type === 'increment') {
            merged[key] = (merged[key] || 0) + cleanData[key].value
          } else {
            merged[key] = cleanData[key]
          }
        }
        finalDataToWrite = merged
      }

      if (options?.isInsertOnly) {
        const { error } = await supabase
          .from(tableName)
          .insert({ id, data: finalDataToWrite, updated_at: new Date().toISOString() })
        if (error) throw error
      } else if (options?.isUpdateOnly) {
        const { error } = await supabase
          .from(tableName)
          .update({ data: finalDataToWrite, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      } else {
        // Standard flow: check if row exists to decide insert vs update, avoiding upsert unless explicitly requested
        if (!fetchedCheck) {
          const { data: existingRow } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', id)
            .maybeSingle()
          rowExists = !!existingRow
        }

        if (rowExists) {
          const { error } = await supabase
            .from(tableName)
            .update({ data: finalDataToWrite, updated_at: new Date().toISOString() })
            .eq('id', id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from(tableName)
            .insert({ id, data: finalDataToWrite, updated_at: new Date().toISOString() })
          if (error) throw error
        }
      }
    } catch (err) {
      console.error(`[Supabase setDoc failed] on ${tableName}/${id}:`, err)
    }
  }
}

export async function updateDoc(docRef: DocumentReference, data: any) {
  await setDoc(docRef, data, { merge: true, isUpdateOnly: true })
}

export async function deleteDoc(docRef: DocumentReference) {
  const { tableName, id } = getPathTableAndId(docRef.path)
  if (!id) return

  localDb.delete(tableName, id)

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error(`[Supabase deleteDoc failed] on ${tableName}/${id}:`, err)
    }
  }
}

export async function addDoc(colRef: CollectionReference, data: any): Promise<DocumentReference> {
  const generatedId = 'gen_' + Math.random().toString(36).substring(2, 15)
  const docRef = doc(colRef, generatedId)
  await setDoc(docRef, data, { isInsertOnly: true })
  return docRef
}

// ─── QUERY BUILDER IMPLEMENTATION ─────────────────────────────
export type QueryConstraint = {
  type: 'where' | 'orderBy' | 'limit'
  field?: string
  op?: string
  value?: any
  direction?: 'asc' | 'desc'
  limitCount?: number
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { type: 'where', field, op, value }
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction }
}

export function limit(count: number): QueryConstraint {
  return { type: 'limit', limitCount: count }
}

export class Query {
  readonly colRef: CollectionReference
  readonly constraints: QueryConstraint[]

  constructor(colRef: CollectionReference, constraints: QueryConstraint[]) {
    this.colRef = colRef
    this.constraints = constraints
  }
}

export function query(colRef: CollectionReference, ...constraints: QueryConstraint[]): Query {
  return new Query(colRef, constraints)
}

// ─── FETCHING DOCUMENT LISTS ──────────────────────────────────
export class QuerySnapshot {
  readonly docs: DocumentSnapshot[]
  readonly empty: boolean

  constructor(docs: DocumentSnapshot[]) {
    this.docs = docs
    this.empty = docs.length === 0
  }

  forEach(callback: (snap: DocumentSnapshot) => void) {
    this.docs.forEach(callback)
  }
}

function toMillisCompact(val: any): number {
  if (val === null || val === undefined) return 0
  if (val instanceof Timestamp) {
    return val.toMillis()
  }
  if (val instanceof Date) {
    return val.getTime()
  }
  if (typeof val === 'object') {
    if ('seconds' in val && typeof val.seconds === 'number') {
      return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000)
    }
    if ('_type' in val && val._type === 'serverTimestamp') {
      return Date.now()
    }
  }
  if (typeof val === 'number') {
    return val
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val)
    if (!isNaN(parsed)) return parsed
  }
  return 0
}

function filterRecordsLocally(list: any[], constraints: QueryConstraint[]): DocumentSnapshot[] {
  let filtered = [...list]
  
  for (const c of constraints) {
    if (c.type === 'where' && c.field && c.op) {
      filtered = filtered.filter(doc => {
        if (!doc) return false
        const val = doc[c.field!]
        const target = c.value
        
        const valCmp = toMillisCompact(val)
        const targetCmp = toMillisCompact(target)
        
        switch (c.op) {
          case '==':
          case '===':
            if (typeof val === 'object' && typeof target === 'object') {
              return toMillisCompact(val) === toMillisCompact(target)
            }
            return val === target
          case '!=':
            if (typeof val === 'object' && typeof target === 'object') {
              return toMillisCompact(val) !== toMillisCompact(target)
            }
            return val !== target
          case '>=':
            return valCmp >= targetCmp
          case '<=':
            return valCmp <= targetCmp
          case '>':
            return valCmp > targetCmp
          case '<':
            return valCmp < targetCmp
          case 'array-contains':
            return Array.isArray(val) && val.includes(target)
          default:
            return true
        }
      })
    }
  }

  // Sorting
  for (const c of constraints) {
    if (c.type === 'orderBy' && c.field) {
      filtered.sort((a, b) => {
        const valA = a[c.field!]
        const valB = b[c.field!]
        if (valA === undefined && valB === undefined) return 0
        if (valA === undefined) return 1
        if (valB === undefined) return -1
        
        const keyA = toMillisCompact(valA)
        const keyB = toMillisCompact(valB)
        
        if (keyA === keyB) return 0
        if (keyA > keyB) return c.direction === 'asc' ? 1 : -1
        return c.direction === 'asc' ? -1 : 1
      })
    }
  }

  // Limits
  for (const c of constraints) {
    if (c.type === 'limit' && c.limitCount !== undefined) {
      filtered = filtered.slice(0, c.limitCount)
    }
  }

  return filtered.map(item => new DocumentSnapshot(item.id || 'id', true, item))
}

export async function getDocs(queryOrCol: Query | CollectionReference): Promise<QuerySnapshot> {
  const colPath = queryOrCol instanceof Query ? queryOrCol.colRef.path : queryOrCol.path
  const constraints = [...(queryOrCol instanceof Query ? queryOrCol.constraints : [])]
  
  const tableName = getTableNameForCollection(colPath)

  // Enforce implicit scoping for subcollections (such as users/{uid}/links) to match Firestore behavior
  const pathUserId = getUserIdFromPath(colPath)
  if (pathUserId) {
    const hasUserIdFilter = constraints.some(c => c.type === 'where' && c.field === 'userId')
    if (!hasUserIdFilter) {
      constraints.push({ type: 'where', field: 'userId', op: '==', value: pathUserId })
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let builder = supabase.from(tableName).select('id, data')
      
      // Let's execute query with local fallback, making it extremely robust
      const { data, error } = await builder
      if (error) throw error

      if (data) {
        const list = data.map(row => ({ id: row.id, ...(row.data || {}) }))
        const hydratedDocs = filterRecordsLocally(list, constraints)
        return new QuerySnapshot(hydratedDocs)
      }
    } catch (err) {
      console.warn(`[Supabase getDocs failed] on table ${tableName}. Falling back to localDb.`, err)
    }
  }

  // Local fallback
  const list = localDb.list(tableName)
  const sorted = filterRecordsLocally(list, constraints)
  return new QuerySnapshot(sorted)
}

// ─── WRITE BATCH TRANSACTIONS ─────────────────────────────────
export class WriteBatch {
  private ops: (() => Promise<void>)[] = []

  set(docRef: DocumentReference, data: any, options?: { merge?: boolean }) {
    this.ops.push(() => setDoc(docRef, data, options))
  }

  update(docRef: DocumentReference, data: any) {
    this.ops.push(() => updateDoc(docRef, data))
  }

  delete(docRef: DocumentReference) {
    this.ops.push(() => deleteDoc(docRef))
  }

  async commit() {
    for (const op of this.ops) {
      await op()
    }
  }
}

export function writeBatch(dbInstance?: any) {
  return new WriteBatch()
}

// ─── REAL-TIME STREAMS (onSnapshot) ───────────────────────────
export function onSnapshot(
  queryOrDoc: Query | CollectionReference | DocumentReference,
  callback: (snapshot: any) => void,
  errorCallback?: (error: any) => void
) {
  let active = true

  const pullAndCallback = async () => {
    if (!active) return
    try {
      if (queryOrDoc instanceof DocumentReference) {
        const snap = await getDoc(queryOrDoc)
        callback(snap)
      } else {
        const snap = await getDocs(queryOrDoc)
        callback(snap)
      }
    } catch (e) {
      if (errorCallback) errorCallback(e)
    }
  }

  // Periodic polling fallback for total simplicity and instant real-time sync in developer preview
  pullAndCallback()
  const interval = setInterval(pullAndCallback, 3000)

  // Subscribing to direct real-time broadcast in Supabase if configured
  let subscription: any
  if (isSupabaseConfigured && supabase) {
    const colPath = queryOrDoc instanceof DocumentReference 
      ? queryOrDoc.collectionPath 
      : (queryOrDoc instanceof Query ? queryOrDoc.colRef.path : queryOrDoc.path)
    const tableName = getTableNameForCollection(colPath)
    
    subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        pullAndCallback()
      })
      .subscribe()
  }

  return () => {
    active = false
    clearInterval(interval)
    if (subscription) {
      supabase?.removeChannel(subscription)
    }
  }
}
