export type Profile = {
  id: string;
  user_id: string;
  household_id: string;
  name: string;
  colour: string;
};

export type Chore = {
  id: string;
  household_id: string;
  name: string;
  assigned_to: string | null;
  recurrence: 'daily' | 'weekly' | 'monthly' | 'biweekly' | 'twice_weekly';
  day_of_week: number[] | null; // 0-6
  day_of_month: number | null; // 1-31
  start_date: string | null;
  created_at: string;
  profile?: Profile;
};

export type Completion = {
  id: string;
  chore_id: string;
  completed_by: string;
  period_key: string;
  completed_at: string;
};
