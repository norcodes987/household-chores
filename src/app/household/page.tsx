'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HouseholdPage() {
  const supabase = createClient();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState<string>('');
  const [householdName, setHouseholdName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function createHousehold() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // create household
    const { data: household, error: hError } = await supabase
      .from('households')
      .insert({ name: householdName, created_by: user.id })
      .select()
      .single();
    if (hError || !household) {
      setError(hError?.message ?? 'Failed creating a household');
      setLoading(false);
      return;
    }

    // link profile to household
    await supabase
      .from('profiles')
      .update({ household_id: household.id })
      .eq('user_id', user.id);
    // Small delay to ensure DB write is committed before server component reads it
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/');
    router.refresh();
  }

  async function joinHousehold() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // find household by invite code
    const { data: household, error: hError } = await supabase
      .from('households')
      .select()
      .eq('invite_code', inviteCode.trim().toLowerCase())
      .single();
    if (hError || !household) {
      setError(hError?.message ?? 'Invite code not found');
      setLoading(false);
      return;
    }

    // link profile to household
    await supabase
      .from('profiles')
      .update({ household_id: household.id })
      .eq('user_id', user.id);

    router.push('/');
    router.refresh();
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-sm'>
        <h1 className='text-2xl font-bold mb-6 text-center'>
          Set up your household
        </h1>
        <p className='text-gray-500 text-sm text-center mb-6'>
          Create a new household or join your partner's
        </p>

        <div className='mb-6'>
          <p className='font-medium mb-2 text-sm'>Create new household</p>
          <input
            className='w-full border-rounded-lg px-4 py-2 mb-2 text-sm'
            placeholder='Household name (e.g. The Chongs)'
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
          <button
            disabled={loading || !householdName}
            onClick={createHousehold}
            className='w-full bg-teal-500 text-white rounded-lg py-2 font-medium mb-3 disabled:opacity-50'
          >
            Create household
          </button>
        </div>

        <div className='flex items-center gap-2 mb-6'>
          <div className='flex-1 h-px bg-gray-200' />
          <span className='text-xs text-gray-400'>or</span>
          <div className='flex-1 h-px bg-gray-200' />
        </div>

        <div className='mb-6'>
          <p className='font-medium mb-2 text-sm'>Join with invite code</p>
          <input
            className='w-full border-rounded-lg px-4 py-2 mb-2 text-sm'
            placeholder='Enter invite code'
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button
            disabled={loading || !inviteCode}
            onClick={joinHousehold}
            className='w-full bg-orange-500 text-white rounded-lg py-2 font-medium mb-3 disabled:opacity-50'
          >
            Join household
          </button>
        </div>

        {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}
      </div>
    </div>
  );
}
