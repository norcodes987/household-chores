'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    });
  }, []);
  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShowBanner(false);
    setDeferredPrompt(null);
  }

  if (!showBanner) return null;

  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-teal-500 text-white px-4 py-3 flex items-center justify-between max-w-md mx-auto'>
      <p className='text-sm font-medium'>
        Install Household Chores on your home screen
      </p>
      <div className='flex gap-2 shrink-0'>
        <button
          onClick={() => setShowBanner(false)}
          className='text-xs px-2 py-1 rounded border border-white/40'
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className='text-xs px-2 py-1 rounded bg-white text-teal-600 font-medium'
        >
          Install
        </button>
      </div>
    </div>
  );
}
