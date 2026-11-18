'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Clean up any lingering legacy Firebase service workers from previous deployments
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          const scriptUrl = reg.active?.scriptURL || '';
          if (scriptUrl.includes('firebase') || reg.scope?.includes('firebase')) {
            reg.unregister().then(() => {
              console.info('[PWA] Cleaned up legacy Firebase service worker:', scriptUrl);
            });
          }
        }
      }).catch(() => {});

      // Register standard lightweight PWA service worker after initial page load
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Periodic update check
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.info('[PWA] New version available.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}

