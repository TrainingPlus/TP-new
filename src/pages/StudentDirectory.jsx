import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Phone, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/lib/exportUtils';
import StudentDetailModal from '@/components/students/StudentDetailModal';

export default function StudentDirectory() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Student.list('-created_date', 500);
      setStudents(list);
    } catch (e) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Student.subscribe((event) => {
      if (event.type === 'create') {
        setStudents(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setStudents(prev => prev.map(s => s.id === event.data.id ? event.data : s));
      } else if (event.type === 'delete') {
        setStudents(prev => prev.filter(s => s.id !== event.data.id));
      }
    });
    return unsub;
  }, []);

  const filtered = students.filter(s => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.cpr || '').includes(q) || (s.phone || '').includes(q);
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Student Directory</h1>
          <p className="text-sm text-muted-foreground">{students.length} students registered</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Student
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, CPR, or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No students found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(student => (
            <button
              key={student.id}
              onClick={() => setSelectedId(student.id)}
              className="text-left bg-card rounded-xl border border-border p-4 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <CreditCard className="w-3 h-3" />
                    <span>{student.cpr || '—'}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                </div>
                <StatusBadge status={student.tamkeen_status} />
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>By {student.added_by_username || '—'}</span>
                {student.completion_end_date && (
                  <span>Ends {formatDate(student.completion_end_date)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showAdd && (
        <AddStudentModal
          user={user}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); }}
        />
      )}

      {selectedId && (
        <StudentDetailModal
          studentId={selectedId}
          user={user}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'Accepted': 'bg-green-100 text-green-700',
    'Under Processing': 'bg-amber-100 text-amber-700',
    'Withdrawn': 'bg-red-100 text-red-700'
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {status || '—'}
    </span>
  );
}

function AddStudentModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', cpr: '', phone: '', tamkeen_status: 'Under Processing', comment: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.cpr.trim() && !form.phone.trim()) { setError('CPR or phone number is required'); return; }
    setSaving(true);
    setError('');
    try {
      await base44.entities.Student.create({
        ...form,
        added_by_user_id: user?.id,
        added_by_username: user?.full_name || user?.email
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Student</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Student Name *">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Full name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPR Number">
              <input value={form.cpr} onChange={e => setForm({...form, cpr: e.target.value})} maxLength={9} className="input" placeholder="9-digit CPR" />
            </Field>
            <Field label="Phone Number">
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" placeholder="Phone" />
            </Field>
          </div>
          <Field label="Tamkeen Status">
            <select value={form.tamkeen_status} onChange={e => setForm({...form, tamkeen_status: e.target.value})} className="input">
              <option>Accepted</option>
              <option>Under Processing</option>
              <option>Withdrawn</option>
            </select>
          </Field>
          <Field label="Comment">
            <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} rows={2} className="input resize-none" placeholder="Optional note" />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
      <style>{`.input{width:100%;padding:8px 12px;border:1px solid hsl(var(--border));border-radius:8px;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--primary)/0.2)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
