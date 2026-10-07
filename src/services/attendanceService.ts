import { supabase, isSupabaseConfigured } from './supabase';
import { clientFallbackStore } from './clientFallbackStore';
import { CRA, AttendanceLog, AttendanceSettings, LeaveBalance, AttendanceStatus } from '../types';
import { getTodayISTDateString } from '../utils/formatters';

const DEFAULT_SETTINGS: AttendanceSettings = {
  id: 'default',
  full_day_hours: 6.0,
  half_day_hours: 3.0,
  default_logout_time: '19:00',
  daily_rate: 500,
  target_contacts: 750,
  target_jds: 15,
};

class AttendanceService {
  private activeLogId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.activeLogId =
        sessionStorage.getItem('placemein_active_attendance_id') ||
        localStorage.getItem('placemein_active_attendance_id') ||
        null;

      // Register beacon / pagehide listener to record logout on tab or browser close
      window.addEventListener('pagehide', () => {
        this.recordBeaconLogout();
      });
      window.addEventListener('beforeunload', () => {
        this.recordBeaconLogout();
      });
    }
  }

  public getActiveLogId(): string | null {
    return (
      this.activeLogId ||
      sessionStorage.getItem('placemein_active_attendance_id') ||
      localStorage.getItem('placemein_active_attendance_id') ||
      null
    );
  }

  public setActiveLogId(id: string | null) {
    this.activeLogId = id;
    if (id) {
      sessionStorage.setItem('placemein_active_attendance_id', id);
      localStorage.setItem('placemein_active_attendance_id', id);
    } else {
      sessionStorage.removeItem('placemein_active_attendance_id');
      localStorage.removeItem('placemein_active_attendance_id');
    }
  }

  /**
   * Closes any session still open from previous days past midnight IST.
   * Marks it as 'auto-closed' and uses the configured default logout time.
   */
  async closeStaleSessions(): Promise<void> {
    const today = getTodayISTDateString();
    const settings = await this.getSettings();
    const defaultLogoutTime = settings.default_logout_time || '19:00';

    if (isSupabaseConfigured) {
      try {
        // Call RPC if exists, or do direct update query
        const { error } = await supabase.rpc('close_stale_attendance_logs', {
          default_logout: defaultLogoutTime,
        });
        if (error) {
          // Fallback direct update query
          const { data: staleLogs } = await supabase
            .from('attendance_logs')
            .select('*')
            .lt('work_date', today)
            .is('logout_at', null);

          if (staleLogs && staleLogs.length > 0) {
            for (const log of staleLogs) {
              const logoutDate = new Date(`${log.work_date}T${defaultLogoutTime}:00+05:30`);
              const loginDate = new Date(log.login_at);
              const diffMinutes = Math.max(0, Math.round((logoutDate.getTime() - loginDate.getTime()) / 60000));
              const hours = diffMinutes / 60;
              const status: AttendanceStatus =
                hours >= settings.full_day_hours
                  ? 'present'
                  : hours >= settings.half_day_hours
                  ? 'half_day'
                  : 'absent';

              await supabase
                .from('attendance_logs')
                .update({
                  logout_at: logoutDate.toISOString(),
                  total_minutes: diffMinutes,
                  status,
                  auto_closed: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', log.id);
            }
          }
        }
      } catch (err) {
        console.warn('[AttendanceService] Error closing stale sessions on Supabase:', err);
      }
    }

    // Always keep fallback store clean as well
    const allLogs = clientFallbackStore.getAttendanceLogs();
    let changed = false;
    allLogs.forEach((log) => {
      if (!log.logout_at && log.work_date < today) {
        const logoutDate = new Date(`${log.work_date}T${defaultLogoutTime}:00+05:30`);
        const loginDate = new Date(log.login_at);
        const diffMinutes = Math.max(0, Math.round((logoutDate.getTime() - loginDate.getTime()) / 60000));
        const hours = diffMinutes / 60;
        log.logout_at = logoutDate.toISOString();
        log.total_minutes = diffMinutes;
        log.auto_closed = true;
        log.status =
          hours >= settings.full_day_hours
            ? 'present'
            : hours >= settings.half_day_hours
            ? 'half_day'
            : 'absent';
        changed = true;
      }
    });
    if (changed) {
      clientFallbackStore.saveAttendanceLogs(allLogs);
    }
  }

  /**
   * On successful login, inserts an attendance row with login_at = now.
   * If a row already exists today with no logout_at, reuses it without duplicates.
   */
  async recordLogin(user: CRA): Promise<AttendanceLog> {
    const today = getTodayISTDateString();
    const nowIso = new Date().toISOString();
    const empId = user.emp_id || (user as any).empId || 'SDCINT001';

    // Step 1: Close stale sessions from prior days
    await this.closeStaleSessions().catch(() => {});

    // Step 2: Check if there's already an open session today for this user
    if (isSupabaseConfigured) {
      try {
        const { data: existingLogs } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('work_date', today)
          .is('logout_at', null)
          .order('login_at', { ascending: false })
          .limit(1);

        if (existingLogs && existingLogs.length > 0) {
          const reused = existingLogs[0] as AttendanceLog;
          this.setActiveLogId(reused.id);
          return reused;
        }

        // Insert new row
        const { data: inserted, error } = await supabase
          .from('attendance_logs')
          .insert({
            user_id: user.id,
            emp_id: empId,
            work_date: today,
            login_at: nowIso,
            status: 'in_progress',
            total_minutes: 0,
            auto_closed: false,
          })
          .select()
          .single();

        if (!error && inserted) {
          const log = inserted as AttendanceLog;
          this.setActiveLogId(log.id);
          // Mirror in fallback store
          clientFallbackStore.upsertAttendanceLog(log);
          return log;
        }
      } catch (err) {
        console.warn('[AttendanceService] Supabase insert failed, using fallback store:', err);
      }
    }

    // Local fallback store logic
    const existing = clientFallbackStore
      .getAttendanceLogs(user.id)
      .find((l) => l.work_date === today && !l.logout_at);

    if (existing) {
      this.setActiveLogId(existing.id);
      return existing;
    }

    const newLog: AttendanceLog = {
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.id,
      emp_id: empId,
      work_date: today,
      login_at: nowIso,
      status: 'in_progress',
      total_minutes: 0,
      auto_closed: false,
      created_at: nowIso,
      updated_at: nowIso,
    };

    clientFallbackStore.upsertAttendanceLog(newLog);
    this.setActiveLogId(newLog.id);
    return newLog;
  }

  /**
   * On clicking "Log out", sets logout_at = now, computes total_minutes,
   * updates status ('present' | 'half_day' | 'absent') before signing out.
   */
  async recordLogout(user?: CRA | null): Promise<AttendanceLog | null> {
    const today = getTodayISTDateString();
    const nowIso = new Date().toISOString();
    const logId = this.getActiveLogId();
    const settings = await this.getSettings();

    let targetLog: AttendanceLog | null = null;

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('attendance_logs').select('*');
        if (logId) {
          query = query.eq('id', logId);
        } else if (user) {
          query = query.eq('user_id', user.id).eq('work_date', today).is('logout_at', null);
        } else {
          query = query.eq('work_date', today).is('logout_at', null);
        }

        const { data: logs } = await query.order('login_at', { ascending: false }).limit(1);
        if (logs && logs.length > 0) {
          targetLog = logs[0] as AttendanceLog;
        }
      } catch (err) {
        console.warn('[AttendanceService] Error finding active log on Supabase:', err);
      }
    }

    if (!targetLog) {
      const fallbackLogs = clientFallbackStore.getAttendanceLogs(user?.id);
      targetLog =
        fallbackLogs.find((l) => (logId ? l.id === logId : l.work_date === today && !l.logout_at)) || null;
    }

    if (!targetLog) {
      this.setActiveLogId(null);
      return null;
    }

    const loginTime = new Date(targetLog.login_at).getTime();
    const logoutTime = new Date(nowIso).getTime();
    const diffMinutes = Math.max(1, Math.round((logoutTime - loginTime) / 60000));
    const hours = diffMinutes / 60;

    const status: AttendanceStatus =
      hours >= settings.full_day_hours
        ? 'present'
        : hours >= settings.half_day_hours
        ? 'half_day'
        : 'absent';

    const updatedLog: AttendanceLog = {
      ...targetLog,
      logout_at: nowIso,
      total_minutes: diffMinutes,
      status: targetLog.override_status || status,
      updated_at: nowIso,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('attendance_logs')
          .update({
            logout_at: nowIso,
            total_minutes: diffMinutes,
            status: targetLog.override_status || status,
            updated_at: nowIso,
          })
          .eq('id', targetLog.id);
      } catch (err) {
        console.warn('[AttendanceService] Error updating logout on Supabase:', err);
      }
    }

    clientFallbackStore.upsertAttendanceLog(updatedLog);
    this.setActiveLogId(null);
    return updatedLog;
  }

  /**
   * Sets logout_at on tab close or browser close using navigator.sendBeacon
   */
  recordBeaconLogout() {
    const logId = this.getActiveLogId();
    if (!logId) return;

    const payload = JSON.stringify({
      logId,
      logout_at: new Date().toISOString(),
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/attendance/beacon-logout', blob);
      } else {
        // Fallback fetch with keepalive
        fetch('/api/attendance/beacon-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (_) {}

    // Synchronously update local fallback store
    try {
      const logs = clientFallbackStore.getAttendanceLogs();
      const target = logs.find((l) => l.id === logId);
      if (target && !target.logout_at) {
        const nowIso = new Date().toISOString();
        const diffMinutes = Math.max(1, Math.round((new Date(nowIso).getTime() - new Date(target.login_at).getTime()) / 60000));
        target.logout_at = nowIso;
        target.total_minutes = diffMinutes;
        target.status = diffMinutes >= 360 ? 'present' : diffMinutes >= 180 ? 'half_day' : 'absent';
        clientFallbackStore.saveAttendanceLogs(logs);
      }
    } catch (_) {}
  }

  /**
   * Retrieves today's attendance record for an employee in IST.
   */
  async getTodayAttendance(userId: string): Promise<AttendanceLog | null> {
    const today = getTodayISTDateString();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('work_date', today)
          .order('login_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          return data[0] as AttendanceLog;
        }
      } catch (err) {
        console.warn('[AttendanceService] Error fetching today attendance from Supabase:', err);
      }
    }

    const fallbackLogs = clientFallbackStore.getAttendanceLogs(userId);
    return fallbackLogs.find((l) => l.work_date === today) || null;
  }

  /**
   * Retrieves an employee's attendance logs for a given month (YYYY-MM).
   */
  async getAttendanceHistory(userId: string, monthKey: string): Promise<AttendanceLog[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('work_date', `${monthKey}-01`)
          .lte('work_date', `${monthKey}-31`)
          .order('work_date', { ascending: false });

        if (!error && data) {
          return data as AttendanceLog[];
        }
      } catch (err) {
        console.warn('[AttendanceService] Error fetching attendance history from Supabase:', err);
      }
    }

    const fallbackLogs = clientFallbackStore.getAttendanceLogs(userId);
    return fallbackLogs
      .filter((l) => l.work_date.startsWith(monthKey))
      .sort((a, b) => b.work_date.localeCompare(a.work_date));
  }

  /**
   * Admin view of all employees' attendance logs for a given month or date.
   */
  async getAllAttendanceForAdmin(monthKey?: string, specificDate?: string): Promise<AttendanceLog[]> {
    const users = await this.getEmployeesList();

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('attendance_logs')
          .select('*, profiles:user_id(id, name, email, designation, emp_id)');

        if (specificDate) {
          query = query.eq('work_date', specificDate);
        } else if (monthKey) {
          query = query.gte('work_date', `${monthKey}-01`).lte('work_date', `${monthKey}-31`);
        }

        const { data, error } = await query.order('work_date', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            user_name: item.profiles?.name || item.emp_id,
            user_email: item.profiles?.email || '',
            designation: item.profiles?.designation || '',
          })) as AttendanceLog[];
        }
      } catch (err) {
        console.warn('[AttendanceService] Error loading admin attendance from Supabase:', err);
      }
    }

    const allLogs = clientFallbackStore.getAttendanceLogs();
    return allLogs
      .filter((l) => {
        if (specificDate) return l.work_date === specificDate;
        if (monthKey) return l.work_date.startsWith(monthKey);
        return true;
      })
      .map((l) => {
        const u = users.find((usr) => usr.id === l.user_id || usr.emp_id === l.emp_id);
        return {
          ...l,
          user_name: u?.name || l.emp_id,
          user_email: u?.email || '',
          designation: u?.designation || '',
        };
      })
      .sort((a, b) => b.work_date.localeCompare(a.work_date));
  }

  /**
   * Allows Admin to manually override a day's status ('present' | 'half_day' | 'absent').
   * Logs who changed it, when, and the reason.
   */
  async overrideAttendanceStatus(
    logId: string,
    newStatus: 'present' | 'half_day' | 'absent',
    reason: string,
    adminUser: CRA
  ): Promise<AttendanceLog> {
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance_logs')
          .update({
            override_status: newStatus,
            status: newStatus,
            override_by: adminUser.id,
            override_at: nowIso,
            override_reason: reason,
            updated_at: nowIso,
          })
          .eq('id', logId)
          .select()
          .single();

        if (!error && data) {
          const log = data as AttendanceLog;
          clientFallbackStore.upsertAttendanceLog(log);
          return log;
        }
      } catch (err) {
        console.warn('[AttendanceService] Error overriding attendance on Supabase:', err);
      }
    }

    const logs = clientFallbackStore.getAttendanceLogs();
    const target = logs.find((l) => l.id === logId);
    if (!target) throw new Error('Attendance log not found');

    target.override_status = newStatus;
    target.status = newStatus;
    target.override_by = adminUser.id;
    target.override_by_name = adminUser.name;
    target.override_at = nowIso;
    target.override_reason = reason;
    target.updated_at = nowIso;

    clientFallbackStore.saveAttendanceLogs(logs);
    return target;
  }

  /**
   * Admin-editable settings table
   */
  async getSettings(): Promise<AttendanceSettings> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (!error && data) {
          return {
            id: 'default',
            full_day_hours: Number(data.full_day_hours ?? 6.0),
            half_day_hours: Number(data.half_day_hours ?? 3.0),
            default_logout_time: data.default_logout_time || '19:00',
            daily_rate: Number(data.daily_rate ?? 500),
            target_contacts: Number(data.target_contacts ?? 750),
            target_jds: Number(data.target_jds ?? 15),
            updated_at: data.updated_at,
            updated_by: data.updated_by,
          };
        }
      } catch (err) {
        console.warn('[AttendanceService] Error fetching attendance settings from Supabase:', err);
      }
    }

    return clientFallbackStore.getAttendanceSettings();
  }

  async updateSettings(updates: Partial<AttendanceSettings>, adminUser?: CRA | null): Promise<AttendanceSettings> {
    const nowIso = new Date().toISOString();
    const payload = {
      ...updates,
      id: 'default',
      updated_at: nowIso,
      updated_by: adminUser?.id,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('attendance_settings')
          .upsert(payload)
          .select()
          .single();

        if (!error && data) {
          clientFallbackStore.saveAttendanceSettings(data);
          return data;
        }
      } catch (err) {
        console.warn('[AttendanceService] Error updating attendance settings on Supabase:', err);
      }
    }

    return clientFallbackStore.saveAttendanceSettings(payload);
  }

  /**
   * Reads leave balance from the leave_balances table (per employee, set by admin).
   * Returns null if no row exists so UI shows "Not set".
   */
  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            emp_id: data.emp_id,
            total_leave_days: Number(data.total_leave_days ?? 0),
            used_leave_days: Number(data.used_leave_days ?? 0),
            remaining_leave_days: Number(data.remaining_leave_days ?? 0),
            updated_at: data.updated_at,
            updated_by: data.updated_by,
          };
        }
      } catch (err) {
        console.warn('[AttendanceService] Error fetching leave balance from Supabase:', err);
      }
    }

    return clientFallbackStore.getLeaveBalance(userId);
  }

  async setLeaveBalance(
    userId: string,
    totalDays: number,
    usedDays: number,
    adminUser?: CRA | null
  ): Promise<LeaveBalance> {
    const nowIso = new Date().toISOString();
    const remainingDays = Math.max(0, totalDays - usedDays);
    const payload = {
      user_id: userId,
      total_leave_days: totalDays,
      used_leave_days: usedDays,
      remaining_leave_days: remainingDays,
      updated_at: nowIso,
      updated_by: adminUser?.id,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('leave_balances')
          .upsert(payload, { onConflict: 'user_id' })
          .select()
          .single();

        if (!error && data) {
          clientFallbackStore.saveLeaveBalance(data);
          return data;
        }
      } catch (err) {
        console.warn('[AttendanceService] Error setting leave balance on Supabase:', err);
      }
    }

    const fallback: LeaveBalance = {
      id: `lb_${userId}`,
      ...payload,
    };
    clientFallbackStore.saveLeaveBalance(fallback);
    return fallback;
  }

  /**
   * Calculates monthly eligible days (sum of 1.0, 0.5, 0.0) from attendance_logs
   */
  calculateEligibleDays(logs: AttendanceLog[]): {
    totalEligibleDays: number;
    fullDaysCount: number;
    halfDaysCount: number;
    absentDaysCount: number;
    totalMinutes: number;
  } {
    let fullDaysCount = 0;
    let halfDaysCount = 0;
    let absentDaysCount = 0;
    let totalMinutes = 0;

    // Group logs by work_date
    const dayMap = new Map<string, AttendanceLog[]>();
    logs.forEach((log) => {
      const arr = dayMap.get(log.work_date) || [];
      arr.push(log);
      dayMap.set(log.work_date, arr);
    });

    dayMap.forEach((dayLogs) => {
      // If any log is overridden by admin, respect override
      const overridden = dayLogs.find((l) => Boolean(l.override_status));
      const dayMinutes = dayLogs.reduce((acc, l) => acc + (l.total_minutes || 0), 0);
      totalMinutes += dayMinutes;

      if (overridden) {
        const status = overridden.override_status;
        if (status === 'present') fullDaysCount += 1.0;
        else if (status === 'half_day') halfDaysCount += 1.0;
        else absentDaysCount += 1.0;
      } else {
        // Evaluate by total hours across day
        const dayHours = dayMinutes / 60;
        if (dayHours >= 6.0) fullDaysCount += 1.0;
        else if (dayHours >= 3.0) halfDaysCount += 1.0;
        else absentDaysCount += 1.0;
      }
    });

    const totalEligibleDays = fullDaysCount * 1.0 + halfDaysCount * 0.5;

    return {
      totalEligibleDays,
      fullDaysCount,
      halfDaysCount,
      absentDaysCount,
      totalMinutes,
    };
  }

  private async getEmployeesList(): Promise<CRA[]> {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from('profiles').select('*');
        if (data && data.length > 0) return data as CRA[];
      } catch (_) {}
    }
    return clientFallbackStore.getUsers(true);
  }
}

export const attendanceService = new AttendanceService();
