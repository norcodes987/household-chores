'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CompleteProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function createProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get pending profile data from localStorage
      const pending = localStorage.getItem('pending_profile');
      const { name, colour } = pending
        ? JSON.parse(pending)
        : { name: user.email?.split('@')[0] ?? 'User', colour: '#14b8a6' };

      // Create the profile
      await supabase.from('profiles').insert({
        user_id: user.id,
        name,
        colour,
      });

      // Clean up
      localStorage.removeItem('pending_profile');

      router.push('/household');
      router.refresh();
    }

    createProfile();
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <p className='text-4xl mb-3'>⏳</p>
        <p className='text-gray-500 text-sm'>Setting up your account...</p>
      </div>
    </div>
  );
}
