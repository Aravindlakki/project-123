import { Request, Response } from 'express';
import { leaves, enrichLeave } from '../models/db';
import { LeaveRequest, CRA } from '../models/types';

export function getLeaves(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  let list = leaves.map(enrichLeave);
  if (user.role !== 'admin') {
    list = list.filter((l) => l.cra_id === user.id);
  }
  return res.json(list);
}

export function applyLeave(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { leave_type, start_date, end_date, days_count, reason } = req.body;
  if (!start_date || !end_date) {
    return res.status(400).json({ detail: 'Start date and end date are required' });
  }

  const newLeave: LeaveRequest = {
    id: `lv_${Date.now()}`,
    cra_id: user.id,
    leave_type: leave_type || 'casual',
    start_date,
    end_date,
    days_count: days_count || 1,
    reason: reason || '',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  leaves.unshift(newLeave);
  return res.status(201).json(enrichLeave(newLeave));
}

export function reviewLeave(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const leave = leaves.find((l) => l.id === req.params.id);
  if (!leave) return res.status(404).json({ detail: 'Leave application not found' });
  const { status, admin_notes } = req.query;
  if (status) leave.status = status as any;
  if (admin_notes) leave.admin_notes = admin_notes as string;
  leave.reviewed_by = user.id;
  leave.updated_at = new Date().toISOString();
  return res.json(enrichLeave(leave));
}
