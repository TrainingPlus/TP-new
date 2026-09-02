import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  if (role === 'admin' || role === 'manager') {
    return <Navigate to="/manager" replace />;
  }
  if (role === 'operator') {
    return <Navigate to="/operator" replace />;
  }
  // employee
  if (user?.approved === false) {
    return <Navigate to="/pending" replace />;
  }
  return <Navigate to="/directory" replace />;
}

export function PendingApproval() {
  const { user, checkUserAuth } = useAuth();
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!user || notified) return;
    if (user.pending_notified) { setNotified(true); return; }
    (async () => {
      try {
        await base44.functions.invoke('sendNotification', {
          type: 'new_user_pending',
          employeeName: user.full_name || user.email,
          employeeEmail: user.email
        });
        await base44.auth.updateMe({ pending_notified: true });
        setNotified(true);
      } catch (e) {
        setNotified(true);
      }
    })();
  }, [user, notified]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/40 flex items-center justify-center mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Awaiting Approval</h2>
        <p className="text-muted-foreground text-sm">
          Your account is waiting for the manager to approve your access. The manager has been notified by email — you will receive a reply once approved.
        </p>
      </div>
    </div>
  );
}
