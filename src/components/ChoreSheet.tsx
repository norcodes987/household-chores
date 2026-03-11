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

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'twice_weekly', label: 'Twice a week' },
  { value: 'monthly', label: 'Monthly' },
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
  const [name, setName] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [recurrence, setRecurrence] = useState<string>('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // default Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chore) {
      setName(chore.name);
      setAssignedTo(chore.assigned_to ?? '');
      setRecurrence(chore.recurrence);
      setSelectedDays(chore.day_of_week ?? [1]);
      setDayOfMonth(chore.day_of_month ?? 1);
    } else {
      setName('');
      setAssignedTo(profiles[0]?.id ?? '');
      setRecurrence('weekly');
      setSelectedDays([1]);
      setDayOfMonth(1);
    }
    setError('');
  }, [chore, open]);

  function toggleDay(day: number) {
    if (recurrence === 'twice_weekly') {
      // Exactly 2 days
      if (selectedDays.includes(day)) {
        if (selectedDays.length > 1)
          setSelectedDays((prev) => prev.filter((d) => d !== day));
      } else {
        if (selectedDays.length < 2) setSelectedDays((prev) => [...prev, day]);
      }
    } else {
      // Single day selection for weekly and biweekly
      setSelectedDays([day]);
    }
  }

  function validateForm(): string | null {
    if (!name.trim()) return 'Please enter a chore name';
    if (recurrence === 'twice_weekly' && selectedDays.length !== 2)
      return 'Please select exactly 2 days';
    if (
      ['weekly', 'biweekly'].includes(recurrence) &&
      selectedDays.length === 0
    )
      return 'Please select a day';
    return null;
  }

  async function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');

    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const payload = {
      name: name.trim(),
      assigned_to: assignedTo || null,
      household_id: householdId,
      recurrence,
      day_of_week: ['daily', 'monthly'].includes(recurrence)
        ? null
        : selectedDays,
      day_of_month: recurrence === 'monthly' ? dayOfMonth : null,
      // Set start_date for biweekly so we have an anchor — use existing or today
      start_date:
        recurrence === 'biweekly' ? (chore?.start_date ?? localDate) : null,
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

  const showDayPicker = ['weekly', 'biweekly', 'twice_weekly'].includes(
    recurrence,
  );

  if (!open) return null;

  return (
    <>
      <div className='fixed inset-0 bg-black/40 z-20' onClick={onClose} />
      <div className='fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 p-6 max-w-md mx-auto'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-lg font-bold text-gray-900'>
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
          Chore name
        </label>
        <input
          className='w-full border rounded-lg px-4 py-2 mb-4 text-sm text-gray-900'
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
          How often
        </label>
        <div className='grid grid-cols-3 gap-2 mb-4'>
          {RECURRENCE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRecurrence(r.value);
                // Reset days appropriately when switching
                if (r.value === 'twice_weekly') setSelectedDays([1, 3]);
                else setSelectedDays([1]);
              }}
              className={`py-2 px-1 rounded-lg border text-xs font-medium transition-colors
                ${
                  recurrence === r.value
                    ? 'bg-teal-500 text-white border-transparent'
                    : 'border-gray-200 text-gray-600'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Day picker */}
        {showDayPicker && (
          <>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {recurrence === 'twice_weekly'
                ? 'Select 2 days'
                : recurrence === 'biweekly'
                  ? 'Which day (every other week)'
                  : 'Which day'}
            </label>
            <div className='grid grid-cols-4 gap-1.5 mb-4'>
              {DAYS.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                const isDisabled =
                  recurrence === 'twice_weekly' &&
                  !isSelected &&
                  selectedDays.length >= 2;
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    disabled={isDisabled}
                    className={`py-2 rounded-lg border text-xs font-medium transition-colors
                      ${
                        isSelected
                          ? 'bg-teal-500 text-white border-transparent'
                          : isDisabled
                            ? 'border-gray-100 text-gray-300'
                            : 'border-gray-200 text-gray-600'
                      }`}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Month day picker */}
        {recurrence === 'monthly' && (
          <>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Day of month
            </label>
            <select
              className='w-full border rounded-lg px-4 py-2 mb-4 text-sm text-gray-900'
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

        {/* Biweekly note */}
        {recurrence === 'biweekly' && (
          <p className='text-xs text-gray-400 mb-4'>
            The schedule starts from when the chore is created and repeats every
            other week on the selected day.
          </p>
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
