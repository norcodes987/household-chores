export function getPeriodKey(
  recurrence: 'daily' | 'weekly' | 'monthly',
  date = new Date(),
): string {
  if (recurrence === 'daily') {
    return date.toISOString().slice(0, 10); // "2026-03-7"
  }
  if (recurrence === 'weekly') {
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
    return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`; // "2026-W10"
  }
  // monthly
  return date.toISOString().slice(0, 7); //"2026-03"
}

export function isChoreToday(
  chore: {
    recurrence: string;
    day_of_week: number | null;
    day_of_month: number | null;
  },
  date = new Date(),
): boolean {
  if (chore.recurrence === 'daily') return true;
  if (chore.recurrence === 'weekly') return chore.day_of_week === date.getDay();
  if (chore.recurrence === 'monthly')
    return chore.day_of_month === date.getDate();
  return false;
}

export function getChoresForDate(
  chores: {
    id: string;
    recurrence: string;
    day_of_week: number | null;
    day_of_month: number | null;
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
  const firstDay = days[0].getDay(); // 0 = sunday
  //shift so Monday is first (0=Mon, 6=Sun)
  const offset = (firstDay + 6) % 7;
  const grid: (Date | null)[] = Array(offset).fill(null);
  return [...grid, ...days];
}
