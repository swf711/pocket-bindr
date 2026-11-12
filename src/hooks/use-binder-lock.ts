'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Per-device "read-only" lock for a binder detail page.
 *
 * Stored in localStorage on purpose: the lock is a viewing preference of this device
 * (e.g. browsing on a phone) and must not stop editing from another device.
 * Every storage access is guarded: when storage is unavailable (private mode, blocked site data)
 * the lock still works for the current page session via an in-memory fallback, it just won't persist.
 */

const KEY_PREFIX = 'pocketbindr:binder-lock:'

export function binderLockStorageKey(binderId: string): string {
  return `${KEY_PREFIX}${binderId}`
}

const listeners = new Set<() => void>()
const memoryFallback = new Map<string, boolean>()

function notify() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keep other tabs of the same binder in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(KEY_PREFIX)) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function readBinderLock(binderId: string): boolean {
  try {
    return window.localStorage.getItem(binderLockStorageKey(binderId)) === '1'
  } catch {
    return memoryFallback.get(binderId) ?? false
  }
}

export function writeBinderLock(binderId: string, locked: boolean): void {
  try {
    const key = binderLockStorageKey(binderId)
    if (locked) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch {
    memoryFallback.set(binderId, locked)
  }
  notify()
}

export function useBinderLock(binderId: string): { locked: boolean; toggle: () => void } {
  const locked = useSyncExternalStore(
    subscribe,
    () => readBinderLock(binderId),
    () => false,
  )
  const toggle = useCallback(() => {
    writeBinderLock(binderId, !readBinderLock(binderId))
  }, [binderId])
  return { locked, toggle }
}
