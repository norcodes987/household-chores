'use client';

import { createClient } from '@/lib/supabase/client';
import { Chore, Profile } from '@/lib/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ChoreSheet from './ChoreSheet';

export default function ChoresTab({
  currentProfile,
}: {
  currentProfile: Profile;
}) {
  const supabase = createClient();
  const [chores, setChores] = useState<Chore[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();

    // realtime subscription
    const channel = supabase
      .channel('chores-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chores' },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);

    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id, household_id')
      .eq('user_id', user?.id ?? '')
      .single();
    console.log('Profile check:', profileCheck);

    const [{ data: choresData, error: choresError }, { data: profilesData }] =
      await Promise.all([
        supabase
          .from('chores')
          .select('*')
          .eq('household_id', currentProfile.household_id)
          .order('created_at'),
        supabase
          .from('profiles')
          .select('*')
          .eq('household_id', currentProfile.household_id)
          .order('created_at'),
      ]);
    console.log('choresError:', choresError);
    console.log('choresData:', choresData);
    setChores(choresData ?? []);
    setProfiles(profilesData ?? []);
    setLoading(false);
  }

  async function deleteChore(id: string) {
    if (!confirm('Delete this chore?')) return;
    setChores((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from('chores').delete().eq('id', id);

    if (error) {
      setError('Failed to delete chore');
      fetchData();
    }
  }

  function openAdd() {
    setEditingChore(null);
    setSheetOpen(true);
  }

  function openEdit(chore: Chore) {
    setEditingChore(chore);
    setSheetOpen(true);
  }

  const getProfile = (id: string | null) => profiles.find((p) => p.id === id);
  function ordinal(n: number) {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
  const recurrenceLabel = (chore: Chore) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNames = (chore.day_of_week ?? []).map((d) => days[d]).join(' & ');

    if (chore.recurrence === 'daily') return 'Every day';
    if (chore.recurrence === 'weekly') return `Every ${dayNames}`;
    if (chore.recurrence === 'biweekly') return `Every other ${dayNames}`;
    if (chore.recurrence === 'twice_weekly') return `${dayNames} every week`;
    if (chore.recurrence === 'monthly')
      return `Monthly on the ${chore.day_of_month}${ordinal(chore.day_of_month ?? 1)}`;
    return '';
  };
  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-bold text-gray-900'>All Chores</h2>
        <button
          onClick={openAdd}
          className='flex items-center gap-1 bg-teal-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium'
        >
          <Plus size={16} /> Add
        </button>
      </div>
      {loading ? (
        <p className='text-gray-400 text-center mt-10'>Loading...</p>
      ) : chores.length === 0 ? (
        <div className='text-center mt-20'>
          <p className='text-4xl mb-3'>🧹</p>
          <p className='text-gray-500 font-medium'>No chores yet</p>
          <p className='text-gray-400 text-sm'>
            Tap Add to create your first chore
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}
          {chores.map((chore) => {
            const assignee = getProfile(chore.assigned_to);
            return (
              <div
                key={chore.id}
                className='bg-white rounded-xl p-4 shadow-sm flex items-center justify-between'
              >
                <div className='flex items-center gap-3'>
                  {assignee && (
                    <div
                      className='w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0'
                      style={{ backgroundColor: assignee.colour }}
                    >
                      {assignee.name[0].toUpperCase()}{' '}
                    </div>
                  )}
                  <div>
                    <p className='font-medium text-sm'>{chore.name}</p>
                    <p className='text-xs text-gray-400'>
                      {recurrenceLabel(chore)}
                    </p>
                    {assignee && (
                      <p
                        className='text-xs mt-0.5'
                        style={{ color: assignee.colour }}
                      >
                        {assignee.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={() => openEdit(chore)}
                    className='p-2 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-gray-50'
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteChore(chore.id)}
                    className='p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ChoreSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        chore={editingChore}
        profiles={profiles}
        householdId={currentProfile.household_id}
        onSaved={fetchData}
      />
    </div>
  );
}
