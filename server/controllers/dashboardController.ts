import { Request, Response } from 'express';
import {
  jds,
  campaigns,
  hrContacts,
  companies,
  outreachChannels,
  outreachOutcomes,
  users,
  attendanceRecords,
} from '../models/db';
import { CRA } from '../models/types';

export function getDashboardStats(req: Request, res: Response) {
  const verifiedJDs = jds.filter((j) => j.is_verified).length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  const channelMap: Record<string, number> = { mail: 0, linkedin: 0, call: 0, whatsapp: 0 };
  const statusMap: Record<string, number> = { not_started: 0, sent: 0, replied: 0, failed: 0 };

  outreachChannels.forEach((o) => {
    if (channelMap[o.channel] !== undefined) channelMap[o.channel]++;
    if (statusMap[o.status] !== undefined) statusMap[o.status]++;
  });

  const stats = {
    total_verified_opportunities: verifiedJDs,
    total_contacts: hrContacts.length,
    total_companies: companies.length,
    active_campaign_count: activeCampaigns,
    total_jds_received: outreachOutcomes.filter((o) => o.jd_received).length,
    total_eligible_opportunities: outreachOutcomes.filter((o) => o.is_eligible).length,
    overall_conversion_rate: 28.5,
    unique_companies_onboarded: companies.length,
    active_placement_drives: 8,
    jd_received_rate: 34.2,
    outreach_by_channel: Object.entries(channelMap).map(([channel, count]) => ({ channel, count })),
    outreach_by_status: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    community_funnel: [
      { stage_name: 'Total Outreach Initiated', count: outreachChannels.length, dropoff_count: 0, dropoff_pct: 0 },
      { stage_name: 'Replies Received', count: outreachChannels.filter((o) => o.status === 'replied').length, dropoff_count: 2, dropoff_pct: 22 },
      { stage_name: 'Community Joined', count: outreachOutcomes.filter((o) => o.outcome_status === 'community_joined').length, dropoff_count: 1, dropoff_pct: 12 },
    ],
    jd_funnel: [
      { stage_name: 'Contacts Reached', count: hrContacts.length, dropoff_count: 0, dropoff_pct: 0 },
      { stage_name: 'Responses Engaged', count: outreachChannels.filter((o) => o.status === 'replied').length, dropoff_count: 3, dropoff_pct: 25 },
      { stage_name: 'JDs Received', count: jds.length, dropoff_count: 1, dropoff_pct: 20 },
      { stage_name: 'Verified Opportunities', count: verifiedJDs, dropoff_count: 1, dropoff_pct: 25 },
    ],
  };
  return res.json(stats);
}

export function getCRAPerformance(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const myOnly = req.query.my_only === 'true';

  const userList = myOnly ? [user] : users.filter((u) => u.role === 'cra' || u.role === 'admin');

  const items = userList.map((u) => {
    const userJDs = jds.filter((j) => j.created_by === u.id);
    const userContacts = hrContacts.filter((c) => c.created_by === u.id);
    const userAttendance = attendanceRecords.find((a) => a.cra_id === u.id && a.work_date === new Date().toISOString().slice(0, 10));

    return {
      cra_id: u.id,
      cra_name: u.name,
      cra_email: u.email,
      monthly_jd_target: u.monthly_jd_target || 15,
      jds_this_month: userJDs.length,
      target_progress_pct: Math.min(100, Math.round((userJDs.length / (u.monthly_jd_target || 15)) * 100)),
      contacts_sourced: userContacts.length,
      outreach_sent: 18,
      outreach_by_channel: { mail: 8, linkedin: 5, call: 3, whatsapp: 2 },
      replies_received: 7,
      jds_received: userJDs.length,
      eligible_jds: userJDs.filter((j) => j.is_verified).length,
      conversion_rate: 38.8,
      eligibility_rate: 85.0,
      contact_to_jd_ratio: 2.4,
      community_joins: 3,
      community_funnel: [
        { stage_name: 'Outreach Sent', count: 18, dropoff_count: 0, dropoff_pct: 0 },
        { stage_name: 'Replies', count: 7, dropoff_count: 11, dropoff_pct: 61 },
        { stage_name: 'Joined', count: 3, dropoff_count: 4, dropoff_pct: 57 },
      ],
      jd_funnel: [
        { stage_name: 'Sourced', count: userContacts.length, dropoff_count: 0, dropoff_pct: 0 },
        { stage_name: 'Replied', count: 7, dropoff_count: 3, dropoff_pct: 30 },
        { stage_name: 'JD Shared', count: userJDs.length, dropoff_count: 2, dropoff_pct: 28 },
      ],
      channel_performance: [
        { channel: 'mail', sent: 8, replied: 3, jds_yielded: 2, conversion_rate: 37.5 },
        { channel: 'linkedin', sent: 5, replied: 2, jds_yielded: 1, conversion_rate: 40.0 },
        { channel: 'call', sent: 3, replied: 2, jds_yielded: 1, conversion_rate: 66.7 },
        { channel: 'whatsapp', sent: 2, replied: 1, jds_yielded: 1, conversion_rate: 50.0 },
      ],
      login_at: userAttendance?.login_at,
      logout_at: userAttendance?.logout_at,
      attendance_status: (userAttendance?.login_at ? (userAttendance.logout_at ? 'logged_out' : 'logged_in') : 'not_logged_in') as any,
      hours_worked: 6.5,
      sourced_roles_breakdown: [
        { role: 'Cyber Security Analyst', count: 2 },
        { role: 'Full Stack Engineer', count: 2 },
        { role: 'Data Analyst', count: 1 },
      ],
      total_companies_worked: companies.filter((c) => c.created_by === u.id).length,
      jds_sourced_all_time: userJDs.length,
      jds_sourced_this_month: userJDs.length,
      jds_received_this_month: userJDs.length,
    };
  });

  const totals = {
    cra_id: 'totals',
    cra_name: 'Team Aggregates',
    cra_email: 'team@placemein.com',
    monthly_jd_target: items.reduce((acc, i) => acc + i.monthly_jd_target, 0),
    jds_this_month: items.reduce((acc, i) => acc + i.jds_this_month, 0),
    target_progress_pct: 54,
    contacts_sourced: items.reduce((acc, i) => acc + i.contacts_sourced, 0),
    outreach_sent: items.reduce((acc, i) => acc + i.outreach_sent, 0),
    outreach_by_channel: { mail: 24, linkedin: 15, call: 9, whatsapp: 6 },
    replies_received: items.reduce((acc, i) => acc + i.replies_received, 0),
    jds_received: items.reduce((acc, i) => acc + i.jds_received, 0),
    eligible_jds: items.reduce((acc, i) => acc + i.eligible_jds, 0),
    conversion_rate: 35.0,
    eligibility_rate: 80.0,
    contact_to_jd_ratio: 2.2,
    community_joins: 8,
    community_funnel: [],
    jd_funnel: [],
    channel_performance: [],
    attendance_status: 'team_summary' as any,
    hours_worked: 26,
    sourced_roles_breakdown: [],
    total_companies_worked: companies.length,
    jds_sourced_all_time: jds.length,
    jds_sourced_this_month: jds.length,
    jds_received_this_month: jds.length,
  };

  return res.json({ cras: items, totals });
}
