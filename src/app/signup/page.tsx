'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [colour, setColour] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSignUp() {
    setLoading(true);
    setError('');

    // create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed');
      setLoading(false);
      return;
    }

    // create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ user_id: authData.user.id, name, colour });
    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }
    router.push('/household');
    router.refresh();
  }

  const colours = [
    '#14b8a6',
    '#f97316',
    '#8b5cf6',
    '#ec4899',
    '#3b82f6',
    '#f59e0b',
  ];

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-sm'>
        <h1 className='text-2xl font-bold mb-6 text-center'>
          🏠 Create Account
        </h1>
        <input
          className='w-full border rounded-lg px-4 py-2 mb-3 text-sm'
          type='name'
          placeholder='Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className='w-full border rounded-lg px-4 py-2 mb-3 text-sm'
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className='w-full border rounded-lg px-4 py-2 mb-3 text-sm'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className='text-sm text-gray-500 mb-2'>Pick your colour:</p>
        <div className='flex gap-2 mb-4'>
          {colours.map((c) => (
            <button
              key={c}
              onClick={() => setColour(c)}
              className={`w-8 h-8 rounded-full border-2 ${colour === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}
        <button
          disabled={loading}
          onClick={handleSignUp}
          className='w-full bg-teal-500 text-white rounded-lg py-2 font-medium mb-3 disabled:opacity-50'
        >
          {loading ? 'Creating acount...' : 'Create account'}
        </button>
        <p className='text-center text-sm text-gray-500'>
          Already have an account?{' '}
          <a href='/login' className='text-teal-600 font-medium'>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
