'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Copy, Check, LogOut, Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/lib/usePushNotifications';

type Household = {
  id: string;
  name: string;
  invite_code: string;
};

const COLOURS = [
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
];

export default function SettingsTab({
  currentProfile,
}: {
  currentProfile: Profile;
}) {
  const supabase = createClient();
  const router = useRouter();
  const {
    isSubscribed,
    isLoading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications(currentProfile);

  const [household, setHousehold] = useState<Household | null>(null);
  const [name, setName] = useState(currentProfile.name);
  const [colour, setColour] = useState(currentProfile.colour);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchHousehold() {
      const { data } = await supabase
        .from('households')
        .select('*')
        .eq('id', currentProfile.household_id)
        .single();
      setHousehold(data);
    }
    fetchHousehold();
  }, []);

  async function copyCode() {
    if (!household) return;
    await navigator.clipboard.writeText(household.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveProfile() {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ name, colour })
      .eq('id', currentProfile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className='p-4 flex flex-col gap-5'>
      {/* Household section */}
      <div className='bg-white rounded-2xl shadow-sm p-5'>
        <h3 className='font-bold text-sm text-gray-500 uppercase tracking-wide mb-4'>
          Household
        </h3>

        {household && (
          <>
            <p className='text-sm text-gray-500 mb-1'>Name</p>
            <p className='font-medium text-gray-800 mb-4'>{household.name}</p>

            <p className='text-sm text-gray-500 mb-2'>Invite code</p>
            <div className='flex items-center gap-3 bg-gray-50 rounded-xl p-3'>
              <p className='font-mono font-bold text-xl tracking-widest flex-1 text-gray-800'>
                {household.invite_code}
              </p>
              <button
                onClick={copyCode}
                className='flex items-center gap-1.5 text-sm text-teal-600 font-medium'
              >
                {copied ? (
                  <>
                    <Check size={15} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={15} /> Copy
                  </>
                )}
              </button>
            </div>
            <p className='text-xs text-gray-400 mt-2'>
              Share this code with your partner so they can join your household
            </p>
          </>
        )}
      </div>

      {/* Profile section */}
      <div className='bg-white rounded-2xl shadow-sm p-5'>
        <h3 className='font-bold text-sm text-gray-500 uppercase tracking-wide mb-4'>
          Your Profile
        </h3>

        <p className='text-sm text-gray-500 mb-1'>Display name</p>
        <input
          className='w-full border rounded-lg px-4 py-2 mb-4 text-sm'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className='text-sm text-gray-500 mb-2'>Your colour</p>
        <div className='flex gap-2 flex-wrap mb-4'>
          {COLOURS.map((c) => (
            <button
              key={c}
              onClick={() => setColour(c)}
              className={`w-9 h-9 rounded-full border-2 transition-transform
                ${colour === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className='w-full bg-teal-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50'
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Account section */}
      <div className='bg-white rounded-2xl shadow-sm p-5'>
        <h3 className='font-bold text-sm text-gray-500 uppercase tracking-wide mb-4'>
          Account
        </h3>
        <button
          onClick={signOut}
          className='w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 rounded-lg py-2 text-sm font-medium hover:bg-red-50 transition-colors'
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      {/* Notifications section */}
      <div className='bg-white rounded-2xl shadow-sm p-5'>
        <h3 className='font-bold text-sm text-gray-500 uppercase tracking-wide mb-4'>
          Notifications
        </h3>
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium text-sm'>Daily reminders</p>
            <p className='text-xs text-gray-400 mt-0.5'>
              {isSubscribed
                ? 'You will be notified of your chores each morning'
                : 'Get notified each morning when chores are due'}
            </p>
          </div>
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={pushLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
        ${
          isSubscribed
            ? 'bg-red-50 text-red-500 hover:bg-red-100'
            : 'bg-teal-500 text-white hover:bg-teal-600'
        }`}
          >
            {isSubscribed ? (
              <>
                <BellOff size={15} /> Turn off
              </>
            ) : (
              <>
                <Bell size={15} /> Turn on
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
