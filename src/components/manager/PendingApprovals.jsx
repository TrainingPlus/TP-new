import React, { useEffect, useState } from 'react';
import { Check, X, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PendingApprovals({ users, onChanged }) {
  const pending = users.filter(u => u.approved === false && u.role !== 'admin' && u.role !== 'manager');
  const [busy, setBusy] = useState(null);

  const accept = async (u) => {
    setBusy(u.id);
    try {
      await base44.entities.User.update(u.id, { approved: true });
      await base44.functions.invoke('sendNotification', {
        type: 'user_approved',
        employeeName: u.full_name || u.email,
        employeeEmail: u.email
      });
      onChanged();
    } catch (e) { /* ignore */ } finally { setBusy(null); }
  };

  const reject = async (u) => {
    setBusy(u.id);
    try {
      await base44.entities.User.delete(u.id);
      onChanged();
    } catch (e) { /* ignore */ } finally { setBusy(null); }
  };

  if (pending.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-sm">No pending requests</p>
          <p className="text-xs text-muted-foreground">All employees are reviewed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map(u => (
        <div key={u.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm">{u.full_name || u.email}</p>
            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => accept(u)} disabled={busy === u.id}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button onClick={() => reject(u)} disabled={busy === u.id}
              className="flex items-center gap-1 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
