'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  }
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-sm'>
        <h1 className='text-2xl font-bold mb-6 text-center text-gray-900'>
          🏠 Household Chores
        </h1>
        <input
          className='w-full border rounded-lg px-4 py-2 mb-3 text-sm text-gray-900'
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className='w-full border rounded-lg px-4 py-2 mb-3 text-sm text-gray-900'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}
        <button
          disabled={loading}
          onClick={handleLogin}
          className='w-full bg-teal-500 text-white rounded-lg py-2 font-medium mb-3 disabled:opacity-50'
        >
          {loading ? 'Signing in' : 'Sign in'}
        </button>
        <p className='text-center text-sm text-gray-500'>
          No account?{' '}
          <a href='/signup' className='text-teal-600 font-medium'>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
