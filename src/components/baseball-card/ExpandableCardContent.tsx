import { useState, useRef, useEffect } from 'react';
import {
  Pencil, Plus, X, Trash2,
  Users, CheckSquare, FileText, Calendar, Tag,
  ChevronDown, Phone, ExternalLink, Download,
} from 'lucide-react';
import type {
  BaseballCardProject, Task, Note, ProjectLink, Person,
  ProjectStatus, MMATaskStatus,
} from '../../lib/baseball-card/types';
import { MMA_CONTRACT_REF_OPTIONS } from '../../lib/baseball-card/types';
import { MMAStatusBadge, VersionBadge } from './MMABadges';
import { InlineDropdown } from './InlineDropdown';

// ── Schedule health ───────────────────────────────────────────────────────────

export type ScheduleHealth = 'on-track' | 'slipping' | 'critical' | 'no-date';

export function computeScheduleHealth(targetDate: string | null | undefined, _tasks?: Task[]): ScheduleHealth {
  if (!targetDate) return 'no-date';
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const daysUntil = (target - now) / 86_400_000;
  if (daysUntil < 0) return 'critical';
  if (daysUntil <= 7) return 'slipping';
  return 'on-track';
}

export function ScheduleIndicator({ health, compact = false }: { health: ScheduleHealth; compact?: boolean }) {
  const config = {
    'on-track': { color: 'bg-emerald-500', label: 'On Track', textColor: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    'slipping':  { color: 'bg-amber-400',   label: 'Slipping',  textColor: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
    'critical':  { color: 'bg-red-500',     label: 'Off Track', textColor: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
    'no-date':   { color: 'bg-gray-300',    label: 'No Date',   textColor: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200' },
  }[health];

  if (compact) {
    return (
      <span
        className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${config.color}`}
        title={config.label}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${config.bg} ${config.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}

// ── Stakes badge ──────────────────────────────────────────────────────────────

const STAKES_OPTIONS = ['High', 'Medium', 'Low'] as const;
type Stakes = typeof STAKES_OPTIONS[number];

const STAKES_STYLES: Record<Stakes, string> = {
  High:   'bg-red-50 border-red-200 text-red-700',
  Medium: 'bg-amber-50 border-amber-200 text-amber-700',
  Low:    'bg-gray-50 border-gray-200 text-gray-600',
};

// ── Main component ────────────────────────────────────────────────────────────

interface ExpandableCardContentProps {
  project: BaseballCardProject;
  onUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  onRestore?: (id: string) => void;
}

export function ExpandableCardContent({ project, onUpdate, onPin, onDelete, readOnly, onRestore }: ExpandableCardContentProps) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(project.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const scheduleHealth = computeScheduleHealth(project.target_date, project.tasks);

  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  function saveDesc() {
    if (descValue !== project.description) onUpdate(project.id, { description: descValue });
    setEditingDesc(false);
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 40;
      const imgH = (canvas.height / canvas.width) * imgW;
      if (imgH <= pageH - 40) {
        pdf.addImage(imgData, 'PNG', 20, 20, imgW, imgH);
      } else {
        // Multi-page
        let yOffset = 0;
        const pageImgH = pageH - 40;
        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 20, 20 - yOffset, imgW, imgH);
          yOffset += pageImgH;
        }
      }
      pdf.save(`${project.name.replace(/[^a-z0-9]/gi, '-')}-card.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Check console for details.');
    } finally {
      setExporting(false);
    }
  }

  // Stakes stored in tags as "stakes:High" etc.
  const stakeTag = project.tags.find(t => t.startsWith('stakes:'));
  const currentStakes: Stakes = (stakeTag?.replace('stakes:', '') as Stakes) ?? 'Medium';

  function setStakes(s: Stakes) {
    const newTags = project.tags.filter(t => !t.startsWith('stakes:')).concat(`stakes:${s}`);
    onUpdate(project.id, { tags: newTags });
  }

  const contractRef = project.mma_contract_ref;

  if (readOnly) {
    return (
      <div className="space-y-4 border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>
        {project.description && (
          <Section icon={<FileText className="h-4 w-4" />} title="Description">
            <p className="text-sm leading-relaxed text-gray-600">{project.description}</p>
          </Section>
        )}
        <RACISection people={project.people} accountable={project.mma_accountable} readOnly />
        {onRestore && (
          <button onClick={() => onRestore(project.id)} className="rounded-md bg-mma-dark-blue px-3 py-1.5 text-sm text-white hover:bg-mma-blue transition-colors">
            Restore to Active
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={cardRef} className="space-y-4 border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>

      {/* ── Header row: schedule indicator + % complete + PDF ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScheduleIndicator health={scheduleHealth} />
          <StatusRollupBadge tasks={project.tasks} />
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
          title="Export card as PDF"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exporting…' : 'PDF'}
        </button>
      </div>

      {/* ── Single badge row (no duplicate) ── */}
      <div className="flex flex-wrap items-center gap-2">
        <VersionBadge version={project.mma_version} onChange={v => onUpdate(project.id, { mma_version: v })} />
        <MMAStatusBadge status={project.mma_status} onChange={(s: MMATaskStatus) => onUpdate(project.id, { mma_status: s })} />

        {/* Contract Element */}
        <InlineDropdown
          options={MMA_CONTRACT_REF_OPTIONS as unknown as readonly string[]}
          value={contractRef || 'TBD'}
          onChange={c => onUpdate(project.id, { mma_contract_ref: c })}
        >
          <span className="inline-flex cursor-pointer items-center rounded-full border border-[#8246AF]/20 bg-[#8246AF]/10 px-2 py-0.5 text-xs font-medium text-[#8246AF] hover:opacity-80">
            {contractRef || 'Contract TBD'}
          </span>
        </InlineDropdown>

        {/* Stakes */}
        <InlineDropdown
          options={STAKES_OPTIONS as unknown as readonly string[]}
          value={currentStakes}
          onChange={s => setStakes(s as Stakes)}
        >
          <span className={`inline-flex cursor-pointer items-center rounded-full border px-2 py-0.5 text-xs font-medium hover:opacity-80 ${STAKES_STYLES[currentStakes]}`}>
            ⚡ {currentStakes} Stakes
          </span>
        </InlineDropdown>

        {/* Status */}
        <select
          value={project.status}
          onChange={e => onUpdate(project.id, { status: e.target.value as ProjectStatus })}
          className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="pencils_down">Pencils Down</option>
          <option value="on_hold">On Hold</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* ── Description ── */}
      <Section icon={<FileText className="h-4 w-4" />} title="Description">
        {editingDesc ? (
          <div>
            <textarea
              ref={descRef}
              value={descValue}
              onChange={e => setDescValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setDescValue(project.description); setEditingDesc(false); } }}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            />
            <div className="mt-1 flex gap-2">
              <button onClick={saveDesc} className="text-xs text-gray-500 hover:text-gray-700">Save</button>
              <button onClick={() => { setDescValue(project.description); setEditingDesc(false); }} className="text-xs text-gray-400">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="group/desc cursor-pointer" onClick={() => { setDescValue(project.description); setEditingDesc(true); }}>
            {project.description
              ? <p className="text-sm leading-relaxed text-gray-600">{project.description} <Pencil className="ml-1 inline h-3 w-3 text-gray-300 opacity-0 group-hover/desc:opacity-100" /></p>
              : <p className="text-sm italic text-gray-400">Add a description...</p>}
          </div>
        )}
      </Section>

      {/* ── RACI + Dates (2-col) ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RACISection
          people={project.people}
          accountable={project.mma_accountable}
          onPeopleChange={people => onUpdate(project.id, { people })}
        />
        <Section icon={<Calendar className="h-4 w-4" />} title="Dates & Timing">
          <div className="space-y-2">
            <EditableField label="Start Date" value={project.start_date || ''} type="date" onSave={v => onUpdate(project.id, { start_date: v || null })} />
            <EditableField label="Target Date" value={project.target_date || ''} type="date" onSave={v => onUpdate(project.id, { target_date: v || null })} />
            <EditableField label="Est. Turn Time" value={project.mma_estimated_turn_time} onSave={v => onUpdate(project.id, { mma_estimated_turn_time: v })} />
          </div>
        </Section>
      </div>

      {/* ── Tasks (full width, scrollable Monday-style board) ── */}
      <TasksSection tasks={project.tasks} onChange={tasks => onUpdate(project.id, { tasks })} />

      {/* ── Resources + Notes (2-col) ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResourcesSection links={project.links} onChange={links => onUpdate(project.id, { links })} />
        <NotesSection notes={project.notes} onChange={notes => onUpdate(project.id, { notes })} />
      </div>

      {/* ── Call Log (collapsible, Granola-fed) ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          className="flex w-full items-center gap-2 px-4 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-xl"
          onClick={() => setShowCallLog(v => !v)}
        >
          <Phone className="h-4 w-4" />
          Call Log
          <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">Granola</span>
          <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${showCallLog ? 'rotate-180' : ''}`} />
        </button>
        {showCallLog && (
          <div className="border-t border-gray-100 px-4 pb-4">
            <CallLog activity={project.activity ?? []} />
          </div>
        )}
      </div>

      {/* ── Tags ── */}
      <Section icon={<Tag className="h-4 w-4" />} title="Tags">
        <TagsEditor
          tags={project.tags.filter(t => !t.startsWith('stakes:'))}
          onChange={tags => {
            const stakesTag = project.tags.filter(t => t.startsWith('stakes:'));
            onUpdate(project.id, { tags: [...stakesTag, ...tags] });
          }}
        />
      </Section>

      {/* ── Pin + Delete ── */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <button onClick={() => onPin(project.id)} className="text-sm text-gray-400 hover:text-amber-500">
          {project.pinned ? 'Unpin from Spotlight' : 'Pin to Spotlight'}
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Are you sure?</span>
            <button onClick={() => onDelete(project.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

// ── RACI Section ──────────────────────────────────────────────────────────────

const RACI_ROLES = ['Responsible', 'Accountable', 'Contribute', 'Informed'] as const;
type RACIRole = typeof RACI_ROLES[number];

const RACI_COLORS: Record<RACIRole, string> = {
  Responsible: 'bg-[#224057] text-white',
  Accountable: 'bg-[#F8C762] text-[#224057]',
  Contribute:  'bg-[#234D8B]/10 text-[#234D8B]',
  Informed:    'bg-gray-100 text-gray-500',
};

function RACISection({
  people, accountable, readOnly = false,
  onPeopleChange,
}: {
  people: Person[];
  accountable: string;
  readOnly?: boolean;
  onPeopleChange?: (p: Person[]) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<RACIRole>('Responsible');

  // Group by role
  const byRole: Record<string, Person[]> = {};
  for (const p of people) {
    const r = p.role || 'Contribute';
    (byRole[r] ??= []).push(p);
  }

  function addPerson() {
    if (!name.trim() || !onPeopleChange) return;
    const person: Person = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      name: name.trim(),
      role,
    };
    onPeopleChange([...people, person]);
    setName('');
  }

  function removePerson(id: string) {
    onPeopleChange?.(people.filter(p => p.id !== id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Users className="h-4 w-4" />
        Team (RACI)
      </div>

      <div className="space-y-2">
        {RACI_ROLES.map(r => {
          const members = byRole[r] ?? [];
          // Also show accountable field for Responsible row header
          return (
            <div key={r}>
              <div className="mb-1 flex items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${RACI_COLORS[r]}`}>{r[0]}</span>
                <span className="text-xs font-medium text-gray-500">{r}</span>
              </div>
              <div className="flex flex-wrap gap-1 pl-5">
                {r === 'Accountable' && accountable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F8C762]/20 px-2 py-0.5 text-xs font-medium text-[#224057]">
                    {accountable}
                  </span>
                )}
                {members.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {p.name}
                    {!readOnly && (
                      <button onClick={() => removePerson(p.id)} className="text-gray-300 hover:text-red-400">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))}
                {members.length === 0 && r !== 'Accountable' && (
                  <span className="text-xs italic text-gray-300">None</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
            placeholder="Name"
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as RACIRole)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none"
          >
            {RACI_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={addPerson} className="rounded p-1 text-gray-400 hover:text-gray-600">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tasks (Monday-style board, scrollable) ────────────────────────────────────

function TasksSection({ tasks, onChange }: { tasks: Task[]; onChange: (t: Task[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ task_name: '', description: '', assigned_to: '', start_date: '', due_date: '' });

  function addTask() {
    if (!form.task_name.trim()) return;
    const task: Task = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      text: form.task_name.trim(),
      task_name: form.task_name.trim(),
      description: form.description.trim(),
      assigned_to: form.assigned_to.trim(),
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      done: false,
      created_at: new Date().toISOString(),
    };
    onChange([...tasks, task]);
    setForm({ task_name: '', description: '', assigned_to: '', start_date: '', due_date: '' });
    setShowForm(false);
  }

  function toggleDone(id: string) {
    onChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function removeTask(id: string) {
    onChange(tasks.filter(t => t.id !== id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <CheckSquare className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tasks</span>
        <span className="ml-auto text-[10px] text-gray-300">{tasks.filter(t => t.done).length}/{tasks.length} done</span>
      </div>

      {/* Scrollable task list */}
      <div className="max-h-72 overflow-y-auto px-4 py-2">
        {tasks.length === 0 && !showForm && (
          <p className="py-4 text-center text-xs italic text-gray-300">No tasks yet — add from Monday.com or below</p>
        )}

        {/* Column headers */}
        {tasks.length > 0 && (
          <div className="mb-1 grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-gray-100 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
            <span>Task</span>
            <span className="w-20 text-center">Responsible</span>
            <span className="w-20 text-center">Start</span>
            <span className="w-20 text-center">Due</span>
          </div>
        )}

        {tasks.map(task => (
          <div
            key={task.id}
            className="group/task border-b border-gray-50 py-2 last:border-0"
          >
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-start gap-2">
              {/* Name + description */}
              <div className="flex items-start gap-2 min-w-0">
                <button
                  onClick={() => toggleDone(task.id)}
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors ${task.done ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-[#224057]'}`}
                  title={task.done ? 'Mark incomplete' : 'Mark complete'}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-tight ${task.done ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                    {task.task_name || task.text}
                  </p>
                  {task.description && (
                    <p className="mt-0.5 text-xs text-gray-400">{task.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeTask(task.id)}
                  className="shrink-0 text-gray-200 opacity-0 hover:text-red-400 group-hover/task:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Responsible */}
              <span className="w-20 truncate text-center text-xs text-gray-500">
                {task.assigned_to || <span className="text-gray-200">—</span>}
              </span>

              {/* Start date */}
              <span className="w-20 text-center text-xs text-gray-400">
                {task.start_date ? formatDate(task.start_date) : <span className="text-gray-200">—</span>}
              </span>

              {/* Due date */}
              <span className={`w-20 text-center text-xs font-medium ${getDueDateClass(task.due_date, task.done)}`}>
                {task.due_date ? formatDate(task.due_date) : <span className="text-gray-200 font-normal">—</span>}
              </span>
            </div>
          </div>
        ))}

        {/* Add task form */}
        {showForm && (
          <div className="mt-2 rounded-lg border border-dashed border-gray-300 p-3 space-y-2">
            <input
              autoFocus
              value={form.task_name}
              onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))}
              placeholder="Task name *"
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
            />
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description (optional)"
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                placeholder="Responsible"
                className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
              />
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={addTask} className="rounded bg-[#224057] px-3 py-1 text-xs text-white hover:bg-[#234D8B]">Add Task</button>
              <button onClick={() => { setShowForm(false); setForm({ task_name: '', description: '', assigned_to: '', start_date: '', due_date: '' }); }} className="text-xs text-gray-400">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Add task button */}
      {!showForm && (
        <div className="border-t border-gray-100 px-4 py-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>
        </div>
      )}
    </div>
  );
}

// ── Resources (formerly Links) ────────────────────────────────────────────────

const RESOURCE_TYPES = ['Doc', 'Data File', 'Slack Thread', 'Report', 'Link'] as const;
type ResourceType = typeof RESOURCE_TYPES[number];

const RESOURCE_TYPE_STYLES: Record<ResourceType, string> = {
  Doc:           'bg-blue-50 text-blue-600',
  'Data File':   'bg-purple-50 text-purple-600',
  'Slack Thread': 'bg-green-50 text-green-700',
  Report:        'bg-amber-50 text-amber-700',
  Link:          'bg-gray-100 text-gray-500',
};

function ResourcesSection({ links, onChange }: { links: ProjectLink[]; onChange: (l: ProjectLink[]) => void }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('Link');

  function addLink() {
    if (!url.trim()) return;
    let autoLabel = label.trim();
    if (!autoLabel) {
      try { autoLabel = new URL(url.trim()).hostname; } catch { autoLabel = url.trim(); }
    }
    const link: ProjectLink = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      url: url.trim(),
      label: `[${resourceType}] ${autoLabel}`,
      created_at: new Date().toISOString(),
    };
    onChange([...links, link]);
    setUrl(''); setLabel('');
  }

  function parseLabel(raw: string): { type: ResourceType; label: string } {
    const match = raw.match(/^\[([^\]]+)\]\s*(.+)$/);
    if (match && RESOURCE_TYPES.includes(match[1] as ResourceType)) {
      return { type: match[1] as ResourceType, label: match[2] };
    }
    return { type: 'Link', label: raw };
  }

  return (
    <Section icon={<ExternalLink className="h-4 w-4" />} title="Resources">
      <div className="space-y-1.5">
        {links.map(link => {
          const { type, label: lbl } = parseLabel(link.label);
          return (
            <div key={link.id} className="group/link flex items-center gap-2">
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${RESOURCE_TYPE_STYLES[type]}`}>{type}</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-[#234D8B] hover:underline">{lbl}</a>
              <button onClick={() => onChange(links.filter(l => l.id !== link.id))} className="ml-auto shrink-0 text-gray-300 opacity-0 hover:text-red-400 group-hover/link:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 pt-1">
          <select value={resourceType} onChange={e => setResourceType(e.target.value as ResourceType)}
            className="rounded-lg border border-gray-200 px-1.5 py-1 text-xs focus:outline-none">
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
            placeholder="URL" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none" />
          <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
            placeholder="Label" className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none" />
          <button onClick={addLink} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </Section>
  );
}

// ── Notes ─────────────────────────────────────────────────────────────────────

function NotesSection({ notes, onChange }: { notes: Note[]; onChange: (n: Note[]) => void }) {
  const [text, setText] = useState('');

  function addNote() {
    if (!text.trim()) return;
    onChange([{ id: crypto.randomUUID?.() ?? Date.now().toString(36), text: text.trim(), created_at: new Date().toISOString() }, ...notes]);
    setText('');
  }

  return (
    <Section icon={<FileText className="h-4 w-4" />} title="Notes">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }}
            placeholder="Add a note..." className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none" />
          <button onClick={addNote} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-3.5 w-3.5" /></button>
        </div>
        <div className="max-h-40 space-y-1.5 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className="group/note rounded-lg bg-gray-50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-gray-700">{note.text}</p>
                <button onClick={() => onChange(notes.filter(n => n.id !== note.id))} className="shrink-0 text-gray-300 opacity-0 hover:text-red-400 group-hover/note:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <span className="mt-0.5 block text-[10px] text-gray-400">{new Date(note.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Call Log (Granola-fed) ────────────────────────────────────────────────────

function CallLog({ activity }: { activity: import('../../lib/baseball-card/types').ActivityEvent[] }) {
  const calls = activity.filter(e => e.event_type === 'call_log' || e.event_type === 'granola');

  if (calls.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-gray-400 italic">No call notes yet.</p>
        <p className="mt-0.5 text-[10px] text-gray-300">Granola call summaries will appear here automatically.</p>
      </div>
    );
  }

  return (
    <ul className="mt-2 space-y-3">
      {calls.map(event => (
        <li key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-[#234D8B]" />
            <span className="text-xs font-medium text-gray-700">{event.description.split('\n')[0]}</span>
            <span className="ml-auto text-[10px] text-gray-400">{new Date(event.created_at).toLocaleDateString()}</span>
          </div>
          {event.description.includes('\n') && (
            <p className="mt-1.5 pl-5 text-xs leading-relaxed text-gray-500">{event.description.split('\n').slice(1).join('\n')}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

// ── Tags ──────────────────────────────────────────────────────────────────────

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [newTag, setNewTag] = useState('');

  function addTag() {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setNewTag('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-red-400"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
          placeholder="Add tag..." className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none" />
        <button onClick={addTag} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function EditableField({ label, value, type = 'text', onSave }: { label: string; value: string; type?: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function save() {
    if (inputValue !== value) onSave(inputValue);
    setEditing(false);
  }

  function formatDisplay(v: string) {
    if (!v) return 'Not set';
    if (type === 'date' && /^\d{4}/.test(v)) {
      try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return v; }
    }
    return v;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      {editing ? (
        <input ref={inputRef} type={type} value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setInputValue(value); setEditing(false); } }}
          className="w-32 border-b border-[#234D8B] bg-transparent text-right text-sm text-gray-700 focus:outline-none"
        />
      ) : (
        <span className="group/field cursor-pointer text-sm text-gray-700" onClick={() => { setInputValue(value); setEditing(true); }}>
          {formatDisplay(value)}
          <Pencil className="ml-1 inline h-3 w-3 text-gray-300 opacity-0 group-hover/field:opacity-100" />
        </span>
      )}
    </div>
  );
}

function getDueDateClass(dueDate: string | null | undefined, done: boolean): string {
  if (!dueDate || done) return 'text-gray-400';
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  if (due < now) return 'text-red-500';
  if (due - now <= 3 * 86_400_000) return 'text-amber-500';
  return 'text-gray-400';
}

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}


