'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Chore, Profile } from '@/lib/types';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  chore: Chore | null;
  profiles: Profile[];
  householdId: string;
  onSaved: () => void;
};

const DAYS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
];
export default function ChoreSheet({
  open,
  onClose,
  chore,
  profiles,
  householdId,
  onSaved,
}: Props) {
  const supabase = createClient();
  const [name, setName] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly'>(
    'weekly',
  );
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chore) {
      setName(chore.name);
      setAssignedTo(chore.assigned_to ?? '');
      setRecurrence(chore.recurrence);
      setDayOfWeek(chore.day_of_week ?? 1);
      setDayOfMonth(chore.day_of_month ?? 1);
    } else {
      setName('');
      setAssignedTo(profiles[0]?.id ?? '');
      setRecurrence('weekly');
      setDayOfWeek(1);
      setDayOfMonth(1);
    }
    setError('');
  }, [chore, open]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a chore name');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      assigned_to: assignedTo || null,
      household_id: householdId,
      recurrence,
      day_of_week: recurrence === 'weekly' ? dayOfWeek : null,
      day_of_month: recurrence === 'monthly' ? dayOfMonth : null,
    };

    const { error } = chore
      ? await supabase.from('chores').update(payload).eq('id', chore.id)
      : await supabase.from('chores').insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/40 z-20' onClick={onClose} />

      {/* Sheet */}
      <div className='fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 p-6 max-w-md mx-auto'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-lg font-bold'>
            {chore ? 'Edit Chore' : 'Add Chore'}
          </h2>
          <button
            onClick={onClose}
            className='p-1 text-gray-400 hover:text-gray-600'
          >
            <X size={20} />
          </button>
        </div>

        {/* Name */}
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Chore
        </label>
        <input
          className='w-full border rounded-lg px-4 py-2 mb-4 text-sm'
          placeholder='e.g. Vacuum living room'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Assignee */}
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Assigned to
        </label>
        <div className='flex gap-2 mb-4'>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setAssignedTo(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
                ${assignedTo === p.id ? 'border-transparent text-white' : 'border-gray-200 text-gray-600'}`}
              style={assignedTo === p.id ? { backgroundColor: p.colour } : {}}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Recurrence */}
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Frequency
        </label>
        <div className='flex gap-2 mb-4'>
          {(['daily', 'weekly', 'monthly'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRecurrence(r)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors
                ${recurrence === r ? 'bg-teal-500 text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Day picker */}
        {recurrence === 'weekly' && (
          <>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Which day
            </label>
            <select
              className='w-full border rounded-lg px-4 py-2 mb-4 text-sm'
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </>
        )}

        {recurrence === 'monthly' && (
          <>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Day of month
            </label>
            <select
              className='w-full border rounded-lg px-4 py-2 mb-4 text-sm'
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </>
        )}

        {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className='w-full bg-teal-500 text-white rounded-lg py-3 font-medium disabled:opacity-50'
        >
          {saving ? 'Saving...' : chore ? 'Save changes' : 'Add chore'}
        </button>
      </div>
    </>
  );
}
