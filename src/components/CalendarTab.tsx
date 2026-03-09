'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Chore, Completion, Profile } from '@/lib/types';
import { getPeriodKey, getCalendarGrid, getChoresForDate } from '@/lib/period';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export default function CalendarTab({
  currentProfile,
}: {
  currentProfile: Profile;
}) {
  const supabase = createClient();
  const [chores, setChores] = useState<Chore[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('calendar-completions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completions' },
        fetchCompletions,
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
        .eq('household_id', currentProfile.household_id),
    ]);
    setChores(choresData ?? []);
    setProfiles(profilesData ?? []);
    await fetchCompletions();
    setLoading(false);
  }

  async function fetchCompletions() {
    const { data } = await supabase
      .from('completions')
      .select('*')
      .in(
        'chore_id',
        (
          await supabase
            .from('chores')
            .select('id')
            .eq('household_id', currentProfile.household_id)
        ).data?.map((c) => c.id) ?? [],
      );
    setCompletions(data ?? []);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function isCompleted(choreId: string, date: Date, recurrence: string) {
    const periodKey = getPeriodKey(recurrence as any, date);
    return completions.some(
      (c) => c.chore_id === choreId && c.period_key === periodKey,
    );
  }

  function getDayStatus(date: Date): 'done' | 'overdue' | 'upcoming' | 'empty' {
    const dayChoreIds = getChoresForDate(chores, date);
    if (dayChoreIds.length === 0) return 'empty';

    const choresForDay = chores.filter((c) => dayChoreIds.includes(c.id));
    const allDone = choresForDay.every((c) =>
      isCompleted(c.id, date, c.recurrence),
    );
    if (allDone) return 'done';

    const isPast =
      date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) return 'overdue';
    return 'upcoming';
  }

  const grid = getCalendarGrid(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const selectedChoreIds = selectedDate
    ? getChoresForDate(chores, selectedDate)
    : [];
  const selectedChores = chores.filter((c) => selectedChoreIds.includes(c.id));
  const getProfile = (id: string | null) => profiles.find((p) => p.id === id);

  return (
    <div className='p-4'>
      {/* Month navigation */}
      <div className='flex items-center justify-between mb-4'>
        <button
          onClick={prevMonth}
          className='p-2 hover:bg-gray-100 rounded-lg'
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className='font-bold text-base'>{monthName}</h2>
        <button
          onClick={nextMonth}
          className='p-2 hover:bg-gray-100 rounded-lg'
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day labels */}
      <div className='grid grid-cols-7 mb-1'>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div
            key={d}
            className='text-center text-xs text-gray-400 font-medium py-1'
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <p className='text-center text-gray-400 mt-10'>Loading...</p>
      ) : (
        <div className='grid grid-cols-7 gap-1'>
          {grid.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;

            const status = getDayStatus(date);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected =
              selectedDate?.toDateString() === date.toDateString();
            const dayChoreCount = getChoresForDate(chores, date).length;

            const statusStyles = {
              done: 'bg-emerald-100 text-emerald-700',
              overdue: 'bg-red-100 text-red-600',
              upcoming: 'bg-teal-50 text-teal-700',
              empty: 'text-gray-500',
            };

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                  ${statusStyles[status]}
                  ${isToday ? 'ring-2 ring-teal-500' : ''}
                  ${isSelected ? 'ring-2 ring-gray-800 scale-105' : ''}
                  ${status === 'empty' ? 'hover:bg-gray-100' : 'hover:opacity-80'}
                `}
              >
                {date.getDate()}
                {dayChoreCount > 0 && (
                  <span className='text-xs opacity-60 leading-none'>
                    {dayChoreCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className='flex gap-4 mt-4 justify-center'>
        {[
          { colour: 'bg-emerald-100 text-emerald-700', label: 'All done' },
          { colour: 'bg-red-100 text-red-600', label: 'Overdue' },
          { colour: 'bg-teal-50 text-teal-700', label: 'Upcoming' },
        ].map(({ colour, label }) => (
          <div key={label} className='flex items-center gap-1.5'>
            <div className={`w-3 h-3 rounded-sm ${colour.split(' ')[0]}`} />
            <span className='text-xs text-gray-500'>{label}</span>
          </div>
        ))}
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <>
          <div
            className='fixed inset-0 bg-black/40 z-20'
            onClick={() => setSelectedDate(null)}
          />
          <div className='fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 p-6 max-w-md mx-auto max-h-[70vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-bold text-base'>
                {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className='p-1 text-gray-400 hover:text-gray-600'
              >
                <X size={20} />
              </button>
            </div>

            {selectedChores.length === 0 ? (
              <p className='text-gray-400 text-sm text-center py-6'>
                No chores this day 🎉
              </p>
            ) : (
              <div className='flex flex-col gap-3'>
                {selectedChores.map((chore) => {
                  const done = isCompleted(
                    chore.id,
                    selectedDate,
                    chore.recurrence,
                  );
                  const assignee = getProfile(chore.assigned_to);
                  const completion = completions.find(
                    (c) =>
                      c.chore_id === chore.id &&
                      c.period_key ===
                        getPeriodKey(chore.recurrence as any, selectedDate),
                  );
                  const completedBy = getProfile(
                    completion?.completed_by ?? null,
                  );

                  return (
                    <div
                      key={chore.id}
                      className='flex items-center gap-3 bg-gray-50 rounded-xl p-3'
                    >
                      {/* Status icon */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0`}
                        style={{
                          backgroundColor: done
                            ? (assignee?.colour ?? '#14b8a6')
                            : '#e5e7eb',
                        }}
                      >
                        {done ? (
                          <Check size={14} color='white' strokeWidth={3} />
                        ) : (
                          <span className='w-2 h-2 rounded-full bg-gray-400' />
                        )}
                      </div>

                      {/* Chore info */}
                      <div className='flex-1'>
                        <p
                          className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        >
                          {chore.name}
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

                      {/* Completed by avatar */}
                      {done && completedBy && (
                        <div className='flex items-center gap-1'>
                          <span className='text-xs text-gray-400'>by</span>
                          <div
                            className='w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold'
                            style={{ backgroundColor: completedBy.colour }}
                          >
                            {completedBy.name[0].toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
