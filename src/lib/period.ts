function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Returns which biweekly cycle number a date falls on from a start date
function getBiweeklyCycle(date: Date, startDate: Date): number {
  const msPerDay = 86400000;
  const daysDiff = Math.floor(
    (date.getTime() - startDate.getTime()) / msPerDay,
  );
  return Math.floor(daysDiff / 14);
}

export function getPeriodKey(
  recurrence: string,
  date = new Date(),
  startDate?: string | null,
): string {
  if (recurrence === 'daily') return toLocalDateString(date);
  if (recurrence === 'weekly') return getISOWeek(date);
  if (recurrence === 'twice_weekly')
    return `${getISOWeek(date)}-${date.getDay()}`;
  if (recurrence === 'biweekly') {
    const anchor = startDate ? new Date(startDate) : date;
    const cycle = getBiweeklyCycle(date, anchor);
    return `${date.getFullYear()}-BW${String(cycle).padStart(3, '0')}`;
  }
  // monthly
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function isChoreToday(
  chore: {
    recurrence: string;
    day_of_week: number[] | null;
    day_of_month: number | null;
    start_date?: string | null;
  },
  date = new Date(),
): boolean {
  const today = date.getDay();

  if (chore.recurrence === 'daily') return true;

  if (chore.recurrence === 'weekly') {
    return chore.day_of_week?.[0] === today;
  }

  if (chore.recurrence === 'twice_weekly') {
    return (chore.day_of_week ?? []).includes(today);
  }

  if (chore.recurrence === 'biweekly') {
    // Must be the right day of week AND the right week
    if (!chore.day_of_week?.includes(today)) return false;
    if (!chore.start_date) return false;
    const anchor = new Date(chore.start_date);
    const msPerDay = 86400000;
    const daysDiff = Math.floor((date.getTime() - anchor.getTime()) / msPerDay);
    return daysDiff >= 0 && Math.floor(daysDiff / 7) % 2 === 0;
  }

  if (chore.recurrence === 'monthly') {
    return chore.day_of_month === date.getDate();
  }

  return false;
}

export function getChoresForDate(
  chores: {
    id: string;
    recurrence: string;
    day_of_week: number[] | null;
    day_of_month: number | null;
    start_date?: string | null;
  }[],
  date: Date,
): string[] {
  return chores.filter((c) => isChoreToday(c, date)).map((c) => c.id);
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const days = getDaysInMonth(year, month);
  const firstDay = days[0].getDay();
  const offset = (firstDay + 6) % 7;
  const grid: (Date | null)[] = Array(offset).fill(null);
  return [...grid, ...days];
}
