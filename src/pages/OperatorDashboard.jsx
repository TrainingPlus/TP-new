import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, BookOpen, Home as HomeIcon, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import CoursesExplorer from '@/components/shared/CoursesExplorer';
import { cn } from '@/lib/utils';

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'home';
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const setTab = (t) => setParams(t === 'home' ? {} : { tab: t });

  const loadCourses = async () => {
    try { setCourses(await base44.entities.Course.list('-created_date', 200)); }
    catch (e) { setCourses([]); }
  };
  useEffect(() => { loadCourses(); }, []);

  const handleAddClass = async (course, cls) => {
    try {
      await base44.functions.invoke('sendNotification', {
        type: 'new_class',
        courseName: course.name,
        className: cls.name
      });
    } catch (e) { /* ignore */ }
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'courses', label: 'Courses', icon: BookOpen }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Operator Portal</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.full_name || user?.email}</p>
      </div>

      <div className="flex gap-1.5 mb-6 border-b border-border">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'home' && (
        <AddCourseCard user={user} existing={courses} onAdded={loadCourses} />
      )}

      {tab === 'courses' && (
        <div className="animate-fade-in">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses, students, CPR..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <CoursesExplorer canAddClass={true} onAddClass={handleAddClass} searchQuery={search} />
        </div>
      )}
    </div>
  );
}

function AddCourseCard({ user, existing, onAdded }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Course.create({
        name: name.trim(),
        created_by_user_id: user?.id,
        created_by_username: user?.full_name || user?.email,
        created_by_role: 'operator'
      });
      await base44.functions.invoke('sendNotification', { type: 'new_course', courseName: name.trim() });
      setName('');
      setDone(true);
      setTimeout(() => setDone(false), 2500);
      onAdded();
    } catch (e) { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
      <h3 className="font-semibold mb-1">Add New Course</h3>
      <p className="text-xs text-muted-foreground mb-4">Adding a course notifies all employees by email that a new course is available in the Student Directory.</p>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Course name"
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <button type="submit" disabled={saving || !name.trim()} className="w-full flex items-center justify-center gap-1.5 bg-accent text-accent-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          <Plus className="w-4 h-4" /> {saving ? 'Adding...' : 'Add Course'}
        </button>
        {done && <p className="text-xs text-green-600 text-center">Course added — employees notified.</p>}
      </form>
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium mb-2">Existing Courses ({existing.length})</h4>
        <div className="flex flex-wrap gap-2">
          {existing.map(c => <span key={c.id} className="text-xs bg-secondary px-2.5 py-1 rounded-full">{c.name}</span>)}
        </div>
      </div>
    </div>
  );
}
