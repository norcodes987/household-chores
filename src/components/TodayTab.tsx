'use client';

import { getPeriodKey, isChoreToday } from '@/lib/period';
import { createClient } from '@/lib/supabase/client';
import { Chore, Completion, Profile } from '@/lib/types';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TodayTab({
  currentProfile,
}: {
  currentProfile: Profile;
}) {
  const supabase = createClient();
  const [chores, setChores] = useState<Chore[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('ctoday-completions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completions' },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    const [{ data: choresData }, { data: profilesData }] = await Promise.all([
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

    const loadedChores = choresData ?? [];
    setChores(loadedChores);
    setProfiles(profilesData ?? []);
    await fetchCompletions(loadedChores); // ← pass chores directly
    setLoading(false);
  }

  async function fetchCompletions(choreList = chores) {
    const today = new Date();
    const periodKeys = [
      getPeriodKey('daily', today),
      getPeriodKey('weekly', today),
      getPeriodKey('twice_weekly', today),
      getPeriodKey('monthly', today),
    ];

    const todayChoreIds = choreList
      .filter((c) => isChoreToday(c, today))
      .map((c) => c.id);

    if (!todayChoreIds.length) {
      setCompletions([]);
      return;
    }

    const { data } = await supabase
      .from('completions')
      .select('*')
      .in('chore_id', todayChoreIds)
      .in('period_key', periodKeys);

    setCompletions(data ?? []);
  }
  async function toggleCompletion(chore: Chore) {
    setToggling(chore.id);

    try {
      const periodKey = getPeriodKey(chore.recurrence);

      const existing = completions.find(
        (c) => c.chore_id === chore.id && c.period_key === periodKey,
      );

      if (existing) {
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
      } else {
        const { data, error } = await supabase
          .from('completions')
          .insert({
            chore_id: chore.id,
            completed_by: currentProfile.id,
            period_key: periodKey,
          })
          .select()
          .single();

        if (error) throw error;

        setCompletions((prev) => [...prev, data]);
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    }

    setToggling(null);
  }

  const isCompleted = (chore: Chore) => {
    const periodKey = getPeriodKey(chore.recurrence);
    return completions.some(
      (c) => c.chore_id === chore.id && c.period_key === periodKey,
    );
  };

  const getProfile = (id: string | null) => profiles.find((p) => p.id === id);

  // filter to only chores assigned to current user that are due today
  const myChores = chores.filter(
    (c) => c.assigned_to === currentProfile.id && isChoreToday(c),
  );

  const doneCount = myChores.filter(isCompleted).length;
  const allDone = myChores.length > 0 && doneCount === myChores.length;
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Singapore',
  });
  return (
    <div className='p-4'>
      {/* Date header */}
      <div className='mb-4'>
        <p className='text-xs text-gray-400 uppercase tracking-wide'>{today}</p>
        <h2 className='text-lg font-bold text-gray-900'>Your chores today</h2>
        {myChores.length > 0 && (
          <p className='text-sm text-gray-400 mt-0.5'>
            {doneCount} of {myChores.length}
          </p>
        )}
      </div>
      {/* Progress bar */}
      {myChores.length > 0 && (
        <div className='w-full bg-gray-100 rounded-full g-1.5 mb-5'>
          <div
            className='h-1.5 rounded-full transition-all duration-500'
            style={{
              width: `${(doneCount / myChores.length) * 100}%`,
              backgroundColor: currentProfile.colour,
            }}
          />
        </div>
      )}

      {loading ? (
        <p className='text-gray-400 text-center mt-10'>Loading...</p>
      ) : allDone ? (
        <div className='text-center mt-20'>
          <p className='text-5xl mb-3'>🎉</p>
          <p className='font-bold text-gray-700'>All done for today!</p>
          <p className='text-gray-400 text-sm mt-1'>
            Enjoy the rest of your day
          </p>
        </div>
      ) : myChores.length === 0 ? (
        <div className='text-center mt-20'>
          <p className='text-4xl mb-3'>✨</p>
          <p className='font-bold text-gray-700'>Nothing due today</p>
          <p className='text-gray-400 text-sm mt-1'>Check back tomorrow</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {myChores.map((chore) => {
            const done = isCompleted(chore);
            const assignee = getProfile(chore.assigned_to);
            return (
              <button
                key={chore.id}
                onClick={() => toggleCompletion(chore)}
                disabled={toggling === chore.id}
                className={`w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 text-left transition-opacity ${toggling === chore.id ? 'opacity-50' : ''}`}
              >
                {/* Checkbox */}
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transiong-colors`}
                  style={{
                    borderColor: assignee?.colour ?? '#14b8a6',
                    backgroundColor: done
                      ? (assignee?.colour ?? '#14b8a6')
                      : 'transparent',
                  }}
                >
                  {done && <Check size={14} color='white' strokeWidth={3} />}
                </div>
                {/* Chore info */}
                <div className='flex-1'>
                  <p
                    className={`font-medium text-sm ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}
                  >
                    {chore.name}
                  </p>
                  <p className='text-xs text-gray-400 mt-0.5 capitalize'>
                    {chore.recurrence}
                  </p>
                </div>
                {/* Completed by */}
                {done &&
                  (() => {
                    const completion = completions.find(
                      (c) =>
                        c.chore_id === chore.id &&
                        c.period_key === getPeriodKey(chore.recurrence),
                    );
                    const completedBy = getProfile(
                      completion?.completed_by ?? null,
                    );
                    return completedBy ? (
                      <div
                        className='w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold'
                        style={{ backgroundColor: completedBy.colour }}
                      >
                        {completedBy.name[0].toUpperCase()}
                      </div>
                    ) : null;
                  })()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
