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
