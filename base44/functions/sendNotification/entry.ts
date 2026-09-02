import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, courseName, className, employeeName, employeeEmail, deletedUserName, deletedUserEmail } = body || {};

    const svc = base44.asServiceRole;
    const users = await svc.entities.User.list(1000);
    const send = svc.integrations.Core.SendEmail;

    const admins = users.filter(u => u.role === 'admin' || u.role === 'manager');
    const operators = users.filter(u => u.role === 'operator');
    const employees = users.filter(u => u.role === 'employee' && u.approved !== false);

    const safeSend = async (to, subject, bodyText) => {
      if (!to) return;
      try { await send({ to, subject, body: bodyText }); } catch (e) { /* capture, never block */ }
    };

    if (type === 'new_course' && courseName) {
      // Operator added a course → notify all employees
      await Promise.all(employees.map(e =>
        safeSend(e.email, 'New Course Added to Student Directory',
          `A new course "${courseName}" has been added to the Student Directory. You can now assign students to it.`)
      ));
      return Response.json({ ok: true, notified: employees.length });
    }

    if (type === 'new_class' && courseName && className) {
      // Operator opened a class in a course → notify all employees
      await Promise.all(employees.map(e =>
        safeSend(e.email, `New Class Open: ${className} (${courseName})`,
          `A new class "${className}" has been opened in the course "${courseName}". You can now assign students to this class from the Student Directory.`)
      ));
      return Response.json({ ok: true, notified: employees.length });
    }

    if (type === 'manager_added_course' && courseName) {
      // Manager added a course → notify operators
      await Promise.all(operators.map(o =>
        safeSend(o.email, 'New Course Added by Manager',
          `The manager has added a new course "${courseName}" to the system.`)
      ));
      return Response.json({ ok: true, notified: operators.length });
    }

    if (type === 'new_user_pending' && employeeName && employeeEmail) {
      // An employee signed in for the first time → notify managers/admins
      await Promise.all(admins.map(a =>
        safeSend(a.email, 'New Employee Sign-In Request',
          `An employee called ${employeeName} (${employeeEmail}) signed in to the system and is waiting for access. Please accept or reject them from the Manager Dashboard.`)
      ));
      return Response.json({ ok: true, notified: admins.length });
    }

    if (type === 'user_deleted' && deletedUserName && deletedUserEmail) {
      // Manager deleted a user → notify the deleted user
      await safeSend(deletedUserEmail, 'Your Access Has Been Removed',
        `Hello ${deletedUserName},\n\nYour access to the Training Plus Institute system has been removed by the manager. All your data has been deleted. If you wish to rejoin, you will need to sign up again and be re-approved.`);
      return Response.json({ ok: true });
    }

    if (type === 'user_approved' && employeeName && employeeEmail) {
      await safeSend(employeeEmail, 'Access Approved',
        `Hello ${employeeName},\n\nYour access to the Training Plus Institute system has been approved. You can now sign in and use the Student Directory.`);
      return Response.json({ ok: true });
    }

    if (type === 'reminder' && employeeName && employeeEmail) {
      // 12-month reminder; payload carries studentName, cpr, endDate, deadlineType
      const { studentName, studentCpr, endDate, reminderType } = body;
      const subject = reminderType === 'final'
        ? `Final Reminder: Student year ending in 3 days`
        : `Reminder: Student year ending soon`;
      const msg = reminderType === 'final'
        ? `Hello ${employeeName},\n\nThis is a final reminder: the student ${studentName} (CPR: ${studentCpr}) will complete their 12-month period in 3 days, on ${endDate}. Please take any necessary action.`
        : `Hello ${employeeName},\n\nReminder: the student ${studentName} (CPR: ${studentCpr}) will complete their 12-month period on ${endDate} — one month remains.`;
      await safeSend(employeeEmail, subject, msg);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown notification type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
