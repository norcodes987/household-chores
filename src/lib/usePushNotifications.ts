import { useEffect, useState } from 'react';
import { createClient } from './supabase/client';
import { Profile } from './types';

export function usePushNotifications(currentProfile: Profile) {
  const supabase = createClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', currentProfile.user_id)
      .single();

    setIsSubscribed(!!data);
    setIsLoading(false);
  }

  async function subscribe() {
    setIsLoading(true);
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setIsLoading(false);
        return;
      }

      // Create push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ) as string | BufferSource | null | undefined,
      });
      console.log('subscription: ', subscription);

      // Save to Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from('push_subscriptions').upsert({
        user_id: user!.id,
        profile_id: currentProfile.id,
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
    setIsLoading(false);
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const registration =
        await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', currentProfile.user_id);

      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    }
    setIsLoading(false);
  }

  return { isSubscribed, isLoading, subscribe, unsubscribe };
}

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
