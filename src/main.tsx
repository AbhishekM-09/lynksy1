import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

// Safe ResizeObserver polyfill/override for "TypeError: Illegal constructor" in nested sandboxed iframes
if (typeof window !== 'undefined') {
  // --- GOOGLE SIGN-IN POPUP DETECTOR AND CLOSER ---
  if (window.opener && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
    console.log('[Popup Detector] OAuth callback popup detected. Awaiting token extraction...');
    
    // Poll to verify when Supabase or our compat layer saves the session to local storage
    const pollInterval = setInterval(() => {
      const currentSessionHex = localStorage.getItem('lynksy_current_user');
      const keys = Object.keys(localStorage);
      const hasSupabaseMeta = keys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      
      if (currentSessionHex || hasSupabaseMeta) {
        clearInterval(pollInterval);
        console.log('[Popup Detector] Session detected. Closing popup and notifying parent...');
        try {
          window.opener.postMessage({ type: 'oauth_complete' }, window.location.origin);
        } catch (err) {
          console.warn('[Popup Detector] postMessage to opener blocked/failed:', err);
        }
        setTimeout(() => {
          try { window.close(); } catch { }
        }, 800);
      }
    }, 200);

    // Secure fallback: force close after 5 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('[Popup Detector] Fallback reached. Notifying parent and closing...');
      try {
        window.opener.postMessage({ type: 'oauth_complete' }, window.location.origin);
      } catch { }
      try { window.close(); } catch { }
    }, 5000);
  }

  const OriginalResizeObserver = window.ResizeObserver;
  let isBroken = false;
  
  if (!OriginalResizeObserver) {
    isBroken = true;
  } else {
    try {
      new OriginalResizeObserver(() => {});
    } catch (err) {
      const error = err as Error;
      if (err instanceof TypeError || (error && error.message && error.message.includes('constructor'))) {
        isBroken = true;
      }
    }
  }

  if (isBroken) {
    console.warn('Local ResizeObserver is missing or throws "Illegal constructor". Activating safe global fallback.');
    class SafeResizeObserver {
      private callback: ResizeObserverCallback;
      private targets: Set<Element> = new Set();
      private intervalId: ReturnType<typeof setInterval> | null = null;
      private lastSizes = new Map<Element, { width: number; height: number }>();

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(target: Element) {
        if (!target) return;
        this.targets.add(target);
        this.lastSizes.set(target, {
          width: target.clientWidth,
          height: target.clientHeight
        });

        if (!this.intervalId) {
          this.intervalId = setInterval(() => {
            const entries: ResizeObserverEntry[] = [];
            this.targets.forEach((el) => {
              const last = this.lastSizes.get(el);
              const currentWidth = el.clientWidth;
              const currentHeight = el.clientHeight;
              if (last && (last.width !== currentWidth || last.height !== currentHeight)) {
                this.lastSizes.set(el, { width: currentWidth, height: currentHeight });
                entries.push({
                  target: el,
                  contentRect: el.getBoundingClientRect(),
                  borderBoxSize: [],
                  contentBoxSize: [],
                  devicePixelContentBoxSize: []
                } as unknown as ResizeObserverEntry);
              }
            });
            if (entries.length > 0) {
              try {
                this.callback(entries, this as unknown as ResizeObserver);
              } catch (e) {
                console.error('ResizeObserver callback error', e);
              }
            }
          }, 200);
        }
      }

      unobserve(target: Element) {
        this.targets.delete(target);
        this.lastSizes.delete(target);
        if (this.targets.size === 0 && this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }

      disconnect() {
        this.targets.clear();
        this.lastSizes.clear();
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
    }
    window.ResizeObserver = SafeResizeObserver as unknown as typeof ResizeObserver;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
