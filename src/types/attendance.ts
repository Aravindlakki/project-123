export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'in_progress';

export interface Attendance {
  id: string;
  cra_id: string;
  work_date: string;
  login_at?: string;
  logout_at?: string;
  session_duration_minutes?: number;
  work_mode?: string;
  notes?: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  emp_id: string;
  work_date: string; // YYYY-MM-DD (IST)
  login_at: string;
  logout_at?: string | null;
  total_minutes: number;
  status: AttendanceStatus;
  auto_closed?: boolean;
  override_status?: 'present' | 'half_day' | 'absent' | null;
  override_by?: string | null;
  override_by_name?: string | null;
  override_at?: string | null;
  override_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  user_email?: string;
  designation?: string;
}

export interface AttendanceSettings {
  id: string;
  full_day_hours: number; // default 6.0
  half_day_hours: number; // default 3.0
  default_logout_time: string; // default '19:00'
  daily_rate: number; // default 500
  target_contacts: number; // default 750
  target_jds: number; // default 15
  updated_at?: string;
  updated_by?: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  emp_id?: string;
  total_leave_days: number;
  used_leave_days: number;
  remaining_leave_days: number;
  updated_at?: string;
  updated_by?: string;
}

export interface AttendanceDailySummary {
  date: string;
  totalMinutes: number;
  hoursWorked: number;
  effectiveDayValue: number; // 1.0, 0.5, 0.0
  effectiveStatus: 'present' | 'half_day' | 'absent' | 'in_progress';
  logs: AttendanceLog[];
  isOverridden: boolean;
  overrideReason?: string;
}
