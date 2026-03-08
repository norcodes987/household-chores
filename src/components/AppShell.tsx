'use client';

import { Profile } from '@/lib/types';
import { CalendarDays, CheckSquare, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import ChoresTab from './ChoresTab';
import TodayTab from './TodayTab';

type Tab = 'chores' | 'today' | 'calendar';

export default function AppShell({
  currentProfile,
}: {
  currentProfile: Profile;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  return (
    <div className='min-h-screen flex flex-col max-w-md mx-auto'>
      {/* Header */}
      <header className='bg-white border-b px-4 py-3 flex items-cemter justify-between sticky top-0 z-10'>
        <h1 className='font-bold text-lg'>🏠 Household Chores</h1>
        <div className='flex items-center gap-2'>
          <div
            className='w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold'
            style={{ backgroundColor: currentProfile.colour }}
          >
            {currentProfile.name[0].toUpperCase()}
          </div>
          <span className='text-sm text-gray-600'>{currentProfile.name}</span>
        </div>
      </header>

      {/* Tab Content */}
      <main className='flex-1 overflow-y-auto pb-20'>
        {activeTab === 'chores' && (
          <ChoresTab currentProfile={currentProfile} />
        )}

        {activeTab === 'today' && <TodayTab currentProfile={currentProfile} />}
        {activeTab === 'calendar' && (
          <div className='p-4 text-gray-400 text-center mt-20'>
            Calendar tab
          </div>
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className='fixed bottom-0 left-0 right-0 bg-white border-t max-w-md mx-auto'>
        <div className='flex'>
          {(
            [
              { id: 'today', label: 'Today', icon: CheckSquare },
              { id: 'chores', label: 'Chores', icon: ClipboardList },
              { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            ] as { id: Tab; label: string; icon: any }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${activeTab === id ? 'text-teal-600' : 'text-gray-400'}`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
