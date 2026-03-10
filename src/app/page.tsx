import AppShell from '@/components/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, households(*)')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    // Profile doesn't exist yet — redirect to a client page to create it
    redirect('/complete-profile');
  }
  if (!profile?.household_id) redirect('/household');
  return <AppShell currentProfile={profile} />;
}
