import React, { useEffect, useState } from 'react';
import { X, Calendar, MessageSquarePlus, ArrowRight, Check, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate, addMonths } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';

export default function StudentDetailModal({ studentId, user, onClose }) {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [comment, setComment] = useState('');
  const [tamkeen, setTamkeen] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const s = await base44.entities.Student.get(studentId);
        setStudent(s);
        setComment(s.comment || '');
        setTamkeen(s.tamkeen_status || 'Under Processing');
        setCompletionDate(s.completion_date || '');
        const [c, e] = await Promise.all([
          base44.entities.Course.list('-created_date', 200),
          base44.entities.Enrollment.filter({ student_id: studentId }, '-created_date', 200)
        ]);
        setCourses(c);
        setEnrollments(e);
      } catch (err) {
        setStudent(null);
      }
    })();
  }, [studentId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      const update = { [field]: value };
      if (field === 'completion_date') {
        update.completion_end_date = addMonths(value, 12);
      }
      const updated = await base44.entities.Student.update(studentId, update);
      setStudent(updated);
      showToast('Saved');
    } catch (e) {
      showToast('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const assignToClass = async (course, cls) => {
    setAssigning(cls.id);
    try {
      await base44.entities.Enrollment.create({
        student_id: studentId,
        student_name: student.name,
        student_cpr: student.cpr,
        tamkeen_status: student.tamkeen_status,
        class_id: cls.id,
        class_name: cls.name,
        course_id: course.id,
        course_name: course.name,
        source_employee_user_id: user?.id,
        source_employee_username: user?.full_name || user?.email
      });
      setEnrollments(prev => [...prev, {
        class_id: cls.id, class_name: cls.name, course_id: course.id, course_name: course.name
      }]);
      showToast(`Assigned to ${cls.name}`);
    } catch (e) {
      showToast('Assignment failed');
    } finally {
      setAssigning(null);
    }
  };

  const isEnrolled = (classId) => enrollments.some(e => e.class_id === classId);

  if (!student) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{student.name}</h2>
            <p className="text-sm text-muted-foreground">CPR: {student.cpr || '—'} {student.phone && `• ${student.phone}`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {toast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm z-50 animate-fade-in">
              {toast}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Tamkeen Status</label>
              <select
                value={tamkeen}
                onChange={e => { setTamkeen(e.target.value); saveField('tamkeen_status', e.target.value); }}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Accepted</option>
                <option>Under Processing</option>
                <option>Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Registered By</label>
              <div className="px-3 py-2 rounded-lg bg-muted text-sm">{student.added_by_username || '—'}</div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" /> Completion Date (done)
            </label>
            <input
              type="date"
              value={completionDate}
              onChange={e => setCompletionDate(e.target.value)}
              onBlur={() => saveField('completion_date', completionDate)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {student.completion_end_date && (
              <p className="text-xs text-primary mt-1.5 font-medium">
                12-month period ends on {formatDate(student.completion_end_date)}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <MessageSquarePlus className="w-3.5 h-3.5" /> Comment
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              onBlur={() => { if (comment !== (student.comment || '')) saveField('comment', comment); }}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add a comment..."
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Assign to a Class</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Click the arrow beside a class to send this student into that class table.</p>

            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No courses available yet.</p>
            ) : (
              <div className="space-y-3">
                {courses.map(course => (
                  <ClassGroup
                    key={course.id}
                    course={course}
                    isEnrolled={isEnrolled}
                    assigning={assigning}
                    onAssign={assignToClass}
                  />
                ))}
              </div>
            )}
          </div>

          {enrollments.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Enrolled Classes</h3>
              <div className="flex flex-wrap gap-2">
                {enrollments.map((e, i) => (
                  <span key={i} className="text-xs bg-accent/30 text-accent-foreground px-3 py-1 rounded-full">
                    {e.course_name} › {e.class_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassGroup({ course, isEnrolled, assigning, onAssign }) {
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.CourseClass.filter({ course_id: course.id }, '-created_date', 100);
        setClasses(list);
      } catch (e) {
        setClasses([]);
      }
    })();
  }, [course.id]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/50 hover:bg-secondary text-sm font-medium"
      >
        <span>{course.name}</span>
        <span className="text-xs text-muted-foreground">{classes.length} classes</span>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {classes.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">No classes in this course.</p>
          ) : classes.map(cls => {
            const enrolled = isEnrolled(cls.id);
            return (
              <div key={cls.id} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm">{cls.name}</span>
                {enrolled ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Enrolled
                  </span>
                ) : (
                  <button
                    onClick={() => onAssign(course, cls)}
                    disabled={assigning === cls.id}
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                      'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                    )}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {assigning === cls.id ? '...' : 'Assign'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
