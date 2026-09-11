import { Request, Response } from 'express';
import { tasks, enrichTask } from '../models/db';
import { Task, CRA } from '../models/types';

export function getTasks(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const filter = req.query.filter as string;

  let list = tasks.map(enrichTask);
  if (filter === 'my' || user.role !== 'admin') {
    list = list.filter((t) => t.assignee_id === user.id);
  }
  return res.json(list);
}

export function createTask(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { title, description, assignee_id, priority, due_date, company_id, contact_id } = req.body;
  if (!title || !assignee_id) {
    return res.status(400).json({ detail: 'Task title and assignee are required' });
  }

  const newTask: Task = {
    id: `tsk_${Date.now()}`,
    title: title.trim(),
    description: description || '',
    assignee_id,
    assigned_by_id: user.id,
    priority: priority || 'medium',
    status: 'pending',
    due_date,
    company_id,
    contact_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  return res.status(201).json(enrichTask(newTask));
}

export function updateTaskStatus(req: Request, res: Response) {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ detail: 'Task not found' });
  const { status, notes } = req.query;
  if (status) task.status = status as any;
  if (notes) task.description = `${task.description}\n[Update]: ${notes}`;
  task.updated_at = new Date().toISOString();
  return res.json(enrichTask(task));
}

export function deleteTask(req: Request, res: Response) {
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Task not found' });
  tasks.splice(idx, 1);
  return res.status(204).send();
}
