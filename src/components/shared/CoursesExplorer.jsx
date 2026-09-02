import React, { useEffect, useState } from 'react';
import { ChevronLeft, Download, Plus, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { exportToCSV } from '@/lib/exportUtils';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function CoursesExplorer({ canAddClass = false, onAddClass, searchQuery = '' }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      setCourses(await base44.entities.Course.list('-created_date', 200));
    } catch (e) { setCourses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(); }, []);

  const loadClasses = async (course) => {
    setSelectedCourse(course);
    setSelectedClass(null);
    try {
      setClasses(await base44.entities.CourseClass.filter({ course_id: course.id }, '-created_date', 100));
    } catch (e) { setClasses([]); }
  };

  const loadRoster = async (cls) => {
    setSelectedClass(cls);
    try {
      setEnrollments(await base44.entities.Enrollment.filter({ class_id: cls.id }, '-created_date', 500));
    } catch (e) { setEnrollments([]); }
  };

  const filteredCourses = courses.filter(c =>
    !searchQuery || (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (!selectedClass || enrollments.length === 0) return;
    exportToCSV(`${selectedCourse.name}_${selectedClass.name}_roster`, enrollments.map(e => ({
      'Student Name': e.student_name,
      'CPR': e.student_cpr,
      'Tamkeen Status': e.tamkeen_status,
      'Registered By (Employee)': e.source_employee_username || '—'
    })));
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  // Level 3: Roster
  if (selectedClass) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => loadClasses(selectedCourse)} className="flex items-center gap-1 text-sm text-primary font-medium mb-3 hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to Classes
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{selectedCourse.name} › {selectedClass.name}</h3>
            <p className="text-sm text-muted-foreground">{enrollments.length} students</p>
          </div>
          <button onClick={handleExport} disabled={enrollments.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40">
            <Download className="w-4 h-4" /> Download Excel
          </button>
        </div>
        <div className="overflow-x-auto bg-card rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3">Student Name</th>
                <th className="text-left px-4 py-3">CPR</th>
                <th className="text-left px-4 py-3">Tamkeen Status</th>
                <th className="text-left px-4 py-3">Registered By (Employee)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No students enrolled in this class.</td></tr>
              ) : enrollments.map(e => (
                <tr key={e.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{e.student_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.student_cpr || '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={e.tamkeen_status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{e.source_employee_username || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Level 2: Classes
  if (selectedCourse) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => { setSelectedCourse(null); setClasses([]); }} className="flex items-center gap-1 text-sm text-primary font-medium mb-3 hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{selectedCourse.name}</h3>
            <p className="text-sm text-muted-foreground">{classes.length} classes</p>
          </div>
          {canAddClass && (
            <button onClick={() => setShowAddClass(true)} className="flex items-center gap-2 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Class
            </button>
          )}
        </div>
        {classes.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No classes in this course yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map(cls => (
              <button key={cls.id} onClick={() => loadRoster(cls)}
                className="text-left bg-card rounded-xl border border-border p-4 hover:border-primary hover:shadow-md transition-all">
                <h4 className="font-medium">{cls.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">By {cls.created_by_username || '—'}</p>
              </button>
            ))}
          </div>
        )}
        {showAddClass && (
          <AddClassModal
            course={selectedCourse}
            onClose={() => setShowAddClass(false)}
            onAdded={(cls) => { setClasses(prev => [cls, ...prev]); setShowAddClass(false); if (onAddClass) onAddClass(selectedCourse, cls); }}
          />
        )}
      </div>
    );
  }

  // Level 1: Courses
  if (filteredCourses.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">No courses found.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
      {filteredCourses.map(course => (
        <button key={course.id} onClick={() => loadClasses(course)}
          className="text-left bg-card rounded-xl border border-border p-4 hover:border-primary hover:shadow-md transition-all group">
          <h3 className="font-semibold group-hover:text-primary transition-colors">{course.name}</h3>
          <p className="text-xs text-muted-foreground mt-2">By {course.created_by_username || course.created_by_role || '—'}</p>
        </button>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    'Accepted': 'bg-green-100 text-green-700',
    'Under Processing': 'bg-amber-100 text-amber-700',
    'Withdrawn': 'bg-red-100 text-red-700'
  };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors[status] || 'bg-muted')}>{status || '—'}</span>;
}

function AddClassModal({ course, onClose, onAdded }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const cls = await base44.entities.CourseClass.create({
        name: name.trim(),
        course_id: course.id,
        course_name: course.name,
        created_by_user_id: user?.id,
        created_by_username: user?.full_name || user?.email
      });
      onAdded(cls);
    } catch (err) {
      // ignore
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Class to {course.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Class name / code"
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
          <button type="submit" disabled={saving || !name.trim()} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Class'}
          </button>
        </form>
      </div>
    </div>
  );
}
