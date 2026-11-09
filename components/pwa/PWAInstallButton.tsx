'use client';

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone)
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn('Installation prompt dismissed or error:', err);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Installed</span>
      </div>
    );
  }

  if (!deferredPrompt) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 min-h-[36px] ${className}`}
      aria-label="Install Vikasa App on Android or Desktop"
    >
      <Download className="w-3.5 h-3.5" />
      <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
    </button>
  );
}

