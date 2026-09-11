import { Request, Response } from 'express';
import { attendanceRecords, users, jds, hrContacts, outreachChannels } from '../models/db';
import { Attendance, CRA } from '../models/types';

export function getAttendanceToday(req: Request, res: Response) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todays = users
    .filter((u) => u.role === 'cra' || u.role === 'admin')
    .map((u) => {
      const att = attendanceRecords.find((a) => a.cra_id === u.id && a.work_date === todayStr);
      let status = 'not_logged_in';
      if (att?.login_at) {
        status = att.logout_at ? 'logged_out' : 'logged_in';
      }
      return {
        id: att?.id || `att_pending_${u.id}`,
        cra_id: u.id,
        cra_name: u.name,
        cra_email: u.email,
        work_date: todayStr,
        login_at: att?.login_at,
        logout_at: att?.logout_at,
        status,
        hours_worked: att?.login_at && att?.logout_at ? 7.5 : att?.login_at ? 4.2 : 0,
        notes: att?.notes,
      };
    });
  return res.json(todays);
}

export function getAttendanceHistory(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const craId = (req.query.cra_id as string) || user.id;

  const records = attendanceRecords
    .filter((a) => (craId === 'all' && user.role === 'admin' ? true : a.cra_id === craId))
    .map((a) => {
      const u = users.find((usr) => usr.id === a.cra_id);
      return {
        ...a,
        cra_name: u?.name || 'CRA Specialist',
        cra_email: u?.email || '',
        status: a.login_at ? (a.logout_at ? 'logged_out' : 'logged_in') : 'not_logged_in',
        hours_worked: a.login_at && a.logout_at ? 7.5 : a.login_at ? 4.5 : 0,
      };
    });
  return res.json(records);
}

export function checkIn(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const todayStr = new Date().toISOString().slice(0, 10);
  let att = attendanceRecords.find((a) => a.cra_id === user.id && a.work_date === todayStr);
  if (!att) {
    att = {
      id: `att_${Date.now()}`,
      cra_id: user.id,
      work_date: todayStr,
      login_at: new Date().toISOString(),
      notes: req.body?.notes,
    };
    attendanceRecords.push(att);
  } else {
    att.login_at = new Date().toISOString();
    att.logout_at = undefined;
    if (req.body?.notes) att.notes = req.body.notes;
  }
  return res.json(att);
}

export function checkOut(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const todayStr = new Date().toISOString().slice(0, 10);
  let att = attendanceRecords.find((a) => a.cra_id === user.id && a.work_date === todayStr);
  if (!att) {
    att = {
      id: `att_${Date.now()}`,
      cra_id: user.id,
      work_date: todayStr,
      logout_at: new Date().toISOString(),
      notes: req.body?.notes,
    };
    attendanceRecords.push(att);
  } else {
    att.logout_at = new Date().toISOString();
    if (req.body?.notes) att.notes = req.body.notes;
  }
  return res.json(att);
}

export function getWorkSummary(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const todayStr = new Date().toISOString().slice(0, 10);
  const userAtt = attendanceRecords.find((a) => a.cra_id === user.id && a.work_date === todayStr);
  const userContacts = hrContacts.filter((c) => c.created_by === user.id);
  const userJDs = jds.filter((j) => j.created_by === user.id);
  const userOutreach = outreachChannels.filter((o) => {
    const contact = hrContacts.find((c) => c.id === o.contact_id);
    return contact?.created_by === user.id;
  });

  return res.json({
    date: todayStr,
    cra_id: user.id,
    cra_name: user.name,
    login_time: userAtt?.login_at,
    logout_time: userAtt?.logout_at,
    current_status: userAtt?.login_at ? (userAtt.logout_at ? 'logged_out' : 'logged_in') : 'not_logged_in',
    today_metrics: {
      contacts_added: userContacts.length,
      jds_submitted: userJDs.length,
      outreach_initiated: userOutreach.length,
      calls_completed: userOutreach.filter((o) => o.channel === 'call').length,
    },
    weekly_overview: {
      days_present: 5,
      total_hours: 38.5,
      jds_generated: userJDs.length,
    },
  });
}

export function getCraWorkSummary(req: Request, res: Response) {
  const craId = req.params.craId;
  const targetUser = users.find((u) => u.id === craId);
  if (!targetUser) return res.status(404).json({ detail: 'CRA not found' });

  const targetJDs = jds.filter((j) => j.created_by === craId);
  const targetContacts = hrContacts.filter((c) => c.created_by === craId);

  return res.json({
    cra_id: targetUser.id,
    cra_name: targetUser.name,
    cra_email: targetUser.email,
    emp_id: targetUser.emp_id,
    monthly_target: targetUser.monthly_jd_target,
    jds_achieved: targetJDs.length,
    contacts_sourced: targetContacts.length,
    conversion_rate: 36.4,
    recent_roles: targetJDs.map((j) => j.title),
  });
}
