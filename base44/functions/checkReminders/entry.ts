import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const today = new Date();
    const DAY = 24 * 60 * 60 * 1000;

    // Students with a completion end date
    const students = await svc.entities.Student.list(1000);
    const send = svc.integrations.Core.SendEmail;

    const safeSend = async (to, subject, body) => {
      if (!to) return;
      try { await send({ to, subject, body }); } catch (e) { /* capture */ }
    };

    let notified = 0;
    for (const s of students) {
      if (!s.completion_end_date) continue;
      const endDate = new Date(s.completion_end_date);
      if (isNaN(endDate.getTime())) continue;
      const daysLeft = Math.round((endDate.getTime() - today.getTime()) / DAY);

      const employee = s.added_by_username || '';
      // look up the employee's email by matching full_name
      let employeeEmail = '';
      try {
        const matches = await svc.entities.User.filter({ full_name: s.added_by_username });
        if (matches.length) employeeEmail = matches[0].email;
      } catch (e) { /* ignore */ }

      // 1-month reminder: 25-35 days away, not yet sent
      if (daysLeft <= 35 && daysLeft >= 20 && !s.reminder_sent && employeeEmail) {
        await safeSend(employeeEmail, 'Reminder: Student year ending soon',
          `Hello ${employee},\n\nReminder: the student ${s.name} (CPR: ${s.cpr || '—'}) will complete their 12-month period on ${endDate.toLocaleDateString()}. One month remains.`);
        await svc.entities.Student.update(s.id, { reminder_sent: true });
        notified++;
      }

      // 3-day final reminder: 0-4 days away, not yet sent
      if (daysLeft <= 4 && daysLeft >= 0 && !s.final_reminder_sent && employeeEmail) {
        await safeSend(employeeEmail, 'Final Reminder: Student year ending in 3 days',
          `Hello ${employee},\n\nFinal reminder: the student ${s.name} (CPR: ${s.cpr || '—'}) will complete their 12-month period on ${endDate.toLocaleDateString()} — only ${daysLeft} day(s) left. Please take any necessary action.`);
        await svc.entities.Student.update(s.id, { final_reminder_sent: true });
        notified++;
      }
    }

    return Response.json({ ok: true, checked: students.length, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
