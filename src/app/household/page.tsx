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
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

    setCreatedCode(household.invite_code);
    setLoading(false);
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
      .ilike('invite_code', inviteCode.trim())
      .single();
    console.log(hError);
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

  async function copyCode() {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function continueToApp() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/');
    router.refresh();
  }

  if (createdCode) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center'>
          <p className='text-4xl mb-3'>🏠</p>
          <h1 className='text-xl font-bold mb-1 text-gray-900'>
            Household created!
          </h1>
          <p className='text-gray-500 text-sm mb-6'>
            Share this code with your partner so they can join
          </p>

          <div className='bg-gray-50 rounded-xl p-4 mb-3'>
            <p className='text-xs text-gray-400 mb-1 uppercase tracking-wide'>
              Invite code
            </p>
            <p className='text-3xl font-mono font-bold tracking-widest text-gray-800'>
              {createdCode}
            </p>
          </div>

          <button
            onClick={copyCode}
            className='w-full border border-gray-200 rounded-lg py-2 text-sm font-medium mb-6 transition-colors hover:bg-gray-50'
          >
            {copied ? '✓ Copied!' : 'Copy code'}
          </button>

          <button
            onClick={continueToApp}
            className='w-full bg-teal-500 text-white rounded-lg py-2.5 font-medium'
          >
            Continue to app →
          </button>

          <p className='text-xs text-gray-400 mt-4'>
            You can find this code again in Settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-sm'>
        <h1 className='text-2xl font-bold mb-6 text-center text-gray-900'>
          Set up your household
        </h1>
        <p className='text-gray-500 text-sm text-center mb-6'>
          Create a new household or join your partner's
        </p>

        <div className='mb-6'>
          <p className='font-medium mb-2 text-sm'>Create new household</p>
          <input
            className='w-full border-rounded-lg px-4 py-2 mb-2 text-sm text-gray-900'
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
            className='w-full border-rounded-lg px-4 py-2 mb-2 text-sm text-gray-900'
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
