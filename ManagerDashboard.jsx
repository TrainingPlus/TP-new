import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Mail, Search, UserPlus, Users, GraduationCap, BookOpen, Home as HomeIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { exportToCSV } from '@/lib/exportUtils';
import PendingApprovals from '@/components/manager/PendingApprovals';
import CoursesExplorer from '@/components/shared/CoursesExplorer';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'home';

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState([]);
  const setTab = (t) => setParams(t === 'home' ? {} : { tab: t });

  const loadAll = async () => {
    try {
      const [u, c, s] = await Promise.all([
        base44.entities.User.list(500),
        base44.entities.Course.list('-created_date', 200),
        base44.entities.Student.list('-created_date', 500)
      ]);
      setUsers(u); setCourses(c); setStudents(s);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadAll(); const unsub = base44.entities.Student.subscribe(() => loadAll()); return unsub; }, []);

  const pendingCount = users.filter(u => u.approved === false && u.role !== 'admin' && u.role !== 'manager').length;
  const staff = users.filter(u => u.role !== 'admin' && u.role !== 'manager' && u.approved !== false);

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'employees', label: `Employees`, icon: Users, badge: pendingCount },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen }
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manager Console</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.full_name || user?.email}</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" /> {t.label}
              {t.badge > 0 && <span className="bg-destructive text-white text-xs rounded-full px-1.5 py-0.5">{t.badge}</span>}
            </button>
          );
        })}
      </div>

      {tab === 'home' && (
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> Pending Sign-In Requests</h2>
            <PendingApprovals users={users} onChanged={loadAll} />
          </section>
          <section className="grid md:grid-cols-2 gap-6">
            <AddCourseCard user={user} onAdded={loadAll} existing={courses} />
            <InviteCard />
          </section>
        </div>
      )}

      {tab === 'employees' && <EmployeesTab users={users} onChanged={loadAll} />}
      {tab === 'students' && <StudentsTab students={students} user={user} onChanged={loadAll} query={studentQuery} setQuery={setStudentQuery} />}
      {tab === 'courses' && <CoursesExplorer />}
    </div>
  );
}

function AddCourseCard({ user, onAdded, existing }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Course.create({
        name: name.trim(),
        created_by_user_id: user?.id,
        created_by_username: user?.full_name || user?.email,
        created_by_role: user?.role
      });
      await base44.functions.invoke('sendNotification', { type: 'manager_added_course', courseName: name.trim() });
      setName('');
      onAdded();
    } catch (e) { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold mb-3">Add New Course</h3>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Course name"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <button type="submit" disabled={saving || !name.trim()} className="w-full flex items-center justify-center gap-1.5 bg-accent text-accent-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          <Plus className="w-4 h-4" /> {saving ? 'Adding...' : 'Add Course'}
        </button>
      </form>
      <p className="text-xs text-muted-foreground mt-3">{existing.length} courses total</p>
    </div>
  );
}

function InviteCard() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await base44.users.inviteUser(email.trim(), role);
      setMsg('Invitation sent to ' + email);
      setEmail('');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message || 'Failed to invite');
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold mb-3">Invite Staff Member</h3>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="employee">Employee</option>
          <option value="operator">Operator</option>
          <option value="manager">Manager</option>
        </select>
        <button type="submit" className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90">
          <Mail className="w-4 h-4" /> Send Invite
        </button>
        {msg && <p className="text-xs text-primary">{msg}</p>}
      </form>
    </div>
  );
}

function EmployeesTab({ users, onChanged }) {
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const staff = users.filter(u => u.role !== 'admin' && u.role !== 'manager');

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await base44.functions.invoke('sendNotification', {
        type: 'user_deleted',
        deletedUserName: toDelete.full_name || toDelete.email,
        deletedUserEmail: toDelete.email
      });
      await base44.entities.User.delete(toDelete.id);
      setToDelete(null);
      onChanged();
    } catch (e) { /* ignore */ } finally { setDeleting(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No staff members.</td></tr>
            ) : staff.map(u => (
              <tr key={u.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-medium">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3"><span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">{u.role}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`mailto:${u.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline"><Mail className="w-3.5 h-3.5" /> Email</a>
                    <button onClick={() => setToDelete(u)} className="flex items-center gap-1 text-xs text-destructive hover:underline"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete this person?"
        message={`If you delete ${toDelete?.full_name || toDelete?.email}, every piece of their data and all their work will be permanently deleted. If they want to sign in again, they will be treated as a brand-new user and must be re-approved. This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function StudentsTab({ students, user, onChanged, query, setQuery }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !search || (s.name || '').toLowerCase().includes(q) || (s.cpr || '').includes(q);
  });

  const addStudent = async (form) => {
    await base44.entities.Student.create({
      ...form,
      added_by_user_id: user?.id,
      added_by_username: user?.full_name || user?.email
    });
    setShowAdd(false);
    onChanged();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Student.delete(toDelete.id);
    setToDelete(null);
    onChanged();
  };

  const exportAll = () => {
    exportToCSV('all_students', students.map(s => ({
      'Name': s.name, 'CPR': s.cpr, 'Phone': s.phone, 'Tamkeen Status': s.tamkeen_status, 'Comment': s.comment, 'Registered By': s.added_by_username
    })));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or CPR..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-2">
          <button onClick={exportAll} className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted">Export</button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">CPR</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Registered By</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No students.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.cpr || '—'}</td>
                <td className="px-4 py-3 text-xs">{s.tamkeen_status || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.added_by_username || '—'}</td>
                <td className="px-4 py-3"><button onClick={() => setToDelete(s)} className="flex items-center gap-1 text-xs text-destructive hover:underline"><Trash2 className="w-3.5 h-3.5" /> Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && <QuickAddStudent onClose={() => setShowAdd(false)} onAdd={addStudent} />}
      <ConfirmDialog open={!!toDelete} title="Delete student?" message={`This will permanently delete ${toDelete?.name} from the directory.`} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

function QuickAddStudent({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', cpr: '', phone: '', tamkeen_status: 'Under Processing', comment: '' });
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name required'); return; }
    if (!form.cpr.trim() && !form.phone.trim()) { setErr('CPR or phone required'); return; }
    onAdd(form);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Add Student</h2>
        <form onSubmit={submit} className="space-y-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Student name" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.cpr} onChange={e => setForm({...form, cpr: e.target.value})} placeholder="CPR" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={form.tamkeen_status} onChange={e => setForm({...form, tamkeen_status: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Accepted</option><option>Under Processing</option><option>Withdrawn</option>
          </select>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Add Student</button>
        </form>
      </div>
    </div>
  );
}
