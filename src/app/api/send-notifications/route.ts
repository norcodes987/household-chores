import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Protect the endpoint with a secret so only Vercel Cron can call it
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  // Get all profiles whose notify_time matches current time (within the hour)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, notify_time, household_id')
    .not('household_id', 'is', null);

  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const profile of profiles) {
    // Check if this profile's notify_time matches current hour
    const [notifyHour] = (profile.notify_time ?? '08:00').split(':');
    const [currentHour] = currentTime.split(':');
    if (notifyHour !== currentHour) continue;

    // Get chores assigned to this profile due today
    const { data: chores } = await supabase
      .from('chores')
      .select('*')
      .eq('household_id', profile.household_id)
      .eq('assigned_to', profile.id);

    if (!chores?.length) continue;

    const dueToday = chores.filter((c) => {
      if (c.recurrence === 'daily') return true;
      if (c.recurrence === 'weekly') return c.day_of_week === dayOfWeek;
      if (c.recurrence === 'monthly') return c.day_of_month === dayOfMonth;
      return false;
    });

    if (!dueToday.length) continue;

    // get push subscriptions for this user
    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('profile_id', profile.id)
      .single();

    if (!sub?.subscription) continue;

    try {
      await webpush.sendNotification(
        sub.subscription as any,
        JSON.stringify({
          title: `🏠 ${dueToday.length} chore${dueToday.length > 1 ? 's' : ''} due today`,
          body: dueToday.map((c) => c.name).join(', '),
          url: '/',
        }),
      );
      sent++;
    } catch (err) {
      console.error(`Failed to send to profile ${profile.id}: `, err);
    }
  }
  return NextResponse.json({ sent });
}
