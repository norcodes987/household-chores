import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // const authHeader = request.headers.get('authorization');
  // if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  // Get all profiles that belong to a household
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, household_id')
    .not('household_id', 'is', null);

  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const profile of profiles) {
    // Get chores assigned to this profile due today
    const { data: chores } = await supabase
      .from('chores')
      .select('*')
      .eq('household_id', profile.household_id)
      .eq('assigned_to', profile.id);

    if (!chores?.length) continue;

    const dueToday = chores.filter((c) => {
      if (c.recurrence === 'daily') return true;
      if (c.recurrence === 'weekly') return c.day_of_week?.[0] === dayOfWeek;
      if (c.recurrence === 'twice_weekly')
        return (c.day_of_week ?? []).includes(dayOfWeek);
      if (c.recurrence === 'biweekly') {
        if (!c.day_of_week?.includes(dayOfWeek)) return false;
        if (!c.start_date) return false;
        const anchor = new Date(c.start_date);
        const msPerDay = 86400000;
        const daysDiff = Math.floor(
          (now.getTime() - anchor.getTime()) / msPerDay,
        );
        return daysDiff >= 0 && Math.floor(daysDiff / 7) % 2 === 0;
      }
      if (c.recurrence === 'monthly') return c.day_of_month === dayOfMonth;
      return false;
    });

    if (!dueToday.length) continue;

    // Get push subscription for this profile
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
      console.error(`Failed to send to profile ${profile.id}:`, err);
    }
  }

  return NextResponse.json({
    sent,
    timestamp: new Date().toISOString(),
    dayOfWeek,
    dayOfMonth,
    profilesChecked: profiles.length,
  });
}
